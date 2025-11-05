import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const client = axios.create({
  baseURL: API_URL
})

export const scrapeSingleArticle = (url) => 
  client.post('/scrape/save', { url })

export const scrapeBatch = (urls, options = {}) => 
  client.post('/scrape/batch', { 
    urls, 
    saveToFirebase: options.saveToFirebase !== false 
  })

export const scrapeSource = (url, options = {}) => 
  client.post('/scrape/source', { 
    url, 
    ...options 
  })

export const detectCategories = (url) => 
  client.post('/scrape/detect-categories', { url })
