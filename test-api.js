// Simple script to test the test API route
import fetch from 'node-fetch';

async function testApiGet() {
  try {
    console.log('Testing GET /api/test...');
    
    // Replace with your deployed URL
    const url = 'https://wctapp-lr2897js0-fiahtfth-gmailcoms-projects.vercel.app/api/test';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Get the raw text response first
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('API test successful!');
      } else {
        console.error('API test failed:', data.message);
      }
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError.message);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

async function testApiPost() {
  try {
    console.log('\nTesting POST /api/test...');
    
    // Replace with your deployed URL
    const url = 'https://wctapp-lr2897js0-fiahtfth-gmailcoms-projects.vercel.app/api/test';
    
    // Test data
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message'
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Get the raw text response first
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('API test successful!');
      } else {
        console.error('API test failed:', data.message);
      }
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError.message);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the tests
async function runTests() {
  await testApiGet();
  await testApiPost();
}

runTests(); 