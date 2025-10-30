const { db, FieldValue, algoliaClient, algoliaIndexName } = require('../config/firebase');
const { createSlug } = require('../utils/slugGenerator');
const { normalizeCategory, FIREBASE_COLLECTIONS } = require('../utils/constants');

const COLLECTIONS = {
  SOURCES: 'sources',
  CATEGORIES: 'categories'
};

const saveSource = async (sourceData) => {
  try {
    const { name, domain, homepage_url } = sourceData;

    const existingSource = await db
      .collection(COLLECTIONS.SOURCES)
      .where('domain', '==', domain)
      .limit(1)
      .get();

    if (!existingSource.empty) {
      const docId = existingSource.docs[0].id;
      await db.collection(COLLECTIONS.SOURCES).doc(docId).update({
        last_scraped_at: Date.now(),
        updated_at: Date.now()
      });
      
      return { id: docId, ...existingSource.docs[0].data() };
    }

    const newSource = {
      name,
      domain,
      homepage_url,
      logo_url: '',
      total_articles: 0,
      total_categories: 0,
      last_scraped_at: Date.now(),
      status: 'active',
      created_at: Date.now()
    };

    const docRef = await db.collection(COLLECTIONS.SOURCES).add(newSource);
    
    return { id: docRef.id, ...newSource };

  } catch (error) {
    console.error('[saveSource] Error:', error);
    throw error;
  }
};

const saveCategory = async (sourceId, sourceDomain, categoryData) => {
  try {
    const { name, url } = categoryData;

    const slug = createSlug(name);

    const existingCategory = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('source_id', '==', sourceId)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingCategory.empty) {
      const docId = existingCategory.docs[0].id;
      await db.collection(COLLECTIONS.CATEGORIES).doc(docId).update({
        last_scraped_at: Date.now(),
        updated_at: Date.now()
      });
      
      return { id: docId, ...existingCategory.docs[0].data() };
    }

    const newCategory = {
      source_id: sourceId,
      source_domain: sourceDomain,
      name,
      slug,
      url,
      total_articles: 0,
      last_scraped_at: Date.now(),
      created_at: Date.now()
    };

    const docRef = await db.collection(COLLECTIONS.CATEGORIES).add(newCategory);
    
    return { id: docRef.id, ...newCategory };

  } catch (error) {
    console.error('[saveCategory] Error:', error);
    throw error;
  }
};

const saveArticle = async (articleData, sourceInfo, categoryInfo) => {
  try {
    let normalizedCategory;
    
    if (articleData.category && articleData.category !== 'uncategorized') {
      normalizedCategory = articleData.category;
      console.log(`[saveArticle] Using category from article URL: ${normalizedCategory}`);
    } else {
      normalizedCategory = normalizeCategory(categoryInfo.name);
      console.log(`[saveArticle] Using category from detection: ${normalizedCategory}`);
    }
    

    const categoryRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(normalizedCategory);

    const articleUrl = articleData.url || articleData.external_source;
    
    if (!articleUrl) {
      console.warn('[saveArticle] Warning: Article has no URL, cannot check for duplicates');
    } else {
      const existingArticle = await categoryRef
        .where('external_source', '==', articleUrl)
        .limit(1)
        .get();
      
      if (!existingArticle.empty) {
        const existingDoc = existingArticle.docs[0];
        console.log(`[saveArticle] ⚠️  DUPLICATE DETECTED - Article already exists at: news/articles/${normalizedCategory}/${existingDoc.id}`);
        console.log(`[saveArticle] URL: ${articleUrl}`);
        return { 
          id: existingDoc.id, 
          ...existingDoc.data(),
          isDuplicate: true 
        };
      }
      
      if (articleData.slug) {
        const existingBySlug = await categoryRef
          .where('slug', '==', articleData.slug)
          .where('source_id', '==', sourceInfo.id)
          .limit(1)
          .get();
        
        if (!existingBySlug.empty) {
          const existingDoc = existingBySlug.docs[0];
          console.log(`[saveArticle] ⚠️  DUPLICATE DETECTED (by slug) - Article already exists at: news/articles/${normalizedCategory}/${existingDoc.id}`);
          console.log(`[saveArticle] Slug: ${articleData.slug}`);
          return { 
            id: existingDoc.id, 
            ...existingDoc.data(),
            isDuplicate: true 
          };
        }
      }
    }

    const enrichedArticle = {
      ...articleData,
      source_id: sourceInfo.id,
      source_name: sourceInfo.name,
      source_domain: sourceInfo.domain,
      category_id: categoryInfo.id,
      category_name: categoryInfo.name,
      category_slug: categoryInfo.slug,
      category: normalizedCategory,
      scraped_at: Date.now()
    };

    const docRef = await categoryRef.add(enrichedArticle);

    console.log(`[saveArticle] Saved article to: news/articles/${normalizedCategory}/${docRef.id}`);

    await algoliaClient.saveObject({
      indexName: algoliaIndexName,
      body: {
        objectID: docRef.id,
        title: enrichedArticle.title,
        summary: enrichedArticle.summary || '',
        category: normalizedCategory,
        image: enrichedArticle.image?.url || '',
        published_at: enrichedArticle.published_at
      }
    });

    console.log(`[saveArticle] Synced to Algolia: ${docRef.id}`);


    await db.collection(COLLECTIONS.SOURCES).doc(sourceInfo.id).update({
      total_articles: FieldValue.increment(1)
    });

    await db.collection(COLLECTIONS.CATEGORIES).doc(categoryInfo.id).update({
      total_articles: FieldValue.increment(1)
    });

    return { id: docRef.id, ...enrichedArticle };

  } catch (error) {
    console.error('[saveArticle] Error:', error);
    throw error;
  }
};

