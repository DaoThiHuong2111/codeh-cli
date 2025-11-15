# Logging Implementation Guide

## Quick Start

### 1. Import Logger
```typescript
import {getLogger} from '../../logging/Logger.js';

const logger = getLogger();
```

### 2. Basic Logging Patterns

#### Async Function with API Call
```typescript
async function apiCall(request: Request): Promise<Response> {
	const start = Date.now();
	const model = request.model || 'default-model';

	logger.debug('ComponentName', 'apiCall', 'API request starting', {
		model,
		params_count: Object.keys(request).length,
	});

	try {
		const response = await makeRequest(request);
		const duration = Date.now() - start;

		logger.info('ComponentName', 'apiCall', 'API request completed', {
			duration_ms: duration,
			status: response.status,
		});

		return response;
	} catch (error) {
		const duration = Date.now() - start;
		logger.error('ComponentName', 'apiCall', 'API request failed', {
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
	logger.debug('ComponentName', 'processData', 'Processing data', {
		input_length: input.length,
	});

	try {
		const result = transform(input);
		logger.debug('ComponentName', 'processData', 'Data processed successfully');
		return result;
	} catch (error) {
		logger.error('ComponentName', 'processData', 'Processing failed', {
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}
```

#### Using Helper Functions
```typescript
import {withLogging, withLoggingSync} from '../../logging/Logger.js';

// Wrap async function
const apiCall = withLogging('ComponentName', 'apiCall', async (request) => {
	return await makeRequest(request);
});

// Wrap sync function
const processData = withLoggingSync('ComponentName', 'processData', (input) => {
	return transform(input);
});
```

### 3. Critical Logging Points

#### Application Lifecycle
```typescript
// App start
logger.info('CLI', 'main', 'Application starting', {
	version: pkg.version,
	node_version: process.version,
});

// App exit
logger.info('CLI', 'process', 'Application exiting');
logger.flush();
```

#### User Input
```typescript
logger.info('Input', 'handleUserInput', 'User input received', {
	input_length: input.length,
	command: extractCommand(input),
});
```

#### File I/O
```typescript
logger.debug('FileService', 'readFile', 'Reading file', {path});
logger.debug('FileService', 'writeFile', 'Writing file', {path, size});
```

#### State Changes
```typescript
logger.info('StateManager', 'updateState', 'State updated', {
	old_state: oldState,
	new_state: newState,
});
```

## Environment Setup

### Enable Logging
```bash
# Set environment variable (accepts: true, TRUE, 1, yes - case insensitive)
export CODEH_LOGGING=true

# Or add to .env file
echo "CODEH_LOGGING=true" >> .env

# Or run inline
CODEH_LOGGING=true codeh
```

### Log Files Location
- Path: `~/.codeh/logs/`
- Format: `logs_session_YYYYMMDD_HHMMSS.json`
- Retention: 7 days (configurable)

## Log Format

Each log entry is a JSON object:
```json
{
  "timestamp": "2025-11-15T10:30:45.123Z",
  "level": "DEBUG",
  "component": "APIClient",
  "function": "callOpenAI",
  "requestId": "req_abc123xyz",
  "message": "API request starting",
  "context": {
    "model": "gpt-4",
    "messages_count": 5
  }
}
```

## Debugging with Logs

### Find all logs for a request
```bash
grep "req_abc123xyz" ~/.codeh/logs/logs_session_*.json
```

### Find errors
```bash
grep '"level":"ERROR"' ~/.codeh/logs/logs_session_*.json
```

### Find slow operations (>1000ms)
```bash
grep -E 'duration_ms":[0-9]{4,}' ~/.codeh/logs/logs_session_*.json
```

## Best Practices

1. **Always log entry/exit for public functions**
2. **Include duration for async operations**
3. **Log errors with full context**
4. **Don't log sensitive data (passwords, tokens)**
5. **Keep context concise (max 5-10 keys)**
6. **Use appropriate log levels**:
   - DEBUG: Detailed execution flow
   - INFO: Important state changes, successful operations
   - WARN: Recoverable issues, slow operations
   - ERROR: Failures, exceptions

## Performance Impact

- Logging is disabled by default (CODEH_LOGGING=FALSE)
- When enabled:
  - Buffered writes (every 100 entries or 5 seconds)
  - No console.log (safe for Ink UI)
  - Minimal overhead (<1ms per log call)
