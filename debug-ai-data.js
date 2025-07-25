#!/usr/bin/env node

/**
 * Debug script for AI Financial Intelligence data flow
 * Investigates why AI widgets show "no data available"
 * Usage: node debug-ai-data.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} = require('firebase/firestore');

// Firebase configuration (using the same config as in the app)
const firebaseConfig = {
  apiKey: "AIzaSyDlp-XcxzKbZdPJf2_WQjY7X5FTvPq7-rY",
  authDomain: "chaching-finance.firebaseapp.com",
  projectId: "chaching-finance",
  storageBucket: "chaching-finance.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Test user ID from dashboard
const TEST_USER_ID = 'dev-test-user-123';

console.log('🔍 Debugging AI Financial Intelligence Data Flow\n');
console.log(`📋 Test User ID: ${TEST_USER_ID}\n`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Check existing transactions for test user
 */
async function checkExistingTransactions() {
  console.log('📊 Checking existing transactions...');
  
  try {
    const transactionsRef = collection(db, `users/${TEST_USER_ID}/transactions`);
    const q = query(transactionsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} transactions`);
    
    if (querySnapshot.size === 0) {
      console.log('❌ No transactions found for test user');
      return [];
    }
    
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate()
      });
    });
    
    // Show summary
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    console.log(`✅ Income transactions: ${income.length}`);
    console.log(`✅ Expense transactions: ${expenses.length}`);
    
    // Show recent transactions
    console.log('\n📋 Recent transactions:');
    transactions.slice(0, 5).forEach(t => {
      console.log(`  - ${t.date?.toISOString().split('T')[0]} | ${t.type} | ${t.currency} ${t.amount} | ${t.description}`);
    });
    
    return transactions;
    
  } catch (error) {
    console.error('❌ Error checking transactions:', error);
    return [];
  }
}

/**
 * Create sample transactions for testing
 */
async function createSampleTransactions() {
  console.log('\n🏗️  Creating sample transactions...');
  
  const sampleTransactions = [
    // Income transactions
    {
      amount: 50000,
      currency: 'PHP',
      phpEquivalent: 50000,
      exchangeRate: 1.0,
      date: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      description: 'Web Development Project Payment',
      type: 'income',
      category: 'Project Work',
      status: 'completed',
      clientId: 'sample-client-1',
      paymentMethod: 'bank_transfer',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    {
      amount: 1200,
      currency: 'USD',
      phpEquivalent: 70500, // 1200 * 58.75
      exchangeRate: 58.75,
      date: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      description: 'Consulting Services - Q4 2024',
      type: 'income',
      category: 'Consulting',
      status: 'completed',
      clientId: 'sample-client-2',
      paymentMethod: 'paypal',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    {
      amount: 25000,
      currency: 'PHP',
      phpEquivalent: 25000,
      exchangeRate: 1.0,
      date: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
      description: 'Mobile App Development',
      type: 'income',
      category: 'Project Work',
      status: 'completed',
      clientId: 'sample-client-3',
      paymentMethod: 'gcash',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    // Expense transactions
    {
      amount: 5000,
      currency: 'PHP',
      phpEquivalent: 5000,
      exchangeRate: 1.0,
      date: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      description: 'Office supplies and equipment',
      type: 'expense',
      category: 'Office Supplies',
      status: 'completed',
      paymentMethod: 'cash',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    {
      amount: 15000,
      currency: 'PHP',
      phpEquivalent: 15000,
      exchangeRate: 1.0,
      date: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
      description: 'Internet and utilities',
      type: 'expense',
      category: 'Utilities',
      status: 'completed',
      paymentMethod: 'bank_transfer',
      isRecurring: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    {
      amount: 3500,
      currency: 'PHP',
      phpEquivalent: 3500,
      exchangeRate: 1.0,
      date: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
      description: 'Coffee shop meeting with client',
      type: 'expense',
      category: 'Food & Dining',
      status: 'completed',
      paymentMethod: 'credit_card',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    {
      amount: 8000,
      currency: 'PHP',
      phpEquivalent: 8000,
      exchangeRate: 1.0,
      date: Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)), // 12 days ago
      description: 'Software subscriptions (Adobe, Figma)',
      type: 'expense',
      category: 'Software & Tools',
      status: 'completed',
      paymentMethod: 'credit_card',
      isRecurring: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    },
    {
      amount: 120,
      currency: 'USD',
      phpEquivalent: 7050, // 120 * 58.75
      exchangeRate: 58.75,
      date: Timestamp.fromDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)), // 8 days ago
      description: 'Domain renewal and hosting',
      type: 'expense',
      category: 'Web Services',
      status: 'completed',
      paymentMethod: 'paypal',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      userId: TEST_USER_ID
    }
  ];
  
  try {
    const transactionsRef = collection(db, `users/${TEST_USER_ID}/transactions`);
    
    console.log(`Adding ${sampleTransactions.length} sample transactions...`);
    
    for (const transaction of sampleTransactions) {
      const docRef = await addDoc(transactionsRef, transaction);
      console.log(`✅ Added transaction: ${docRef.id} - ${transaction.description}`);
    }
    
    console.log('\n🎉 Sample transactions created successfully!');
    
    // Summary
    const totalIncome = sampleTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.phpEquivalent, 0);
    
    const totalExpenses = sampleTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.phpEquivalent, 0);
    
    console.log(`\n📊 Sample Data Summary:`);
    console.log(`Total Income: ₱${totalIncome.toLocaleString()}`);
    console.log(`Total Expenses: ₱${totalExpenses.toLocaleString()}`);
    console.log(`Net Profit: ₱${(totalIncome - totalExpenses).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error creating sample transactions:', error);
  }
}

/**
 * Test AI Data Service aggregation
 */
async function testAIDataAggregation() {
  console.log('\n🤖 Testing AI Data Service aggregation...');
  
  try {
    // Simulate the getFinancialAggregation method
    const transactionsRef = collection(db, `users/${TEST_USER_ID}/transactions`);
    const q = query(transactionsRef, orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log(`Query returned ${querySnapshot.size} documents`);
    
    if (querySnapshot.size === 0) {
      console.log('❌ No transactions found - AI widgets will show "no data available"');
      return;
    }
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const spendingByCategory = {};
    const recurringExpenses = {};
    let transactionCount = 0;
    
    querySnapshot.forEach((doc) => {
      const transaction = doc.data();
      const amount = transaction.phpEquivalent || 0;
      transactionCount++;
      
      if (transaction.type === 'income') {
        totalIncome += amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += amount;
        
        // Categorize spending
        const category = transaction.category || 'Uncategorized';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
        
        // Track recurring expenses
        if (transaction.isRecurring) {
          const vendor = transaction.vendor || transaction.description;
          recurringExpenses[vendor] = (recurringExpenses[vendor] || 0) + amount;
        }
      }
    });
    
    const aggregation = {
      totalIncome,
      totalExpenses,
      totalSavings: totalIncome - totalExpenses,
      spendingByCategory,
      recurringExpenses,
      transactionCount,
      averageTransactionAmount: transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0
    };
    
    console.log('✅ AI Data Aggregation Results:');
    console.log(`   Total Income: ₱${totalIncome.toLocaleString()}`);
    console.log(`   Total Expenses: ₱${totalExpenses.toLocaleString()}`);
    console.log(`   Total Savings: ₱${aggregation.totalSavings.toLocaleString()}`);
    console.log(`   Transaction Count: ${transactionCount}`);
    console.log(`   Average Transaction: ₱${aggregation.averageTransactionAmount.toLocaleString()}`);
    
    console.log('\n📊 Spending by Category:');
    Object.entries(spendingByCategory).forEach(([category, amount]) => {
      console.log(`   ${category}: ₱${amount.toLocaleString()}`);
    });
    
    if (Object.keys(recurringExpenses).length > 0) {
      console.log('\n🔄 Recurring Expenses:');
      Object.entries(recurringExpenses).forEach(([vendor, amount]) => {
        console.log(`   ${vendor}: ₱${amount.toLocaleString()}`);
      });
    }
    
    // Check if this data would trigger AI insights
    if (totalIncome > 0 || totalExpenses > 0) {
      console.log('\n✅ This data should trigger AI insights generation!');
      console.log('   AI widgets should now show financial analysis instead of "no data available"');
    } else {
      console.log('\n❌ Insufficient data for AI insights');
    }
    
  } catch (error) {
    console.error('❌ Error testing AI data aggregation:', error);
  }
}

/**
 * Main debug function
 */
async function main() {
  try {
    // Step 1: Check existing data
    const existingTransactions = await checkExistingTransactions();
    
    // Step 2: Create sample data if none exists
    if (existingTransactions.length === 0) {
      console.log('\n🤔 No existing data found. Creating sample transactions...');
      await createSampleTransactions();
    } else {
      console.log('\n✅ Existing transactions found. Skipping sample data creation.');
    }
    
    // Step 3: Test AI data aggregation
    await testAIDataAggregation();
    
    // Step 4: Next steps
    console.log('\n🎯 Next Steps:');
    console.log('1. Refresh your dashboard: http://localhost:9002/dashboard');
    console.log('2. Check AI Financial Intelligence widgets');
    console.log('3. Look for financial insights, predictions, and anomaly detection');
    console.log('4. If widgets still show "no data", check browser console for errors');
    
    console.log('\n🔧 Debugging Tips:');
    console.log('- Open browser DevTools and check Network tab for failed requests');
    console.log('- Look for authentication errors in the console');
    console.log('- Verify Firebase rules allow read access for test user');
    console.log('- Check if AI flows are working in Genkit UI: http://localhost:4000');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  } finally {
    console.log('\n✨ Debug complete!');
    process.exit(0);
  }
}

// Run the debug script
main();