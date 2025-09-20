# 📚 Hướng Dẫn Thêm Phonetic vào Vocabulary.json

## ✨ Cấu trúc mới của vocabulary.json

Bây giờ bạn có thể thêm phiên âm (phonetic) trực tiếp vào file `vocabulary.json` thay vì phải code trong JavaScript.

### 🎯 **Cấu trúc từ vựng mới:**

```json
{
    "words": [
        {
            "word": "hello",
            "meaning": "xin chào",
            "type": "interjection",
            "example": "Hello! How are you today?",
            "level": "basic",
            "phonetic": {
                "en-US": "/həˈloʊ/",
                "en-GB": "/həˈləʊ/"
            }
        }
    ]
}
```

## 🔧 **Các trường dữ liệu:**

### **Trường bắt buộc:**
- `word`: Từ tiếng Anh
- `meaning`: Nghĩa tiếng Việt
- `type`: Loại từ (noun, verb, adjective, etc.)

### **Trường tùy chọn:**
- `example`: Ví dụ sử dụng từ
- `level`: Mức độ (basic, intermediate, advanced)
- `phonetic`: Object chứa phiên âm cho từng giọng

### **Trường phonetic:**
```json
"phonetic": {
    "en-US": "/phiên_âm_mỹ/",
    "en-GB": "/phiên_âm_anh/"
}
```

## 📝 **Cách thêm từ vựng mới:**

### **Bước 1: Mở file vocabulary.json**
```bash
# Sử dụng editor bất kỳ
code vocabulary.json
notepad vocabulary.json
```

### **Bước 2: Thêm từ mới vào mảng "words"**
```json
{
    "word": "từ_mới",
    "meaning": "nghĩa_tiếng_việt",
    "type": "loại_từ",
    "example": "Ví dụ sử dụng từ này.",
    "level": "basic",
    "phonetic": {
        "en-US": "/phiên_âm_mỹ/",
        "en-GB": "/phiên_âm_anh/"
    }
}
```

### **Bước 3: Lưu file và reload ứng dụng**

## 🎵 **Cách tra cứu phiên âm:**

### **1. Cambridge Dictionary:**
- Website: https://dictionary.cambridge.org/
- Cung cấp phiên âm US và UK
- Có audio pronunciation

### **2. Oxford Learners Dictionary:**
- Website: https://www.oxfordlearnersdictionaries.com/
- Phiên âm chuẩn UK
- Audio chất lượng cao

### **3. Merriam-Webster:**
- Website: https://www.merriam-webster.com/
- Phiên âm chuẩn US
- Từ điển uy tín của Mỹ

### **4. Các tool online:**
- **IPA Translator**: https://tophonetics.com/
- **Forvo**: https://forvo.com/ (pronunciation by native speakers)

## 📊 **Ví dụ phiên âm khác biệt:**

| Từ | 🇺🇸 US | 🇬🇧 UK | 🇦🇺 AU |
|----|---------|---------|---------|
| **dance** | /dæns/ | /dɑːns/ | /dæns/ |
| **bath** | /bæθ/ | /bɑːθ/ | /bɑːθ/ |
| **car** | /kɑːr/ | /kɑː/ | /kɑː/ |
| **water** | /ˈwɔːtər/ | /ˈwɔːtə/ | /ˈwɔːtə/ |
| **schedule** | /ˈskedʒuːl/ | /ˈʃedjuːl/ | /ˈʃedjuːl/ |

## 🎯 **Mẹo tra cứu hiệu quả:**

### **1. Sử dụng Cambridge Dictionary:**
```
1. Tìm từ trên Cambridge
2. Click vào UK 🇬🇧 để nghe British
3. Click vào US 🇺🇸 để nghe American  
4. Copy ký hiệu IPA tương ứng
```

### **2. Template nhanh:**
```json
{
    "word": "",
    "meaning": "",
    "type": "",
    "example": "",
    "level": "basic",
    "phonetic": {
        "en-US": "//",
        "en-GB": "//"
    }
}
```

