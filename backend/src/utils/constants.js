const SCRAPER_CONFIG = {
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  SCROLL_DISTANCE: 100,
  SCROLL_DELAY: 100,
  PAGE_LOAD_DELAY: 2000
};

const BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox', 
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ],
  protocolTimeout: 60000
};

const BLOCKED_RESOURCES = [
  'image',
  'media',
  'font',
  'stylesheet'
];

const BLOCKED_DOMAINS = [
  'google-analytics',
  'doubleclick',
  'googlesyndication',
  'facebook.net',
  'adservice',
  'ads',
  'analytics'
];

const VNEXPRESS_CONFIG = {
  BASE_URL: 'https://vnexpress.net/khoa-hoc-cong-nghe',
  SELECTORS: {
    ARTICLE_LINKS: [
      'article.item-news h3.title-news a',
      'article.item-news h2.title-news a',
      'article h3 a',
      'article h2 a',
      '.item-news .title-news a',
      '.article-topstory .title-news a'
    ],
    TITLE: 'h1.title-detail',
    SUMMARY: 'p.description',
    CONTENT: 'article.fck_detail p.Normal',
    AUTHOR: '.author_mail, p.author',
    IMAGE: [
      'article .fig-picture img',
      'article .Image img',
      'article img[itemprop="contentUrl"]',
      'article img.lazy',
      'article img'
    ],
    IMAGE_CAPTION: 'article .Image .desc, article .fig-picture .desc, article figcaption',
    TAGS: [
      '.tags a',
      '.tag-item a',
      '.tag a',
      'a[rel="tag"]',
      '.tags-item a',
      '.article-tags a'
    ],
    DATE: 'span.date, span.time'
  }
};

const FIREBASE_COLLECTIONS = {
  NEWS: 'news',
  ARTICLES: 'articles',
  TECH: 'tech'
};

module.exports = {
  SCRAPER_CONFIG,
  BROWSER_CONFIG,
  BLOCKED_RESOURCES,
  BLOCKED_DOMAINS,
  VNEXPRESS_CONFIG,
  FIREBASE_COLLECTIONS
};
