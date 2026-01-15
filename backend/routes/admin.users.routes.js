const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/uploadUserImage");
const controller = require("../controllers/admin.users.controller");

// GET USERS
router.get("/", adminAuth, controller.getUsers);

// UPDATE USER
router.put("/:id", adminAuth, controller.updateUser);

// UPDATE IMAGE ✅ NEW
router.put(
  "/:id/image",
  adminAuth,
  upload.single("image"),
  controller.updateUserImage
);

// DELETE ADDRESS
router.delete("/address/:id", adminAuth, controller.deleteAddress);

// DELETE USER
router.delete("/:id", adminAuth, controller.deleteUser);

module.exports = router;
