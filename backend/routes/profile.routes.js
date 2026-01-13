const express = require("express");
const router = express.Router();

const auth = require("../middleware/userAuth");
const upload = require("../middleware/uploadUserImage");
const controller = require("../controllers/profile.controller");

router.get("/", auth, controller.getProfile);
router.put("/", auth, controller.updateProfile);

// 🔥 FILE UPLOAD
router.post(
  "/image",
  auth,
  upload.single("image"),
  controller.updateProfileImage
);

router.post("/address", auth, controller.addAddress);
router.delete("/address/:id", auth, controller.deleteAddress);

module.exports = router;
