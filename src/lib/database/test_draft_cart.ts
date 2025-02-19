import { getDatabaseActions, openDatabase, ensureDefaultUser } from './queries.ts';

async function testDraftCartFunctionality() {
  try {
    // Await the database actions
    const databaseActions = await getDatabaseActions();

    // Ensure a default user exists
    const defaultUserId = (await ensureDefaultUser()) || 1;
    console.log('Default User ID:', defaultUserId);

    // Prepare test data
    const testName = 'Test Draft Cart';
    const batch = 'Batch 2024';
    const date = new Date().toISOString();
    const questionIds = [1, 2, 3, 4, 5];

    // Save draft cart
    console.log('Attempting to save draft cart...');
    const draftCartId = await databaseActions.saveDraftCart(
      defaultUserId,
      testName,
      batch,
      date,
      questionIds
    );
    console.log('Draft Cart saved with ID:', draftCartId);

    // Retrieve draft carts
    console.log('Retrieving draft carts...');
    const draftCarts = await databaseActions.getDraftCarts(defaultUserId);
    console.log('Retrieved Draft Carts:', draftCarts);

    // Verify the saved draft cart
    const savedDraftCart = draftCarts.find(cart => cart.id === draftCartId);

    if (!savedDraftCart) {
      throw new Error('Saved draft cart not found in retrieved draft carts');
    }

    console.log('Saved Draft Cart Details:', savedDraftCart);

    // Verify test management insertion
    const db = await openDatabase();
    const testManagementStmt = db.prepare(`
            SELECT * FROM tests 
            WHERE test_name = ? AND batch = ? AND date = ? AND user_id = ?
        `);
    const savedTestInManagement = testManagementStmt.get(testName, batch, date, defaultUserId);

    console.log('Saved Test in Management:', savedTestInManagement);

    // Detailed verification
    console.assert(savedDraftCart.test_name === testName, 'Test name does not match');
    console.assert(savedDraftCart.batch === batch, 'Batch does not match');
    console.assert(
      JSON.stringify(savedDraftCart.questions) === JSON.stringify(questionIds),
      'Question IDs do not match'
    );
    console.assert(savedTestInManagement.status === 'draft', 'Test status is not draft');
    console.assert(
      JSON.parse(savedTestInManagement.questions).toString() === questionIds.toString(),
      'Test management question IDs do not match'
    );

    console.log('Draft Cart Functionality Test: PASSED ✅');
  } catch (error) {
    console.error('Draft Cart Functionality Test: FAILED ❌', error);
    // Log the full error details
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
    });
  }
}

// Run the test
testDraftCartFunctionality();
