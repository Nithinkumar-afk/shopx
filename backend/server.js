require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

/* ================= ROUTES ================= */
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const adminUserRoutes = require("./routes/admin.users.routes");
const productRoutes = require("./routes/product.routes");
const adminProductRoutes = require("./routes/admin.product.routes");
const profileRoutes = require("./routes/profile.routes");
const cartRoutes = require("./routes/cart.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminOrdersRoutes = require("./routes/admin.orders.routes");

/* ================= CORE CONFIG ================= */

// Trust proxy (Render / Railway / Nginx)
app.set("trust proxy", 1);

// CORS
app.use(
  cors({
    origin: "*", // ⚠️ lock frontend URL in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================= STATIC FILES ================= */

// Uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= API ROUTES ================= */

// Auth
app.use("/api/auth", authRoutes);

// User profile
app.use("/api/profile", profileRoutes);

// Admin auth
app.use("/api/admin", adminRoutes);

// Admin users
app.use("/api/admin/users", adminUserRoutes);

// Public products
app.use("/api/products", productRoutes);

// Admin products
app.use("/api/admin/products", adminProductRoutes);

// Cart
app.use("/api/cart", cartRoutes);

// User orders
app.use("/api/orders", ordersRoutes);

// Admin orders
app.use("/api/admin/orders", adminOrdersRoutes);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({
    status: "ShopX backend running ✅",
    timestamp: new Date().toISOString()
  });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "Image too large (Max 2MB)"
    });
  }

  res.status(500).json({
    message: "Internal server error"
  });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ ShopX backend running on port ${PORT}`);
});
