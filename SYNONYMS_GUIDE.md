# Hướng dẫn Synonyms, Antonyms và Word Families

## 🎯 Tổng quan
Ứng dụng học từ vựng đã được mở rộng với các tính năng học từ liên quan:
- **Synonyms** (Từ đồng nghĩa): Các từ có nghĩa tương tự
- **Antonyms** (Từ trái nghĩa): Các từ có nghĩa đối lập
- **Word Families** (Nhóm từ gia đình): Các dạng thức khác nhau của cùng một từ gốc

## 📁 Cấu trúc dữ liệu trong vocabulary.json

```json
{
  "word": "beautiful",
  "meaning": "đẹp",
  "type": "adjective",
  "example": "The sunset was absolutely beautiful.",
  "level": "basic",
  "phonetic": {
    "en-GB": "/ˈbjuː.tə.fəl/",
    "en-US": "/ˈbjuː.t̬ə.fəl/"
  },
  "synonyms": ["gorgeous", "lovely", "stunning", "attractive"],
  "antonyms": ["ugly", "hideous", "unattractive", "plain"],
  "wordFamily": {
    "noun": ["beauty", "beautification"],
    "verb": ["beautify"],
    "adjective": ["beautiful"],
    "adverb": ["beautifully"]
  }
}
```

## ✨ Tính năng mới

### 1. **Hiển thị trong chế độ Browse**
- Synonyms hiển thị với viền xanh lá và icon ➕
- Antonyms hiển thị với viền đỏ và icon ➖
- Word Family hiển thị với viền xanh dương và icon 🌳
- Hover effect để làm nổi bật từ

### 2. **Hiển thị trong chế độ Flashcard**
- Thông tin mở rộng xuất hiện ở mặt sau của thẻ
- Giúp học từ vựng một cách toàn diện

### 3. **Tìm kiếm mở rộng**
- Tìm kiếm real-time với debounce 300ms
- Tìm kiếm trong synonyms, antonyms và word families
- Không cần nhấn nút tìm kiếm
- Nhấn ESC để xóa tìm kiếm

## 🎨 Giao diện người dùng

### Color Coding:
- **🟢 Synonyms**: Màu xanh lá (success)
- **🔴 Antonyms**: Màu đỏ (danger)
- **🔵 Word Family**: Màu xanh dương (primary)

### Interactive Elements:
- Hover để làm nổi bật
- Click vào badge để... (có thể mở rộng thêm)
- Responsive design cho mobile

## 📝 Cách thêm dữ liệu

### Bắt buộc:
- `word`: Từ tiếng Anh
- `meaning`: Nghĩa tiếng Việt
- `type`: Loại từ

### Tùy chọn:
- `synonyms`: Array các từ đồng nghĩa
- `antonyms`: Array các từ trái nghĩa
- `wordFamily`: Object với các key là loại từ

### Ví dụ thêm từ mới:
```json
{
  "word": "happy",
  "meaning": "vui vẻ",
  "type": "adjective",
  "example": "She felt happy after receiving good news.",
  "level": "basic",
  "phonetic": {
    "en-GB": "/ˈhæp.i/",
    "en-US": "/ˈhæp.i/"
  },
  "synonyms": ["joyful", "cheerful", "delighted", "pleased"],
  "antonyms": ["sad", "unhappy", "miserable", "depressed"],
  "wordFamily": {
    "noun": ["happiness"],
    "verb": ["happen"],
    "adjective": ["happy"],
    "adverb": ["happily"]
  }
}
```

## 🔍 Tính năng tìm kiếm nâng cao

### Cách hoạt động:
1. Gõ bất kỳ từ nào vào ô tìm kiếm
2. Tự động tìm kiếm sau 300ms
3. Tìm trong: từ gốc, nghĩa, ví dụ, synonyms, antonyms, word families

### Ví dụ tìm kiếm:
- Gõ "gorgeous" → tìm thấy "beautiful" (qua synonyms)
- Gõ "ugly" → tìm thấy "beautiful" (qua antonyms)
- Gõ "beauty" → tìm thấy "beautiful" (qua word family)

## 🎓 Lợi ích học tập

### 1. **Mở rộng vốn từ vựng**
- Học nhiều từ cùng một lúc
- Hiểu mối quan hệ giữa các từ

### 2. **Cải thiện kỹ năng viết**
- Tránh lặp từ
- Sử dụng từ ngữ đa dạng

### 3. **Hiểu sâu về ngữ pháp**
- Học các dạng thức khác nhau của từ
- Hiểu cách chuyển đổi giữa các loại từ

## 🚀 Hướng phát triển

### Có thể thêm:
- Click vào synonym/antonym để chuyển đến từ đó
- Quiz về synonyms/antonyms
- Flashcard chuyên biệt cho word families
- Thống kê về số lượng synonyms/antonyms đã học

---

**Lưu ý**: Tất cả các trường synonyms, antonyms và wordFamily đều là tùy chọn. Ứng dụng sẽ hoạt động bình thường ngay cả khi không có các trường này.