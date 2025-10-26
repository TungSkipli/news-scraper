const PROXY_CONFIG = {
  HOST: '154.202.3.19',
  PORT: '49245',
  USERNAME: 'user49245',
  PASSWORD: 'K1C6FDl623',
  get URL() {
    return `${this.HOST}:${this.PORT}`;
  },
  get AUTH() {
    return `${this.USERNAME}:${this.PASSWORD}`;
  }
};

const SCRAPER_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 3000,
  PAGE_LOAD_DELAY: 2000,
  SCROLL_DELAY: 1000,
  USE_PROXY: false
};

const BROWSER_CONFIG = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    ...(SCRAPER_CONFIG.USE_PROXY ? [`--proxy-server=${PROXY_CONFIG.URL}`] : [])
  ],
  protocolTimeout: 90000,
  ignoreHTTPSErrors: true
};

const UNIVERSAL_SELECTORS = {
  TITLE: [
    'h1.title-detail',
    'h1.article-title',
    'h1.post-title',
    'h1[itemprop="headline"]',
    'h1.entry-title',
    'article h1',
    '.article-header h1',
    '.post-header h1',
    'h1',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'title'
  ],
  SUMMARY: [
    'p.description',
    'p.sapo',
    '.article-sapo',
    '.post-excerpt',
    '.entry-summary',
    'p[itemprop="description"]',
    'article > p:first-of-type',
    '.lead',
    '.article-lead',
    'meta[property="og:description"]',
    'meta[name="description"]'
  ],
  CONTENT: [
    'article.fck_detail p.Normal',
    'article .content-detail p',
    'article .article-content p',
    '.post-content p',
    '.entry-content p',
    'article p',
    '.article-body p',
    '[itemprop="articleBody"] p',
    '.content p',
    'main p'
  ],
  AUTHOR: [
    '.author_mail',
    'p.author',
    '.author-name',
    '[itemprop="author"]',
    '.byline',
    '.author',
    'meta[name="author"]',
    'meta[property="article:author"]',
    '.post-author'
  ],
  IMAGE: [
    'article .fig-picture img',
    'article .Image img',
    'article img[itemprop="contentUrl"]',
    'article img.wp-post-image',
    'article img.featured-image',
    '.post-thumbnail img',
    'article img:first-of-type',
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'img[itemprop="image"]'
  ],
  IMAGE_CAPTION: [
    'article .Image .desc',
    'article .fig-picture .desc',
    'article figcaption',
    '.wp-caption-text',
    '.image-caption',
    'figcaption'
  ],
  TAGS: [
    '.tags a',
    '.tag-item a',
    '.tag a',
    'a[rel="tag"]',
    '.tags-item a',
    '.article-tags a',
    '.post-tags a',
    '.entry-tags a',
    'meta[property="article:tag"]',
    'meta[name="keywords"]'
  ],
  DATE: [
    'span.date',
    'span.time',
    'time[datetime]',
    'time[itemprop="datePublished"]',
    '.post-date',
    '.entry-date',
    'meta[property="article:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="date"]'
  ]
};

const FIREBASE_COLLECTIONS = {
  NEWS: 'news',
  ARTICLES: 'articles',
  TECH: 'tech',
  GLOBAL: 'global'
};

const DEFAULT_VALUES = {
  AUTHORS: 'Unknown',
  CATEGORY_SLUG: 'tech',
  STATE: 'global',
  LIKES: 0,
  IMAGE_CAPTION: '',
  TAGS: []
};

module.exports = {
  PROXY_CONFIG,
  SCRAPER_CONFIG,
  BROWSER_CONFIG,
  UNIVERSAL_SELECTORS,
  FIREBASE_COLLECTIONS,
  DEFAULT_VALUES
};