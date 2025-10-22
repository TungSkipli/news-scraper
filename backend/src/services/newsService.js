const { db } = require('../config/firebase');
const { FIREBASE_COLLECTIONS } = require('../utils/constants');

const getAllNews = async ({ page = 1, limit = 12, search = '', tag = '' }) => {
  try {
    let query = db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.TECH);

    if (tag) {
      query = query.where('tags', 'array-contains', tag);
      
      const snapshot = await query.get();
      let articles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

      if (search) {
        const searchLower = search.toLowerCase();
        articles = articles.filter(article => 
          article.title?.toLowerCase().includes(searchLower) ||
          article.summary?.toLowerCase().includes(searchLower) ||
          article.content?.toLowerCase().includes(searchLower)
        );
      }

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
    } else {
      query = query.orderBy('published_at', 'desc');

      const snapshot = await query.get();
      let articles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (search) {
        const searchLower = search.toLowerCase();
        articles = articles.filter(article => 
          article.title?.toLowerCase().includes(searchLower) ||
          article.summary?.toLowerCase().includes(searchLower) ||
          article.content?.toLowerCase().includes(searchLower)
        );
      }

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
    }
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
};

const getNewsById = async (id) => {
  try {
    const doc = await db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.TECH)
      .doc(id)
      .get();
    
    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error fetching news by ID:', error);
    throw error;
  }
};

const getStats = async () => {
  try {
    const snapshot = await db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.TECH)
      .get();
    const articles = snapshot.docs.map(doc => doc.data());

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
    console.error('Error fetching stats:', error);
    throw error;
  }
};

const getAllTags = async () => {
  try {
    const snapshot = await db.collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.TECH)
      .get();
    const articles = snapshot.docs.map(doc => doc.data());

    const tagsSet = new Set();
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

module.exports = {
  getAllNews,
  getNewsById,
  getStats,
  getAllTags
};
