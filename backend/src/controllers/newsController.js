const { 
  getAllNews, 
  getNewsById, 
  getStats, 
  getAllTags, 
  getFeaturedNews, 
  getLatestNews,
  getNewsByCategory,
  getCategoriesWithCounts 
} = require('../services/newsService');

const getNews = async (req, res, next) => {
  try {
    const { page, limit, search, tag, category, sortBy } = req.query;
    
    const result = await getAllNews({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      search: search || '',
      tag: tag || '',
      category: category || '',
      sortBy: sortBy || 'desc'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[getNews] Error:', error);
    next(error);
  }
};

const getNewsByCategoryController = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page, limit, sortBy } = req.query;
    
    const result = await getNewsByCategory(category, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      sortBy: sortBy || 'desc'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[getNewsByCategoryController] Error:', error);
    next(error);
  }
};

const getNewsDetail = async (req, res, next) => {
  try {
    const { id, category } = req.params;
    const article = await getNewsById(id, category);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('[getNewsDetail] Error:', error);
    next(error);
  }
};

const getNewsStats = async (req, res, next) => {
  try {
    const stats = await getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[getNewsStats] Error:', error);
    next(error);
  }
};

const getTags = async (req, res, next) => {
  try {
    const tags = await getAllTags();

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('[getTags] Error:', error);
    next(error);
  }
};

const getFeatured = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const articles = await getFeaturedNews({ 
      limit: parseInt(limit) || 6 
    });

    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('[getFeatured] Error:', error);
    next(error);
  }
};

const getLatest = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const articles = await getLatestNews({ 
      limit: parseInt(limit) || 10 
    });

    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('[getLatest] Error:', error);
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await getCategoriesWithCounts();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('[getCategories] Error:', error);
    next(error);
  }
};

module.exports = {
  getNews,
  getNewsDetail,
  getNewsStats,
  getTags,
  getFeatured,
  getLatest,
  getNewsByCategoryController,
  getCategories
};