# ❓ Câu Hỏi Thường Gặp

> **Phần 7/8** - Tài Liệu Chức Năng | [← Prev: Xử Lý Lỗi](./06-error-handling.md) | [Next: Best Practices →](./08-best-practices.md) | [Up: Index ↑](../README.md)

---

## Q1: Làm sao để xóa lịch sử hội thoại?

**A:** Có 2 cách:
1. Gõ `/clear` và Enter
2. Restart ứng dụng

Lưu ý: Lịch sử chỉ lưu trong phiên hiện tại, chưa persist vào file.

---

## Q2: Tôi có thể xem lại câu hỏi cũ không?

**A:** Có! Dùng `↑` và `↓`:
- `↑` (Arrow Up): Xem câu trước
- `↓` (Arrow Down): Xem câu sau
- Lưu tối đa 50 câu gần nhất
- Tự động load vào input

---

## Q3: Slash commands là gì?

**A:** Là các lệnh đặc biệt bắt đầu bằng `/`:
- `/help` - Xem trợ giúp
- `/clear` - Xóa lịch sử
- `/model` - Đổi AI model
- `/config` - Cấu hình
- `/todos` - Xem todos
- `/exit` - Thoát

Gõ `/` để xem full list với autocomplete.

---

## Q4: Tại sao todos không hiển thị?

**A:** Todos chỉ hiện khi:
- Có tasks trong danh sách
- Không đang loading

Nếu không thấy = không có todos. AI sẽ tự tạo todos khi làm việc.

---

## Q5: Làm sao biết AI đang xử lý?

**A:** Nhìn vào:
1. Loading indicator: "⏳ Thinking..."
2. Input box bị disable (không gõ được)
3. Spinner animation

Đợi cho đến khi response hiện.

---

## Q6: Tôi có thể gửi code không?

**A:** Có! Paste code vào input:
```javascript
function hello() {
  console.log("Hello World");
}
```

Hoặc dùng backticks:
```
How to fix this code:
`const x = [1,2,3]; x.map(n => n*2)`
```

AI sẽ hiểu và format đẹp trong response.

---

## Q7: Giới hạn độ dài tin nhắn?

**A:** 10,000 ký tự mỗi message.

Character counter hiện khi > 100 ký tự:
- Bình thường: Màu trắng
- Cảnh báo (>8000): Màu vàng
- Error (=10000): Màu đỏ + không gửi được

---

## Q8: Có thể dùng offline không?

**A:** Hiện tại KHÔNG.

Cần:
- Internet connection
- API key hợp lệ
- API server hoạt động

Future: Sẽ có offline mode với local models.

---

## Q9: Tips hiển thị khi nào?

**A:** Khi IDLE:
- Không đang loading
- Không có todos
- Random tips từ predefined list

Mục đích: Giúp bạn học cách dùng app tốt hơn.

---

## Q10: Làm sao thay đổi AI model?

**A:**
1. Gõ `/model` và Enter
2. Hoặc gõ `/config` để vào settings
3. Chọn model mới
4. Apply changes

Có thể chọn:
- Claude models (Anthropic)
- GPT models (OpenAI)
- Ollama (local)
- Generic API

---

## 🔗 Navigation

[← Prev: Xử Lý Lỗi](./06-error-handling.md) | [Next: Best Practices →](./08-best-practices.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 7/8
