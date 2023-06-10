//modules
const express = require("express");
const router = express.Router();

//controllers
const {
    addGenre,
    fetchAllGenres,
    editGenre,
    deleteGenre,
} = require("../controllers/genreController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/", addGenre);
router.get("/", checkAuth, fetchAllGenres);
router.put("/", editGenre);
router.delete("/", deleteGenre);

module.exports = router;
