# 🚀 Setup Guide: N8N 2025 - AI Agent with Gemini

## 📋 Tổng quan

Workflow này sử dụng **n8n 2025** với:
- ✅ **AI Agent node** (LangChain integration)
- ✅ **Gemini Chat Model** (Google AI)
- ✅ **Structured Output Parser** (đảm bảo JSON format)
- ✅ **Firebase Firestore** (lưu normalized categories)
- ✅ **Semantic grouping** (nhóm categories tự động)

## 🎯 Workflow Flow

```
Webhook
    ↓
Detect Categories (Backend API)
    ↓
Prepare AI Input
    ↓
AI Agent + Gemini Chat Model + Structured Parser
    ↓
Build Normalized Data
    ↓
Save to Firestore (normalized_categories collection)
    ↓
Prepare Scrape Request
    ↓
Scrape Articles (Backend API)
    ↓
Response with Results
```

## 📦 Yêu cầu

### 1. N8N Version

```bash
# Cần n8n >= 1.0.0 (2024-2025)
npm install -g n8n@latest

# Hoặc Docker
docker pull n8nio/n8n:latest
```

### 2. Required Packages

N8n 2025 tự động cài các packages LangChain:
- `@n8n/n8n-nodes-langchain` (AI Agent, Chat Models)
- `langchain` (core)
- `@langchain/google-genai` (Gemini integration)

## 🔧 Bước 1: Setup Gemini API

### 1.1. Lấy API Key

```bash
# Truy cập Google AI Studio
https://makersuite.google.com/app/apikey

# Click: Get API Key
# Create API key in new project
# Copy key: AIzaSy...
```

### 1.2. Thêm Credential vào n8n

```bash
# Mở n8n UI: http://localhost:5678
# Settings → Credentials → Add Credential
# Search: "Google Gemini"
# Chọn: "Google Gemini API"

# Nhập:
# - API Key: AIzaSy...
# - Name: "Google Gemini API"

# Save
```

## 🔧 Bước 2: Setup Firebase

### 2.1. Tạo Firebase Project

```bash
# Truy cập Firebase Console
https://console.firebase.google.com/

# Create Project hoặc chọn project existing
# Enable Firestore Database
# Chọn location: asia-southeast1
```

### 2.2. Tạo Service Account

```bash
# Project Settings → Service Accounts
# Click: Generate new private key
# Download JSON file
```

### 2.3. Thêm Firebase Credential vào n8n

```bash
# n8n UI → Credentials → Add Credential
# Search: "Google Firebase Cloud Firestore"
# Chọn: "Google Firebase Cloud Firestore OAuth2 API"

# Option 1: Upload Service Account JSON
# - Upload file JSON vừa download

# Option 2: Manual input
# - Project ID: your-project-id
# - Client Email: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# - Private Key: -----BEGIN PRIVATE KEY-----\n...

# Save với name: "Google Firebase"
```

