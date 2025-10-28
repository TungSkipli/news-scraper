const { db, FieldValue } = require('../config/firebase');
const { createSlug } = require('../utils/slugGenerator');
const { normalizeCategory } = require('../utils/constants');

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

const saveArticle = async (articleData, sourceInfo, categoryInfo) => {
  try {
    const normalizedCategory = normalizeCategory(categoryInfo.name);
    
    const itemsRef = db
      .collection('news')
      .doc('articles')
      .collection('category')
      .doc(normalizedCategory)
      .collection('items');

    if (articleData.url || articleData.external_source) {
      const articleUrl = articleData.url || articleData.external_source;
      const existingArticle = await itemsRef
        .where('external_source', '==', articleUrl)
        .limit(1)
        .get();
      
      if (!existingArticle.empty) {
        const existingDoc = existingArticle.docs[0];
        return { id: existingDoc.id, ...existingDoc.data() };
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

    const docRef = await itemsRef.add(enrichedArticle);

    await db.collection(COLLECTIONS.SOURCES).doc(sourceInfo.id).update({
      total_articles: FieldValue.increment(1)
    });

    await db.collection(COLLECTIONS.CATEGORIES).doc(categoryInfo.id).update({
      total_articles: FieldValue.increment(1)
    });

    return { id: docRef.id, ...enrichedArticle };

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
    const categoryRef = db.collection('news')
      .doc('articles')
      .collection('category');

    let articles = [];

    if (filters.category_id) {
      const categoryDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(filters.category_id).get();
      
      if (categoryDoc.exists) {
        const categoryData = categoryDoc.data();
        
        if (filters.source_id) {
          const normalizedCategory = normalizeCategory(categoryData.name);
          
          const snapshot = await categoryRef.doc(normalizedCategory).collection('items').get();
          
          articles = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            category: normalizedCategory,
            ...doc.data() 
          }));

          articles = articles.filter(a => a.source_id === filters.source_id && a.category_id === filters.category_id);
        } else {
          const categorySlug = categoryData.slug;
          
          const allCategoriesWithSlug = await db.collection(COLLECTIONS.CATEGORIES)
            .where('slug', '==', categorySlug)
            .get();
          
          const validCategoryIds = new Set();
          const normalizedCategories = new Set();
          
          allCategoriesWithSlug.docs.forEach(doc => {
            const cat = doc.data();
            validCategoryIds.add(doc.id);
            normalizedCategories.add(normalizeCategory(cat.name));
          });
          
          for (const normCat of normalizedCategories) {
            const snapshot = await categoryRef.doc(normCat).collection('items').get();
            const categoryArticles = snapshot.docs.map(doc => ({ 
              id: doc.id, 
              category: normCat,
              ...doc.data() 
            }));
            
            const filteredArticles = categoryArticles.filter(a => validCategoryIds.has(a.category_id));
            articles = articles.concat(filteredArticles);
          }
        }
      }
    } else if (filters.source_id) {
      const categoriesMetadata = await db.collection(COLLECTIONS.CATEGORIES).get();
      
      const normalizedCategoryNames = new Set();
      categoriesMetadata.docs.forEach(doc => {
        const categoryData = doc.data();
        const normalizedName = normalizeCategory(categoryData.name);
        normalizedCategoryNames.add(normalizedName);
      });
      
      for (const normalizedName of normalizedCategoryNames) {
        const snapshot = await categoryRef.doc(normalizedName).collection('items').get();
        const categoryArticles = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          category: normalizedName,
          ...doc.data() 
        }));
        
        articles = articles.concat(categoryArticles.filter(a => a.source_id === filters.source_id));
      }
    } else {
      const categoriesMetadata = await db.collection(COLLECTIONS.CATEGORIES).get();
      
      const normalizedCategoryNames = new Set();
      categoriesMetadata.docs.forEach(doc => {
        const categoryData = doc.data();
        const normalizedName = normalizeCategory(categoryData.name);
        normalizedCategoryNames.add(normalizedName);
      });
      
      for (const normalizedName of normalizedCategoryNames) {
        const snapshot = await categoryRef.doc(normalizedName).collection('items').get();
        const categoryArticles = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          category: normalizedName,
          ...doc.data() 
        }));
        
        articles = articles.concat(categoryArticles);
      }
    }

    if (articles.length === 0 && !filters.category_id && !filters.source_id) {
      const legacySnapshot = await db.collection('news')
        .doc('articles')
        .collection('global')
        .get();
      
      articles = legacySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    }

    articles.sort((a, b) => (b.published_at || b.created_at || 0) - (a.published_at || a.created_at || 0));

    if (filters.limit) {
      articles = articles.slice(0, filters.limit);
    }

    return articles;
  } catch (error) {
    console.error('[getArticles] Error:', error);
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

const getArticleById = async (articleId) => {
  try {
    const categoryRef = db.collection('news')
      .doc('articles')
      .collection('category');

    const categoriesSnapshot = await categoryRef.get();
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      const doc = await categoryRef
        .doc(categoryDoc.id)
        .collection('items')
        .doc(articleId)
        .get();
      
      if (doc.exists) {
        return { 
          id: doc.id, 
          category: categoryDoc.id,
          ...doc.data() 
        };
      }
    }

    const legacyDoc = await db.collection('news')
      .doc('articles')
      .collection('global')
      .doc(articleId)
      .get();
    
    if (legacyDoc.exists) {
      return { 
        id: legacyDoc.id, 
        ...legacyDoc.data() 
      };
    }

    return null;
  } catch (error) {
    console.error('[getArticleById] Error:', error);
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
    
    const categoryRef = db.collection('news')
      .doc('articles')
      .collection('category');
    
    const snapshot = await categoryRef.doc(normalizedCategory).collection('items').get();
    
    let articles = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      category: normalizedCategory,
      ...doc.data() 
    }));

    articles.sort((a, b) => (b.published_at || b.created_at || 0) - (a.published_at || a.created_at || 0));
    
    if (limit) {
      articles = articles.slice(0, limit);
    }
    
    return articles;
  } catch (error) {
    console.error('[getArticlesByCategory] Error:', error);
    throw error;
  }
};

