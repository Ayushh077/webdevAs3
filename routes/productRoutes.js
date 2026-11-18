const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getInventorySummary,
  updateStockLevel,
} = require('../controllers/productController');

router.route('/low-stock').get(getLowStockProducts);
router.route('/summary').get(getInventorySummary);

router.route('/').get(getProducts).post(createProduct);

router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct);
router.route('/:id/stock').patch(updateStockLevel);

module.exports = router;