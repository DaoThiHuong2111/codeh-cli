# File này define logic chi tiết về các chức năng base project

## Base Project Structure

### 1. Project Architecture

- **Screen-based navigation**: welcome, home, config
- **Shared component system**: đồng bộ style qua `source/components/`
- **Input management layer**: phân tích và filter user input
- **Output classification layer**: định dạng và hiển thị các loại output khác nhau
- **API management layer**: hooks, logging, error handling

### 2. Configuration System (Unified CODEH_* Variables Only)

#### **Configuration Priority**:

1. **Environment Variables (HIGHEST PRIORITY)** - CODEH_* prefix only:

   ```bash
   CODEH_PROVIDER=anthropic                    # Required: anthropic, openai, ollama, generic
   CODEH_MODEL=claude-3-5-sonnet-20241022      # Required: Model name
   CODEH_BASE_URL=https://api.anthropic.com    # Required: Base URL for API
   CODEH_API_KEY=your-api-key-here             # Required (except Ollama): API key
   CODEH_MAX_TOKEN=4096                        # Optional: Max tokens (default: 4096)
   CODEH_TEMPERATURE=0.7                       # Optional: Temperature (default: 0.7)
   ```

2. **File Config (FALLBACK)**:
   - Path: `~/.codeh/configs.json`
   - Format: `{"provider": "...", "model": "...", "baseUrl": "...", "apiKey": "...", "maxTokens": 4096, "temperature": 0.7}`

**Note**: Legacy variables (ANTHROPIC_*, OPENAI_*, OLLAMA_*) are NO LONGER supported. Use CODEH_* prefix only.

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
