//modules
const express = require("express");
const router = express.Router();

//controllers
const { addGenre } = require("../controllers/genreController");

router.post("/", addGenre);

module.exports = router;
