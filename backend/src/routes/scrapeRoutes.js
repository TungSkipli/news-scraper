const express = require('express');
const router = express.Router();
const { scrapeNews, scrapeNewsSSE } = require('../controllers/scrapeController');

router.get('/scrape', scrapeNews);
router.get('/scrape-stream', scrapeNewsSSE);

module.exports = router;
