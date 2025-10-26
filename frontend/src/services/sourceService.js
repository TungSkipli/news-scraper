import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const getAllSources = async () => {
  const response = await axios.get(`${API_URL}/api/sources`);
  return response.data;
};

export const getSourceById = async (id) => {
  const response = await axios.get(`${API_URL}/api/sources/${id}`);
  return response.data;
};

export const getSourceCategories = async (sourceId) => {
  const response = await axios.get(`${API_URL}/api/sources/${sourceId}/categories`);
  return response.data;
};

export const getArticles = async ({ source_id, category_id, limit = 50 }) => {
  const params = { limit };
  if (source_id) params.source_id = source_id;
  if (category_id) params.category_id = category_id;
  
  const response = await axios.get(`${API_URL}/api/articles`, { params });
  return response.data;
};

export const getArticleById = async (id) => {
  const response = await axios.get(`${API_URL}/api/articles/${id}`);
  return response.data;
};

export const detectCategories = async (homepageUrl) => {
  const response = await axios.post(`${API_URL}/detect-categories`, {
    url: homepageUrl
  });
  return response.data;
};

export const scrapeSource = async (homepageUrl, options = {}) => {
  const response = await axios.post(`${API_URL}/scrape-source`, {
    url: homepageUrl,
    options
  });
  return response.data;
};