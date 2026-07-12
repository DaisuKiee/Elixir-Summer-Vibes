// Repair Script - Fix Corrupted Challenge Data
// Run this with: node repair-challenges.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URL;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env file!');
    process.exit(1);
}

// Connect to MongoDB
console.log('🔌 Connecting to MongoDB...');
await mongoose.connect(MONGODB_URI);
console.log('✅ Connected to MongoDB');

// Get the collection directly (bypass schema validation)
const db = mongoose.connection.db;
const collection = db.collection('summerprofiles');

console.log('\n🔍 Finding corrupted profiles...');

// Find all profiles
const profiles = await collection.find({}).toArray();
console.log(`📊 Found ${profiles.length} profiles`);

let fixedCount = 0;

for (const profile of profiles) {
    let needsUpdate = false;
    const updates = {};
    
    console.log(`\n🔍 Checking profile ${profile._id}...`);
    
    // Check dailyChallenges
    if (profile.dailyChallenges) {
        console.log(`  dailyChallenges type: ${typeof profile.dailyChallenges}`);
        console.log(`  dailyChallenges is Array: ${Array.isArray(profile.dailyChallenges)}`);
        
        // Always clear challenges to force regeneration
        console.log(`  🔧 Clearing dailyChallenges for user ${profile._id}`);
        updates.dailyChallenges = [];
        needsUpdate = true;
    }
    
    // Check weeklyChallenges
    if (profile.weeklyChallenges) {
        console.log(`  weeklyChallenges type: ${typeof profile.weeklyChallenges}`);
        console.log(`  weeklyChallenges is Array: ${Array.isArray(profile.weeklyChallenges)}`);
        
        // Always clear challenges to force regeneration
        console.log(`  🔧 Clearing weeklyChallenges for user ${profile._id}`);
        updates.weeklyChallenges = [];
        needsUpdate = true;
    }
    
    // Apply updates
    if (needsUpdate) {
        await collection.updateOne(
            { _id: profile._id },
            { $set: updates }
        );
        fixedCount++;
        console.log(`✅ Fixed profile ${profile._id}`);
    } else {
        console.log(`  ℹ️  No challenges to clear`);
    }
}

console.log(`\n✨ Repair complete!`);
console.log(`📊 Fixed ${fixedCount} profiles`);
console.log(`\n💡 Users should now run !daily to generate fresh challenges`);

// Close connection
await mongoose.disconnect();
console.log('👋 Disconnected from MongoDB');
process.exit(0);
