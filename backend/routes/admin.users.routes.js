const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const adminAuth = require("../middleware/adminAuth");
const controller = require("../controllers/admin.users.controller");

/* ================= MULTER CONFIG ================= */

// Ensure upload directory exists (Railway safe)
const uploadDir = path.join(process.cwd(), "uploads", "users");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique =
      "user_" + Date.now() + "_" + Math.round(Math.random() * 1e9) + ext;
    cb(null, unique);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"));
  }
  cb(null, true);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Safe upload wrapper
const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, err => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

/*
  ADMIN USER ROUTES

  GET     /api/admin/users
  PUT     /api/admin/users/:id
  DELETE  /api/admin/users/:id
  DELETE  /api/admin/users/address/:id
*/

// ✅ GET USERS
router.get("/", adminAuth, controller.getUsers);

// ✅ DELETE ADDRESS (keep above :id)
router.delete("/address/:id", adminAuth, controller.deleteAddress);

// ✅ UPDATE USER
router.put("/:id", adminAuth, uploadImage, controller.updateUser);

// ✅ DELETE USER
router.delete("/:id", adminAuth, controller.deleteUser);

module.exports = router;
