# Config Screen

Configuration wizard để setup hoặc update AI provider settings.

## Overview

Config Screen là wizard-based interface giúp user configure AI provider, model, và các settings liên quan. Screen này có thể được truy cập từ Welcome Screen (first-time setup) hoặc từ Home Screen (update config).

## Features

- **Provider Selection**: Choose từ 4 providers (Anthropic, OpenAI, Ollama, Generic)
- **Model Configuration**: Specify model name
- **API Key Management**: Secure API key input (masked)
- **Base URL**: Custom API endpoint (optional)
- **Max Tokens**: Configure token limit (1-1,000,000)
- **Configuration Validation**: Real-time validation và error handling
- **Confirmation Step**: Review all settings trước khi save

## Usage

### Access Config Screen

1. **First-time setup**: Auto-show khi chưa có config
2. **From Home Screen**: Type `/config` slash command
3. **From CLI**: Run với `--setup` flag

### Configuration Flow

```
╭────────────────────────────────────╮
│  Configuration Wizard              │
├────────────────────────────────────┤
│                                     │
│ Step 1: Select Provider             │
│  ○ Anthropic (Claude)               │
│  ○ OpenAI (GPT)                     │
│  ○ Ollama (Local)                   │
│  ○ Generic API                      │
│                                     │
│ Use ↑↓ to navigate • Enter to sel  │
╰────────────────────────────────────╯
```

After provider selection:
- **Step 2**: Enter model name
- **Step 3**: Enter API key (nếu required)
- **Step 4**: Base URL (optional - skip với Enter)
- **Step 5**: Max tokens (default: 4096)
- **Step 6**: Confirm và save

## Supported Providers

| Provider   | Requires API Key | Supports Streaming | Default Model      |
| ---------- | ---------------- | ------------------ | ------------------ |
| Anthropic  | Yes              | Yes                | claude-3-5-sonnet  |
| OpenAI     | Yes              | Yes                | gpt-4              |
| Ollama     | No               | Yes                | llama2             |
| Generic    | Optional         | Maybe              | -                  |

## Validation Rules

- **Provider**: Must select from available options
- **Model**: Cannot be empty
- **API Key**: Required for Anthropic và OpenAI, optional for Ollama và Generic
- **Max Tokens**: Must be 1-1,000,000
- **Temperature**: Must be 0-2 (default: 0.7)

## Components

- `Config`: Main container component
- `ConfigPresenter`: Business logic
- `useConfigWizard`: Wizard state management hook
- `useConfigKeyboard`: Keyboard navigation hook
- `Menu`: Provider selection và confirm options
- `InputBox`: Text input for model, API key, base URL, max tokens

## Keyboard Shortcuts

| Key      | Action                               |
| -------- | ------------------------------------ |
| `↑/↓`    | Navigate menu items (Provider/Confirm) |
| `Enter`  | Confirm selection / Submit input     |
| `ESC`    | Go back to previous step             |
| `Ctrl+C` | Exit wizard                          |

## Error Handling

- **Invalid Input**: Show error message trên input field
- **Validation Errors**: List tất cả errors trước khi save
- **Save Errors**: Display error và allow retry
- **Missing Config**: Prompt user để create new config

## Storage

Configuration được lưu vào:
1. **File**: `~/.codeh/config.json` (recommended)
2. **Environment Variables**: `CODEH_*` prefix (override file config)

Priority: Env vars > File config

## Example Configuration

```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "baseUrl": "https://api.anthropic.com/v1",
  "maxTokens": 4096,
  "temperature": 0.7
}
```

**Note**: API key is stored separately trong `.env` file hoặc system env vars (không lưu trong config.json).

## Related

- [Configuration Guide](../../guides/configuration.md)
- [Technical Details](./technical.md)
- [Welcome Screen](../welcome/README.md)
