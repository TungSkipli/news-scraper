const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const {
  SCRAPER_CONFIG,
  BROWSER_CONFIG
} = require('../utils/constants');

puppeteer.use(StealthPlugin());

const CATEGORY_NAV_SELECTORS = [
  'ul.nav > li > a[href]',
  'nav a[href*="/"]',
  '.menu a[href*="/"]',
  '.nav-menu a[href*="/"]',
  '.main-menu a[href*="/"]',
  '.navigation a[href*="/"]',
  'header nav a',
  '.header-menu a',
  '.primary-menu a',
  '#menu a',
  '.site-navigation a',
  'ul.nav a[href]',
  '.pin-menu a[href*="/"]'
];

const CATEGORY_DETECTION_DELAY = SCRAPER_CONFIG.CATEGORY_DETECTION_DELAY || 3000;
const NAV_TIMEOUT = SCRAPER_CONFIG.NAV_TIMEOUT || 60000;

const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
};

const extractSourceName = (domain, pageTitle) => {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    const mainPart = parts[parts.length - 2];
    return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  }

  if (pageTitle) {
    return pageTitle.split('-')[0].trim();
  }

  return domain;
};

const detectCategories = async (homepageUrl) => {
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

    await page.goto(homepageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT
    });

    await new Promise(resolve => setTimeout(resolve, CATEGORY_DETECTION_DELAY));

    const result = await page.evaluate((selectors, baseUrl) => {
      const baseDomain = new URL(baseUrl).origin;

      const pageTitle = document.title;

      const isValidCategoryUrl = (href, baseUrl) => {
        if (!href || href === '#' || href === '/' || href === baseUrl) return false;
        if (href.includes('javascript:') || href.includes('mailto:')) return false;
        if (href.match(/\.(jpg|jpeg|png|gif|pdf|doc|zip|html|htm|php|aspx|jsp)$/i)) return false;

        try {
          const linkUrl = new URL(href, baseUrl);
          const baseUrlObj = new URL(baseUrl);
          
          if (linkUrl.hostname !== baseUrlObj.hostname) return false;
          
          const pathParts = linkUrl.pathname.split('/').filter(p => p);
          if (pathParts.length !== 1) return false;
          
          return true;
        } catch (e) {
          return false;
        }
      };

      const getCategoryName = (element, url) => {
        const text = element.textContent.trim();
        if (text && text.length > 0 && text.length < 50) {
          return text;
        }

        try {
          const urlObj = new URL(url, baseUrl);
          const pathParts = urlObj.pathname.split('/').filter(p => p);
          if (pathParts.length > 0) {
            return pathParts[0].replace(/-/g, ' ')
              .split(' ')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
          }
        } catch (e) {}
        
        return null;
      };

      const categories = new Map();

      const catMenus = document.querySelectorAll('ul.cat-menu');
      
      catMenus.forEach(menu => {
        const menuItems = menu.querySelectorAll(':scope > li');
        
        menuItems.forEach(item => {
          const mainLink = item.querySelector(':scope > a[href]');
          if (!mainLink) return;
          
          const href = mainLink.getAttribute('href');
          const text = mainLink.getAttribute('title') || mainLink.textContent.trim();
          
          if (!href || !text) return;
          
          let absoluteUrl;
          try {
            absoluteUrl = new URL(href, baseUrl).href;
          } catch (e) {
            return;
          }
          
          if (isValidCategoryUrl(absoluteUrl, baseUrl) && !categories.has(absoluteUrl)) {
            categories.set(absoluteUrl, {
              name: text,
              url: absoluteUrl
            });
          }
        });
      });

      for (const selector of selectors) {
        try {
          const links = document.querySelectorAll(selector);
          
          links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            let absoluteUrl;
            try {
              absoluteUrl = new URL(href, baseUrl).href;
            } catch (e) {
              return;
            }

            if (!isValidCategoryUrl(absoluteUrl, baseUrl)) return;

            const name = getCategoryName(link, absoluteUrl);
            if (!name) return;

            if (!categories.has(absoluteUrl) && absoluteUrl !== baseUrl) {
              categories.set(absoluteUrl, {
                name: name,
                url: absoluteUrl
              });
            }
          });
        } catch (e) {
          console.error('Selector error:', e);
        }
      }

      return {
        pageTitle: pageTitle,
        categories: Array.from(categories.values())
      };
    }, CATEGORY_NAV_SELECTORS, homepageUrl);

    await browser.close();

    const categories = result.categories
      .filter(cat => cat.name.length > 2 && cat.name.length < 50)
      .filter((cat, index, self) =>
        index === self.findIndex(c => c.name.toLowerCase() === cat.name.toLowerCase())
      )
      .slice(0, 50);

    const domain = extractDomain(homepageUrl);
    const sourceName = extractSourceName(domain, result.pageTitle);

    return {
      source: {
        name: sourceName,
        domain: domain,
        homepage_url: homepageUrl
      },
      categories: categories
    };

  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    throw error;
  }
};

module.exports = {
  detectCategories,
  extractDomain,
  extractSourceName
};