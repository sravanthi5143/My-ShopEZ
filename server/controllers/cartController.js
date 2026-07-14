const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to recalculate total price of cart
const recalculateCart = async (cart) => {
  let total = 0;
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const activePrice = product.discountPrice || product.price;
      total += activePrice * item.quantity;
    }
  }
  cart.totalPrice = Number(total.toFixed(2));
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], totalPrice: 0 });
    }
    
    // Clean up stale items where product was deleted/not found from DB
    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product);
    if (cart.items.length !== initialLength) {
      await recalculateCart(cart);
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const parsedQty = parseInt(quantity, 10) || 1;

    if (!productId) {
      res.status(400).json({ message: 'Product ID is required' });
      return;
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], totalPrice: 0 });
    }

    // Check if product already in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let targetQty = parsedQty;
    if (itemIndex > -1) {
      targetQty = cart.items[itemIndex].quantity + parsedQty;
    }

    if (targetQty > product.stock) {
      res.status(400).json({ message: `Only ${product.stock} units of ${product.name} are in stock.` });
      return;
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = targetQty;
    } else {
      cart.items.push({ product: productId, quantity: parsedQty });
    }

    await recalculateCart(cart);
    await cart.save();

    const populatedCart = await cart.populate('items.product');
    res.status(201).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const parsedQty = parseInt(quantity, 10);

    if (isNaN(parsedQty) || parsedQty < 1) {
      res.status(400).json({ message: 'Quantity must be at least 1' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (parsedQty > product.stock) {
      res.status(400).json({ message: `Only ${product.stock} units of ${product.name} are in stock.` });
      return;
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = parsedQty;
      await recalculateCart(cart);
      await cart.save();
      const populatedCart = await cart.populate('items.product');
      res.json(populatedCart);
    } else {
      res.status(404).json({ message: 'Product not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404).json({ message: 'Cart not found' });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      await recalculateCart(cart);
      await cart.save();
      const populatedCart = await cart.populate('items.product');
      res.json(populatedCart);
    } else {
      res.status(404).json({ message: 'Product not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
