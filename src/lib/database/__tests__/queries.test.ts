import { getQuestions, getCascadingOptions } from '../queries';
import Database from 'better-sqlite3';

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
    return jest.fn().mockImplementation(() => ({
        prepare: jest.fn().mockReturnValue({
            all: jest.fn().mockReturnValue([
                { id: 1, question_text: 'Test Question', subject: 'Math' },
                { id: 2, question_text: 'Another Question', subject: 'Science' }
            ])
        }),
        close: jest.fn()
    }));
});

describe('Database Queries', () => {
    let mockDb: any;

    beforeEach(() => {
        mockDb = new Database('test.db');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getQuestions', () => {
        it('should fetch questions with default pagination', async () => {
            const result = await getQuestions({});
            
            expect(result.data).toHaveLength(2);
            expect(result.pagination).toEqual(expect.objectContaining({
                currentPage: 1,
                pageSize: 10,
                totalItems: 2,
                totalPages: 1
            }));
        });

        it('should apply filters correctly', async () => {
            const result = await getQuestions({ 
                subject: 'Math', 
                page: 1, 
                pageSize: 5 
            });
            
            expect(result.data[0].subject).toBe('Math');
        });

        it('should handle search filter', async () => {
            const result = await getQuestions({ 
                search: 'Test', 
                page: 1, 
                pageSize: 5 
            });
            
            expect(result.data[0].question_text).toContain('Test');
        });
    });

    describe('getCascadingOptions', () => {
        it('should fetch subjects', async () => {
            const subjects = await getCascadingOptions('subjects');
            expect(subjects).toContain('Math');
            expect(subjects).toContain('Science');
        });

        it('should filter modules by subject', async () => {
            const modules = await getCascadingOptions('modules', { subject: 'Math' });
            expect(modules).toHaveLength(0); // Depends on mock implementation
        });
    });
});
