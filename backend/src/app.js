const express = require('express');
const cors = require("cors");
const scrapeRoutes = require('./routes/scrapeRoutes');
const newsRoutes = require('./routes/newsRoutes');
const sourceRoutes = require('./routes/sourceRoutes');
const { logError } = require('./utils/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Advanced React Backend API - Multi-Source News Scraper',
        version: '2.0.0',
        features: [
            'Universal article scraper',
            'Full source scraper (homepage -> categories -> articles)',
            'Category detection',
            'Multi-source support',
            'Source and category management'
        ]
    });
});

// Mount all routes under /api prefix to match frontend services
app.use('/api/scrape', scrapeRoutes);
app.use('/api', newsRoutes);
app.use('/api', sourceRoutes);

app.get('/api/test-db', async (req, res) => {
    try {
        const { db } = require('./config/firebase');
        
        const globalSnapshot = await db.collection('news')
            .doc('articles')
            .collection('global')
            .limit(5)
            .get();
        
        const categoryRef = db.collection('news')
            .doc('articles')
            .collection('category');
        
        const categoriesSnapshot = await categoryRef.get();
        
        const result = {
            global: {
                count: globalSnapshot.size,
                empty: globalSnapshot.empty,
                articles: globalSnapshot.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title
                }))
            },
            categories: {
                count: categoriesSnapshot.size,
                empty: categoriesSnapshot.empty,
                list: categoriesSnapshot.docs.map(doc => doc.id)
            }
        };
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

app.use((error, req, res, next) => {
    logError(error, { 
        method: req.method, 
        path: req.path,
        query: req.query
    });

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

module.exports = app;