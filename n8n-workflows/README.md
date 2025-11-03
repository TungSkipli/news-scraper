# 🤖 N8N Workflow: Smart Category Detector with AI

## 📋 Mô tả

Workflow này sử dụng AI (GPT-4) để tự động:
- **Phát hiện categories** từ homepage của news website
- **Nhóm categories tương tự** dựa trên ngữ nghĩa (semantic grouping)
- **Chuẩn hóa tên categories** (normalization)
- **Tự động scrape** các categories đã được AI chọn lọc

## 🎯 Tính năng chính

### 1. Semantic Grouping (Nhóm theo ngữ nghĩa)

AI sẽ tự động nhận diện và gộp các categories có liên quan:

**Ví dụ:**
```
Input:                          Output:
─────────────────────          ──────────────
"Làm đẹp"                      → "Làm đẹp" (parent)
"Trang điểm"                   ↗  
"Makeup"                       ↗
"Chăm sóc da"                  ↗
"Mẹo đẹp"                      ↗

"Thời trang nam"               → "Thời trang" (parent)
"Thời trang nữ"                ↗
"Xu hướng thời trang"          ↗

"Bóng đá Việt Nam"             → "Bóng đá" (parent)
"Bóng đá quốc tế"              ↗
"V-League"                     ↗

"Màu xanh đậm"                 → "Màu xanh" (parent)
"Màu xanh nhạt"                ↗
"Xanh da trời"                 ↗
```

### 2. AI Reasoning Logic

AI sử dụng logic như con người:
- **Cùng từ gốc**: "thời trang nam" + "thời trang nữ" = "thời trang"
- **Đồng nghĩa**: "mẹo đẹp" ≈ "làm đẹp"
- **Cha-con**: "iPhone" ⊂ "Điện thoại"
- **Semantic similarity**: Tính độ tương đồng ngữ nghĩa (0.75-1.0)

### 3. Smart Selection

AI tự động:
- Loại bỏ categories spam/quảng cáo
- Chọn URL đại diện tốt nhất cho nhóm
- Ưu tiên categories có giá trị tin tức cao
- Tránh trùng lặp nội dung

## 🚀 Cài đặt

### Bước 1: Cài đặt n8n

```bash
# Self-hosted (Docker)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Hoặc dùng n8n Cloud
# Truy cập: https://n8n.io/
```

### Bước 2: Cấu hình OpenAI API

1. Vào n8n interface: `http://localhost:5678`
2. Settings → Credentials → Add Credential
3. Chọn "OpenAI API"
4. Nhập API Key của bạn
5. Lưu với tên: "OpenAI API"

### Bước 3: Import Workflow

1. Vào n8n interface
2. Click **Workflows** → **Import from File**
3. Chọn file: `smart-category-detector-ai.json`
4. Click **Import**
5. Save workflow

## 📡 Sử dụng

### Cách 1: Test bằng Webhook

**Request:**
```bash
curl -X POST http://localhost:5678/webhook/detect-categories-ai \
  -H "Content-Type: application/json" \
  -d '{
    "homepage_url": "https://vnexpress.net",
    "backend_url": "http://localhost:5000"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "AI auto-selection mode completed: 85 articles scraped from 5 categories",
  "data": {
    "total_articles": 85,
    "duplicates": 12,
    "failed": 3,
    "categories_scraped": 5,
    "full_response": {
      "source": {
        "name": "VnExpress",
        "domain": "vnexpress.net"
      },
      "categories": [...],
      "articles": {...},
      "ai_metadata": {
        "ai_normalized_categories": [
          {
            "parent_name": "Thời sự",
            "parent_url": "https://vnexpress.net/thoi-su",
            "priority": 1,
            "score": 9.8,
            "subcategories": [...],
            "reasoning": "Category thời sự có giá trị tin tức cao nhất...",
            "semantic_similarity": 1.0
          }
        ]
      }
    }
  }
}
```

### Cách 2: Test trong n8n UI

1. Mở workflow vừa import
2. Click node "Webhook"
3. Click "Listen for Test Event"
4. Dùng Postman/curl gửi request như trên
5. Xem kết quả real-time

## 🔧 Cấu hình Backend

Workflow này yêu cầu backend API đã được update để hỗ trợ `mode: "auto"`.

**File đã được modify:**
- `backend/src/controllers/scrapeController.js` (đã thêm AI auto-selection mode)

**Endpoint được sử dụng:**
1. `POST /api/scrape/detect-categories` - Detect categories từ homepage
2. `POST /api/scrape/source` - Scrape với AI selected categories

