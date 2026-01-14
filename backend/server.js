require("dotenv").config(); // MUST be first

const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   CORE MIDDLEWARE
================================ */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));

/* ===============================
   HEALTH CHECK (CRITICAL FOR RAILWAY)
   🚨 DO NOT REMOVE
================================ */
app.get("/", (req, res) => {
  return res.status(200).json({
    status: "ok",
    service: "ShopX Backend",
    uptime: process.uptime(),
  });
});

/* ===============================
   ROUTES
================================ */
const productRoutes = require("./routes/product.routes");
app.use("/api/products", productRoutes);

/* ===============================
   GLOBAL ERROR HANDLER
   (prevents silent crashes)
================================ */
app.use((err, req, res, next) => {
  console.error("❌ UNHANDLED ERROR:", err);
  return res.status(500).json({
    message: "Internal server error",
  });
});

/* ===============================
   START SERVER (RAILWAY SAFE)
================================ */
const PORT = Number(process.env.PORT || 8080);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ShopX backend running on port ${PORT}`);
});

/* ===============================
   GRACEFUL SHUTDOWN (REQUIRED)
================================ */
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
