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
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 0,
        },
        leadactor: {
            type: String,
        },
        description: {
            type: String,
        },
        gallery: [
            {
                type: Object,
            },
        ],
        genre: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Genre",
                unique: true,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
