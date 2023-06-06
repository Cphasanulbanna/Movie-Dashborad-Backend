//model
const User = require("../models/userModel");

//functions
const { generatePasswordHash, comparePassword } = require("../utils/bcrypt");
const { generateAccessToken } = require("../utils/jwt");

const signup = async (req, res) => {
    try {
        const { username, password } = req.body;
        const profilePhoto = req.file.filename;
        const baseURL = `${req.protocol}://${req.get("host")}/images/`;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and Password is required" });
        }
        const isExists = await User.findOne({ username: username });
        if (isExists) {
            return res.status(400).json({ message: "AA user aalready exists with this username" });
        }

        const imagePath = baseURL + profilePhoto;
        const hashedPaassword = await generatePasswordHash(password);
        await User.create({
            username: username,
            password: hashedPaassword,
            profilePic: imagePath,
        });

        return res.status(201).json({ message: "Account created successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "Username and Password is required" });
        }
        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        const validPassword = await comparePassword(password, user.password);
        if (!validPassword) {
            return res.status(404).json({ message: "Invalid password" });
        }

        const accessToken = generateAccessToken(user._id);
        res.status(200).json({
            message: "Login success",
            _id: user.id,
            username: user.username,
            access_token: accessToken,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
module.exports = { signup };
