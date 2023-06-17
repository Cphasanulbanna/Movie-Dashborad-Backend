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
const { checkRole } = require("../middleware/checkRole");

router.post("/", checkAuth, checkRole, addGenre);
router.get("/", checkAuth, fetchAllGenres);
router.put("/", checkAuth, checkRole, editGenre);
router.delete("/", checkAuth, checkRole, deleteGenre);

module.exports = router;
