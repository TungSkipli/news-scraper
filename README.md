# 📰 Multi-Source News Scraper

A comprehensive news scraping system that automatically detects categories from Vietnamese news homepages, scrapes articles, and provides a beautiful interface to browse content from multiple sources.

## 🌟 Features

- **Multi-Source Support**: Add any Vietnamese news website by URL
- **Auto Category Detection**: Automatically finds all categories from homepage
- **Smart Scraping**: Configurable depth and breadth
- **Source Filtering**: Filter articles by source in navbar
- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **Admin Panel**: Manage sources and trigger scrapes
- **Firebase Storage**: Cloud-based article storage

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- Firebase account
- Chrome/Chromium (for Puppeteer)

### Installation

```bash
# Clone repository
git clone <your-repo>
cd news-scraper

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Configuration

**Backend `.env`:**
```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email
CORS_ORIGIN=http://localhost:3000
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000
```

### Run

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm start
```

Open browser: **http://localhost:3000**

## 📖 Usage

### 1. Add a News Source

1. Navigate to **Scraper** page
2. Enter homepage URL (e.g., `https://vvnm.vietbao.com/`)
3. Click **"Phát hiện danh mục"** to preview categories
4. Configure options:
   - **Max Categories**: 2-10
   - **Max Pages**: 1-5  
   - **Max Articles per Category**: 5-50
5. Click **"Bắt đầu Scrape"**
6. Wait for completion (2-30 minutes depending on settings)

### 2. Browse Articles

- **Homepage**: View mixed articles from all sources
- **Source Filter**: Use navbar dropdown to filter by source
- **Source Page**: Click source name to view all articles from that source
- **Category Filter**: On source page, click category tabs
- **Article Detail**: Click any article to read full content

### 3. Supported Sources

Preset Vietnamese news sites:
- vvnm.vietbao.com
- ngoisao.vnexpress.net
- afamily.vn
- rangdongatlanta.com
- tinnuocmy.asia
- nguoi-viet.com
- saigonnhonews.com

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   │   ├── homepageDetector.js      # Detect categories
│   │   ├── categoryListScraper.js   # Scrape article lists
│   │   ├── universalScraper.js      # Scrape article content
│   │   ├── sourceOrchestrator.js    # Coordinate scraping
│   │   └── sourceService.js         # Database operations
│   └── utils/           # Helpers & constants
└── server.js            # Entry point
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/      # Navigation
│   │   └── shared/      # NewsCard
│   ├── pages/
│   │   ├── HomePage/            # Mixed articles
│   │   ├── SourcePage/          # Single source view
│   │   ├── CategoryPage/        # Single category view
│   │   ├── NewsDetailPage/      # Article detail
│   │   └── ScraperPage/         # Admin panel
│   └── services/        # API calls
└── App.js               # Routes
```

## 🔌 API Endpoints

### Articles
- `GET /api/articles?source_id=xxx&category_id=yyy&limit=50` - Get articles with filters
- `GET /api/articles/:id` - Get single article

### Sources
- `GET /api/sources` - Get all sources
- `GET /api/sources/:id` - Get single source
- `GET /api/sources/:id/categories` - Get categories for source

### Scraping
- `POST /detect-categories` - Detect categories from homepage
  ```json
  { "url": "https://example.com" }
  ```
- `POST /scrape-source` - Scrape entire source
  ```json
  {
    "url": "https://example.com",
    "options": {
      "maxCategories": 2,
      "maxPages": 1,
      "maxArticlesPerCategory": 5
    }
  }
  ```

## 🗄️ Database Structure

### Firebase Collections

**`sources/`** - News sources
```javascript
{
  id: "auto-generated",
  name: "Vietbao",
  domain: "vvnm.vietbao.com",
  homepage_url: "https://vvnm.vietbao.com/",
  total_articles: 150,
  total_categories: 5,
  created_at: timestamp
}
```

**`categories/`** - Source categories
```javascript
{
  id: "auto-generated",
  source_id: "source-id",
  name: "Thế giới",
  slug: "the-gioi",
  url: "https://example.com/the-gioi",
  total_articles: 30,
  created_at: timestamp
}
```

**`news/articles/global/`** - Articles (legacy path preserved)
```javascript
{
  id: "auto-generated",
  title: "Article title",
  summary: "Summary text",
  content: "Full content",
  image: { url, caption },
  source_id: "source-id",
  source_name: "Vietbao",
  source_domain: "vvnm.vietbao.com",
  category_id: "category-id",
  category_name: "Thế giới",
  category_slug: "the-gioi",
  external_source: "original-url",
  published_at: timestamp,
  scraped_at: timestamp
}
```

## 🧪 Testing

### Test Backend
```bash
cd backend

# Detect categories
node test-full-scraper.js detect https://vvnm.vietbao.com/

# Scrape source (quick test)
node test-full-scraper.js scrape https://vvnm.vietbao.com/

# View sources
node test-full-scraper.js sources

# View articles
node test-full-scraper.js articles
```

### Test Frontend
1. Start servers (backend + frontend)
2. Open http://localhost:3000
3. Go to /scraper
4. Add a preset source
5. Check homepage for new articles
6. Test source filter in navbar

## ⚙️ Configuration

### Scraping Speed Presets

**Quick Test** (2-3 minutes, ~10 articles)
```javascript
{
  maxCategories: 2,
  maxPages: 1,
  maxArticlesPerCategory: 5
}
```

**Normal** (10-15 minutes, ~50 articles)
```javascript
{
  maxCategories: 5,
  maxPages: 2,
  maxArticlesPerCategory: 10
}
```

**Deep** (30+ minutes, ~200 articles)
```javascript
{
  maxCategories: 10,
  maxPages: 5,
  maxArticlesPerCategory: 20
}
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - Server framework
- **Puppeteer** - Web scraping & automation
- **puppeteer-extra-plugin-stealth** - Anti-bot detection
- **Firebase Admin SDK** - Database
- **Cheerio** - HTML parsing (legacy)

### Frontend
- **React 19** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library

## 📚 Documentation

- [BACKEND_PHASE1_COMPLETE.md](./BACKEND_PHASE1_COMPLETE.md) - Phase 1 details
- [PHASE2_COMPLETE.md](./PHASE2_COMPLETE.md) - Phase 2 multi-source system
- [PHASE3_FRONTEND_COMPLETE.md](./PHASE3_FRONTEND_COMPLETE.md) - Phase 3 frontend implementation

## 🐛 Troubleshooting

### Backend won't start
- Check `.env` file exists
- Verify Firebase credentials
- Install Chrome/Chromium: `npx puppeteer browsers install chrome`

### Frontend can't connect to backend
- Check backend is running on port 5000
- Verify CORS_ORIGIN in backend `.env`
- Check REACT_APP_API_URL in frontend `.env`

### Scraping fails
- Website may have anti-bot measures
- Check internet connection
- Try with a different source
- Increase timeout in constants.js

### No articles showing
- Check if sources exist: `node test-full-scraper.js sources`
- Run a test scrape: `node test-full-scraper.js scrape <url>`
- Check Firebase console for data

## 📈 Performance

- **Category Detection**: 5-10 seconds
- **Article Scraping**: 3-5 seconds per article
- **Typical Scrape**: 10-20 articles in 2-3 minutes
- **Database**: Firestore free tier (50K reads/day, 20K writes/day)

## 🔐 Security Notes

- Never commit `.env` files
- Use Firebase security rules in production
- Rate limit API endpoints
- Validate all user inputs
- Use HTTPS in production

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues or questions, please open a GitHub issue.

---

**Made with ❤️ for Vietnamese news readers**