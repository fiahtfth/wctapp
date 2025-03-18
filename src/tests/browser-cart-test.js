/**
 * Browser-based Cart Test Script
 * 
 * This script can be run in the browser console to test the cart functionality.
 * Copy and paste the entire script into the browser console and run it.
 */

(function() {
  // Configuration
  const TEST_ID = `test_${Date.now()}`;
  const MOCK_QUESTIONS = [1, 2, 3, 4, 5]; // Example question IDs
  const USER_ID = 1; // Use a valid numeric user ID
  
  // Helper function to make API requests
  async function makeRequest(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    console.log(`Request to: ${url}`);
    
    try {
      const response = await fetch(url, options);
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
    } catch (error) {
      console.error('Request error:', error);
      return { error: error.message };
    }
  }
  
  // Test functions
  async function testCartStatus() {
    console.log('\n=== Testing Cart Status ===');
    const result = await makeRequest('/cart/test');
    console.log('Cart Status:', result);
    return result;
  }
  
  async function testCartStatusWithTestId() {
    console.log('\n=== Testing Cart Status with Test ID ===');
    const result = await makeRequest(`/cart/test?testId=${TEST_ID}`);
    console.log('Cart Status with Test ID:', result);
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
          userId: USER_ID
        })
      });
      results.push(result);
    }
    
    console.log('Add to Cart Results:', results);
    return results;
  }
  
  async function testSaveDraft() {
    console.log('\n=== Testing Save Draft ===');
    
    const draftData = {
      testId: TEST_ID,
      testName: 'Browser Test Draft',
      testBatch: 'Browser Test Batch',
      testDate: new Date().toISOString().split('T')[0],
      questionIds: MOCK_QUESTIONS,
      userId: USER_ID
    };
    
    const result = await makeRequest('/cart/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftData)
    });
    
    console.log('Save Draft Result:', result);
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
        userId: USER_ID
      })
    });
    
    console.log('Remove from Cart Result:', result);
    return result;
  }
  
  // Helper functions for manual testing
  function getLocalCart() {
    const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
    console.log('Local Cart:', localCart);
    return localCart;
  }
  
  function clearLocalCart() {
    localStorage.removeItem('localCart');
    console.log('Local cart cleared');
  }
  
  function getCartStore() {
    // Try to access the cart store from Next.js
    try {
      const cartStore = window.__NEXT_DATA__.props.pageProps.cartStore;
      console.log('Cart Store:', cartStore);
      return cartStore;
    } catch (error) {
      console.error('Error accessing cart store:', error);
      return null;
    }
  }
  
  // Main test function
  async function runTests() {
    try {
      console.log('Starting Browser Cart Tests...');
      console.log(`Using test ID: ${TEST_ID}`);
      console.log(`Using user ID: ${USER_ID}`);
      console.log(`Mock questions: ${MOCK_QUESTIONS.join(', ')}`);
      
      // Run tests in sequence
      await testCartStatus();
      await testCartStatusWithTestId();
      await testAddToCart();
      await testCartStatus(); // Check cart status after adding items
      await testSaveDraft();
      await testRemoveFromCart();
      await testCartStatus(); // Check cart status after removing an item
      
      // Check local storage
      console.log('\n=== Checking Local Storage ===');
      getLocalCart();
      
      // Check cart store
      console.log('\n=== Checking Cart Store ===');
      getCartStore();
      
      console.log('\nAll tests completed!');
      
      // Expose helper functions to the global scope for manual testing
      window.cartTest = {
        getLocalCart,
        clearLocalCart,
        getCartStore,
        testAddToCart,
        testRemoveFromCart,
        testSaveDraft,
        testCartStatus
      };
      
      console.log('\nHelper functions exposed as window.cartTest for manual testing:');
      console.log('- cartTest.getLocalCart()');
      console.log('- cartTest.clearLocalCart()');
      console.log('- cartTest.getCartStore()');
      console.log('- cartTest.testAddToCart()');
      console.log('- cartTest.testRemoveFromCart()');
      console.log('- cartTest.testSaveDraft()');
      console.log('- cartTest.testCartStatus()');
    } catch (error) {
      console.error('Error running tests:', error);
    }
  }
  
  // Run the tests
  runTests();
})(); 