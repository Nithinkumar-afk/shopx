const db = require("../config/db");
const fs = require("fs");
const path = require("path");

/* ===============================
   GET ALL USERS (WITH ADDRESSES)
================================ */
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, name, phone, alt_phone AS altPhone, image
      FROM users
      ORDER BY id DESC
    `);

    for (const u of users) {
      const [addresses] = await db.query(
        "SELECT id, address FROM addresses WHERE user_id=? ORDER BY id DESC",
        [u.id]
      );
      u.addresses = addresses || [];
    }

    res.json(users);
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
};

/* ===============================
   UPDATE USER (NAME + ADDRESSES)
================================ */
exports.updateUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);
    let { name, addresses } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const [[exists]] = await db.query(
      "SELECT id FROM users WHERE id=?",
      [userId]
    );
    if (!exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await db.query(
      "UPDATE users SET name=? WHERE id=?",
      [name.trim(), userId]
    );

    if (addresses) {
      const list = Array.isArray(addresses)
        ? addresses
        : JSON.parse(addresses);

      await db.query("DELETE FROM addresses WHERE user_id=?", [userId]);

      for (const addr of list) {
        if (addr && addr.trim()) {
          await db.query(
            "INSERT INTO addresses (user_id, address) VALUES (?,?)",
            [userId, addr.trim()]
          );
        }
      }
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("ADMIN UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

/* ===============================
   UPDATE USER IMAGE
================================ */
exports.updateUserImage = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const [[old]] = await db.query(
      "SELECT image FROM users WHERE id=?",
      [userId]
    );

    if (old?.image) {
      const oldPath = path.join(__dirname, "..", old.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const imagePath = "/uploads/users/" + req.file.filename;

    await db.query(
      "UPDATE users SET image=? WHERE id=?",
      [imagePath, userId]
    );

    res.json({ image: imagePath });
  } catch (err) {
    console.error("ADMIN IMAGE ERROR:", err);
    res.status(500).json({ message: "Image update failed" });
  }
};

/* ===============================
   DELETE USER
================================ */
exports.deleteUser = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    await db.query("DELETE FROM addresses WHERE user_id=?", [userId]);
    await db.query("DELETE FROM users WHERE id=?", [userId]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("ADMIN DELETE USER ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

/* ===============================
   DELETE SINGLE ADDRESS
================================ */
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = Number(req.params.id);
    await db.query("DELETE FROM addresses WHERE id=?", [addressId]);
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};
