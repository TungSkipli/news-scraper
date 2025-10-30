const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {
  SCRAPER_CONFIG,
  BROWSER_CONFIG
} = require('../utils/constants');

puppeteer.use(StealthPlugin());

const ARTICLE_LINK_SELECTORS = [
  'article a[href]',
  '.article-item a[href]',
  '.news-item a[href]',
  '.post-item a[href]',
  '.list-news-item a[href]',
  '.story a[href]',
  '.article-title a[href]',
  '.post-title a[href]',
  'h3 a[href]',
  'h2 a[href]',
  '.item-news a[href]'
];

const isValidArticleUrl = (url, baseDomain) => {
  try {
    const urlObj = new URL(url);

    if (!urlObj.hostname.includes(baseDomain.replace('www.', ''))) {
      return false;
    }

    const path = urlObj.pathname;
    if (!path || path === '/' || path.length < 5) {
      return false;
    }

    if (path.match(/\.(jpg|jpeg|png|gif|pdf|doc|zip|css|js)$/i)) {
      return false;
    }

    const avoidPatterns = [
      '/tag/',
      '/category/',
      '/author/',
      '/page/',
      '/search',
      '/login',
      '/register',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ];
    
    for (const pattern of avoidPatterns) {
      if (path.includes(pattern)) {
        return false;
      }
    }
    
    return true;
  } catch (e) {
    return false;
  }
};

const scrapeCategoryPage = async (categoryUrl, options = {}) => {
  const {
    maxPages = 3,
    maxArticles = 50,
    baseDomain = null
  } = options;

  let browser;
  let page;

  try {
    browser = await puppeteer.launch(BROWSER_CONFIG);
    page = await browser.newPage();

    await page.setDefaultTimeout(SCRAPER_CONFIG.TIMEOUT);
    await page.setDefaultNavigationTimeout(SCRAPER_CONFIG.TIMEOUT);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const domain = baseDomain || new URL(categoryUrl).hostname;

    const articleUrls = new Set();
    let currentPage = 1;

    while (currentPage <= maxPages && articleUrls.size < maxArticles) {
      try {
        await page.goto(categoryUrl, {
          waitUntil: 'domcontentloaded',
          timeout: SCRAPER_CONFIG.TIMEOUT
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pageUrls = await page.evaluate((selectors, baseDomain) => {
          const urls = new Set();

          for (const selector of selectors) {
            try {
              const links = document.querySelectorAll(selector);

              links.forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;

                try {
                  const absoluteUrl = new URL(href, window.location.href).href;
                  urls.add(absoluteUrl);
                } catch (e) {}
              });
            } catch (e) {}
          }

          return Array.from(urls);
        }, ARTICLE_LINK_SELECTORS, domain);

        pageUrls.forEach(url => {
          if (isValidArticleUrl(url, domain) && articleUrls.size < maxArticles) {
            articleUrls.add(url);
          }
        });

        const nextPageUrl = await page.evaluate(() => {
          const nextSelectors = [
            'a.next',
            'a[rel="next"]',
            '.pagination a:last-child',
            '.paging a:last-child',
            'a.page-next',
            'a:contains("Trang sau")',
            'a:contains("Xem thêm")',
            'a:contains("Next")'
          ];

          for (const selector of nextSelectors) {
            try {
              const nextLink = document.querySelector(selector);
              if (nextLink && nextLink.href) {
                return nextLink.href;
              }
            } catch (e) {}
          }

          return null;
        });

        if (nextPageUrl && currentPage < maxPages) {
          categoryUrl = nextPageUrl;
          currentPage++;
        } else {
          break;
        }

      } catch (error) {
        break;
      }
    }

    await browser.close();

    const finalUrls = Array.from(articleUrls);

    return finalUrls;

  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    throw error;
  }
};

module.exports = {
  scrapeCategoryPage,
  isValidArticleUrl
};