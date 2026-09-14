const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { register, login, logout, verifyEmail, resendVerification, updateProfile, forgotPassword, resetPassword, changePassword } = require("../controllers/authController");
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", auth, logout);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.put("/profile", auth, updateProfile);

//password management
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.put("/change-password", auth, changePassword);
module.exports = router;