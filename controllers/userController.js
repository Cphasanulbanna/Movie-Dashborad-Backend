//model
const User = require("../models/userModel");

//packages
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const consola = require("consola");
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
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const login = async (req, res) => {
    consola.log(req.body.email, "email----------");
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "email and Password is required", StatusCode: 6001 });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ message: "User not found", StatusCode: 6001 });
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
            _id: user.id,
            username: user.username,
            email: user.email,
            profile_pic: user.profilePic,
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    } catch (error) {
        consola.log(error);
        res.status(400).json({ message: error.message, StatusCode: 6001 });
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

        console.log(username, "username");
        const templatePath = path.join(__dirname, "../mail-template/forget-password.html");
        const template = fs.readFileSync(templatePath, "utf-8");
        let emailContent = template
            .replace("{{generatedotp}}", generatedOTP)
            .replace("{{username}}", username);

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
                consola.error(error.message);
            } else {
                consola.log("Server is ready to take our messages");
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
                return res.status(400).json({ message: error.message });
            }
            return res.status(200).json({ StatusCode: 6000, message: `OTP sent to ${email}` });
        });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp, email } = req.body;

        if (!otp) {
            return res.status(400).json({ message: "OTP is required", StatusCode: 6001 });
        }

        const user = await User.findOne({ email: email });

        // Compare the user-entered OTP with the stored OTP in the session

        // consola.error(otp, "user enetered otp-----------------");
        // consola.error(user.otp, "stored otp++++++++++++++++++++");

        if (otp !== user.otp.otp) {
            return res.status(400).json({ message: "Invalid OTP", StatusCode: 6001 });
        }

        // req.session.otpVerified = true;

        res.status(200).json({ StatusCode: 6000, message: "OTP Verified" });
        user.otp = {
            otp: "",
            otp_verified: true,
        };
        await user.save();
        // req.session.generatedOTP = null;
    } catch (error) {
        res.status(500).json({ message: error.message, StatusCode: 6001 });
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
        return res.status(500).json({ message: error.message, StatusCode: 6001 });
    }
};

const refreshToken = async (req, res) => {
    try {
        //verify current refresh token sent from frontend
        const userId = verifyRefreshToken(req.cookies.refreshToken);

        consola.log(req.cookies.refreshToken, "cookies*************");
        consola.log(userId, "refresh token+++++++++++++");
        // const userId = verifyRefreshToken(req.body.refresh_token);

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
        return res.status(500).json({ message: error.message, StatusCode: 6001 });
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
};
