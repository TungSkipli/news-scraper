const { db, FieldValue } = require('../config/firebase');

const COLLECTIONS = {
  SOURCES: 'sources',
  CATEGORIES: 'categories',
  ARTICLES: 'news/articles/global'
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

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

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
    const enrichedArticle = {
      ...articleData,
      source_id: sourceInfo.id,
      source_name: sourceInfo.name,
      source_domain: sourceInfo.domain,
      category_id: categoryInfo.id,
      category_name: categoryInfo.name,
      category_slug: categoryInfo.slug,
      scraped_at: Date.now()
    };

    const docRef = await db
      .collection('news')
      .doc('articles')
      .collection('global')
      .add(enrichedArticle);

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
    let query = db.collection('news').doc('articles').collection('global');

    if (filters.source_id) {
      query = query.where('source_id', '==', filters.source_id);
    }

    if (filters.category_id) {
      query = query.where('category_id', '==', filters.category_id);
    }

    const snapshot = await query.get();
    let articles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    articles.sort((a, b) => (b.published_at || b.created_at || 0) - (a.published_at || a.created_at || 0));

    if (filters.limit) {
      articles = articles.slice(0, filters.limit);
    }

    return articles;
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
  getCategoriesBySource,
  getAllCategories,
  getArticles,
  COLLECTIONS
};