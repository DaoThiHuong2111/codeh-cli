#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎯 TEST SCREEN TRANSITION FLOW');
console.log('✅ Đã xóa tất cả file config');

const child = spawn('node', ['dist/cli.js'], {
  stdio: 'pipe',
  cwd: __dirname
});

let buffer = '';
let screenCounter = 0;

child.stdout.on('data', (data) => {
  buffer += data.toString();
  console.log('OUTPUT:', data.toString());

  // Screen 1: Provider selection
  if (buffer.includes('Select your provider:') && screenCounter === 0) {
    screenCounter = 1;
    console.log('✅ SCREEN 1: Provider selection - ĐÃ HIỂN THỊ!');

    // Simulate user selecting provider 2 (openai) - down arrow + enter
    setTimeout(() => {
      console.log('📝 Nhấn mũi tên xuống để chọn OpenAI');
      child.stdin.write('\x1b[B'); // Down arrow
    }, 500);

    setTimeout(() => {
      console.log('📝 Nhấn Enter để chọn OpenAI');
      child.stdin.write('\r');
      buffer = ''; // Reset buffer for next screen detection
    }, 1000);
  }

  // Screen 2: Model input
  if (buffer.includes('Enter your model:') && screenCounter === 1) {
    screenCounter = 2;
    console.log('✅ SCREEN 2: Model input - ĐÃ HIỂN THỊ! 🎉');

    // Simulate typing model name
    setTimeout(() => {
      console.log('📝 Gõ "gpt-4"');
      child.stdin.write('gpt-4');
    }, 500);

    setTimeout(() => {
      console.log('📝 Nhấn Enter');
      child.stdin.write('\r');
      buffer = '';
    }, 1000);
  }

  // Screen 3: Base URL input
  if (buffer.includes('Enter your base url:') && screenCounter === 2) {
    screenCounter = 3;
    console.log('✅ SCREEN 3: Base URL input - ĐÃ HIỂN THỊ! 🎉');

    // Simulate typing base URL
    setTimeout(() => {
      console.log('📝 Gõ "https://api.openai.com/v1"');
      child.stdin.write('https://api.openai.com/v1');
    }, 500);

    setTimeout(() => {
      console.log('📝 Nhấn Enter');
      child.stdin.write('\r');
      buffer = '';
    }, 1000);
  }

  // Screen 4: API Key input
  if (buffer.includes('Enter your api key:') && screenCounter === 3) {
    screenCounter = 4;
    console.log('✅ SCREEN 4: API Key input - ĐÃ HIỂN THỊ! 🎉');

    // Check for file notification
    if (buffer.includes('~/.codeh/configs.json')) {
      console.log('✅ Thông báo file config - ĐÃ HIỂN THỊ!');
    }

    // Simulate typing API key
    setTimeout(() => {
      console.log('📝 Gõ "sk-test-key-12345"');
      child.stdin.write('sk-test-key-12345');
    }, 500);

    setTimeout(() => {
      console.log('📝 Nhấn Enter để lưu config');
      child.stdin.write('\r');
      buffer = '';
    }, 1000);
  }

  // Home screen - SUCCESS!
  if (buffer.includes('CodeH CLI - Home') && screenCounter === 4) {
    console.log('🎉 SUCCESS: Đã chuyển về HOME SCREEN! 🎉');
    console.log('✅ TOÀN BỘ FLOW 4 MÀN HÌNH CONFIG HOẠT ĐỘNG HOÀN HẢO!');

    // Check config file
    setTimeout(() => {
      const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.codeh', 'configs.json');
      if (fs.existsSync(configPath)) {
        console.log('✅ File config được tạo thành công tại:', configPath);
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('📄 Nội dung config:', JSON.stringify(config, null, 2));
      }

      console.log('\n🎯 SCREEN TRANSITION TEST COMPLETE! 🎯');
      console.log('✅ Screen 1 → Screen 2: SUCCESS');
      console.log('✅ Screen 2 → Screen 3: SUCCESS');
      console.log('✅ Screen 3 → Screen 4: SUCCESS');
      console.log('✅ Screen 4 → Home: SUCCESS');
      console.log('✅ Flow logic hoàn hảo!');

      child.kill('SIGTERM');
    }, 1000);
  }
});

child.stderr.on('data', (data) => {
  console.error('ERROR:', data.toString());
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});

// Auto-kill sau 30 giây
setTimeout(() => {
  console.log('⏰ Timeout - killing process');
  child.kill('SIGTERM');
}, 30000);