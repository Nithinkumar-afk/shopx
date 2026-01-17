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
 * ROUTES IMPORT (NO AUTH)
 *************************************************/
const adminRoutes = require("./routes/admin.routes");
const adminUsersRoutes = require("./routes/admin.users.routes");
const adminProductsRoutes = require("./routes/admin.products.routes");
const adminOrdersRoutes = require("./routes/admin.orders.routes");

const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/orders.routes");

/*************************************************
 * APP INIT
 *************************************************/
const app = express();
const PORT = process.env.PORT || 8080;

/*************************************************
 * TRUST PROXY (VERCEL SAFE)
 *************************************************/
app.set("trust proxy", 1);

/*************************************************
 * BODY PARSERS
 *************************************************/
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/*************************************************
 * CORS (INDEX.HTML + VERCEL)
 *************************************************/
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

/*************************************************
 * STATIC FILES
 *************************************************/
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*************************************************
 * SERVE FRONTEND (index.html)
 *************************************************/
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

/*************************************************
 * DATABASE INIT
 *************************************************/
require("./config/db");
console.log("✅ Database initialized");

/*************************************************
 * ADMIN ROUTES (NO LOGIN)
 *************************************************/
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);

/*************************************************
 * STORE ROUTES (NO LOGIN)
 *************************************************/
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

/*************************************************
 * API HEALTH CHECK
 *************************************************/
app.get("/api/health", (req, res) => {
  res.json({
    status: "JD Backend Running ✅",
    auth: "Disabled",
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
 * ERROR HANDLER
 *************************************************/
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/*************************************************
 * START SERVER
 *************************************************/
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
