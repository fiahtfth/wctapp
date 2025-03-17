// Simple script to test the login API
import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login API...');
    
    // Replace with your deployed URL
    const url = 'https://wctapp-55jhaqp5z-fiahtfth-gmailcoms-projects.vercel.app/api/auth/login';
    
    // Admin credentials
    const credentials = {
      email: 'admin@example.com',
      password: 'StrongPassword123!'
    };
    
    console.log(`Attempting to login with email: ${credentials.email}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Get the raw text response first
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 500) + '...');
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('Login successful!');
        console.log('User:', data.user);
        console.log('Access token received:', !!data.accessToken);
      } else {
        console.error('Login failed:', data.message);
      }
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError.message);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Also test the mock user login
async function testMockUserLogin() {
  try {
    console.log('\nTesting mock user login...');
    
    // Replace with your deployed URL
    const url = 'https://wctapp-55jhaqp5z-fiahtfth-gmailcoms-projects.vercel.app/api/auth/login';
    
    // User credentials
    const credentials = {
      email: 'user@example.com',
      password: 'user123'
    };
    
    console.log(`Attempting to login with email: ${credentials.email}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Get the raw text response first
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 500) + '...');
    
    try {
      // Try to parse the response as JSON
      const data = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('Login successful!');
        console.log('User:', data.user);
        console.log('Access token received:', !!data.accessToken);
      } else {
        console.error('Login failed:', data.message);
      }
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError.message);
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Run the tests
async function runTests() {
  await testLogin();
  await testMockUserLogin();
}

runTests(); 