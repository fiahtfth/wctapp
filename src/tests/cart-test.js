/**
 * Cart Functionality Test Script
 * 
 * This script outlines the steps to manually test the cart functionality.
 * Open the browser console and follow these steps to verify the cart is working correctly.
 */

// Test Plan:

// 1. Adding items to the cart
console.log('--- Test 1: Adding items to the cart ---');
console.log('1. Navigate to the Questions page');
console.log('2. Click the "Add to Cart" button on a question card');
console.log('3. Verify that a success message appears');
console.log('4. Verify that the cart count in the header increases');
console.log('5. Repeat for multiple questions');

// 2. Viewing the cart
console.log('--- Test 2: Viewing the cart ---');
console.log('1. Click on the cart icon in the header');
console.log('2. Verify that the cart page shows all added questions');
console.log('3. Verify that each question shows the correct details (subject, topic, etc.)');

// 3. Removing items from the cart
console.log('--- Test 3: Removing items from the cart ---');
console.log('1. On the cart page, click the remove icon next to a question');
console.log('2. Verify that a success message appears');
console.log('3. Verify that the question is removed from the cart');
console.log('4. Verify that the cart count in the header decreases');

// 4. Exporting the cart
console.log('--- Test 4: Exporting the cart ---');
console.log('1. On the cart page, click the "Export to Excel" button');
console.log('2. Verify that an Excel file is downloaded');
console.log('3. Open the Excel file and verify that it contains all the questions in the cart');
console.log('4. Verify that each question has the correct details (subject, topic, explanation, etc.)');

// 5. Saving a draft cart
console.log('--- Test 5: Saving a draft cart ---');
console.log('1. On the cart page, fill in the test name, batch, and date fields');
console.log('2. Click the "Save Draft" button');
console.log('3. Verify that a success message appears');
console.log('4. Click on "My Drafts" to verify the draft is saved');

// 6. Loading a draft cart
console.log('--- Test 6: Loading a draft cart ---');
console.log('1. Clear the current cart by removing all questions');
console.log('2. Click on "My Drafts"');
console.log('3. Click on a saved draft');
console.log('4. Verify that the questions from the draft are loaded into the cart');
console.log('5. Verify that the test name, batch, and date fields are populated');

// 7. Testing cart persistence
console.log('--- Test 7: Testing cart persistence ---');
console.log('1. Add some questions to the cart');
console.log('2. Refresh the page');
console.log('3. Verify that the questions are still in the cart');
console.log('4. Log out and log back in');
console.log('5. Verify that the questions are still in the cart (if user is authenticated)');

// 8. Testing cart with unauthenticated user
console.log('--- Test 8: Testing cart with unauthenticated user ---');
console.log('1. Log out');
console.log('2. Navigate to the Questions page');
console.log('3. Add some questions to the cart');
console.log('4. Verify that the questions are added to the local cart');
console.log('5. Navigate to the cart page');
console.log('6. Verify that the questions are displayed');
console.log('7. Try to save a draft (should prompt for login)');

// Helper functions for testing in the console
console.log('--- Helper Functions ---');
console.log(`
// Get the current cart items from the store
function getCartItems() {
  return window.__NEXT_DATA__.props.pageProps.cartStore?.questions || [];
}

// Clear the cart (for testing)
function clearCart() {
  localStorage.removeItem('localCart');
  // Reload the page to see the effect
  window.location.reload();
}

// Check if a question is in the cart
function isInCart(questionId) {
  const cartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
  return cartItems.includes(questionId.toString()) || cartItems.includes(Number(questionId));
}
`);

console.log('Copy and paste these functions into the console to use them for testing.'); 