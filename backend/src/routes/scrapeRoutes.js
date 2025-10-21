const express = require('express');
const router = express.Router();
const { scrapeNews } = require('../controllers/scrapeController');

router.get('/scrape', scrapeNews);

module.exports = router;
