//modules
const express = require("express");
const router = express.Router();

//controllers
const { signup, login } = require("../controllers/userController");
const upload = require("../middleware/uploadImage");

router.post("/signup", upload.single("profile"), signup);
router.post("/login", login);

module.exports = router;
