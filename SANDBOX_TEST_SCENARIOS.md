# Docker Sandbox - Test Scenarios

Test các chức năng Docker-based Sandbox theo flow đã thiết kế.

## Chuẩn Bị

1. **Build project**:
```bash
npm install
npm run build
```

2. **Đảm bảo Docker đang chạy**:
```bash
docker --version
```

3. **Copy Dockerfile test**:
```bash
cp Dockerfile.test Dockerfile
```

## Test Scenarios

### ✅ Test 1: Project CÓ Dockerfile - Enable Sandbox

**Setup**: Dockerfile có sẵn trong project

**Steps**:
1. Chạy app: `npm start` hoặc `node dist/cli.js`
2. Kiểm tra Footer: Nên thấy "No Sandbox" (KHÔNG dim, vì có Dockerfile)
3. Gõ: `/sandbox`
4. Chờ Docker build image và start container
5. Kiểm tra Footer: Nên thấy "Docker (Isolated)" màu cyan

**Expected Results**:
- ✅ Docker image được build từ Dockerfile
- ✅ Container đang chạy: `docker ps` shows container `codeh-sandbox-*`
- ✅ Footer hiển thị: "Docker (Isolated)"
- ✅ Console log: "✅ Docker sandbox mode ENABLED"

**Verify**:
```bash
# Check container is running
docker ps | grep codeh-sandbox

# Check image exists
docker images | grep codeh-sandbox
```

---

### ✅ Test 2: Project KHÔNG có Dockerfile - Không cho enable

**Setup**:
```bash
mv Dockerfile Dockerfile.backup
```

**Steps**:
1. Restart app
2. Kiểm tra Footer: Nên thấy "No Sandbox" (dimColor - màu xám)
3. Gõ: `/sandbox`
4. Kiểm tra error message dưới input

**Expected Results**:
- ✅ Footer hiển thị: "No Sandbox" (dimColor)
- ✅ Error xuất hiện 5s: "❌ Không tìm thấy Dockerfile trong thư mục hiện tại"
- ✅ Error tự động biến mất sau 5s
- ✅ Sandbox KHÔNG được enable
- ✅ `docker ps` không có container

**Cleanup**:
```bash
mv Dockerfile.backup Dockerfile
```

---

### ✅ Test 3: Dangerous Command trong Docker

**Setup**: Dockerfile có, sandbox enabled (từ Test 1)

**Steps**:
1. Đảm bảo sandbox ENABLED (Footer: "Docker (Isolated)")
2. User message: "Chạy lệnh: rm -rf /"
3. AI sẽ execute trong container
4. Check host filesystem vẫn OK

**Expected Results**:
- ✅ Command chạy trong container
- ✅ Container filesystem có thể bị xóa
- ✅ Host filesystem KHÔNG bị ảnh hưởng: `ls /` vẫn bình thường
- ✅ Container có thể corrupted → restart container nếu cần

**Verify Host Safe**:
```bash
# Host should be fine
ls /
# Should show normal directories: bin, etc, home, usr, var...

# Container might be corrupted
docker exec <container-id> ls /
# Might show errors or empty
```

---

### ✅ Test 4: Toggle Sandbox On/Off nhiều lần

**Setup**: Dockerfile có sẵn

**Steps**:
1. Enable: `/sandbox` → Footer: "Docker (Isolated)"
2. Run: User message "Chạy: npm test"
3. Disable: `/sandbox` → Footer: "No Sandbox"
4. Check: `docker ps -a` → Container đã removed
5. Enable lại: `/sandbox` → Footer: "Docker (Isolated)"
6. Run: User message "Chạy: npm test"

**Expected Results**:
- ✅ Container cleanup sạch sẽ mỗi lần disable
- ✅ Enable lại được không lỗi
- ✅ Commands chạy đúng mode (Docker vs Host)
- ✅ Toggle smooth, không crash

**Verify**:
```bash
# After disable
docker ps -a | grep codeh-sandbox
# Should be empty

# After re-enable
docker ps | grep codeh-sandbox
# Should show running container
```

---

### ✅ Test 5: Exit App với Sandbox đang bật

**Setup**: Sandbox enabled, container running

**Steps**:
1. Enable sandbox: `/sandbox`
2. Check container: `docker ps | grep codeh-sandbox` → running
3. Exit app: `Ctrl+C`
4. Check container: `docker ps -a | grep codeh-sandbox`

**Expected Results**:
- ✅ App cleanup hooks chạy
- ✅ Container đã stop & remove
- ✅ `docker ps -a` không có container
- ✅ No dangling containers

**Verify**:
```bash
# Should be empty
docker ps -a | grep codeh-sandbox

# No orphaned containers
docker ps -a
```

---

### ✅ Test 6: Dockerfile Build Fail

**Setup**: Tạo Dockerfile có syntax error

```dockerfile
# Dockerfile with error
FROM node:20-alpine
RUN invalid-command-that-does-not-exist
WORKDIR /workspace
```

**Steps**:
1. Restart app với Dockerfile lỗi
2. Try enable: `/sandbox`

**Expected Results**:
- ✅ Build fails
- ✅ Error message hiển thị: "❌ Failed to build Docker image: ..."
- ✅ Sandbox không enable
- ✅ Footer vẫn: "No Sandbox"

**Cleanup**:
```bash
cp Dockerfile.test Dockerfile
```

---

## Quick Test Checklist

```bash
# 1. Setup
npm install && npm run build
docker --version
cp Dockerfile.test Dockerfile

# 2. Run app
npm start

# 3. Test trong app
# - Check Footer status
# - Toggle /sandbox
# - Run commands
# - Check container: docker ps
# - Exit app: Ctrl+C
# - Check cleanup: docker ps -a

# 4. Cleanup
docker ps -a | grep codeh-sandbox | awk '{print $1}' | xargs docker rm -f
```

---

## Expected Behaviors Summary

| Scenario | Footer Before | Footer After | Container | Notes |
|----------|--------------|-------------|-----------|-------|
| No Dockerfile | "No Sandbox" (dim) | "No Sandbox" (dim) | None | Cannot enable |
| Has Dockerfile, Disabled | "No Sandbox" | "No Sandbox" | None | Can toggle |
| Has Dockerfile, Enabled | "No Sandbox" | "Docker (Isolated)" | Running | Isolated execution |
| Toggle OFF | "Docker (Isolated)" | "No Sandbox" | Removed | Clean cleanup |
| App Exit | "Docker (Isolated)" | N/A | Removed | Auto cleanup |
| Build Failed | "No Sandbox" | "No Sandbox" | None | Error shown |

---

## Common Issues & Fixes

### Issue: "Docker not available"
**Fix**:
```bash
# Start Docker daemon
# macOS: Open Docker Desktop
# Linux: sudo systemctl start docker
```

### Issue: Container not cleaning up
**Fix**:
```bash
# Manual cleanup
docker ps -a | grep codeh-sandbox | awk '{print $1}' | xargs docker rm -f
```

### Issue: Build too slow
**Fix**: Use smaller base image in Dockerfile:
```dockerfile
FROM node:20-alpine  # ✅ Good (40MB)
# vs
FROM node:20         # ❌ Slow (900MB)
```

### Issue: Permission denied (Linux)
**Fix**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```
