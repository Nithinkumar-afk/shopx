require("dotenv").config();
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

/* HARD RESPONSE TEST */
app.get("/", (req, res) => {
  return res.status(200).json({
    status: "OK",
    time: new Date().toISOString()
  });
});

/* PRODUCTS TEST — NO DB */
app.get("/api/products", (req, res) => {
  return res.status(200).json([
    { id: 1, name: "Test Product", price: 100 }
  ]);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);
});
