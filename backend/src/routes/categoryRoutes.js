const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  syncCategoriesFromFirestore
} = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.post('/', createCategory);
router.post('/sync', syncCategoriesFromFirestore);

module.exports = router;
