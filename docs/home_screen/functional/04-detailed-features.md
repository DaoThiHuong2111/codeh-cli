# 💡 Tính Năng Chi Tiết

> **Phần 4/8** - Tài Liệu Chức Năng | [← Prev: Luồng Sử Dụng](./03-usage-flows.md) | [Next: Hướng Dẫn →](./05-user-guide.md) | [Up: Index ↑](../README.md)

---

## Character Counter

**Mục đích:**
Giúp bạn biết đã gõ bao nhiêu ký tự, tránh vượt quá giới hạn.

**Hoạt động:**

- Chỉ hiện khi text > 100 ký tự
- Format: (125/10,000 characters)
- Màu vàng khi > 8,000 ký tự (80% max)
- Màu đỏ khi đạt giới hạn

**Giới hạn:**

- Tối đa: 10,000 ký tự
- Nếu vượt quá: "Message too long (max 10,000 characters)"

---

## Loading Indicator

**Mục đích:**
Cho biết AI đang xử lý câu hỏi của bạn.

**Biểu hiện:**

- Icon spinner animation: ● → ◐ → ◓ → ◑
- Text: "Thinking..."
- Input box bị disable
- Không thể gửi tin nhắn mới

**Khi nào hiện:**

- Sau khi bấm Enter
- Cho đến khi nhận được response
- Hoặc cho đến khi có lỗi

---

## Error Display

**Mục đích:**
Thông báo lỗi một cách rõ ràng, dễ hiểu.

**2 loại hiển thị:**

**1. Input Error (Dưới input box):**

```
┌─────────────────────────────────────┐
│ ⚠ Message too long (max 10,000...) │ ← Màu đỏ
├─────────────────────────────────────┤
│ > Your text_                        │
└─────────────────────────────────────┘
```

**2. Conversation Error (Trong chat):**

```
✗ Error: API not configured. Please configure your API key...
```

**Tự động xóa lỗi:**

- Khi bắt đầu gõ mới
- Lỗi input: clear ngay lập tức
- Lỗi conversation: lưu trong lịch sử

---

## Suggestion Filtering

**Mục đích:**
Tìm lệnh nhanh hơn với smart filtering.

**Cách hoạt động:**

Gõ `/` → Hiện tất cả:

```
/help
/clear
/model
/config
/todos
/exit
```

Gõ `/he` → Filter còn:

```
/help
```

Gõ `/c` → Filter còn:

```
/clear
/config
```

**Tính năng:**

- Case-insensitive (không phân biệt hoa/thường)
- Match từ đầu command
- Highlight text đã match
- Update realtime khi gõ

---

## Virtual Scrolling

**Mục đích:**
Giữ hiệu suất tốt khi có nhiều tin nhắn.

**Khi nào kích hoạt:**

- Khi có > 40 tin nhắn
- Tự động bật virtual scrolling
- Chỉ render tin nhắn visible
- Render ±20 tin nhắn xung quanh scroll position

**Lợi ích:**

- Mượt mà với 1000+ tin nhắn
- Ít tốn RAM
- Load nhanh hơn

---

## Markdown Support

**Mục đích:**
Hiển thị code và formatting đẹp hơn.

**Hỗ trợ:**

- **Bold**: `**text**`
- **Italic**: `*text*`
- **Code inline**: `` `code` ``
- **Code block**:
  ````
  ```language
  code here
  ```
  ````
- **Lists**: `- item` hoặc `1. item`
- **Links**: `[text](url)`

**Ví dụ response:**

````
< Assistant:
Here's how to use map():

1. Basic syntax:
   `array.map(item => item * 2)`

2. Full example:
   ```javascript
   const numbers = [1, 2, 3];
   const doubled = numbers.map(n => n * 2);
   console.log(doubled); // [2, 4, 6]
````

```

---

## 🔗 Navigation

[← Prev: Luồng Sử Dụng](./03-usage-flows.md) | [Next: Hướng Dẫn →](./05-user-guide.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 4/8
```
