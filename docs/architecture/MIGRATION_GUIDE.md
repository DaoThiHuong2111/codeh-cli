## 📘 MIGRATION GUIDE - 3-LAYER ARCHITECTURE

**Ngày:** 2025-11-02
**Phiên bản:** 1.0

---

## 🎯 OVERVIEW

Hướng dẫn này giúp bạn di chuyển từ cấu trúc cũ sang kiến trúc 3-layer mới.

### Trước (Old Structure)
```
source/
├── services/       # Mixed: Business + Infrastructure
├── components/     # UI components
├── screens/        # Screens
└── utils/          # Utilities
```

### Sau (New Structure)
```
source/
├── core/           # LAYER 2: Business Logic
├── infrastructure/ # LAYER 3: External Services
└── cli/            # LAYER 1: User Interface (chưa hoàn thành)
```

---

## 📦 IMPORT MAPPING

### API Services

**Trước:**
```javascript
import { apiManager } from './services/api/manager.js';
```

**Sau:**
```typescript
import { setupContainer } from '@/core';

const container = await setupContainer();
const codehClient = await container.resolve('CodehClient');
```

---

### Configuration

**Trước:**
```javascript
import { configManager } from './services/config/manager.js';
import { envManager } from './services/config/env.js';
import { getModel, getProvider } from './services/config/getters.js';
```

**Sau:**
```typescript
import { ConfigLoader, Configuration } from '@/infrastructure';

const loader = new ConfigLoader();
const config = await loader.load();

console.log(config.provider); // 'anthropic'
console.log(config.model);    // 'claude-3-5-sonnet-20241022'
```

---

### Input Validation

**Trước:**
```javascript
import { inputValidator } from './services/input/validator.js';

const result = inputValidator.validate(input);
const classification = inputValidator.classifyInput(input);
```

**Sau:**
```typescript
import { InputClassifier } from '@/core';

const classifier = new InputClassifier();
const validation = classifier.validate(input);
const classification = classifier.classify(input);

console.log(classification.type);        // InputType.TEXT
console.log(classification.confidence);  // 1.0
```

---

### Output Classification

**Trước:**
```javascript
import { outputClassifier } from './services/output/classifier.js';

const result = outputClassifier.classify(output);
```

**Sau:**
```typescript
import { OutputFormatter } from '@/core';

const formatter = new OutputFormatter();
const classification = formatter.classify(output);

console.log(classification.type);  // OutputType.CODE
```

---

### Shell Commands

**Trước:**
```javascript
import { inputHandler } from './services/input/handler.js';

await inputHandler.handleCommand(command);
```

**Sau:**
```typescript
import { ShellExecutor, CommandValidator } from '@/infrastructure';

const executor = new ShellExecutor();
const validator = new CommandValidator();

// Validate first
const validation = validator.validate(command);
if (!validation.valid) {
  throw new Error(validation.reason);
}

// Execute
const result = await executor.execute(command);
console.log(result.stdout);
```

---

### File Operations

**Trước:**
```javascript
import fs from 'fs';

const content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path, content);
```

**Sau:**
```typescript
import { FileOperations } from '@/infrastructure';

const fileOps = new FileOperations();
const content = fileOps.readFile(path);
fileOps.writeFile(path, content);

// Hoặc dùng Tool
import { FileOpsTool } from '@/core';

const tool = new FileOpsTool(fileOps);
const result = await tool.execute({
  operation: 'read',
  path: './file.txt',
});
```

---

## 🔧 KEY CHANGES

### 1. Dependency Injection

**Trước:** Singletons với imports trực tiếp
```javascript
import { apiManager } from './services/api/manager.js';

// Use directly
await apiManager.callAI({ messages });
```

**Sau:** DI Container
```typescript
import { setupContainer } from '@/core';

const container = await setupContainer();
const codehClient = await container.resolve('CodehClient');

// Use through client
const turn = await codehClient.execute(input);
```

### 2. Type Safety

**Trước:** JavaScript với JSDoc comments
```javascript
/**
 * @param {string} input
 * @returns {Promise<object>}
 */
async function process(input) {
  // ...
}
```

**Sau:** TypeScript với strict typing
```typescript
async function process(input: string): Promise<Turn> {
  const turn = await codehClient.execute(input);
  return turn;
}
```

### 3. Domain Models

**Trước:** Plain objects
```javascript
const message = {
  role: 'user',
  content: 'Hello',
  timestamp: new Date(),
};
```

**Sau:** Rich domain models
```typescript
import { Message } from '@/core';

const message = Message.user('Hello');

console.log(message.isUser());      // true
console.log(message.timestamp);     // Date
console.log(message.toJSON());      // Serializable
```

### 4. Configuration

**Trước:** Mixed env vars and file config
```javascript
const provider = getProvider();  // Complex fallback logic
const model = getModel();
```

**Sau:** Unified configuration model
```typescript
import { ConfigLoader, Configuration } from '@/infrastructure';

const loader = new ConfigLoader();
const config = await loader.load();  // Auto-merges env + file

if (!config.isValid()) {
  console.error(config.getValidationErrors());
}
```

---

## 🚀 USAGE EXAMPLES

### Example 1: Simple Chat Interaction

**Cũ:**
```javascript
import { apiManager } from './services/api/manager.js';

const response = await apiManager.callAI({
  messages: [{ role: 'user', content: 'Hello' }],
});

console.log(response.content);
```

**Mới:**
```typescript
import { setupContainer } from '@/core';

const container = await setupContainer();
const client = await container.resolve('CodehClient');

const turn = await client.execute('Hello');
console.log(turn.response?.content);
console.log(turn.getTokenUsage());
console.log(turn.getDuration());
```

### Example 2: Conversation Management

