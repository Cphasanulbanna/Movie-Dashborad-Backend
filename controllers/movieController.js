//models
const Movie = require("../models/movieModel");

const addMovie = async (req, res) => {
    try {
        const { name, year, rating, leadActor, genre } = req.body;
        const poster = req.file.filename;
        const isExists = await Movie.findOne({ name: name });
        if (isExists) {
            return res.status(400).json({ message: "movie with this title already exists" });
        }

        const newMovie = {
            name: name,
            year: year,
            rating: rating,
            leadActor: leadActor,
            genre: genre,
            poster: poster,
        };

        const movie = await Movie.create(newMovie);
        res.status(201).json({ message: "added new movie", movie: movie });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

const fetchMovies = async (req, res) => {
    try {
        const movies = await Movie.find();
        if()
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = { addMovie };
