//modules
const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
    res.status(201).json({ message: "added new movie" });
});

module.exports = router;
