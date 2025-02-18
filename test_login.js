import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function testLogin() {
    try {
        console.log('Starting login test...');
        
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@example.com',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Login Successful');
            
            // Decode and log token details
            const decodedToken = jwt.decode(data.token);
            console.log('Decoded Token:', JSON.stringify(decodedToken, null, 2));
            
            console.log('Token:', data.token);
            console.log('User:', data.user);
        } else {
            console.error('❌ Login Failed');
            console.error('Error Details:', data.error, data.details);
        }
    } catch (error) {
        console.error('🚨 Test Error:', error);
    }
}

testLogin();
