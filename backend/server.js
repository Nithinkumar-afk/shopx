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
 * TRUST PROXY (Railway / Render safe)
 *************************************************/
app.set("trust proxy", 1);

/*************************************************
 * BODY PARSERS (MUST BE FIRST)
 *************************************************/
app.use(express.json({ limit: "5mb", strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: "*/*" })); // 🔥 important for proxies

/*************************************************
 * CORS (Netlify + Admin + Local safe)
 *************************************************/
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

/*************************************************
 * STATIC FILES
 *************************************************/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*************************************************
 * DATABASE INIT
 *************************************************/
require("./config/db");

/*************************************************
 * ROUTES
 *************************************************/

/* AUTH */
app.use("/api/auth", require("./routes/auth.routes"));

/* ADMIN */
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/admin/users", require("./routes/admin.users.routes"));
app.use("/api/admin/products", require("./routes/admin.products.routes"));
app.use("/api/admin/orders", require("./routes/admin.orders.routes"));

/* PUBLIC PRODUCTS */
app.use("/api/products", require("./routes/product.routes"));

/* USER */
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/profile", require("./routes/profile.routes"));

/*************************************************
 * HEALTH CHECK
 *************************************************/
app.get("/", (req, res) => {
  res.json({
    status: "ShopX backend running ✅",
    uptime: process.uptime(),
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
  console.error("🔥 ERROR:", err);
  res.status(500).json({ message: "Internal server error" });
});

/*************************************************
 * START SERVER
 *************************************************/
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
