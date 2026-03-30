const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/auth");

/**
 * Public Routes
 */
// Registers a new user with Firebase Auth and Firestore record initialization
router.post("/register", authController.register.bind(authController));

/**
 * Protected Routes
 */
// Self-check for user data when token is valid
router.get("/me", verifyToken, authController.getCurrentUser.bind(authController));

module.exports = router;
