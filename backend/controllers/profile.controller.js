const db = require("../config/db");
const fs = require("fs");
const path = require("path");

/* ================================
   GET USER PROFILE ✅ REQUIRED
================================ */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [[user]] = await db.query(
      `SELECT id, name, phone, alt_phone AS altPhone, image
       FROM users WHERE id=?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [addresses] = await db.query(
      `SELECT id, address
       FROM addresses
       WHERE user_id=?
       ORDER BY id DESC`,
      [userId]
    );

    res.json({ ...user, addresses });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

/* ================================
   ADMIN DELETE USER (DO NOT TOUCH)
================================ */
exports.deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    const [[user]] = await db.query(
      "SELECT image FROM users WHERE id=?",
      [userId]
    );

    if (user?.image) {
      const imgPath = path.join(__dirname, "..", user.image);
      fs.existsSync(imgPath) && fs.unlink(imgPath, () => {});
    }

    await db.query("DELETE FROM addresses WHERE user_id=?", [userId]);
    await db.query("DELETE FROM users WHERE id=?", [userId]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("ADMIN DELETE USER ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

/* ================================
   UPDATE PROFILE
================================ */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { name, phone, altPhone } = req.body;

    name = name?.trim();
    phone = phone?.trim() || null;
    altPhone = altPhone?.trim() || null;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    await db.query(
      "UPDATE users SET name=?, phone=?, alt_phone=? WHERE id=?",
      [name, phone, altPhone, userId]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/* ================================
   UPDATE PROFILE IMAGE
================================ */
exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const [[old]] = await db.query(
      "SELECT image FROM users WHERE id=?",
      [userId]
    );

    if (old?.image) {
      const oldPath = path.join(__dirname, "..", old.image);
      fs.unlink(oldPath, () => {});
    }

    const imagePath = "/uploads/users/" + req.file.filename;

    await db.query(
      "UPDATE users SET image=? WHERE id=?",
      [imagePath, userId]
    );

    res.json({ message: "Profile image updated", image: imagePath });
  } catch (err) {
    console.error("IMAGE UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update image" });
  }
};

/* ================================
   ADD ADDRESS
================================ */
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const address = req.body.address?.trim();

    if (!address) {
      return res.status(400).json({ message: "Address required" });
    }

    await db.query(
      "INSERT INTO addresses (user_id, address) VALUES (?, ?)",
      [userId, address]
    );

    const [addresses] = await db.query(
      `SELECT id, address
       FROM addresses
       WHERE user_id=?
       ORDER BY id DESC`,
      [userId]
    );

    res.status(201).json({
      message: "Address added successfully",
      addresses
    });
  } catch (err) {
    console.error("ADD ADDRESS ERROR:", err);
    res.status(500).json({ message: "Failed to add address" });
  }
};

/* ================================
   DELETE ADDRESS
================================ */
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = Number(req.params.id);

    if (!addressId) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    const [result] = await db.query(
      "DELETE FROM addresses WHERE id=? AND user_id=?",
      [addressId, userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error("DELETE ADDRESS ERROR:", err);
    res.status(500).json({ message: "Failed to delete address" });
  }
};