### 2.4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /normalized_categories/{document=**} {
      allow read, write: if true;
    }
    
    match /news/articles/{category}/{article} {
      allow read, write: if true;
    }
    
    match /sources/{document=**} {
      allow read, write: if true;
    }
    
    match /categories/{document=**} {
      allow read, write: if true;
    }
  }
}
```

## 🔧 Bước 3: Import Workflow vào n8n

### 3.1. Import File

```bash
# n8n UI → Workflows
# Click: "+" → Import from File
# Select: auto-scraper-gemini-ai-agent-2025.json
# Click: Import
```

### 3.2. Cấu hình Credentials

Sau khi import, cần link credentials cho các nodes:

#### A. Gemini Chat Model Node

```
1. Click vào node "Gemini Chat Model"
2. Credential: Chọn "Google Gemini API" (đã tạo ở bước 1.2)
3. Model: gemini-1.5-pro (hoặc gemini-pro)
4. Temperature: 0.7
5. Max Output Tokens: 2048
```

#### B. Save to Firestore Node

```
1. Click vào node "5. Save to Firestore"
2. Credential: Chọn "Google Firebase" (đã tạo ở bước 2.3)
3. Project ID: your-project-id
4. Collection: normalized_categories
```

### 3.3. Update Project ID

```
1. Click vào node "5. Save to Firestore"
2. Tìm field "Project ID"
3. Thay: YOUR_PROJECT_ID → your-actual-project-id
```

## 🚀 Bước 4: Test Workflow

### 4.1. Activate Workflow

```bash
# Trong n8n UI
# Click toggle ở góc trên: OFF → ON
# Status: Active (màu xanh)
```

### 4.2. Get Webhook URL

```bash
# Click vào node "Webhook Trigger"
# Copy "Production URL":
http://localhost:5678/webhook/auto-scraper-ai
```

### 4.3. Test Request

```bash
curl -X POST http://localhost:5678/webhook/auto-scraper-ai \
  -H "Content-Type: application/json" \
  -d '{
    "homepage_url": "https://vnexpress.net",
    "backend_url": "http://localhost:5000",
    "firebase_project_id": "your-project-id"
  }'
```

### 4.4. Expected Response

```json
{
  "success": true,
  "message": "AI auto-selection mode completed: 85 articles scraped from 5 categories",
  "data": {
    "source": "VnExpress",
    "normalized_categories_count": 5,
    "original_categories_count": 12,
    "compression_ratio": "5:12",
    "articles_scraped": 85,
    "duplicates": 12,
    "failed": 3,
    "normalized_categories": [
      {
        "parent_name": "Thời sự",
        "parent_url": "https://vnexpress.net/thoi-su",
        "priority": 1,
        "score": 9.8,
        "subcategories": [],
        "reasoning": "Category thời sự có giá trị tin tức cao nhất, cập nhật liên tục",
        "estimated_articles": 50
      },
      {
        "parent_name": "Công nghệ",
        "parent_url": "https://vnexpress.net/so-hoa",
        "priority": 2,
        "score": 8.5,
        "subcategories": [
          {
            "original_name": "Khoa học",
            "url": "https://vnexpress.net/khoa-hoc",
            "relationship": "sibling",
            "semantic_similarity": 0.85
          }
        ],
        "reasoning": "Gộp Công nghệ và Khoa học vì cùng lĩnh vực tech/science",
        "estimated_articles": 40
      }
    ],
    "firebase_saved": true
  }
}
```

## 📊 Kiểm tra Firestore

### Xem Data

```bash
# Firebase Console → Firestore Database
# Collection: normalized_categories

# Document structure:
{
  source_domain: "vnexpress.net",
  source_name: "VnExpress",
  homepage_url: "https://vnexpress.net",
  normalized_categories: [...],  // Array of normalized
  original_categories: [...],     // Array of detected
  scrape_config: {...},
  semantic_analysis: {
    grouping_method: "semantic_clustering",
    similarity_threshold: 0.75
  },
  created_at: 1704067200000,
  created_by: "n8n-gemini-ai-agent-2025"
}
```

### Query Example

```javascript
// Node.js
const { Firestore } = require('@google-cloud/firestore');
const db = new Firestore();

const snapshot = await db.collection('normalized_categories')
  .where('source_domain', '==', 'vnexpress.net')
  .orderBy('created_at', 'desc')
  .limit(1)
  .get();

