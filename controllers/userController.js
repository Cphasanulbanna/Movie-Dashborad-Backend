//model
const User = require("../models/userModel");

//functions
const { generatePasswordHash, comparePassword } = require("../utils/bcrypt");
const { generateAccessToken } = require("../utils/jwt");

const signup = async (req, res) => {
    try {
        const { username, password } = req.body;
        const baseURL = `${req.protocol}://${req.get("host")}/images/`;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and Password is required" });
        }
        const isExists = await User.findOne({ username: username });
        if (isExists) {
            return res.status(400).json({ message: "A user aalready exists with this username" });
        }

        const hashedPaassword = await generatePasswordHash(password);

        const newUser = {
            username: username,
            password: hashedPaassword,
        };

        if (req.file) {
            const imagePath = baseURL + req.file.filename;
            newUser.profilePic = imagePath;
        }

        await User.create(newUser);

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
            profile_pic: user.profilePic,
            access_token: accessToken,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
module.exports = { signup, login };