**Mới:**
```typescript
import { CodehChat } from '@/core';
import { FileHistoryRepository } from '@/infrastructure';

const historyRepo = new FileHistoryRepository();
const chat = new CodehChat(historyRepo);

// Send messages
await chat.sendMessage('What is TypeScript?');
await chat.addResponse('TypeScript is a typed superset of JavaScript...');

// Get history
const history = chat.getHistory();
console.log(`Messages: ${history.length}`);

// Check stats
const stats = chat.getStats();
console.log(`Estimated tokens: ${stats.estimatedTokens}`);

// Clear
await chat.clear();
```

### Example 3: Using Tools

**Mới:**
```typescript
import { ToolRegistry, ShellTool, FileOpsTool } from '@/core';
import { ShellExecutor, FileOperations } from '@/infrastructure';

// Setup registry
const registry = new ToolRegistry();
registry.register(new ShellTool(new ShellExecutor()));
registry.register(new FileOpsTool(new FileOperations()));

// Execute tool
const result = await registry.execute('shell', {
  command: 'git status',
});

if (result.success) {
  console.log(result.output);
} else {
  console.error(result.error);
}
```

---

## ⚠️ BREAKING CHANGES

### 1. **No More Global Singletons**
Không còn `apiManager`, `configManager`, etc. singletons. Phải dùng DI Container.

### 2. **Async Configuration Loading**
Configuration loading giờ là async:
```typescript
// ❌ Wrong
const config = configLoader.load();

// ✅ Correct
const config = await configLoader.load();
```

### 3. **Message Format Changed**
Messages giờ là domain models, không phải plain objects:
```typescript
// ❌ Wrong
const msg = { role: 'user', content: 'Hi' };

// ✅ Correct
const msg = Message.user('Hi');
```

### 4. **No Direct API Calls**
Không gọi API trực tiếp, phải qua CodehClient:
```typescript
// ❌ Wrong
await apiManager.callAnthropic(data, config);

// ✅ Correct
await codehClient.execute(input);
```

---

## 🔄 STEP-BY-STEP MIGRATION

### Phase 1: Add New Dependencies (Completed ✅)
- [x] Install TypeScript (if not already)
- [x] Create new folder structure
- [x] Add all new files

### Phase 2: Update Entry Point

**Cũ (`source/cli.js`):**
```javascript
import {App} from './app.js';
import {render} from 'ink';

render(<App />);
```

**Mới:**
```typescript
import { App } from './cli/app.tsx';
import { render } from 'ink';
import { setupContainer } from './core';

async function main() {
  const container = await setupContainer();
  render(<App container={container} />);
}

main().catch(console.error);
```

### Phase 3: Update Components to Use Container

**Example: Home Screen**

**Cũ:**
```javascript
import { apiManager } from '../services/api/manager.js';

const Home = () => {
  const handleInput = async (input) => {
    const response = await apiManager.callAI({
      messages: [{ role: 'user', content: input }],
    });
    setOutput(response.content);
  };

  return <Box>...</Box>;
};
```

**Mới:**
```typescript
import { Container } from '../../core';
import { CodehClient } from '../../core';

interface HomeProps {
  container: Container;
}

const Home: React.FC<HomeProps> = ({ container }) => {
  const [client] = useState(() =>
    container.resolve<Promise<CodehClient>>('CodehClient')
  );

  const handleInput = async (input: string) => {
    const resolvedClient = await client;
    const turn = await resolvedClient.execute(input);
    setOutput(turn.response?.content || '');
  };

  return <Box>...</Box>;
};
```

### Phase 4: Remove Old Code

```bash
# Sau khi verify mọi thứ hoạt động
rm -rf source/services/
rm -rf source/utils/
```

---

## 📝 NOTES

### TypeScript Configuration

Cần thêm vào `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/core/*": ["source/core/*"],
      "@/infrastructure/*": ["source/infrastructure/*"],
      "@/cli/*": ["source/cli/*"]
    }
  }
}
```

### Babel Configuration

Cần update `babel.config.json`:
```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "16" } }],
    "@babel/preset-typescript",
    "@babel/preset-react"
  ],
  "plugins": [
    ["module-resolver", {
      "alias": {
        "@/core": "./source/core",
        "@/infrastructure": "./source/infrastructure",
        "@/cli": "./source/cli"
      }
    }]
  ]
}
```

---

## 🆘 TROUBLESHOOTING

### Error: "No factory registered for token"

**Cause:** Trying to resolve a dependency that hasn't been registered.

**Solution:**
```typescript
// Check if registered
if (container.has('CodehClient')) {
  const client = await container.resolve('CodehClient');
}
```

### Error: "Configuration not found"

**Cause:** Missing environment variables or config file.

**Solution:**
```typescript
const loader = new ConfigLoader();
const status = await loader.getStatus();

console.log('Has env config:', status.hasEnvConfig);
console.log('Has file config:', status.hasFileConfig);

if (!status.hasEnvConfig && !status.hasFileConfig) {
  // Run config wizard
}
```

### Error: "Tool not found"

**Cause:** Tool not registered in registry.

**Solution:**
```typescript
const registry = container.resolve<ToolRegistry>('ToolRegistry');
console.log('Available tools:', registry.getAllNames());
```

---

## ✅ CHECKLIST

- [ ] Đọc toàn bộ migration guide
- [ ] Hiểu về 3-layer architecture
- [ ] Update entry point (cli.js/cli.tsx)
- [ ] Update components để nhận Container qua props
- [ ] Replace tất cả imports cũ
- [ ] Test từng chức năng
- [ ] Remove old code (services/, utils/)
- [ ] Update documentation
- [ ] Commit changes

---

**Người tạo:** Claude Code
**Cập nhật lần cuối:** 2025-11-02
