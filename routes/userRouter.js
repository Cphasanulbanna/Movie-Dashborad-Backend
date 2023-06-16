//modules
const express = require("express");
const router = express.Router();

//controllers
const { signup, login, getAllUsers } = require("../controllers/userController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/users", checkAuth, getAllUsers);

module.exports = router;