const latest = snapshot.docs[0].data();
console.log('Normalized categories:', latest.normalized_categories);
```

## 🎨 Ví dụ AI Output

### Input (Detected Categories)

```json
{
  "source": {
    "name": "Báo Phụ Nữ",
    "domain": "phunuonline.com.vn"
  },
  "categories": [
    {"name": "Làm đẹp", "url": "..."},
    {"name": "Trang điểm", "url": "..."},
    {"name": "Chăm sóc da", "url": "..."},
    {"name": "Mẹo đẹp", "url": "..."},
    {"name": "Thời trang nam", "url": "..."},
    {"name": "Thời trang nữ", "url": "..."},
    {"name": "Xu hướng 2025", "url": "..."},
    {"name": "Bóng đá Việt Nam", "url": "..."},
    {"name": "Bóng đá quốc tế", "url": "..."},
    {"name": "V-League", "url": "..."}
  ]
}
```

### AI Output (Gemini Normalized)

```json
{
  "normalized_categories": [
    {
      "parent_name": "Làm đẹp",
      "parent_url": "https://phunuonline.com.vn/lam-dep",
      "priority": 1,
      "score": 8.5,
      "subcategories": [
        {
          "original_name": "Trang điểm",
          "url": "https://phunuonline.com.vn/trang-diem",
          "relationship": "child",
          "semantic_similarity": 0.92
        },
        {
          "original_name": "Chăm sóc da",
          "url": "https://phunuonline.com.vn/cham-soc-da",
          "relationship": "child",
          "semantic_similarity": 0.88
        },
        {
          "original_name": "Mẹo đẹp",
          "url": "https://phunuonline.com.vn/meo-dep",
          "relationship": "synonym",
          "semantic_similarity": 0.95
        }
      ],
      "reasoning": "Gộp 4 categories về beauty/makeup thành 1 parent. Trang điểm, chăm sóc da, mẹo đẹp đều là phần của làm đẹp. Chọn URL /lam-dep vì tổng quát nhất và thường có nhiều bài viết nhất.",
      "estimated_articles": 60
    },
    {
      "parent_name": "Thời trang",
      "parent_url": "https://phunuonline.com.vn/thoi-trang-nu",
      "priority": 2,
      "score": 7.8,
      "subcategories": [
        {
          "original_name": "Thời trang nam",
          "url": "https://phunuonline.com.vn/thoi-trang-nam",
          "relationship": "sibling",
          "semantic_similarity": 0.98
        },
        {
          "original_name": "Xu hướng 2025",
          "url": "https://phunuonline.com.vn/xu-huong-2025",
          "relationship": "child",
          "semantic_similarity": 0.85
        }
      ],
      "reasoning": "Gộp các categories thời trang. Chọn URL thời trang nữ vì phù hợp với target audience của báo phụ nữ.",
      "estimated_articles": 50
    },
    {
      "parent_name": "Bóng đá",
      "parent_url": "https://phunuonline.com.vn/bong-da-vn",
      "priority": 3,
      "score": 6.5,
      "subcategories": [
        {
          "original_name": "Bóng đá quốc tế",
          "url": "https://phunuonline.com.vn/bong-da-qt",
          "relationship": "sibling",
          "semantic_similarity": 1.0
        },
        {
          "original_name": "V-League",
          "url": "https://phunuonline.com.vn/v-league",
          "relationship": "child",
          "semantic_similarity": 0.90
        }
      ],
      "reasoning": "Gộp tất cả categories bóng đá. V-League là giải đấu trong nước, thuộc Bóng đá VN. Chọn URL bóng đá VN vì local news có update frequency cao.",
      "estimated_articles": 30
    }
  ],
  "scrape_config": {
    "selected_for_scraping": [
      {
        "category": "Làm đẹp",
        "url": "https://phunuonline.com.vn/lam-dep",
        "maxArticles": 60
      },
      {
        "category": "Thời trang",
        "url": "https://phunuonline.com.vn/thoi-trang-nu",
        "maxArticles": 50
      },
      {
        "category": "Bóng đá",
        "url": "https://phunuonline.com.vn/bong-da-vn",
        "maxArticles": 30
      }
    ],
    "maxPages": 2,
    "maxArticlesPerCategory": 20
  },
  "semantic_analysis": {
    "grouping_method": "hierarchical_semantic_clustering",
    "similarity_threshold": 0.75
  }
}
```

**Kết quả:**
- 10 categories detected → 3 parent categories
- Compression ratio: 3:10 (70% reduction)
- Semantic similarity: 0.75-1.0
- Ước tính scrape: 140 articles

## ⚙️ Tùy chỉnh

### 1. Thay đổi Gemini Model

```json
// Node: Gemini Chat Model
{
  "modelName": "gemini-1.5-pro",     // Chính xác nhất
  // "modelName": "gemini-pro",       // Nhanh hơn
  // "modelName": "gemini-1.5-flash", // Rất nhanh, rẻ
}
```

### 2. Điều chỉnh Temperature

```json
{
  "temperature": 0.7  // 0.0-1.0
  // 0.0: Deterministic, luôn cho kết quả giống nhau
  // 0.5: Balanced
  // 1.0: Creative, đa dạng hơn
}
```

### 3. Thay đổi Semantic Threshold

Sửa trong AI Agent prompt:

```
"similarity_threshold": 0.75  // 0.70-0.90
// 0.70: Gộp nhiều hơn (aggressive)
// 0.80: Balanced
// 0.90: Gộp ít hơn (conservative)
```

### 4. Adjust Max Articles

```json
// Node: 6. Prepare Scrape Request
{
  "maxPages": 2,                    // Pages per category
  "maxArticlesPerCategory": 20,     // Articles per category
}
```

## 🔄 Schedule tự động

### Thêm Cron Trigger

```bash
# Thay "Webhook Trigger" bằng "Schedule Trigger"
# n8n UI: Add node → Schedule Trigger

