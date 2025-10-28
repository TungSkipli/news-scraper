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

// Stats and metadata routes (must be before :id routes)
router.get('/news/stats', getNewsStats);
router.get('/news/tags', getTags);
router.get('/news/categories', getCategories);
router.get('/news/featured', getFeatured);
router.get('/news/latest', getLatest);

// Category specific routes
router.get('/news/category/:category', getNewsByCategoryController);

// Main news routes
router.get('/news', getNews);

// Article detail routes
router.get('/news/:category/:id', getNewsDetail);  // With category
router.get('/news/:id', getNewsDetail);            // Without category (search all)

module.exports = router;