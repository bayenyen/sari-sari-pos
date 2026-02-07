const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
require('dotenv').config();

async function deleteAllTransactions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sari-sari-pos');
        
        console.log('🗑️  Deleting all transactions...');
        const result = await Transaction.deleteMany({});
        
        console.log(`✅ Successfully deleted ${result.deletedCount} transaction(s)`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
}

deleteAllTransactions();
