const bcrypt = require("bcrypt");

const SALT = 10;

const generatePasswordHash = (password) => {
    return bcrypt.hash(password, SALT);
};

module.exports = { generatePasswordHash };
