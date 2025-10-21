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

module.exports = {
  scrapeNews
};
