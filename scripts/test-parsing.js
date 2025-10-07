require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Parse the question text to extract statements and options
function parseQuestion(text) {
  // Handle empty or invalid text
  if (!text || text.trim().length === 0) {
    return { 
      type: 'default',
      questionText: 'No question text available'
    };
  }
  
  // Split text into lines and clean them
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Check for "With reference to" format
  const withReferenceIndex = lines.findIndex(line => 
    line.toLowerCase().startsWith('with reference to')
  );
  
  if (withReferenceIndex >= 0) {
    // Format 1: "With reference to X, consider the following statements:"
    const topicLine = lines[withReferenceIndex]
      .replace('With reference to', '')
      .replace('consider the following statements:', '')
      .replace('consider the following statements', '')
      .replace(',', '')
      .trim();
    
    // Extract statements (numbered items)
    const statements = [];
    let optionsStartIndex = -1;
    
    for (let i = withReferenceIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a statement (starts with a number followed by a period)
      if (/^\d+\.\s*/.test(line)) {
        statements.push(line);
      }
      // Check if this line is the question about how many statements are correct
      else if (line.toLowerCase().includes('how many of the above')) {
        optionsStartIndex = i + 1;
        break;
      }
    }
    
    // Extract options (a) through (d) - handle both (a) and a) formats
    const options = [];
    if (optionsStartIndex > 0) {
      for (let i = optionsStartIndex; i < lines.length && options.length < 4; i++) {
        const line = lines[i];
        if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
          options.push(line);
        }
      }
    }
    
    // If we found statements and options, return this format
    if (statements.length > 0 && options.length > 0) {
      return { 
        type: 'withReference',
        topicLine, 
        statements, 
        options 
      };
    }
  }
  
  // Check for "Consider the following statements" format (without "With reference to")
  const considerStatementsIndex = lines.findIndex(line => 
    line.toLowerCase().includes('consider the following statements')
  );
  
  if (considerStatementsIndex >= 0) {
    // Format 2: "Consider the following statements:"
    
    // Extract statements (numbered items)
    const statements = [];
    let optionsStartIndex = -1;
    
    for (let i = considerStatementsIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a statement (starts with a number followed by a period)
      if (/^\d+\.\s*/.test(line)) {
        statements.push(line);
      }
      // Check if this line is "Which of the statements given above"
      else if (line.toLowerCase().includes('which of the statements given above') || 
               line.toLowerCase().includes('which of the above')) {
        optionsStartIndex = i + 1;
        break;
      }
    }
    
    // Extract options (a) through (d) - handle both (a) and a) formats
    const options = [];
    if (optionsStartIndex > 0) {
      for (let i = optionsStartIndex; i < lines.length && options.length < 4; i++) {
        const line = lines[i];
        if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
          options.push(line);
        }
      }
    }
    
    // If we found statements and options, return this format
    if (statements.length > 0 && options.length > 0) {
      return { 
        type: 'considerStatements',
        statements, 
        options 
      };
    }
  }
  
  // Check for "Which of the following" format
  const whichOfFollowingIndex = lines.findIndex(line => 
    line.toLowerCase().includes('which of the following')
  );
  
  if (whichOfFollowingIndex >= 0) {
    // Format 3: "Which of the following..."
    const questionText = lines[whichOfFollowingIndex];
    
    // Extract options (a) through (d) - handle both (a) and a) formats
    const options = [];
    for (let i = whichOfFollowingIndex + 1; i < lines.length && options.length < 4; i++) {
      const line = lines[i];
      if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
        options.push(line);
      }
    }
    
    // Special handling for question ID 12 - it has options a), b), c), d) without proper formatting
    if (options.length === 3 && lines.some(line => line.toLowerCase().includes('none of the above'))) {
      // Add the missing "d) None of the above" option
      options.push('d) None of the above');
    }
    
    // If we found options, return this format
    if (options.length > 0) {
      return { 
        type: 'whichOfFollowing',
        questionText,
        options 
      };
    }
  }
  
  // Check for numbered list followed by options (like question ID 20)
  const numberedLines = lines.filter(line => /^\d+\.\s+/.test(line));
  if (numberedLines.length > 0) {
    // Find the start of the numbered list
    const firstNumberedIndex = lines.findIndex(line => /^\d+\.\s+/.test(line));
    
    // Extract statements (numbered items)
    const statements = [];
    let questionText = '';
    
    // Collect lines before the numbered list as question text
    if (firstNumberedIndex > 0) {
      questionText = lines.slice(0, firstNumberedIndex).join(' ');
    }
    
    // Collect numbered lines as statements
    for (let i = firstNumberedIndex; i < lines.length; i++) {
      const line = lines[i];
      if (/^\d+\.\s+/.test(line)) {
        statements.push(line);
      } else {
        break;
      }
    }
    
    // Extract options (a) through (d) - handle both (a) and a) formats
    const options = [];
    for (let i = firstNumberedIndex + statements.length; i < lines.length && options.length < 4; i++) {
      const line = lines[i];
      if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
        options.push(line);
      }
    }
    
    // Special case for question ID 20 - it has numbered items but no options in the standard format
    // We'll treat it as a "whichOfFollowing" format with the numbered items as part of the question
    if (statements.length > 0 && options.length === 0) {
      const fullQuestionText = questionText + ' ' + statements.join(' ');
      // Look for any remaining lines that might be options
      const remainingLines = lines.slice(firstNumberedIndex + statements.length);
      const potentialOptions = remainingLines.filter(line => /^[\(]?[a-d][\)]?\.?\s+/.test(line));
      
      if (potentialOptions.length > 0) {
        return { 
          type: 'whichOfFollowing',
          questionText: fullQuestionText,
          options: potentialOptions
        };
      }
    }
    
    // If we found statements and options, return considerStatements format
    if (statements.length > 0 && options.length > 0) {
      return { 
        type: 'considerStatements',
        statements, 
        options 
      };
    }
    
    // If we found statements but no options, treat as whichOfFollowing with the statements as part of question
    if (statements.length > 0) {
      const fullQuestionText = questionText + ' ' + statements.join(' ');
      // Look for options after the statements
      const options = [];
      for (let i = firstNumberedIndex + statements.length; i < lines.length && options.length < 4; i++) {
        const line = lines[i];
        if (/^[\(]?[a-d][\)]?\.?\s+/.test(line)) {
          options.push(line);
        }
      }
      
      if (options.length > 0) {
        return { 
          type: 'whichOfFollowing',
          questionText: fullQuestionText,
          options 
        };
      }
    }
  }
  
  // Check for simple multiple choice format (question followed by options)
  // Look for options at the end of the question
  const options = [];
  let questionLines = [];
  
  // Go through lines from the end to find options
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (/^[\(]?[a-d][\)]?\.?\s+/.test(line) && options.length < 4) {
      options.unshift(line); // Add to beginning to maintain order
    } else {
      // Once we stop finding options, the rest is the question
      questionLines = lines.slice(0, i + 1);
      break;
    }
  }
  
  // If we found options, treat as simple multiple choice
  if (options.length >= 2) {
    return { 
      type: 'whichOfFollowing',
      questionText: questionLines.join(' '),
      options 
    };
  }
  
  // Default case - no special formatting
  return { 
    type: 'default',
    questionText: text
  };
}

async function testParsing() {
  try {
    console.log('Testing question parsing...');
    
    // Get some questions from the database
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id,text')
      .limit(10);
    
    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }
    
    console.log(`Found ${questions.length} questions. Testing parsing...\n`);
    
    // Test parsing for each question
    questions.forEach((question, index) => {
      console.log(`Question ${index + 1} (ID: ${question.id}):`);
      console.log('Original text:');
      console.log(question.text);
      console.log('\nParsed result:');
      
      const parsed = parseQuestion(question.text);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('----------------------------------------\n');
    });
    
    console.log('Parsing test completed.');
  } catch (error) {
    console.error('Error during parsing test:', error);
  }
}

testParsing();