const getAllSources = async () => {
  try {
    const snapshot = await db.collection(COLLECTIONS.SOURCES).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[getAllSources] Error:', error);
    throw error;
  }
};

const getSourceByDomain = async (domain) => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.SOURCES)
      .where('domain', '==', domain)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error('[getSourceByDomain] Error:', error);
    throw error;
  }
};

const getSourceById = async (sourceId) => {
  try {
    const doc = await db.collection(COLLECTIONS.SOURCES).doc(sourceId).get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('[getSourceById] Error:', error);
    throw error;
  }
};

const getCategoriesBySource = async (sourceId) => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .where('source_id', '==', sourceId)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[getCategoriesBySource] Error:', error);
    throw error;
  }
};

const getAllCategories = async () => {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.CATEGORIES)
      .get();

    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    categories.sort((a, b) => (b.total_articles || 0) - (a.total_articles || 0));
    
    return categories;
  } catch (error) {
    console.error('[getAllCategories] Error:', error);
    throw error;
  }
};

/**
 * Get articles from Firebase path: news/articles/{category}
 */
const getArticles = async (filters = {}) => {
  try {
    const articlesRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES);

    let articles = [];

    // Get list of all category collections
    const collections = await articlesRef.listCollections();
    const categoryNames = collections.map(col => col.id);

    // If specific category_id filter
    if (filters.category_id) {
      const categoryDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(filters.category_id).get();
      
      if (categoryDoc.exists) {
        const categoryData = categoryDoc.data();
        const normalizedCategory = normalizeCategory(categoryData.name);
        
        const snapshot = await articlesRef.collection(normalizedCategory).get();
        
        articles = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          category: normalizedCategory,
          ...doc.data() 
        }));

        // Filter by source if needed
        if (filters.source_id) {
          articles = articles.filter(a => a.source_id === filters.source_id && a.category_id === filters.category_id);
        } else {
          articles = articles.filter(a => a.category_id === filters.category_id);
        }
      }
    } else if (filters.source_id) {
      // Get all articles from all categories and filter by source
      for (const categoryName of categoryNames) {
        const snapshot = await articlesRef.collection(categoryName).get();
        const categoryArticles = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          category: categoryName,
          ...doc.data() 
        }));
        
        articles = articles.concat(categoryArticles.filter(a => a.source_id === filters.source_id));
      }
    } else {
      // Get all articles from all categories
      for (const categoryName of categoryNames) {
        const snapshot = await articlesRef.collection(categoryName).get();
        const categoryArticles = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          category: categoryName,
          ...doc.data() 
        }));
        
        articles = articles.concat(categoryArticles);
      }
    }

    // Sort by date
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    // Apply limit
    if (filters.limit) {
      articles = articles.slice(0, filters.limit);
    }

    return articles;
  } catch (error) {
    console.error('[getArticles] Error:', error);
    throw error;
  }
};

/**
 * Get single article by ID
 * Searches across all categories
 */
const getArticleById = async (articleId) => {
  try {
    const articlesRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES);

    const collections = await articlesRef.listCollections();
    
    for (const collection of collections) {
      const doc = await collection.doc(articleId).get();
      
      if (doc.exists) {
        return { 
          id: doc.id, 
          category: collection.id,
          ...doc.data() 
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[getArticleById] Error:', error);
    throw error;
  }
};

/**
 * Get articles by category ID
 */
const getArticlesByCategory = async (categoryId, limit = 50) => {
  try {
    const categoryDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      return [];
    }
    
    const categoryData = categoryDoc.data();
    const normalizedCategory = normalizeCategory(categoryData.name);
    
    const articlesRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES);
    
    const snapshot = await articlesRef.collection(normalizedCategory).get();
    
    let articles = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      category: normalizedCategory,
      ...doc.data() 
    }));
    
    // Filter by category_id
    articles = articles.filter(a => a.category_id === categoryId);
    
    // Sort by date
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));
    
    // Apply limit
    if (limit) {
      articles = articles.slice(0, limit);
    }
    
    return articles;
  } catch (error) {
    console.error('[getArticlesByCategory] Error:', error);
    throw error;
  }
};

/**
 * Delete source and all related data
 */
const deleteSource = async (sourceId) => {
  try {
    // Get all categories for this source
    const categories = await getCategoriesBySource(sourceId);
    
    // Delete all articles from those categories
    for (const category of categories) {
      const normalizedCategory = normalizeCategory(category.name);
      const articlesRef = db
        .collection(FIREBASE_COLLECTIONS.NEWS)
        .doc(FIREBASE_COLLECTIONS.ARTICLES)
        .collection(normalizedCategory);
      
      const snapshot = await articlesRef.where('source_id', '==', sourceId).get();
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Delete category
      await db.collection(COLLECTIONS.CATEGORIES).doc(category.id).delete();
    }
    
    // Delete source
    await db.collection(COLLECTIONS.SOURCES).doc(sourceId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('[deleteSource] Error:', error);
    throw error;
  }
};

/**
 * Update source
 */
const updateSource = async (sourceId, updates) => {
  try {
    await db.collection(COLLECTIONS.SOURCES).doc(sourceId).update({
      ...updates,
      updated_at: Date.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[updateSource] Error:', error);
    throw error;
  }
};

module.exports = {
  saveSource,
  saveCategory,
  saveArticle,
  getAllSources,
  getSourceByDomain,
  getSourceById,
  getCategoriesBySource,
  getAllCategories,
  getArticles,
  getArticleById,
  getArticlesByCategory,
  deleteSource,
  updateSource
};
