const mongoose = require('mongoose');

const BrowsingHistorySchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['search', 'url_visit'],
    required: true
  },
  query: {
    type: String,
    required: function() { return this.type === 'search'; }
  },
  url: {
    type: String,
    required: function() { return this.type === 'url_visit'; }
  },
  results: {
    type: Array,
    default: []
  },
  content: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
BrowsingHistorySchema.index({ conversationId: 1, timestamp: -1 });

module.exports = mongoose.model('BrowsingHistory', BrowsingHistorySchema);