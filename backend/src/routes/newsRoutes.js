const express = require('express');
const router = express.Router();
const { 
  getNews, 
  getNewsDetail, 
  getNewsStats, 
  getTags, 
  getFeatured, 
  getLatest,
  getNewsByCategoryController,
  getCategories 
} = require('../controllers/newsController');

router.get('/news/stats', getNewsStats);
router.get('/news/tags', getTags);
router.get('/news/categories', getCategories);
router.get('/news/featured', getFeatured);
router.get('/news/latest', getLatest);

router.get('/news/category/:category', getNewsByCategoryController);

router.get('/news', getNews);

router.get('/news/:category/:id', getNewsDetail);
router.get('/news/:id', getNewsDetail);

module.exports = router;