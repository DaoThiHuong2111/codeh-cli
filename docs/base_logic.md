# File này define logic chi tiết về các chức năng base project

## Base Project Structure

### 1. Project Architecture
- **Screen-based navigation**: welcome, home, config
- **Shared component system**: đồng bộ style qua `source/components/`
- **Input management layer**: phân tích và filter user input
- **Output classification layer**: định dạng và hiển thị các loại output khác nhau
- **API management layer**: hooks, logging, error handling

### 2. Configuration System (Updated for unified environment variables)

#### **Priority Order (NEW)**:
1. **Unified Variables (HIGH PRIORITY)** - 5 biến chính theo `config.md`:
   ```bash
   CODEH_PROVIDER=anthropic                    # Options: anthropic, openai, generic-chat-completion-api
   CODEH_MODEL=claude-3                        # Model name
   CODEH_BASE_URL=https://api.anthropic.com   # Base URL for API
   CODEH_API_KEY=your-api-key-here             # API key
   CODEH_MAX_TOKEN=4096                        # Max tokens
   ```

2. **Legacy Variables (BACKWARD COMPATIBILITY)**:
   ```bash
   ANTHROPIC_BASE_URL, ANTHROPIC_API_KEY
   OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL
   OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_API_KEY
   ```

3. **File Config (FALLBACK)**:
   - Path: `~/.codeh/configs.json`
   - Format: `{"custom_models": [{"provider": "...", "model": "...", "base_url": "...", "api_key": "..."}]}`

#### **Configuration Flow Logic**:
1. **Check environment variables first** - 优先使用 `CODEH_*` variables
2. **Check file config if env incomplete** - Fallback to `~/.codeh/configs.json`
3. **Redirect to config screens** - 4-screen setup process
4. **Prioritize env if both exist** - Environment variables > File config
5. **Redirect to home screen** - Once configured

### 3. Input Management Layer
- **Input validation**: filter dangerous commands, validate inputs
- **Command processing**: whitelist/blacklist command checking
- **Input classification**: identify input types (text, code, URLs, files)

### 4. Output Classification Layer
- **Code display**: syntax highlighting, proper indentation
- **Git diff**: green background for additions (+), red for deletions (-)
- **Terminal commands**: check against whitelist before execution
- **Text formatting**: appropriate styling for different content types

### 5. API Management Layer
- **Pre-request hooks**: validation, logging, rate limiting
- **Post-response processing**: format normalization, classification
- **Error handling**: retry logic, fallback mechanisms
- **Support for providers**:
  - `anthropic`: Claude API
  - `openai`: OpenAI API
  - `generic-chat-completion-api`: OpenAI-compatible APIs

### 6. Component System
- **Reusable UI components**: Text, Box, Button, Input, etc.
- **Consistent styling**: unified theme across all screens
- **Accessibility**: proper keyboard navigation, screen reader support

### 7. Security Features
- **Command validation**: block dangerous commands by default
- **URL validation**: check and sanitize URLs
- **File size limits**: prevent oversized file operations
- **API key protection**: secure storage and handling