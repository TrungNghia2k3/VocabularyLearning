# Ứng Dụng Học Từ Vựng Tiếng Anh

Một ứng dụng web đơn giản để học từ vựng tiếng Anh với nhiều chế độ học khác nhau.

## Tính năng

### 📊 Thống kê học tập
- Theo dõi tổng số từ vựng
- Đếm số từ đã học
- Điểm cao nhất trong quiz
- Tiến độ học tập tổng thể

### 🎴 Chế độ Flashcard
- Lật thẻ để xem nghĩa của từ
- Điều hướng qua lại giữa các từ
- Đánh dấu từ đã biết/chưa biết
- Hiệu ứng lật thẻ 3D

### 🧠 Chế độ Quiz
- Câu hỏi trắc nghiệm 4 đáp án
- Theo dõi điểm số theo thời gian thực
- Hiển thị kết quả chi tiết
- Lưu điểm cao nhất

### 📚 Duyệt từ vựng
- Xem toàn bộ danh sách từ vựng
- Tìm kiếm từ theo từ khóa
- Đánh dấu trạng thái học của từng từ
- Hiển thị loại từ và ví dụ

### ✏️ Luyện tập viết
- Luyện tập viết từ dựa trên nghĩa
- Kiểm tra chính tả tự động
- Phản hồi ngay lập tức
- Theo dõi tiến độ

## Cấu trúc file

```
VocabularyLearning/
├── index.html          # File HTML chính
├── styles.css          # CSS tùy chỉnh
├── script.js           # JavaScript logic
├── vocabulary.json     # Dữ liệu từ vựng
└── README.md          # Hướng dẫn sử dụng
```

## Cách sử dụng

### 1. Cài đặt
1. Tải về tất cả các file
2. Đặt chúng trong cùng một thư mục
3. Mở `index.html` bằng trình duyệt web

### 2. Thêm từ vựng
Chỉnh sửa file `vocabulary.json` theo cấu trúc:

```json
{
  "words": [
    {
      "word": "từ tiếng anh",
      "meaning": "nghĩa tiếng việt",
      "type": "loại từ (noun, verb, adjective, etc.)",
      "example": "ví dụ sử dụng từ",
      "level": "mức độ (basic, intermediate, advanced)"
    }
  ]
}
```

### 3. Chạy ứng dụng

#### Cách 1: Mở trực tiếp
- Double-click vào file `index.html`

#### Cách 2: Sử dụng web server (khuyến nghị)
```bash
# Với Python 3
python -m http.server 8000

# Với Python 2
python -m SimpleHTTPServer 8000

# Với Node.js (cần cài đặt http-server)
npx http-server

# Với PHP
php -S localhost:8000
```

Sau đó mở trình duyệt và truy cập `http://localhost:8000`

## Công nghệ sử dụng

- **HTML5**: Cấu trúc trang web
- **CSS3**: Styling và animations
- **JavaScript ES6+**: Logic ứng dụng
- **Bootstrap 5**: Framework CSS responsive
- **Font Awesome**: Icons
- **Local Storage**: Lưu trữ tiến độ

## Tính năng nổi bật

### 🎨 Giao diện
- Responsive design cho mọi thiết bị
- Animations mượt mà
- Theme hiện đại với Bootstrap 5
- Icons đẹp mắt từ Font Awesome

### 💾 Lưu trữ dữ liệu
- Tự động lưu tiến độ học tập
- Lưu điểm cao nhất
- Dữ liệu được lưu trong Local Storage

### 🔧 Tùy chỉnh
- Dễ dàng thêm/sửa từ vựng
- Có thể mở rộng thêm tính năng
- Code được tổ chức rõ ràng

## Hướng dẫn tùy chỉnh

### Thêm từ vựng mới
1. Mở file `vocabulary.json`
2. Thêm object mới vào mảng "words"
3. Reload trang web

### Thay đổi giao diện
1. Chỉnh sửa file `styles.css`
2. Hoặc thay đổi Bootstrap theme

### Mở rộng tính năng
1. Chỉnh sửa file `script.js`
2. Thêm HTML tương ứng trong `index.html`

## Yêu cầu hệ thống

- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)
- Kết nối internet (để tải Bootstrap và Font Awesome)
- Không cần cài đặt thêm phần mềm

## Lưu ý

- File `vocabulary.json` phải được serve qua HTTP(S) để tránh CORS errors
- Dữ liệu học tập được lưu trong Local Storage của trình duyệt
- Backup file `vocabulary.json` trước khi chỉnh sửa

## Liên hệ & Đóng góp

Nếu bạn có ý tưởng cải thiện hoặc tìm thấy lỗi, hãy tạo issue hoặc pull request.

## License

MIT License - Sử dụng tự do cho mọi mục đích.

---

**Chúc bạn học tiếng Anh hiệu quả! 🎓📚**