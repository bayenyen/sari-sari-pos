#!/usr/bin/env node
/**
 * Cleanup duplicate users by username.
 * - Finds usernames with >1 documents
 * - Backs up all duplicate docs into ./backups/duplicates-<timestamp>.json
 * - For each username, keeps the oldest document (by createdAt) and removes the rest
 *
 * Usage: node scripts/cleanup-duplicate-users.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI not set in environment (.env)');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, {
    // options kept minimal, mongoose 6+ doesn't need legacy flags
  });

  const User = require('../models/User');

  console.log('Connected to MongoDB. Searching for duplicate usernames...');

  const duplicates = await User.aggregate([
    { $group: { _id: '$username', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (!duplicates || duplicates.length === 0) {
    console.log('No duplicate usernames found.');
    await mongoose.disconnect();
    return;
  }

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `duplicates-${timestamp}.json`);

  const allDuplicateDocs = [];

  for (const group of duplicates) {
    const username = group._id;
    const docs = await User.find({ username }).sort({ createdAt: 1 }).lean();
    if (docs.length <= 1) continue;
    allDuplicateDocs.push({ username, docs });
  }

  // Write backup
  fs.writeFileSync(backupFile, JSON.stringify(allDuplicateDocs, null, 2), 'utf8');
  console.log(`Backed up ${allDuplicateDocs.length} duplicate username groups to ${backupFile}`);

  // Remove duplicates while keeping the oldest (first) document
  let totalRemoved = 0;
  for (const entry of allDuplicateDocs) {
    const docs = entry.docs;
    const keeper = docs[0];
    const toRemove = docs.slice(1);
    const idsToRemove = toRemove.map(d => d._id);

    if (idsToRemove.length > 0) {
      const res = await User.deleteMany({ _id: { $in: idsToRemove } });
      totalRemoved += res.deletedCount || 0;
      console.log(`Username '${entry.username}': kept _id=${keeper._id}, removed ${res.deletedCount || 0} duplicates`);
    }
  }

  console.log(`Finished. Total duplicate documents removed: ${totalRemoved}`);
  console.log(`Backup file: ${backupFile}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
