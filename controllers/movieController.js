//models
const Movie = require("../models/movieModel");

const path = require("path");
const fs = require("fs");

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
        console.log(error);
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
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

const editMovie = async (req, res) => {
    try {
        const { name, year, rating, leadActor, genre, _id } = req.body;

        const newPoster = req.file.filename;
        const movie = await Movie.findById(_id);
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        if (newPoster) {
            const baseURL = `${req.protocol}://${req.get("host")}/images/`;
            const oldPoster = movie.poster;
            const exactpath = oldPoster.replace(baseURL, "");
            const imagePath = path.join(__dirname, "..", "public", "images", exactpath);

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }

            const newPosterPath = baseURL + newPoster;
            movie.poster = newPosterPath;
        }

        if (name) {
            movie.name = name;
        }
        if (year) {
            movie.year = year;
        }
        movie.rating = rating;
        movie.leadActor = leadActor;
        movie.genre = genre;

        const updatedMovie = await movie.save();
        res.status(200).json({ message: "Movie updated successfully", movie: updatedMovie });
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

module.exports = { addMovie, fetchMovies, editMovie };
