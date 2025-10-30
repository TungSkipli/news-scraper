const express = require('express');
const router = express.Router();
const { 
  scrapeUrlController, 
  scrapeAndSaveController,
  batchScrapeController,
  scrapeSourceController,
  detectCategoriesController
} = require('../controllers/scrapeController');

router.post('/save', scrapeAndSaveController);
router.post('/batch', batchScrapeController);
router.post('/source', scrapeSourceController);
router.post('/detect-categories', detectCategoriesController);

router.post('/scrape-url', scrapeUrlController);
router.post('/scrape-and-save', scrapeAndSaveController);
router.post('/batch-scrape', batchScrapeController);
router.post('/scrape-source', scrapeSourceController);

module.exports = router;
