import { addQuestion, Question } from '@/types/question';
async function testQuestionSubmission() {
    console.log('🧪 Starting Question Submission Test 🧪');
    // Test case 1: Complete question submission
    try {
        const completeQuestion: Question = {
            id: 1,
            Question: 'What is the capital of France?',
            Answer: 'Paris',
            Subject: 'Geography',
            ModuleName: 'World Capitals',
            Topic: 'European Capitals',
            QuestionType: 'Objective',
            ModuleNumber: '1',
            FacultyApproved: true,
            DifficultyLevel: 'easy',
            Explanation: 'Paris is the capital and largest city of France.',
            Objective: 'Test geographical knowledge',
            NatureOfQuestion: 'Factual',
            SubTopic: 'European Geography',
            MicroTopic: 'Capital Cities'
        };
        console.log('Attempting to submit complete question...');
        const result = await addQuestion(completeQuestion);
        console.log('✅ Complete Question Submitted Successfully! ID:', result.id);
        // Test case 2: Minimal required fields
        const minimalQuestion: Question = {
            id: 2,
            Question: 'What is 2 + 2?',
            Answer: '4',
            Subject: 'Mathematics',
            QuestionType: 'Objective',
            Topic: 'Basic Arithmetic',
            FacultyApproved: false
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
testQuestionSubmission().catch(console.error);
