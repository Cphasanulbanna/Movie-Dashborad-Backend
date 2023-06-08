//modules
const path = require("path");
const fs = require("fs");

//models
const Movie = require("../models/movieModel");

const addMovie = async (req, res) => {
    try {
        const { name, year, rating, leadactor, genre } = req.body;
        if (!name || !req.file) {
            return res.status(400).json({ message: "Movie name & movie image is required" });
        }
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

        const newMovie = {
            name: name,
            year: year,
            rating: rating,
            leadactor: leadactor,
            genre: genre,
        };

        if (req.file) {
            const posterPath = baseURL + req.file.filename;
            newMovie.poster = posterPath;
        }

        const movie = await Movie.create(newMovie);
        res.status(201).json({ message: "added new movie", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const fetchMovies = async (req, res) => {
    try {
        const movies = await Movie.find().populate("genre");
        if (!movies.length) {
            return res.status(400).json({ message: "Movies not found!" });
        }
        res.status(200).json({ message: "Success", moviesList: movies });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const fetchSingleMovie = async (req, res) => {
    try {
        const _id = req.params;
        const movie = await Movie.findById(_id).populate("genre");
        if (!movie) {
            return res.status(400).json({ message: "Movie not found!" });
        }
        res.status(200).json({ message: "Success", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const fetchMoviesWithGenre = async (req, res) => {
    try {
        const movies = await Movie.find()
            .where("genre")
            .ne([])
            .select("name year rating poster leadactor genre")
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
        const { name, year, rating, leadactor, description, genreIds } = req.body;
        const { _id } = req.params;

        if (!_id) {
            return res.status(400).json({ message: "movie id is required" });
        }

        const movie = await Movie.findByIdAndUpdate(
            _id,
            _id,
            { $addToSet: { genre: { $each: genreIds } } },
            { new: true }
        );
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        if (req.file) {
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
            const newPosterPath = baseURL + req.file.filename;
            movie.poster = newPosterPath;
        }

        //updating movie
        Object.assign(movie, {
            name: name || movie.name,
            year: year || movie.year,
            rating: rating || movie.rating,
            leadactor: leadactor || movie.leadactor,
            description: description || movie.description,
            genre: genreIds || movie.genre,
        });

        await movie.save();
        res.status(200).json({ message: "Movie updated successfully", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const addGenreToMovie = async (req, res) => {
    try {
        const { genreIds, _id } = req.body;

        if (!genreIds || !_id) {
            return res.status(400).json({ message: "movie id & genre id's are required" });
        }

        const movie = await Movie.findByIdAndUpdate(
            _id,
            { $addToSet: { genre: { $each: genreIds } } },
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

const addGallery = async (req, res) => {
    try {
        const { _id } = req.body;
        const images = req.files;
        if (!_id) {
            return res.status(400).json({ message: "id of movie is required" });
        }
        if (!images) {
            return res.status(400).json({ message: "images not found" });
        }
        const movie = await Movie.findByIdAndUpdate(_id);
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }
        const baseURL = `${req.protocol}://${req.get("host")}/images/`;

        images.forEach((image) => {
            const imageURL = baseURL + image.filename;
            movie.gallery.push(imageURL);
        });
        await movie.save();
        res.status(200).json({ message: "Movie updated with gallery images", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteMovie = async (req, res) => {
    try {
        const { movieIds } = req.body;
        if (!movieIds || !Array.isArray(movieIds)) {
            return res.status(404).json({ message: "movie Ids is required" });
        }
        const movies = await Movie.find({ _id: { $in: movieIds } });
        if (!movies) {
            return res.status(404).json({ message: "Movies not found" });
        }
        //deleting from db
        await Movie.deleteMany({ _id: { $in: movieIds } });

        const baseURL = `${req.protocol}://${req.get("host")}/images/`;
        //deleting from device
        movies.forEach((movie) => {
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
        });

        res.status(200).json({ message: "movies deleted successfully" });
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
    addGallery,
    fetchSingleMovie,
};
