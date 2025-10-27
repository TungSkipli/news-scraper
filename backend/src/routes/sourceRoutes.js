const express = require('express');
const router = express.Router();
const {
    getSourcesController,
    getSourceController,
    getSourceCategoriesController,
    getAllCategoriesController,
    getArticlesController,
    getArticleController
} = require('../controllers/sourceController');

router.get('/sources', getSourcesController);

router.get('/sources/:id', getSourceController);

router.get('/sources/:id/categories', getSourceCategoriesController);

router.get('/categories', getAllCategoriesController);

router.get('/articles', getArticlesController);

router.get('/articles/:id', getArticleController);

module.exports = router;