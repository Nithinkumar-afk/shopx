const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE (FIXED & PRODUCTION SAFE)
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader) {
      return res.status(401).json({ message: "No authorization header" });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid auth format" });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Missing secret
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * ✅ ADMIN CHECK (ROBUST)
     * Supports:
     * - role === "admin"
     * - isAdmin === true
     * - email match (fallback)
     */
    const isAdmin =
      decoded.role === "admin" ||
      decoded.isAdmin === true ||
      decoded.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admins only" });
    }

    // ✅ Attach admin
    req.admin = {
      id: decoded.id || null,
      email: decoded.email || null,
      role: "admin"
    };

    next();

  } catch (err) {
    console.error("❌ Admin auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
