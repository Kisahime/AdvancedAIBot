const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['fact', 'preference', 'context', 'insight'],
    default: 'fact'
  },
  importance: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  topics: {
    type: [String],
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient querying by topic and importance
MemorySchema.index({ topics: 1, importance: -1 });

module.exports = mongoose.model('Memory', MemorySchema);