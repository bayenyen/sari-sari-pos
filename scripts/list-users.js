const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function listUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sari-sari-pos';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const users = await User.find().select('username role fullName isActive createdAt');
    
    if (users.length === 0) {
      console.log('No users found');
    } else {
      console.log('Current users in database:');
      console.log('─'.repeat(70));
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   ID: ${user._id}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listUsers();
