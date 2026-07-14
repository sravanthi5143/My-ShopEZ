const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please add all required fields' });
      return;
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
    });

    if (user) {
      // Notify admin dashboard
      const { createAdminNotification } = require('./adminController');
      await createAdminNotification(
        req,
        'New Customer Signup',
        `Customer "${user.name}" has registered on the store.`,
        'success',
        '/admin/users',
        user._id
      );

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[DEBUG-BACKEND] Request received. Login attempt for: ${email}`);

    if (!email || !password) {
      console.log('[DEBUG-BACKEND] Validation failed: Missing email or password');
      res.status(400).json({ message: 'Please provide both email and password' });
      return;
    }

    // Check for user email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[DEBUG-BACKEND] Login failed: User not found for: ${email}`);
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    console.log(`[DEBUG-BACKEND] User found in database. Hashed password retrieved. Role: ${user.role}`);
    const isMatch = await user.matchPassword(password);
    console.log(`[DEBUG-BACKEND] Password matching execution. Result: ${isMatch}`);

    if (isMatch) {
      const token = generateToken(user._id);
      console.log('[DEBUG-BACKEND] JWT generated successfully.');

      const responsePayload = {
        success: true,
        token: token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        role: user.role,
      };
      
      console.log('[DEBUG-BACKEND] Response sent. Success payload prepared.');
      res.json(responsePayload);
    } else {
      console.log('[DEBUG-BACKEND] Login failed: Password mismatch for user.');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('[DEBUG-BACKEND] Internal Server Error:', error.message);
    res.status(500).json({ message: 'Server error. Failed to process authentication.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
