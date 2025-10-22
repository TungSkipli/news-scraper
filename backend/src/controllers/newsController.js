const { getAllNews, getNewsById, getStats, getAllTags } = require('../services/newsService');

const getNews = async (req, res, next) => {
  try {
    const { page, limit, search, tag } = req.query;
    
    const result = await getAllNews({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      search: search || '',
      tag: tag || ''
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in getNews:', error);
    next(error);
  }
};

const getNewsDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await getNewsById(id);

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
    console.error('Error in getNewsDetail:', error);
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
    console.error('Error in getNewsStats:', error);
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
    console.error('Error in getTags:', error);
    next(error);
  }
};

module.exports = {
  getNews,
  getNewsDetail,
  getNewsStats,
  getTags
};
