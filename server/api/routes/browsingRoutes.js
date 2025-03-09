const express = require('express');
const router = express.Router();
const browsingController = require('../controllers/browsingController');

// Route for performing a web search
router.post('/search', browsingController.performSearch);

// Route for fetching content from a specific URL
router.post('/fetch-url', browsingController.fetchUrlContent);

// Route for getting browsing history
router.get('/history/:conversationId', browsingController.getBrowsingHistory);

// Route for clearing browsing cache
router.delete('/cache', browsingController.clearBrowsingCache);

module.exports = router;