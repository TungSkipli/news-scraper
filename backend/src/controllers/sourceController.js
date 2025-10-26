const {
  getAllSources,
  getSourceByDomain,
  getCategoriesBySource,
  getArticles
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
    
    const { db } = require('../config/firebase');
    const doc = await db.collection('sources').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Source not found'
      });
    }
    
    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
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
    
    console.log('Fetching articles with filters:', { source_id, category_id, limit });
    
    const filters = {
      source_id,
      category_id,
      limit: limit ? parseInt(limit) : 50
    };
    
    const articles = await getArticles(filters);
    
    console.log(`Found ${articles.length} articles for source_id: ${source_id || 'all'}`);
    
    res.json({
      success: true,
      data: articles,
      total: articles.length
    });
  } catch (error) {
    console.error('Error in getArticlesController:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get articles'
    });
  }
};

const getArticleController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { db } = require('../config/firebase');
    const doc = await db
      .collection('news')
      .doc('articles')
      .collection('global')
      .doc(id)
      .get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get article'
    });
  }
};

module.exports = {
  getSourcesController,
  getSourceController,
  getSourceCategoriesController,
  getArticlesController,
  getArticleController
};