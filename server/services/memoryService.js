const Memory = require('../models/Memory');
const Message = require('../models/Message');

/**
 * Retrieves conversation context from memory
 * @param {string} conversationId - ID of the conversation
 * @returns {object} - Conversation context including recent messages
 */
exports.getConversationContext = async (conversationId) => {
  try {
    // Get memory entries for this conversation
    const memoryEntries = await Memory.find({ conversationId })
      .sort({ importance: -1, timestamp: -1 })
      .limit(10);
    
    // Get recent messages for context
    const recentMessages = await Message.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(10)
      .sort({ timestamp: 1 }); // Re-sort to get chronological order
    
    return {
      memoryEntries,
      recentMessages
    };
  } catch (error) {
    console.error('Error retrieving conversation context:', error);
    return {
      memoryEntries: [],
      recentMessages: []
    };
  }
};

/**
 * Updates memory with new interaction
 * @param {string} conversationId - ID of the conversation
 * @param {object} userMessage - User message object
 * @param {object} botMessage - Bot message object
 */
exports.updateMemory = async (conversationId, userMessage, botMessage) => {
  try {
    // Extract key information from the messages
    const userContent = userMessage.content;
    const botContent = botMessage.content;
    
    // Create a memory entry for this interaction
    await Memory.create({
      conversationId,
      content: `User asked: ${userContent.substring(0, 100)}... Bot responded about: ${botContent.substring(0, 100)}...`,
      importance: calculateImportance(userContent, botContent),
      timestamp: new Date()
    });
    
    // Clean up old, less important memories if needed
    const memoryCount = await Memory.countDocuments({ conversationId });
    if (memoryCount > 50) { // Arbitrary limit
      // Find and delete least important memories
      const oldMemories = await Memory.find({ conversationId })
        .sort({ importance: 1, timestamp: 1 })
        .limit(memoryCount - 50);
      
      if (oldMemories.length > 0) {
        const oldMemoryIds = oldMemories.map(m => m._id);
        await Memory.deleteMany({ _id: { $in: oldMemoryIds } });
      }
    }
  } catch (error) {
    console.error('Error updating memory:', error);
  }
};

/**
 * Clears all memory related to a conversation
 * @param {string} conversationId - ID of the conversation to clear
 */
exports.clearConversationMemory = async (conversationId) => {
  try {
    await Memory.deleteMany({ conversationId });
  } catch (error) {
    console.error('Error clearing conversation memory:', error);
  }
};

/**
 * Calculates importance score for a memory entry
 * @param {string} userContent - User message content
 * @param {string} botContent - Bot message content
 * @returns {number} - Importance score (0-10)
 */
function calculateImportance(userContent, botContent) {
  // This is a simplified approach - in a real system you'd want more sophisticated analysis
  let score = 5; // Default medium importance
  
  // Keywords that might indicate importance
  const importantKeywords = [
    'remember', 'important', 'crucial', 'key', 'essential',
    'don\'t forget', 'note', 'critical', 'vital', 'significant'
  ];
  
  // Check for important keywords in either message
  const combinedContent = (userContent + ' ' + botContent).toLowerCase();
  for (const keyword of importantKeywords) {
    if (combinedContent.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }
  
  // Cap the score at 10
  return Math.min(score, 10);
}