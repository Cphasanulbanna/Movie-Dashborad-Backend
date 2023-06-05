const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: true,
    },
});

module.exports = mongoose.model("Genre", genreSchema);
