import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getNews = async ({ page = 1, limit = 12, search = '', tag = '' }) => {
  const response = await axios.get(`${API_URL}/news`, {
    params: { page, limit, search, tag }
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
