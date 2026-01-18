const express = require("express");
const router = express.Router();
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

/* TEMP USER */
const USER_ID = 1;

/* ===============================
   IMAGE UPLOAD SETUP
================================ */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/* ===============================
   GET PROFILE
================================ */
router.get("/", async (req, res) => {
  const [[user]] = await db.query(
    `SELECT name, phone, alt_phone AS altPhone, address, image 
     FROM users WHERE id=?`,
    [USER_ID]
  );

  res.json(user || {});
});

/* ===============================
   UPDATE PROFILE
================================ */
router.post("/", upload.single("image"), async (req, res) => {
  const { name, phone, altPhone, address } = req.body;

  let imagePath = null;
  if (req.file) {
    imagePath = "/uploads/" + req.file.filename;
  }

  await db.query(
    `UPDATE users 
     SET name=?, phone=?, alt_phone=?, address=?, 
         image = COALESCE(?, image)
     WHERE id=?`,
    [name, phone, altPhone, address, imagePath, USER_ID]
  );

  res.json({ success: true });
});

module.exports = router;
