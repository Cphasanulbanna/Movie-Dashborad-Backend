//modules
const fs = require("fs");
const cloudinary = require("cloudinary");

//models
const Movie = require("../models/movieModel");

const addMovie = async (req, res) => {
    try {
        const { name, year, rating, leadactor, genre, description } = req.body;

        if (!name || !req.files) {
            return res.status(400).json({ message: "Movie name & movie image is required" });
        }
        const gerneArray = genre ? genre.split(",") : [];

        const file = req.files.poster;
        const moviePoster = await cloudinary.v2.uploader.upload(file.tempFilePath, {
            folder: "movie-dashboard/movie-poster",
        });

        const existingMovie = await Movie.findOne({ name: name });
        if (existingMovie) {
            return res.status(400).json({ message: "movie with this title already exists" });
        }

        const newPoster = { public_id: moviePoster.public_id, url: moviePoster.secure_url };
        const newMovie = {
            name: name,
            year: year ?? year,
            rating: rating ?? rating,
            leadactor: leadactor ?? leadactor,
            genre: genre ? gerneArray : [],
            poster: newPoster,
            description: description ?? description,
        };

        // Delete the temporary file
        fs.unlinkSync(file.tempFilePath);

        const movie = await Movie.create(newMovie);
        res.status(201).json({ message: "added new movie", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const fetchMovies = async (req, res) => {
    try {
        const q = req.query.q;
        const page = req.query.p || 0;
        const moviesPerPage = 6;

        const totalMovies = await Movie.countDocuments();
        const totalPages = Math.ceil(totalMovies / moviesPerPage);

        const paginatedData = await Movie.find()
            .populate("genre")
            .skip(page * moviesPerPage)
            .limit(moviesPerPage)
            .select("genre name poster year rating description leadactor");
        const regex = new RegExp(q, "i");
        if (q) {
            const movieCount = await Movie.find({ name: { $regex: regex } });
            const filteredMovies = await Movie.find({ name: { $regex: regex } })
                .populate("genre")
                .skip(page * moviesPerPage)
                .limit(moviesPerPage);

            const total = Math.ceil(movieCount.length / moviesPerPage);

            return res.status(200).json({
                message: "Success",
                moviesList: filteredMovies,
                total_movies: totalMovies,
                total_pages: total,
            });
        }

        if (!paginatedData.length) {
            return res.status(400).json({ message: "Movies not found!" });
        }

        res.status(200).json({
            message: "Success",
            moviesList: paginatedData,
            total_movies: totalMovies,
            total_pages: totalPages,
        });
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
        const { name, year, rating, leadactor, description, genre } = req.body;

        const gerneArray = genre.split(",");
        const { _id } = req.params;
        const files = req.files?.gallery;
        const file = req.files?.poster;

        if (!_id) {
            return res.status(400).json({ message: "movie id is required" });
        }

        const movie = await Movie.findById(_id);
        if (!movie) {
            return res.status(400).json({ message: "movie not found" });
        }

        if (req.files?.poster) {
            const moviePoster = await cloudinary.v2.uploader.upload(file.tempFilePath, {
                folder: "movie-dashboard/movie-poster",
            });

            const newPoster = { public_id: moviePoster.public_id, url: moviePoster.secure_url };
            movie.poster = newPoster ? newPoster : movie.poster;
        }

        if (req.files?.gallery) {
            const uploadPromise = files.map((file) => {
                return cloudinary.v2.uploader.upload(file.tempFilePath, {
                    folder: "movie-dashboard/movie-gallery",
                });
            });
            const uploadedImages = await Promise.all(uploadPromise);
            const galleryImages = uploadedImages.map((image) => {
                return {
                    publicId: image.public_id,
                    url: image.secure_url,
                };
            });
            movie.gallery = galleryImages ? galleryImages : movie.galleryImages;
        }

        //updating movie
        movie.name = name ? name : movie.name;
        movie.year = year ? year : movie.year;
        movie.rating = rating ? rating : movie.rating;
        movie.leadactor = leadactor ? leadactor : movie.leadactor;
        movie.description = description ? description : movie.description;
        movie.genre = genre ? gerneArray : [];

        if (file) {
            // Delete the temporary file
            fs.unlinkSync(file.tempFilePath);
        }

        await movie.save();
        res.status(200).json({ message: "Movie updated successfully", movie: movie });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteMovie = async (req, res) => {
    try {
        const { movieId } = req.body;
        if (!movieId) {
            return res.status(404).json({ message: "movie Id is required" });
        }
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found" });
        }
        //deleting from db
        await cloudinary.uploader.destroy(movie?.poster?.public_id);
        await Movie.findByIdAndDelete(movieId);

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
    fetchMoviesWithGenre,
    fetchSingleMovie,
};
