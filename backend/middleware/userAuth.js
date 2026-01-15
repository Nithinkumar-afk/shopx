const jwt = require("jsonwebtoken");

/**
 * USER AUTH MIDDLEWARE
 * Validates user JWT
 */
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret"
    );

    // attach user to request
    req.user = decoded;

    next();
  } catch (err) {
    console.error("🔥 USER AUTH ERROR:", err.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
