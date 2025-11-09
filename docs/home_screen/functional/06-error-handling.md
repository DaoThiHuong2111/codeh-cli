# 🚨 Xử Lý Lỗi

> **Phần 6/8** - Tài Liệu Chức Năng | [← Prev: Hướng Dẫn](./05-user-guide.md) | [Next: FAQ →](./07-faq.md) | [Up: Index ↑](../README.md)

---

## Lỗi Thường Gặp

### 1. "Please enter a message"

**Nguyên nhân:**

- Bấm Enter khi input trống
- Hoặc chỉ có whitespace

**Cách fix:**

- Gõ text trước khi bấm Enter
- Phải có ít nhất 1 ký tự

---

### 2. "Message too long (max 10,000 characters)"

**Nguyên nhân:**

- Tin nhắn > 10,000 ký tự

**Cách fix:**

- Chia nhỏ câu hỏi
- Gửi thành nhiều messages
- Hoặc rút gọn nội dung

---

### 3. "API not configured"

**Nguyên nhân:**

- Chưa setup API key
- Hoặc API key không hợp lệ

**Cách fix:**

1. Chạy `/config` để cấu hình
2. Hoặc set environment variables:
   ```bash
   export CODEH_PROVIDER="anthropic"
   export CODEH_API_KEY="your-key-here"
   export CODEH_MODEL="claude-3-5-sonnet-20241022"
   ```
3. Restart ứng dụng

---

### 4. "Network Error" / "Connection Failed"

**Nguyên nhân:**

- Mất kết nối internet
- Firewall block
- API server down

**Cách fix:**

1. Kiểm tra internet connection
2. Thử ping api.anthropic.com
3. Check firewall settings
4. Đợi server recovery nếu down

---

### 5. "401 Unauthorized"

**Nguyên nhân:**

- API key sai
- API key hết hạn
- API key bị revoke

**Cách fix:**

1. Verify API key
2. Tạo API key mới
3. Update config
4. Restart

---

### 6. "429 Rate Limit Exceeded"

**Nguyên nhân:**

- Gửi quá nhiều requests
- Vượt quota plan

**Cách fix:**

1. Đợi một chút (vài phút)
2. Giảm tần suất gửi
3. Upgrade API plan
4. Check usage dashboard

---

## Hành Vi Khi Có Lỗi

**Lỗi validation (input):**

- Hiển thị dưới input box
- Màu đỏ với icon ⚠
- Input vẫn giữ nguyên
- Có thể sửa và gửi lại

**Lỗi API:**

- Thêm error message vào conversation
- Prefix: `✗ Error`
- Màu đỏ
- Lưu trong history
- Input được clear

**Lỗi hệ thống:**

- Console log error details
- Hiển thị generic message
- Không crash app
- Có thể retry

---

## 🔗 Navigation

[← Prev: Hướng Dẫn](./05-user-guide.md) | [Next: FAQ →](./07-faq.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 6/8
