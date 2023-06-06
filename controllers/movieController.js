//modules
const path = require("path");
const fs = require("fs");

//models
const Movie = require("../models/movieModel");

const addMovie = async (req, res) => {
    try {
        const { name, year, rating, leadActor, genre } = req.body;
        const poster = req.file.filename;
        const existingMovie = await Movie.findOne({ name: name });
        if (existingMovie) {
            //removing imaage from device
            const baseURL = `${req.protocol}://${req.get("host")}/images/`;
            const oldPoster = existingMovie.poster;
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
            return res.status(400).json({ message: "movie with this title already exists" });
        }
        const baseURL = `${req.protocol}://${req.get("host")}/images/`;
        const posterPath = baseURL + poster;

        const newMovie = {
            name: name,
            year: year,
            rating: rating,
            leadActor: leadActor,
            poster: posterPath,
            genre: genre,
        };

        const movie = await Movie.create(newMovie);
        console.log(movie, "----------------------------------------");
        res.status(201).json({ message: "added new movie", movie: movie });
    } catch (error) {
        // console.log(error, "**************************************************");
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

const fetchMoviesWithGenre = async (req, res) => {
    try {
        const movies = await Movie.find()
            .where("genre")
            .ne([])
            .select("name year rating poster leadActor genre")
            .populate("genre");

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
        const { name, year, rating, leadActor, _id } = req.body;

        const newPoster = req.file.filename;
        const movie = await Movie.findByIdAndUpdate(_id);
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        if (newPoster) {
            //removing imaage from device
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

            //updating image in db
            const newPosterPath = baseURL + newPoster;
            movie.poster = newPosterPath;
        }

        //updating movie
        Object.assign(movie, {
            name: name || movie.name,
            year: year || movie.year,
            rating: rating || movie.rating,
            leadActor: leadActor || movie.leadActor,
        });

        await movie.save();
        res.status(200).json({ message: "Movie updated successfully", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addGenreToMovie = async (req, res) => {
    try {
        const { genreId, _id } = req.body;

        const movie = await Movie.findByIdAndUpdate(
            _id,
            { $addToSet: { genre: genreId } },
            { new: true }
        );
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        await movie.save();
        res.status(200).json({ message: "new genre added successfully", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const removeGenreFromMovie = async (req, res) => {
    try {
        const { genreId, _id } = req.body;
        if (!_id) {
            return res.status(400).json({ message: "Id of movie is required" });
        }
        if (!genreId) {
            return res.status(400).json({ message: "Id of genre is required" });
        }

        const movie = await Movie.findByIdAndUpdate(
            _id,
            { $pull: { genre: genreId } },
            { new: true }
        );
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        await movie.save();
        res.status(200).json({ message: "removed genre successfully", movie: movie });
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
        //deleting from db
        await Movie.findByIdAndDelete(_id);

        //deleting from device
        const baseURL = `${req.protocol}://${req.get("host")}/images/`;
        const poster = movie.poster;
        const movieFilename = poster.replace(baseURL, "");
        const posterLocationInSystem = path.join(
            __dirname,
            "..",
            "public",
            "images",
            movieFilename
        );
        if (fs.existsSync(posterLocationInSystem)) {
            fs.unlinkSync(posterLocationInSystem);
        }

        res.status(200).json({ message: "movie deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    addMovie,
    fetchMovies,
    editMovie,
    deleteMovie,
    addGenreToMovie,
    removeGenreFromMovie,
    fetchMoviesWithGenre,
};
