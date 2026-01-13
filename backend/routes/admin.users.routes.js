const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const auth = require("../middleware/adminAuth");
const controller = require("../controllers/admin.users.controller");

/* ================= MULTER CONFIG ================= */

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "uploads", "users");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `user_${Date.now()}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"), false);
  }
  cb(null, true);
};

// Upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

/*
  ADMIN USER ROUTES

  GET     /api/admin/users
  PUT     /api/admin/users/:id
  DELETE  /api/admin/users/:id
  DELETE  /api/admin/users/address/:id
*/

// Get all users
router.get("/", auth, controller.getUsers);

// Delete address (must be above :id)
router.delete("/address/:id", auth, controller.deleteAddress);

// Update user (image optional)
router.put(
  "/:id",
  auth,
  upload.single("image"),
  controller.updateUser
);

// Delete user
router.delete("/:id", auth, controller.deleteUser);

module.exports = router;
