//modules
const express = require("express");
const router = express.Router();

//controllers
const { addGenre, fetchAllGenres } = require("../controllers/genreController");

router.post("/", addGenre);
router.get("/", fetchAllGenres);

module.exports = router;
