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
 * MAILER INIT
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
 * ROUTES (FINAL FIX)
 *************************************************/

/* AUTH */
app.use("/api/auth", require("./routes/auth.routes"));

/* ✅ PUBLIC PRODUCTS */
app.use("/api/products", require("./routes/product.routes"));

/* USER */
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/orders.routes"));

/* ADMIN */
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/admin/users", require("./routes/admin.users.routes"));
app.use("/api/admin/products", require("./routes/admin.products.routes"));
app.use("/api/admin/orders", require("./routes/admin.orders.routes"));
app.use("/api/products", require("./routes/product.routes"));



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
