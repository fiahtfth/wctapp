import { POST } from '../export/route';
import { NextRequest } from 'next/server';

// Mock the database query function
jest.mock('@/lib/database/queries', () => ({
  getQuestions: jest.fn(() => Promise.resolve({ questions: [], total: 0 })),
}));

describe('Export API Endpoint', () => {
  it('should return a CSV file', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({ testId: '123' }),
    });
    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('should handle errors', async () => {
    // Mock the database query function to throw an error
    jest.mock('@/lib/database/queries', () => ({
      getQuestions: jest.fn(() => Promise.reject(new Error('Test error'))),
    }));

    const mockRequest = new NextRequest('http://localhost:3000/api/export', {
      method: 'POST',
      body: JSON.stringify({ testId: '123' }),
    });
    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
  });
});
