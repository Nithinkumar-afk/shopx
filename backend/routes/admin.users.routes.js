const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadUserImage");
const controller = require("../controllers/admin.users.controller");

/* ===============================
   ADMIN USERS ROUTES (NO LOGIN)
   Base: /api/admin/users
================================ */

// GET ALL USERS
router.get("/", controller.getUsers);

// UPDATE USER (name + addresses)
router.put("/:id", controller.updateUser);

// UPDATE USER IMAGE
router.put(
  "/:id/image",
  upload.single("image"),
  controller.updateUserImage
);

// DELETE SINGLE ADDRESS
router.delete("/address/:id", controller.deleteAddress);

// DELETE USER
router.delete("/:id", controller.deleteUser);

module.exports = router;
