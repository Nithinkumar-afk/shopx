const express = require("express");
const router = express.Router();

const adminAuth = require("../middleware/adminAuth");
const controller = require("../controllers/admin.users.controller");

/*
  ADMIN USER ROUTES

  GET     /api/admin/users
  PUT     /api/admin/users/:id
  DELETE  /api/admin/users/:id
  DELETE  /api/admin/users/address/:id
*/

// ✅ GET ALL USERS
router.get("/", adminAuth, controller.getUsers);

// ✅ DELETE ADDRESS (keep above :id)
router.delete("/address/:id", adminAuth, controller.deleteAddress);

// ✅ UPDATE USER (NO IMAGE UPLOAD)
router.put("/:id", adminAuth, controller.updateUser);

// ✅ DELETE USER
router.delete("/:id", adminAuth, controller.deleteUser);

module.exports = router;
