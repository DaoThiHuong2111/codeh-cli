# Welcome Screen

First-time setup và onboarding screen cho CODEH CLI.

## Overview

Welcome Screen hiển thị khi user chưa có configuration. Hỗ trợ setup provider, API key, và model selection.

## Features

- Provider selection (Anthropic, OpenAI, Ollama, Generic)
- API key input
- Model selection based on provider
- Configuration validation
- One-click setup wizard

## Usage

Launch app lần đầu:

```
╭────────────────────────────────────╮
│   Welcome to CODEH CLI!            │
├────────────────────────────────────┤
│                                     │
│ Select AI Provider:                 │
│  ○ Anthropic Claude                 │
│  ○ OpenAI GPT                       │
│  ○ Ollama (Local)                   │
│  ○ Generic API                      │
│                                     │
│ [Continue]                          │
╰────────────────────────────────────╯
```

After selection → Input API key → Choose model → Save config → Navigate to Home

See also: [Technical](./technical.md)
