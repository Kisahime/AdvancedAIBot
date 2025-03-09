const { GoogleGenerativeAI } = require("@google/generative-ai");

// Validate Google API key
if (!process.env.GOOGLE_API_KEY) {
  throw new Error('Missing Google API key. Please check your .env file.');
}

// In development mode, we'll allow using the placeholder key for testing
const isDevMode = process.env.NODE_ENV === 'development';
const apiKey = (isDevMode && process.env.GOOGLE_API_KEY === 'your_google_api_key') 
  ? 'AIfakekey123fsdtertydgdfgdhje' // This is a fake key for development only
  : process.env.GOOGLE_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);
// Set the system instruction during model initialization
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a cat. Your name is Neko.",
});

/**
 * Detects if a user message requires web browsing
 * @param {string} message - The user's message
 * @param {object} context - Conversation context from memory
 * @returns {boolean} - Whether browsing is needed
 */
exports.detectBrowsingIntent = (message, context) => {
  // Keywords that suggest browsing intent
  const browsingKeywords = [
    'search', 'find', 'look up', 'google', 'web', 'internet',
    'browse', 'website', 'page', 'link', 'url', 'http', 'www',
    'latest', 'news', 'information about', 'what is', 'who is',
    'where is', 'when is', 'how to'
  ];

  // Check if message contains browsing keywords
  const messageLower = message.toLowerCase();
  const needsBrowsing = browsingKeywords.some(keyword => 
    messageLower.includes(keyword.toLowerCase())
  );

  // Also check if the message contains a URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const containsUrl = urlRegex.test(message);

  return needsBrowsing || containsUrl;
};

/**
 * Extracts search queries or URLs from a user message
 * @param {string} message - The user's message
 * @param {object} context - Conversation context from memory
 * @returns {Array} - List of search queries or URLs
 */
exports.extractBrowsingQueries = (message, context) => {
  // Extract URLs if present
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.match(urlRegex) || [];

  // If URLs found, return them
  if (urls.length > 0) {
    return urls;
  }

  // Otherwise, extract search queries
  // Remove question words and common phrases
  let query = message
    .replace(/^(can you|could you|please|help me|i want to|i need to)\s+/i, '')
    .replace(/^(search for|find|look up|tell me about|what is|who is|where is|when is|how to)\s+/i, '')
    .trim();

  // If query is too long, take just the main part
  if (query.length > 100) {
    query = query.substring(0, 100);
  }

  return [query];
};

/**
 * Generates an AI response based on user message, context, and browsing results
 * @param {object} params - Parameters for response generation
 * @returns {object} - AI response with content, reasoning, and sources
 */
exports.generateResponse = async ({ message, conversationContext, browsingResults }) => {
  try {
    // Prepare system instructions
    const systemInstructions = `You are an advanced AI assistant with web browsing capabilities. 
      You have access to both conversation history and web browsing results.
      When responding, provide thoughtful, accurate answers based on the available information.
      If you use information from web browsing, cite your sources.`;

    // Prepare conversation history from context
    const conversationHistory = conversationContext.recentMessages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');

    // Prepare browsing results if available
    let browsingContent = '';
    if (browsingResults) {
      browsingContent = `Web browsing results:\n${browsingResults.content}\n\nSources:\n`;
      browsingResults.sources.forEach((source, index) => {
        browsingContent += `[${index + 1}] ${source.title} - ${source.url}\n`;
      });
    }

    // Prepare complete prompt with context, browsing results, and user message
    const fullPrompt = `${systemInstructions}\n\n` + 
      (conversationHistory ? `Conversation history:\n${conversationHistory}\n\n` : '') + 
      (browsingResults ? `${browsingContent}\n\n` : '') + 
      `User's current message: ${message}`;

    // Call Google Generative AI API
    const result = await model.generateContent(fullPrompt);
    const responseContent = result.response.text();

    // Extract reasoning and sources (if any)
    // This is a simplified approach - in a real system you might want more sophisticated parsing
    const reasoning = 'Based on conversation context and available information';
    const sources = browsingResults ? browsingResults.sources : [];

    return {
      content: responseContent,
      reasoning,
      sources
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      content: 'I apologize, but I encountered an error while processing your request. Please try again later.',
      reasoning: 'Error in AI service',
      sources: []
    };
  }
};