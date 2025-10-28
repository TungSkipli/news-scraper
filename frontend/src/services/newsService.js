import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getNews = async ({ page = 1, limit = 12, search = '', tag = '', category = '' }) => {
  const response = await axios.get(`${API_URL}/news`, {
    params: { page, limit, search, tag, category }
  });
  return response.data;
};

/**
 * Get news by specific ID (searches across all categories)
 * @param {string} id - Article ID
 * @returns {Promise} Response with article data
 */
export const getNewsById = async (id) => {
  const response = await axios.get(`${API_URL}/news/${id}`);
  return response.data;
};

/**
 * Get news by category and ID
 * @param {string} category - Category name (normalized)
 * @param {string} id - Article ID
 * @returns {Promise} Response with article data
 */
export const getNewsByCategoryAndId = async (category, id) => {
  const response = await axios.get(`${API_URL}/news/${category}/${id}`);
  return response.data;
};

/**
 * Get all news from a specific category
 * @param {string} category - Category name (normalized)
 * @param {Object} params - Query parameters
 * @returns {Promise} Response with news articles
 */
export const getNewsByCategory = async (category, params = {}) => {
  const response = await axios.get(`${API_URL}/news/category/${category}`, {
    params
  });
  return response.data;
};

/**
 * Get statistics about news articles
 * @returns {Promise} Response with stats (total, by category, by source, etc.)
 */
export const getStats = async () => {
  const response = await axios.get(`${API_URL}/news/stats`);
  return response.data;
};

/**
 * Get all available tags
 * @returns {Promise} Response with list of tags
 */
export const getTags = async () => {
  const response = await axios.get(`${API_URL}/news/tags`);
  return response.data;
};

/**
 * Get featured news articles
 * @param {number} limit - Number of featured articles to fetch (default: 6)
 * @returns {Promise} Response with featured articles
 */
export const getFeatured = async (limit = 6) => {
  const response = await axios.get(`${API_URL}/news/featured`, {
    params: { limit }
  });
  return response.data;
};

/**
 * Get latest news articles
 * @param {number} limit - Number of latest articles to fetch (default: 10)
 * @returns {Promise} Response with latest articles
 */
export const getLatest = async (limit = 10) => {
  const response = await axios.get(`${API_URL}/news/latest`, {
    params: { limit }
  });
  return response.data;
};

/**
 * Get all available categories
 * @returns {Promise} Response with list of categories
 */
export const getCategories = async () => {
  const response = await axios.get(`${API_URL}/news/categories`);
  return response.data;
};
