# Logging System - Bản Sửa Lỗi & Đơn Giản Hóa

## 🎯 Vấn Đề Đã Khắc Phục

### 1. ❌ Case-sensitive check (Vấn đề chính)
**Trước đây**: Chỉ chấp nhận `CODEH_LOGGING=TRUE` (chữ HOA)
**Bây giờ**: Chấp nhận tất cả: `true`, `TRUE`, `1`, `yes` (case-insensitive)

### 2. ❌ CODEH_LOG_LEVEL phức tạp và không cần thiết
**Trước đây**: Cần cấu hình cả `CODEH_LOGGING` và `CODEH_LOG_LEVEL`
**Bây giờ**: Chỉ cần `CODEH_LOGGING=true` - đơn giản, rõ ràng!

### 3. ❌ Khó debug khi logging không hoạt động
**Trước đây**: Không có cách test nhanh
**Bây giờ**: Có script test: `CODEH_LOGGING=true npx tsx scripts/test-logging.ts`

## ✅ Cách Sử Dụng Mới (Đơn Giản Hơn)

### Option 1: Thêm vào file .env (Khuyến nghị)

```bash
# Tạo file .env nếu chưa có
cp .env.example .env

# Thêm dòng này vào .env
echo "CODEH_LOGGING=true" >> .env
```

### Option 2: Export environment variable

```bash
export CODEH_LOGGING=true
codeh
```

### Option 3: Inline với command

```bash
CODEH_LOGGING=true codeh
```

## 🧪 Test Logging System

Chạy script test để verify logging hoạt động:

```bash
CODEH_LOGGING=true npx tsx scripts/test-logging.ts
```

Output mẫu:
```
=== Testing Logging System ===

CODEH_LOGGING = "true"
Request ID: req_abc123xyz

Writing test logs...
Flushing logs...

Log directory: /root/.codeh/logs

Found 1 log file(s):
  - logs_session_20251115_093205.json (1365 bytes)

✅ Found 6 log entries from this test run
✅ Logging system is working!
📁 View all logs in: /root/.codeh/logs
```

## 📁 Vị Trí Log Files

```bash
# Xem tất cả log files
ls -la ~/.codeh/logs/

# Xem log mới nhất
tail -f ~/.codeh/logs/logs_session_*.json | tail -1

# Parse logs với jq
cat ~/.codeh/logs/logs_session_*.json | jq '.'
```

## 🔧 Các Thay Đổi Code

### 1. Logger.ts - Đơn giản hóa check
```typescript
// Trước
this.enabled = process.env.CODEH_LOGGING === 'TRUE';
const envLevel = process.env.CODEH_LOG_LEVEL || 'DEBUG';
this.level = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.DEBUG;

// Sau
const loggingEnv = process.env.CODEH_LOGGING?.toLowerCase();
this.enabled = loggingEnv === 'true' || loggingEnv === '1' || loggingEnv === 'yes';
this.level = LogLevel.DEBUG; // Luôn log tất cả khi enabled
```

### 2. Thêm helper function
```typescript
function isLoggingEnabled(): boolean {
	const loggingEnv = process.env.CODEH_LOGGING?.toLowerCase();
	return loggingEnv === 'true' || loggingEnv === '1' || loggingEnv === 'yes';
}
```

### 3. Cập nhật .env.example
```bash
# === LOGGING (Optional - for debugging) ===
# Enable logging to ~/.codeh/logs/ directory
# Accepts: true, TRUE, 1, yes (case-insensitive)
# CODEH_LOGGING=true
```

## 📚 Documentation Updates

- ✅ `docs/LOGGING.md` - Cập nhật hướng dẫn sử dụng
- ✅ `LOGGING_GUIDE.md` - Cập nhật setup instructions
- ✅ `.env.example` - Thêm hướng dẫn logging
- ✅ `scripts/test-logging.ts` - Script test mới

## 🎉 Kết Quả

1. **Đơn giản hơn**: Chỉ cần 1 biến `CODEH_LOGGING`
2. **Linh hoạt hơn**: Chấp nhận nhiều format (`true`, `1`, `yes`)
3. **Dễ debug hơn**: Có script test logging
4. **Dễ hiểu hơn**: Documentation rõ ràng hơn

## ⚠️ Breaking Changes

**KHÔNG CÓ** - Vẫn backward compatible:
- `CODEH_LOGGING=TRUE` vẫn hoạt động như cũ
- `CODEH_LOG_LEVEL` bị bỏ qua (không gây lỗi)
- Tất cả logs được ghi với DEBUG level khi enabled

## 🚀 Next Steps

1. Tạo file `.env` từ `.env.example`
2. Thêm `CODEH_LOGGING=true` vào `.env`
3. Run test: `CODEH_LOGGING=true npx tsx scripts/test-logging.ts`
4. Chạy app và check logs tại `~/.codeh/logs/`

---

**Ngày sửa**: 2025-11-15
**Files thay đổi**:
- `source/infrastructure/logging/Logger.ts`
- `docs/LOGGING.md`
- `LOGGING_GUIDE.md`
- `.env.example`
- `scripts/test-logging.ts` (mới)
