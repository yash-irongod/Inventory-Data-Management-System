const express = require("express");
const productController = require("../controllers/productController");
const validateProduct = require("../middleware/validateProduct");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.route("/").post(validateProduct, productController.createProduct).get(productController.getProducts);
router.get("/low-stock", productController.getLowStockProducts);
router.get("/summary", productController.getInventorySummary);
router.get("/:id", validateObjectId, productController.getProductById);
router.put("/:id", validateObjectId, validateProduct, productController.updateProduct);
router.patch("/:id/stock", validateObjectId, productController.adjustStock);
router.delete("/:id", validateObjectId, productController.deleteProduct);

module.exports = router;
