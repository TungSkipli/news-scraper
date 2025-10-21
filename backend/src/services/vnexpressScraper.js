const puppeteer = require('puppeteer');
const { db } = require('../config/firebase');

const TIMEOUT = 10000;
const MAX_RETRIES = 3;

const scrapeArticleWithRetry = async (url, retryCount = 0) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setDefaultTimeout(TIMEOUT);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: TIMEOUT });
    
    const articleData = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      };

      const getImageData = () => {
        const imgElement = document.querySelector('article img.lazy, article img');
        const captionElement = document.querySelector('article .Image .desc, article .fig-picture .desc');
        return {
          url: imgElement ? (imgElement.src || imgElement.getAttribute('data-src') || '') : '',
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

      const title = getTextContent('h1.title-detail');
      const summary = getTextContent('p.description');
      const content = getContent();
      const authors = getAuthors();
      const image = getImageData();
      const tags = getTags();

      return {
        title,
        summary,
        content,
        authors,
        image,
        tags
      };
    });

    await browser.close();
    
    return articleData;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for ${url}`);
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

const scrapeVnExpressTech = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setDefaultTimeout(TIMEOUT);
  
  console.log('Navigating to VnExpress Tech page...');
  await page.goto('https://vnexpress.net/khoa-hoc-cong-nghe', { 
    waitUntil: 'networkidle2',
    timeout: TIMEOUT 
  });

  const articleLinks = await page.evaluate(() => {
    const links = [];
    const articles = document.querySelectorAll('article.item-news');
    
    articles.forEach(article => {
      const linkElement = article.querySelector('h3.title-news a, h2.title-news a');
      if (linkElement && linkElement.href) {
        links.push(linkElement.href);
      }
    });
    
    return links;
  });

  await browser.close();

  console.log(`Found ${articleLinks.length} articles to scrape`);

  const results = {
    total: articleLinks.length,
    success: 0,
    failed: 0,
    skipped: 0
  };

  for (const link of articleLinks) {
    console.log(`Scraping: ${link}`);
    
    const articleData = await scrapeArticleWithRetry(link);
    
    if (!articleData || !articleData.title) {
      console.log(`Skipping ${link} - no data`);
      results.skipped++;
      continue;
    }

    try {
      const slug = createSlug(articleData.title);
      const newsData = {
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        authors: articleData.authors,
        image: articleData.image,
        tags: articleData.tags || [],
        category_slug: 'tech',
        external_source: link,
        created_at: Date.now(),
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

  return results;
};

module.exports = {
  scrapeVnExpressTech
};
