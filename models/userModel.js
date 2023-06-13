const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            minLenght: 2,
        },
        password: {
            type: String,
            required: true,
            minLenght: 6,
        },
        profilePic: {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
