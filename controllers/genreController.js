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

const fetchAllGenres = async (req, res) => {
    try {
        const genres = await Genre.find();
        if (!genres.length) {
            return res.status(404).json({ message: "Genres not found" });
        }
        return res.status(200).json({ message: "Success", genres: genres });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const editGenre = async (req, res) => {
    try {
        const { _id, title } = req.body;
        if (!_id) {
            return res.status(404).json({ message: "Genre id is reqquired" });
        }
        if (!title) {
            return res.status(404).json({ message: "Genre name is reqquired" });
        }

        const genre = await Genre.findByIdAndUpdate(_id);
        if (!genre) {
            return res.status(404).json({ message: "Genre not found" });
        }
        const updatedGenre = (genre.title = title);
        await genre.save();
        return res.status(200).json({ message: "Success", genre: updatedGenre });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { addGenre, fetchAllGenres, editGenre };
