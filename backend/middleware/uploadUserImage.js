const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =====================================================
   SAFE UPLOAD DIRECTORY
===================================================== */
const uploadDir = path.join(__dirname, "..", "uploads", "users");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* =====================================================
   STORAGE CONFIG
===================================================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `user_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

/* =====================================================
   FILE FILTER
===================================================== */
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

/* =====================================================
   EXPORT MULTER
===================================================== */
module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});
