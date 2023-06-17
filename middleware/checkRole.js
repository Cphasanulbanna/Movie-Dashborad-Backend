const User = require("../models/userModel");

const checkRole = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (user.role !== "Admin") {
            return res
                .status(401)
                .json({ message: "Unauthorized , only admin can access these routes" });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized , only admin can access these routes" });
    }
};

module.exports = { checkRole };
