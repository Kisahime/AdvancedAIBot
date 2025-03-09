const puppeteer = require('puppeteer');

/**
 * Performs web browsing based on queries or URLs
 * @param {Array} queries - List of search queries or URLs
 * @returns {object} - Browsing results with content and sources
 */
exports.browse = async (queries) => {
  try {
    // Configure puppeteer
    const browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true' ? "new" : false,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    const sources = [];

    // Process each query or URL
    for (const query of queries) {
      const page = await browser.newPage();
      
      // Determine if the query is a URL
      const isUrl = query.match(/^https?:\/\//i);
      
      if (isUrl) {
        // Direct navigation to URL
        await page.goto(query, { waitUntil: 'domcontentloaded', timeout: 30000 });
      } else {
        // Search query using a search engine
        await page.goto('https://www.google.com/search?q=' + encodeURIComponent(query), 
          { waitUntil: 'domcontentloaded', timeout: 30000 });
      }

      // Extract page content
      const pageContent = await page.evaluate(() => {
        // Remove script and style elements
        document.querySelectorAll('script, style').forEach(el => el.remove());
        
        // Get main content
        const content = document.body.innerText;
        
        // Get page title
        const title = document.title;
        
        return { content, title };
      });

      // Add to results
      results.push(pageContent.content);
      
      // Add to sources
      sources.push({
        title: pageContent.title,
        url: page.url(),
        query: query
      });

      await page.close();
    }

    await browser.close();

    // Combine and summarize results
    const combinedContent = results.join('\n\n');
    
    // Truncate if too long
    const truncatedContent = combinedContent.length > 5000 
      ? combinedContent.substring(0, 5000) + '...' 
      : combinedContent;

    return {
      content: truncatedContent,
      sources,
      summary: `Found ${sources.length} results for your query.`
    };
  } catch (error) {
    console.error('Error during web browsing:', error);
    return {
      content: 'Error occurred during web browsing.',
      sources: [],
      summary: 'Failed to retrieve information from the web.'
    };
  }
};

/**
 * Extracts key information from a webpage
 * @param {string} url - URL to extract information from
 * @returns {object} - Extracted information
 */
exports.extractPageInfo = async (url) => {
  try {
    const browser = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS === 'true' ? "new" : false,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Extract key information
    const pageInfo = await page.evaluate(() => {
      // Remove script and style elements
      document.querySelectorAll('script, style').forEach(el => el.remove());
      
      // Get page title
      const title = document.title;
      
      // Get meta description
      const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
      
      // Get main content (simplified approach)
      const mainContent = document.body.innerText.substring(0, 5000);
      
      return {
        title,
        description: metaDescription,
        content: mainContent
      };
    });
    
    await browser.close();
    
    return {
      ...pageInfo,
      url
    };
  } catch (error) {
    console.error('Error extracting page info:', error);
    return {
      title: 'Error',
      description: 'Failed to extract information',
      content: 'An error occurred while trying to extract information from the webpage.',
      url
    };
  }
};