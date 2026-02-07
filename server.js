const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Log connected database name (mask credentials)
    try {
      const dbName = mongoose.connection.name || process.env.MONGODB_URI;
      console.log(`✅ MongoDB Connected Successfully (DB: ${dbName})`);
    } catch (e) {
      console.log('✅ MongoDB Connected Successfully');
    }
    
    // Create default admin on first run
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Import Models
const User = require('./models/User');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');

// Create default admin
async function createDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
      
      await User.create({
        username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
        password: hashedPassword,
        role: 'ADMIN',
        fullName: 'System Administrator',
        isActive: true
      });
      console.log('✅ Default admin account created');
      console.log(`Username: ${process.env.DEFAULT_ADMIN_USERNAME || 'brayney'}`);
      console.log(`Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'brayney2005'}`);
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access the system at: http://localhost:${PORT}`);
  });
});
