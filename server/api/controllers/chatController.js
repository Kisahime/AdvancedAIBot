const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const aiService = require('../../services/aiService');
const memoryService = require('../../services/memoryService');
const browsingService = require('../../services/browsingService');

/**
 * Process a user message and generate a response
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
    } else {
      conversation = await Conversation.create({
        userId,
        title: message.substring(0, 30) + '...',
        createdAt: new Date()
      });
    }
    
    // Save user message to database
    const userMessage = await Message.create({
      conversationId: conversation._id,
      content: message,
      role: 'user',
      timestamp: new Date()
    });
    
    // Retrieve conversation context from memory
    const conversationContext = await memoryService.getConversationContext(conversation._id);
    
    // Check if web browsing is needed
    const requiresBrowsing = aiService.detectBrowsingIntent(message, conversationContext);
    let browsingResults = null;
    
    if (requiresBrowsing) {
      // Extract search queries or URLs from the message
      const browsingQueries = aiService.extractBrowsingQueries(message, conversationContext);
      
      // Perform web browsing
      browsingResults = await browsingService.browse(browsingQueries);
    }
    
    // Generate AI response with context and browsing results
    const aiResponse = await aiService.generateResponse({
      message,
      conversationContext,
      browsingResults
    });
    
    // Save AI response to database
    const botMessage = await Message.create({
      conversationId: conversation._id,
      content: aiResponse.content,
      role: 'assistant',
      metadata: {
        reasoning: aiResponse.reasoning,
        sources: aiResponse.sources,
        browsedContent: browsingResults ? browsingResults.summary : null
      },
      timestamp: new Date()
    });
    
    // Update conversation's last activity
    conversation.lastActivity = new Date();
    await conversation.save();
    
    // Update memory with new interaction
    await memoryService.updateMemory(conversation._id, userMessage, botMessage);
    
    return res.status(200).json({
      message: botMessage,
      conversation: conversation
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return res.status(500).json({ message: 'Error processing your message', error: error.message });
  }
};

/**
 * Get conversation history
 */
exports.getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const totalMessages = await Message.countDocuments({ conversationId });
    
    return res.status(200).json({
      messages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
      totalMessages
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return res.status(500).json({ message: 'Error fetching conversation history', error: error.message });
  }
};

/**
 * Create a new conversation
 */
exports.createConversation = async (req, res) => {
  try {
    const { userId, title } = req.body;
    
    const conversation = await Conversation.create({
      userId,
      title: title || 'New Conversation',
      createdAt: new Date(),
      lastActivity: new Date()
    });
    
    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ message: 'Error creating conversation', error: error.message });
  }
};

/**
 * List all conversations for a user
 */
exports.listConversations = async (req, res) => {
  try {
    const { userId } = req.query;
    const { page = 1, limit = 10 } = req.query;
    
    const query = userId ? { userId } : {};
    
    const conversations = await Conversation.find(query)
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const totalConversations = await Conversation.countDocuments(query);
    
    return res.status(200).json({
      conversations,
      totalPages: Math.ceil(totalConversations / limit),
      currentPage: page,
      totalConversations
    });
  } catch (error) {
    console.error('Error listing conversations:', error);
    return res.status(500).json({ message: 'Error listing conversations', error: error.message });
  }
};

/**
 * Delete a conversation
 */
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Delete the conversation
    const deletedConversation = await Conversation.findByIdAndDelete(conversationId);
    if (!deletedConversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });
    
    // Clean up memory related to this conversation
    await memoryService.clearConversationMemory(conversationId);
    
    return res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ message: 'Error deleting conversation', error: error.message });
  }
};