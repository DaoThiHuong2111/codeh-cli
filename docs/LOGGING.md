# Hệ Thống Logging

## Tổng quan

Hệ thống logging được xây dựng để hỗ trợ debug hiệu quả với các tính năng:

- ✅ **Text-only format** - Không emojis/icons, dễ parse
- ✅ **Environment-based** - Chỉ log khi `CODEH_LOGGING=true` (hoặc TRUE, 1, yes)
- ✅ **Session-based** - Mỗi session có file log riêng
- ✅ **Buffered writes** - Performance tốt, flush mỗi 100 entries hoặc 5s
- ✅ **Log rotation** - Tự động xóa logs cũ (giữ 7 files gần nhất)
- ✅ **Correlation ID** - Trace request qua nhiều functions
- ✅ **Safe for Ink** - Không dùng console.log, không ảnh hưởng UI

## Cách sử dụng

### 1. Bật Logging

```bash
# Cách 1: Export environment variable
export CODEH_LOGGING=true    # Chấp nhận: true, TRUE, 1, yes (case-insensitive)

# Cách 2: Thêm vào file .env
echo "CODEH_LOGGING=true" >> .env

# Cách 3: Inline với command
CODEH_LOGGING=true codeh
```

### 2. Import và Sử dụng Logger

```typescript
import {getLogger} from './infrastructure/logging/Logger.js';

const logger = getLogger();

// Log với component và function name
logger.debug('ComponentName', 'functionName', 'Message here', {
  key1: 'value1',
  key2: 123,
});
```

### 3. Pattern cho các loại functions

#### Async Function với API Call

