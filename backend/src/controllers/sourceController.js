const {
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
  getCategoriesCountBySource
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
    console.error('[getArticlesController] Error:', error);
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
    console.error('[getArticleController] Error:', error);
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

const getArticlesByCategoryController = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit } = req.query;
    
    const articles = await getArticlesByCategory(categoryId, limit ? parseInt(limit) : 50);
    
    res.json({
      success: true,
      data: articles,
      total: articles.length
    });
  } catch (error) {
    console.error('[getArticlesByCategoryController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get articles by category'
    });
  }
};

const getUniqueCategoriesListController = async (req, res) => {
  try {
    const categories = await getUniqueCategoriesList();
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('[getUniqueCategoriesListController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unique categories'
    });
  }
};

const getArticlesBySourceAndCategoryController = async (req, res) => {
  try {
    const { sourceId, categoryId } = req.params;
    const { limit } = req.query;
    
    const articles = await getArticlesBySourceAndCategory(sourceId, categoryId, limit ? parseInt(limit) : 50);
    
    res.json({
      success: true,
      data: articles,
      total: articles.length
    });
  } catch (error) {
    console.error('[getArticlesBySourceAndCategoryController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get articles by source and category'
    });
  }
};

const getCategoriesCountBySourceController = async (req, res) => {
  try {
    const { sourceId } = req.params;
    
    const categories = await getCategoriesCountBySource(sourceId);
    
    res.json({
      success: true,
      data: categories,
      total: categories.length
    });
  } catch (error) {
    console.error('[getCategoriesCountBySourceController] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get categories count by source'
    });
  }
};

module.exports = {
  getSourcesController,
  getSourceController,
  getSourceCategoriesController,
  getAllCategoriesController,
  getArticlesController,
  getArticleController,
  getArticlesByCategoryController,
  getUniqueCategoriesListController,
  getArticlesBySourceAndCategoryController,
  getCategoriesCountBySourceController
};