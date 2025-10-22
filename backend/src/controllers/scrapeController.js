const { scrapeVnExpressTech } = require('../services/vnexpressScraper');

const scrapeNews = async (req, res, next) => {
  try {
    console.log('Starting VnExpress Tech scraping...');
    
    const results = await scrapeVnExpressTech();
    
    res.json({
      success: true,
      message: 'Scraping completed',
      data: results
    });
  } catch (error) {
    console.error('Scraping error:', error);
    next(error);
  }
};

const scrapeNewsSSE = async (req, res, next) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.flushHeaders();

  try {
    console.log('Starting VnExpress Tech scraping with SSE...');
    
    const progressCallback = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    const results = await scrapeVnExpressTech(progressCallback);
    
    res.write(`data: ${JSON.stringify({ 
      stage: 'done', 
      results 
    })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Scraping error:', error);
    res.write(`data: ${JSON.stringify({ 
      stage: 'error', 
      message: error.message 
    })}\n\n`);
    res.end();
  }
};

module.exports = {
  scrapeNews,
  scrapeNewsSSE
};
