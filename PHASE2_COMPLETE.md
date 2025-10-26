# 🚀 PHASE 2: Multi-Source News Scraping System - COMPLETE

## ✅ What's Built

A comprehensive news scraping system that can:

1. **Detect Categories** - Automatically find all categories from a news website's homepage
2. **Scrape Entire Sources** - Crawl homepage → categories → articles in one command
3. **Multi-Source Support** - Handle multiple Vietnamese news websites
4. **Smart Storage** - Articles stored with source and category relationships
5. **Management APIs** - Query articles by source, category, or view all

---

## 📁 New Files Created

### **Backend Services:**
```
backend/src/services/
├── homepageDetector.js       - Detects categories from homepage
├── categoryListScraper.js    - Scrapes article URLs from category pages
├── sourceOrchestrator.js     - Main orchestrator for full source scraping
└── sourceService.js          - Database operations (sources, categories, articles)
```

### **Backend Controllers & Routes:**
```
backend/src/controllers/
└── sourceController.js       - Handles source/article queries

backend/src/routes/
└── sourceRoutes.js          - API routes for sources and articles
```

### **Test Scripts:**
```
backend/
└── test-full-scraper.js     - Comprehensive testing tool
```

---

## 🗄️ Database Structure

### **Collections:**

#### `sources` Collection:
```javascript
{
  id: "auto-generated",
  name: "Việt Báo",
  domain: "vvnm.vietbao.com",
  homepage_url: "https://vvnm.vietbao.com/",
  logo_url: "",
  total_articles: 150,
  total_categories: 8,
  last_scraped_at: timestamp,
  status: "active",
  created_at: timestamp
}
```

#### `categories` Collection:
```javascript
{
  id: "auto-generated",
  source_id: "source_id",
  source_domain: "vvnm.vietbao.com",
  name: "Tin tức",
  slug: "tin-tuc",
  url: "https://vvnm.vietbao.com/tin-tuc",
  total_articles: 25,
  last_scraped_at: timestamp,
  created_at: timestamp
}
```

#### `news/articles/global` Collection (Enhanced):
```javascript
{
  id: "auto-generated",
  
  // NEW: Source info
  source_id: "source_id",
  source_name: "Việt Báo",
  source_domain: "vvnm.vietbao.com",
  
  // NEW: Category info
  category_id: "category_id",
  category_name: "Tin tức",
  category_slug: "tin-tuc",
  
  // Existing article fields
  title: "...",
  slug: "...",
  summary: "...",
  content: "...",
  authors: "...",
  image: { url: "", caption: "" },
  tags: [],
  external_source: "original_url",
  created_at: timestamp,
  scraped_at: timestamp,
  state: "published",
  likes: 0
}
```

---

## 🔌 API Endpoints

### **Scraping APIs:**

#### `POST /detect-categories`
Detect categories from homepage (preview before scraping)

**Request:**
```json
{
  "url": "https://vvnm.vietbao.com/"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "source": {
      "name": "Vietbao",
      "domain": "vvnm.vietbao.com",
      "homepage_url": "https://vvnm.vietbao.com/"
    },
    "categories": [
      { "name": "Tin tức", "url": "https://vvnm.vietbao.com/tin-tuc" },
      { "name": "Thể thao", "url": "https://vvnm.vietbao.com/the-thao" }
    ]
  }
}
```

---

#### `POST /scrape-source`
Scrape entire source (homepage → categories → articles)

**Request:**
```json
{
  "url": "https://vvnm.vietbao.com/",
  "options": {
    "maxCategories": 5,
    "maxPages": 2,
    "maxArticlesPerCategory": 20,
    "maxArticles": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "source": { "id": "...", "name": "Việt Báo", ... },
    "categories": [{ "id": "...", "name": "Tin tức", ... }],
    "articles": {
      "total": 50,
      "success": 48,
      "failed": 2,
      "details": [...]
    }
  }
}
```

---

### **Query APIs:**

#### `GET /api/sources`
Get all news sources

**Response:**
```json
{
  "success": true,
  "total": 7,
  "data": [
    {
      "id": "...",
      "name": "Việt Báo",
      "domain": "vvnm.vietbao.com",
      "total_articles": 150,
      "total_categories": 8
    }
  ]
}
```

---

#### `GET /api/sources/:id`
Get single source details

---

#### `GET /api/sources/:id/categories`
Get all categories of a source

**Response:**
```json
{
  "success": true,
  "total": 8,
  "data": [
    {
      "id": "...",
      "name": "Tin tức",
      "slug": "tin-tuc",
      "url": "...",
      "total_articles": 25
    }
  ]
}
```

---

#### `GET /api/articles?source_id=xxx&category_id=yyy&limit=50`
Get articles with filters

**Query Parameters:**
- `source_id` (optional) - Filter by source
- `category_id` (optional) - Filter by category
- `limit` (optional) - Limit results (default: 50)

