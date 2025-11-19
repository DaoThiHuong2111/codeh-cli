#!/bin/bash
# Script to run all tests including TSX components

# Compile TSX tests
echo "Compiling TSX tests..."
find test/cli/components -name "*.test.tsx" -exec sh -c 'npx esbuild "$1" --format=esm --platform=node --outfile="${1%.tsx}.js" --packages=external' _ {} \;

# Run all tests
echo "Running all tests..."
npx ava test/infrastructure/api/*.test.ts test/infrastructure/config/*.test.ts test/infrastructure/permissions/*.test.ts test/infrastructure/session/*.test.ts test/core/application/*.test.ts test/core/application/services/*.test.ts test/core/tools/*.test.ts test/cli/presenters/*.test.ts test/cli/components/**/*.test.js
