const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'Portfolio' // Explicitly set Database Name
})
    .then(() => console.log('MongoDB Connected to Portfolio Database...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schemas & Models
const ImageSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const MontageSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    url: { type: String, required: true },
    thumb: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const ReviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    shootType: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// Create models binding to exact collection names
const GalleryModel = mongoose.model('Gallery', ImageSchema, 'gallary');
const MontagesModel = mongoose.model('Montages', MontageSchema, 'montages');
const ReviewModel = mongoose.model('Review', ReviewSchema, 'Reviews');

const ReviewVideoSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumb: { type: String, default: '' },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const ReviewVideoModel = mongoose.model('ReviewVideo', ReviewVideoSchema, 'ReviewVideos');

const GalleryVideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumb: { type: String, required: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const GalleryVideoModel = mongoose.model('GalleryVideo', GalleryVideoSchema, 'Gallary video');

// Portfolio Categories Mapping to Collections
// Note: We keep the exact collection names to maintain connection with existing data
const portfolioModels = {
    'Portraits': mongoose.model('Portraits', ImageSchema, 'portait'),
    'Pre Weddings': mongoose.model('PreWeddings', ImageSchema, 'pre wedding'),
    'Weddings': mongoose.model('Weddings', ImageSchema, 'wedding'),
    'Reception': mongoose.model('Reception', ImageSchema, 'resiption'),
    'Model Shoot': mongoose.model('ModelShoot', ImageSchema, 'model shoot'),
    'Engagement': mongoose.model('Engagement', ImageSchema, 'engaement')
};

// Middleware for request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        // Gallery stats
        const galleryImageCount = await GalleryModel.countDocuments();
        const galleryVideoCount = await GalleryVideoModel.countDocuments();

        // Montages stats
        const montageCount = await MontagesModel.countDocuments();

        // Review stats
        const reviewTextCount = await ReviewModel.countDocuments();
        const reviewVideoCount = await ReviewVideoModel.countDocuments();

        // Portfolio stats (sum across all categories)
        let portfolioImageCount = 0;
        for (const cat in portfolioModels) {
            const count = await portfolioModels[cat].countDocuments();
            portfolioImageCount += count;
        }

        res.json({
            galleryImages: galleryImageCount,
            galleryVideos: galleryVideoCount,
            montages: montageCount,
            reviewTexts: reviewTextCount,
            reviewVideos: reviewVideoCount,
            portfolioImages: portfolioImageCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- API Routes ----

// Gallery
app.get('/api/gallery', async (req, res) => {
    try {
        const images = await GalleryModel.find().sort({ order: 1 });
        res.json(images.map(img => img.imageUrl));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/gallery', async (req, res) => {
    try {
        const { images } = req.body;
        await GalleryModel.deleteMany({});
        if (images && images.length > 0) {
            const newImages = images.map((url, index) => ({ imageUrl: url, order: index }));
            await GalleryModel.insertMany(newImages);
        }
        res.json({ message: 'Gallery updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Portfolio Categories
app.get('/api/portfolio/:category', async (req, res) => {
    try {
        const categoryName = req.params.category;
        const Model = portfolioModels[categoryName];
        if (!Model) return res.status(404).json({ error: 'Category not found' });

        const images = await Model.find().sort({ order: 1 });
        res.json(images.map(img => img.imageUrl));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/portfolio/:category', async (req, res) => {
    try {
        const categoryName = req.params.category;
        console.log(`Updating portfolio for category: ${categoryName}`);

        const Model = portfolioModels[categoryName];
        if (!Model) {
            console.error(`Error: Model for category "${categoryName}" not found.`);
            return res.status(404).json({ error: 'Category not found' });
        }

        const { images } = req.body;
        console.log(`Received ${images ? images.length : 0} images for ${categoryName}`);

        await Model.deleteMany({});
        if (images && images.length > 0) {
            const newImages = images.map((url, index) => {
                // Warning if single image is too large for MongoDB (16MB BSON limit)
                if (url.length > 20 * 1024 * 1024) { // ~20MB string is likely > 16MB BSON
                    console.warn(`Warning: Image at index ${index} is very large (${Math.round(url.length / (1024 * 1024))}MB) and may fail to save.`);
                }
                return { imageUrl: url, order: index };
            });
            await Model.insertMany(newImages);
            console.log(`Successfully saved ${newImages.length} images to ${categoryName}`);
        }
        res.json({ message: `${categoryName} gallery updated successfully` });
    } catch (err) {
        console.error(`Database Error for ${req.params.category}:`, err);
        res.status(500).json({ error: err.message });
    }
});

// Montages
app.get('/api/montages', async (req, res) => {
    try {
        const montages = await MontagesModel.find().sort({ order: 1 });
        res.json(montages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/montages', async (req, res) => {
    try {
        const { montages } = req.body;
        console.log(`Updating Montages: Received ${montages ? montages.length : 0} items`);

        await MontagesModel.deleteMany({});
        if (montages && montages.length > 0) {
            const newMontages = montages.map((mon, index) => {
                // Check for large Base64 strings in url or thumb
                if ((mon.url && mon.url.length > 15 * 1024 * 1024) || (mon.thumb && mon.thumb.length > 15 * 1024 * 1024)) {
                    console.warn(`Warning: Montage at index ${index} has a very large file. MongoDB documents must be under 16MB. Consider using external URLs for videos.`);
                }
                return { ...mon, order: index };
            });
            await MontagesModel.insertMany(newMontages);
            console.log(`Successfully saved ${newMontages.length} montages.`);
        }
        res.json({ message: 'Montages updated successfully' });
    } catch (err) {
        console.error('Database Error for Montages:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await ReviewModel.find().sort({ stars: -1, createdAt: -1 }).limit(6);
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { name, shootType, stars, reviewText } = req.body;
        const newReview = new ReviewModel({ name, shootType, stars, reviewText });
        await newReview.save();
        res.json({ message: 'Review submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await ReviewModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Review Videos
app.get('/api/review-videos', async (req, res) => {
    try {
        const videos = await ReviewVideoModel.find().sort({ order: 1 }).limit(12); // Increased limit for both pages
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/review-videos', async (req, res) => {
    try {
        const { videos } = req.body;
        await ReviewVideoModel.deleteMany({});
        if (videos && videos.length > 0) {
            const newVideos = videos.map((v, index) => ({
                title: v.title || '',
                videoUrl: v.videoUrl || v.url || '',
                thumb: v.thumb || '',
                order: index
            }));
            await ReviewVideoModel.insertMany(newVideos);
        }
        res.json({ message: 'Review videos updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Gallery Films - Using dedicated "Gallary video" collection
app.get('/api/gallery-films', async (req, res) => {
    try {
        const films = await GalleryVideoModel.find().sort({ order: 1 });
        res.json(films);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/gallery-films', async (req, res) => {
    try {
        const { films } = req.body;
        await GalleryVideoModel.deleteMany({});
        if (films && films.length > 0) {
            const newVideos = films.map((f, index) => ({
                title: f.title,
                url: f.url,
                thumb: f.thumb,
                order: index
            }));
            await GalleryVideoModel.insertMany(newVideos);
        }
        res.json({ message: 'Gallery videos saved to dedicated collection successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;

// ---- Contact Info (MongoDB collection: "contact") ----
const ContactInfoSchema = new mongoose.Schema({
    phone1: { type: String, default: '' },
    phone2: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    instagram: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    mapsUrl: { type: String, default: '' },
    workingHours: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});
const ContactInfoModel = mongoose.model('ContactInfo', ContactInfoSchema, 'contact');

// GET contact info
app.get('/api/contact-info', async (req, res) => {
    try {
        let info = await ContactInfoModel.findOne({});
        if (!info) {
            info = await ContactInfoModel.create({
                phone1: '+91 93846 84082',
                phone2: '',
                email: 'kavithaigalstudio@gmail.com',
                address: 'Tamil Nadu, India',
                instagram: 'https://www.instagram.com/kavithaigal_studio',
                whatsapp: 'https://wa.me/919384684082',
                mapsUrl: '',
                workingHours: 'Mon – Sat: 9 AM – 7 PM'
            });
        }
        res.json(info);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT (update) contact info — admin only
app.put('/api/contact-info', async (req, res) => {
    try {
        const update = { ...req.body, updatedAt: new Date() };
        const info = await ContactInfoModel.findOne({});
        if (!info) {
            const created = await ContactInfoModel.create(update);
            return res.json({ message: 'Contact info created successfully', data: created });
        }
        await ContactInfoModel.updateOne({}, { $set: update });
        const updated = await ContactInfoModel.findOne({});
        res.json({ message: 'Contact info updated successfully', data: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
