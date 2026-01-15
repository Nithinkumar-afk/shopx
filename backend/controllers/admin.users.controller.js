const db = require("../config/db");
const path = require("path");
const fs = require("fs");

/* ================= GET ALL USERS ================= */
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT id, name, phone, alt_phone, image
      FROM users
      ORDER BY id DESC
    `);

    const [addresses] = await db.query(`
      SELECT id, user_id, address
      FROM addresses
    `);

    const result = users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone || null,
      altPhone: u.alt_phone || null,
      image: u.image || null,
      addresses: addresses
        .filter(a => a.user_id === u.id)
        .map(a => ({
          id: a.id,
          address: a.address
        }))
    }));

    res.json(result);
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
};

/* ================= UPDATE USER (NO IMAGE) ================= */
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  let { name, addresses } = req.body;

  if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
  if (!name?.trim()) return res.status(400).json({ message: "Name required" });

  if (typeof addresses === "string") {
    try { addresses = JSON.parse(addresses); } catch { addresses = []; }
  }
  if (!Array.isArray(addresses)) addresses = [];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("UPDATE users SET name=? WHERE id=?", [name.trim(), id]);
    await conn.query("DELETE FROM addresses WHERE user_id=?", [id]);

    for (const a of addresses) {
      if (typeof a === "string" && a.trim()) {
        await conn.query(
          "INSERT INTO addresses (user_id, address) VALUES (?,?)",
          [id, a.trim()]
        );
      }
    }

    await conn.commit();
    res.json({ message: "User updated" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  } finally {
    conn.release();
  }
};

/* ================= UPDATE USER IMAGE (NEW ✅) ================= */
exports.updateUserImage = async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "Image required" });
  }

  try {
    const [[old]] = await db.query(
      "SELECT image FROM users WHERE id=?",
      [id]
    );

    if (old?.image && old.image.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "..", old.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const imagePath = "/uploads/users/" + req.file.filename;

    await db.query(
      "UPDATE users SET image=? WHERE id=?",
      [imagePath, id]
    );

    res.json({ message: "Image updated", image: imagePath });
  } catch (err) {
    console.error("ADMIN IMAGE ERROR:", err);
    res.status(500).json({ message: "Image update failed" });
  }
};

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[u]] = await conn.query(
      "SELECT image FROM users WHERE id=?",
      [id]
    );

    if (u?.image?.startsWith("/uploads/")) {
      const img = path.join(__dirname, "..", u.image);
      if (fs.existsSync(img)) fs.unlinkSync(img);
    }

    await conn.query("DELETE FROM addresses WHERE user_id=?", [id]);
    await conn.query("DELETE FROM users WHERE id=?", [id]);

    await conn.commit();
    res.json({ message: "User deleted" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: "Delete failed" });
  } finally {
    conn.release();
  }
};

/* ================= DELETE ADDRESS ================= */
exports.deleteAddress = async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM addresses WHERE id=?", [id]);
  res.json({ message: "Address deleted" });
};
