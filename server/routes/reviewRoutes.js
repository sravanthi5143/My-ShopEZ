const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  addReview,
  editReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/product/:productId')
  .get(getProductReviews);

router.route('/')
  .post(protect, addReview);

router.route('/:id')
  .put(protect, editReview)
  .delete(protect, deleteReview);

module.exports = router;
