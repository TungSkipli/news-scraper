const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { db } = require('../config/firebase');
const {
  PROXY_CONFIG,
  SCRAPER_CONFIG,
  BROWSER_CONFIG,
  UNIVERSAL_SELECTORS,
  FIREBASE_COLLECTIONS,
  DEFAULT_VALUES,
  normalizeCategory
} = require('../utils/constants');
const { trySelectors } = require('../utils/selectorHelpers');
const { createSlug: generateSlug } = require('../utils/slugGenerator');

puppeteer.use(StealthPlugin());

const createSlug = generateSlug;

const extractArticleData = async (page, url) => {
  return await page.evaluate(({ selectors, url }) => {
    const trySelectors = (selectorList, extractor) => {
      for (const selector of selectorList) {
        try {
          const result = extractor(selector);
          if (result) return result;
        } catch (e) {
          continue;
        }
      }
      return null;
    };

    const getTitle = () => {
      return trySelectors(selectors.TITLE, (sel) => {
        if (sel.startsWith('meta')) {
          const meta = document.querySelector(sel);
          return meta ? meta.getAttribute('content') : null;
        } else if (sel === 'title') {
          return document.title;
        } else {
          const el = document.querySelector(sel);
          return el ? el.textContent.trim() : null;
        }
      });
    };

    const getSummary = () => {
      return trySelectors(selectors.SUMMARY, (sel) => {
        if (sel.startsWith('meta')) {
          const meta = document.querySelector(sel);
          return meta ? meta.getAttribute('content') : null;
        } else {
          const el = document.querySelector(sel);
          return el ? el.textContent.trim() : null;
        }
      });
    };

    const getContent = () => {
      return trySelectors(selectors.CONTENT, (sel) => {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          return Array.from(elements)
            .map(el => el.textContent.trim())
            .filter(text => text.length > 0)
            .join('\n\n');
        }
        return null;
      });
    };

    const getAuthors = () => {
      return trySelectors(selectors.AUTHOR, (sel) => {
        if (sel.startsWith('meta')) {
          const meta = document.querySelector(sel);
          return meta ? meta.getAttribute('content') : null;
        } else {
          const el = document.querySelector(sel);
          return el ? el.textContent.trim() : null;
        }
      });
    };

    const getImage = () => {
      let imageUrl = trySelectors(selectors.IMAGE, (sel) => {
        if (sel.startsWith('meta')) {
          const meta = document.querySelector(sel);
          return meta ? meta.getAttribute('content') : null;
        } else {
          const img = document.querySelector(sel);
          if (!img) return null;
          return img.getAttribute('data-src') ||
                 img.getAttribute('data-original') ||
                 img.getAttribute('src') ||
                 img.getAttribute('data-lazy-src') ||
                 null;
        }
      });

      const caption = trySelectors(selectors.IMAGE_CAPTION, (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.trim() : null;
      }) || '';

      return {
        url: imageUrl || '',
        caption: caption
      };
    };

    const getTags = () => {
      const linkTags = trySelectors(selectors.TAGS.filter(s => !s.startsWith('meta')), (sel) => {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          return Array.from(elements).map(el => el.textContent.trim());
        }
        return null;
      });

      if (linkTags && linkTags.length > 0) return linkTags;

      const metaTags = trySelectors(selectors.TAGS.filter(s => s.startsWith('meta')), (sel) => {
        const meta = document.querySelector(sel);
        if (meta) {
          const content = meta.getAttribute('content');
          if (content) {
            return content.split(',').map(t => t.trim()).filter(t => t);
          }
        }
        return null;
      });

      return metaTags || [];
    };

    const getPublishedDate = () => {
      return trySelectors(selectors.DATE, (sel) => {
        if (sel.startsWith('meta')) {
          const meta = document.querySelector(sel);
          return meta ? meta.getAttribute('content') : null;
        } else {
          const el = document.querySelector(sel);
          if (!el) return null;
          
          const datetime = el.getAttribute('datetime');
          if (datetime) return datetime;
          
          return el.textContent.trim();
        }
      });
    };

    return {
      title: getTitle(),
      summary: getSummary(),
      content: getContent(),
      authors: getAuthors(),
      image: getImage(),
      tags: getTags(),
      publishedDate: getPublishedDate(),
      url: url
    };
  }, { selectors: UNIVERSAL_SELECTORS, url });
};

const createBrowser = async () => {
  const browser = await puppeteer.launch(BROWSER_CONFIG);
  return browser;
};

const setupPage = async (browser, url) => {
  const page = await browser.newPage();
  
  await page.setDefaultTimeout(SCRAPER_CONFIG.TIMEOUT);
  await page.setDefaultNavigationTimeout(SCRAPER_CONFIG.TIMEOUT);

  if (SCRAPER_CONFIG.USE_PROXY) {
    await page.authenticate({
      username: PROXY_CONFIG.USERNAME,
      password: PROXY_CONFIG.PASSWORD
    });
  }

  await page.setViewport({ width: 1920, height: 1080 });

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['font', 'stylesheet'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return page;
};

const parseDate = (dateString) => {
  if (!dateString) return Date.now();

  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  } catch (e) {
  }

  return Date.now();
};

const extractCategoryFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    for (const part of pathParts) {
      const normalized = normalizeCategory(part);
      if (normalized !== 'general') {
        return normalized;
      }
    }
    
    return 'general';
  } catch (e) {
    return 'general';
  }
};

const scrapeUrl = async (url, retryCount = 0) => {
  let browser;
  let page;

  try {
    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL format');
    }

    browser = await createBrowser();
    page = await setupPage(browser, url);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: SCRAPER_CONFIG.TIMEOUT
    });

    await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.PAGE_LOAD_DELAY));

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.SCROLL_DELAY));

    const rawData = await extractArticleData(page, url);

    await browser.close();

    if (!rawData.title || rawData.title.length < 5) {
      throw new Error('Could not extract title from the page');
    }

    const category = extractCategoryFromUrl(url);

    const article = {
      title: rawData.title,
      summary: rawData.summary || rawData.content?.substring(0, 200) || DEFAULT_VALUES.AUTHORS,
      content: rawData.content || rawData.summary || '',
      authors: rawData.authors || DEFAULT_VALUES.AUTHORS,
      image: {
        url: rawData.image.url || '',
        caption: rawData.image.caption || DEFAULT_VALUES.IMAGE_CAPTION
      },
      tags: Array.isArray(rawData.tags) && rawData.tags.length > 0 
        ? rawData.tags 
        : DEFAULT_VALUES.TAGS,
      category: category,
      external_source: url,
      published_at: parseDate(rawData.publishedDate),
      created_at: Date.now(),
      slug: createSlug(rawData.title),
      likes: DEFAULT_VALUES.LIKES
    };

    return article;

  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    if (retryCount < SCRAPER_CONFIG.MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.RETRY_DELAY));
      return await scrapeUrl(url, retryCount + 1);
    }

    throw error;
  }
};

const scrapeAndSave = async (url) => {
  try {
    const article = await scrapeUrl(url);

    const docRef = await db
      .collection(FIREBASE_COLLECTIONS.NEWS)
      .doc(FIREBASE_COLLECTIONS.ARTICLES)
      .collection(FIREBASE_COLLECTIONS.CATEGORY)
      .doc(article.category)
      .collection('items')
      .add(article);

    return {
      success: true,
      article: article,
      firebaseId: docRef.id
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  scrapeUrl,
  scrapeAndSave,
  createSlug
};