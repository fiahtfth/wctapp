/**
 * Comprehensive Cart API Test Script
 * 
 * This script tests various cart operations using the API endpoints.
 * It can be used to verify that the cart functionality is working correctly.
 * 
 * Usage: node src/tests/cart-api-test.js
 */

// Import required modules
import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_ID = `test_${Date.now()}`;
const MOCK_QUESTIONS = [1, 2, 3, 4, 5]; // Example question IDs
const MOCK_USER_ID = 'test-user-id'; // Mock user ID for testing

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);
  
  console.log(`Request to: ${url}`);
  console.log(`Status: ${response.status}`);
  
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await response.json();
  } else {
    const text = await response.text();
    console.log('Response is not JSON. First 200 characters:');
    console.log(text.substring(0, 200) + '...');
    return { error: 'Response is not JSON', text: text.substring(0, 200) };
  }
}

// Test functions
async function testCartStatus() {
  console.log('\n=== Testing Cart Status ===');
  const result = await makeRequest('/cart/test');
  console.log('Cart Status:', JSON.stringify(result, null, 2));
  return result;
}

async function testCartStatusWithTestId() {
  console.log('\n=== Testing Cart Status with Test ID ===');
  const result = await makeRequest(`/cart/test?testId=${TEST_ID}`);
  console.log('Cart Status with Test ID:', JSON.stringify(result, null, 2));
  return result;
}

async function testAddToCart() {
  console.log('\n=== Testing Add to Cart ===');
  
  // Add each question to the cart
  const results = [];
  for (const questionId of MOCK_QUESTIONS) {
    console.log(`Adding question ${questionId} to cart...`);
    const result = await makeRequest('/cart/question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        questionId,
        testId: TEST_ID,
        userId: MOCK_USER_ID
      })
    });
    results.push(result);
  }
  
  console.log('Add to Cart Results:', JSON.stringify(results, null, 2));
  return results;
}

async function testSaveDraft() {
  console.log('\n=== Testing Save Draft ===');
  
  const draftData = {
    testId: TEST_ID,
    testName: 'API Test Draft',
    testBatch: 'API Test Batch',
    testDate: new Date().toISOString().split('T')[0],
    questionIds: MOCK_QUESTIONS,
    userId: 1 // Use a valid numeric user ID
  };
  
  const result = await makeRequest('/cart/draft', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(draftData)
  });
  
  console.log('Save Draft Result:', JSON.stringify(result, null, 2));
  return result;
}

async function testLoadDraft() {
  console.log('\n=== Testing Load Draft ===');
  
  // For GET requests with a body, we need to use a different approach
  const result = await makeRequest(`/cart/draft?testId=${TEST_ID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': MOCK_USER_ID // Pass user ID in header for GET request
    }
  });
  
  console.log('Load Draft Result:', JSON.stringify(result, null, 2));
  return result;
}

async function testExportCart() {
  console.log('\n=== Testing Export Cart ===');
  
  // Note: This will likely return a binary file, not JSON
  console.log('Export functionality typically returns a file download, not testable via API directly');
  
  const result = await makeRequest('/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      questions: MOCK_QUESTIONS.map(id => ({ 
        id, 
        text: `Question ${id}`, 
        explanation: `Explanation for question ${id}`,
        subject: 'Test Subject',
        topic: 'Test Topic',
        subtopic: 'Test Subtopic',
        microtopic: 'Test Microtopic',
        difficulty: 'Medium'
      })),
      testName: 'API Test Export',
      testBatch: 'API Test Batch',
      testDate: new Date().toISOString().split('T')[0],
      testId: TEST_ID
    })
  });
  
  console.log('Export Result:', typeof result === 'object' ? JSON.stringify(result, null, 2) : 'Binary data received');
  return result;
}

async function testRemoveFromCart() {
  console.log('\n=== Testing Remove from Cart ===');
  
  // Remove the first question from the cart
  const questionId = MOCK_QUESTIONS[0];
  console.log(`Removing question ${questionId} from cart...`);
  
  const result = await makeRequest('/cart/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      questionId,
      testId: TEST_ID,
      userId: 1 // Use a valid numeric user ID
    })
  });
  
  console.log('Remove from Cart Result:', JSON.stringify(result, null, 2));
  return result;
}

// Main test function
async function runTests() {
  try {
    console.log('Starting Cart API Tests...');
    console.log(`Using test ID: ${TEST_ID}`);
    console.log(`Mock user ID: ${MOCK_USER_ID}`);
    console.log(`Mock questions: ${MOCK_QUESTIONS.join(', ')}`);
    
    // Run tests in sequence
    await testCartStatus();
    await testCartStatusWithTestId();
    await testAddToCart();
    await testCartStatus(); // Check cart status after adding items
    await testSaveDraft();
    await testLoadDraft();
    await testRemoveFromCart();
    await testCartStatus(); // Check cart status after removing an item
    await testExportCart();
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 