const getArticlesBySourceAndCategory = async (sourceId, categoryId, limit = 50) => {
  try {
    const categoryDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      return [];
    }
    
    const categoryData = categoryDoc.data();
    const normalizedCategory = normalizeCategory(categoryData.name);
    
    const categoryRef = db.collection('news')
      .doc('articles')
      .collection('category');
    
    const snapshot = await categoryRef.doc(normalizedCategory).collection('items').get();
    
    let articles = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      category: normalizedCategory,
      ...doc.data() 
    }));

    articles = articles.filter(a => a.source_id === sourceId);

    articles.sort((a, b) => (b.published_at || b.created_at || 0) - (a.published_at || a.created_at || 0));
    
    if (limit) {
      articles = articles.slice(0, limit);
    }
    
    return articles;
  } catch (error) {
    console.error('[getArticlesBySourceAndCategory] Error:', error);
    throw error;
  }
};

const getUniqueCategoriesList = async () => {
  try {
    const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORIES).get();
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const categoryMap = new Map();
    
    for (const category of categories) {
      const categoryKey = category.slug || createSlug(category.name);
      
      if (!categoryMap.has(categoryKey)) {
        categoryMap.set(categoryKey, {
          id: category.id,
          name: category.name,
          slug: categoryKey,
          total_articles: 0,
          sources: []
        });
      }
      
      const categoryEntry = categoryMap.get(categoryKey);
      const articleCount = category.total_articles || 0;
      
      categoryEntry.total_articles += articleCount;
      categoryEntry.sources.push({
        source_id: category.source_id,
        source_name: category.source_domain,
        article_count: articleCount
      });
    }
    
    const uniqueCategories = Array.from(categoryMap.values());
    uniqueCategories.sort((a, b) => b.total_articles - a.total_articles);
    
    return uniqueCategories;
  } catch (error) {
    console.error('[getUniqueCategoriesList] Error:', error);
    throw error;
  }
};

const getCategoriesCountBySource = async (sourceId) => {
  try {
    const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORIES)
      .where('source_id', '==', sourceId)
      .get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      article_count: doc.data().total_articles || 0
    }));
    
    categories.sort((a, b) => b.article_count - a.article_count);
    
    return categories;
  } catch (error) {
    console.error('[getCategoriesCountBySource] Error:', error);
    throw error;
  }
};

module.exports = {
  saveSource,
  saveCategory,
  saveArticle,
  getAllSources,
  getSourceByDomain,
  getCategoriesBySource,
  getAllCategories,
  getArticles,
  getSourceById,
  getArticleById,
  getArticlesByCategory,
  getArticlesBySourceAndCategory,
  getUniqueCategoriesList,
  getCategoriesCountBySource,
  COLLECTIONS
};