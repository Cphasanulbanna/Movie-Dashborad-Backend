//modules
const express = require("express");
const router = express.Router();
const { addMovie, fetchMovies, editMovie } = require("../controllers/movieController");
const upload = require("../middleware/uploadImage");

router.get("/", fetchMovies);
router.post("/", upload.single("poster"), addMovie);
router.put("/", upload.single("poster"), editMovie);

module.exports = router;
