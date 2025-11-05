const { scrapeUrl, scrapeAndSave } = require('../services/universalScraper');
const { scrapeEntireSource, scrapeSingleCategory } = require('../services/sourceOrchestrator');
const { detectCategories } = require('../services/homepageDetector');
const { validateUrl, validateUrlArray } = require('../utils/validators');
const axios = require('axios');

const triggerN8nWorkflow = async (articleData) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://vnuphammanhtu.app.n8n.cloud/webhook/afamily-scraper';
  
  try {
    console.log('[N8N] 🚀 Triggering workflow for article:', articleData.title);
    console.log('[N8N] 📋 Article ID:', articleData.article_id);
    
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
    
    console.log(`[N8N] 📊 Loaded ${categories.length} categories`);
    
    const payload = {
      article: articleData,
      categories: categories,
      categories_count: categories.length
    };
    
    await axios.post(n8nWebhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 90000
    });
    
    console.log('[N8N] ✅ Workflow triggered successfully');
    return { success: true };
  } catch (error) {
    console.error('[N8N] ❌ Failed to trigger workflow:', error.message);
    throw error;
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

    console.log(`[scrapeUrlController] 🔍 Scraping: ${url}`);
    const article = await scrapeUrl(url);

    const { db, algoliaClient, algoliaIndexName } = require('../config/firebase');
    const { FIREBASE_COLLECTIONS } = require('../utils/constants');
    
    const articleUrl = article.url || article.external_source;
    
    if (articleUrl) {
      const uncategorizedRef = db
        .collection(FIREBASE_COLLECTIONS.NEWS)
        .doc(FIREBASE_COLLECTIONS.ARTICLES)
        .collection('uncategorized');
      
      const existingUncategorized = await uncategorizedRef
        .where('external_source', '==', articleUrl)
        .limit(1)
        .get();
      
      if (!existingUncategorized.empty) {
        const existingDoc = existingUncategorized.docs[0];
        console.log(`[scrapeUrlController] ⚠️  Article exists in uncategorized`);
        return res.json({
          success: true,
          message: 'Article already exists (pending classification)',
          data: {
            id: existingDoc.id,
            article: existingDoc.data(),
            isDuplicate: true
          }
        });
      }
    }

    const articleData = {
      ...article,
      created_at: Date.now(),
      scraped_at: Date.now(),
      ai_classified: false
    };

    const uncategorizedRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection('uncategorized');

    const docRef = await uncategorizedRef.add(articleData);
    console.log(`[scrapeUrlController] ✅ Saved to uncategorized: ${docRef.id}`);

    const articleWithId = {
      ...articleData,
      article_id: docRef.id
    };

    console.log('[scrapeUrlController] 🤖 Triggering n8n workflow for AI classification...');
    triggerN8nWorkflow(articleWithId).catch(err => 
      console.error('[scrapeUrlController] ⚠️ N8n trigger failed:', err.message)
    );

    res.json({
      success: true,
      message: 'Article saved to uncategorized, AI classification in progress',
      data: {
        id: docRef.id,
        article: articleData,
        path: `news/articles/uncategorized/${docRef.id}`,
        status: 'pending_classification'
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

const n8nCallbackController = async (req, res, next) => {
  try {
    console.log('[n8nCallback] 📥 Full request body:', JSON.stringify(req.body, null, 2));
    
    const { article_id, category_id, category_name, category_slug } = req.body;
    
    console.log('[n8nCallback] 📋 Parsed:', { article_id, category_id, category_name, category_slug });
    
    if (!article_id || !category_slug) {
      console.error('[n8nCallback] ❌ Missing required fields!');
      console.error('[n8nCallback] article_id:', article_id);
      console.error('[n8nCallback] category_slug:', category_slug);
      return res.status(400).json({
        success: false,
        message: 'Missing article_id or category_slug',
        received: { article_id, category_id, category_name, category_slug }
      });
    }

    const { db, FieldValue, algoliaClient, algoliaIndexName } = require('../config/firebase');
    const { FIREBASE_COLLECTIONS } = require('../utils/constants');
    
    const articleRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection('uncategorized')
      .doc(article_id);
    
    const doc = await articleRef.get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Article not found in uncategorized'
      });
    }

    const articleData = doc.data();
    let finalCategoryId = category_id || null;

    if (category_id && category_id.startsWith('temp_')) {
      const categoryRef = db.collection('categories').doc();
      finalCategoryId = categoryRef.id;
      
      await categoryRef.set({
        id: finalCategoryId,
        name: category_name,
        slug: category_slug,
        source_domain: articleData.source_domain,
        source_id: articleData.source_id,
        url: articleData.external_source,
        total_articles: 0,
        created_at: Date.now()
      });
      
      console.log(`[n8nCallback] ✅ Created new category: ${category_name} (${finalCategoryId})`);
    }

    const newCategoryRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(category_slug);

    const updateData = {
      ...articleData,
      category_id: finalCategoryId,
      category_name: category_name || 'Uncategorized',
      category_slug: category_slug,
      category: category_slug,
      ai_classified: true,
      classified_at: Date.now()
    };

    await newCategoryRef.doc(article_id).set(updateData);
    await articleRef.delete();

    await algoliaClient.saveObject({
      indexName: algoliaIndexName,
      body: {
        objectID: article_id,
        title: updateData.title,
        summary: updateData.summary || '',
        category: category_slug,
        image: updateData.image?.url || '',
        published_at: updateData.published_at
      }
    }).catch(err => console.warn('[n8nCallback] Algolia sync failed:', err.message));

    if (finalCategoryId && finalCategoryId !== 'uncategorized') {
      await db.collection('categories').doc(finalCategoryId).update({
        total_articles: FieldValue.increment(1),
        last_scraped_at: Date.now()
      }).catch(err => console.warn('[n8nCallback] Category update failed:', err.message));
    }

    console.log(`[n8nCallback] ✅ Moved article ${article_id} from uncategorized → ${category_slug}`);

    res.json({
      success: true,
      message: 'Article updated with category'
    });
  } catch (error) {
    console.error('[n8nCallbackController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const importCategoriesController = async (req, res, next) => {
  try {
    const { source_url } = req.body;
    
    if (!source_url) {
      return res.status(400).json({
        success: false,
        message: 'source_url is required'
      });
    }

    const { detectCategories } = require('../services/homepageDetector');
    const result = await detectCategories(source_url);
    
    const { db } = require('../config/firebase');
    const categoriesRef = db.collection('categories');
    
    let created = 0;
    let skipped = 0;
    
    for (const cat of result.categories) {
      const slug = cat.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const existing = await categoriesRef.where('slug', '==', slug).limit(1).get();
      
      if (existing.empty) {
        const docRef = categoriesRef.doc();
        await docRef.set({
          id: docRef.id,
          name: cat.name,
          slug: slug,
          url: cat.url,
          source_domain: result.source.domain,
          source_id: result.source.id,
          total_articles: 0,
          created_at: Date.now()
        });
        created++;
        console.log(`[importCategories] ✅ Created: ${cat.name} (${slug})`);
      } else {
        skipped++;
        console.log(`[importCategories] ⏭️  Skipped (exists): ${cat.name}`);
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${created} categories, skipped ${skipped} existing`,
      data: {
        created,
        skipped,
        total: result.categories.length
      }
    });
  } catch (error) {
    console.error('[importCategoriesController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  scrapeUrlController,
  scrapeAndSaveController,
  batchScrapeController,
  scrapeSourceController,
  detectCategoriesController,
  n8nCallbackController,
  importCategoriesController
};
