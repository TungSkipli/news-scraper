const {
  getAllSources,
  getSourceByDomain,
  getCategoriesBySource,
  getAllCategories,
  getArticles,
  getSourceById,
  getArticleById
} = require('../services/sourceService');

const getSourcesController = async (req, res) => {
  try {
    const sources = await getAllSources();
    
    res.json({
      success: true,
      data: sources,
      total: sources.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get sources'
    });
  }
};

const getSourceController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const source = await getSourceById(id);
    
    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Source not found'
      });
    }
    
    res.json({
      success: true,
      data: source
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get source'
    });
  }
};

const getSourceCategoriesController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const categories = await getCategoriesBySource(id);
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories'
    });
  }
};

const getArticlesController = async (req, res) => {
  try {
    const { source_id, category_id, limit } = req.query;
    
    const filters = {
      source_id,
      category_id,
      limit: limit ? parseInt(limit) : 50
    };
    
    const articles = await getArticles(filters);
    
    res.json({
      success: true,
      data: articles,
      total: articles.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get articles'
    });
  }
};

const getArticleController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await getArticleById(id);
    
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get article'
    });
  }
};

const getAllCategoriesController = async (req, res) => {
  try {
    const categories = await getAllCategories();
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories'
    });
  }
};

module.exports = {
  getSourcesController,
  getSourceController,
  getSourceCategoriesController,
  getAllCategoriesController,
  getArticlesController,
  getArticleController
};