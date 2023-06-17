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
const { checkRole } = require("../middleware/checkRole");

router.get("/", checkAuth, fetchMovies);
router.get("/:_id", checkAuth, fetchSingleMovie);
router.get("/with-genre", checkAuth, fetchMoviesWithGenre);
router.post("/", checkAuth, checkRole, addMovie);
router.put("/:_id", checkAuth, checkRole, editMovie);
router.delete("/", checkAuth, checkRole, deleteMovie);

module.exports = router;
