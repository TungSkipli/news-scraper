const { db, algoliaClient, algoliaIndexName } = require('../config/firebase');
const { FIREBASE_COLLECTIONS, normalizeCategory } = require('../utils/constants');

const getIndexName = (sortBy) => {
  const indexMap = {
    'desc': `${algoliaIndexName}_published_desc`,
    'asc': `${algoliaIndexName}_published_asc`,
    'title-asc': `${algoliaIndexName}_title_asc`,
    'title-desc': `${algoliaIndexName}_title_desc`
  };
  
  const selectedIndex = indexMap[sortBy] || algoliaIndexName;
  console.log(`[getIndexName] sortBy: ${sortBy} -> index: ${selectedIndex}`);
  return selectedIndex;
};

const getDateRangeTimestamp = (dateRange) => {
  const now = Date.now();
  
  switch(dateRange) {
    case 'recent':
      return now - (24 * 60 * 60 * 1000);
    case 'yesterday':
      const startOfYesterday = new Date();
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      startOfYesterday.setHours(0, 0, 0, 0);
      return startOfYesterday.getTime();
    case 'week':
      return now - (7 * 24 * 60 * 60 * 1000);
    case 'month':
      return now - (30 * 24 * 60 * 60 * 1000);
    case 'year':
      return now - (365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

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

const getAllNews = async ({ page = 1, limit = 12, search = '', tag = '', category = '', sortBy = 'desc', dateRange = '' }) => {
  try {
    console.log(`[getAllNews] dateRange: ${dateRange}, sortBy: ${sortBy}`);
    
    const filters = [];
    if (category) {
      filters.push(`category:${category}`);
    }

    if (dateRange) {
      const minTimestamp = getDateRangeTimestamp(dateRange);
      console.log(`[getAllNews] dateRange: ${dateRange} -> minTimestamp: ${minTimestamp}`);
      if (minTimestamp) {
        const filter = `published_at >= ${minTimestamp}`;
        console.log(`[getAllNews] Adding filter: ${filter}`);
        filters.push(filter);
      }
    }
    
    console.log(`[getAllNews] Final filters: ${filters.join(' AND ')}`);

    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: getIndexName(sortBy),
          query: search || '',
          hitsPerPage: limit,
          page: page - 1,
          filters: filters.join(' AND '),
          facets: ['category']
        }
      ]
    });

    const searchResult = results[0];
    const articles = searchResult.hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    const total = searchResult.nbHits;
    const totalPages = Math.ceil(total / limit);

    return {
      articles: articles,
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
          hitsPerPage: limit
        }
      ]
    });

    const articles = results[0].hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    return articles;
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
          hitsPerPage: limit
        }
      ]
    });

    const articles = results[0].hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    return articles;
  } catch (error) {
    console.error('[getLatestNews] Error:', error);
    throw error;
  }
};

const getNewsByCategory = async (category, { page = 1, limit = 12, sortBy = 'desc', dateRange = '' }) => {
  try {
    const filters = [`category:${category}`];

    if (dateRange) {
      const minTimestamp = getDateRangeTimestamp(dateRange);
      if (minTimestamp) {
        filters.push(`published_at >= ${minTimestamp}`);
      }
    }

    const { results } = await algoliaClient.search({
      requests: [
        {
          indexName: getIndexName(sortBy),
          query: '',
          hitsPerPage: limit,
          page: page - 1,
          filters: filters.join(' AND ')
        }
      ]
    });

    const searchResult = results[0];
    const articles = searchResult.hits.map(hit => ({
      id: hit.objectID,
      title: hit.title,
      summary: hit.summary,
      category: hit.category,
      image: { url: hit.image },
      published_at: hit.published_at
    }));

    const total = searchResult.nbHits;
    const totalPages = Math.ceil(total / limit);

    return {
      articles: articles,
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
