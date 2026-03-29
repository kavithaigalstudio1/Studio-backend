const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://balajisathyanarayanan09062004_db_user:B170604@photo-studio.hjovjto.mongodb.net/Portfolio?retryWrites=true&w=majority&appName=Photo-studio';

async function cleanup() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri, { dbName: 'Portfolio' });
        console.log("✅ Connected to MongoDB.");

        const collectionsToInitialize = [
            'gallary',
            'montages',
            'Reviews',
            'ReviewVideos',
            'Gallary video',
            'portait',
            'pre wedding',
            'wedding',
            'resiption',
            'model shoot',
            'engaement',
            'contact'
        ];

        console.log("🚀 STARTING COMPLETELY FRESH DATABASE SETUP...");

        for (const collName of collectionsToInitialize) {
            // 1. Drop existing to reclaim that 1.2GB "ghost" space
            const existing = await mongoose.connection.db.listCollections({ name: collName }).toArray();
            if (existing.length > 0) {
                await mongoose.connection.db.dropCollection(collName);
                console.log(`🗑️ Dropped and Cleaned: '${collName}'`);
            }

            // 2. Explicitly create the collection so it shows up in your MongoDB Data Explorer
            await mongoose.connection.db.createCollection(collName);
            console.log(`✨ Created Fresh Collection: '${collName}'`);
        }

        console.log("\n✅ ALL COLLECTIONS CREATED SUCCESSFULLY!");
        console.log("------------------------------------------");
        console.log("Your MongoDB is now 100% CLEAN and FRESH.");
        console.log("You can now go to Admin Panel and start adding content.");

    } catch (err) {
        console.error("❌ Error during Setup:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

cleanup();
