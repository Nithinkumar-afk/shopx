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

    return res.json(result);
  } catch (err) {
    console.error("ADMIN GET USERS ERROR:", err);
    return res.status(500).json({ message: "Failed to load users" });
  }
};

/* ================= UPDATE USER ================= */
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  let { name, addresses } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  // ✅ Parse addresses safely
  if (typeof addresses === "string") {
    try {
      addresses = JSON.parse(addresses);
    } catch {
      addresses = [];
    }
  }

  if (!Array.isArray(addresses)) {
    addresses = [];
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // ✅ Check user exists
    const [[existingUser]] = await conn.query(
      "SELECT id FROM users WHERE id=?",
      [id]
    );

    if (!existingUser) {
      await conn.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Update user (NO IMAGE HANDLING HERE)
    await conn.query(
      "UPDATE users SET name=? WHERE id=?",
      [name.trim(), id]
    );

    // ✅ Replace addresses (same logic as profile)
    await conn.query("DELETE FROM addresses WHERE user_id=?", [id]);

    for (const addr of addresses) {
      if (typeof addr === "string" && addr.trim()) {
        await conn.query(
          "INSERT INTO addresses (user_id, address) VALUES (?,?)",
          [id, addr.trim()]
        );
      }
    }

    await conn.commit();
    return res.json({ message: "User updated successfully" });

  } catch (err) {
    await conn.rollback();
    console.error("ADMIN UPDATE USER ERROR:", err);
    return res.status(500).json({ message: "Update failed" });
  } finally {
    conn.release();
  }
};

/* ================= DELETE USER ================= */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[user]] = await conn.query(
      "SELECT image FROM users WHERE id=?",
      [id]
    );

    if (!user) {
      await conn.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    if (user.image && user.image.startsWith("/uploads/")) {
      const imgPath = path.join(process.cwd(), user.image);
      try {
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      } catch (err) {
        console.warn("IMAGE DELETE FAILED:", err.message);
      }
    }

    await conn.query("DELETE FROM addresses WHERE user_id=?", [id]);
    await conn.query("DELETE FROM users WHERE id=?", [id]);

    await conn.commit();
    return res.json({ message: "User deleted successfully" });

  } catch (err) {
    await conn.rollback();
    console.error("ADMIN DELETE USER ERROR:", err);
    return res.status(500).json({ message: "Delete failed" });
  } finally {
    conn.release();
  }
};

/* ================= DELETE ADDRESS ================= */
exports.deleteAddress = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ message: "Invalid address ID" });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM addresses WHERE id=?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.json({ message: "Address deleted successfully" });

  } catch (err) {
    console.error("ADMIN DELETE ADDRESS ERROR:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};
