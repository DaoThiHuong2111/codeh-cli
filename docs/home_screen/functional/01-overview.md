# 🏠 Màn Hình Home - Tổng Quan & Giao Diện

> **Phần 1/8** - Tài Liệu Chức Năng | [Next: Các Chức Năng Chính →](./02-main-features.md) | [Up: Index ↑](../README.md)

---

## ⚠️ Trạng Thái Tài Liệu

> **QUAN TRỌNG**: Tài liệu này mô tả **vision đầy đủ** của Home Screen.
>
> - ✅ **Implemented**: Features đã hoạt động (v1.0.0)
> - 🚧 **Planned**: Features trong roadmap (v1.1+)
>
> Xem [CURRENT_STATE.md](../CURRENT_STATE.md) để biết chi tiết features nào đã có.
> Xem [ROADMAP.md](../ROADMAP.md) để biết lộ trình phát triển.

---

## 🎯 Giới Thiệu

### Màn hình Home là gì?

Màn hình **Home** là trung tâm làm việc chính của CODEH CLI - nơi bạn tương tác với AI assistant để:

- Đặt câu hỏi về lập trình
- Nhận trợ giúp debug code
- Học các khái niệm mới
- Tạo và quản lý code snippets
- Theo dõi tiến độ công việc

### Mục đích chính

Màn hình Home giúp bạn:

1. **Giao tiếp tự nhiên** với AI qua giao diện command-line
2. **Xem lịch sử** tất cả các cuộc hội thoại
3. **Quản lý công việc** với danh sách todos tích hợp
4. **Làm việc hiệu quả** với slash commands và keyboard shortcuts

---

## 🖥️ Giao Diện Người Dùng

### Bố Cục Màn Hình (Vision - v1.2+)

> **Lưu ý**: Đây là vision đầy đủ. Xem phần "Current Implementation" bên dưới để biết UI hiện tại.