**Response:**
```json
{
  "success": true,
  "total": 150,
  "data": [
    {
      "id": "...",
      "title": "...",
      "source_name": "Việt Báo",
      "category_name": "Tin tức",
      "created_at": 1234567890
    }
  ]
}
```

---

#### `GET /api/articles/:id`
Get single article details

---

## 🧪 Testing

### **1. Start the server:**
```bash
cd backend
npm start
```

### **2. Test category detection:**
```bash
node test-full-scraper.js detect https://vvnm.vietbao.com/
```

### **3. Test full source scraping:**
```bash
node test-full-scraper.js scrape https://vvnm.vietbao.com/
```

⚠️ **Note:** This will take 5-10 minutes. It scrapes:
- 3 categories
- 5 articles per category
- Total: ~15 articles

### **4. View scraped sources:**
```bash
node test-full-scraper.js sources
```

### **5. View scraped articles:**
```bash
node test-full-scraper.js articles
```

---

## 📝 Test Workflow

### **Step-by-step testing:**

```bash
# 1. Detect categories first (fast preview)
node test-full-scraper.js detect https://vvnm.vietbao.com/

# 2. If categories look good, scrape the source
node test-full-scraper.js scrape https://vvnm.vietbao.com/

# 3. Check sources in database
node test-full-scraper.js sources

# 4. Check articles in database
node test-full-scraper.js articles

# 5. Try another source
node test-full-scraper.js scrape https://afamily.vn/
```

---

## 🎯 Supported News Sources

All 7 Vietnamese news sources:

1. ✅ `https://vvnm.vietbao.com/`
2. ✅ `https://ngoisao.vnexpress.net/`
3. ✅ `https://afamily.vn/`
4. ✅ `https://rangdongatlanta.com/`
5. ✅ `https://tinnuocmy.asia/`
6. ✅ `https://www.nguoi-viet.com/`
7. ✅ `https://saigonnhonews.com/`

---

## 🔧 Configuration Options

### **Scraping Options:**

```javascript
{
  maxCategories: 5,              // Max categories to scrape per source
  maxPages: 2,                   // Max pages to scrape per category
  maxArticlesPerCategory: 20,    // Max articles per category
  maxArticles: 100               // Max total articles per source
}
```

### **Adjust in test script or API request:**

For **quick testing** (2-3 minutes):
```javascript
{
  maxCategories: 2,
  maxPages: 1,
  maxArticlesPerCategory: 5,
  maxArticles: 10
}
```

For **full scraping** (30+ minutes):
```javascript
{
  maxCategories: 10,
  maxPages: 5,
  maxArticlesPerCategory: 50,
  maxArticles: 500
}
```

---

## 🎨 Next: Frontend Implementation

### **Pages to build:**

1. **HomePage** - Display all articles (mixed from all sources)
2. **SourceFilterDropdown** - Navbar dropdown to filter by source
3. **ArticleDetailPage** - View single article with full content
4. **SourcePage** - View all articles from one source
5. **CategoryPage** - View all articles from one category
6. **AdminPanel** - Trigger scraping from UI

### **Frontend will use these APIs:**
```javascript
// Get all articles (homepage)
GET /api/articles?limit=50

// Get articles by source (when user selects from dropdown)
GET /api/articles?source_id=xxx

// Get single article
GET /api/articles/:id

// Get all sources (for dropdown)
GET /api/sources
```

---

## 🐛 Troubleshooting

### **Server not running:**
```bash
cd backend
npm start
```

### **Missing dependencies:**
```bash
cd backend
npm install
```

### **Firebase connection error:**
Check `backend/.env` and `backend/serviceAccountKey.json`

### **Scraping timeout:**
Increase timeout in `backend/src/utils/constants.js`:
```javascript
SCRAPER_CONFIG: {
  TIMEOUT: 60000  // Increase to 60 seconds
}
```

---

## 📊 Performance

### **Detection Speed:**
- Homepage category detection: ~5-10 seconds

### **Scraping Speed:**
- Single article: ~3-5 seconds
- Category page: ~5-10 seconds
- Full source (15 articles): ~5-10 minutes

### **Database Performance:**
- Articles stored with full relationships
- Query by source/category: < 1 second
- Automatic counters updated

---

## ✅ PHASE 2 COMPLETE!

**What works:**
- ✅ Detect categories from homepage
- ✅ Scrape entire sources automatically
- ✅ Multi-source support
- ✅ Source & category management
- ✅ Enhanced database structure
- ✅ Query APIs ready
- ✅ Test scripts complete

**Ready for:**
- 🎨 Frontend implementation
- 🖥️ Admin panel for scraping
- 📱 User interface for browsing

---

## 🚀 Quick Start

```bash
# 1. Start backend
cd backend
npm start

# 2. In another terminal, test detection
node test-full-scraper.js detect https://vvnm.vietbao.com/

# 3. Scrape the source
node test-full-scraper.js scrape https://vvnm.vietbao.com/

# 4. View results
node test-full-scraper.js sources
node test-full-scraper.js articles
```

**Backend is ready! Let's build the frontend! 🎉**