## 🎨 Workflow Flow

```
┌─────────────┐
│  Webhook    │ Nhận homepage_url
└──────┬──────┘
       │
       v
┌─────────────────────┐
│ Detect Categories   │ Gọi backend API detect
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ Check Success       │ Validate response
└──────┬──────────────┘
       │ success
       v
┌─────────────────────┐
│ AI Analyze          │ GPT-4 phân tích & nhóm categories
│ (GPT-4)             │ - Semantic grouping
│                     │ - Normalization
│                     │ - Smart selection
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ Transform Data      │ Format JSON cho backend
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ Scrape Categories   │ Gọi backend với AI selected
└──────┬──────────────┘
       │
       v
┌─────────────────────┐
│ Respond Success     │ Trả về kết quả
└─────────────────────┘
```

## 📊 Ví dụ AI Output

**Input (detected categories):**
```json
{
  "categories": [
    {"name": "Làm đẹp", "url": "..."},
    {"name": "Trang điểm", "url": "..."},
    {"name": "Chăm sóc da", "url": "..."},
    {"name": "Mẹo đẹp", "url": "..."},
    {"name": "Thời trang nam", "url": "..."},
    {"name": "Thời trang nữ", "url": "..."}
  ]
}
```

**AI Output (normalized):**
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
          "relationship": "child",
          "semantic_similarity": 0.92
        },
        {
          "original_name": "Mẹo đẹp",
          "relationship": "synonym",
          "semantic_similarity": 0.95
        }
      ],
      "reasoning": "Gộp 4 categories về beauty/makeup thành 1 parent. Trang điểm, chăm sóc da, mẹo đẹp đều là phần của làm đẹp."
    },
    {
      "parent_name": "Thời trang",
      "parent_url": "https://example.com/thoi-trang-nam",
      "priority": 2,
      "score": 7.8,
      "subcategories": [
        {
          "original_name": "Thời trang nữ",
          "relationship": "sibling",
          "semantic_similarity": 0.98
        }
      ],
      "reasoning": "Gộp thời trang nam & nữ. Chọn URL nam vì thường có update frequency cao hơn."
    }
  ],
  "scrape_config": {
    "selected_for_scraping": [
      {"category": "Làm đẹp", "url": "...", "maxArticles": 50},
      {"category": "Thời trang", "url": "...", "maxArticles": 40}
    ]
  }
}
```

## ⚙️ Tùy chỉnh

### Thay đổi AI Model

Trong node "AI Analyze Categories", đổi `chatId`:
- `gpt-4` (mặc định - chính xác nhất)
- `gpt-4-turbo`
- `gpt-3.5-turbo` (nhanh hơn, rẻ hơn)

### Điều chỉnh Semantic Threshold

Trong AI prompt, thay đổi:
```
"similarity_threshold": 0.75  // 0.75-0.90 đều ok
```

### Thay đổi số lượng categories

Trong AI prompt hoặc backend config:
```json
{
  "maxPages": 2,
  "maxArticlesPerCategory": 20
}
```

## ❗ Lưu ý

1. **OpenAI API Key**: Cần có API key hợp lệ với credits
2. **Backend phải chạy**: Đảm bảo backend API đang chạy ở port 5000
3. **Timeout**: Scraping có thể mất 5-15 phút tùy số lượng categories
4. **Rate limiting**: Thêm delay giữa các requests (2s mặc định)
5. **Error handling**: Workflow có continue-on-fail cho tất cả HTTP requests

## 🐛 Troubleshooting

### Lỗi "AI did not return valid JSON"
- AI có thể trả về markdown code block
- Function node đã xử lý bằng regex extract JSON
- Nếu vẫn lỗi, kiểm tra AI prompt có đúng format không

### Lỗi "Category not found"
- Backend API không tìm thấy category
- Kiểm tra URL có chính xác không
- Thử detect lại categories

### Timeout Error
- Tăng timeout trong HTTP Request nodes (mặc định 600s)
- Giảm số lượng articles per category
- Scrape từng category riêng lẻ

## 📚 Tài liệu thêm

- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Docs](https://platform.openai.com/docs/)
- Backend API: `http://localhost:5000/api/`

## 🎯 Next Steps

Sau khi workflow chạy thành công, bạn có thể:
1. Schedule workflow chạy định kỳ (cron)
2. Thêm notification qua Telegram/Slack
3. Lưu logs vào Google Sheets
4. Tích hợp với Airtable để quản lý sources

---

**Tác giả**: AI Assistant  
**Version**: 1.0  
**Last Updated**: 2025-01-01
