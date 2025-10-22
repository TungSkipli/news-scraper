import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

export const scrapeNews = async () => {
  try {
    const response = await axios.get(`${API_URL}/scrape`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
