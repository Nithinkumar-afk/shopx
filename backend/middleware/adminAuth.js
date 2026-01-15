const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE
 * Allows ONLY admin users
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ❌ Invalid token payload
    if (!decoded || !decoded.role) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    // ✅ Admin-only access
    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Admins only access",
      });
    }

    // ✅ Attach admin info to request
    req.admin = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("❌ AdminAuth error:", err.message);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
