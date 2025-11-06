const express = require('express');
const router = express.Router();
const {
  saveArticleFromWorkflow
} = require('../controllers/workflowController');

router.post('/save-article', saveArticleFromWorkflow);

module.exports = router;
