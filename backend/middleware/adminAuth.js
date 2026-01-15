const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE
 * Allows ONLY admin users
 */
function adminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret"
    );

    // ❌ Not admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    // ✅ Attach admin info
    req.admin = decoded;

    next();
  } catch (err) {
    console.error("ADMIN AUTH ERROR:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = adminAuth;
