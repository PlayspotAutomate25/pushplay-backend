const { auth } = require("../config/firebase");

/**
 * Middleware to verify Firebase ID tokens.
 * Extracts the token from the Authorization: Bearer header.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token format." });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken; // Attach uid and user info to request
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
};

module.exports = { verifyToken };
