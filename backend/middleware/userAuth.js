const jwt = require("jsonwebtoken");

/**
 * USER AUTH MIDDLEWARE (FIXED)
 * Ensures req.user.id ALWAYS exists
 */
module.exports = function (req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET missing");
    return res.status(500).json({ message: "Server auth misconfigured" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * 🔧 NORMALIZE USER ID
     * Supports tokens with:
     * - id
     * - userId
     * - sub
     */
    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    if (!req.user.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
