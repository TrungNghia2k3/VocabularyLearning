# 🎤 Hướng Dẫn Tính Năng Chọn Giọng Phát Âm

## ✨ Tính năng mới: Phân biệt giọng Anh và Mỹ

Ứng dụng hiện đã hỗ trợ **3 loại giọng tiếng Anh** khác nhau:

### 🇺🇸 **Tiếng Anh Mỹ (American English)**
- **Mã ngôn ngữ**: `en-US`
- **Đặc điểm**: Giọng phổ biến nhất, dễ nghe
- **Ví dụ khác biệt**: 
  - "dance" → `/dæns/` (ngắn)
  - "car" → `/kɑːr/` (có âm r cuối)

### 🇬🇧 **Tiếng Anh Anh (British English)**  
- **Mã ngôn ngữ**: `en-GB`
- **Đặc điểm**: Giọng chuẩn, trang trọng
- **Ví dụ khác biệt**:
  - "dance" → `/dɑːns/` (dài)
  - "car" → `/kɑː/` (không có âm r cuối)

### 🇦🇺 **Tiếng Anh Úc (Australian English)**
- **Mã ngôn ngữ**: `en-AU`  
- **Đặc điểm**: Giọng độc đáo, thân thiện
- **Ví dụ khác biệt**: Âm thanh đặc trưng của Úc

## 🔧 Cách sử dụng

### 1. **Chọn giọng trong navbar**
- Tìm dropdown "Giọng:" ở góc trên bên phải
- Chọn giọng yêu thích: 🇺🇸 Mỹ / 🇬🇧 Anh / 🇦🇺 Úc
- Ứng dụng sẽ tự động lưu lựa chọn

### 2. **Phát âm tự động thay đổi**
- **Flashcard**: Phiên âm (IPA) cập nhật theo giọng
- **Quiz**: Giọng đọc thay đổi theo lựa chọn
- **Browse**: Tất cả từ vựng hiển thị phiên âm mới
- **Practice**: Phát âm theo giọng đã chọn

### 3. **Lưu trữ tự động**
- Lựa chọn được lưu trong LocalStorage
- Lần mở ứng dụng tiếp theo vẫn giữ giọng đã chọn

## 📊 So sánh giọng phát âm

| Từ | 🇺🇸 Mỹ | 🇬🇧 Anh | 🇦🇺 Úc |
|---|---|---|---|
| **hello** | /həˈloʊ/ | /həˈləʊ/ | /həˈləʉ/ |
| **dance** | /dæns/ | /dɑːns/ | /dæns/ |
| **bath** | /bæθ/ | /bɑːθ/ | /bɑːθ/ |
| **car** | /kɑːr/ | /kɑː/ | /kɑː/ |
| **computer** | /kəmˈpjuːtər/ | /kəmˈpjuːtə/ | /kəmˈpjʉːtə/ |

## 🎯 Ưu điểm của từng giọng

### 🇺🇸 **American English** (Khuyến nghị cho người mới)
- ✅ **Phổ biến nhất** trong phim, nhạc, internet
- ✅ **Dễ học** - phát âm rõ ràng
- ✅ **Nhiều tài liệu** học tập
- ✅ **Chuẩn quốc tế** trong kinh doanh

### 🇬🇧 **British English** (Chuẩn mực)
- ✅ **Trang trọng** - phù hợp môi trường học thuật
- ✅ **Truyền thống** - giọng gốc của tiếng Anh  
- ✅ **Phổ biến** ở châu Âu, châu Á
- ✅ **Uy tín** trong các kỳ thi quốc tế

### 🇦🇺 **Australian English** (Thú vị)
- ✅ **Độc đáo** - dễ nhận diện
- ✅ **Thân thiện** - giọng điệu thoải mái
- ✅ **Hữu ích** nếu định cư/du học Úc
- ✅ **Đa dạng** - mở rộng khả năng nghe

## 🛠️ Tính năng kỹ thuật

### **Chọn giọng tự động**
```javascript
// Ưu tiên chọn giọng:
1. Google voices (chất lượng cao nhất)
2. Microsoft voices (tốt)  
3. Apple voices (iOS/macOS)
4. eSpeak voices (fallback)
```

### **Phiên âm động**
- Mỗi giọng có bộ từ điển phiên âm riêng
- Tự động cập nhật khi đổi giọng
- Hiển thị theo chuẩn IPA (International Phonetic Alphabet)

### **Tương thích trình duyệt**
| Trình duyệt | 🇺🇸 Mỹ | 🇬🇧 Anh | 🇦🇺 Úc |
|-------------|---------|---------|---------|
| **Chrome** | ✅ Xuất sắc | ✅ Xuất sắc | ✅ Tốt |
| **Edge** | ✅ Xuất sắc | ✅ Tốt | ✅ Tốt |
| **Firefox** | ✅ Tốt | ✅ Tốt | ⚠️ Hạn chế |
| **Safari** | ✅ Tốt | ✅ Tốt | ✅ Tốt |

## 📱 Responsive Mobile

### **Giao diện tối ưu**
- Dropdown giọng thu gọn trên mobile
- Font size nhỏ hơn cho phù hợp màn hình
- Layout navbar stack vertical khi cần

### **Hiệu năng**
- Giọng được cache sau lần đầu tải
- Switching nhanh giữa các giọng
- Không cần reload trang

## 🚀 Sử dụng nâng cao

### **Keyboard shortcuts** (tính năng tương lai)
- `Alt + 1`: Chuyển sang giọng Mỹ
- `Alt + 2`: Chuyển sang giọng Anh  
- `Alt + 3`: Chuyển sang giọng Úc

### **API mở rộng** (tính năng tương lai)
- Tích hợp Google Text-to-Speech cho chất lượng cao hơn
- Thêm giọng Canada, Ireland, South Africa
- Voice cloning với AI

## 💡 Mẹo sử dụng hiệu quả

### **Cho người mới học**
1. **Bắt đầu** với giọng Mỹ (🇺🇸) - dễ nghe nhất
2. **Luyện tập** với 1 giọng ít nhất 1 tháng
3. **Chuyển đổi** sang giọng khác để mở rộng

### **Cho người nâng cao**  
1. **So sánh** cùng 1 từ với 3 giọng khác nhau
2. **Tập trung** vào từ có sự khác biệt lớn (dance, bath, car)
3. **Luyện nghe** phim/podcast của từng vùng

### **Preparation cho kỳ thi**
- **IELTS**: Nên tập giọng Anh 🇬🇧
- **TOEFL**: Nên tập giọng Mỹ 🇺🇸  
- **PTE**: Cả 2 giọng đều hữu ích

---

## 🎊 Kết luận

Tính năng **phân biệt giọng Anh-Mỹ** giúp bạn:
- 🎯 **Học chính xác** theo mục tiêu
- 🌍 **Hiểu đa dạng** giọng điệu  
- 🚀 **Tiến bộ nhanh** hơn
- 🎓 **Chuẩn bị tốt** cho các kỳ thi

**Hãy thử ngay và trải nghiệm sự khác biệt! 🎵**