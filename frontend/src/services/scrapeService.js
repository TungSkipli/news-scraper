import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Scrape and save a single article from URL
 * @param {string} url - Article URL to scrape
 * @param {Object} options - Scraping options
 * @returns {Promise} Response with scraped article and Firebase path
 */
export const scrapeSingleArticle = async (url, options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/scrape/save`, {
      url,
      ...options
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Scrape multiple articles in batch
 * @param {Array<string>} urls - Array of article URLs
 * @param {Object} options - Scraping options
 * @param {boolean} options.saveToFirebase - Whether to save to Firebase (default: true)
 * @returns {Promise} Response with batch scraping results
 */
export const scrapeBatch = async (urls, options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/scrape/batch`, {
      urls,
      saveToFirebase: options.saveToFirebase !== false
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Scrape full source (homepage with categories)
 * @param {string} homepageUrl - Homepage URL
 * @param {Object} options - Scraping options
 * @param {number} options.maxCategories - Max categories to scrape
 * @param {number} options.maxPages - Max pages per category
 * @param {number} options.maxArticlesPerCategory - Max articles per category
 * @param {string} options.categoryUrl - Specific category URL (for single category mode)
 * @param {string} options.mode - 'full' or 'single' category mode
 * @returns {Promise} Response with scraping results
 */
export const scrapeSource = async (homepageUrl, options = {}) => {
  try {
    const response = await axios.post(`${API_URL}/scrape/source`, {
      url: homepageUrl,
      ...options
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Detect categories from a homepage URL
 * @param {string} homepageUrl - Homepage URL
 * @returns {Promise} Response with detected categories
 */
export const detectCategories = async (homepageUrl) => {
  try {
    const response = await axios.post(`${API_URL}/scrape/detect-categories`, {
      url: homepageUrl
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
