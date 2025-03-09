const Memory = require('../../models/Memory');
const Conversation = require('../../models/Conversation');
const aiService = require('../../services/aiService');

/**
 * Get memory entries for a specific conversation
 */
exports.getConversationMemory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50 } = req.query;

    const memories = await Memory.find({ conversationId })
      .sort({ importance: -1, timestamp: -1 })
      .limit(parseInt(limit));

    return res.status(200).json(memories);
  } catch (error) {
    console.error('Error retrieving conversation memory:', error);
    return res.status(500).json({ message: 'Error retrieving memory', error: error.message });
  }
};

/**
 * Get memory entries related to a specific topic
 */
exports.getTopicMemory = async (req, res) => {
  try {
    const { topic } = req.params;
    const { limit = 20 } = req.query;

    const memories = await Memory.find(
      { topics: topic },
      null,
      { sort: { importance: -1, timestamp: -1 }, limit: parseInt(limit) }
    );

    return res.status(200).json(memories);
  } catch (error) {
    console.error('Error retrieving topic memory:', error);
    return res.status(500).json({ message: 'Error retrieving topic memory', error: error.message });
  }
};

/**
 * Add a new memory entry
 */
exports.addMemoryEntry = async (req, res) => {
  try {
    const { conversationId, content, type, importance = 1 } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Memory content is required' });
    }

    // Extract topics using AI service
    const topics = await aiService.extractTopics(content);

    const memory = await Memory.create({
      conversationId,
      content,
      type,
      importance,
      topics,
      timestamp: new Date()
    });

    return res.status(201).json(memory);
  } catch (error) {
    console.error('Error adding memory entry:', error);
    return res.status(500).json({ message: 'Error adding memory entry', error: error.message });
  }
};

/**
 * Update memory retention settings
 */
exports.updateMemorySettings = async (req, res) => {
  try {
    const { retentionPeriod, importanceThreshold } = req.body;

    // Update environment variables or configuration
    process.env.MEMORY_RETENTION_PERIOD = retentionPeriod || process.env.MEMORY_RETENTION_PERIOD;
    
    // Clean up old memories based on new settings
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionPeriod);

    await Memory.deleteMany({
      timestamp: { $lt: cutoffDate },
      importance: { $lt: importanceThreshold }
    });

    return res.status(200).json({
      message: 'Memory settings updated successfully',
      settings: {
        retentionPeriod,
        importanceThreshold
      }
    });
  } catch (error) {
    console.error('Error updating memory settings:', error);
    return res.status(500).json({ message: 'Error updating memory settings', error: error.message });
  }
};

/**
 * Delete a specific memory entry
 */
exports.deleteMemoryEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const deletedMemory = await Memory.findByIdAndDelete(entryId);
    if (!deletedMemory) {
      return res.status(404).json({ message: 'Memory entry not found' });
    }

    return res.status(200).json({ message: 'Memory entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory entry:', error);
    return res.status(500).json({ message: 'Error deleting memory entry', error: error.message });
  }
};

/**
 * Clear all memory for a conversation
 */
exports.clearConversationMemory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Memory.deleteMany({ conversationId });

    return res.status(200).json({ message: 'Conversation memory cleared successfully' });
  } catch (error) {
    console.error('Error clearing conversation memory:', error);
    return res.status(500).json({ message: 'Error clearing conversation memory', error: error.message });
  }
};