// Simple test script to verify the cart API endpoint
// Run with: node test-cart-api.js
import fetch from 'node-fetch';

const testCartAPI = async () => {
  try {
    console.log('Testing cart API endpoint...');
    
    // Test without authentication
    console.log('\n1. Testing without authentication:');
    const noAuthResponse = await fetch('http://localhost:3000/api/cart/test');
    console.log('Status:', noAuthResponse.status);
    console.log('Content-Type:', noAuthResponse.headers.get('content-type'));
    
    // Check if response is JSON or HTML
    const contentType = noAuthResponse.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const noAuthData = await noAuthResponse.json();
      console.log('Response (JSON):', JSON.stringify(noAuthData, null, 2));
    } else {
      // Handle HTML or other response types
      const text = await noAuthResponse.text();
      console.log('Response is not JSON. First 200 characters:');
      console.log(text.substring(0, 200) + '...');
    }
    
    // Test with a test ID
    console.log('\n2. Testing with a specific test ID:');
    const testIdResponse = await fetch('http://localhost:3000/api/cart/test?testId=test-123');
    console.log('Status:', testIdResponse.status);
    console.log('Content-Type:', testIdResponse.headers.get('content-type'));
    
    // Check if response is JSON or HTML
    const testIdContentType = testIdResponse.headers.get('content-type') || '';
    if (testIdContentType.includes('application/json')) {
      const testIdData = await testIdResponse.json();
      console.log('Response (JSON):', JSON.stringify(testIdData, null, 2));
    } else {
      // Handle HTML or other response types
      const text = await testIdResponse.text();
      console.log('Response is not JSON. First 200 characters:');
      console.log(text.substring(0, 200) + '...');
    }
    
    // Test with a mock authorization header
    console.log('\n3. Testing with mock authorization:');
    const mockAuthResponse = await fetch('http://localhost:3000/api/cart/test', {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    console.log('Status:', mockAuthResponse.status);
    console.log('Content-Type:', mockAuthResponse.headers.get('content-type'));
    
    // Check if response is JSON or HTML
    const mockAuthContentType = mockAuthResponse.headers.get('content-type') || '';
    if (mockAuthContentType.includes('application/json')) {
      const mockAuthData = await mockAuthResponse.json();
      console.log('Response (JSON):', JSON.stringify(mockAuthData, null, 2));
    } else {
      // Handle HTML or other response types
      const text = await mockAuthResponse.text();
      console.log('Response is not JSON. First 200 characters:');
      console.log(text.substring(0, 200) + '...');
    }
    
    console.log('\nTests completed!');
  } catch (error) {
    console.error('Error testing cart API:', error);
  }
};

// Run the tests
testCartAPI(); 