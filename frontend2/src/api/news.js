import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const client = axios.create({
  baseURL: API_URL
})

export const getFeaturedNews = (params = {}) => client.get('/news/featured', { params })

export const getLatestNews = (params = {}) => client.get('/news/latest', { params })

export const getNewsStats = () => client.get('/news/stats')
