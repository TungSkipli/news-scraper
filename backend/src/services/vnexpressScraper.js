const puppeteer = require('puppeteer');
const { db } = require('../config/firebase');

const TIMEOUT = 60000;
const MAX_RETRIES = 3;

const scrapeArticleWithRetry = async (url, retryCount = 0) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ],
      protocolTimeout: 60000
    });
    
    const page = await browser.newPage();
    await page.setDefaultTimeout(TIMEOUT);
    
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      if (resourceType === 'image' || 
          resourceType === 'media' || 
          resourceType === 'font' ||
          resourceType === 'stylesheet' ||
          url.includes('google-analytics') ||
          url.includes('doubleclick') ||
          url.includes('googlesyndication') ||
          url.includes('facebook.net') ||
          url.includes('adservice') ||
          url.includes('ads') ||
          url.includes('analytics')) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: TIMEOUT 
    });
    
    const articleData = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      };

      const getImageData = () => {
        const selectors = [
          'article .fig-picture img',
          'article .Image img',
          'article img[itemprop="contentUrl"]',
          'article img.lazy',
          'article img'
        ];
        
        let imgElement = null;
        for (const selector of selectors) {
          imgElement = document.querySelector(selector);
          if (imgElement) break;
        }
        
        let imageUrl = '';
        if (imgElement) {
          imageUrl = imgElement.getAttribute('data-src') || 
                     imgElement.getAttribute('data-original') ||
                     imgElement.getAttribute('src') ||
                     imgElement.getAttribute('data-lazy-src') ||
                     '';
        }
        
        const captionElement = document.querySelector('article .Image .desc, article .fig-picture .desc, article figcaption');
        
        return {
          url: imageUrl,
          caption: captionElement ? captionElement.textContent.trim() : ''
        };
      };

      const getAuthors = () => {
        const authorElement = document.querySelector('.author_mail, p.author');
        return authorElement ? authorElement.textContent.trim() : '';
      };

      const getContent = () => {
        const contentElements = document.querySelectorAll('article.fck_detail p.Normal');
        return Array.from(contentElements).map(p => p.textContent.trim()).join('\n\n');
      };

      const getTags = () => {
        const tagElements = document.querySelectorAll('.tags a');
        return Array.from(tagElements).map(tag => tag.textContent.trim());
      };

      const getPublishedDate = () => {
        const dateElement = document.querySelector('span.date, span.time');
        if (dateElement) {
          const dateText = dateElement.textContent.trim();
          return dateText;
        }
        
        const metaTime = document.querySelector('meta[property="article:published_time"]');
        if (metaTime) {
          return metaTime.getAttribute('content');
        }
        
        return null;
      };

      const title = getTextContent('h1.title-detail');
      const summary = getTextContent('p.description');
      const content = getContent();
      const authors = getAuthors();
      const image = getImageData();
      const tags = getTags();
      const publishedDate = getPublishedDate();

      return {
        title,
        summary,
        content,
        authors,
        image,
        tags,
        publishedDate
      };
    });

    await browser.close();
    
    return articleData;
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await scrapeArticleWithRetry(url, retryCount + 1);
    }
    console.error(`Failed to scrape ${url} after ${MAX_RETRIES} retries:`, error.message);
    return null;
  }
};

const createSlug = (title) => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const scrapeVnExpressTech = async (progressCallback) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ],
    protocolTimeout: 60000
  });
  
  const page = await browser.newPage();
  await page.setDefaultTimeout(TIMEOUT);
  
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    const url = request.url();
    
    if (resourceType === 'image' || 
        resourceType === 'media' || 
        resourceType === 'font' ||
        resourceType === 'stylesheet' ||
        url.includes('google-analytics') ||
        url.includes('doubleclick') ||
        url.includes('googlesyndication') ||
        url.includes('facebook.net') ||
        url.includes('adservice') ||
        url.includes('ads') ||
        url.includes('analytics')) {
      request.abort();
    } else {
      request.continue();
    }
  });
  
  console.log('Navigating to VnExpress Tech page...');
  if (progressCallback) progressCallback({ stage: 'fetching', message: 'Loading article list...' });
  
  await page.goto('https://vnexpress.net/khoa-hoc-cong-nghe', { 
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT 
  });

  await page.evaluate(() => {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  const articleLinks = await page.evaluate(() => {
    const links = new Set();
    
    const selectors = [
      'article.item-news h3.title-news a',
      'article.item-news h2.title-news a',
      'article h3 a',
      'article h2 a',
      '.item-news .title-news a',
      '.article-topstory .title-news a'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.href && el.href.includes('vnexpress.net') && !el.href.includes('#')) {
          links.add(el.href);
        }
      });
    });
    
    return Array.from(links);
  });

  await browser.close();

  console.log(`Found ${articleLinks.length} articles to scrape`);
  if (progressCallback) progressCallback({ 
    stage: 'scraping', 
    message: `Found ${articleLinks.length} articles`,
    total: articleLinks.length,
    current: 0
  });

  const results = {
    total: articleLinks.length,
    success: 0,
    failed: 0,
    skipped: 0
  };

  for (let i = 0; i < articleLinks.length; i++) {
    const link = articleLinks[i];
    console.log(`Scraping: ${link}`);
    
    if (progressCallback) progressCallback({ 
      stage: 'scraping', 
      message: `Scraping article ${i + 1}/${articleLinks.length}`,
      total: articleLinks.length,
      current: i + 1,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped
    });
    
    const articleData = await scrapeArticleWithRetry(link);
    
    if (!articleData || !articleData.title) {
      console.log(`Skipping ${link} - no data`);
      results.skipped++;
      continue;
    }

    try {
      const slug = createSlug(articleData.title);
      const scrapedAt = Date.now();
      let publishedAt = scrapedAt;
      
      if (articleData.publishedDate) {
        const parsedDate = new Date(articleData.publishedDate);
        if (!isNaN(parsedDate.getTime())) {
          publishedAt = parsedDate.getTime();
        }
      }
      
      const newsData = {
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        authors: articleData.authors,
        image: articleData.image,
        tags: articleData.tags || [],
        category_slug: 'tech',
        external_source: link,
        published_at: publishedAt,
        scraped_at: scrapedAt,
        likes: 0,
        slug: slug,
        state: 'global'
      };

      await db.collection('news').doc('articles').collection('tech').add(newsData);
      
      console.log(`✓ Saved: ${articleData.title}`);
      results.success++;
    } catch (error) {
      console.error(`Failed to save ${link}:`, error.message);
      results.failed++;
    }
  }

  if (progressCallback) progressCallback({ 
    stage: 'complete', 
    message: 'Scraping completed!',
    total: articleLinks.length,
    current: articleLinks.length,
    success: results.success,
    failed: results.failed,
    skipped: results.skipped
  });

  return results;
};

module.exports = {
  scrapeVnExpressTech
};
