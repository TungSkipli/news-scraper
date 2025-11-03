# 📮 Postman Collections

## 📦 Files

### 1. **AI-Classification-Real-Data.postman_collection.json**
Test AI Classification với 13 categories thực tế từ DB

**Categories có sẵn:**
- 🌸 **Lifestyle** (afamily.vn)
- 📰 **Xã hội** (afamily.vn)
- 💄 **Đẹp** (afamily.vn)
- 👶 **Mẹ & Bé** (afamily.vn)
- 📚 **Giáo dục** (afamily.vn)
- 📢 **Thời sự** (vnexpress.net)
- 🌍 **Thế giới** (vnexpress.net)
- 💼 **Kinh doanh** (vnexpress.net)
- 🔬 **Khoa học công nghệ** (vnexpress.net)
- 🇺🇸 **Tin nước Mỹ** (tinnuocmy.asia)
- 🇻🇳 **Tin Việt Nam** (tinnuocmy.asia)
- 👥 **Người Việt tại Mỹ** (tinnuocmy.asia)
- ✈️ **VISA Mỹ** (tinnuocmy.asia)

**10 Test Cases:**
1. ✅ Làm đẹp → Match "Đẹp"
2. ✅ AI/Tech → Match "Khoa học công nghệ"
3. ✅ Nuôi con → Match "Mẹ & Bé"
4. ✅ Tin quốc tế → Match "Thế giới"
5. ✅ Thời trang → Match "Lifestyle"
6. ✅ Startup → Match "Kinh doanh"
7. ✅ Du học Mỹ → Match "VISA Mỹ"
8. ⭐ Ẩm thực → **CREATE NEW** (không có category)
9. ⭐ Du lịch → **CREATE NEW** (không có category)
10. 💾 Save article với category

---

## 🚀 Quick Start

### 1. Import vào Postman
```
File → Import → Choose Files → Select JSON file
```

### 2. Setup Environment (Optional)
Tạo environment với variables:
- `backend_url`: `http://localhost:5000`
- `n8n_url`: `http://localhost:5678`

### 3. Start Services
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: n8n (import workflows trước)
n8n start
```

### 4. Run Tests
**Theo thứ tự:**
1. **Setup - Get Categories** → Xem 13 categories
2. **Test 1-7** → Match với categories có sẵn
3. **Test 8-9** → Tạo categories mới (Ẩm thực, Du lịch)
4. **Test 10** → Save article với category

---

## 📊 Expected Results

### ✅ Test Match Category
```json
{
  "success": true,
  "data": {
    "category_id": "BN01hE3I3VZzIlNJ4mrQ",
    "category_name": "Đẹp",
    "is_new_category": false,
    "confidence": 0.92,
    "reasoning": "Bài viết về skincare match với category Đẹp",
    "matched_keywords": ["làm đẹp", "skincare", "beauty"]
  }
}
```

### ⭐ Test Create New Category
```json
{
  "success": true,
  "data": {
    "category_name": "Ẩm thực",
    "is_new_category": true,
    "confidence": 0.9,
    "reasoning": "Chủ đề nấu ăn không match category nào, tạo mới",
    "new_category_data": {
      "name": "Ẩm thực",
      "keywords": ["nấu ăn", "món ăn", "ẩm thực"],
      "description": "Nấu ăn, công thức món ăn"
    }
  }
}
```

---

## 🎯 Test Scenarios

### Scenario 1: Article về làm đẹp
**Input:** "5 bí quyết chăm sóc da mùa hè"
- Keywords: làm đẹp, skincare, chăm sóc da
- **Expected:** Match "Đẹp" (confidence: ~0.9)

### Scenario 2: Article về AI
**Input:** "ChatGPT và cuộc cách mạng AI"
- Keywords: AI, công nghệ, machine learning
- **Expected:** Match "Khoa học công nghệ" (confidence: ~0.85)

### Scenario 3: Article về nuôi con
**Input:** "10 mẹo nuôi dạy con khoa học"
- Keywords: nuôi con, parenting, chăm sóc trẻ
- **Expected:** Match "Mẹ & Bé" (confidence: ~0.9)

### Scenario 8: Article về ẩm thực ⭐
**Input:** "10 công thức nấu món Việt"
- Keywords: nấu ăn, món ăn, ẩm thực
- **Expected:** Tạo category mới "Ẩm thực" (is_new_category: true)

---

## 🔍 Debug Tips

### Backend logs
```bash
# Xem logs khi classify
cd backend && npm run dev
```

### n8n execution logs
- Vào n8n UI: http://localhost:5678
- Click workflow → **Executions** tab
- Xem chi tiết từng step

### Check Firestore
```bash
# API kiểm tra categories
curl http://localhost:5000/api/categories
```

---

## 💡 Notes

1. **Similarity threshold**: 0.7 (70% match)
2. **AI model**: Gemini 1.5 Pro (temperature: 0.3)
3. **Category cache**: `backend/data/categories.json`
4. **New categories**: Tự động lưu vào Firestore + update cache file
5. **Semantic grouping**: 
   - "IoT + AI" → "Khoa học công nghệ"
   - "Du học + VISA" → "VISA Mỹ"
   - "Makeup + Skincare" → "Đẹp"

---

## 🐛 Troubleshooting

### Error: "Cannot connect to n8n"
```bash
# Check n8n running
curl http://localhost:5678/healthz

# Restart n8n
n8n start
```

### Error: "Categories not found"
```bash
# Sync từ Firestore
curl -X POST http://localhost:5000/api/categories/sync
```

### Error: "Gemini API timeout"
→ Check API key trong n8n credentials

---

## ✅ Success Checklist

- [ ] Backend đang chạy (port 5000)
- [ ] n8n đang chạy (port 5678)
- [ ] Đã import 2 workflows vào n8n
- [ ] Đã setup Gemini API credentials
- [ ] Test "Get Categories" success
- [ ] Test classify article success
- [ ] Test create new category success
- [ ] Test save article success

**All green?** 🎉 Bạn đã sẵn sàng!
