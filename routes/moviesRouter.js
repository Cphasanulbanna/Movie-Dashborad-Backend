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
    fetchSingleMovie,
} = require("../controllers/movieController");
const { checkAuth } = require("../middleware/checkAuth");

router.get("/", fetchMovies);
router.get("/:_id", checkAuth, fetchSingleMovie);
router.get("/with-genre", fetchMoviesWithGenre);
router.post("/", addMovie);
router.put("/:_id", editMovie);
router.put("/add-genre", addGenreToMovie);
router.put("/remove-genre", removeGenreFromMovie);
router.delete("/", deleteMovie);

module.exports = router;
