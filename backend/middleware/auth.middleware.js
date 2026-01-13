const jwt = require("jsonwebtoken");

/* =====================================================
   ADMIN AUTH MIDDLEWARE
===================================================== */
module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  if (!process.env.JWT_SECRET) {
    console.error("❌ JWT_SECRET missing");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /* ---------- ADMIN CHECK ---------- */
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
