const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.set('etag', false);
app.disable('x-powered-by');

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Health Check route for UptimeRobot
app.get('/', (req, res) => res.status(200).send('Backend is running!'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    dbName: 'Portfolio'
})
    .then(() => console.log('MongoDB Connected to Portfolio Database...'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schemas & Models
const ImageSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});

const MontageSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    url: { type: String, required: true },
    thumb: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});

const ReviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    shootType: { type: String, required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ReviewVideoSchema = new mongoose.Schema({
    title: { type: String, default: '' },
    videoUrl: { type: String, required: true },
    thumb: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});

const GalleryVideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    thumb: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});

const InnerPageImageSchema = new mongoose.Schema({
    cardSlug: { type: String, required: true, index: true },
    imageUrl: { type: String, required: true },
    order: { type: Number, default: 0, index: true },
    createdAt: { type: Date, default: Date.now }
});

const GalleryModel = mongoose.model('Gallery', ImageSchema, 'gallary');
const MontagesModel = mongoose.model('Montages', MontageSchema, 'montages');
const ReviewModel = mongoose.model('Review', ReviewSchema, 'Reviews');
const ReviewVideoModel = mongoose.model('ReviewVideo', ReviewVideoSchema, 'ReviewVideos');
const GalleryVideoModel = mongoose.model('GalleryVideo', GalleryVideoSchema, 'Gallary video');
const InnerPageImageModel = mongoose.model('InnerPageImage', InnerPageImageSchema, 'inner_images');

const portfolioModels = {
    'Portraits': mongoose.model('Portraits', ImageSchema, 'portait'),
    'Pre Weddings': mongoose.model('PreWeddings', ImageSchema, 'pre wedding'),
    'Weddings': mongoose.model('Weddings', ImageSchema, 'wedding'),
    'Reception': mongoose.model('Reception', ImageSchema, 'resiption'),
    'Model Shoot': mongoose.model('ModelShoot', ImageSchema, 'model shoot'),
    'Engagement': mongoose.model('Engagement', ImageSchema, 'engaement')
};

// ---- High-Speed In-Memory Cache (Sub-1ms Responses) ----
const serverCache = new Map();
const stringCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

const setCache = (key, data) => {
    serverCache.set(key, { data, time: Date.now() });
    stringCache.set(key, JSON.stringify(data));
};

const clearCache = () => {
    serverCache.clear();
    stringCache.clear();
};

const instantResponse = (keySuffix = '') => (req, res, next) => {
    const key = keySuffix ? `${keySuffix}_${req.params[keySuffix] || ''}` : req.url.split('/api/')[1];
    const data = stringCache.get(key);
    if (data) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.removeHeader('Last-Modified');
        return res.status(200).send(data);
    }
    next();
};

