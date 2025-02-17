import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CascadingFilters } from '../CascadingFilters';
import { SelectChangeEvent } from '@mui/material';

console.log('Imported CascadingFilters:', CascadingFilters);
console.log('Typeof CascadingFilters:', typeof CascadingFilters);
console.log('CascadingFilters keys:', Object.keys(CascadingFilters || {}));

// Mock the hierarchical data functions
jest.mock('@/lib/database/hierarchicalData', () => ({
    getSubjects: jest.fn(() => ['Math', 'Science', 'English']),
    getModules: jest.fn(() => []),
    getTopics: jest.fn(() => []),
    getQuestions: jest.fn(() => [])
}));

// Mock MUI and other dependencies
jest.mock('@mui/material', () => {
    const actual = jest.requireActual('@mui/material');
    return {
        ...actual,
        Box: jest.fn(({ children }) => <div>{children}</div>),
        Select: jest.fn(({ value, onChange, children, 'data-testid': dataTestId }) => (
            <select 
                value={value} 
                onChange={(e) => {
                    const selectedValues = Array.isArray(value) ? value : [];
                    const currentValue = e.target.value;
                    
                    let newValues: string[];
                    if (selectedValues.includes(currentValue)) {
                        newValues = selectedValues.filter(v => v !== currentValue);
                    } else {
                        newValues = [...selectedValues, currentValue];
                    }

                    const event: SelectChangeEvent<string[]> = {
                        target: {
                            value: newValues
                        }
                    } as SelectChangeEvent<string[]>;

                    onChange?.(event);
                }}
                data-testid={dataTestId}
                multiple
            >
                {children}
            </select>
        )),
        TextField: jest.fn(({ value, onChange, 'data-testid': dataTestId }) => (
            <input 
                type="text" 
                value={value} 
                onChange={onChange} 
                data-testid={dataTestId}
            />
        ))
    };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        route: '/',
        pathname: '',
        query: {},
        asPath: '',
        push: jest.fn(),
        replace: jest.fn(),
    })),
    usePathname: jest.fn(() => '/'),
    useSearchParams: jest.fn(() => ({
        get: () => null,
        entries: () => [],
        has: () => false
    }))
}));

describe('CascadingFilters Component', () => {
    it('calls onFilterChange with correct subject when selected', async () => {
        console.log('Starting test...');
        const mockOnFilterChange = jest.fn();

        console.log('About to render CascadingFilters...');
        const renderResult = render(
            <CascadingFilters 
                onFilterChange={mockOnFilterChange} 
                testId="cascading-filters" 
            />
        );
        console.log('Render result:', renderResult);

        // Find the subject select element
        console.log('Attempting to find subject-filter...');
        const subjectSelect = screen.getByTestId('subject-filter');
        console.log('Found subject-filter:', subjectSelect);

        // Simulate subject selection
        console.log('Simulating subject selection...');
        fireEvent.change(subjectSelect, { 
            target: { 
                value: ['Math'] 
            } 
        });
        console.log('Simulated subject selection');

        // Wait for the filter change callback
        console.log('Waiting for filter change...');
        await waitFor(() => {
            console.log('Mock function calls:', mockOnFilterChange.mock.calls);
            const calls = mockOnFilterChange.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            const lastCall = calls[calls.length - 1][0];
            expect(lastCall).toHaveProperty('subject');
            expect(lastCall).toHaveProperty('module');
            expect(lastCall).toHaveProperty('topic');
            expect(lastCall).toHaveProperty('question_type');
            expect(lastCall).toHaveProperty('search');
        });
    });
});
