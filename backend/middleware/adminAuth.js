const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE (STABLE & COMPATIBLE)
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not defined");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * ✅ STRICT ADMIN CHECK
     * Token MUST contain: role: "admin"
     */
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    // ✅ Attach admin to request
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (err) {
    console.error("❌ AdminAuth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
