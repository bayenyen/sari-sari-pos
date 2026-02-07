const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function deleteTestUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sari-sari-pos';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find the Customer test user by full name or username pattern
    const testUser = await User.findOne({ 
      $or: [
        { fullName: 'Customer Test' },
        { username: { $regex: 'cust_test' } }
      ]
    });
    
    if (!testUser) {
      console.log('❌ Customer test user not found');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found test user: ${testUser.username} (ID: ${testUser._id})`);
    
    // Delete the user permanently
    const result = await User.findByIdAndDelete(testUser._id);
    
    if (result) {
      console.log(`✅ Successfully deleted test user: ${result.username}`);
    } else {
      console.log('❌ Failed to delete test user');
    }

    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

deleteTestUser();
