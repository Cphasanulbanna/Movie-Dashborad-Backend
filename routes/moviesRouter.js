//modules
const express = require("express");
const router = express.Router();
const { addMovie } = require("../controllers/movieController");
const upload = require("../middleware/uploadImage");

router.post("/", upload.single("movie"), addMovie);

module.exports = router;
