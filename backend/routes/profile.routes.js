const express = require("express");
const router = express.Router();

const auth = require("../middleware/userAuth"); // normal user auth
const upload = require("../middleware/uploadUserImage");

const controller = require("../controllers/profile.controller");

/* PROFILE */
router.get("/", auth, controller.getProfile);
router.put("/", auth, controller.updateProfile);

/* IMAGE */
router.post("/image", auth, upload.single("image"), controller.updateProfileImage);

/* ADDRESS */
router.post("/address", auth, controller.addAddress);
router.delete("/address/:id", auth, controller.deleteAddress);

module.exports = router;