```
┌─────────────────────────────────────────────────────────┐
│  ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗              │ ← Logo
│ ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║  ██║              │
│ ██║     ██║   ██║██║  ██║█████╗  ███████║              │
│ ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██║              │
│ ╚██████╗╚██████╔╝██████╔╝███████╗██║  ██║              │
│  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝              │
├─────────────────────────────────────────────────────────┤
│ Version: 1.0.0                                          │ ← Thông tin
│ Model: claude-3-5-sonnet-20241022                       │   hệ thống
│ Directory: /home/user/codeh-cli                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ > You: How do I create a React component?              │
│ (10:30 AM)                                              │
│                                                         │
│ < Assistant: Here's how to create a React component:   │ ← Khu vực
│ (10:30 AM)                                              │   hội thoại
│                                                         │
│ 1. Functional Component (Modern approach):             │
│    function MyComponent() {                             │
│      return <div>Hello World</div>;                     │
│    }                                                    │
│                                                         │
│ 2. Class Component (Legacy):                           │
│    class MyComponent extends React.Component {         │
│      render() {                                         │
│        return <div>Hello World</div>;                   │
│      }                                                  │
│    }                                                    │
│                                                         │
│ ⏳ Thinking...                                          │ ← Loading
│                                                         │   indicator
├─────────────────────────────────────────────────────────┤
│ Tasks: 2/5 completed                                    │
│  ✓ Setup React project                                 │
│  ✓ Install dependencies                                │ ← Danh sách
│  ▶ Creating component structure                        │   công việc
│  ○ Add styling                                          │
│  ○ Write tests                                          │
├─────────────────────────────────────────────────────────┤
│ 💡 Tip: Use backticks ` for inline code                │ ← Tips
├─────────────────────────────────────────────────────────┤
│ ─────────────────────────────────────────────────────── │
│ > Your message here_                                    │ ← Ô nhập
│ ─────────────────────────────────────────────────────── │   liệu
│                                  (125/10,000 characters) │
├─────────────────────────────────────────────────────────┤
│ Slash Commands (↑↓ to navigate, Enter to select):      │
│  › /help - Show help documentation                      │ ← Gợi ý
│    /clear - Clear conversation history                  │   lệnh
│    /model - Change AI model                             │
├─────────────────────────────────────────────────────────┤
│ 🤖 claude-3-5-sonnet | 📁 /home/user/project           │ ← Footer
└─────────────────────────────────────────────────────────┘
```

### Các Phần Giao Diện

#### 1. **Header (Phần Đầu)**

- Logo CODEH với gradient màu sắc
- Thông tin phiên bản ứng dụng
- Model AI đang sử dụng
- Thư mục làm việc hiện tại

#### 2. **Conversation Area (Khu Vực Hội Thoại)**

- Hiển thị tất cả tin nhắn trao đổi với AI
- Mỗi tin nhắn có:
  - **Avatar/Badge**: Phân biệt ai đang nói
    - `> You` (màu xanh) - Tin nhắn của bạn
    - `< Assistant` (màu xanh lá) - Câu trả lời AI
    - `✗ Error` (màu đỏ) - Thông báo lỗi
    - `ℹ System` (màu xanh dương) - Thông báo hệ thống
  - **Timestamp**: Giờ gửi tin nhắn
  - **Nội dung**: Text, code, markdown
- Tự động cuộn xuống tin nhắn mới nhất
- Hỗ trợ cuộn lại xem lịch sử

#### 3. **Middle Area (Khu Vực Giữa)**

Hiển thị động dựa trên trạng thái:

**a) Khi đang xử lý:**

- Loading indicator với animation
- Text "Thinking..." hoặc "Processing..."

**b) Khi có công việc:**

- Danh sách todos với progress bar
- Icon trạng thái:
  - `○` (xám) - Chưa bắt đầu
  - `▶` (vàng) - Đang thực hiện
  - `✓` (xanh) - Hoàn thành
- Số lượng: "X/Y completed"

**c) Khi rảnh (idle):**

- Hiển thị tips ngẫu nhiên
- Icon 💡 với lời khuyên hữu ích

#### 4. **Input Area (Ô Nhập Liệu)**

- Prefix `> ` để bắt đầu
- Ô nhập text với cursor nhấp nháy
- Border trang trí trên/dưới
- Character counter khi text > 100 ký tự
- Hiển thị warning khi gần đạt giới hạn
- Placeholder: "Prompt here (Ctrl+C để thoát)..."

#### 5. **Slash Suggestions (Gợi Ý Lệnh)**

Chỉ hiển thị khi:

- Bạn bắt đầu gõ dấu `/`
- Danh sách lệnh được lọc theo input
- Item được chọn có màu nổi bật
- Hướng dẫn navigation: "↑↓ to navigate, Enter to select"

#### 6. **Footer (Phần Cuối)**

Thanh trạng thái hiển thị:

- 🤖 Model đang dùng
- 📁 Thư mục hiện tại
- 🪙 Số token đã dùng (nếu có)
- Git branch (nếu trong Git repo)

#### 7. **Help Overlay (Màn Hình Trợ Giúp)**

Pop-up hiển thị khi bấm `?`:

- Border double-line
- 2 sections:
  - **Keyboard Shortcuts**: Các phím tắt
  - **Slash Commands**: Danh sách lệnh
- Hướng dẫn đóng: "Press ? or Esc to close"

---

## 📱 Current Implementation (v1.0.0)

> Đây là UI **đang hoạt động** hiện tại. Features ở trên là **roadmap**.

### Màn Hình Hiện Tại

```
┌─────────────────────────────────────────────────────────┐
│  ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗              │
│ ██╔════╝██╔═══██╗██╔══██╗██╔════╝██║  ██║              │
│ ██║     ██║   ██║██║  ██║█████╗  ███████║              │
│ ██║     ██║   ██║██║  ██║██╔══╝  ██╔══██║              │
│ ╚██████╗╚██████╔╝██████╔╝███████╗██║  ██║              │
│  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝              │
├─────────────────────────────────────────────────────────┤
│ Version: 1.0.0                                          │
│ Model: claude-3-5-sonnet                                │
│ Directory: /home/user/codeh-cli                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tips for getting started:                              │
│ 1. Ask questions, edit files, or run commands.         │
│ 2. Be specific for the best results.                   │
│ 3. /help for more information.                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ─────────────────────────────────────────────────────── │
│ > Ask me anything...▊                                   │
│ ─────────────────────────────────────────────────────── │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Response hiển thị ở đây sau khi gửi]                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Press Ctrl+C to exit                                    │
└─────────────────────────────────────────────────────────┘
```

### Components Đang Hoạt Động

| Component       | Status     | Mô tả                       |
| --------------- | ---------- | --------------------------- |
| **Logo**        | ✅ Working | ASCII art logo với gradient |
| **InfoSection** | ✅ Working | Version, model, directory   |
| **TipsSection** | ✅ Working | 3 tips tĩnh                 |
| **InputBox**    | ✅ Working | Input với border, cursor    |
| **Output**      | ✅ Working | Plain text response         |

### Features Đã Có

- ✅ Gửi message và nhận response
- ✅ Hiển thị loading state ("Connecting...", "Thinking...")
- ✅ Error handling cơ bản
- ✅ Ctrl+C để thoát
- ✅ Basic input validation

### Features Chưa Có (Trong Roadmap)

- 🚧 Conversation history (v1.1)
- 🚧 Slash commands (v1.1)
- 🚧 Streaming responses (v1.1)
- 🚧 Session save/load (v1.1)
- 🚧 Markdown rendering (v1.2)
- 🚧 Todos display (v1.2)
- 🚧 Help overlay (v1.2)
- 🚧 Keyboard shortcuts (v1.2)

**Xem thêm:**

- [CURRENT_STATE.md](../CURRENT_STATE.md) - Chi tiết implementation hiện tại
- [ROADMAP.md](../ROADMAP.md) - Lộ trình phát triển
- [GEMINI_COMPARISON.md](../GEMINI_COMPARISON.md) - So sánh với Gemini CLI

---

## 🔗 Navigation

[Next: Các Chức Năng Chính →](./02-main-features.md) | [Up: Index ↑](../README.md)

---

**Last Updated**: 2025-01-08 | **Part**: 1/8
