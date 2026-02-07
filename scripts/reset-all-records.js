const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
require('dotenv').config();

async function resetAllRecords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sari-sari-pos');
        
        console.log('🗑️  Resetting all records...');
        
        // Delete all transactions
        const transResult = await Transaction.deleteMany({});
        console.log(`✅ Deleted ${transResult.deletedCount} transaction(s)`);
        
        // Reset all customer balances to 0
        const userResult = await User.updateMany(
            { role: 'CUSTOMER' },
            { balance: 0 }
        );
        console.log(`✅ Reset ${userResult.modifiedCount} customer balance(s) to 0`);
        
        console.log('✅ All records have been reset!');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

resetAllRecords();
