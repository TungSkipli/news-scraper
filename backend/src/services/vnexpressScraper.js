const puppeteer = require('puppeteer');
const { db } = require('../config/firebase');
const {
  SCRAPER_CONFIG,
  BROWSER_CONFIG,
  BLOCKED_RESOURCES,
  BLOCKED_DOMAINS,
  VNEXPRESS_CONFIG,
  FIREBASE_COLLECTIONS
} = require('../utils/constants');

const setupRequestInterception = (page) => {
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    const url = request.url();
    
    if (BLOCKED_RESOURCES.includes(resourceType) || 
        BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
      request.abort();
    } else {
      request.continue();
    }
  });
};

const createBrowserPage = async (browser) => {
  const page = await browser.newPage();
  await page.setDefaultTimeout(SCRAPER_CONFIG.TIMEOUT);
  await page.setRequestInterception(true);
  setupRequestInterception(page);
  return page;
};

const scrapeArticleWithRetry = async (url, retryCount = 0) => {
  let browser;
  try {
    browser = await puppeteer.launch(BROWSER_CONFIG);
    const page = await createBrowserPage(browser);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: SCRAPER_CONFIG.TIMEOUT 
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
        const selectors = [
          '.tags a',
          '.tag-item a',
          '.tag a',
          'a[rel="tag"]',
          '.tags-item a',
          '.article-tags a'
        ];
        
        let tagElements = [];
        for (const selector of selectors) {
          tagElements = document.querySelectorAll(selector);
          if (tagElements.length > 0) break;
        }
        
        const tags = Array.from(tagElements).map(tag => tag.textContent.trim());
        
        if (tags.length === 0) {
          const metaKeywords = document.querySelector('meta[name="keywords"]');
          if (metaKeywords) {
            const keywords = metaKeywords.getAttribute('content');
            if (keywords) {
              return keywords.split(',').map(k => k.trim()).filter(k => k);
            }
          }
        }
        
        return tags;
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
    
    if (retryCount < SCRAPER_CONFIG.MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1}/${SCRAPER_CONFIG.MAX_RETRIES} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.RETRY_DELAY));
      return await scrapeArticleWithRetry(url, retryCount + 1);
    }
    console.error(`Failed to scrape ${url} after ${SCRAPER_CONFIG.MAX_RETRIES} retries:`, error.message);
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
  const browser = await puppeteer.launch(BROWSER_CONFIG);
  const page = await createBrowserPage(browser);
  
  console.log('Navigating to VnExpress Tech page...');
  if (progressCallback) progressCallback({ stage: 'fetching', message: 'Loading article list...' });
  
  await page.goto(VNEXPRESS_CONFIG.BASE_URL, { 
    waitUntil: 'domcontentloaded',
    timeout: SCRAPER_CONFIG.TIMEOUT 
  });

  await page.evaluate((scrollDistance, scrollDelay) => {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, scrollDistance);
        totalHeight += scrollDistance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, scrollDelay);
    });
  }, SCRAPER_CONFIG.SCROLL_DISTANCE, SCRAPER_CONFIG.SCROLL_DELAY);

  await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.PAGE_LOAD_DELAY));

  const articleLinks = await page.evaluate((selectors) => {
    const links = new Set();
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el.href && el.href.includes('vnexpress.net') && !el.href.includes('#')) {
          links.add(el.href);
        }
      });
    });
    
    return Array.from(links);
  }, VNEXPRESS_CONFIG.SELECTORS.ARTICLE_LINKS);

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

      await db.collection(FIREBASE_COLLECTIONS.NEWS)
        .doc(FIREBASE_COLLECTIONS.ARTICLES)
        .collection(FIREBASE_COLLECTIONS.TECH)
        .add(newsData);
      
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
