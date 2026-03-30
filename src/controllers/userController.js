const firestoreService = require("../services/firestoreService");

/**
 * Controller to handle user-related requests.
 */
class UserController {
  /**
   * GET /api/favorites
   */
  async getFavorites(req, res) {
    const uid = req.user.uid;
    try {
      const favorites = await firestoreService.getFavorites(uid);
      res.json(favorites);
    } catch (error) {
      console.error("Get Favorites Error:", error.message);
      res.status(500).json({ error: "Failed to retrieve favorites." });
    }
  }

  /**
   * POST /api/favorites
   */
  async toggleFavorite(req, res) {
    const uid = req.user.uid;
    const { contentId } = req.body;
    if (!contentId) return res.status(400).json({ error: "contentId is required." });

    try {
      const result = await firestoreService.toggleFavorite(uid, contentId);
      res.json(result);
    } catch (error) {
      console.error("Toggle Favorite Error:", error.message);
      res.status(500).json({ error: "Failed to toggle favorite." });
    }
  }

  /**
   * POST /api/reset-devices
   */
  async resetDevices(req, res) {
    const uid = req.user.uid;
    try {
      const result = await firestoreService.resetActiveIps(uid);
      res.json(result);
    } catch (error) {
      console.error("Reset Devices Error:", error.message);
      res.status(500).json({ error: "Failed to reset devices." });
    }
  }

  /**
   * GET /api/user/playback-status/:contentId
   */
  async getPlaybackStatus(req, res) {
    const uid = req.user.uid;
    const { contentId } = req.params;
    try {
      const status = await firestoreService.getPlaybackStatus(uid, contentId);
      res.json(status);
    } catch (error) {
      console.error("Get Playback Status Error:", error.message);
      res.status(500).json({ error: "Failed to retrieve playback status." });
    }
  }

  /**
   * POST /api/user/playback-status
   */
  async savePlaybackStatus(req, res) {
    const uid = req.user.uid;
    const { contentId, position } = req.body;
    if (!contentId || position === undefined) {
      return res.status(400).json({ error: "contentId and position are required." });
    }

    try {
      const result = await firestoreService.savePlaybackStatus(uid, contentId, position);
      res.json(result);
    } catch (error) {
      console.error("Save Playback Status Error:", error.message);
      res.status(500).json({ error: "Failed to save playback status." });
    }
  }

  /**
   * POST /api/user/fcm-token
   */
  async registerFcmToken(req, res) {
    const uid = req.user.uid;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required." });

    try {
      const result = await firestoreService.saveFcmToken(uid, token);
      res.json(result);
    } catch (error) {
      console.error("Register FCM Token Error:", error.message);
      res.status(500).json({ error: "Failed to register FCM token." });
    }
  }
}

module.exports = new UserController();
