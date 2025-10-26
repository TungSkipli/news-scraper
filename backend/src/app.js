const express = require('express');
const cors = require("cors");
const scrapeRoutes = require('./routes/scrapeRoutes');
const newsRoutes = require('./routes/newsRoutes');
const sourceRoutes = require('./routes/sourceRoutes');

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

app.use('/', scrapeRoutes);
app.use('/', newsRoutes);
app.use('/api', sourceRoutes);


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Cannot find ${req.originalUrl} on this server`
    });
});

app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

module.exports = app;