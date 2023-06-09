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
        const genres = await Genre.find();
        res.status(201).json({ message: `added new genre: ${title}`, genres: genres });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

const deleteGenre = async (req, res) => {
    try {
        const { _id } = req.body;
        if (!_id) {
            return res.status(404).json({ message: "Genre id id required" });
        }
        const genre = await Genre.findByIdAndDelete(_id);
        res.status(200).json({ message: `genre: ${genre} deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

const fetchAllGenres = async (req, res) => {
    try {
        const genres = await Genre.find().sort({ title: "asc" });
        if (!genres.length) {
            return res.status(404).json({ message: "Genres not found" });
        }
        return res.status(200).json({ message: "Success", genres: genres });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
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
        genre.title = title;
        await genre.save();
        const genres = await Genre.find();

        return res.status(200).json({ message: "Success", genres: genres });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

module.exports = { addGenre, fetchAllGenres, editGenre, deleteGenre };
