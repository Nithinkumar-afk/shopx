const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE (PRODUCTION SAFE)
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ❌ No Authorization header
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header" });
  }

  // ❌ Invalid format
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid auth format" });
  }

  const token = authHeader.split(" ")[1];

  // ❌ Missing JWT secret (Railway misconfig)
  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET not set in Railway");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ❌ Not admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    // ✅ Attach admin to request
    req.admin = {
      id: decoded.id,
      role: decoded.role
    };

    return next();
  } catch (err) {
    console.error("❌ Admin token error:", err.message);
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};
