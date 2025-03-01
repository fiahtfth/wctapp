import { GET } from '../questions/route';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation(() => ({
    url: 'http://localhost:3000/api/questions',
  })),
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      status: options?.status || 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })),
  },
}));

// Mock the database query function
jest.mock('@/lib/database/queries', () => ({
  getQuestions: jest.fn(() => Promise.resolve({ questions: [], total: 0 })),
}));

describe('Questions API Endpoint', () => {
  it('should return a list of questions', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/questions');
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);
  });

  it('should handle errors', async () => {
    // Mock the database query function to throw an error
    (require('@/lib/database/queries') as any).getQuestions.mockImplementation(() => Promise.reject(new Error('Test error')));

    const mockRequest = new NextRequest('http://localhost:3000/api/questions');
    const response = await GET(mockRequest);
    expect(response.status).toBe(500);
  });
});
