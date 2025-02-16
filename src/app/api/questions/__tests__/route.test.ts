import { NextRequest } from 'next/server';
import { getQuestions } from '@/lib/database/queries';
import { GET } from '../route';

// Mock the database query function
jest.mock('@/lib/database/queries', () => ({
    getQuestions: jest.fn()
}));

// Mock the Request object
class MockRequest extends Request {
    private _url: string;
    private _searchParams: URLSearchParams;

    constructor(url: string, init?: RequestInit) {
        super(url, init);
        this._url = url;
        this._searchParams = new URLSearchParams(new URL(url).search);
    }

    get url() {
        return this._url;
    }

    get searchParams() {
        return this._searchParams;
    }
}

// Mock the NextRequest object
const createMockNextRequest = (url: string, init?: RequestInit): NextRequest => {
    const mockRequest = new MockRequest(url, init);
    return mockRequest as unknown as NextRequest;
};

describe('Questions API Route', () => {
    const mockGetQuestions = getQuestions as jest.MockedFunction<typeof getQuestions>;

    beforeEach(() => {
        mockGetQuestions.mockClear();
    });

    it('should return questions with pagination', async () => {
        // Mock the implementation of getQuestions
        mockGetQuestions.mockResolvedValue({
            data: [
                { id: 1, question_text: 'Test Question 1' },
                { id: 2, question_text: 'Test Question 2' }
            ],
            pagination: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 2,
                totalPages: 1
            }
        });

        // Create a mock request with search params
        const mockRequest = createMockNextRequest('http://localhost/api/questions?page=1&pageSize=10', {
            method: 'GET'
        });

        const response = await GET(mockRequest);
        const result = await response.json();

        expect(result.data).toHaveLength(2);
        expect(result.pagination).toEqual(expect.objectContaining({
            currentPage: 1,
            pageSize: 10,
            totalItems: 2,
            totalPages: 1
        }));
        expect(mockGetQuestions).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            pageSize: 10
        }));
    });

    it('should handle filter parameters', async () => {
        // Mock the implementation of getQuestions
        mockGetQuestions.mockResolvedValue({
            data: [
                { id: 1, question_text: 'Math Question', subject: 'Math' }
            ],
            pagination: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 1,
                totalPages: 1
            }
        });

        // Create a mock request with filter params
        const mockRequest = createMockNextRequest('http://localhost/api/questions?subject=Math&page=1&pageSize=10', {
            method: 'GET'
        });

        const response = await GET(mockRequest);
        const result = await response.json();

        expect(result.data).toHaveLength(1);
        expect(result.data[0].subject).toBe('Math');
        expect(mockGetQuestions).toHaveBeenCalledWith(expect.objectContaining({
            subject: 'Math',
            page: 1,
            pageSize: 10
        }));
    });
});
