//modules
const express = require("express");
const router = express.Router();
const {
    addMovie,
    fetchMovies,
    editMovie,
    deleteMovie,
    addGenreToMovie,
    removeGenreFromMovie,
    fetchMoviesWithGenre,
} = require("../controllers/movieController");
const upload = require("../middleware/uploadImage");

router.get("/", fetchMovies);
router.get("/with-genre", fetchMoviesWithGenre);
router.post("/", upload.single("poster"), addMovie);
router.put("/", upload.single("poster"), editMovie);
router.put("/add-genre", addGenreToMovie);
router.put("/remove-genre", removeGenreFromMovie);
router.delete("/", deleteMovie);

module.exports = router;
