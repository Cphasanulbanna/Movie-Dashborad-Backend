const jwt = require("jsonwebtoken");

const checkAuth = (req, res, next) => {
    try {
        let token = req.headers.authorization;
        console.log(token);

        if (!token) {
            return res.status(401).json({ message: "Access denied" });
        }
        token = token.split(" ")[1];

        const tokenValid = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.userId = tokenValid._id;
        next();
    } catch (error) {
        console.log(error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Access denied: Invalid token" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { checkAuth };
