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
    addGallery,
    fetchSingleMovie,
} = require("../controllers/movieController");
const upload = require("../middleware/uploadImage");
const { checkAuth } = require("../middleware/checkAuth");

router.get("/", checkAuth, fetchMovies);
router.get("/:_id", checkAuth, fetchSingleMovie);
router.get("/with-genre", fetchMoviesWithGenre);
router.post("/", upload.single("poster"), addMovie);
router.put("/gallery", upload.array("gallery", [4]), addGallery);
router.put("/", upload.single("poster"), editMovie);
router.put("/add-genre", addGenreToMovie);
router.put("/remove-genre", removeGenreFromMovie);
router.delete("/", deleteMovie);

module.exports = router;
