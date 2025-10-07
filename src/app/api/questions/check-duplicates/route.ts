import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    const { questionIds, batch } = await request.json();
    
    console.log('🔍 Checking for duplicate questions:', { questionIds, batch });
    
    // Validate inputs
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid question IDs' 
      }, { status: 400 });
    }
    
    if (!batch) {
      return NextResponse.json({ 
        error: 'Batch is required' 
      }, { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

    // Query to find if any of these questions have been used in this batch before
    // We check BOTH:
    // 1. Current carts with this batch (active drafts)
    // 2. Historical usage from question_usage_history table
    
    console.log(`🔍 Checking batch "${batch}" for ${questionIds.length} questions`);
    
    const { data: existingCarts, error: cartsError } = await supabase
      .from('carts')
      .select('id, metadata, test_id, created_at')
      .ilike('metadata->>batch', batch);
    
    if (cartsError) {
      console.error('Error querying carts:', cartsError);
      return NextResponse.json({ 
        error: 'Failed to check for duplicates',
        details: cartsError.message 
      }, { status: 500 });
    }

    console.log(`Found ${existingCarts?.length || 0} existing carts for batch "${batch}"`);

    // Collect all duplicates from multiple sources
    const allDuplicateQuestionIds = new Set<number>();
    const duplicateSourceMap = new Map<number, Array<{testId: string, testName: string, source: string}>>();

    // SOURCE 1: Check current cart_items
    if (existingCarts && existingCarts.length > 0) {
      const cartIds = existingCarts.map(cart => cart.id);
      
      const { data: existingCartItems, error: itemsError } = await supabase
        .from('cart_items')
        .select('question_id, cart_id')
        .in('cart_id', cartIds)
        .in('question_id', questionIds);
      
      if (!itemsError && existingCartItems) {
        console.log(`Found ${existingCartItems.length} duplicates in current carts`);
        
        existingCartItems.forEach(item => {
          const cart = existingCarts.find(c => c.id === item.cart_id);
          if (cart) {
            allDuplicateQuestionIds.add(item.question_id);
            
            if (!duplicateSourceMap.has(item.question_id)) {
              duplicateSourceMap.set(item.question_id, []);
            }
            
            duplicateSourceMap.get(item.question_id)!.push({
              testId: cart.test_id,
              testName: (cart.metadata as any)?.testName || 'Unknown Test',
              source: 'Current Draft'
            });
          }
        });
      }
    }

    // SOURCE 2: Check historical usage from question_usage_history table
    try {
      const { data: historyItems, error: historyError } = await supabase
        .from('question_usage_history')
        .select('question_id, test_name, test_id, used_date')
        .ilike('batch', batch)
        .in('question_id', questionIds);
      
      if (!historyError && historyItems && historyItems.length > 0) {
        console.log(`Found ${historyItems.length} duplicates in usage history`);
        
        historyItems.forEach(item => {
          allDuplicateQuestionIds.add(item.question_id);
          
          if (!duplicateSourceMap.has(item.question_id)) {
            duplicateSourceMap.set(item.question_id, []);
          }
          
          duplicateSourceMap.get(item.question_id)!.push({
            testId: item.test_id || 'historical',
            testName: item.test_name || 'Previous Test',
            source: `Historical (${item.used_date || 'date unknown'})`
          });
        });
      } else if (historyError && !historyError.message.includes('does not exist')) {
        // Log error but don't fail - table might not exist yet
        console.log('Note: question_usage_history table not available:', historyError.message);
      }
    } catch (historyCheckError) {
      console.log('Historical check skipped:', historyCheckError);
    }

    // If no duplicates found from any source
    if (allDuplicateQuestionIds.size === 0) {
      return NextResponse.json({ 
        hasDuplicates: false,
        duplicates: [],
        message: 'No duplicate questions found in current drafts or historical usage'
      });
    }

    // Get details about the duplicate questions
    const duplicateQuestionIds = Array.from(allDuplicateQuestionIds);
    
    // Get question details
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, text, subject, topic')
      .in('id', duplicateQuestionIds);
    
    if (questionsError) {
      console.error('Error querying questions:', questionsError);
    }

    // Map duplicates with their usage details
    const duplicatesWithDetails = duplicateQuestionIds.map(questionId => {
      const question = questions?.find(q => q.id === questionId);
      const sources = duplicateSourceMap.get(questionId) || [];
      
      return {
        questionId,
        questionText: question?.text?.substring(0, 100) + '...' || 'Unknown',
        subject: question?.subject || 'Unknown',
        topic: question?.topic || 'Unknown',
        usedIn: sources.map(s => ({
          testId: s.testId,
          testName: s.testName,
          source: s.source
        })),
        // For backward compatibility, include first usage
        testId: sources[0]?.testId || 'Unknown',
        testName: sources[0]?.testName || 'Unknown Test',
      };
    });

    console.log('⚠️  Found duplicate questions:', duplicatesWithDetails);

    return NextResponse.json({ 
      hasDuplicates: true,
      duplicates: duplicatesWithDetails,
      message: `Found ${duplicatesWithDetails.length} question(s) already used in this batch`,
      totalDuplicates: duplicatesWithDetails.length
    });

  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
    return NextResponse.json({
      error: 'Failed to check for duplicates',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
