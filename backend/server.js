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
 * ROUTES IMPORT
 * (NO AUTH ROUTES)
 *************************************************/
const adminRoutes = require("./routes/admin.routes");
const adminUsersRoutes = require("./routes/admin.users.routes");
const adminProductsRoutes = require("./routes/admin.products.routes");
const adminOrdersRoutes = require("./routes/admin.orders.routes");

const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/orders.routes");
const profileRoutes = require("./routes/profile.routes");

/*************************************************
 * APP INIT
 *************************************************/
const app = express();
const PORT = process.env.PORT || 8080;

/*************************************************
 * TRUST PROXY
 *************************************************/
app.set("trust proxy", 1);

/*************************************************
 * BODY PARSERS
 *************************************************/
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/*************************************************
 * CORS (INDEX.HTML + VERCEL SAFE)
 *************************************************/
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://frontend-new-liart.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
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
console.log("✅ Database initialized");

/*************************************************
 * ROUTES (NO LOGIN / NO AUTH)
 *************************************************/

// ADMIN ROUTES (PUBLIC / INTERNAL USE)
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);

// USER / STORE ROUTES
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/profile", profileRoutes);

/*************************************************
 * HEALTH CHECK
 *************************************************/
app.get("/", (req, res) => {
  res.json({
    status: "JD Backend Running ✅",
    mode: "Admin enabled | No login",
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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
