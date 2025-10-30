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
  // Education
  'giáo dục': 'education',
  'giao duc': 'education',
  'giaoduc': 'education',
  'education': 'education',
  'học tập': 'education',
  'hoc tap': 'education',
  'hoctap': 'education',
  'edu': 'education',
  
  // Society & Lifestyle
  'xã hội': 'society',
  'xa hoi': 'society',
  'xahoi': 'society',
  'society': 'society',
  'đời sống': 'society',
  'doi song': 'society',
  'doisong': 'society',
  'lifestyle': 'society',
  'life': 'society',
  
  // Entertainment
  'giải trí': 'entertainment',
  'giai tri': 'entertainment',
  'giaitri': 'entertainment',
  'entertainment': 'entertainment',
  'nghệ thuật': 'entertainment',
  'nghe thuat': 'entertainment',
  'nghethuat': 'entertainment',
  'văn hóa': 'entertainment',
  'van hoa': 'entertainment',
  'vanhoa': 'entertainment',
  'culture': 'entertainment',
  'art': 'entertainment',
  'showbiz': 'entertainment',
  'celebrity': 'entertainment',
  'video': 'entertainment',
  'phim': 'entertainment',
  'nhac': 'entertainment',
  'music': 'entertainment',
  'movie': 'entertainment',
  
  // Sports
  'thể thao': 'sports',
  'the thao': 'sports',
  'thethao': 'sports',
  'sports': 'sports',
  'sport': 'sports',
  'bóng đá': 'sports',
  'bong da': 'sports',
  'bongda': 'sports',
  'football': 'sports',
  'soccer': 'sports',
  
  // Business & Economy
  'kinh doanh': 'business',
  'kinhdoanh': 'business',
  'kinh tế': 'business',
  'kinh te': 'business',
  'kinhte': 'business',
  'business': 'business',
  'economy': 'business',
  'finance': 'business',
  'tài chính': 'business',
  'tai chinh': 'business',
  'taichinh': 'business',
  'startup': 'business',
  'bizlive': 'business',
  'cafef': 'business',
  
  // Technology & Science
  'công nghệ': 'technology',
  'cong nghe': 'technology',
  'congnghe': 'technology',
  'technology': 'technology',
  'tech': 'technology',
  'khoa học': 'technology',
  'khoa hoc': 'technology',
  'khoahoc': 'technology',
  'science': 'technology',
  'digital': 'technology',
  'ictnews': 'technology',
  'genk': 'technology',
  'so': 'technology', // số (digital)
  'ai': 'technology',
  'cntt': 'technology',
  
  // Health
  'sức khỏe': 'health',
  'suc khoe': 'health',
  'suckhoe': 'health',
  'health': 'health',
  'y tế': 'health',
  'y te': 'health',
  'yte': 'health',
  'medical': 'health',
  'sức khoẻ': 'health',
  'suc khoe': 'health',
  
  // Law
  'pháp luật': 'law',
  'phap luat': 'law',
  'phapluat': 'law',
  'law': 'law',
  'legal': 'law',
  'an ninh': 'law',
  'anninh': 'law',
  'hình sự': 'law',
  'hinh su': 'law',
  
  // Travel
  'du lịch': 'travel',
  'du lich': 'travel',
  'dulich': 'travel',
  'travel': 'travel',
  'tourism': 'travel',
  
  // Automotive
  'ô tô': 'automotive',
  'o to': 'automotive',
  'oto': 'automotive',
  'automotive': 'automotive',
  'xe': 'automotive',
  'auto': 'automotive',
  'car': 'automotive',
  'xe hoi': 'automotive',
  'xehoi': 'automotive',
  
  // News & Current Events
  'thời sự': 'news',
  'thoi su': 'news',
  'thoisu': 'news',
  'tin tức': 'news',
  'tin tuc': 'news',
  'tintuc': 'news',
  'news': 'news',
  'latest': 'news',
  'trending': 'news',
  'hot': 'news',
  
  // Politics
  'chính trị': 'politics',
  'chinh tri': 'politics',
  'chinhtri': 'politics',
  'politics': 'politics',
  
  // World & International
  'thế giới': 'world',
  'the gioi': 'world',
  'thegioi': 'world',
  'world': 'world',
  'quốc tế': 'world',
  'quoc te': 'world',
  'quocte': 'world',
  'international': 'world',
  'global': 'world',
  
  // Real Estate
  'bất động sản': 'realestate',
  'bat dong san': 'realestate',
  'batdongsan': 'realestate',
  'bds': 'realestate',
  'realestate': 'realestate',
  'property': 'realestate',
  'nha dat': 'realestate',
  'nhadat': 'realestate',
  
  // Food
  'ẩm thực': 'food',
  'am thuc': 'food',
  'amthuc': 'food',
  'food': 'food',
  'cooking': 'food',
  'recipe': 'food',
  'mon an': 'food',
  'monan': 'food'
};

/**
 * Normalize category name to standard format
 * Returns 'uncategorized' if category cannot be determined
 * 
 * @param {string} category - Raw category name from URL or metadata
 * @param {object} options - Additional options for category detection
 * @returns {string} Normalized category name
 */
const normalizeCategory = (category, options = {}) => {
  if (!category) {
    console.warn('[normalizeCategory] No category provided, using fallback');
    return 'uncategorized';
  }
  
  const normalized = category.toLowerCase().trim()
    .replace(/[-_]/g, ' ') // Convert dashes/underscores to spaces
    .replace(/\s+/g, ' '); // Normalize multiple spaces
  
  // Direct match
  if (CATEGORY_MAPPING[normalized]) {
    return CATEGORY_MAPPING[normalized];
  }
  
  // Fuzzy match: check if any key is contained in the category
  for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log(`[normalizeCategory] Fuzzy matched: "${category}" -> "${value}"`);
      return value;
    }
  }
  
  // Still couldn't categorize
  console.warn(`[normalizeCategory] Could not categorize: "${category}", using fallback`);
  
  // If strict mode, keep original category as slug
  if (options.keepOriginal) {
    return category.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
  }
  
  return 'uncategorized';
};

// Firebase path: news/articles/{category}/:id
const FIREBASE_COLLECTIONS = {
  NEWS: 'news',
  ARTICLES: 'articles'
};

const DEFAULT_VALUES = {
  AUTHORS: 'Unknown',
  CATEGORY: 'uncategorized',
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
