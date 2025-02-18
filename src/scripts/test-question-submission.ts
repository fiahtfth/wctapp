import { addQuestion, Question } from '@/types/question';

async function testQuestionSubmission() {
    console.log('🧪 Starting Question Submission Test 🧪');

    // Test case 1: Complete question submission
    try {
        const completeQuestion: Question = {
            Question: 'What is the capital of France?',
            Answer: 'Paris',
            Subject: 'Geography',
            'Module Name': 'World Capitals',
            Topic: 'European Capitals',
            Question_Type: 'Multiple Choice',
            'Module Number': '1',
            'Faculty Approved': true,
            'Difficulty Level': 'Easy',
            Explanation: 'Paris is the capital and largest city of France.',
            Objective: 'Test geographical knowledge',
            'Nature of Question': 'Factual',
            'Sub Topic': 'European Geography',
            'Micro Topic': 'Capital Cities'
        };

        console.log('Attempting to submit complete question...');
        const result = await addQuestion(completeQuestion);
        console.log('✅ Complete Question Submitted Successfully! ID:', result.id);

        // Test case 2: Minimal required fields
        const minimalQuestion: Question = {
            Question: 'What is 2 + 2?',
            Answer: '4',
            Subject: 'Mathematics',
            Question_Type: 'Calculation'
        };

        console.log('Attempting to submit minimal question...');
        const minimalResult = await addQuestion(minimalQuestion);
        console.log('✅ Minimal Question Submitted Successfully! ID:', minimalResult.id);

        // Test case 3: Missing required fields
        try {
            const incompleteQuestion: Partial<Question> = {
                Question: 'Incomplete question',
                Subject: 'Test Subject'
            };

            console.log('Attempting to submit incomplete question...');
            // @ts-ignore - intentionally passing incomplete data
            await addQuestion(incompleteQuestion);
            console.error('❌ Error: Incomplete question should not be submitted');
        } catch (error) {
            console.log('✅ Correctly prevented submission of incomplete question');
            console.log('Error:', (error as Error).message);
        }

        console.log('🎉 All Question Submission Tests Completed Successfully! 🎉');
    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

// Run the test
testQuestionSubmission().catch(console.error);
