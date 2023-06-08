//modules
const express = require("express");
const router = express.Router();

//controllers
const { addGenre, fetchAllGenres, editGenre } = require("../controllers/genreController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/", checkAuth, addGenre);
router.get("/", checkAuth, fetchAllGenres);
router.put("/", checkAuth, editGenre);

module.exports = router;
