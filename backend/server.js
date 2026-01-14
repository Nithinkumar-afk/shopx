require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

/* HEALTH CHECK (Railway uses this) */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* LOAD DB (NON-BLOCKING) */
let db;
try {
  db = require("./config/db");
  console.log("✅ DB module loaded");
} catch (err) {
  console.error("❌ DB load failed:", err.message);
}

/* LOAD PRODUCTS ROUTE SAFELY */
try {
  app.use("/api/products", require("./routes/product.routes"));
  console.log("✅ /api/products loaded");
} catch (err) {
  console.error("❌ products route failed:", err.message);
}

/* GLOBAL SAFETY */
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);
});
