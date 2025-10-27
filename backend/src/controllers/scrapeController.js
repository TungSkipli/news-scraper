const { scrapeUrl, scrapeAndSave } = require('../services/universalScraper');
const { scrapeEntireSource, scrapeSingleCategory } = require('../services/sourceOrchestrator');
const { detectCategories } = require('../services/homepageDetector');
const { validateUrl, validateUrlArray } = require('../utils/validators');

const scrapeUrlController = async (req, res, next) => {
  try {
    const { url } = req.body;

    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const article = await scrapeUrl(url);

    res.json({
      success: true,
      message: 'Article scraped successfully',
      data: article
    });
  } catch (error) {
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

    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
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

    const validation = validateUrlArray(urls);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
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

    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    if (options?.mode === 'single' && options?.categoryUrl) {
      const detection = await detectCategories(url);
      const category = detection.categories.find(cat => cat.url === options.categoryUrl);

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found in detected categories'
        });
      }

      const results = await scrapeSingleCategory(
        options.categoryUrl,
        {
          ...detection.source,
          categoryName: category.name
        },
        {
          maxPages: options?.maxPages || 2,
          maxArticles: options?.maxArticlesPerCategory || 20
        }
      );

      return res.json({
        success: true,
        message: 'Category scraped successfully',
        data: results
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
