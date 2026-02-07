const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// Get all transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, cashierId, customerId } = req.query;
    const query = { status: 'COMPLETED' };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (cashierId) {
      query.cashierId = cashierId;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer purchase history
router.get('/customer/:customerId/history', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      customerId: req.params.customerId,
      status: 'COMPLETED'
    }).sort({ createdAt: -1 }).limit(50);

    const customer = await User.findById(req.params.customerId);
    
    res.json({
      customer: {
        name: customer?.fullName,
        balance: customer?.balance,
        creditLimit: customer?.creditLimit
      },
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get sales report
router.get('/reports/sales', authMiddleware, async (req, res) => {
  try {
    const { period } = req.query; // 'daily' or 'monthly'
    const now = new Date();
    let startDate;

    if (period === 'daily') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      status: 'COMPLETED',
      createdAt: { $gte: startDate }
    });

    const totalSales = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;
    
    // Group by product
    const productSales = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!productSales[item.productName]) {
          productSales[item.productName] = {
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productName].quantity += item.quantity;
        productSales[item.productName].revenue += item.subtotal;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      period,
      totalSales,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      topProducts
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customers with debt
router.get('/reports/debts', authMiddleware, async (req, res) => {
  try {
    const customersWithDebt = await User.find({
      role: 'CUSTOMER',
      balance: { $lt: 0 },
      isActive: true
    }).select('-password').sort({ balance: 1 });

    const totalDebt = customersWithDebt.reduce((sum, c) => sum + Math.abs(c.balance), 0);

    res.json({
      customers: customersWithDebt,
      totalDebt,
      count: customersWithDebt.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create transaction (Cashier)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, amountPaid, paymentMethod, customerId } = req.body;
    const cashierId = req.userId;

    // Get cashier info
    const cashier = await User.findById(cashierId);
    if (!cashier) {
      return res.status(404).json({ error: 'Cashier not found' });
    }

    // Process items and update stock
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      processedItems.push({
        productId: product._id,
        productName: product.name,
        barcode: product.barcode,
        price: product.price,
        quantity: item.quantity,
        subtotal
      });

      // Update stock
      product.stock -= item.quantity;
      product.updatedAt = Date.now();
      await product.save();
    }

    // Get customer info if provided
    let customer = null;
    if (customerId) {
      customer = await User.findById(customerId);
      
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
    }

    // Handle payment methods
    let finalAmountPaid = amountPaid;
    let change = 0;

    if (paymentMethod === 'DEBT') {
      // Check if customer exists
      if (!customer) {
        return res.status(400).json({ error: 'Customer required for debt transactions' });
      }

      // Check credit limit
      const newBalance = customer.balance - totalAmount;
      const debtAmount = Math.abs(newBalance);
      
      if (debtAmount > customer.creditLimit) {
        return res.status(400).json({ 
          error: `Credit limit exceeded. Limit: ₱${customer.creditLimit}, Would be: ₱${debtAmount}` 
        });
      }

      // Add to customer's debt
      customer.balance -= totalAmount;
      await customer.save();

      finalAmountPaid = 0;
      change = 0;
    } else if (paymentMethod === 'PARTIAL') {
      // Partial payment - pay some cash, rest goes to debt
      if (!customer) {
        return res.status(400).json({ error: 'Customer required for partial payment' });
      }

      const remainingAmount = totalAmount - amountPaid;
      const newBalance = customer.balance - remainingAmount;
      const debtAmount = Math.abs(newBalance);
      
      if (debtAmount > customer.creditLimit) {
        return res.status(400).json({ 
          error: `Credit limit would be exceeded. Limit: ₱${customer.creditLimit}` 
        });
      }

      customer.balance -= remainingAmount;
      await customer.save();

      change = 0;
    } else if (paymentMethod === 'CASH') {
      change = amountPaid - totalAmount;
    }

    // Generate transaction number (ensure required field exists)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayCount = await Transaction.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } });
    const transactionNumber = `TXN${dateStr}${String(todayCount + 1).padStart(4, '0')}`;

    // Create transaction
    const transaction = await Transaction.create({
      transactionNumber,
      cashierId,
      cashierName: cashier.fullName,
      customerId: customer?._id,
      customerName: customer?.fullName,
      items: processedItems,
      totalAmount,
      amountPaid: finalAmountPaid,
      change: change,
      paymentMethod: paymentMethod || 'CASH',
      status: 'COMPLETED'
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pay debt (Customer pays their balance)
router.post('/pay-debt', authMiddleware, async (req, res) => {
  try {
    const { customerId, amount } = req.body;
    
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.balance >= 0) {
      return res.status(400).json({ error: 'Customer has no debt' });
    }

    // Add payment to balance (reducing debt)
    customer.balance += amount;
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({
      message: 'Payment recorded successfully',
      previousBalance: customer.balance - amount,
      amountPaid: amount,
      newBalance: customer.balance,
      remainingDebt: customer.balance < 0 ? Math.abs(customer.balance) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Adjust/Add debt to customer's balance (Cashier action)
router.post('/adjust-balance', authMiddleware, async (req, res) => {
  try {
    const { customerId, amount, note } = req.body;
    const cashierId = req.userId;

    const cashier = await User.findById(cashierId);
    if (!cashier) {
      return res.status(404).json({ error: 'Cashier not found' });
    }

    // Only CASHIER or ADMIN can perform this action
    if (!['CASHIER', 'ADMIN'].includes(cashier.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Calculate new balance and check credit limit
    const newBalance = customer.balance - amt; // balance decreases when debt increases
    const debtAmount = Math.abs(newBalance) || 0;
    if (debtAmount > (customer.creditLimit || 0)) {
      return res.status(400).json({ error: `Credit limit exceeded. Limit: ₱${customer.creditLimit || 0}` });
    }

    // Apply debt
    customer.balance = newBalance;
    customer.updatedAt = Date.now();
    await customer.save();

    // Generate transaction number (same logic as model pre-save)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const todayCount = await Transaction.countDocuments({ createdAt: { $gte: startOfDay, $lt: endOfDay } });
    const transactionNumber = `TXN${dateStr}${String(todayCount + 1).padStart(4, '0')}`;

    // Record as a transaction for audit trail
    const transaction = await Transaction.create({
      transactionNumber,
      cashierId,
      cashierName: cashier.fullName,
      customerId: customer._id,
      customerName: customer.fullName,
      items: [],
      totalAmount: amt,
      amountPaid: 0,
      change: 0,
      paymentMethod: 'DEBT',
      status: 'COMPLETED'
    });

    res.json({ message: 'Debt added successfully', transaction, newBalance: customer.balance });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
