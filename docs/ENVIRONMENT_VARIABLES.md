# Environment Variables Guide

## Overview

Codeh CLI sử dụng các environment variables với prefix `CODEH_*` để cấu hình. Tất cả các legacy variables (ANTHROPIC*\*, OPENAI*\_, OLLAMA\_\_) đã bị loại bỏ để đơn giản hóa configuration.

## Required Variables

### CODEH_PROVIDER

- **Type**: String
- **Required**: Yes
- **Values**: `anthropic`, `openai`, `ollama`, `generic`
- **Description**: AI provider bạn muốn sử dụng

### CODEH_MODEL

- **Type**: String
- **Required**: Yes
- **Description**: Tên model cụ thể (ví dụ: `claude-3-5-sonnet-20241022`, `gpt-4`, `llama2`)

### CODEH_BASE_URL

- **Type**: String (URL)
- **Required**: Yes
- **Description**: Base URL của API endpoint
- **Examples**:
  - Anthropic: `https://api.anthropic.com`
  - OpenAI: `https://api.openai.com`
  - Ollama: `http://localhost:11434`
  - Generic: Custom URL

### CODEH_API_KEY

- **Type**: String
- **Required**: Yes (except for Ollama)
- **Description**: API key để authenticate với provider
- **Security**: Không bao giờ commit API key vào git. Sử dụng `.env` file hoặc environment.

## Optional Variables

### CODEH_MAX_TOKEN

- **Type**: Integer
- **Required**: No
- **Default**: `4096`
- **Description**: Maximum number of tokens trong response
- **Range**: Phụ thuộc vào model (thường 1024 - 128000)

### CODEH_TEMPERATURE

- **Type**: Float
- **Required**: No
- **Default**: `0.7`
- **Description**: Temperature cho response generation
- **Range**: `0.0` - `2.0`
  - `0.0`: Deterministic, focused
  - `1.0`: Balanced creativity
  - `2.0`: Very creative, random

## Configuration Examples

### Example 1: Anthropic/Claude

```bash
export CODEH_PROVIDER=anthropic
export CODEH_MODEL=claude-3-5-sonnet-20241022
export CODEH_BASE_URL=https://api.anthropic.com
export CODEH_API_KEY=sk-ant-api03-...
export CODEH_MAX_TOKEN=8192
export CODEH_TEMPERATURE=0.7
```

### Example 2: OpenAI/GPT

```bash
export CODEH_PROVIDER=openai
export CODEH_MODEL=gpt-4
export CODEH_BASE_URL=https://api.openai.com
export CODEH_API_KEY=sk-...
export CODEH_MAX_TOKEN=4096
export CODEH_TEMPERATURE=0.8
```

### Example 3: Ollama (Local)

```bash
export CODEH_PROVIDER=ollama
export CODEH_MODEL=llama2
export CODEH_BASE_URL=http://localhost:11434
# No API key needed for Ollama
export CODEH_MAX_TOKEN=2048
export CODEH_TEMPERATURE=0.9
```

### Example 4: Generic OpenAI-compatible API

```bash
export CODEH_PROVIDER=generic
export CODEH_MODEL=mistral-7b-instruct
export CODEH_BASE_URL=https://your-custom-api.com
export CODEH_API_KEY=your-custom-key
export CODEH_MAX_TOKEN=4096
export CODEH_TEMPERATURE=0.7
```

## Using .env File

Bạn có thể tạo file `.env` trong project root:

```bash
# .env
CODEH_PROVIDER=anthropic
CODEH_MODEL=claude-3-5-sonnet-20241022
CODEH_BASE_URL=https://api.anthropic.com
CODEH_API_KEY=sk-ant-api03-...
CODEH_MAX_TOKEN=8192
CODEH_TEMPERATURE=0.7
```

Sau đó load với:

```bash
# Using dotenv
npm install dotenv
node -r dotenv/config dist/cli.js

# Or export manually
export $(cat .env | xargs)
codeh
```

## Configuration Priority

Codeh CLI load configuration theo thứ tự priority:

1. **Environment Variables** (Highest) - `CODEH_*` variables
2. **File Configuration** (Fallback) - `~/.codeh/configs.json`
3. **Interactive Wizard** (Last resort) - `codeh config` command

Nếu environment variables được set, chúng sẽ override file configuration.

## Validation

Codeh CLI sẽ validate các variables khi start:

### Required for all providers:

