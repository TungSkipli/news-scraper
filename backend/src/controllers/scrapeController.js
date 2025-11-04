const { scrapeUrl, scrapeAndSave } = require('../services/universalScraper');
const { scrapeEntireSource, scrapeSingleCategory } = require('../services/sourceOrchestrator');
const { detectCategories } = require('../services/homepageDetector');
const { validateUrl, validateUrlArray } = require('../utils/validators');
const axios = require('axios');

const triggerN8nWorkflow = async (articleData) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://vnuphammanhtu.app.n8n.cloud/webhook/afamily-scraper';
  
  try {
    console.log('[N8N] Triggering workflow with article:', articleData.title);
    
    const { db } = require('../config/firebase');
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      slug: doc.data().slug,
      url: doc.data().url,
      source_domain: doc.data().source_domain,
      source_id: doc.data().source_id,
      total_articles: doc.data().total_articles || 0
    }));
    
    console.log(`[N8N] 📊 Loaded ${categories.length} categories from Firebase`);
    if (categories.length === 0) {
      console.warn('[N8N] ⚠️ WARNING: No categories found in Firebase!');
    }
    
    const payload = {
      article: articleData,
      categories: categories,
      categories_count: categories.length
    };
    
    console.log('[N8N] 📤 Sending payload:', JSON.stringify({ 
      article_title: articleData.title, 
      categories_count: categories.length,
      category_names: categories.map(c => c.name) 
    }));
    
    const response = await axios.post(n8nWebhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    
    console.log('[N8N] ✅ Workflow completed successfully');
    console.log('[N8N] 📥 Response:', JSON.stringify(response.data, null, 2));
    
    const n8nData = Array.isArray(response.data) ? response.data[0] : response.data;
    console.log('[N8N] 🔍 Extracted n8nData keys:', Object.keys(n8nData));
    console.log('[N8N] 🔍 Full n8nData:', n8nData);
    
    if (n8nData.message) {
      console.log('[N8N] ⚠️ N8N returned message:', n8nData.message);
      try {
        const parsedMessage = JSON.parse(n8nData.message);
        console.log('[N8N] 🔍 Parsed message:', parsedMessage);
        Object.assign(n8nData, parsedMessage);
      } catch (e) {
        console.log('[N8N] ⚠️ Message is not JSON');
      }
    }
    
    console.log('[N8N] 🔍 category_id:', n8nData.category_id);
    console.log('[N8N] 🔍 category_name:', n8nData.category_name);
    console.log('[N8N] 🔍 category_slug:', n8nData.category_slug);
    
    return { 
      success: true, 
      data: {
        article: n8nData.article || articleData,
        category: {
          id: n8nData.category_id,
          name: n8nData.category_name,
          slug: n8nData.category_slug
        },
        ai_result: n8nData.ai_result || null
      }
    };
  } catch (error) {
    console.error('[N8N] ❌ Failed to trigger workflow:', error.message);
    return { success: false, error: error.message };
  }
};

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

    const n8nResult = await triggerN8nWorkflow(article);
    
    if (!n8nResult.success) {
      return res.status(500).json({
        success: false,
        message: 'N8N workflow failed: ' + n8nResult.error,
        data: { article }
      });
    }

    const { db, algoliaClient, algoliaIndexName, FieldValue } = require('../config/firebase');
    const { FIREBASE_COLLECTIONS } = require('../utils/constants');
    const enrichedData = n8nResult.data;
    
    console.log('[scrapeUrlController] 📊 N8N returned category:', JSON.stringify(enrichedData.category, null, 2));
    
    const categorySlug = enrichedData.category?.slug || 'uncategorized';
    const categoryRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(categorySlug);

    const existingArticle = await categoryRef
      .where('external_source', '==', article.external_source)
      .limit(1)
      .get();

    if (!existingArticle.empty) {
      const existingDoc = existingArticle.docs[0];
      console.log(`[scrapeUrlController] ⚠️  Article already exists in Firebase`);
      return res.json({
        success: true,
        message: 'Article already exists',
        data: {
          id: existingDoc.id,
          article: existingDoc.data(),
          isDuplicate: true
        }
      });
    }

    const finalArticle = {
      ...enrichedData.article,
      created_at: Date.now(),
      scraped_at: Date.now()
    };

    if (enrichedData.category?.id) {
      finalArticle.category_id = enrichedData.category.id;
    }
    if (enrichedData.category?.name) {
      finalArticle.category_name = enrichedData.category.name;
    }
    if (enrichedData.category?.slug) {
      finalArticle.category_slug = enrichedData.category.slug;
    }

    const docRef = await categoryRef.add(finalArticle);
    console.log(`[scrapeUrlController] ✅ Saved to Firebase: news/articles/${categorySlug}/${docRef.id}`);

    await algoliaClient.saveObject({
      indexName: algoliaIndexName,
      body: {
        objectID: docRef.id,
        title: finalArticle.title,
        summary: finalArticle.summary || '',
        category: categorySlug,
        image: finalArticle.image?.url || '',
        published_at: finalArticle.published_at
      }
    }).catch(err => console.warn('[scrapeUrlController] Algolia sync failed:', err.message));

    if (enrichedData.category?.id) {
      await db.collection('categories').doc(enrichedData.category.id).update({
        total_articles: FieldValue.increment(1),
        last_scraped_at: Date.now()
      }).catch(err => console.warn('[scrapeUrlController] Category update failed:', err.message));
    }

    res.json({
      success: true,
      message: 'Article processed and saved successfully',
      data: {
        id: docRef.id,
        article: finalArticle,
        path: `news/articles/${categorySlug}/${docRef.id}`,
        ai_result: enrichedData.ai_result
      }
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

    // Single category mode
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

module.exports = {
  scrapeUrlController,
  scrapeAndSaveController,
  batchScrapeController,
  scrapeSourceController,
  detectCategoriesController
};
