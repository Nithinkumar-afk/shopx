const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* ===============================
   ADMIN – GET ALL USERS
================================ */
router.get("/", async (req,res)=>{
  const [users] = await db.query(
    "SELECT id,name,email FROM users ORDER BY id DESC"
  );
  res.json(users);
});

/* ===============================
   ADMIN – DELETE USER
================================ */
router.delete("/:id", async (req,res)=>{
  await db.query("DELETE FROM users WHERE id=?", [req.params.id]);
  res.json({ success:true });
});

module.exports = router;
