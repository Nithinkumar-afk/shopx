// Load dotenv ONLY in local development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const path = require("path");

// 🔥 Initialize DB ONCE (fails fast if broken)
require("./config/db");

const app = express();

/* ================= BASIC CONFIG ================= */
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

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/profile", require("./routes/profile.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/admin/users", require("./routes/admin.users.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/admin/products", require("./routes/admin.product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/orders.routes"));
app.use("/api/admin/orders", require("./routes/admin.orders.routes"));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.json({
    status: "ShopX backend running ✅",
    environment: process.env.NODE_ENV || "production",
    time: new Date().toISOString(),
  });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 ShopX backend running on port ${PORT}`);
});
