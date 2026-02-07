const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authMiddleware, adminOnly, adminOrCashier } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active customers (accessible to admin and cashier) for checkout
router.get('/customers', authMiddleware, adminOrCashier, async (req, res) => {
  try {
    const customers = await User.find({ role: 'CUSTOMER', isActive: true }).select('-password').sort({ fullName: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, role, fullName, balance, creditLimit } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    let user;
    try {
      user = await User.create({
        username,
        password: hashedPassword,
        role,
        fullName,
        balance: balance || 0,
        creditLimit: creditLimit || 1000,
        isActive: true
      });
    } catch (err) {
      // Handle duplicate username race condition
      if (err && err.code === 11000) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      throw err;
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(`User created: ${user._id} (${user.username})`);
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { fullName, balance, isActive, password, creditLimit } = req.body;
    
    const updateData = {
      fullName,
      balance,
      isActive,
      creditLimit,
      updatedAt: Date.now()
    };

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Deactivate user (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Permanently delete user (Admin only)
router.delete('/:id/permanent', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Delete all transactions where this user was a customer (debt/sales records)
    await Transaction.deleteMany({
      $or: [
        { customerId: userId },  // Debt records for this customer
        { cashierId: userId }     // Sales records made by this cashier
      ]
    });
    
    // Delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User and all related records permanently deleted', userId });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
