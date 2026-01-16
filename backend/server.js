/*************************************************
 * LOAD ENV FIRST
 *************************************************/
require("dotenv").config();

/*************************************************
 * IMPORTS
 *************************************************/
const express = require("express");
const cors = require("cors");
const path = require("path");

/*************************************************
 * APP INIT
 *************************************************/
const app = express();
const PORT = process.env.PORT || 8080;

/*************************************************
 * TRUST PROXY (RAILWAY SAFE)
 *************************************************/
app.set("trust proxy", 1);

/*************************************************
 * BODY PARSERS
 *************************************************/
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/*************************************************
 * ✅ CORS — FIXED (VERCEL + RAILWAY + LOCAL)
 *************************************************/
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://frontend-new-liart.vercel.app",
      "https://shopx-production-b1ad.up.railway.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

/*************************************************
 * STATIC FILES
 *************************************************/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*************************************************
 * DATABASE INIT
 *************************************************/
require("./config/db");
console.log("✅ Database connected");

/*************************************************
 * ROUTES
 *************************************************/
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/admin/users", require("./routes/admin.users.routes"));
app.use("/api/admin/products", require("./routes/admin.products.routes"));
app.use("/api/admin/orders", require("./routes/admin.orders.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/profile", require("./routes/profile.routes"));
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));

/*************************************************
 * HEALTH CHECK
 *************************************************/
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ShopX backend running ✅",
    uptime: process.uptime(),
    time: new Date().toISOString()
  });
});

/*************************************************
 * 404 HANDLER
 *************************************************/
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/*************************************************
 * GLOBAL ERROR HANDLER
 *************************************************/
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: "Internal server error" });
});

/*************************************************
 * START SERVER
 *************************************************/
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

/*************************************************
 * GRACEFUL SHUTDOWN
 *************************************************/
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
