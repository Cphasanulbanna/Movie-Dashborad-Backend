//models
const Genre = require("../models/genreModel");

const addGenre = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ message: "Field : title is required" });
        }
        const genre = await Genre.findOne({ title: title });
        if (genre) {
            return res.status(400).json({ message: "This genre is already added" });
        }
        await Genre.create({ title: title });
        res.status(201).json({ message: `added new genre: ${title}` });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { addGenre };
