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
    throw error;
  }
};

const triggerN8nWorkflowSync = async (articleData) => {
  const axios = require('axios');
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://vnuphammanhtu.app.n8n.cloud/webhook/afamily-scraper';
  
  try {
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
    
    const payload = {
      article: articleData,
      categories: categories,
      categories_count: categories.length
    };
    
    const response = await axios.post(n8nWebhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 90000
    });
    
    const n8nData = Array.isArray(response.data) ? response.data[0] : response.data;
    
    if (n8nData.message) {
      try {
        const parsedMessage = JSON.parse(n8nData.message);
        Object.assign(n8nData, parsedMessage);
      } catch (e) {}
    }
    
    return { 
      success: true, 
      category: {
        id: n8nData.category_id || null,
        name: n8nData.category_name || 'Uncategorized',
        slug: n8nData.category_slug || 'uncategorized'
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      category: {
        id: null,
        name: 'Uncategorized',
        slug: 'uncategorized'
      }
    };
  }
};

const saveArticle = async (articleData, sourceInfo, categoryInfo = null) => {
  try {
    const articleUrl = articleData.url || articleData.external_source;
    
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
        return { 
          id: existingDoc.id, 
          ...existingDoc.data(),
          isDuplicate: true 
        };
      }
    }

    const enrichedArticle = {
      ...articleData,
      source_id: sourceInfo.id,
      source_name: sourceInfo.name,
      source_domain: sourceInfo.domain,
      scraped_at: Date.now(),
      ai_classified: false
    };

    const uncategorizedRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection('uncategorized');

    const docRef = await uncategorizedRef.add(enrichedArticle);

    const articleWithId = {
      ...enrichedArticle,
      article_id: docRef.id
    };

    triggerN8nWorkflowSync(articleWithId).catch(err => {});

    await db.collection(COLLECTIONS.SOURCES).doc(sourceInfo.id).update({
      total_articles: FieldValue.increment(1)
    }).catch(err => {});

    return { id: docRef.id, ...enrichedArticle, isDuplicate: false, status: 'pending_classification' };

  } catch (error) {
    throw error;
  }
};

const getAllSources = async () => {
  try {
    const snapshot = await db.collection(COLLECTIONS.SOURCES).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
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
    throw error;
  }
};


const getArticles = async (filters = {}) => {
  try {
    const articlesRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES);

    let articles = [];

    const collections = await articlesRef.listCollections();
    const categoryNames = collections.map(col => col.id);

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

        if (filters.source_id) {
          articles = articles.filter(a => a.source_id === filters.source_id && a.category_id === filters.category_id);
        } else {
          articles = articles.filter(a => a.category_id === filters.category_id);
        }
      }
    } else if (filters.source_id) {
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

    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    if (filters.limit) {
      articles = articles.slice(0, filters.limit);
    }

    return articles;
  } catch (error) {
    throw error;
  }
};


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
    throw error;
  }
};


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
    
    articles = articles.filter(a => a.category_id === categoryId);
    
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));
    
    if (limit) {
      articles = articles.slice(0, limit);
    }
    
    return articles;
  } catch (error) {
    throw error;
  }
};


const deleteSource = async (sourceId) => {
  try {
    const categories = await getCategoriesBySource(sourceId);
    
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
      
      await db.collection(COLLECTIONS.CATEGORIES).doc(category.id).delete();
    }
    
    await db.collection(COLLECTIONS.SOURCES).doc(sourceId).delete();
    
    return { success: true };
  } catch (error) {
    throw error;
  }
};


const updateSource = async (sourceId, updates) => {
  try {
    await db.collection(COLLECTIONS.SOURCES).doc(sourceId).update({
      ...updates,
      updated_at: Date.now()
    });
    
    return { success: true };
  } catch (error) {
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
