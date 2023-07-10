//modules
const fs = require("fs");
const cloudinary = require("cloudinary");

//models
const Movie = require("../models/movieModel");
const Genre = require("../models/genreModel");

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
        res.status(500).json({ message: "Something went wrong" });
    }
};

const fetchMovies = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) - 1 || 0;
        const limit = parseInt(req.query.limit) || 6;
        let genre = req.query.genre || "All";
        let rating = req.query.rating || "All";

        const genres = await Genre.find().select("title _id");
        const genreIds = genres.map((genre) => genre._id);

        genre === "All" ? (genre = [...genreIds]) : (genre = req.query.genre.split(","));
        rating === "All"
            ? (rating = [1, 2, 3, 4, 5, "", null])
            : (rating = req.query.rating.split(","));

        const movies = await Movie.find({ name: { $regex: search, $options: "i" } })
            .where("rating")
            .in([...rating])
            .where("genre")
            .in([...genre])
            .sort({ name: "ascending" })
            .skip(page * limit)
            .limit(limit)
            .populate("genre");

        const count = await Movie.countDocuments({
            rating: { $in: [...rating] },
            genre: { $in: [...genre] },
            name: { $regex: search, $options: "i" },
        });

        const response = {
            message: "Success",
            count,
            page: page + 1,
            limit,
            movies,
            genres,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
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
        res.status(500).json({ message: "Something went wrong" });
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
        res.status(500).json({ message: "Something went wrong" });
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

        console.log(leadactor, "actor");

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
        res.status(500).json({ message: "Something went wrong" });
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

        res.status(200).json({ StatusCode: 6000, message: "movie deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
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
