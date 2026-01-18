const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* TEMP USER (replace with auth later) */
const USER_ID = 1;

/* ===============================
   GET USER ADDRESS
================================ */
router.get("/", async (req, res) => {
  try {
    const [[address]] = await db.query(
      "SELECT * FROM addresses WHERE user_id = ?",
      [USER_ID]
    );

    res.json(address || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch address" });
  }
});

/* ===============================
   ADD / UPDATE ADDRESS
================================ */
router.post("/", async (req, res) => {
  try {
    const {
      full_name,
      phone,
      address_line,
      city,
      state,
      pincode
    } = req.body;

    /* Check if address already exists */
    const [[existing]] = await db.query(
      "SELECT id FROM addresses WHERE user_id = ?",
      [USER_ID]
    );

    if (existing) {
      /* UPDATE */
      await db.query(
        `UPDATE addresses 
         SET full_name=?, phone=?, address_line=?, city=?, state=?, pincode=?
         WHERE user_id=?`,
        [full_name, phone, address_line, city, state, pincode, USER_ID]
      );
    } else {
      /* INSERT */
      await db.query(
        `INSERT INTO addresses 
         (user_id, full_name, phone, address_line, city, state, pincode)
         VALUES (?,?,?,?,?,?,?)`,
        [USER_ID, full_name, phone, address_line, city, state, pincode]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save address" });
  }
});

module.exports = router;
