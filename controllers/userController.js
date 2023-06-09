//model
const User = require("../models/userModel");
const Movie = require("../models/movieModel");

//packages
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

//functions
const { generatePasswordHash, comparePassword } = require("../utils/bcrypt");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { generateOtp } = require("../utils/generateOTP");

const signup = async (req, res) => {
    try {
        const file = req?.files?.profilePic;
        if (!file) {
            return res.status(400).json({
                message: "profile-picture is required",
                StatusCode: 6001,
            });
        }
        const profilePicture = await cloudinary.v2.uploader.upload(file?.tempFilePath, {
            folder: "movie-dashboard/profile-picture",
        });

        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({
                message: "Username, email, profile-picture and Password is required",
                StatusCode: 6001,
            });
        }
        const isExists = await User.findOne({ email: email });
        if (isExists) {
            return res
                .status(400)
                .json({ message: "A user aalready exists with this username", StatusCode: 6001 });
        }

        const hashedPaassword = await generatePasswordHash(password);

        const newUser = {
            email: email,
            username: username,
            password: hashedPaassword,
            profilePic: {
                public_id: profilePicture.public_id,
                url: profilePicture.secure_url,
            },
        };

        // Delete the temporary file
        fs.unlinkSync(file.tempFilePath);

        await User.create(newUser);

        return res.status(201).json({ message: "Account created successfully", StatusCode: 6000 });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong", StatusCode: 6001 });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "email and Password is required", StatusCode: 6001 });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "User not found", StatusCode: 6001 });
        }

        const validPassword = await comparePassword(password, user.password);
        if (!validPassword) {
            return res.status(404).json({ message: "Invalid password", StatusCode: 6001 });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.status(200).json({
            StatusCode: 6000,
            message: "Login success",
            id: user.id,
            role: user.role,
            username: user.username,
            email: user.email,
            profile_pic: user.profilePic,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong", StatusCode: 6001 });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("username email profilePic createdAt role");
        users.forEach((user) => {
            if (user.role === "Admin") {
                const index = user.email.indexOf("@");
                const firstpart = user.email.slice(0, index);

                const editedmail = `${user.email.replace(firstpart, "*******")}`;
                user.email = editedmail;
            }
        });
        return res.status(200).json({ message: "Success", users: users });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const generatedOTP = generateOtp();

        user.otp = {
            otp: generatedOTP,
            otp_verified: false,
        };
        await user.save();

        const username = user.username;

        const templatePath = path.join(__dirname, "../mail-template/reset-password-template.html");
        const template = fs.readFileSync(templatePath, "utf-8");
        let emailContent = template.replace("{{otp}}", generatedOTP);

        let transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SENDER_MAIL,
                pass: process.env.PASSWORD, // generated app password
            },
        });

        transporter.verify(function (error, success) {
            if (error) {
                console.error(error.message);
            } else {
                console.log("Server is ready to take our messages");
            }
        });

        let mailOptions = {
            from: process.env.SENDER_MAIL,
            to: email,
            subject: "Password Reset",
            html: emailContent,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(400).json({ message: "Something went wrong" });
            }
            return res.status(200).json({ StatusCode: 6000, message: `OTP sent to ${email}` });
        });
    } catch (error) {
        res.status(400).json({ message: "Something went wrong", StatusCode: 6001 });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp, email } = req.body;

        if (!otp) {
            return res.status(400).json({ message: "OTP is required", StatusCode: 6001 });
        }

        const user = await User.findOne({ email: email });

        if (otp !== user.otp.otp) {
            return res.status(400).json({ message: "Invalid OTP", StatusCode: 6001 });
        }

        res.status(200).json({ StatusCode: 6000, message: "OTP Verified" });
        user.otp = {
            otp: "",
            otp_verified: true,
        };
        await user.save();
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", StatusCode: 6001 });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email & Password is required" });
        }

        const passwordHash = await generatePasswordHash(password);
        const user = await User.findOne({ email: email });

        const otpVerified = user.otp.otp_verified;
        if (otpVerified) {
            user.password = passwordHash;
            user.otp = {
                otp: "",
                otp_verified: false,
            };
            await user.save();
            return res
                .status(200)
                .json({ StatusCode: 6000, message: "Password changed successfully!" });
        } else {
            return res.status(400).json({ message: "otp unverified" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong", StatusCode: 6001 });
    }
};

const refreshToken = async (req, res) => {
    try {
        //verify current refresh token sent from frontend
        const userId = verifyRefreshToken(req.cookies.refreshToken);

        if (!userId)
            return res.status(401).json({ StatusCode: 6001, message: "Refresh token expired" });

        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.json({ access_token: accessToken });
    } catch (error) {
        return res.status(500).json({ message: "Something went wrong", StatusCode: 6001 });
    }
};

const addToWatchLater = async (req, res) => {
    try {
        const { id, email } = req.body;
        if (!id) {
            return res.status(404).json({ message: "movie is is required" });
        }
        const user = await User.findOneAndUpdate(
            { email: email },
            { $push: { watchLaterMovies: id } },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: "Usser not fount" });
        }

        res.status(200).json({ message: "Movie added to watch later" });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getAllWatchLaterMovies = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(404).json({ message: "User ID not found" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const movieIds = user.watchLaterMovies;

        if (!movieIds.length) {
            return res.status(404).json({ message: "No movies found" });
        }

        const movies = await Movie.find({ _id: { $in: movieIds } }).populate("genre");
        res.status(200).json({ message: "Success", movies });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};
module.exports = {
    signup,
    login,
    getAllUsers,
    forgetPassword,
    verifyOtp,
    resetPassword,
    refreshToken,
    addToWatchLater,
    getAllWatchLaterMovies,
};
