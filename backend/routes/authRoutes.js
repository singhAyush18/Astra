const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { 
    register, 
    login, 
    logout, 
    getMe,
    verifyEmail, 
    resendVerification, 
    updateProfile, 
    forgotPassword, 
    resetPassword, 
    requestPasswordChangeOtp,
    changePassword 
} = require("../controllers/authController");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.put("/profile", auth, updateProfile);

// Password management
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/change-password/request-otp", auth, authLimiter, requestPasswordChangeOtp);
router.put("/change-password", auth, changePassword);

module.exports = router;