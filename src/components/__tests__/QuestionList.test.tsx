import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import QuestionList from '../QuestionList';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: () => null,
        entries: () => [],
        has: () => false
    }),
    useRouter: () => ({
        push: jest.fn()
    })
}));

// Mocking fetch
const mockFetch = jest.fn((url) => {
    // Default mock response for questions
    if (url.includes('questions')) {
        return Promise.resolve(new Response(JSON.stringify({
            data: [
                {
                    id: 1,
                    Question: 'What is 2 + 2?',
                    Answer: '4',
                    Subject: 'Math',
                    Topic: 'Basic Arithmetic',
                    'Difficulty Level': 'easy',
                    'Nature of Question': 'MCQ'
                },
                {
                    id: 2,
                    Question: 'What is the capital of France?',
                    Answer: 'Paris',
                    Subject: 'Geography',
                    Topic: 'European Capitals',
                    'Difficulty Level': 'medium',
                    'Nature of Question': 'Short Answer'
                }
            ],
            pagination: {
                currentPage: 1,
                pageSize: 10,
                totalItems: 2,
                totalPages: 1
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    // Specific mock for cascading filters
    if (url.includes('cascading-filters')) {
        return Promise.resolve(new Response(JSON.stringify(['Math', 'Science']), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    // Default response
    return Promise.resolve(new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    }));
});

// Replace global fetch with our mock
global.fetch = mockFetch;

describe('QuestionList Component', () => {
    const mockTestId = 'test-123';

    beforeEach(() => {
        // Reset mock call history
        mockFetch.mockClear();
    });

    it('renders loading state initially', async () => {
        render(<QuestionList testId={mockTestId} />);

        // Check for loading skeletons
        const skeletons = screen.getAllByTestId('skeleton-loader');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders questions after loading', async () => {
        render(<QuestionList testId={mockTestId} />);

        // Wait for questions to load
        await waitFor(() => {
            const questions = screen.getAllByText(/What is/i);
            expect(questions.length).toBeGreaterThan(0);
        });
    });

    it('displays no questions message when empty', async () => {
        // Mock empty response
        mockFetch.mockImplementationOnce((url) => {
            if (url.includes('questions')) {
                return Promise.resolve(new Response(JSON.stringify({
                    data: [],
                    pagination: {
                        currentPage: 1,
                        pageSize: 10,
                        totalItems: 0,
                        totalPages: 0
                    }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
            return Promise.resolve(new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        });

        render(<QuestionList testId={mockTestId} />);

        // Wait for no questions message
        await waitFor(() => {
            const noQuestionsMessage = screen.getByText(/No questions found/i);
            expect(noQuestionsMessage).toBeInTheDocument();
        });
    });

    it('triggers filter change when subject is selected', async () => {
        render(<QuestionList testId={mockTestId} />);

        // Wait for questions to load
        await waitFor(() => {
            const subjectFilter = screen.getByTestId('subject-filter');
            expect(subjectFilter).toBeInTheDocument();
        });

        // Simulate filter change
        const subjectSelect = screen.getByTestId('subject-filter');
        fireEvent.change(subjectSelect, { target: { value: 'Math' } });

        // Verify fetch was called with new filters
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('questions?'),
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });
    });

    it('renders pagination controls', async () => {
        render(<QuestionList testId={mockTestId} />);

        // Wait for questions to load
        await waitFor(() => {
            const paginationControls = screen.getByTestId('pagination-controls');
            expect(paginationControls).toBeInTheDocument();
        });
    });
});
