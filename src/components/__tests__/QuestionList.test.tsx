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

// Mock fetch function
global.fetch = jest.fn((url) => {
    // Mock response for cascading filters
    if (url.includes('cascading-filters')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(['Math', 'Science'])
        });
    }

    // Mock response for questions API
    if (url.includes('questions')) {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                data: [
                    {
                        id: 1,
                        question_text: 'What is 2 + 2?',
                        subject: 'Math',
                        topic: 'Basic Arithmetic',
                        difficulty_level: 'easy',
                        nature_of_question: 'MCQ'
                    },
                    {
                        id: 2,
                        question_text: 'What is the capital of France?',
                        subject: 'Geography',
                        topic: 'European Capitals',
                        difficulty_level: 'medium',
                        nature_of_question: 'Short Answer'
                    }
                ],
                pagination: {
                    currentPage: 1,
                    pageSize: 10,
                    totalItems: 2,
                    totalPages: 1
                }
            })
        });
    }

    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
    });
}) as jest.Mock;

describe('QuestionList Component', () => {
    beforeEach(() => {
        global.fetch.mockClear();
    });

    it('renders loading state initially', async () => {
        render(<QuestionList />);

        // Check for loading skeletons
        const skeletons = screen.getAllByTestId('skeleton-loader');
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders questions after loading', async () => {
        render(<QuestionList />);

        // Wait for questions to load
        await waitFor(() => {
            const questions = screen.getAllByText(/What is/i);
            expect(questions.length).toBeGreaterThan(0);
        });
    });

    it('displays no questions message when empty', async () => {
        // Mock empty response
        global.fetch.mockImplementationOnce((url) => {
            if (url.includes('questions')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        data: [],
                        pagination: {
                            currentPage: 1,
                            pageSize: 10,
                            totalItems: 0,
                            totalPages: 0
                        }
                    })
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            });
        });

        render(<QuestionList />);

        // Wait for no questions message
        await waitFor(() => {
            const noQuestionsMessage = screen.getByText(/No questions found/i);
            expect(noQuestionsMessage).toBeInTheDocument();
        });
    });

    it('handles filter changes', async () => {
        render(<QuestionList />);

        // Simulate filter change
        await waitFor(() => {
            const subjectFilter = screen.getByTestId('subject-filter');
            fireEvent.change(subjectFilter, { target: { value: 'Math' } });
        });

        // Verify fetch was called with new filters
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('questions?'),
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });
    });

    it('renders pagination controls', async () => {
        render(<QuestionList />);

        // Wait for questions to load
        await waitFor(() => {
            const paginationControls = screen.getByTestId('pagination-controls');
            expect(paginationControls).toBeInTheDocument();
        });
    });
});
