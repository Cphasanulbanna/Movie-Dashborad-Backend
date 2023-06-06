const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            minLength: 2,
            required: true,
        },
        year: {
            type: Number,
            required: true,
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
