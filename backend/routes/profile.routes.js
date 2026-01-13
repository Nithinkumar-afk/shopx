const express = require("express");
const router = express.Router();

const userAuth = require("../middleware/user.auth.middleware");
const upload = require("../middleware/uploadUserImage");
const controller = require("../controllers/profile.controller");

/* ================= PROFILE ================= */
router.get("/", userAuth, controller.getProfile);
router.put("/", userAuth, controller.updateProfile);

/* ================= PROFILE IMAGE ================= */
router.post(
  "/image",
  userAuth,
  upload.single("image"),
  controller.updateProfileImage
);

/* ================= ADDRESS ================= */
router.post("/address", userAuth, controller.addAddress);
router.delete("/address/:id", userAuth, controller.deleteAddress);

module.exports = router;
