# Hướng Dẫn Tính Năng Phát Âm

## 🔊 Tính năng phát âm đã được tích hợp

Ứng dụng học từ vựng hiện đã có tính năng phát âm chuẩn sử dụng **Web Speech API** - một API miễn phí được tích hợp sẵn trong trình duyệt.

## ✨ Các tính năng phát âm

### 1. **Flashcard Mode**
- Nút phát âm ở góc trên bên phải thẻ từ vựng
- Hiển thị ký hiệu phiên âm (phonetic) bên dưới từ
- Nút phát âm ví dụ ở mặt sau của thẻ

### 2. **Quiz Mode**
- Nút phát âm bên cạnh câu hỏi để nghe cách đọc từ

### 3. **Browse Mode (Danh sách từ vựng)**
- Nút phát âm nhỏ bên cạnh mỗi từ
- Hiển thị ký hiệu phiên âm cho mỗi từ

### 4. **Practice Mode**
- Nút phát âm để nghe từ cần luyện tập

## 🎯 Dịch vụ phát âm sử dụng

### **Web Speech API** (Miễn phí)
- ✅ **Miễn phí 100%** - tích hợp sẵn trong trình duyệt
- ✅ **Không cần API key**
- ✅ **Hoạt động offline** (một số trường hợp)
- ✅ **Chất lượng tốt** với giọng Google/Microsoft
- ✅ **Hỗ trợ nhiều giọng** (US, UK, Australian English)

### Trình duyệt hỗ trợ:
- ✅ Chrome/Edge: Tuyệt vời
- ✅ Firefox: Tốt
- ✅ Safari: Tốt
- ❌ Internet Explorer: Không hỗ trợ

## 🛠️ Các dịch vụ phát âm khác (tùy chọn)

### 1. **ResponsiveVoice** (Freemium)
```javascript
// Thêm vào HTML
<script src="https://code.responsivevoice.org/responsivevoice.js?key=YOUR_KEY"></script>

// Sử dụng
responsiveVoice.speak("hello", "UK English Male");
```
- ✅ Miễn phí: 6,500 ký tự/ngày
- ✅ Nhiều giọng đọc
- ❌ Cần đăng ký API key

### 2. **Google Text-to-Speech API** (Trả phí)
```javascript
// Cần API key và có phí
const url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
```
- ✅ Chất lượng cao nhất
- ✅ Nhiều giọng tự nhiên
- ❌ Có phí ($4/1M ký tự)

### 3. **Amazon Polly** (Trả phí)
- ✅ Chất lượng rất cao
- ✅ Giọng AI tự nhiên
- ❌ Có phí

### 4. **Bing Speech API** (Trả phí)
- ✅ Tích hợp tốt với Microsoft
- ❌ Có phí

## 🔧 Cách tùy chỉnh phát âm

### Thay đổi giọng đọc
```javascript
// Trong script.js, hàm initializeSpeech()
this.currentVoice = voices.find(voice => 
    voice.lang.startsWith('en-US') &&  // Giọng Mỹ
    voice.name.includes('Google')      // Ưu tiên Google
);
```

### Thay đổi tốc độ và cao độ
```javascript
// Trong hàm pronounceWord()
utterance.rate = 0.8;    // Tốc độ (0.1 - 10)
utterance.pitch = 1;     // Cao độ (0 - 2)
utterance.volume = 0.9;  // Âm lượng (0 - 1)
```

### Thêm từ điển phiên âm
```javascript
// Trong hàm getPhonetic(), thêm từ mới
const phoneticMap = {
    'hello': '/həˈloʊ/',
    'world': '/wɜːrld/',
    'your_word': '/phonetic_here/'
};
```

## 📱 Tương thích thiết bị

### Desktop
- ✅ Windows: Chrome, Edge, Firefox
- ✅ macOS: Chrome, Safari, Firefox
- ✅ Linux: Chrome, Firefox

### Mobile
- ✅ Android: Chrome, Samsung Browser
- ✅ iOS: Safari, Chrome
- ⚠️ Một số trình duyệt mobile có thể yêu cầu tương tác người dùng trước

## 🐛 Xử lý lỗi

### Lỗi thường gặp:
1. **"Speech synthesis not supported"**
   - Trình duyệt không hỗ trợ
   - Cập nhật trình duyệt

2. **Không có giọng đọc**
   - Chờ trình duyệt tải danh sách giọng
   - Kiểm tra kết nối internet

3. **Không phát âm trên mobile**
   - Cần người dùng tương tác trước (tap/click)
   - Thêm user gesture

### Code xử lý lỗi:
```javascript
pronounceWord(word) {
    if (!this.speechSynth || !this.speechSynth.getVoices().length) {
        this.showWarning('Tính năng phát âm không khả dụng');
        return;
    }
    // ... rest of code
}
```

## 🎵 Tích hợp API phát âm cao cấp (Tùy chọn)

### Nếu muốn chất lượng cao hơn, có thể tích hợp:

```javascript
// Ví dụ với ResponsiveVoice
async function pronounceWithAPI(word) {
    try {
        // Sử dụng ResponsiveVoice
        if (window.responsiveVoice) {
            responsiveVoice.speak(word, "UK English Female");
        }
        // Fallback to Web Speech API
        else {
            this.pronounceWord(word);
        }
    } catch (error) {
        console.error('Pronunciation error:', error);
        this.pronounceWord(word); // Fallback
    }
}
```

## 📋 Checklist triển khai

- [x] ✅ Web Speech API cơ bản
- [x] ✅ Nút phát âm trong Flashcard
- [x] ✅ Nút phát âm trong Quiz
- [x] ✅ Nút phát âm trong Browse
- [x] ✅ Nút phát âm trong Practice
- [x] ✅ Hiển thị ký hiệu phiên âm
- [x] ✅ Xử lý lỗi cơ bản
- [x] ✅ Hiệu ứng visual khi phát âm
- [ ] 🔄 Tích hợp API phát âm cao cấp (tùy chọn)
- [ ] 🔄 Từ điển phiên âm đầy đủ (tùy chọn)

## 🌟 Khuyến nghị

1. **Hiện tại**: Web Speech API đã đủ tốt cho hầu hết người dùng
2. **Nâng cao**: Có thể tích hợp ResponsiveVoice cho đa dạng hơn
3. **Chuyên nghiệp**: Google Text-to-Speech nếu có ngân sách

---

**Tính năng phát âm hiện tại đã hoạt động tốt và miễn phí 100%! 🎉**