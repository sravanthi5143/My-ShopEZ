const Review = require('../models/Review');
const Product = require('../models/Product');

// Helper to recalculate average rating and number of reviews for a product
const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId });
    const numReviews = reviews.length;
    const rating = numReviews > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews).toFixed(1))
      : 0;

    await Product.findByIdAndUpdate(productId, {
      rating,
      numReviews,
    });
  } catch (error) {
    console.error(`Failed to update rating for product ${productId}:`, error);
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add review for a product
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const ratingNum = Number(rating);

    if (!productId || isNaN(ratingNum) || !comment) {
      res.status(400).json({ message: 'Product ID, rating (1-5), and comment are required' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Prevent duplicate reviews
    const alreadyReviewed = await Review.findOne({
      product: productId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      res.status(400).json({ message: 'You have already reviewed this product' });
      return;
    }

    const review = new Review({
      product: productId,
      user: req.user._id,
      name: req.user.name,
      rating: ratingNum,
      comment,
    });

    const createdReview = await review.save();
    await updateProductRating(productId);

    res.status(201).json(createdReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const editReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const ratingNum = Number(rating);

    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Access control: only the reviewer can edit it
    if (review.user.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to edit this review' });
      return;
    }

    if (!isNaN(ratingNum)) review.rating = ratingNum;
    if (comment) review.comment = comment;

    const updatedReview = await review.save();
    await updateProductRating(review.product);

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Access control: reviewer OR admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to delete this review' });
      return;
    }

    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductReviews,
  addReview,
  editReview,
  deleteReview,
};
