const express = require('express');
const router = express.Router();
const { 
  scrapeUrlController, 
  scrapeAndSaveController,
  batchScrapeController,
  scrapeSourceController,
  detectCategoriesController
} = require('../controllers/scrapeController');

// Main routes - match frontend service calls
router.post('/save', scrapeAndSaveController);              // /api/scrape/save
router.post('/batch', batchScrapeController);               // /api/scrape/batch
router.post('/source', scrapeSourceController);             // /api/scrape/source
router.post('/detect-categories', detectCategoriesController); // /api/scrape/detect-categories

// Legacy routes for backward compatibility
router.post('/scrape-url', scrapeUrlController);
router.post('/scrape-and-save', scrapeAndSaveController);
router.post('/batch-scrape', batchScrapeController);
router.post('/scrape-source', scrapeSourceController);

module.exports = router;
