import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const getNews = async ({ page = 1, limit = 12, search = '', tag = '', category = '' }) => {
  const response = await axios.get(`${API_URL}/news`, {
    params: { page, limit, search, tag, category }
  });
  return response.data;
};

export const getNewsById = async (id) => {
  const response = await axios.get(`${API_URL}/news/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await axios.get(`${API_URL}/news/stats`);
  return response.data;
};

export const getTags = async () => {
  const response = await axios.get(`${API_URL}/news/tags`);
  return response.data;
};

export const getFeatured = async (limit = 6) => {
  const response = await axios.get(`${API_URL}/news/featured`, {
    params: { limit }
  });
  return response.data;
};

export const getLatest = async (limit = 10) => {
  const response = await axios.get(`${API_URL}/news/latest`, {
    params: { limit }
  });
  return response.data;
};
