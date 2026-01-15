const db = require("../config/db");

/* =========================
   GET USERS
========================= */
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, name, phone, alt_phone AS altPhone, image
      FROM users
      ORDER BY id DESC
    `);

    for (let u of users) {
      const [addresses] = await db.query(
        "SELECT id, address FROM addresses WHERE user_id=?",
        [u.id]
      );
      u.addresses = addresses;
    }

    res.json(users);
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE USER
========================= */
exports.updateUser = async (req, res) => {
  try {
    const { name, addresses } = req.body;
    const userId = req.params.id;

    await db.query("UPDATE users SET name=? WHERE id=?", [
      name,
      userId,
    ]);

    if (addresses) {
      await db.query("DELETE FROM addresses WHERE user_id=?", [userId]);

      const list = JSON.parse(addresses);
      for (let a of list) {
        await db.query(
          "INSERT INTO addresses (user_id, address) VALUES (?, ?)",
          [userId, a]
        );
      }
    }

    res.json({ message: "User updated" });
  } catch (err) {
    console.error("ADMIN UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   UPDATE IMAGE
========================= */
exports.updateUserImage = async (req, res) => {
  try {
    const imagePath = "/uploads/" + req.file.filename;

    await db.query(
      "UPDATE users SET image=? WHERE id=?",
      [imagePath, req.params.id]
    );

    res.json({ image: imagePath });
  } catch (err) {
    console.error("ADMIN IMAGE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE USER
========================= */
exports.deleteUser = async (req, res) => {
  try {
    await db.query("DELETE FROM addresses WHERE user_id=?", [req.params.id]);
    await db.query("DELETE FROM users WHERE id=?", [req.params.id]);

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
