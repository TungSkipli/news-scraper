const { db } = require('../config/firebase');
const { FIREBASE_COLLECTIONS, normalizeCategory } = require('../utils/constants');

/**
 * Get article reference path: news/articles/{category}
 */
const getCategoryCollection = (category) => {
  return db
    .collection(FIREBASE_COLLECTIONS.NEWS)
    .doc(FIREBASE_COLLECTIONS.ARTICLES)
    .collection(normalizeCategory(category));
};

/**
 * Get all categories from Firebase
 */
const getAllCategories = async () => {
  try {
    const articlesRef = db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES);
    
    const collections = await articlesRef.listCollections();
    return collections.map(col => col.id);
  } catch (error) {
    console.error('[getAllCategories] Error:', error);
    return [];
  }
};

/**
 * Fetch articles from a specific category
 */
const getArticlesByCategory = async (category) => {
  try {
    const categoryRef = getCategoryCollection(category);
    const snapshot = await categoryRef.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      category: normalizeCategory(category),
      ...doc.data()
    }));
  } catch (error) {
    console.error(`[getArticlesByCategory] Error fetching ${category}:`, error);
    return [];
  }
};

/**
 * Fetch all articles from all categories
 */
const getAllArticles = async (categoryFilter = null) => {
  try {
    if (categoryFilter) {
      return await getArticlesByCategory(categoryFilter);
    }

    const categories = await getAllCategories();
    const articlePromises = categories.map(cat => getArticlesByCategory(cat));
    const articlesArrays = await Promise.all(articlePromises);
    
    return articlesArrays.flat();
  } catch (error) {
    console.error('[getAllArticles] Error:', error);
    throw error;
  }
};

/**
 * Get paginated news with filters
 */
const getAllNews = async ({ page = 1, limit = 12, search = '', tag = '', category = '' }) => {
  try {
    let articles = await getAllArticles(category || null);

    // Filter by tag
    if (tag) {
      articles = articles.filter(article => 
        article.tags && Array.isArray(article.tags) && article.tags.includes(tag)
      );
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      articles = articles.filter(article => 
        article.title?.toLowerCase().includes(searchLower) ||
        article.summary?.toLowerCase().includes(searchLower) ||
        article.content?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by published date (newest first)
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    // Pagination
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
    console.error('[getAllNews] Error:', error);
    throw error;
  }
};

/**
 * Get single article by ID and category
 */
const getNewsById = async (id, category = null) => {
  try {
    // If category is provided, search directly
    if (category) {
      const categoryRef = getCategoryCollection(category);
      const doc = await categoryRef.doc(id).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          category: normalizeCategory(category),
          ...doc.data()
        };
      }
      return null;
    }

    // Search across all categories
    const categories = await getAllCategories();
    
    for (const cat of categories) {
      const categoryRef = getCategoryCollection(cat);
      const doc = await categoryRef.doc(id).get();
      
      if (doc.exists) {
        return {
          id: doc.id,
          category: cat,
          ...doc.data()
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[getNewsById] Error:', error);
    throw error;
  }
};

/**
 * Get news statistics
 */
const getStats = async () => {
  try {
    const articles = await getAllArticles();

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
    console.error('[getStats] Error:', error);
    throw error;
  }
};

const getAllTags = async () => {
  try {
    const articles = await getAllArticles();

    const tagsSet = new Set();
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('[getAllTags] Error:', error);
    throw error;
  }
};

/**
 * Get all categories with article counts
 */
const getCategoriesWithCounts = async () => {
  try {
    const categories = await getAllCategories();
    
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const articles = await getArticlesByCategory(category);
        return {
          category: category,
          count: articles.length
        };
      })
    );

    // Sort by count descending
    categoriesWithCounts.sort((a, b) => b.count - a.count);
    
    return categoriesWithCounts;
  } catch (error) {
    console.error('[getCategoriesWithCounts] Error:', error);
    throw error;
  }
};

/**
 * Get featured news articles
 */
const getFeaturedNews = async ({ limit = 6 }) => {
  try {
    const articles = await getAllArticles();
    
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    return articles.slice(0, limit);
  } catch (error) {
    console.error('[getFeaturedNews] Error:', error);
    throw error;
  }
};

/**
 * Get latest news articles
 */
const getLatestNews = async ({ limit = 10 }) => {
  try {
    const articles = await getAllArticles();
    
    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    return articles.slice(0, limit);
  } catch (error) {
    console.error('[getLatestNews] Error:', error);
    throw error;
  }
};

/**
 * Get news by category
 */
const getNewsByCategory = async (category, { page = 1, limit = 12 }) => {
  try {
    const articles = await getArticlesByCategory(category);
    
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
    console.error('[getNewsByCategory] Error:', error);
    throw error;
  }
};

module.exports = {
  getAllNews,
  getNewsById,
  getStats,
  getAllTags,
  getFeaturedNews,
  getLatestNews,
  getNewsByCategory,
  getCategoriesWithCounts,
  getCategoryCollection
};
