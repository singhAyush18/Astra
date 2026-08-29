const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../services/tokenservice");
const { sendVerificationEmail, generateVerificationToken } = require("../services/emailService");

// Validation helpers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate email format
        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate username
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message:
                    "Username must be 3-20 characters (letters, numbers, underscores only)",
            });
        }

        // Validate password strength
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be 8-128 chars with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check for existing user — differentiate email vs username
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered",
                });
            }
            if (existingUser.username === username) {
                return res.status(409).json({
                    success: false,
                    message: "Username already taken",
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();

        const user = await User.create({
            username,
            email: normalizedEmail,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await sendVerificationEmail(normalizedEmail, verificationToken);

        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Error during registration",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email format
        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate password is provided
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                level: user.level,
                xp: user.xp,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Error during login",
        });
    }
};

const logout = async (req, res) => {
    // JWT is stateless — the client must discard the token.
    // This endpoint exists so the frontend has a clean API call
    // to confirm logout and perform any future server-side cleanup
    // (e.g. token blacklisting, audit logging).
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification link",
            });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in.",
        });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying email",
        });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Don't reveal whether the email exists
            return res.status(200).json({
                success: true,
                message: "If that email is registered, a new verification link has been sent.",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        const verificationToken = generateVerificationToken();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(normalizedEmail, verificationToken);

        res.status(200).json({
            success: true,
            message: "If that email is registered, a new verification link has been sent.",
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({
            success: false,
            message: "Error resending verification email",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, profilePicture } = req.body;
        const userId = req.user.id; // From auth middleware

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Handle Username update
        if (username && username !== user.username) {
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be 3-20 characters (letters, numbers, underscores only)",
                });
            }

            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username already taken",
                });
            }
            user.username = username;
        }

        // Handle Profile Picture update (including removal if passed as null/empty)
        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                level: user.level,
                xp: user.xp,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                profilePicture: user.profilePicture,
            },
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
        });
    }
};

module.exports = { register, login, logout, verifyEmail, resendVerification, updateProfile };