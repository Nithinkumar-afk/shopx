const router = require("express").Router();
const controller = require("../controllers/product.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, controller.addProduct);
router.delete("/:id", auth, controller.deleteProduct);

module.exports = router;
