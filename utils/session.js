const session = require("express-session");

const sessionMiddleware = session({
    secret: "123456",
    resave: false,
    saveUninitialized: false,
});

module.exports = sessionMiddleware;
