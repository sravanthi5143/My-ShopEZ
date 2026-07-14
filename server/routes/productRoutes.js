const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getTrendingProducts,
  getNewArrivalsProducts,
  getBestSellersProducts,
  getFeaturedProducts,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

router.get('/trending', getTrendingProducts);
router.get('/new-arrivals', getNewArrivalsProducts);
router.get('/best-sellers', getBestSellersProducts);
router.get('/featured', getFeaturedProducts);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
