//model
const User = require("../models/userModel");

//functions
const { generatePasswordHash } = require("../utils/bcrypt");

const signup = async (req, res) => {
    try {
        const { username, password } = req.body;
        const profilePhoto = req.file;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and Password is required" });
        }
        const isExists = await User.findOne({ username: username });
        if (isExists) {
            return res.status(400).json({ message: "AA user aalready exists with this username" });
        }

        const hashedPaassword = await generatePasswordHash(password);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
module.exports = { signup };