# Cron expression examples:
0 */6 * * *     # Every 6 hours
0 0 * * *       # Every day at midnight
0 9,18 * * *    # At 9 AM and 6 PM
```

### Load Sources from Google Sheets

```bash
# Add node: Google Sheets
# Read sources từ sheet
# Loop qua từng source
# Gọi workflow cho mỗi source
```

## ❗ Lưu ý quan trọng

### 1. Gemini API Limits

```
Free tier:
- 15 requests/minute
- 1500 requests/day
- Rate limit: 1 request/4 seconds

Paid tier:
- 1000 requests/minute
- No daily limit
```

### 2. Firebase Costs

```
Firestore free tier:
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day
- 1 GB storage

Mỗi workflow run:
- ~1 write (normalized_categories)
- ~100-200 writes (articles)
```

### 3. Backend Requirements

```bash
# Backend phải chạy và support mode: "auto"
# Port: 5000 (default)
# Endpoints cần:
# - POST /api/scrape/detect-categories
# - POST /api/scrape/source
```

## 🐛 Troubleshooting

### Lỗi: "AI Agent execution failed"

```
Nguyên nhân: Gemini API key không hợp lệ
Giải pháp:
1. Kiểm tra API key trong Credentials
2. Test API key: https://makersuite.google.com/
3. Enable Gemini API trong Google Cloud Console
```

### Lỗi: "Output parser failed"

```
Nguyên nhân: AI không trả về đúng JSON schema
Giải pháp:
1. Check AI response trong execution log
2. Tăng temperature lên 0.8 để AI flexible hơn
3. Hoặc giảm xuống 0.3 để AI strict hơn
```

### Lỗi: "Firebase permission denied"

```
Nguyên nhân: Service Account không có quyền
Giải pháp:
1. Check Firestore Rules
2. Verify Service Account có role: "Cloud Datastore User"
3. Re-download Service Account JSON
```

### Workflow chậm (>10 phút)

```
Nguyên nhân: Scraping nhiều articles
Giải pháp:
1. Giảm maxArticlesPerCategory xuống 10-15
2. Giảm maxPages xuống 1
3. AI sẽ tự chọn ít categories hơn (priority cao)
```

## 📚 Tài liệu thêm

- [n8n AI Agent Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [LangChain Docs](https://js.langchain.com/docs/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)

---

**Version**: 2.0 (n8n 2025)  
**Last Updated**: 2025-01-01  
**Author**: AI Assistant
