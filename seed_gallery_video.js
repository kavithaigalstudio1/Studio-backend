// seed_gallery_video.js
// Run: node seed_gallery_video.js
// This will create the 'Gallary video' collection in MongoDB

const mongoose = require('mongoose');
require('dotenv').config();

const GalleryVideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumb: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Explicitly bind to the collection name 'Gallary video'
const GalleryVideoModel = mongoose.model('GalleryVideo', GalleryVideoSchema, 'Gallary video');

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'Portfolio' });
        console.log('Connected to MongoDB - Portfolio database');

        // Check if collection already has data
        const existing = await GalleryVideoModel.countDocuments();
        if (existing > 0) {
            console.log(`Collection "Gallary video" already exists with ${existing} document(s). No seed needed.`);
            await mongoose.disconnect();
            return;
        }

        // Insert a sample document so MongoDB creates the collection
        const sample = new GalleryVideoModel({
            title: 'Sample Film',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
            order: 0
        });

        await sample.save();
        console.log('✅ Success! Collection "Gallary video" created in MongoDB with 1 sample document.');
        console.log('   You can now see it in MongoDB Atlas or Compass.');
        console.log('   You can add real videos via the Admin panel (Gallery tab).');
        console.log('   The sample can be deleted from the Admin panel if needed.');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

seed();
