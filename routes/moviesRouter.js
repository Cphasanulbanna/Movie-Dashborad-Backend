//modules
const express = require("express");
const router = express.Router();
const {
    addMovie,
    fetchMovies,
    editMovie,
    deleteMovie,
    fetchMoviesWithGenre,
    fetchSingleMovie,
} = require("../controllers/movieController");
const { checkAuth } = require("../middleware/checkAuth");

router.get("/", checkAuth, fetchMovies);
router.get("/:_id", checkAuth, fetchSingleMovie);
router.get("/with-genre", checkAuth, fetchMoviesWithGenre);
router.post("/", addMovie);
router.put("/:_id", editMovie);
router.delete("/", deleteMovie);

module.exports = router;
