const Coupon = require('../models/Coupon');

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, expiryDate, isActive, usageLimit } = req.body;

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      res.status(400).json({ message: 'Coupon code already exists' });
      return;
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      expiryDate,
      isActive: isActive !== false,
      usageLimit: usageLimit !== undefined ? usageLimit : null,
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update coupon details
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, expiryDate, isActive, usageLimit } = req.body;

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    if (code) {
      const codeUpper = code.toUpperCase();
      if (codeUpper !== coupon.code) {
        const codeExists = await Coupon.findOne({ code: codeUpper });
        if (codeExists) {
          res.status(400).json({ message: 'Coupon code already exists' });
          return;
        }
        coupon.code = codeUpper;
      }
    }

    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (expiryDate) coupon.expiryDate = expiryDate;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }

    await coupon.deleteOne();
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply coupon at checkout
// @route   POST /api/coupons/apply
// @access  Private
const applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || cartTotal === undefined) {
      res.status(400).json({ message: 'Coupon code and cart total are required' });
      return;
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      res.status(404).json({ message: 'Invalid coupon code' });
      return;
    }

    if (!coupon.isActive) {
      res.status(400).json({ message: 'Coupon code is inactive' });
      return;
    }

    // Validate Expiry Date
    const now = new Date();
    const expiry = new Date(coupon.expiryDate);
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    if (expiry < now) {
      res.status(400).json({ message: 'Coupon code has expired' });
      return;
    }

    // Validate Minimum Order Amount
    if (cartTotal < coupon.minPurchase) {
      res.status(400).json({ message: `Minimum order amount of ₹${coupon.minPurchase} is required` });
      return;
    }

    // Validate Usage Limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ message: 'Coupon code usage limit reached' });
      return;
    }

    // Prevent user duplicate usage
    if (coupon.usedBy.includes(req.user._id)) {
      res.status(400).json({ message: 'You have already redeemed this coupon code' });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }

    // Cap discount at total cart value
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    res.json({
      code: coupon.code,
      discount: Number(discount.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
};
