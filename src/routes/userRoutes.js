const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middlewares/auth");
const { ipTracker } = require("../middlewares/ipTracker");

/**
 * All user routes are protected by Firebase Auth and IP Tracking.
 */
router.use(verifyToken);
router.use(ipTracker);

// Favorites endpoints
router.get("/favorites", userController.getFavorites.bind(userController));
router.post("/favorites", userController.toggleFavorite.bind(userController));

// Device management endpoints
router.post("/reset-devices", userController.resetDevices.bind(userController));

// Playback management endpoints
router.get("/playback-status/:contentId", userController.getPlaybackStatus.bind(userController));
router.post("/playback-status", userController.savePlaybackStatus.bind(userController));

// FCM token registration
router.post("/fcm-token", userController.registerFcmToken.bind(userController));

module.exports = router;
