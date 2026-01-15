const express = require("express");
const router = express.Router();

const userAuth = require("../middleware/userAuth");
const upload = require("../middleware/uploadUserImage");
const controller = require("../controllers/profile.controller");

/* ==============================
   PROFILE ROUTES
============================== */

// GET PROFILE
router.get("/", userAuth, controller.getProfile);

// UPDATE PROFILE
router.put("/", userAuth, controller.updateProfile);

// UPDATE PROFILE IMAGE
router.put(
  "/image",
  userAuth,
  upload.single("image"),
  controller.updateProfileImage
);

// ADD ADDRESS
router.post("/address", userAuth, controller.addAddress);

// DELETE ADDRESS
router.delete("/address/:id", userAuth, controller.deleteAddress);

module.exports = router;
