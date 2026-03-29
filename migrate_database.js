const mongoose = require('mongoose');

// OLD DATABASE (SOURCE)
const SOURCE_URI = 'mongodb+srv://balajisathyanarayanan09062004_db_user:B170604@photo-studio.hjovjto.mongodb.net/Portfolio?retryWrites=true&w=majority&appName=Photo-studio';

// NEW DATABASE (TARGET)
const TARGET_URI = 'mongodb+srv://Admin:Admin@123@studio-database.dzoptoy.mongodb.net/Portfolio?appName=studio-database';

const COLLECTIONS = [
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
    'contact',
    'inner_images'
];

async function migrate() {
    let sourceConn, targetConn;
    try {
        console.log('Connecting to SOURCE MongoDB...');
        sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();
        console.log('✅ Connected to SOURCE.');

        console.log('Connecting to TARGET MongoDB...');
        targetConn = await mongoose.createConnection(TARGET_URI).asPromise();
        console.log('✅ Connected to TARGET.');

        for (const collName of COLLECTIONS) {
            console.log(`Migrating collection: ${collName}...`);

            // Use the listCollections search to verify existence
            const list = await sourceConn.db.listCollections({ name: collName }).toArray();
            if (list.length === 0) {
                console.log(`⚠️ Collection ${collName} not found in source. Skipping.`);
                continue;
            }

            const sourceColl = sourceConn.db.collection(collName);
            const targetColl = targetConn.db.collection(collName);

            // Fetch all documents from source
            const data = await sourceColl.find({}).toArray();
            console.log(`   Found ${data.length} documents.`);

            if (data.length > 0) {
                // Clear target collection first
                await targetColl.deleteMany({});
                console.log(`   Cleared target collection ${collName}.`);

                // Insert all into target
                await targetColl.insertMany(data);
                console.log(`   ✅ Successfully migrated ${data.length} documents.`);
            } else {
                console.log(`   No data to migrate for ${collName}.`);
            }
        }

        console.log('\n🎉 DATABASE MIGRATION COMPLETE!');

    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        if (sourceConn) await sourceConn.close();
        if (targetConn) await targetConn.close();
        process.exit(0);
    }
}

migrate();
