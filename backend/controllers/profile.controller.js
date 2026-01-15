const db = require("../config/db");

/* =========================
   GET PROFILE
========================= */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      `SELECT id, name, phone, alt_phone AS altPhone, image
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    const [addresses] = await db.query(
      "SELECT id, address FROM addresses WHERE user_id = ?",
      [userId]
    );

    res.json({ ...user, addresses });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, altPhone } = req.body;
    const userId = req.user.id;

    await db.query(
      "UPDATE users SET name=?, phone=?, alt_phone=? WHERE id=?",
      [name, phone, altPhone, userId]
    );

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE IMAGE
========================= */
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imagePath = "/uploads/" + req.file.filename;

    await db.query(
      "UPDATE users SET image=? WHERE id=?",
      [imagePath, req.user.id]
    );

    res.json({ image: imagePath });
  } catch (err) {
    console.error("IMAGE UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   ADD ADDRESS
========================= */
exports.addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) return res.status(400).json({ message: "Address required" });

    await db.query(
      "INSERT INTO addresses (user_id, address) VALUES (?, ?)",
      [req.user.id, address]
    );

    res.json({ message: "Address added" });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE ADDRESS
========================= */
exports.deleteAddress = async (req, res) => {
  try {
    await db.query(
      "DELETE FROM addresses WHERE id=? AND user_id=?",
      [req.params.id, req.user.id]
    );

    res.json({ message: "Address deleted" });
  } catch (err) {
    console.error("DELETE ADDRESS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
