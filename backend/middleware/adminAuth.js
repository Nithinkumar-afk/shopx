const jwt = require("jsonwebtoken");

/**
 * ADMIN AUTH MIDDLEWARE
 * Allows ONLY admin users
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No Authorization header
    if (!authHeader) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    // ❌ Wrong format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    // ❌ Empty / corrupted token
    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET missing");
      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ❌ Invalid token payload
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    // ✅ Attach admin info
    req.admin = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
    };

    next();

  } catch (err) {
    console.error("❌ AdminAuth error:", err.message);
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};
