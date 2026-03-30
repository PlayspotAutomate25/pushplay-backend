const { db, admin } = require("../config/firebase");

/**
 * Middleware to track user's public IP and limit to 3 devices/locations.
 * Must be used after verifyToken middleware to have access to req.user.uid.
 */
const ipTracker = async (req, res, next) => {
  const uid = req.user.uid;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Auto-create user doc if missing
      await userRef.set({
        uid: uid,
        email: req.user.email,
        subscription_tier: "free",
        subscription_expiry: null,
        active_ips: [clientIp],
        favorites: []
      });
      return next();
    }

    const userData = userDoc.data();
    const activeIps = userData.active_ips || [];

    // Check if current IP is already in our list
    if (activeIps.includes(clientIp)) {
      return next();
    }

    // IP not found, check if limit reached
    if (activeIps.length >= 3) {
      return res.status(403).json({ 
        error: "Maximum 3 devices/locations reached",
        message: "Please reset your active devices/locations from the app settings."
      });
    }

    // Add current IP to active_ips array
    await userRef.update({
      active_ips: admin.firestore.FieldValue.arrayUnion(clientIp)
    });

    next();
  } catch (error) {
    console.error("IP Tracker Error:", error.message);
    res.status(500).json({ error: "Internal Server Error during IP tracking." });
  }
};

module.exports = { ipTracker };
