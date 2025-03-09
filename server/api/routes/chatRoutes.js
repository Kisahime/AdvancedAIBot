const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Route for sending a message to the chatbot
router.post('/message', chatController.sendMessage);

// Route for getting conversation history
router.get('/history/:conversationId', chatController.getConversationHistory);

// Route for creating a new conversation
router.post('/conversation', chatController.createConversation);

// Route for listing all conversations
router.get('/conversations', chatController.listConversations);

// Route for deleting a conversation
router.delete('/conversation/:conversationId', chatController.deleteConversation);

module.exports = router;