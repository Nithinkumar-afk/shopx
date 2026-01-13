const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE
 * Allows ONLY admin users
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Missing secret
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ❌ Not admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }

    // ✅ Attach admin
    req.admin = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