## 🔄 **Xử lý khi thiếu phonetic:**

### **Nếu không có phonetic:**
```json
{
    "word": "newword",
    "meaning": "từ mới",
    "type": "noun"
    // Không có trường phonetic
}
```
- Ứng dụng sẽ hiển thị: `/newword/`
- Vẫn có thể phát âm bằng Web Speech API

### **Nếu thiếu một giọng:**
```json
"phonetic": {
    "en-US": "/həˈloʊ/",
    "en-GB": "/həˈləʊ/"
}
```
- Ứng dụng sẽ fallback về `en-US`
- Hoặc hiển thị `/word/` nếu không có `en-US`

## 📚 **Ký hiệu IPA cơ bản:**

### **Nguyên âm:**
- `/iː/` - "see" (dài)
- `/ɪ/` - "sit" (ngắn)  
- `/eɪ/` - "say" (đôi)
- `/æ/` - "cat"
- `/ɑː/` - "car" (UK)
- `/ɒ/` - "hot" (UK)
- `/ɔː/` - "saw"
- `/ʊ/` - "good"
- `/uː/` - "too"

### **Phụ âm:**
- `/θ/` - "think"
- `/ð/` - "this"  
- `/ʃ/` - "she"
- `/ʒ/` - "measure"
- `/tʃ/` - "chair"
- `/dʒ/` - "judge"
- `/ŋ/` - "sing"

### **Trọng âm:**
- `/ˈ/` - Trọng âm chính (primary stress)
- `/ˌ/` - Trọng âm phụ (secondary stress)

## 🚀 **Ví dụ thêm từ hoàn chỉnh:**

```json
{
    "word": "pronunciation",
    "meaning": "cách phát âm",
    "type": "noun",
    "example": "Your pronunciation is getting better.",
    "level": "intermediate",
    "phonetic": {
        "en-US": "/prəˌnʌnsiˈeɪʃən/",
        "en-GB": "/prəˌnʌnsiˈeɪʃən/"
    }
}
```

## ⚡ **Automation Tools (Tương lai):**

### **Script tự động tra phonetic:**
```python
# Ý tưởng cho script Python
import requests
import json

def get_phonetic(word):
    # Gọi API Cambridge/Oxford
    # Parse phonetic data
    # Return formatted JSON
    pass
```

### **Browser Extension:**
- Tự động copy phonetic từ Cambridge Dictionary
- Paste vào format JSON vocabulary

## 🎊 **Ưu điểm của cách mới:**

### ✅ **Ưu điểm:**
- **Dễ quản lý**: Tất cả data ở 1 file
- **Không cần code**: Chỉ cần edit JSON
- **Flexible**: Có thể thiếu phonetic một số từ
- **Scalable**: Dễ thêm từ mới
- **Maintainable**: Dễ sửa lỗi phonetic

### ✅ **So với cách cũ:**
- **Cũ**: Phải edit script.js → khó
- **Mới**: Chỉ edit vocabulary.json → dễ
- **Cũ**: Hard-coded → không linh hoạt  
- **Mới**: Data-driven → linh hoạt

---

## 📋 **Checklist thêm từ mới:**

- [ ] ✍️ Thêm `word`, `meaning`, `type`
- [ ] 📝 Thêm `example` (khuyến nghị)
- [ ] 🎯 Thêm `level` (basic/intermediate/advanced)
- [ ] 🔊 Tra cứu phonetic trên Cambridge Dictionary
- [ ] 🇺🇸 Thêm phiên âm US (`en-US`)
- [ ] 🇬🇧 Thêm phiên âm UK (`en-GB`)  
- [ ] ✅ Check JSON syntax validity
- [ ] 🔄 Test trong ứng dụng

**Chúc bạn thêm từ vựng hiệu quả! 📖✨**