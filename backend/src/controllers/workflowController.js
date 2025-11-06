const { db, algoliaClient, algoliaIndexName, FieldValue } = require('../config/firebase');
const { FIREBASE_COLLECTIONS } = require('../utils/constants');

const COLLECTIONS = {
  CATEGORIES: 'categories',
  SOURCES: 'sources'
};

const saveArticleFromWorkflow = async (req, res, next) => {
  try {
    const { article, category_id, category_name, category_slug, source_id, source_domain } = req.body;

    if (!article || !category_id || !category_slug) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: article, category_id, category_slug'
      });
    }

    if (!article.title || !article.external_source) {
      return res.status(400).json({
        success: false,
        message: 'Article must have title and external_source'
      });
    }

    const categoryRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(category_slug);

    const existingArticle = await categoryRef
      .where('external_source', '==', article.external_source)
      .limit(1)
      .get();

    if (!existingArticle.empty) {
      const existingDoc = existingArticle.docs[0];
      console.log(`[saveArticleFromWorkflow] ⚠️  DUPLICATE DETECTED - Article already exists`);
      console.log(`[saveArticleFromWorkflow] Path: news/articles/${category_slug}/${existingDoc.id}`);

      return res.json({
        success: true,
        message: 'Article already exists',
        data: {
          id: existingDoc.id,
          article: existingDoc.data(),
          path: `news/articles/${category_slug}/${existingDoc.id}`,
          isDuplicate: true
        }
      });
    }

    const enrichedArticle = {
      ...article,
      category_id,
      category_name,
      category_slug,
      source_id: source_id || '',
      source_domain: source_domain || '',
      created_at: Date.now(),
      scraped_at: Date.now()
    };

    const docRef = await categoryRef.add(enrichedArticle);

    console.log(`[saveArticleFromWorkflow] ✅ Saved article to: news/articles/${category_slug}/${docRef.id}`);

    await algoliaClient.saveObject({
      indexName: algoliaIndexName,
      body: {
        objectID: docRef.id,
        title: enrichedArticle.title,
        summary: enrichedArticle.summary || '',
        category: category_slug,
        image: enrichedArticle.image?.url || '',
        published_at: enrichedArticle.published_at
      }
    });

    console.log(`[saveArticleFromWorkflow] ✅ Synced to Algolia: ${docRef.id}`);

    if (category_id) {
      await db.collection(COLLECTIONS.CATEGORIES).doc(category_id).update({
        total_articles: FieldValue.increment(1),
        last_scraped_at: Date.now()
      }).catch(err => {
        console.warn(`[saveArticleFromWorkflow] Could not update category count: ${err.message}`);
      });
    }

    if (source_id) {
      await db.collection(COLLECTIONS.SOURCES).doc(source_id).update({
        total_articles: FieldValue.increment(1),
        last_scraped_at: Date.now()
      }).catch(err => {
        console.warn(`[saveArticleFromWorkflow] Could not update source count: ${err.message}`);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Article saved successfully',
      data: {
        id: docRef.id,
        article: enrichedArticle,
        path: `news/articles/${category_slug}/${docRef.id}`,
        isDuplicate: false
      }
    });
  } catch (error) {
    console.error('[saveArticleFromWorkflow] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save article',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  saveArticleFromWorkflow
};
