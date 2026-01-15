const express = require("express");
const router = express.Router();

/* AUTH */
const userAuth = require("../middleware/userAuth");

/* CONTROLLER */
const profileController = require("../controllers/profile.controller");

/* ================================
   PROFILE ROUTES
================================ */

// GET profile
router.get("/", userAuth, profileController.getProfile);

// UPDATE profile
router.put("/", userAuth, profileController.updateProfile);

// UPDATE profile image
router.put("/image", userAuth, profileController.updateProfileImage);

// ADD address
router.post("/address", userAuth, profileController.addAddress);

// DELETE address
router.delete("/address/:id", userAuth, profileController.deleteAddress);

module.exports = router;
