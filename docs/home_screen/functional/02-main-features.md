# 🎯 Các Chức Năng Chính

> **Phần 2/8** - Tài Liệu Chức Năng | [← Prev: Tổng Quan](./01-overview.md) | [Next: Luồng Sử Dụng →](./03-usage-flows.md) | [Up: Index ↑](../README.md)

---

## 1. Trò Chuyện Với AI

**Mô tả:**
Gửi câu hỏi hoặc yêu cầu đến AI assistant và nhận câu trả lời realtime.

**Cách hoạt động:**
1. Gõ câu hỏi vào ô input
2. Bấm Enter để gửi
3. AI xử lý và trả lời
4. Câu trả lời hiển thị trong conversation area

**Ví dụ sử dụng:**
- "Explain how async/await works in JavaScript"
- "Debug this React error: Cannot read property of undefined"
- "Write a function to sort array in descending order"
- "What is the difference between let and const?"

**Giới hạn:**
- Tối đa 10,000 ký tự mỗi tin nhắn
- Phải có kết nối internet
- Cần cấu hình API key hợp lệ

---

## 2. Xem Lịch Sử Hội Thoại

**Mô tả:**
Xem lại tất cả các cuộc hội thoại trước đó trong phiên làm việc.

**Cách hoạt động:**
- Tất cả tin nhắn được lưu tự động
- Cuộn lên/xuống để xem
- Mỗi tin nhắn có timestamp
- Phân biệt rõ user/assistant/error/system

**Tính năng:**
- Tự động cuộn đến tin nhắn mới nhất
- Virtual scrolling cho hiệu suất tốt
- Hiển thị metadata (token count, model)
- Support markdown trong tin nhắn

---

## 3. Sử Dụng Slash Commands

**Mô tả:**
Thực hiện các lệnh đặc biệt bằng cách gõ `/` theo sau tên lệnh.

**Cách hoạt động:**
1. Gõ `/` trong input box
2. Danh sách gợi ý hiển thị
3. Dùng ↑↓ để chọn lệnh
4. Bấm Enter để thực thi

**Danh sách lệnh:**

| Lệnh | Chức năng | Aliases |
|------|-----------|---------|
| `/help` | Hiển thị trợ giúp | `/h`, `/?` |
| `/clear` | Xóa lịch sử hội thoại | `/cls`, `/reset` |
| `/model` | Đổi AI model | `/m` |
| `/config` | Mở cấu hình | `/settings` |
| `/todos` | Hiển thị danh sách todos | `/todo` |
| `/exit` | Thoát ứng dụng | `/quit`, `/q` |

**Gợi ý thông minh:**
- Filter realtime khi gõ
- Highlight lệnh phù hợp nhất
- Hiển thị description cho mỗi lệnh
- Support aliases (nhiều tên cho cùng lệnh)

---

## 4. Quản Lý Todos

**Mô tả:**
Theo dõi tiến độ công việc với danh sách todos tích hợp.

**Cách hoạt động:**
- Todos hiển thị tự động khi có
- Cập nhật realtime khi status thay đổi
- Hiển thị progress: "X/Y completed"

**Trạng thái todos:**
- **Pending** (○ xám): Chưa bắt đầu
- **In Progress** (▶ vàng): Đang làm
- **Completed** (✓ xanh): Hoàn thành

**Ví dụ:**
```
Tasks: 2/5 completed
 ✓ Setup project structure
 ✓ Install dependencies
 ▶ Writing unit tests
 ○ Add documentation
 ○ Deploy to production
```

---

## 5. Xem Tips Và Gợi Ý

**Mô tả:**
Nhận tips hữu ích khi không có việc gì đang xử lý.

**Khi nào hiển thị:**
- Không đang loading
- Không có todos
- Ở trạng thái idle

**Ví dụ tips:**
- 💡 "Type / for slash commands"
- 💡 "Arrow Up/Down to navigate input history"
- 💡 "Use backticks \` for inline code"
- 💡 "Be specific in your prompts for best results"

---

## 6. Input History Navigation

**Mô tả:**
Truy cập lại các câu hỏi đã gửi trước đó.

**Cách sử dụng:**
- Bấm `↑` (Arrow Up): Xem câu hỏi trước
- Bấm `↓` (Arrow Down): Xem câu hỏi sau
- Lưu tối đa 50 câu gần nhất
- Tự động load khi navigate

**Use case:**
- Gửi lại câu hỏi tương tự
- Chỉnh sửa câu hỏi cũ
- Tham khảo câu hỏi đã hỏi

---

## 7. Keyboard Shortcuts

**Mô tả:**
Làm việc nhanh hơn với phím tắt.

**Global Shortcuts:**
- `?` - Bật/tắt help overlay
- `Ctrl+C` - Thoát ứng dụng
- `Esc` - Xóa input / Đóng overlay

**Trong Input Box:**
- `Enter` - Gửi tin nhắn
- `↑` / `↓` - Navigate history
- `Backspace` - Xóa ký tự

**Khi có Suggestions:**
- `↑` / `↓` - Chọn suggestion
- `Enter` / `Tab` - Áp dụng suggestion
- `Esc` - Hủy suggestions

---

## 🔗 Navigation

[← Prev: Tổng Quan](./01-overview.md) | [Next: Luồng Sử Dụng →](./03-usage-flows.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 2/8
