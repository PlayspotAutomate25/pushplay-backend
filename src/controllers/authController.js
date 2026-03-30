const { auth, db } = require("../config/firebase");

/**
 * Controller to handle authentication wrapper actions.
 */
class AuthController {
  /**
   * POST /api/auth/register
   * Creates a new user project-wide and initializes Firestore data.
   */
  async register(req, res) {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    try {
      // 1. Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName || "",
      });

      // 2. Initialize Firestore user document
      await db.collection("users").doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: email,
        subscription_tier: "free",
        subscription_expiry: null,
        active_ips: [],
        favorites: []
      });

      res.status(201).json({
        message: "User registered successfully.",
        uid: userRecord.uid
      });
    } catch (error) {
      console.error("Registration Error:", error.message);
      res.status(500).json({ 
        error: "Failed to register user.", 
        details: error.code === 'auth/email-already-exists' ? "Email already in use." : error.message 
      });
    }
  }

  /**
   * GET /api/auth/me
   * Simple check to verify token and return user data.
   */
  async getCurrentUser(req, res) {
    // req.user is set by verifyToken middleware
    res.json(req.user);
  }
}

module.exports = new AuthController();
