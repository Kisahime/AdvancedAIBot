const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');

// Route for retrieving memory for a specific conversation
router.get('/conversation/:conversationId', memoryController.getConversationMemory);

// Route for retrieving memory related to a specific topic
router.get('/topic/:topic', memoryController.getTopicMemory);

// Route for manually adding memory entries
router.post('/entry', memoryController.addMemoryEntry);

// Route for updating memory retention settings
router.put('/settings', memoryController.updateMemorySettings);

// Route for clearing specific memory entries
router.delete('/entry/:entryId', memoryController.deleteMemoryEntry);

// Route for clearing all memory for a conversation
router.delete('/conversation/:conversationId', memoryController.clearConversationMemory);

module.exports = router;