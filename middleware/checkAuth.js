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
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Access denied: Invalid token" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { checkAuth };
