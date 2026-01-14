require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* 🚑 EMERGENCY HEALTH CHECK */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* 🚑 FORCE PRODUCTS RESPONSE */
app.get("/api/products", (req, res) => {
  return res.status(200).json([]);
});

/* 🚑 NEVER CRASH */
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED:", err);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on", PORT);
});
