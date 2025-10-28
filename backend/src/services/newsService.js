const { db } = require('../config/firebase');
const { FIREBASE_COLLECTIONS, normalizeCategory } = require('../utils/constants');

const getAllArticlesFromAllCategories = async (category = null) => {
  try {
    const categoryRef = db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.CATEGORY);
    
    let articles = [];

    if (category) {
      const normalizedCategory = normalizeCategory(category);
      const itemsSnapshot = await categoryRef
        .doc(normalizedCategory)
        .collection('items')
        .get();
      
      articles = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        category: normalizedCategory,
        ...doc.data()
      }));
    } else {
      const categoriesSnapshot = await categoryRef.get();
      
      for (const categoryDoc of categoriesSnapshot.docs) {
        const itemsSnapshot = await categoryRef
          .doc(categoryDoc.id)
          .collection('items')
          .get();
        
        const categoryArticles = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          category: categoryDoc.id,
          ...doc.data()
        }));
        
        articles = articles.concat(categoryArticles);
      }
    }

    if (articles.length === 0) {
      const legacySnapshot = await db.collection(FIREBASE_COLLECTIONS.NEWS)
        .doc(FIREBASE_COLLECTIONS.ARTICLES)
        .collection('global')
        .get();
      
      articles = legacySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    return articles;
  } catch (error) {
    console.error('[getAllArticlesFromAllCategories] Error:', error);
    throw error;
  }
};

const getAllNews = async ({ page = 1, limit = 12, search = '', tag = '', category = '' }) => {
  try {
    let articles = await getAllArticlesFromAllCategories(category || null);

    if (tag) {
      articles = articles.filter(article => 
        article.tags && Array.isArray(article.tags) && article.tags.includes(tag)
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      articles = articles.filter(article => 
        article.title?.toLowerCase().includes(searchLower) ||
        article.summary?.toLowerCase().includes(searchLower) ||
        article.content?.toLowerCase().includes(searchLower)
      );
    }

    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    const total = articles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedArticles = articles.slice(startIndex, endIndex);

    return {
      articles: paginatedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    throw error;
  }
};

const getNewsById = async (id, category = null) => {
  try {
    const categoryRef = db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.CATEGORY);

    if (category) {
      const normalizedCategory = normalizeCategory(category);
      const doc = await categoryRef
        .doc(normalizedCategory)
        .collection('items')
        .doc(id)
        .get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          category: normalizedCategory,
          ...doc.data()
        };
      }
      return null;
    }

    const categoriesSnapshot = await categoryRef.get();
    
    for (const categoryDoc of categoriesSnapshot.docs) {
      const doc = await categoryRef
        .doc(categoryDoc.id)
        .collection('items')
        .doc(id)
        .get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          category: categoryDoc.id,
          ...doc.data()
        };
      }
    }

    const legacyDoc = await db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection('global')
      .doc(id)
      .get();
    
    if (legacyDoc.exists) {
      return {
        id: legacyDoc.id,
        ...legacyDoc.data()
      };
    }

    return null;
  } catch (error) {
    console.error('[getNewsById] Error:', error);
    throw error;
  }
};

const getStats = async () => {
  try {
    const articles = await getAllArticlesFromAllCategories();

    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const todayCount = articles.filter(a => a.published_at >= oneDayAgo).length;
    const weekCount = articles.filter(a => a.published_at >= oneWeekAgo).length;

    const tagCounts = {};
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();
      
      const count = articles.filter(a => 
        a.published_at >= dayStart && a.published_at <= dayEnd
      ).length;

      last7Days.push({
        date: new Date(dayStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        count
      });
    }

    return {
      total: articles.length,
      today: todayCount,
      week: weekCount,
      topTags,
      last7Days
    };
  } catch (error) {
    throw error;
  }
};

const getAllTags = async () => {
  try {
    const articles = await getAllArticlesFromAllCategories();

    const tagsSet = new Set();
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    throw error;
  }
};

const getFeaturedNews = async ({ limit = 6 }) => {
  try {
    const articles = await getAllArticlesFromAllCategories();
    
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    return articles.slice(0, limit);
  } catch (error) {
    throw error;
  }
};

const getLatestNews = async ({ limit = 10 }) => {
  try {
    const articles = await getAllArticlesFromAllCategories();
    
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    return articles.slice(0, limit);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllNews,
  getNewsById,
  getStats,
  getAllTags,
  getFeaturedNews,
  getLatestNews
};
