const mongoose = require('mongoose');

const transactionItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: String,
  barcode: String,
  price: Number,
  quantity: Number,
  subtotal: Number
});

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true,
    unique: true
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cashierName: String,
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerName: String,
  items: [transactionItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  change: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'DEBT', 'PARTIAL'],
    default: 'CASH',
    comment: 'CASH = full payment, DEBT = all on credit, PARTIAL = some cash + rest on credit'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'VOID'],
    default: 'COMPLETED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate transaction number
transactionSchema.pre('save', async function(next) {
  if (!this.transactionNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Transaction').countDocuments({
      createdAt: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });
    this.transactionNumber = `TXN${dateStr}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
