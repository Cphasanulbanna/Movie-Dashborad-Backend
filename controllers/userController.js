//model
const User = require("../models/userModel");

const cloudinary = require("cloudinary");

//functions
const { generatePasswordHash, comparePassword } = require("../utils/bcrypt");
const { generateAccessToken } = require("../utils/jwt");

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
        res.status(200).json({
            StatusCode: 6000,
            message: "Login success",
            _id: user.id,
            username: user.username,
            email: user.email,
            profile_pic: user.profilePic,
            access_token: accessToken,
        });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("username email profilePic createdAt");
        return res.status(200).json({ message: "Success", users: users });
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};

const forgetPassword = async (req, res) => {
    try {
    } catch (error) {
        res.status(400).json({ message: error.message, StatusCode: 6001 });
    }
};
module.exports = { signup, login, getAllUsers };
