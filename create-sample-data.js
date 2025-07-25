/**
 * Create sample financial data for testing AI widgets
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase config (using local environment)
const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TEST_USER_ID = 'dev-test-user-123';

async function createSampleTransactions() {
  console.log('Creating sample financial data for AI testing...');
  
  // Sample income transactions (last 3 months)
  const incomeTransactions = [
    {
      type: 'income',
      amount: 45000,
      amountPHP: 45000,
      phpEquivalent: 45000,
      currency: 'PHP',
      description: 'Web Development Project - E-commerce Site',
      category: 'Client Payment',
      clientId: 'client-1',
      date: Timestamp.fromDate(new Date('2024-11-01')),
      status: 'Completed',
      vendor: 'Tech Solutions Inc',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'income',
      amount: 32000,
      amountPHP: 32000,
      phpEquivalent: 32000,
      currency: 'PHP',
      description: 'Consulting Services - System Architecture',
      category: 'Consulting Fee',
      clientId: 'client-2',
      date: Timestamp.fromDate(new Date('2024-11-15')),
      status: 'Completed',
      vendor: 'StartupXYZ',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'income',
      amount: 68500,
      amountPHP: 68500,
      phpEquivalent: 68500,
      currency: 'PHP',
      description: 'Mobile App Development - iOS/Android',
      category: 'Project Payment',
      clientId: 'client-3',
      date: Timestamp.fromDate(new Date('2024-12-05')),
      status: 'Completed',
      vendor: 'Mobile Innovations Corp',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  // Sample expense transactions
  const expenseTransactions = [
    {
      type: 'expense',
      amount: 8500,
      amountPHP: 8500,
      phpEquivalent: 8500,
      currency: 'PHP',
      description: 'Office Supplies - Desk, Chair, Monitor',
      category: 'Office Supplies',
      date: Timestamp.fromDate(new Date('2024-11-03')),
      status: 'Completed',
      vendor: 'Office Depot PH',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'expense',
      amount: 3200,
      amountPHP: 3200,
      phpEquivalent: 3200,
      currency: 'PHP',
      description: 'Internet & Utilities - Monthly Bill',
      category: 'Internet & Phone',
      date: Timestamp.fromDate(new Date('2024-11-08')),
      status: 'Completed',
      vendor: 'PLDT',
      isRecurring: true,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'expense',
      amount: 15000,
      amountPHP: 15000,
      phpEquivalent: 15000,
      currency: 'PHP',
      description: 'Software Subscriptions - Adobe, Figma, Notion',
      category: 'Software Subscriptions',
      date: Timestamp.fromDate(new Date('2024-11-12')),
      status: 'Completed',
      vendor: 'Multiple Vendors',
      isRecurring: true,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'expense',
      amount: 4500,
      amountPHP: 4500,
      phpEquivalent: 4500,
      currency: 'PHP',
      description: 'Food & Dining - Client Meeting Lunch',
      category: 'Client Entertainment',
      date: Timestamp.fromDate(new Date('2024-11-20')),
      status: 'Completed',
      vendor: 'The Peninsula Manila',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'expense',
      amount: 6800,
      amountPHP: 6800,
      phpEquivalent: 6800,
      currency: 'PHP',
      description: 'Transportation - Grab rides for client meetings',
      category: 'Transportation',
      date: Timestamp.fromDate(new Date('2024-11-25')),
      status: 'Completed',
      vendor: 'Grab Philippines',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'expense',
      amount: 2500,
      amountPHP: 2500,
      phpEquivalent: 2500,
      currency: 'PHP',
      description: 'Domain & Hosting - Annual renewal',
      category: 'Professional Services',
      date: Timestamp.fromDate(new Date('2024-12-01')),
      status: 'Completed',
      vendor: 'GoDaddy',
      isRecurring: true,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      type: 'expense',
      amount: 1050,
      amountPHP: 1050,
      phpEquivalent: 1050,
      currency: 'PHP',
      description: 'Coffee & Co-working Space',
      category: 'Office Supplies',
      date: Timestamp.fromDate(new Date('2024-12-10')),
      status: 'Completed',
      vendor: 'WeWork BGC',
      isRecurring: false,
      userId: TEST_USER_ID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  try {
    // Add income transactions
    console.log('Adding income transactions...');
    for (const transaction of incomeTransactions) {
      await addDoc(collection(db, `users/${TEST_USER_ID}/transactions`), transaction);
      console.log(`✅ Added income: ${transaction.description} - ₱${transaction.amount.toLocaleString()}`);
    }

    // Add expense transactions
    console.log('Adding expense transactions...');
    for (const transaction of expenseTransactions) {
      await addDoc(collection(db, `users/${TEST_USER_ID}/transactions`), transaction);
      console.log(`✅ Added expense: ${transaction.description} - ₱${transaction.amount.toLocaleString()}`);
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('\nSummary:');
    console.log(`Total Income: ₱${incomeTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`);
    console.log(`Total Expenses: ₱${expenseTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`);
    console.log(`Net Profit: ₱${(incomeTransactions.reduce((sum, t) => sum + t.amount, 0) - expenseTransactions.reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}`);
    console.log('\nThe AI Financial Intelligence widgets should now display insights!');
    
  } catch (error) {
    console.error('Error creating sample data:', error);
    
    // If using Firestore emulator, the connection might fail
    // In that case, let's provide instructions for manual data creation
    console.log('\n📝 Manual data creation needed:');
    console.log('1. Start your Firestore emulator or connect to your Firebase project');
    console.log('2. Add the transactions shown above to the users/dev-test-user-123/transactions collection');
    console.log('3. Refresh the dashboard to see AI insights');
  }
}

// Add sample categories
async function createSampleCategories() {
  const categories = [
    { name: 'Client Payment', type: 'income', color: '#10B981', userId: TEST_USER_ID },
    { name: 'Consulting Fee', type: 'income', color: '#059669', userId: TEST_USER_ID },
    { name: 'Project Payment', type: 'income', color: '#047857', userId: TEST_USER_ID },
    { name: 'Office Supplies', type: 'expense', color: '#EF4444', userId: TEST_USER_ID },
    { name: 'Software Subscriptions', type: 'expense', color: '#F59E0B', userId: TEST_USER_ID },
    { name: 'Internet & Phone', type: 'expense', color: '#8B5CF6', userId: TEST_USER_ID },
    { name: 'Client Entertainment', type: 'expense', color: '#EC4899', userId: TEST_USER_ID },
    { name: 'Transportation', type: 'expense', color: '#06B6D4', userId: TEST_USER_ID },
    { name: 'Professional Services', type: 'expense', color: '#84CC16', userId: TEST_USER_ID }
  ];

  try {
    console.log('Creating sample categories...');
    for (const category of categories) {
      await addDoc(collection(db, `users/${TEST_USER_ID}/categories`), {
        ...category,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    console.log('✅ Sample categories created!');
  } catch (error) {
    console.error('Error creating categories:', error);
  }
}

// Run the data creation
async function main() {
  await createSampleCategories();
  await createSampleTransactions();
}

main().catch(console.error);