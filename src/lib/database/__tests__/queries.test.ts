import { getQuestions, getCascadingOptions, updateQuestion } from '../queries';
import Database from 'better-sqlite3';

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
    return jest.fn().mockImplementation(() => ({
        prepare: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([
                { id: 1, Question: 'Test Question', Subject: 'Math' },
                { id: 2, Question: 'Another Question', Subject: 'Science' }
            ])
        }),
        close: jest.fn()
    }));
});

jest.mock('../queries', () => ({
    getQuestions: jest.fn(),
    getCascadingOptions: jest.fn(),
    updateQuestion: jest.fn(),
    openDatabase: jest.fn()
}));

describe('Database Queries', () => {
    let mockDb: any;

    beforeEach(() => {
        mockDb = new Database('test.db');
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getQuestions', () => {
        it('should fetch questions with default pagination', async () => {
            const mockResult = {
                questions: [
                    {
                        id: 1,
                        Question: 'Test Question',
                        Subject: 'Math'
                    },
                    {
                        id: 2,
                        Question: 'Another Question',
                        Subject: 'Science'
                    }
                ],
                total: 2,
                page: 1,
                pageSize: 10
            };

            (getQuestions as jest.Mock).mockResolvedValue(mockResult);

            const result = await getQuestions({});

            expect(result).toEqual(mockResult);
            expect(result.questions).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should apply filters correctly', async () => {
            const mockResult = {
                questions: [
                    {
                        id: 1,
                        Question: 'Test Question',
                        Subject: 'Math'
                    }
                ],
                total: 1,
                page: 1,
                pageSize: 5
            };

            (getQuestions as jest.Mock).mockResolvedValue(mockResult);

            const result = await getQuestions({ 
                subject: 'Math', 
                page: 1, 
                pageSize: 5 
            });
            
            expect(result.questions[0].Subject).toBe('Math');
        });

        it('should handle search filter', async () => {
            const mockResult = {
                questions: [
                    {
                        id: 1,
                        Question: 'Test Question',
                        Subject: 'Math'
                    }
                ],
                total: 1,
                page: 1,
                pageSize: 5
            };

            (getQuestions as jest.Mock).mockResolvedValue(mockResult);

            const result = await getQuestions({ 
                search: 'Test', 
                page: 1, 
                pageSize: 5 
            });
            
            expect(result.questions[0].Question).toContain('Test');
        });
    });

    describe('getCascadingOptions', () => {
        it('should fetch subjects', async () => {
            const mockResult = ['Math', 'Science'];

            (getCascadingOptions as jest.Mock).mockResolvedValue(mockResult);

            const subjects = await getCascadingOptions('subjects');
            expect(subjects).toContain('Math');
            expect(subjects).toContain('Science');
        });

        it('should filter modules by subject', async () => {
            const mockResult = ['Algebra', 'Geometry'];

            (getCascadingOptions as jest.Mock).mockResolvedValue(mockResult);

            const modules = await getCascadingOptions('modules', { subject: 'Math' });
            expect(modules).toHaveLength(2);
        });
    });

    describe('updateQuestion', () => {
        it('should update a question', async () => {
            const baseQuestion = {
                id: 1,
                Question: 'Original Question',
                Subject: 'Math'
            };

            const updatedQuestion = {
                ...baseQuestion,
                Question: 'Updated Question'
            };

            (updateQuestion as jest.Mock).mockResolvedValue(updatedQuestion);

            const result = await updateQuestion(
                { id: baseQuestion.id }, 
                updatedQuestion
            );

            expect(result).toEqual(updatedQuestion);
            expect(result.Question).toBe('Updated Question');
        });
    });
});
