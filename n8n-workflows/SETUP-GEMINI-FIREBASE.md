# 🚀 Setup Guide: Auto Scraper with Gemini AI + Firebase

## 📋 Tổng quan

Workflow này tự động:
1. **Detect categories** từ homepage
2. **AI normalize** với Gemini (nhóm categories tương tự)
3. **Lưu vào Firebase** (collection: `normalized_categories`)
4. **Scrape articles** theo categories đã normalize
5. **Lưu articles** vào Firebase theo cấu trúc backend

## 🎯 Flow hoàn chỉnh

```
Homepage URL 
    ↓
Detect Categories (Backend API)
    ↓
Gemini AI Normalize
    ↓
Save to Firebase (normalized_categories)
    ↓
Scrape with Normalized Categories
    ↓
Save Articles to Firebase (news/articles/{category})
    ↓
Return Results
```

## 🔧 Bước 1: Setup Gemini AI API

### Option 1: Dùng Google AI Studio (Miễn phí)

1. Truy cập: https://makersuite.google.com/app/apikey
2. Click **Get API Key** → Create API key
3. Copy API key (dạng: `AIzaSy...`)

### Option 2: Dùng Vertex AI (Production)

1. Truy cập: https://console.cloud.google.com/
2. Enable **Vertex AI API**
3. Tạo Service Account với quyền **Vertex AI User**
4. Download JSON key

## 🔧 Bước 2: Setup Firebase

### 2.1. Enable Firestore

```bash
# Truy cập Firebase Console
https://console.firebase.google.com/

# Chọn project của bạn
# Firestore Database → Create Database
# Chọn mode: Production
# Location: asia-southeast1 (Singapore)
```

### 2.2. Tạo Service Account

```bash
# Project Settings → Service Accounts
# Generate new private key
# Download JSON file
```

