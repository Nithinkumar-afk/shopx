const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE (PRODUCTION SAFE)
 * Allows ONLY admin users
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({ message: "Server config error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Flexible admin check
    const isAdmin =
      decoded?.role === "admin" ||
      decoded?.isAdmin === true;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admins only access" });
    }

    // ✅ Attach admin info
    req.admin = {
      id: decoded.id,
      email: decoded.email,
      role: "admin",
    };

    next();
  } catch (err) {
    console.error("❌ AdminAuth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
