const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            minLength: [2, "name should be minimum 2 chaaracter"],
            required: true,
        },
        year: {
            type: Number,
            min: 1,
        },
        poster: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        leadActor: {
            type: String,
        },
        description: {
            type: String,
            minLength: 10,
        },
        gallery: [
            {
                type: String,
            },
        ],
        genre: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Genre",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
