const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      isPaid,
      paidAt,
      transactionId,
      paymentTime,
      couponCode,
      couponDiscount,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400).json({ message: 'No order items' });
      return;
    }

    // 1. Verify stock availability for all items first
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404).json({ message: `Product not found: ${item.product}` });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${product.name}. Only ${product.stock} left.` });
        return;
      }
    }

    // 2. Validate Coupon and update its status if applied
    let orderCouponCode = '';
    let orderCouponDiscount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!coupon) {
        res.status(404).json({ message: 'Coupon code not found' });
        return;
      }
      if (!coupon.isActive) {
        res.status(400).json({ message: 'Coupon code is inactive' });
        return;
      }

      // Expiry Check
      const now = new Date();
      const expiry = new Date(coupon.expiryDate);
      now.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      if (expiry < now) {
        res.status(400).json({ message: 'Coupon code has expired' });
        return;
      }

      // Usage Limits Check
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        res.status(400).json({ message: 'Coupon usage limit has been reached' });
        return;
      }

      // Single-use Check
      if (coupon.usedBy.includes(req.user._id)) {
        res.status(400).json({ message: 'You have already used this coupon code' });
        return;
      }

      // Increment usage counters
      coupon.usedCount += 1;
      coupon.usedBy.push(req.user._id);
      await coupon.save();

      orderCouponCode = coupon.code;
      orderCouponDiscount = couponDiscount || 0;
    }

    // 3. Decrement stock for all items
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const estDeliveryDate = new Date();
    estDeliveryDate.setDate(estDeliveryDate.getDate() + 7);

    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      isPaid: isPaid || false,
      paidAt: paidAt || null,
      transactionId,
      paymentTime,
      couponCode: orderCouponCode,
      couponDiscount: orderCouponDiscount,
      deliveryDate: estDeliveryDate,
    });

    const createdOrder = await order.save();
    
    // Notify admin dashboard
    const { createAdminNotification } = require('./adminController');
    await createAdminNotification(
      req,
      'New Order Placed',
      `A new order of ₹${createdOrder.totalPrice} has been placed.`,
      'success',
      '/admin/orders',
      createdOrder._id
    );

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('orderItems.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product');

    if (order) {
      // Access control: User who placed it OR admin
      if (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
        res.json(order);
      } else {
        res.status(403).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.orderStatus = 'Delivered';

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const { status } = req.body;
      if (!['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }
      
      const previousStatus = order.orderStatus;
      order.orderStatus = status;
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      } else if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
        // Restore inventory stock if cancelled
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
          });
        }
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel user order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    // Access control: only order placer can cancel it
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403).json({ message: 'Not authorized to cancel this order' });
      return;
    }

    // Only allow cancelling if order is in Pending state
    if (order.orderStatus !== 'Pending') {
      res.status(400).json({ message: `Cannot cancel order with status: ${order.orderStatus}` });
      return;
    }

    order.orderStatus = 'Cancelled';
    
    // Restore inventory stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToDelivered,
  updateOrderStatus,
  cancelOrder,
};
