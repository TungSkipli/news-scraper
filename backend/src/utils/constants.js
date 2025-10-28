const PROXY_CONFIG = {
  HOST: process.env.PROXY_HOST || '',
  PORT: process.env.PROXY_PORT || '',
  USERNAME: process.env.PROXY_USERNAME || '',
  PASSWORD: process.env.PROXY_PASSWORD || '',
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
  USE_PROXY: false,
  CATEGORY_DETECTION_DELAY: 3000,
  NAV_TIMEOUT: 60000
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

const CATEGORY_MAPPING = {
  'giáo dục': 'education',
  'giao duc': 'education',
  'education': 'education',
  'học tập': 'education',
  'hoc tap': 'education',
  
  'xã hội': 'society',
  'xa hoi': 'society',
  'society': 'society',
  'đời sống': 'society',
  'doi song': 'society',
  
  'giải trí': 'entertainment',
  'giai tri': 'entertainment',
  'entertainment': 'entertainment',
  'nghệ thuật': 'entertainment',
  'nghe thuat': 'entertainment',
  'văn hóa': 'entertainment',
  'van hoa': 'entertainment',
  
  'thể thao': 'sports',
  'the thao': 'sports',
  'sports': 'sports',
  'bóng đá': 'sports',
  'bong da': 'sports',
  
  'kinh doanh': 'business',
  'kinh tế': 'business',
  'kinh te': 'business',
  'business': 'business',
  'economy': 'business',
  
  'công nghệ': 'technology',
  'cong nghe': 'technology',
  'technology': 'technology',
  'tech': 'technology',
  'khoa học': 'technology',
  'khoa hoc': 'technology',
  'science': 'technology',
  
  'sức khỏe': 'health',
  'suc khoe': 'health',
  'health': 'health',
  'y tế': 'health',
  'y te': 'health',
  
  'pháp luật': 'law',
  'phap luat': 'law',
  'law': 'law',
  'legal': 'law',
  
  'du lịch': 'travel',
  'du lich': 'travel',
  'travel': 'travel',
  'tourism': 'travel',
  
  'ô tô': 'automotive',
  'o to': 'automotive',
  'automotive': 'automotive',
  'xe': 'automotive',
  
  'thời sự': 'news',
  'thoi su': 'news',
  'tin tức': 'news',
  'tin tuc': 'news',
  'news': 'news',
  
  'chính trị': 'politics',
  'chinh tri': 'politics',
  'politics': 'politics',
  
  'thế giới': 'world',
  'the gioi': 'world',
  'world': 'world',
  'quốc tế': 'world',
  'quoc te': 'world',
  'international': 'world'
};

const normalizeCategory = (category) => {
  if (!category) return 'general';
  
  const normalized = category.toLowerCase().trim();
  
  return CATEGORY_MAPPING[normalized] || 'general';
};

const FIREBASE_COLLECTIONS = {
  NEWS: 'news',
  ARTICLES: 'articles',
  CATEGORY: 'category'
};

const DEFAULT_VALUES = {
  AUTHORS: 'Unknown',
  CATEGORY: 'general',
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
  DEFAULT_VALUES,
  CATEGORY_MAPPING,
  normalizeCategory
};