### 2.3. Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow n8n to write normalized_categories
    match /normalized_categories/{document=**} {
      allow read, write: if true;
    }
    
    // Existing news collection rules
    match /news/{document=**} {
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

## 🔧 Bước 3: Cấu hình n8n

### 3.1. Install n8n

```bash
# Docker (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Hoặc npm
npm install n8n -g
n8n start
```

### 3.2. Thêm Credentials

#### A. Gemini AI Credential

**Option 1: HTTP Request với Gemini API**

1. n8n → Credentials → Add Credential
2. Chọn **Header Auth**
3. Name: `Gemini-API-Key`
4. Header Name: `x-goog-api-key`
5. Value: `YOUR_GEMINI_API_KEY`

**Option 2: Google PaLM API** (nếu n8n hỗ trợ)

1. Credentials → Google PaLM API
2. API Key: `YOUR_GEMINI_API_KEY`

#### B. Firebase Credential

1. Credentials → Google Firebase Cloud Firestore OAuth2 API
2. Upload Service Account JSON
3. Hoặc nhập:
   - Project ID
   - Private Key
   - Client Email

## 🔧 Bước 4: Update Workflow

### 4.1. Import Workflow

```bash
# n8n UI
Workflows → Import from File
→ Chọn: auto-scraper-gemini-normalize.json
→ Save
```

### 4.2. Cấu hình Gemini Node

Vì n8n chưa có native Gemini node, dùng **HTTP Request**:

**Thay node "Gemini AI Normalize" bằng:**

```json
{
  "parameters": {
    "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "requestMethod": "POST",
    "sendBody": true,
    "sendBodyAsJson": true,
    "bodyParametersJson": "={{JSON.stringify({\n  contents: [{\n    parts: [{\n      text: 'System: Bạn là AI Agent chuyên phân tích và nhóm categories tin tức dựa trên ngữ nghĩa...\\n\\nUser: ' + JSON.stringify($json.data)\n    }]\n  }],\n  generationConfig: {\n    temperature: 0.7,\n    maxOutputTokens: 2048\n  }\n})}}",
    "options": {}
  },
  "name": "Gemini AI Normalize",
  "type": "n8n-nodes-base.httpRequest",
  "credentials": {
    "httpHeaderAuth": {
      "id": "GEMINI_CREDENTIAL_ID",
      "name": "Gemini-API-Key"
    }
  }
}
```

### 4.3. Update Extract AI Response Node

```javascript
const geminiResponse = $input.item.json;
const detectionData = $node['Detect Categories'].json.data;

// Extract từ Gemini response
let aiText;
if (geminiResponse.candidates && geminiResponse.candidates[0]) {
  aiText = geminiResponse.candidates[0].content.parts[0].text;
} else {
  throw new Error('Gemini did not return valid response');
}

// Parse JSON từ response
let aiDecision;
try {
  const jsonMatch = aiText.match(/\{[\s\S]*\}/);
  aiDecision = JSON.parse(jsonMatch ? jsonMatch[0] : aiText);
} catch (error) {
  console.error('Failed to parse AI response:', aiText);
  throw new Error('AI did not return valid JSON: ' + error.message);
}

const normalizedData = {
  source: detectionData.source,
  normalized_categories: aiDecision.normalized_categories,
  scrape_config: aiDecision.scrape_config,
  semantic_analysis: aiDecision.semantic_analysis,
  original_categories: detectionData.categories,
  created_at: Date.now(),
  created_by: 'n8n-gemini-ai'
};

return { json: normalizedData };
```

### 4.4. Update Firebase Save Node

Thay `YOUR_PROJECT_ID` bằng Firebase Project ID của bạn:

```json
{
  "url": "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/normalized_categories"
}
```

## 🚀 Bước 5: Test Workflow

### Test Request

```bash
curl -X POST http://localhost:5678/webhook/auto-scraper-gemini \
  -H "Content-Type: application/json" \
  -d '{
    "homepage_url": "https://vnexpress.net",
    "backend_url": "http://localhost:5000"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "AI auto-selection mode completed: 85 articles scraped from 5 categories",
  "data": {
    "source": "VnExpress",
    "normalized_categories_count": 5,
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
        "reasoning": "Category thời sự có giá trị tin tức cao nhất"
      }
    ],
    "scrape_results": {...}
  }
}
```

## 📊 Kiểm tra Firebase

### Xem Normalized Categories

```bash
# Firebase Console → Firestore Database
# Collection: normalized_categories

Document Structure:
{
  source_domain: "vnexpress.net",
  source_name: "VnExpress",
  homepage_url: "https://vnexpress.net",
  normalized_categories: [...],
  original_categories: [...],
  scrape_config: {...},
  semantic_analysis: {...},
  created_at: 1704067200000,
  created_by: "n8n-gemini-ai"
}
```

### Query Example

```javascript
// Node.js/Firebase SDK
const snapshot = await db.collection('normalized_categories')
  .where('source_domain', '==', 'vnexpress.net')
  .orderBy('created_at', 'desc')
  .limit(1)
  .get();

const latestNormalization = snapshot.docs[0].data();
console.log(latestNormalization.normalized_categories);
```

## 🎨 Ví dụ thực tế

### Input (Detected Categories)

```json
{
  "categories": [
    {"name": "Làm đẹp", "url": "https://example.com/lam-dep"},
    {"name": "Trang điểm", "url": "https://example.com/trang-diem"},
    {"name": "Chăm sóc da", "url": "https://example.com/cham-soc-da"},
    {"name": "Mẹo đẹp", "url": "https://example.com/meo-dep"},
    {"name": "Thời trang nam", "url": "https://example.com/thoi-trang-nam"},
    {"name": "Thời trang nữ", "url": "https://example.com/thoi-trang-nu"}
  ]
}
```

### Output (Gemini Normalized)

```json
{
  "normalized_categories": [
    {
      "parent_name": "Làm đẹp",
      "parent_url": "https://example.com/lam-dep",
      "priority": 1,
      "score": 8.5,
      "subcategories": [
        {
          "original_name": "Trang điểm",
          "url": "https://example.com/trang-diem",
          "relationship": "child",
          "semantic_similarity": 0.92
        },
        {
          "original_name": "Chăm sóc da",
          "url": "https://example.com/cham-soc-da",
          "relationship": "child",
          "semantic_similarity": 0.88
        },
        {
          "original_name": "Mẹo đẹp",
          "url": "https://example.com/meo-dep",
          "relationship": "synonym",
          "semantic_similarity": 0.95
        }
      ],
      "reasoning": "Gộp 4 categories về beauty/makeup thành 1 parent. Trang điểm, chăm sóc da, mẹo đẹp đều là phần của làm đẹp. Chọn URL /lam-dep vì tổng quát nhất.",
      "estimated_articles": 50
    },
    {
      "parent_name": "Thời trang",
      "parent_url": "https://example.com/thoi-trang-nam",
      "priority": 2,
      "score": 7.8,
      "subcategories": [
        {
          "original_name": "Thời trang nữ",
          "url": "https://example.com/thoi-trang-nu",
          "relationship": "sibling",
          "semantic_similarity": 0.98
        }
      ],
      "reasoning": "Gộp thời trang nam & nữ. Chọn URL nam vì update frequency thường cao hơn.",
      "estimated_articles": 40
    }
  ],
  "scrape_config": {
    "selected_for_scraping": [
      {
        "category": "Làm đẹp",
        "url": "https://example.com/lam-dep",
        "maxArticles": 50
      },
      {
        "category": "Thời trang",
        "url": "https://example.com/thoi-trang-nam",
        "maxArticles": 40
      }
    ],
    "maxPages": 2,
    "maxArticlesPerCategory": 20
  }
}
```

### Saved to Firebase

```
Collection: normalized_categories
Document ID: auto-generated

{
  source_domain: "example.com",
  source_name: "Example News",
  homepage_url: "https://example.com",
  normalized_categories: [2 items gộp từ 6 categories],
  original_categories: [6 items detected],
  created_at: 1704067200000,
  created_by: "n8n-gemini-ai"
}
```

## 🔄 Schedule tự động

### Cron Schedule

```javascript
// n8n: Thay Webhook bằng Cron node
{
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 6
        }
      ]
    }
  },
  "name": "Every 6 Hours",
  "type": "n8n-nodes-base.cron"
}

// Thêm node lấy sources từ Firebase/Google Sheets
// Loop qua từng source và scrape
```

## ⚙️ Tùy chỉnh

### Thay đổi Gemini Model

```javascript
// gemini-pro (mặc định)
"url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

// gemini-pro-vision (nếu cần xử lý hình ảnh)
"url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent"
```

### Điều chỉnh Temperature

```javascript
"generationConfig": {
  "temperature": 0.7,  // 0.0-1.0 (0 = deterministic, 1 = creative)
  "maxOutputTokens": 2048
}
```

## ❗ Lưu ý

1. **Gemini API Quota**: Free tier có giới hạn requests/phút
2. **Firebase Costs**: Firestore free tier: 50K reads/day, 20K writes/day
3. **Backend phải chạy**: Port 5000
4. **Timeout**: Toàn bộ workflow có thể mất 5-20 phút

## 🐛 Troubleshooting

### Lỗi "Gemini API quota exceeded"
- Chờ 1 phút và retry
- Hoặc upgrade sang paid plan

### Lỗi "Firebase permission denied"
- Kiểm tra Firestore Rules
- Kiểm tra Service Account có đúng quyền

### Lỗi "AI did not return valid JSON"
- Log Gemini response để debug
- Có thể AI trả về markdown, cần regex extract

## 📚 Tài liệu

- [Gemini API Docs](https://ai.google.dev/docs)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [n8n Docs](https://docs.n8n.io/)

---

**Version**: 1.0  
**Last Updated**: 2025-01-01
