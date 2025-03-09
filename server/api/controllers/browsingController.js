const axios = require('axios');
const puppeteer = require('puppeteer');
const BrowsingHistory = require('../../models/BrowsingHistory');

/**
 * Perform a web search using a search engine API
 */
exports.performSearch = async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    const { conversationId } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Use a search API or scrape search results
    // This is a simplified example using a hypothetical search API
    // In a real implementation, you would use a proper search API or implement web scraping
    const searchResults = await searchWeb(query, limit);
    
    // Save search to history if conversationId is provided
    if (conversationId) {
      await BrowsingHistory.create({
        conversationId,
        type: 'search',
        query,
        results: searchResults.map(r => ({ title: r.title, url: r.url })),
        timestamp: new Date()
      });
    }
    
    return res.status(200).json({
      results: searchResults,
      query
    });
  } catch (error) {
    console.error('Error performing web search:', error);
    return res.status(500).json({ message: 'Error performing web search', error: error.message });
  }
};

/**
 * Fetch content from a specific URL
 */
exports.fetchUrlContent = async (req, res) => {
  try {
    const { url, conversationId } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    // Extract content from the URL
    const content = await extractContentFromUrl(url);
    
    // Save to browsing history if conversationId is provided
    if (conversationId) {
      await BrowsingHistory.create({
        conversationId,
        type: 'url_visit',
        url,
        content: content.text.substring(0, 1000), // Store a preview of the content
        timestamp: new Date()
      });
    }
    
    return res.status(200).json({
      url,
      content
    });
  } catch (error) {
    console.error('Error fetching URL content:', error);
    return res.status(500).json({ message: 'Error fetching URL content', error: error.message });
  }
};

/**
 * Get browsing history for a conversation
 */
exports.getBrowsingHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20 } = req.query;
    
    const history = await BrowsingHistory.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching browsing history:', error);
    return res.status(500).json({ message: 'Error fetching browsing history', error: error.message });
  }
};

/**
 * Clear browsing cache
 */
exports.clearBrowsingCache = async (req, res) => {
  try {
    const { olderThan } = req.query;
    
    let query = {};
    
    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
      query.timestamp = { $lt: cutoffDate };
    }
    
    await BrowsingHistory.deleteMany(query);
    
    return res.status(200).json({ message: 'Browsing cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing browsing cache:', error);
    return res.status(500).json({ message: 'Error clearing browsing cache', error: error.message });
  }
};

/**
 * Helper function to search the web
 * In a production environment, this would use a proper search API
 */
async function searchWeb(query, limit) {
  // This is a placeholder. In a real implementation, you would:
  // 1. Use a search engine API like Google Custom Search, Bing, etc.
  // 2. Or implement web scraping with puppeteer to get search results
  
  try {
    // Initialize browser
    const browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true' ? "new" : false,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
    
    const page = await browser.newPage();
    
    // Navigate to a search engine
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    
    // Extract search results
    const searchResults = await page.evaluate((resultLimit) => {
      const results = [];
      const elements = document.querySelectorAll('div.g');
      
      for (let i = 0; i < Math.min(elements.length, resultLimit); i++) {
        const element = elements[i];
        const titleElement = element.querySelector('h3');
        const linkElement = element.querySelector('a');
        const snippetElement = element.querySelector('div.VwiC3b');
        
        if (titleElement && linkElement && snippetElement) {
          results.push({
            title: titleElement.innerText,
            url: linkElement.href,
            snippet: snippetElement.innerText
          });
        }
      }
      
      return results;
    }, limit);
    
    await browser.close();
    return searchResults;
  } catch (error) {
    console.error('Error in web search:', error);
    // Return empty results in case of error
    return [];
  }
}

/**
 * Helper function to extract content from a URL
 */
async function extractContentFromUrl(url) {
  try {
    // Initialize browser
    const browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true' ? "new" : false,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
    
    const page = await browser.newPage();
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract content
    const content = await page.evaluate(() => {
      // Remove script and style elements to get clean text
      document.querySelectorAll('script, style').forEach(el => el.remove());
      
      // Get page title
      const title = document.title;
      
      // Get main content text
      const bodyText = document.body.innerText;
      
      // Get meta description
      const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
      
      // Get main image if available
      const mainImage = document.querySelector('meta[property="og:image"]')?.content || '';
      
      return {
        title,
        text: bodyText,
        description: metaDescription,
        mainImage
      };
    });
    
    await browser.close();
    return content;
  } catch (error) {
    console.error('Error extracting content from URL:', error);
    return {
      title: '',
      text: 'Error extracting content',
      description: '',
      mainImage: ''
    };
  }
}