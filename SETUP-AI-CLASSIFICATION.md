# 🤖 AI Article Classification System

Hệ thống phân loại bài báo tự động bằng AI với khả năng học và tạo category mới.

## 🎯 Tính năng

### ✅ **Smart Category Management**
- **Cache categories**: Lưu vào file `backend/data/categories.json` → không cần query DB mỗi lần
- **Auto-create categories**: AI tự tạo category mới khi không tìm thấy category phù hợp
- **Semantic matching**: AI so khớp dựa trên ngữ nghĩa (similarity >= 0.7)
- **Memory**: AI nhớ các category đã tạo trong session

### ✅ **AI Classification Logic**
- **Phân tích nội dung**: Trích xuất keywords từ title, content, tags
- **So khớp thông minh**: "Deep learning" → "AI", "IoT + AI" → "AI"
- **Tạo category mới**: Chỉ khi thực sự cần thiết (similarity < 0.7)
- **Gộp chủ đề phụ**: IoT, automation → AI (không tạo category riêng)

---

## 📁 Cấu trúc File

```
backend/
├── src/
│   ├── controllers/
│   │   ├── scrapeController.js          # + saveArticleWithCategoryController
│   │   └── categoryController.js         # NEW: Quản lý categories
│   ├── routes/
│   │   ├── scrapeRoutes.js              # + /save-with-category
│   │   └── categoryRoutes.js             # NEW: /api/categories
│   ├── services/
│   │   └── universalScraper.js          # + saveArticleWithCategory()
│   └── app.js                            # + categoryRoutes
├── data/
│   └── categories.json                   # NEW: Cache categories

n8n-workflows/
├── ai-article-classifier.json            # NEW: Workflow phân loại 1 article
└── smart-scraper-with-ai-classification.json  # NEW: Workflow full
```

---

## 🚀 Hướng dẫn sử dụng

### 1️⃣ **Backend APIs**

#### **GET /api/categories**
Load tất cả categories (ưu tiên từ file cache)

```bash
curl http://localhost:5000/api/categories?source=file
```

**Response:**
```json
{
  "success": true,
  "message": "Categories loaded from cache file",
  "data": {
    "categories": [
      {
        "id": "cat_ai_001",
        "name": "AI",
        "keywords": ["AI", "machine learning", "deep learning"],
        "article_count": 0
      }
    ],
    "last_updated": "2025-01-01T00:00:00.000Z",
    "total": 4
  },
  "source": "file"
}
```

#### **POST /api/categories**
Tạo category mới (AI hoặc manual)

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blockchain",
    "description": "Blockchain, crypto, Web3",
    "keywords": ["blockchain", "crypto", "bitcoin"],
    "examples": ["Hướng dẫn đầu tư Bitcoin"],
    "created_by": "ai-agent"
  }'
```

#### **POST /api/categories/sync**
Sync categories từ Firestore về file

```bash
curl -X POST http://localhost:5000/api/categories/sync
```

#### **POST /api/scrape/save-with-category**
Lưu article với category đã được AI classify

```bash
curl -X POST http://localhost:5000/api/scrape/save-with-category \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "title": "Hướng dẫn Deep Learning",
      "url": "https://example.com/article",
      "content": "..."
    },
    "category_id": "cat_ai_001",
    "category_name": "AI",
    "classification": {
      "confidence": 0.92,
      "reasoning": "Bài về deep learning thuộc AI",
      "is_new_category": false,
      "matched_keywords": ["deep learning", "AI"]
    }
  }'
```

---

### 2️⃣ **n8n Workflows**

#### **Workflow 1: AI Article Classifier**
📄 File: `ai-article-classifier.json`

**Nhiệm vụ:** Phân loại 1 bài báo vào category

**Flow:**
```
Webhook → Load Categories → AI Classify → 
  IF new_category → Create Category
  ELSE → Return existing category
```

**Sử dụng:**
```bash
curl -X POST http://localhost:5678/webhook/classify-article \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "title": "Ứng dụng AI trong IoT",
      "content": "AI và IoT đang...",
      "tags": ["AI", "IoT"],
      "url": "https://example.com"
    },
    "backend_url": "http://localhost:5000"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "article_title": "Ứng dụng AI trong IoT",
    "category_id": "cat_ai_001",
    "category_name": "AI",
    "is_new_category": false,
    "confidence": 0.82,
    "reasoning": "IoT là ứng dụng của AI, gộp vào AI",
    "matched_keywords": ["AI", "machine learning"]
  }
}
```

---

#### **Workflow 2: Smart Scraper with AI Classification**
📄 File: `smart-scraper-with-ai-classification.json`

**Nhiệm vụ:** Scrape homepage → Classify từng article → Save

**Flow:**
```
Webhook → Load Categories (cache) → Scrape Articles → 
  Loop each article:
    → AI Classify → Save with Category
```

**Sử dụng:**
```bash
curl -X POST http://localhost:5678/webhook/smart-scraper \
  -H "Content-Type: application/json" \
  -d '{
    "homepage_url": "https://vnexpress.net",
    "maxCategories": 3,
    "maxPages": 2,
    "maxArticlesPerCategory": 20,
    "backend_url": "http://localhost:5000"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Smart scraping with AI classification completed",
  "data": {
    "total_articles": 60,
    "processed": 60,
    "summary": "All articles scraped, classified by AI, and saved with categories"
  }
}
```

---

## 🧠 AI Classification Logic

### **Ví dụ 1: Match với category có sẵn**

```
Input Article:
  Title: "Hướng dẫn xây dựng mô hình deep learning"
  Content: "Deep learning là..."
  Tags: ["AI", "machine learning"]

