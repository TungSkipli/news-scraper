import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getArticles = async ({ source_id, category_id, limit = 50 }) => {
  console.warn('sourceService.getArticles is deprecated. Use newsService.getNews() instead');
  
  // Map to new API
  const params = { limit };
  if (category_id) params.category = category_id;
  
  const response = await axios.get(`${API_URL}/news`, { params });
  return response.data;
};

/**
 * @deprecated Use newsService.getNewsById() instead
 */
export const getArticleById = async (id) => {
  console.warn('sourceService.getArticleById is deprecated. Use newsService.getNewsById() instead');
  
  const response = await axios.get(`${API_URL}/news/${id}`);
  return response.data;
};

/**
 * @deprecated Use newsService.getNewsByCategory() instead
 */
export const getArticlesBySourceAndCategory = async (sourceId, categoryId, limit = 50) => {
  console.warn('sourceService.getArticlesBySourceAndCategory is deprecated. Use newsService.getNewsByCategory() instead');
  
  const response = await axios.get(`${API_URL}/news/category/${categoryId}`, {
    params: { limit }
  });
  return response.data;
};

/**
 * @deprecated Use newsService.getCategories() instead
 */
export const getUniqueCategoriesList = async () => {
  console.warn('sourceService.getUniqueCategoriesList is deprecated. Use newsService.getCategories() instead');
  
  const response = await axios.get(`${API_URL}/news/categories`);
  return response.data;
};

/**
 * @deprecated Use newsService.getStats() instead
 */
export const getAllCategories = async () => {
  console.warn('sourceService.getAllCategories is deprecated. Use newsService.getCategories() instead');
  
  const response = await axios.get(`${API_URL}/news/categories`);
  return response.data;
};

/**
 * @deprecated Categories are now flat in new structure
 */
export const getCategoriesCountBySource = async (sourceId) => {
  console.warn('sourceService.getCategoriesCountBySource is deprecated in new structure');
  
  // Return categories from stats
  const response = await axios.get(`${API_URL}/news/categories`);
  return response.data;
};

/**
 * @deprecated Sources are tracked per article, not as separate entities
 */
export const getAllSources = async () => {
  console.warn('sourceService.getAllSources is deprecated. Source info is embedded in articles');
  
  // Return from stats
  const response = await axios.get(`${API_URL}/news/stats`);
  return {
    success: true,
    data: response.data?.data?.bySource || []
  };
};

/**
 * @deprecated Sources are tracked per article, not as separate entities
 */
export const getSourceById = async (id) => {
  console.warn('sourceService.getSourceById is deprecated. Source info is embedded in articles');
  
  // Try to find source from stats
  const response = await axios.get(`${API_URL}/news/stats`);
  const sources = response.data?.data?.bySource || [];
  const source = sources.find(s => s.source_name === id || s.source_domain === id);
  
  return {
    success: !!source,
    data: source || null
  };
};

/**
 * @deprecated Use scrapeService.detectCategories() instead
 */
export const detectCategories = async (homepageUrl) => {
  console.warn('sourceService.detectCategories is deprecated. Use scrapeService.detectCategories() instead');
  
  const response = await axios.post(`${API_URL}/scrape/detect-categories`, {
    url: homepageUrl
  });
  return response.data;
};

/**
 * @deprecated Use scrapeService.scrapeSource() instead
 */
export const scrapeSource = async (homepageUrl, options = {}) => {
  console.warn('sourceService.scrapeSource is deprecated. Use scrapeService.scrapeSource() instead');
  
  const response = await axios.post(`${API_URL}/scrape/source`, {
    url: homepageUrl,
    ...options
  });
  return response.data;
};

/**
 * @deprecated
 */
export const getSourceCategories = async (sourceId) => {
  console.warn('sourceService.getSourceCategories is deprecated in new structure');
  return { success: true, data: [] };
};