```typescript
async function callAPI(request: Request): Promise<Response> {
  const start = Date.now();

  logger.debug('APIClient', 'callAPI', 'API request starting', {
    endpoint: request.endpoint,
    method: request.method,
  });

  try {
    const response = await makeRequest(request);
    const duration = Date.now() - start;

    logger.info('APIClient', 'callAPI', 'API request completed', {
      duration_ms: duration,
      status: response.status,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('APIClient', 'callAPI', 'API request failed', {
      duration_ms: duration,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

#### Sync Function

```typescript
function processData(input: string): Result {
  logger.debug('DataProcessor', 'processData', 'Processing data', {
    input_length: input.length,
  });

  try {
    const result = transform(input);
    logger.debug('DataProcessor', 'processData', 'Data processed successfully');
    return result;
  } catch (error) {
    logger.error('DataProcessor', 'processData', 'Processing failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
```

#### Sử dụng Helper Functions

```typescript
import {withLogging, withLoggingSync} from './infrastructure/logging/Logger.js';

// Wrap async function
const apiCall = withLogging('APIClient', 'callAPI', async (request) => {
  return await makeRequest(request);
});

// Wrap sync function
const processData = withLoggingSync('DataProcessor', 'processData', (input) => {
  return transform(input);
});
```

### 4. Correlation ID

Request ID tự động được tạo khi app start. Bạn có thể set custom request ID:

```typescript
import {generateRequestId} from './infrastructure/logging/Logger.js';

const logger = getLogger();
const requestId = generateRequestId();
logger.setRequestId(requestId);

// Tất cả logs sau đó sẽ có requestId này
logger.info('Service', 'handleRequest', 'Processing request');
```

### 5. Session-based Logging

Logger tự động tạo file log mới cho mỗi session:

```typescript
// Khi tạo session mới
const session = Session.createNew(model);

// Update logger session ID
logger.setSessionId?.(session.id);
```

## Format Log

Mỗi log entry là một JSON object trên một dòng (JSONL format):

```json
{
  "timestamp": "2025-11-15T08:41:10.511Z",
  "level": "INFO",
  "component": "APIClient",
  "function": "callAPI",
  "requestId": "req_xNbaBtFbEYbT",
  "message": "API request completed",
  "context": {
    "duration_ms": 1234,
    "status": 200
  }
}
```

### Log Levels

- **DEBUG**: Chi tiết execution flow, function entry/exit
- **INFO**: State changes quan trọng, operations thành công
- **WARN**: Issues có thể recover, slow operations (>1000ms)
- **ERROR**: Failures, exceptions

## Vị trí File Logs

- **Path**: `~/.codeh/logs/`
- **Format tên file**:
  - Với session ID: `logs_session_<timestamp>.json`
  - Fallback: `logs_session_YYYYMMDD_HHMMSS.json`
- **Retention**: Giữ 7 files gần nhất, tự động xóa cũ hơn

## Debug với Logs

### Tìm logs cho một request
```bash
grep "req_abc123xyz" ~/.codeh/logs/logs_session_*.json
```

### Tìm errors
```bash
grep '"level":"ERROR"' ~/.codeh/logs/logs_session_*.json
```

### Tìm slow operations (>1000ms)
```bash
grep -E 'duration_ms":[0-9]{4,}' ~/.codeh/logs/logs_session_*.json
```

### Xem logs của session hiện tại
```bash
tail -f ~/.codeh/logs/logs_session_$(ls -t ~/.codeh/logs/ | head -1)
```

### Parse và format logs (với jq)
```bash
cat ~/.codeh/logs/logs_session_*.json | jq '.'
```

## Best Practices

### 1. Luôn log entry/exit cho public functions
```typescript
async function publicFunction(params: Params): Promise<Result> {
  logger.logFunctionEntry('Component', 'publicFunction', params);

  try {
    const result = await doWork(params);
    logger.logFunctionExit('Component', 'publicFunction', Date.now() - start, true);
    return result;
  } catch (error) {
    logger.logFunctionExit('Component', 'publicFunction', Date.now() - start, false);
    throw error;
  }
}
```

### 2. Include duration cho async operations
```typescript
const start = Date.now();
// ... async operation ...
const duration = Date.now() - start;

logger.info('Component', 'operation', 'Completed', { duration_ms: duration });
```

### 3. Log errors với full context
```typescript
catch (error) {
  logger.error('Component', 'function', 'Operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    input_params: params,  // Context relevant to the error
  });
  throw error;
}
```

### 4. Không log sensitive data
```typescript
// ❌ BAD
logger.debug('Auth', 'login', 'User logging in', {
  username: user.username,
  password: user.password,  // NEVER LOG PASSWORDS
});

// ✅ GOOD
logger.debug('Auth', 'login', 'User logging in', {
  username: user.username,
  // No password logged
});
```

### 5. Keep context concise
```typescript
// ❌ BAD - Too much data
logger.debug('Service', 'process', 'Processing', {
  full_object: hugeObject,  // Thousands of keys
});

// ✅ GOOD - Summarize
logger.debug('Service', 'process', 'Processing', {
  object_keys: Object.keys(hugeObject).length,
  first_key: Object.keys(hugeObject)[0],
});
```

### 6. Use appropriate log levels
```typescript
// DEBUG - Detailed flow
logger.debug('Service', 'validate', 'Validating input');

// INFO - Important state changes
logger.info('Service', 'save', 'Session saved successfully');

// WARN - Recoverable issues, slow ops
logger.warn('Service', 'process', 'Slow operation detected', {
  duration_ms: 5000,
});

// ERROR - Failures
logger.error('Service', 'connect', 'Connection failed', {
  error: error.message,
});
```

## Performance Impact

### Khi CODEH_LOGGING=FALSE (default)
- ✅ Zero overhead - NullLogger không làm gì cả
- ✅ No file I/O
- ✅ No performance impact

### Khi CODEH_LOGGING=TRUE
- ✅ Buffered writes (100 entries hoặc 5s)
- ✅ Async flush không block main thread
- ✅ Minimal overhead (<1ms per log call)

## Troubleshooting

### Logs không được tạo?

1. **Kiểm tra env variable**:
   ```bash
   echo $CODEH_LOGGING    # Phải có giá trị: true, TRUE, 1, hoặc yes
   ```

2. **Test logging với script**:
   ```bash
   CODEH_LOGGING=true npx tsx scripts/test-logging.ts
   ```

3. **Kiểm tra file .env**:
   - Đảm bảo có file `.env` trong thư mục project (không phải `.env.example`)
   - Nội dung phải có: `CODEH_LOGGING=true`

4. **Kiểm tra permissions**:
   ```bash
   ls -la ~/.codeh/logs/
   ```

### File logs quá lớn?
1. Log rotation tự động xóa files cũ (>7 days)
2. Manual cleanup: `rm ~/.codeh/logs/logs_session_*.json`

### Logging ảnh hưởng performance?
1. Tắt logging: Xóa hoặc comment dòng `CODEH_LOGGING=true` trong .env
2. Hoặc set: `export CODEH_LOGGING=false`

## Ví dụ thực tế

Xem thêm ví dụ chi tiết trong:
- `source/infrastructure/api/clients/AnthropicSDKAdapter.ts` - API client logging
- `source/cli/presenters/HomePresenter.ts` - Session management logging
- `source/cli.tsx` - Application lifecycle logging

## Tham khảo thêm

- [LOGGING_GUIDE.md](../LOGGING_GUIDE.md) - Hướng dẫn chi tiết implementation
- [Logger.ts](../source/infrastructure/logging/Logger.ts) - Source code
