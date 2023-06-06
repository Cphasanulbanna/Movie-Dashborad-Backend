//model
const User = require("../models/userModel");

//functions
const { generatePasswordHash } = require("../utils/bcrypt");

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
module.exports = { signup };
