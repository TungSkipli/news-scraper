const { db, algoliaClient, algoliaIndexName } = require('../config/firebase');
const { FIREBASE_COLLECTIONS, normalizeCategory } = require('../utils/constants');

const getCategoryCollection = (category) => {
  return db
    .collection(FIREBASE_COLLECTIONS.NEWS)
    .doc(FIREBASE_COLLECTIONS.ARTICLES)
    .collection(normalizeCategory(category));
};

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

const getAllNews = async ({ page = 1, limit = 12, search = '', tag = '', category = '', sortBy = 'desc' }) => {
  try {
    const filters = [];
    if (category) {
      filters.push(`category:${category}`);
    }

    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query: search || '',
          hitsPerPage: 1000,
          filters: filters.join(' AND '),
          facets: ['category']
        }
      ]
    });

    const searchResult = results[0];
    let articles = searchResult.hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    articles.sort((a, b) => {
      if (sortBy === 'asc') {
        return (a.published_at || 0) - (b.published_at || 0);
      } else if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return (b.published_at || 0) - (a.published_at || 0);
    });

    const total = articles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

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

const getNewsById = async (id, category = null) => {
  try {
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

const getStats = async () => {
  try {
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query: '',
          hitsPerPage: 0
        }
      ]
    });

    const total = results[0].nbHits;

    return {
      total,
      today: 0,
      week: 0,
      topTags: [],
      last7Days: []
    };
  } catch (error) {
    console.error('[getStats] Error:', error);
    throw error;
  }
};

const getAllTags = async () => {
  try {
    return [];
  } catch (error) {
    console.error('[getAllTags] Error:', error);
    throw error;
  }
};

const getCategoriesWithCounts = async () => {
  try {
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query: '',
          hitsPerPage: 0,
          facets: ['category']
        }
      ]
    });

    const facets = results[0].facets?.category || {};
    const categoriesWithCounts = Object.entries(facets).map(([category, count]) => ({
      category,
      count
    }));

    categoriesWithCounts.sort((a, b) => b.count - a.count);
    
    return categoriesWithCounts;
  } catch (error) {
    console.error('[getCategoriesWithCounts] Error:', error);
    throw error;
  }
};

const getFeaturedNews = async ({ limit = 6 }) => {
  try {
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query: '',
          hitsPerPage: limit * 2
        }
      ]
    });

    let articles = results[0].hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    return articles.slice(0, limit);
  } catch (error) {
    console.error('[getFeaturedNews] Error:', error);
    throw error;
  }
};

const getLatestNews = async ({ limit = 10 }) => {
  try {
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query: '',
          hitsPerPage: limit * 2
        }
      ]
    });

    let articles = results[0].hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    articles.sort((a, b) => (b.published_at || 0) - (a.published_at || 0));

    return articles.slice(0, limit);
  } catch (error) {
    console.error('[getLatestNews] Error:', error);
    throw error;
  }
};

const getNewsByCategory = async (category, { page = 1, limit = 12, sortBy = 'desc' }) => {
  try {
    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: algoliaIndexName,
          query: '',
          hitsPerPage: 1000,
          filters: `category:${category}`
        }
      ]
    });

    const searchResult = results[0];
    let articles = searchResult.hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    articles.sort((a, b) => {
      if (sortBy === 'asc') {
        return (a.published_at || 0) - (b.published_at || 0);
      } else if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      return (b.published_at || 0) - (a.published_at || 0);
    });

    const total = articles.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedArticles = articles.slice(startIndex, startIndex + limit);

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
