const express = require('express');
const router = express.Router();
const { getNews, getNewsDetail, getNewsStats, getTags } = require('../controllers/newsController');

router.get('/news', getNews);
router.get('/news/stats', getNewsStats);
router.get('/news/tags', getTags);
router.get('/news/:id', getNewsDetail);

module.exports = router;
