const { scrapeUrl, scrapeAndSave, saveArticleWithCategory } = require('../services/universalScraper');
const { scrapeEntireSource, scrapeSingleCategory } = require('../services/sourceOrchestrator');
const { detectCategories } = require('../services/homepageDetector');
const { validateUrl, validateUrlArray } = require('../utils/validators');
const { db, admin } = require('../config/firebase');

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
    console.error('[scrapeUrlController] Error:', error);
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
      message: result.isDuplicate 
        ? `⚠️ Duplicate detected - Article already exists at ${result.path}`
        : `✅ Article saved to ${result.path}`,
      data: {
        article: result.article,
        firebaseId: result.firebaseId,
        path: result.path,
        isDuplicate: result.isDuplicate || false
      }
    });
  } catch (error) {
    console.error('[scrapeAndSaveController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to scrape and save URL',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const batchScrapeController = async (req, res, next) => {
  try {
    const { urls, saveToFirebase } = req.body;

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
      duplicates: 0,
      articles: [],
      errors: []
    };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        if (saveToFirebase) {
          const result = await scrapeAndSave(url);
          results.success++;
          
          if (result.isDuplicate) {
            results.duplicates++;
          }
          
          results.articles.push({
            url,
            article: result.article,
            firebaseId: result.firebaseId,
            path: result.path,
            status: result.isDuplicate ? 'duplicate' : 'success',
            isDuplicate: result.isDuplicate || false
          });
        } else {
          const article = await scrapeUrl(url);
          results.success++;
          results.articles.push({
            url,
            article,
            status: 'success',
            isDuplicate: false
          });
        }
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
      message: `Batch scraping completed: ${results.success} success, ${results.failed} failed, ${results.duplicates} duplicates skipped`,
      data: results
    });
  } catch (error) {
    console.error('[batchScrapeController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to batch scrape URLs',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const scrapeSourceController = async (req, res, next) => {
  try {
    const { url, ...restBody } = req.body;
    const options = restBody.options || restBody;

    const validation = validateUrl(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    if (options?.mode === 'auto' && options?.selectedCategories) {
      const detection = await detectCategories(url);
      
      const results = {
        success: true,
        source: detection.source,
        categories: [],
        articles: {
          total: 0,
          success: 0,
          failed: 0,
          duplicates: 0,
          details: []
        },
        ai_metadata: options.metadata || null
      };

      if (options.metadata) {
        try {
          const normalizedData = {
            source_domain: detection.source.domain,
            source_name: detection.source.name,
            homepage_url: url,
            normalized_categories: options.metadata.ai_normalized_categories || [],
            original_categories: detection.categories,
            scrape_config: {
              selected_for_scraping: options.selectedCategories,
              maxPages: options.maxPages || 2,
              maxArticlesPerCategory: options.maxArticlesPerCategory || 20
            },
            semantic_analysis: options.metadata.semantic_analysis || {},
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            created_by: 'n8n-gemini-ai-agent'
          };

          const docId = `${detection.source.domain}_${Date.now()}`;
          await db.collection('normalized_categories').doc(docId).set(normalizedData);
          
          results.firestore_saved = true;
          results.firestore_doc_id = docId;
          console.log(`[scrapeSourceController] Saved normalized categories to Firestore: ${docId}`);
        } catch (error) {
          console.error('[scrapeSourceController] Error saving to Firestore:', error);
          results.firestore_saved = false;
          results.firestore_error = error.message;
        }
      }

      for (const selectedCat of options.selectedCategories) {
        try {
          const categoryResults = await scrapeSingleCategory(
            selectedCat.url,
            detection.source,
            {
              maxPages: options?.maxPages || 2,
              maxArticles: options?.maxArticlesPerCategory || 20
            }
          );

          results.categories.push(categoryResults.category);
          results.articles.total += categoryResults.articles.total;
          results.articles.success += categoryResults.articles.success;
          results.articles.failed += categoryResults.articles.failed;
          results.articles.duplicates += categoryResults.articles.duplicates;

          console.log(`[scrapeSourceController] AI selected category "${selectedCat.name}" completed: ${categoryResults.articles.success} success, ${categoryResults.articles.duplicates} duplicates`);

          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`[scrapeSourceController] Error scraping AI selected category "${selectedCat.name}":`, error);
        }
      }

      return res.json({
        success: true,
        message: `AI auto-selection mode completed: ${results.articles.success} articles scraped from ${results.categories.length} categories`,
        data: results
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
    console.error('[scrapeSourceController] Error:', error);
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
    console.error('[detectCategoriesController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to detect categories',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const saveArticleWithCategoryController = async (req, res, next) => {
  try {
    const { article, category_id, category_name, classification } = req.body;

    if (!article || !category_name) {
      return res.status(400).json({
        success: false,
        message: 'Article and category_name are required'
      });
    }

    const result = await saveArticleWithCategory(article, category_id, category_name, classification);

    res.json({
      success: true,
      message: result.isDuplicate 
        ? `⚠️ Duplicate detected - Article already exists at ${result.path}`
        : `✅ Article saved to ${result.path}`,
      data: {
        article: result.article,
        firebaseId: result.firebaseId,
        path: result.path,
        isDuplicate: result.isDuplicate || false,
        category: category_name,
        category_id: category_id
      }
    });
  } catch (error) {
    console.error('[saveArticleWithCategoryController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save article with category',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  scrapeUrlController,
  scrapeAndSaveController,
  batchScrapeController,
  scrapeSourceController,
  detectCategoriesController,
  saveArticleWithCategoryController
};
