# Fix: .env File Loading Issue

## 🎯 Vấn Đề Bạn Gặp

**Triệu chứng:**
- `export CODEH_LOGGING=true` → ✅ Hoạt động
- Thêm `CODEH_LOGGING=true` vào file `.env` → ❌ KHÔNG hoạt động

**Nguyên nhân:**
```typescript
// Code cũ
dotenv.config();  // Chỉ tìm .env ở current working directory
```

Khi bạn chạy `codeh` từ thư mục `/home/user/my-project/`:
- Dotenv tìm: `/home/user/my-project/.env` ❌
- Không tìm: `/path/to/codeh-cli/.env` (nơi bạn tạo file)

---

## ✅ Giải Pháp Đã Áp Dụng

### **Load .env từ nhiều vị trí (Priority order)**

```typescript
// Code mới trong cli.tsx
// 1. Package root (cho development)
if (existsSync(packageEnvPath)) {
    dotenv.config({path: packageEnvPath});
}

// 2. ~/.codeh/.env (KHUYẾN NGHỊ cho user)
if (existsSync(homeConfigPath)) {
    dotenv.config({path: homeConfigPath, override: false});
}

// 3. Current directory (legacy support)
dotenv.config({override: false});
```

---

## 🚀 Cách Sử Dụng Cho User

### **Cách 1: Tạo ~/.codeh/.env (KHUYẾN NGHỊ)**

```bash
# Chạy lệnh này 1 lần duy nhất:
mkdir -p ~/.codeh
echo "CODEH_LOGGING=true" > ~/.codeh/.env

# Verify
cat ~/.codeh/.env
```

**Ưu điểm:**
- ✅ Dễ tiếp cận: `vim ~/.codeh/.env`
- ✅ Không mất khi update/reinstall codeh
- ✅ Hoạt động từ mọi thư mục
- ✅ Có thể lưu cả API keys, config khác

---

### **Cách 2: Export Environment Variable**

```bash
# Thêm vào ~/.bashrc hoặc ~/.zshrc
echo 'export CODEH_LOGGING=true' >> ~/.bashrc

# Reload shell
source ~/.bashrc
```

**Ưu điểm:**
- ✅ Đơn giản nhất
- ✅ Hoạt động ngay lập tức
- ✅ Không cần file .env

**Nhược điểm:**
- ⚠️ Cần thiết lập lại khi đổi shell

---

### **Cách 3: .env trong package (CHỈ cho development)**

```bash
# Tạo .env trong thư mục codeh-cli
cd /path/to/codeh-cli
echo "CODEH_LOGGING=true" > .env
```

**Ưu điểm:**
- ✅ Tốt cho development

**Nhược điểm:**
- ❌ Khó tìm, khó edit
- ❌ Mất khi reinstall
- ❌ Không nên dùng cho end users

---

## 🧪 Test & Debug

### **1. Test .env loading**
```bash
npx tsx scripts/test-env-loading.ts
```

Output mẫu:
```
✅ Found 1 CODEH_* variables:
  CODEH_LOGGING = "true"

Logging enabled: ✅ YES
```

---

### **2. Debug .env issues**
```bash
npx tsx scripts/debug-env.ts
```

Script này sẽ:
- ✅ Kiểm tra file .env có tồn tại không
- ✅ Hiển thị raw content
- ✅ Phát hiện lỗi (quotes, spaces, tabs)
- ✅ Verify dotenv load thành công
- ✅ Kiểm tra từng ký tự của CODEH_LOGGING

Output mẫu:
```
1️⃣  Current Directory: /home/user/codeh-cli
2️⃣  .env File Check: ✅ File exists
3️⃣  Raw File Content:
---START---
CODEH_LOGGING=true
---END---

4️⃣  File Analysis:
   Line 1: "CODEH_LOGGING=true"
   Value: "true"
   ✅ No obvious issues found

6️⃣  Environment Variables:
   CODEH_LOGGING = "true"
   Logging enabled: ✅ YES
```

---

## 📝 Files Thay Đổi

### **1. source/cli.tsx**
- Load .env từ 3 locations (priority order)
- Hỗ trợ ~/.codeh/.env cho user config

### **2. scripts/test-env-loading.ts** (MỚI)
- Test dotenv loading
- Verify CODEH_* variables

### **3. scripts/debug-env.ts** (MỚI)
- Debug tool cho .env issues
- Phát hiện lỗi format, encoding
- Hiển thị character codes

---

## 🎉 Kết Quả

### **Trước đây:**
```bash
cd ~/my-project
codeh  # ❌ Không đọc được .env ở /path/to/codeh-cli/.env
```

### **Bây giờ:**
```bash
# Setup 1 lần
mkdir -p ~/.codeh
echo "CODEH_LOGGING=true" > ~/.codeh/.env

# Sử dụng từ mọi nơi
cd ~/my-project
codeh  # ✅ Hoạt động!

cd ~/another-project
codeh  # ✅ Hoạt động!
```

---

## 🔧 Troubleshooting

### **Logging vẫn không hoạt động?**

1. **Chạy debug script:**
   ```bash
   npx tsx scripts/debug-env.ts
   ```

2. **Kiểm tra file .env:**
   ```bash
   cat ~/.codeh/.env
   # Đảm bảo có dòng: CODEH_LOGGING=true
   # KHÔNG có quotes: CODEH_LOGGING="true" ❌
   ```

3. **Verify environment variable:**
   ```bash
   echo $CODEH_LOGGING
   # Nếu empty → .env không được load
   ```

4. **Test logging script:**
   ```bash
   CODEH_LOGGING=true npx tsx scripts/test-logging.ts
   # Nếu hoạt động → Vấn đề ở .env loading
   ```

5. **Kiểm tra logs directory:**
   ```bash
   ls -la ~/.codeh/logs/
   # Nếu empty hoặc không tồn tại → Logging không được bật
   ```

---

## 📚 Related Files

- `LOGGING_FIX_SUMMARY.md` - Logging system improvements
- `scripts/test-logging.ts` - Test logging functionality
- `scripts/test-env-loading.ts` - Test .env loading
- `scripts/debug-env.ts` - Debug .env issues

---

## 💡 Khuyến Nghị

**Cho End Users:**
```bash
# Cách tốt nhất:
mkdir -p ~/.codeh
echo "CODEH_LOGGING=true" > ~/.codeh/.env
```

**Cho Developers:**
```bash
# Khi develop codeh-cli:
cd /path/to/codeh-cli
echo "CODEH_LOGGING=true" > .env
npm run dev
```

**Cho CI/CD:**
```bash
# Dùng environment variables
export CODEH_LOGGING=true
export CODEH_PROVIDER=anthropic
# ...etc
```

---

**Ngày sửa:** 2025-11-15
**Branch:** `claude/exam-completion-01SoRM7vCEhvTGJ99PXeSq3i`
**Commits:**
- `704e75e` - Simplify logging configuration
- `98ce2ed` - Support multiple .env file locations
