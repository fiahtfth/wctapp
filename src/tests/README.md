# Cart Testing Tools

This directory contains tools for testing the cart functionality of the application.

## Test Files

- `browser-cart-test.js`: A script that can be run in the browser console to test the cart functionality.
- `cart-api-test.js`: A Node.js script that tests the cart API endpoints.

## How to Use

### Browser Console Script

1. Start the development server: `npm run dev`
2. Open the application in your browser
3. Open the browser console (F12 or Ctrl+Shift+I)
4. Copy and paste the contents of `browser-cart-test.js` into the console
5. Press Enter to run the tests

### API Test Script

1. Start the development server: `npm run dev`
2. Navigate to the `src/tests` directory: `cd src/tests`
3. Install dependencies: `npm install`
4. Run the tests: `npm test`

## Test API Endpoint

The application includes a test API endpoint at `/api/cart/test` that returns the current state of the cart. This endpoint can be used to verify that the cart functionality is working correctly.

### Example Usage

```javascript
// Get the current cart state
fetch('/api/cart/test')
  .then(response => response.json())
  .then(data => console.log(data));

// Get the cart state for a specific test ID
fetch('/api/cart/test?testId=test_123')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Manual Testing

You can also manually test the cart functionality using the helper functions exposed by the browser console script:

```javascript
// Get the local cart
cartTest.getLocalCart();

// Clear the local cart
cartTest.clearLocalCart();

// Get the cart store
cartTest.getCartStore();

// Test adding items to the cart
cartTest.testAddToCart();

// Test removing items from the cart
cartTest.testRemoveFromCart();

// Test saving a draft
cartTest.testSaveDraft();

// Test getting the cart status
cartTest.testCartStatus();
``` 