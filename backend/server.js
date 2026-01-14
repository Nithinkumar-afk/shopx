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
const PORT = Number(process.env.PORT) || 8080;

/*************************************************
 * TRUST RAILWAY PROXY
 *************************************************/
app.set("trust proxy", 1);

/*************************************************
 * MIDDLEWARE
 *************************************************/
app.use(
  cors({
    origin: "*", // Netlify safe
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/*************************************************
 * 🔥 FORCE MAILER INIT
 *************************************************/
try {
  require("./utils/mailer");
  console.log("📧 Mailer initialized");
} catch (err) {
  console.error("❌ Mailer init failed:", err.message);
}

/*************************************************
 * STATIC FILES
 *************************************************/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*************************************************
 * INIT DATABASE
 *************************************************/
require("./config/db");

/*************************************************
 * SAFE ROUTE LOADER
 *************************************************/
const safeRoute = (routePath, routeFile) => {
  try {
    app.use(routePath, require(routeFile));
    console.log(`✅ Loaded route: ${routePath}`);
  } catch (err) {
    console.error(`❌ Failed route: ${routeFile}`);
    console.error(err.message);
  }
};

/*************************************************
 * ROUTES
 *************************************************/
safeRoute("/api/auth", "./routes/auth.routes");

/* PROFILE (your product.routes.js is actually profile) */
safeRoute("/api/profile", "./routes/product.routes");

/* ADMIN */
safeRoute("/api/admin", "./routes/admin.routes");
safeRoute("/api/admin/users", "./routes/admin.users.routes");
safeRoute("/api/admin/products", "./routes/admin.products.routes");
safeRoute("/api/admin/orders", "./routes/admin.orders.routes");

/* USER */
safeRoute("/api/cart", "./routes/cart.routes");
safeRoute("/api/orders", "./routes/orders.routes");

/*************************************************
 * HEALTH CHECK
 *************************************************/
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ShopX backend running ✅",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "production",
    time: new Date().toISOString(),
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
  console.error("🔥 GLOBAL ERROR:", err.stack || err.message);
  res.status(500).json({ message: "Internal server error" });
});

/*************************************************
 * START SERVER
 *************************************************/
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ShopX backend running on port ${PORT}`);
});

/*************************************************
 * GRACEFUL SHUTDOWN
 *************************************************/
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
});
