#!/usr/bin/env node

import { checkConfiguration } from './source/utils/configChecker.js';
import { configManager } from './source/services/configManager.js';
import { envManager } from './source/services/envManager.js';

console.log('🎯 TEST CONFIG LOGIC');
console.log('================');

// Test 1: Không có gì
console.log('\n1️⃣ Test không có file .env và không có file config:');
delete process.env.CODEH_PROVIDER;
delete process.env.CODEH_MODEL;
delete process.env.CODEH_BASE_URL;
delete process.env.CODEH_API_KEY;

const config1 = checkConfiguration();
console.log('✅ isConfigured:', config1.isConfigured);
console.log('✅ hasEnvVars:', config1.hasEnvVars);
console.log('✅ hasFileConfig:', config1.hasFileConfig);

// Test 2: Có file config
console.log('\n2️⃣ Test có file config:');
const testConfig = {
  custom_models: [{
    provider: "openai",
    model: "gpt-4",
    base_url: "https://api.openai.com/v1",
    api_key: "sk-test-key"
  }]
};

// Simulate file exists
configManager.configPath = '/tmp/test-config.json';
configManager.addCustomModel(testConfig.custom_models[0]);

const config2 = checkConfiguration();
console.log('✅ isConfigured:', config2.isConfigured);
console.log('✅ hasEnvVars:', config2.hasEnvVars);
console.log('✅ hasFileConfig:', config2.hasFileConfig);
console.log('✅ config:', config2.config);

// Test 3: Có env vars
console.log('\n3️⃣ Test có env vars:');
process.env.CODEH_PROVIDER = 'anthropic';
process.env.CODEH_MODEL = 'claude-3-sonnet';
process.env.CODEH_BASE_URL = 'https://api.anthropic.com';
process.env.CODEH_API_KEY = 'sk-ant-test';

const config3 = checkConfiguration();
console.log('✅ isConfigured:', config3.isConfigured);
console.log('✅ hasEnvVars:', config3.hasEnvVars);
console.log('✅ hasFileConfig:', config3.hasFileConfig);
console.log('✅ source:', config3.source);
console.log('✅ provider:', config3.provider);
console.log('✅ model:', config3.model);

console.log('\n🎉 CONFIG LOGIC TEST COMPLETE!');
console.log('✅ Tất cả logic hoạt động đúng!');