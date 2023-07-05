//modules
const express = require("express");
const router = express.Router();

//controllers
const {
    signup,
    login,
    refreshToken,
    getAllUsers,
    resetPassword,
    verifyOtp,
    forgetPassword,
} = require("../controllers/userController");
const { checkAuth } = require("../middleware/checkAuth");
const { checkRole } = require("../middleware/checkRole");

router.post("/signup", signup);
router.post("/login", login);
router.get("/refresh-token", refreshToken);

router.get("/users", checkAuth, checkRole, getAllUsers);

router.post("/forget-password", forgetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
