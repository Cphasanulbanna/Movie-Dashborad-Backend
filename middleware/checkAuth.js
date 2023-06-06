const jwt = require("jsonwebtoken");

const checkAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "Access denied" });
        }

        const tokenValid = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.userId = tokenValid._id;
        next();
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { checkAuth };