- ✅ `CODEH_PROVIDER` must be set
- ✅ `CODEH_MODEL` must be set
- ✅ `CODEH_BASE_URL` must be valid URL

### Required for non-Ollama providers:

- ✅ `CODEH_API_KEY` must be set (except Ollama)

### Optional validation:

- ⚠️ `CODEH_MAX_TOKEN` must be positive integer if set
- ⚠️ `CODEH_TEMPERATURE` must be 0.0-2.0 if set

Nếu validation fail, CLI sẽ show error message và redirect đến config wizard.

## Migration from Legacy Variables

### Old (DEPRECATED - Không còn support):

```bash
# ❌ NO LONGER SUPPORTED
ANTHROPIC_API_KEY=...
ANTHROPIC_BASE_URL=...
OPENAI_API_KEY=...
OPENAI_BASE_URL=...
OPENAI_MODEL=...
OLLAMA_BASE_URL=...
OLLAMA_MODEL=...
OLLAMA_API_KEY=...
```

### New (Current):

```bash
# ✅ SUPPORTED
CODEH_PROVIDER=anthropic
CODEH_MODEL=claude-3-5-sonnet-20241022
CODEH_BASE_URL=https://api.anthropic.com
CODEH_API_KEY=sk-ant-...
CODEH_MAX_TOKEN=4096
CODEH_TEMPERATURE=0.7
```

### Migration Script:

```bash
#!/bin/bash
# migrate_env.sh

# Detect provider from old variables
if [ -n "$ANTHROPIC_API_KEY" ]; then
  export CODEH_PROVIDER=anthropic
  export CODEH_API_KEY=$ANTHROPIC_API_KEY
  export CODEH_BASE_URL=${ANTHROPIC_BASE_URL:-https://api.anthropic.com}
elif [ -n "$OPENAI_API_KEY" ]; then
  export CODEH_PROVIDER=openai
  export CODEH_API_KEY=$OPENAI_API_KEY
  export CODEH_BASE_URL=${OPENAI_BASE_URL:-https://api.openai.com}
  export CODEH_MODEL=${OPENAI_MODEL:-gpt-4}
elif [ -n "$OLLAMA_BASE_URL" ]; then
  export CODEH_PROVIDER=ollama
  export CODEH_BASE_URL=$OLLAMA_BASE_URL
  export CODEH_MODEL=${OLLAMA_MODEL:-llama2}
fi

# Unset old variables
unset ANTHROPIC_API_KEY ANTHROPIC_BASE_URL
unset OPENAI_API_KEY OPENAI_BASE_URL OPENAI_MODEL
unset OLLAMA_BASE_URL OLLAMA_MODEL OLLAMA_API_KEY

echo "Migration complete. New variables:"
env | grep CODEH_
```

## Troubleshooting

### Error: "CODEH_PROVIDER is required"

**Solution**: Set `CODEH_PROVIDER` environment variable

```bash
export CODEH_PROVIDER=anthropic
```

### Error: "CODEH_API_KEY is required"

**Solution**: Set `CODEH_API_KEY` (not needed for Ollama)

```bash
export CODEH_API_KEY=your-api-key
```

### Error: "Invalid CODEH_BASE_URL"

**Solution**: Ensure URL is valid and includes protocol

```bash
# ❌ Wrong
export CODEH_BASE_URL=api.anthropic.com

# ✅ Correct
export CODEH_BASE_URL=https://api.anthropic.com
```

### Configuration not being read

**Solution**: Check if environment variables are exported

```bash
# Check current values
env | grep CODEH_

# Export if not set
export CODEH_PROVIDER=anthropic
export CODEH_MODEL=claude-3-5-sonnet-20241022
# ... etc
```

## Security Best Practices

1. **Never commit `.env` to git**

   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use environment-specific files**

   ```bash
   .env.development
   .env.production
   .env.local  # Git-ignored
   ```

3. **Rotate API keys regularly**
   - Anthropic: https://console.anthropic.com
   - OpenAI: https://platform.openai.com/api-keys

4. **Use secret management in production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Kubernetes Secrets

5. **Validate inputs**
   - CLI automatically validates all environment variables
   - Invalid values will trigger error messages

## Support

Nếu gặp vấn đề với environment variables:

1. Check documentation: `docs/ENVIRONMENT_VARIABLES.md` (file này)
2. Run config wizard: `codeh config`
3. Validate current config: Check `~/.codeh/configs.json`
4. Report issues: GitHub Issues

---

**Last updated**: 2025-11-02
**Version**: 1.0.0
