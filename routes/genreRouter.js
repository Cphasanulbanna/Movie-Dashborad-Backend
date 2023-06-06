//modules
const express = require("express");
const router = express.Router();

//controllers
const { addGenre, fetchAllGenres, editGenre } = require("../controllers/genreController");

router.post("/", addGenre);
router.get("/", fetchAllGenres);
router.put("/", editGenre);

module.exports = router;
