const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/uploadUserImage");
const controller = require("../controllers/admin.users.controller");

// GET USERS
router.get("/", adminAuth, controller.getUsers);

// UPDATE USER (NO IMAGE)
router.put("/:id", adminAuth, controller.updateUser);

// UPDATE USER IMAGE ✅
router.put(
  "/:id/image",
  adminAuth,
  upload.single("image"),
  controller.updateUserImage
);

// DELETE USER
router.delete("/:id", adminAuth, controller.deleteUser);

// DELETE ADDRESS
router.delete("/address/:id", adminAuth, controller.deleteAddress);

module.exports = router;
