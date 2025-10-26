# Frontend Structure

## Folder Organization

```
src/
├── pages/
│   ├── HomePage/                 # Trang chủ
│   │   └── index.js             # HomePage component
│   ├── NewsListPage/            # Trang danh sách tin tức
│   │   └── index.js             # NewsListPage component
│   ├── NewsDetailPage/          # Trang chi tiết tin tức
│   │   └── index.js             # NewsDetailPage component
│   └── ScraperPage/             # Trang scraper
│       └── index.js             # ScraperPage component
│
├── components/
│   ├── shared/                  # Components dùng chung
│   │   └── NewsCard.js          # Card hiển thị bài báo (variants: default, featured, horizontal)
│   └── layout/                  # Layout components
│       └── Navigation.js        # Header + Navigation bar
│
├── services/                    # API services
│   ├── newsService.js
│   └── scrapeService.js
│
├── config/                      # Configuration
│   └── firebase.js
│
├── styles/                      # Global styles
│   └── index.css
│
└── App.js                       # Main app component
```

## Naming Convention

- **Page-specific components**: Đặt trong folder của page đó
  - Example: `pages/HomePage/HeroSection.js`
  
- **Shared components**: Đặt trong `components/shared/`
  - Example: `components/shared/NewsCard.js`
  
- **Layout components**: Đặt trong `components/layout/`
  - Example: `components/layout/Navigation.js`

## Import Pattern

```javascript
// Page imports
import HomePage from './pages/HomePage';

// Shared component imports
import NewsCard from '../../components/shared/NewsCard';

// Service imports
import { getNews } from '../../services/newsService';
```

## Design System

- **Framework**: Tailwind CSS v3 + DaisyUI v4
- **Style**: VnExpress-inspired (clean, minimalist, content-focused)
- **Colors**: Default DaisyUI theme (primary blue)
- **Typography**: System fonts, clean and readable
