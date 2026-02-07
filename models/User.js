const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'CASHIER', 'CUSTOMER'],
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    comment: 'Positive = store credit, Negative = debt owed to store'
  },
  creditLimit: {
    type: Number,
    default: 1000,
    comment: 'Maximum debt allowed for customer'
  },
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

module.exports = mongoose.model('User', userSchema);
