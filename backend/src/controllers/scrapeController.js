const { scrapeUrl, scrapeAndSave } = require('../services/universalScraper');
const { scrapeEntireSource, scrapeSingleCategory } = require('../services/sourceOrchestrator');
const { detectCategories } = require('../services/homepageDetector');

const scrapeUrlController = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format. URL must start with http:// or https://'
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting scrape for: ${url}`);
    console.log('='.repeat(60));

    const article = await scrapeUrl(url);

    console.log('='.repeat(60));
    console.log('✅ Scraping completed successfully!');
    console.log('='.repeat(60) + '\n');

    res.json({
      success: true,
      message: 'Article scraped successfully',
      data: article
    });
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scrape URL',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const scrapeAndSaveController = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format. URL must start with http:// or https://'
      });
    }

    const result = await scrapeAndSave(url);

    res.json({
      success: true,
      message: 'Article scraped and saved successfully',
      data: {
        article: result.article,
        firebaseId: result.firebaseId
      }
    });
  } catch (error) {
    console.error('❌ Scrape and save error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scrape and save URL',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const batchScrapeController = async (req, res, next) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'URLs array is required'
      });
    }

    const results = {
      total: urls.length,
      success: 0,
      failed: 0,
      articles: [],
      errors: []
    };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n[${i + 1}/${urls.length}] Processing: ${url}`);

      try {
        const article = await scrapeUrl(url);
        results.success++;
        results.articles.push({
          url,
          article,
          status: 'success'
        });
      } catch (error) {
        results.failed++;
        results.errors.push({
          url,
          error: error.message,
          status: 'failed'
        });
      }

      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    res.json({
      success: true,
      message: `Batch scraping completed: ${results.success} success, ${results.failed} failed`,
      data: results
    });
  } catch (error) {
    console.error('❌ Batch scraping error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to batch scrape URLs',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const scrapeSourceController = async (req, res, next) => {
  try {
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Homepage URL is required'
      });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format. URL must start with http:// or https://'
      });
    }

    const scrapeOptions = {
      maxCategoriesPerSource: options?.maxCategories || 5,
      maxPagesPerCategory: options?.maxPages || 2,
      maxArticlesPerCategory: options?.maxArticlesPerCategory || 20,
      maxArticlesPerSource: options?.maxArticles || 100
    };

    const results = await scrapeEntireSource(url, scrapeOptions);

    res.json({
      success: true,
      message: 'Source scraped successfully',
      data: results
    });
  } catch (error) {
    console.error('❌ Source scraping error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scrape source',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const detectCategoriesController = async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Homepage URL is required'
      });
    }

    const result = await detectCategories(url);

    res.json({
      success: true,
      message: 'Categories detected successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Category detection error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to detect categories',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  scrapeUrlController,
  scrapeAndSaveController,
  batchScrapeController,
  scrapeSourceController,
  detectCategoriesController
};
