const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { authMiddleware, adminOrCashier } = require('../middleware/auth');

// Get all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search products
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product by barcode
router.get('/barcode/:barcode', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({ 
      barcode: req.params.barcode,
      isActive: true 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get low stock products
router.get('/alerts/low-stock', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).sort({ stock: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product purchase history (who bought this product)
router.get('/:id/purchase-history', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find all transactions containing this product
    const transactions = await Transaction.find({
      'items.productId': req.params.id,
      status: 'COMPLETED'
    }).sort({ createdAt: -1 }).limit(100);

    // Extract relevant purchase info
    const purchaseHistory = transactions.map(t => {
      const item = t.items.find(i => i.productId.toString() === req.params.id);
      return {
        transactionNumber: t.transactionNumber,
        customerName: t.customerName || 'Walk-in Customer',
        customerId: t.customerId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        date: t.createdAt,
        cashierName: t.cashierName
      };
    });

    res.json({
      product: {
        name: product.name,
        barcode: product.barcode
      },
      purchaseHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product restock history
router.get('/:id/restock-history', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      product: {
        name: product.name,
        barcode: product.barcode,
        currentStock: product.stock
      },
      restockHistory: product.restockHistory || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add restock entry (Admin only)
router.post('/:id/restock', authMiddleware, async (req, res) => {
  try {
    const { quantity, costPerUnit, supplier, notes } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalCost = quantity * costPerUnit;
    
    // Add to restock history
    product.restockHistory.push({
      quantity,
      costPerUnit,
      totalCost,
      supplier: supplier || 'N/A',
      restockedBy: req.userId,
      restockedByName: req.userRole === 'ADMIN' ? 'Admin' : 'Staff',
      notes: notes || '',
      restockDate: new Date()
    });

    // Update stock
    product.stock += quantity;
    product.updatedAt = Date.now();
    
    await product.save();

    res.json({
      message: 'Product restocked successfully',
      product,
      newStock: product.stock
    });
  } catch (error) {
    console.error('Restock error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (Admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, barcode, price, stock, category, lowStockThreshold } = req.body;

    // Check if barcode exists
    const existingProduct = await Product.findOne({ barcode });
    if (existingProduct) {
      return res.status(400).json({ error: 'Barcode already exists' });
    }

    const product = await Product.create({
      name,
      barcode,
      price,
      stock,
      category,
      lowStockThreshold: lowStockThreshold || 10
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product (Admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price, stock, category, lowStockThreshold, isActive } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        price, 
        stock, 
        category, 
        lowStockThreshold,
        isActive,
        updatedAt: Date.now() 
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
