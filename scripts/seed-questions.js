#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function seedQuestions() {
  console.log('Seeding questions with new format...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Sample questions in all supported formats with IDs
  const sampleQuestions = [
    // Format 1: "With reference to X, consider the following statements:"
    {
      id: Date.now() + 1,
      text: `With reference to Tertiary activities, consider the following statements: 

1. Tertiary activities involve the commercial output of services rather than the production of tangible goods. 
2. In the initial stages of economic development, larger proportion of people worked in the tertiary sector. 
3. Tertiary activities are directly involved in the processing of physical raw materials. 

How many of the above given statements is/are correct? 
(a) Only One 
(b) Only Two 
(c) All Three 
(d) None`,
      answer: '(a) Only One',
      explanation: 'Statement 1 is correct: Tertiary activities involve the commercial output of services rather than the production of tangible goods. Statement 2 is incorrect: In the initial stages of economic development, larger proportion of people worked in the primary sector, not tertiary. Statement 3 is incorrect: Tertiary activities are not directly involved in processing raw materials; that is the role of secondary activities.',
      subject: 'Economics',
      module_name: 'Economic Development',
      topic: 'Sectors of Economy',
      sub_topic: 'Tertiary Sector',
      difficulty_level: 'Medium',
      question_type: 'Objective',
      nature_of_question: 'Conceptual Understanding'
    },
    // Format 2: "Which of the following..."
    {
      id: Date.now() + 2,
      text: `Which of the following monetary policy actions can play a role in improving a situation of low demand? 
(a) Boosting aggregate demand by printing more currency notes. 
(b) Increasing liquidity in the market by selling bonds to the public. 
(c) Both (a) and (b) 
(d) None of the above`,
      answer: '(a) Boosting aggregate demand by printing more currency notes.',
      explanation: 'Boosting aggregate demand by printing more currency notes can help improve a situation of low demand by putting more money in the hands of consumers, which can lead to increased spending. Option (b) would actually reduce liquidity in the market, which would not help with low demand.',
      subject: 'Economics',
      module_name: 'Monetary Policy',
      topic: 'Demand Management',
      sub_topic: 'Fiscal and Monetary Tools',
      difficulty_level: 'Medium',
      question_type: 'Objective',
      nature_of_question: 'Application'
    },
    // Format 3: "Consider the following statements:" (without "With reference to")
    {
      id: Date.now() + 3,
      text: `Consider the following statements: 

1. Commodities like medicines usually have unitary elastic demand. 
2. Commodities like Air Conditioners usually have high elastic demand. 

Which of the statements given above is/are correct? 
(a) 1 only 
(b) 2 only 
(c) Both 1 and 2 
(d) Neither 1 nor 2`,
      answer: '(b) 2 only',
      explanation: 'Statement 1 is incorrect: Medicines usually have inelastic demand because they are necessities. Statement 2 is correct: Air Conditioners usually have high elastic demand because they are luxuries and consumers can easily postpone their purchase.',
      subject: 'Economics',
      module_name: 'Demand Theory',
      topic: 'Elasticity of Demand',
      sub_topic: 'Price Elasticity',
      difficulty_level: 'Hard',
      question_type: 'Objective',
      nature_of_question: 'Analytical'
    }
  ];
  
  try {
    console.log(`Inserting ${sampleQuestions.length} sample questions...`);
    
    // Insert sample questions
    const { data, error } = await supabase
      .from('questions')
      .insert(sampleQuestions);
    
    if (error) {
      console.error('Error inserting sample questions:', error);
      process.exit(1);
    }
    
    console.log('Sample questions inserted successfully');
    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedQuestions().catch(error => {
  console.error('Unhandled error during seeding:', error);
  process.exit(1);
});
