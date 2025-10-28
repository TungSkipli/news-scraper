const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/sourceController');

router.get('/sources', getSourcesController);

router.get('/sources/:id', getSourceController);

router.get('/sources/:id/categories', getSourceCategoriesController);

router.get('/sources/:sourceId/articles-categories', getCategoriesCountBySourceController);

router.get('/sources/:sourceId/categories/:categoryId/articles', getArticlesBySourceAndCategoryController);

router.get('/categories', getAllCategoriesController);

router.get('/articles', getArticlesController);

router.get('/articles/categories', getUniqueCategoriesListController);

router.get('/articles/category/:categoryId', getArticlesByCategoryController);

router.get('/articles/:id', getArticleController);

module.exports = router;