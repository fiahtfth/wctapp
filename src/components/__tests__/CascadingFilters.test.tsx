import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import CascadingFilters from '../CascadingFilters';

// Extend Jest matchers
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toBeEnabled(): R;
        }
    }
}

// Mock MUI components
jest.mock('@mui/material', () => {
    const originalModule = jest.requireActual('@mui/material');
    return {
        ...originalModule,
        Select: jest.fn(({ children, ...props }) => (
            <div data-testid="mocked-select" {...props}>
                {children}
            </div>
        )),
        MenuItem: jest.fn(({ children, value, ...props }) => (
            <div role="option" data-value={value} {...props}>
                {children}
            </div>
        ))
    };
});

// Mock fetch to return predefined data
jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: () => null
    })
}));

// Mock timer functions
jest.useFakeTimers();

global.fetch = jest.fn((url) => {
    console.log('Mocked fetch called with URL:', url);
    if (url.includes('cascading-filters')) {
        if (url.includes('level=subjects')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(['Math', 'Science'])
            });
        }
        if (url.includes('level=modules')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(['Algebra', 'Geometry'])
            });
        }
        if (url.includes('level=question_types')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(['Multiple Choice', 'Short Answer'])
            });
        }
    }
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
    });
}) as jest.Mock;

describe('CascadingFilters Component', () => {
    const mockOnFilterChange = jest.fn((filters) => {
        console.log('mockOnFilterChange called with:', filters);
    });

    beforeEach(() => {
        mockOnFilterChange.mockClear();
        global.fetch.mockClear();
        jest.clearAllTimers();
    });

    it('renders initial filters', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        await act(async () => {
            render(<CascadingFilters onFilterChange={mockOnFilterChange} />);
        });

        // Wait for subjects to load
        await waitFor(() => {
            expect(screen.getByTestId('subject-filter')).toBeInTheDocument();
            expect(screen.getByTestId('module-filter')).toBeInTheDocument();
            expect(screen.getByTestId('topic-filter')).toBeInTheDocument();
            expect(screen.getByTestId('sub-topic-filter')).toBeInTheDocument();
            expect(screen.getByTestId('question-type-filter')).toBeInTheDocument();
            expect(screen.getByTestId('search-filter')).toBeInTheDocument();
        });

        // Fast-forward timers to trigger initial filter change
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        // Verify the initial filter change
        expect(mockOnFilterChange).toHaveBeenCalledWith({
            subject: undefined,
            module: undefined,
            topic: undefined,
            sub_topic: undefined,
            nature_of_question: undefined,
            search: undefined
        });
    });

    it('loads subjects on initial render', async () => {
        await act(async () => {
            render(<CascadingFilters onFilterChange={mockOnFilterChange} />);
        });

        // Wait for subjects to load
        await waitFor(() => {
            const subjectSelect = screen.getByTestId('subject-filter');
            expect(subjectSelect).toBeInTheDocument();
        });
    });

    it('triggers filter change when subject is selected', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        await act(async () => {
            render(<CascadingFilters onFilterChange={mockOnFilterChange} />);
        });

        // Wait for subjects to load
        await waitFor(() => {
            const subjectSelect = screen.getByTestId('subject-filter');
            expect(subjectSelect).toBeInTheDocument();
        });

        // Clear initial filter change call
        mockOnFilterChange.mockClear();

        // Open the subject dropdown
        const subjectSelect = screen.getByTestId('subject-filter');
        await act(async () => {
            await user.click(subjectSelect);
        });

        // Select 'Math'
        const mathOption = await screen.findByText('Math');
        await act(async () => {
            await user.click(mathOption);
        });

        // Fast-forward timers to trigger debounce
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        // Verify the mock function was called
        expect(mockOnFilterChange).toHaveBeenCalledTimes(1);

        // Get the last call arguments
        const lastCall = mockOnFilterChange.mock.calls[0][0];
        console.log('Last call arguments:', lastCall);

        // Check if onFilterChange was called with correct subject
        expect(lastCall).toEqual({
            subject: 'Math',
            module: undefined,
            topic: undefined,
            sub_topic: undefined,
            nature_of_question: undefined,
            search: undefined
        });
    });

    it('handles search input', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        await act(async () => {
            render(<CascadingFilters onFilterChange={mockOnFilterChange} />);
        });

        // Clear initial filter change call
        mockOnFilterChange.mockClear();

        const searchInput = screen.getByTestId('search-filter');
        
        await act(async () => {
            await user.type(searchInput, 'test query');
        });

        // Fast-forward timers to trigger debounce
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        // Verify the mock function was called
        expect(mockOnFilterChange).toHaveBeenCalledTimes(1);

        // Get the last call arguments
        const lastCall = mockOnFilterChange.mock.calls[0][0];
        console.log('Last call arguments:', lastCall);

        // Check if onFilterChange was called with correct search query
        expect(lastCall).toEqual({
            subject: undefined,
            module: undefined,
            topic: undefined,
            sub_topic: undefined,
            nature_of_question: undefined,
            search: 'test query'
        });
    });

    it('cascades filters correctly', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        await act(async () => {
            render(<CascadingFilters onFilterChange={mockOnFilterChange} />);
        });

        // Wait for subjects to load
        await waitFor(() => {
            const subjectSelect = screen.getByTestId('subject-filter');
            expect(subjectSelect).toBeInTheDocument();
        });

        // Open the subject dropdown
        const subjectSelect = screen.getByTestId('subject-filter');
        await act(async () => {
            await user.click(subjectSelect);
        });

        // Select 'Math'
        const mathOption = await screen.findByText('Math');
        await act(async () => {
            await user.click(mathOption);
        });

        // Fast-forward timers to trigger debounce
        await act(async () => {
            jest.advanceTimersByTime(300);
        });

        // Verify modules are loaded for the selected subject
        await waitFor(() => {
            const moduleSelect = screen.getByTestId('module-filter');
            expect(moduleSelect).toBeEnabled();
        });
    });
});
