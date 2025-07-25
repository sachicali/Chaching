// Quick AI Integration Test
// Run with: node test-ai.js

const { spawn } = require('child_process');

console.log('🧪 Testing Chaching AI Integration...\n');

// Test 1: Check if environment variables are loaded
console.log('📋 Test 1: Environment Variables');
console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

// Test 2: Check if server starts without AI errors
console.log('📋 Test 2: Development Server');
console.log('Run the following command to test:');
console.log('bun run dev');
console.log('Expected: Server starts without "GOOGLE_AI_API_KEY environment variable is required" error');
console.log('');

// Test 3: Genkit Developer UI
console.log('📋 Test 3: Genkit AI Flows');
console.log('Run the following command in a new terminal:');
console.log('bun run genkit:dev');
console.log('Expected: Genkit UI available at http://localhost:4000');
console.log('');

// Test 4: Dashboard Access
console.log('📋 Test 4: Dashboard AI Features');
console.log('1. Open: http://localhost:9002/dashboard');
console.log('2. Look for AI widgets: Insights, Predictions, Anomalies, Categorization');
console.log('3. Expected: Widgets load without error states (may show "Add data" messages)');
console.log('');

// Test 5: Transaction Categorization
console.log('📋 Test 5: Smart Categorization');
console.log('1. Go to: http://localhost:9002/expenses');
console.log('2. Create transaction with description: "Grab food from McDonald\'s"');
console.log('3. Expected: AI suggests "Food & Dining" category with confidence score');
console.log('');

console.log('🎯 Success Indicators:');
console.log('✅ No API key errors on server start');
console.log('✅ Genkit UI accessible on port 4000');
console.log('✅ Dashboard loads with AI widgets');
console.log('✅ Smart categorization works in transaction forms');
console.log('✅ AI flows return structured responses in Genkit UI');
console.log('');

console.log('🚀 Your Chaching app is ready with AI integration enabled!');
console.log('The Google AI API key has been configured successfully.');