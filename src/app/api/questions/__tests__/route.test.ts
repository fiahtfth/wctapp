// Mock next/server
jest.mock('next/server', () => ({
    NextRequest: jest.fn(),
    NextResponse: {
        json: jest.fn((data, options) => {
            // Create a mock Response-like object
            return {
                json: () => Promise.resolve(data),
                status: options?.status || 200,
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            };
        })
    }
}));

import { NextRequest, NextResponse } from 'next/server';
import { getQuestions } from '@/lib/database/queries';
import { GET } from '../route';

// Mock the queries module
jest.mock('@/lib/database/queries', () => ({
    getQuestions: jest.fn(),
}));

describe('Questions API Route', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return questions with pagination', async () => {
        const mockQuestions = {
            questions: [
                {
                    id: 1,
                    Question: 'Test Question 1',
                    Answer: 'Answer 1',
                    Subject: 'Math',
                    'Module Name': 'Algebra',
                    'Module Number': '101',
                    Topic: 'Linear Equations'
                },
                {
                    id: 2,
                    Question: 'Test Question 2',
                    Answer: 'Answer 2',
                    Subject: 'Science',
                    'Module Name': 'Physics',
                    'Module Number': '201',
                    Topic: 'Mechanics'
                }
            ],
            total: 2,
            page: 1,
            pageSize: 10
        };

        (getQuestions as jest.Mock).mockResolvedValue(mockQuestions);

        const mockRequest = {
            url: 'http://localhost/api/questions?page=1&pageSize=10',
            nextUrl: {
                searchParams: new URLSearchParams({
                    page: '1',
                    pageSize: '10'
                })
            }
        } as unknown as NextRequest;

        const response = await GET(mockRequest);
        const result = await response.json();

        expect(result).toEqual(mockQuestions);
        expect(result.questions).toHaveLength(2);
        expect(result.total).toBe(2);
        expect(getQuestions).toHaveBeenCalledWith({
            page: 1,
            pageSize: 10
        });
    });

    it('should apply filters correctly', async () => {
        const mockQuestions = {
            questions: [
                {
                    id: 1,
                    Question: 'Test Question 1',
                    Answer: 'Answer 1',
                    Subject: 'Math',
                    'Module Name': 'Algebra',
                    'Module Number': '101',
                    Topic: 'Linear Equations'
                }
            ],
            total: 1,
            page: 1,
            pageSize: 10
        };

        (getQuestions as jest.Mock).mockResolvedValue(mockQuestions);

        const mockRequest = {
            url: 'http://localhost/api/questions?page=1&pageSize=10&subject=Math',
            nextUrl: {
                searchParams: new URLSearchParams({
                    page: '1',
                    pageSize: '10',
                    subject: 'Math'
                })
            }
        } as unknown as NextRequest;

        const response = await GET(mockRequest);
        const result = await response.json();

        expect(result).toEqual(mockQuestions);
        expect(result.questions[0].Subject).toBe('Math');
        expect(getQuestions).toHaveBeenCalledWith({
            page: 1,
            pageSize: 10,
            subject: ['Math']
        });
    });
});
