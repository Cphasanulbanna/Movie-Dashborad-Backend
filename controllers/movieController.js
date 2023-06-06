//modules
const path = require("path");
const fs = require("fs");

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
        const baseURL = `${req.protocol}://${req.get("host")}/images/`;
        const posterPath = baseURL + poster;

        const newMovie = {
            name: name,
            year: year,
            rating: rating,
            leadActor: leadActor,
            genre: genre,
            poster: posterPath,
        };

        const movie = await Movie.create(newMovie);
        res.status(201).json({ message: "added new movie", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const fetchMovies = async (req, res) => {
    try {
        const movies = await Movie.find();
        if (!movies.length) {
            return res.status(400).json({ message: "Movies not found!" });
        }
        res.status(200).json({ message: "Success", moviesList: movies });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const editMovie = async (req, res) => {
    try {
        const { name, year, rating, leadActor, genre, _id } = req.body;

        const newPoster = req.file.filename;
        const movie = await Movie.findByIdAndUpdate(_id);
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        if (newPoster) {
            const baseURL = `${req.protocol}://${req.get("host")}/images/`;
            const oldPoster = movie.poster;
            const oldPosterFilename = oldPoster.replace(baseURL, "");
            const oldPosterLocationInSystem = path.join(
                __dirname,
                "..",
                "public",
                "images",
                oldPosterFilename
            );

            if (fs.existsSync(oldPosterLocationInSystem)) {
                fs.unlinkSync(oldPosterLocationInSystem);
            }

            const newPosterPath = baseURL + newPoster;
            movie.poster = newPosterPath;
        }

        Object.assign(movie, {
            name: name || movie.name,
            year: year || movie.year,
            rating: rating || movie.rating,
            leadActor: leadActor || movie.leadActor,
            genre: genre || movie.genre,
        });

        await movie.save();
        res.status(200).json({ message: "Movie updated successfully", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteMovie = async (req, res) => {
    try {
        const { _id } = req.body;
        const movie = await Movie.findById(_id);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        await Movie.findByIdAndDelete(_id);
        res.status(200).json({ message: "movie deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { addMovie, fetchMovies, editMovie, deleteMovie };
