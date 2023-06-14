//modules
const path = require("path");
const fs = require("fs");

//models
const Movie = require("../models/movieModel");

const cloudinary = require("cloudinary");

const addMovie = async (req, res) => {
    try {
        const { name, year, rating, leadactor, genre, description } = req.body;

        if (!name || !req.files) {
            return res.status(400).json({ message: "Movie name & movie image is required" });
        }

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
            genre: genre ?? genre,
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
        const page = req.query.p;
        const moviesPerPage = 2;

        const totalMovies = await Movie.countDocuments();
        const totalPages = Math.ceil(totalMovies / moviesPerPage);
        const count = page > 1 ? moviesPerPage * page - moviesPerPage : 0;

        const paginatedData = await Movie.find().populate("genre").skip(count).limit(moviesPerPage);
        const regex = new RegExp(q, "i");
        if (q) {
            const filteredMovies = await Movie.find({ name: { $regex: regex } })
                .populate("genre")
                .skip(count)
                .limit(moviesPerPage);

            return res.status(200).json({
                message: "Success",
                moviesList: filteredMovies,
                total_movies: totalMovies,
                total_pages: totalPages,
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
        const { name, year, rating, leadactor, description } = req.body;
        const genres = req.body["genre[]"]; // Access genres as an array
        const genresArray = Array.isArray(genres) ? genres : [genres];

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
        movie.genre = genres ? [...movie.genre, ...genresArray] : movie.genre;

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
