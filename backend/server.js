/*************************************************
 * LOAD ENV FIRST — NO CODE ABOVE THIS
 *************************************************/

/*************************************************
 * DEBUG: CONFIRM ENV IS LOADED
 *************************************************/
console.log("🔎 ENV CHECK:", {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
});

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
 * BASIC CONFIG
 *************************************************/
app.set("trust proxy", 1);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/*************************************************
 * STATIC FILES
 *************************************************/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*************************************************
 * DATABASE INIT (STRICT CHECK)
 *************************************************/
if (
  !process.env.DB_HOST ||
  !process.env.DB_USER ||
  !process.env.DB_NAME
) {
  console.warn("⚠️ MySQL env vars missing. App running without DB.");
} else {
  require("./config/db");
}

/*************************************************
 * SAFE ROUTE LOADER
 *************************************************/
const safeRoute = (routePath, routeFile) => {
  try {
    app.use(routePath, require(routeFile));
    console.log(`✅ Loaded route: ${routePath}`);
  } catch (err) {
    console.error(`❌ Route failed: ${routeFile}`);
    console.error(err.message);
  }
};

/*************************************************
 * ROUTES
 *************************************************/
/* AUTH & PROFILE */
safeRoute("/api/auth", "./routes/auth.routes");
safeRoute("/api/profile", "./routes/profile.routes");

/* ADMIN */
safeRoute("/api/admin", "./routes/admin.routes");
safeRoute("/api/admin/users", "./routes/admin.users.routes");
safeRoute("/api/admin/products", "./routes/admin.product.routes");
safeRoute("/api/admin/orders", "./routes/admin.orders.routes");

/* USER */
safeRoute("/api/products", "./routes/product.routes");
safeRoute("/api/cart", "./routes/cart.routes");
safeRoute("/api/orders", "./routes/orders.routes");

/*************************************************
 * HEALTH CHECK
 *************************************************/
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ShopX backend running ✅",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    db: process.env.DB_HOST ? "CONNECTED CONFIG" : "NO DB CONFIG",
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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ShopX backend running on port ${PORT}`);
});
