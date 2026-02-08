const mongoose = require('mongoose');

const restockHistorySchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: true
  },
  costPerUnit: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  supplier: {
    type: String,
    default: 'N/A'
  },
  restockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  restockedByName: String,
  notes: String,
  restockDate: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  restockHistory: [restockHistorySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
// Keep the `unique: true` on the `barcode` field above; remove the duplicate index declaration.
productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
