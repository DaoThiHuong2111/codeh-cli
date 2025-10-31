# Project Overview: codeh-cli

## Mục đích

Codeh-cli là một ứng dụng CLI được xây dựng bằng React và Ink framework, tạo ra giao diện terminal tương tác.

## Tech Stack

- **Framework**: React 18.2.0 với Ink 4.1.0 (CLI framework)
- **Language**: JavaScript/ES6 với Babel transpilation
- **Build Tool**: Babel với preset React
- **Testing**: AVA với ink-testing-library
- **Linting**: XO với React config
- **Formatting**: Prettier với @vdemedes/prettier-config

## Cấu trúc codebase hiện tại

```
source/
├── app.js              # Main App component
├── cli.js              # CLI entry point với meow
├── screens/
│   └── Welcome.js      # Welcome screen
├── components/
│   ├── InfoSection.js
│   ├── InputBox.js
│   ├── Logo.js
│   └── TipsSection.js
├── services/
│   └── config.js
└── utils/
```

## Commands quan trọng

- `npm run build`: Build project vào folder dist
- `npm run dev`: Development mode với watch
- `npm test`: Chạy prettier check, xo linting, và ava tests

## Code style & conventions

- Sử dụng XO linting với React config
- Prettier formatting
- React functional components
- ES6 modules
- Không cần prop-types (react/prop-types: off)