Existing Categories:
  - AI: keywords=[AI, machine learning, deep learning]
  - Blockchain: keywords=[blockchain, crypto]

AI Analysis:
  → Keywords: [deep learning, mô hình, AI]
  → Match "AI": 3/3 keywords = 1.0 (100%)
  → Threshold: 0.7 ✓

Output:
  {
    "category_id": "cat_ai_001",
    "category_name": "AI",
    "is_new_category": false,
    "confidence": 0.95,
    "reasoning": "Bài viết về deep learning thuộc lĩnh vực AI"
  }
```

---

### **Ví dụ 2: IoT + AI → Gộp vào AI**

```
Input Article:
  Title: "Ứng dụng AI trong thiết bị IoT thông minh"
  Content: "AI giúp IoT..."
  Tags: ["AI", "IoT"]

AI Analysis:
  → Keywords: [AI, IoT, smart device]
  → Chủ đề CHÍNH: AI (core technology)
  → Chủ đề PHỤ: IoT (application)
  → Match "AI": 0.82

Output:
  {
    "category_name": "AI",
    "is_new_category": false,
    "reasoning": "IoT là ứng dụng của AI, không tạo category riêng"
  }
```

---

### **Ví dụ 3: Không match → Tạo mới**

```
Input Article:
  Title: "10 công thức làm bánh gato"
  Content: "Cách làm bánh..."
  Tags: ["nấu ăn", "bánh"]

Existing Categories:
  - AI, Blockchain, Web Dev

AI Analysis:
  → Keywords: [làm bánh, nấu ăn, ẩm thực]
  → Match: Không category nào > 0.7
  → Cần tạo category mới

Output:
  {
    "category_name": "Ẩm thực",
    "is_new_category": true,
    "confidence": 0.95,
    "reasoning": "Chủ đề nấu ăn, không liên quan tech",
    "new_category_data": {
      "name": "Ẩm thực",
      "keywords": ["nấu ăn", "món ăn", "làm bánh"],
      "description": "Nấu ăn, công thức món ăn, ẩm thực"
    }
  }
```

---

## 🔧 Setup n8n với Firebase

### **1. Cài đặt Gemini API**

1. Vào n8n → **Credentials** → **Add Credential**
2. Chọn **Google Gemini API**
3. Nhập API Key từ `.env`:
   - `FIREBASE_API_KEY=AIzaSyCSLE4CmWxFDI1nprIiSbsskDLWN6ibv-0`

### **2. Import Workflows**

1. Vào n8n → **Workflows** → **Import from File**
2. Chọn file:
   - `ai-article-classifier.json`
   - `smart-scraper-with-ai-classification.json`
3. Click **Activate**

### **3. Test Workflow**

```bash
# Test classify 1 article
curl -X POST http://localhost:5678/webhook/classify-article \
  -H "Content-Type: application/json" \
  -d '{
    "article": {
      "title": "ChatGPT và AI",
      "content": "ChatGPT là...",
      "url": "https://example.com"
    }
  }'

# Test full scraper
curl -X POST http://localhost:5678/webhook/smart-scraper \
  -H "Content-Type: application/json" \
  -d '{
    "homepage_url": "https://vnexpress.net",
    "maxArticlesPerCategory": 5
  }'
```

---

## 📊 Database Schema

### **Firestore: categories collection**
```javascript
{
  id: "cat_ai_001",
  name: "AI",
  description: "Trí tuệ nhân tạo...",
  keywords: ["AI", "machine learning"],
  examples: ["Hướng dẫn TensorFlow"],
  article_count: 150,
  created_at: timestamp,
  updated_at: timestamp,
  created_by: "ai-agent-gemini"
}
```

### **Firestore: articles collection**
```javascript
{
  id: "article_001",
  title: "...",
  category: "AI",
  category_id: "cat_ai_001",
  classification: {
    confidence: 0.92,
    reasoning: "Deep learning thuộc AI",
    is_new_category: false,
    matched_keywords: ["deep learning"],
    classified_at: "2025-01-01T00:00:00Z",
    classified_by: "ai-gemini-agent"
  }
}
```

---

## 🎓 Tips

1. **Tối ưu token**: Dùng file cache thay vì query DB mỗi lần
2. **Semantic threshold**: 0.7 là ngưỡng tốt (70% tương đồng)
3. **Temperature**: 0.3 cho classification (cần chính xác)
4. **Category naming**: Dùng tên ngắn gọn ("AI" > "Artificial Intelligence")
5. **Merge topics**: Gộp chủ đề phụ vào chủ đề chính

---

## 🚨 Troubleshooting

### **Lỗi: "Cannot read categories.json"**
```bash
# Tạo file mặc định
curl -X POST http://localhost:5000/api/categories/sync
```

### **Lỗi: "Gemini API timeout"**
→ Giảm `maxArticlesPerCategory` xuống 5-10

### **Lỗi: "Category already exists"**
→ Bình thường, AI đang match với category có sẵn

---

## ✅ Hoàn tất!

Hệ thống đã sẵn sàng. Test bằng:

```bash
# 1. Sync categories
curl -X POST http://localhost:5000/api/categories/sync

# 2. Test classify
curl -X POST http://localhost:5678/webhook/classify-article \
  -d '{"article": {"title": "AI tutorial", "content": "Deep learning..."}}'

# 3. Run smart scraper
curl -X POST http://localhost:5678/webhook/smart-scraper \
  -d '{"homepage_url": "https://vnexpress.net"}'
```