// Optimized Routes
app.get('/api/gallery', instantResponse(), async (req, res) => {
    try {
        const images = await GalleryModel.find().sort({ order: 1 }).lean();
        const urls = images.map(img => img.imageUrl);
        setCache('gallery', urls);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(urls);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/portfolio/:category', instantResponse('category'), async (req, res) => {
    try {
        const categoryName = req.params.category;
        const Model = portfolioModels[categoryName];
        if (!Model) return res.status(404).json({ error: 'Category not found' });
        const images = await Model.find().sort({ order: 1 }).lean();
        const urls = images.map(img => img.imageUrl);
        setCache(`category_${categoryName}`, urls);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(urls);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/montages', instantResponse(), async (req, res) => {
    try {
        const montages = await MontagesModel.find().sort({ order: 1 }).lean();
        setCache('montages', montages);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(montages);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gallery-films', instantResponse(), async (req, res) => {
    try {
        const films = await GalleryVideoModel.find().sort({ order: 1 }).lean();
        setCache('gallery-films', films);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(films);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/review-videos', instantResponse(), async (req, res) => {
    try {
        const videos = await ReviewVideoModel.find().sort({ order: 1 }).lean();
        setCache('review-videos', videos);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(videos);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Inner Page Images Routes
app.get('/api/inner-images/:cardSlug', async (req, res) => {
    try {
        const images = await InnerPageImageModel.find({ cardSlug: req.params.cardSlug }).sort({ order: 1 }).lean();
        const urls = images.map(img => img.imageUrl);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(urls);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inner-images/:cardSlug', async (req, res) => {
    try {
        const { images } = req.body;
        await InnerPageImageModel.deleteMany({ cardSlug: req.params.cardSlug });
        if (images?.length) {
            const CHUNK_SIZE = 10;
            for (let i = 0; i < images.length; i += CHUNK_SIZE) {
                const chunk = images.slice(i, i + CHUNK_SIZE);
                await InnerPageImageModel.insertMany(chunk.map((url, idx) => ({
                    cardSlug: req.params.cardSlug,
                    imageUrl: url,
                    order: i + idx
                })));
            }
        }
        clearCache();
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Posts
app.post('/api/gallery', async (req, res) => {
    try {
        const { images } = req.body;
        await GalleryModel.deleteMany({});
        if (images?.length) {
            // Chunked insert to prevent 16MB limit issues
            const CHUNK_SIZE = 10;
            for (let i = 0; i < images.length; i += CHUNK_SIZE) {
                const chunk = images.slice(i, i + CHUNK_SIZE);
                await GalleryModel.insertMany(chunk.map((url, idx) => ({
                    imageUrl: url,
                    order: i + idx
                })));
            }
        }
        clearCache();
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/portfolio/:category', async (req, res) => {
    try {
        const Model = portfolioModels[req.params.category];
        if (!Model) return res.status(404).send('Not found');
        const { images } = req.body;
        await Model.deleteMany({});
        if (images?.length) {
            const CHUNK_SIZE = 10;
            for (let i = 0; i < images.length; i += CHUNK_SIZE) {
                const chunk = images.slice(i, i + CHUNK_SIZE);
                await Model.insertMany(chunk.map((url, idx) => ({
                    imageUrl: url,
                    order: i + idx
                })));
            }
        }
        clearCache();
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/montages', async (req, res) => {
    try {
        const { montages } = req.body;
        await MontagesModel.deleteMany({});
        if (montages?.length) await MontagesModel.insertMany(montages.map((m, idx) => ({ ...m, order: idx })));
        clearCache();
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/gallery-films', async (req, res) => {
    try {
        const { films } = req.body;
        await GalleryVideoModel.deleteMany({});
        if (films?.length) await GalleryVideoModel.insertMany(films.map((f, idx) => ({ ...f, order: idx })));
        clearCache();
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/review-videos', async (req, res) => {
    try {
        const { videos } = req.body;
        await ReviewVideoModel.deleteMany({});
        if (videos?.length) await ReviewVideoModel.insertMany(videos.map((v, idx) => ({ ...v, order: idx })));
        clearCache();
        res.json({ message: 'Success' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await ReviewModel.find().sort({ stars: -1, createdAt: -1 }).limit(10).lean();
        res.json(reviews);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const newReview = new ReviewModel(req.body);
        await newReview.save();
        clearCache();
        res.json({ message: 'Review saved!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/reviews/:id', async (req, res) => {
    try {
        await ReviewModel.findByIdAndDelete(req.params.id);
        clearCache();
        res.json({ message: 'Review deleted!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const ContactInfoSchema = new mongoose.Schema({
    phone1: String, phone2: String, email: String, address: String,
    instagram: String, whatsapp: String, mapsUrl: String, workingHours: String,
    updatedAt: { type: Date, default: Date.now }
});
const ContactInfoModel = mongoose.model('ContactInfo', ContactInfoSchema, 'contact');

app.get('/api/contact-info', async (req, res) => {
    try {
        const info = await ContactInfoModel.findOne({}).lean();
        res.json(info || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/contact-info', async (req, res) => {
    try {
        await ContactInfoModel.deleteMany({});
        const info = new ContactInfoModel(req.body);
        await info.save();
        res.json({ message: 'Contact info saved!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/contact-info', async (req, res) => {
    try {
        await ContactInfoModel.findOneAndUpdate({}, req.body, { upsert: true });
        res.json({ message: 'Contact info updated!' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const stats = {
            galleryImages: await GalleryModel.countDocuments(),
            galleryVideos: await GalleryVideoModel.countDocuments(),
            montages: await MontagesModel.countDocuments(),
            reviewTexts: await ReviewModel.countDocuments(),
            reviewVideos: await ReviewVideoModel.countDocuments(),
            portfolioImages: 0,
            innerPageImages: await InnerPageImageModel.countDocuments()
        };
        for (const cat in portfolioModels) stats.portfolioImages += await portfolioModels[cat].countDocuments();
        res.json(stats);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on 0.0.0.0:${PORT}`));
