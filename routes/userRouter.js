//modules
const express = require("express");
const router = express.Router();

//controllers
const {
    signup,
    login,
    getAllUsers,
    resetPassword,
    verifyOtp,
    forgetPassword,
} = require("../controllers/userController");
const { checkAuth } = require("../middleware/checkAuth");

router.post("/signup", signup);
router.post("/login", login);
router.get("/users", checkAuth, getAllUsers);

router.post("/forget-password", forgetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
