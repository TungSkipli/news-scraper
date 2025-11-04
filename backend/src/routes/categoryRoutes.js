const express = require('express');
const router = express.Router();
const {
  exportCategories,
  createCategory
} = require('../controllers/categoryController');

router.get('/export', exportCategories);
router.post('/create', createCategory);

module.exports = router;
