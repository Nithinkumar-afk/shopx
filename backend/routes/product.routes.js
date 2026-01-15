const express = require("express");
const router = express.Router();

const {
  getProducts
} = require("../controllers/products.controller");

/*
|--------------------------------------------------------------------------
| PUBLIC PRODUCT ROUTES
|--------------------------------------------------------------------------
| Base path: /api/products
| Access: Public (No Auth)
|--------------------------------------------------------------------------
*/

router.get("/", getProducts);

module.exports = router;
