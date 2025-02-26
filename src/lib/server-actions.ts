'use server';

import { headers } from 'next/headers';
import { jwtVerify } from 'jose';

async function getBaseUrl() {
  // In Vercel, we should use the VERCEL_URL environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For local development or when VERCEL_URL is not available
  try {
    const headersList = await headers();
    const host = (await headersList).get('host') || '';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    console.log('Base URL from headers:', baseUrl);
    return baseUrl;
  } catch (error) {
    console.error('Error getting base URL from headers:', error);
    // Fallback to a hardcoded URL if all else fails
    const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://wctapp-plt7kys8p-fiahtfth-gmailcoms-projects.vercel.app';
    console.log('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
  }
}

export async function removeFromCart(questionId: number | string, testId: string, token?: string) {
  if (!testId || !questionId) {
    throw new Error('Both testId and questionId are required');
  }

  try {
    const baseUrl = await getBaseUrl();
    const headersList = await headers();
    const authToken = (await headersList).get('authorization') || '';
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      fetchHeaders['Authorization'] = `Bearer ${authToken}`;
    }
    const response = await fetch(`${baseUrl}/api/cart/remove`, {
      method: 'POST',
      headers: fetchHeaders as any,
      body: JSON.stringify({ questionId, testId }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove question from cart');
    }

    return response.json();
  } catch (error) {
    console.error('Error removing question from cart:', error);
    throw error;
  }
}

export async function addQuestionToCart(questionId: number, testId: string | undefined, token: string) {
  if (!questionId) {
    throw new Error('Question ID is required');
  }
  
  // If testId is not provided, we'll let the API generate one
  const finalTestId = testId || '';

  try {
    const baseUrl = await getBaseUrl();
    
    // Skip token verification here since it will be done on the server side
    // Just pass the token directly to the API
    try {
      // First try the cart/question endpoint which is more robust
      const response = await fetch(`${baseUrl}/api/cart/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionId, testId: finalTestId }),
        cache: 'no-store',
      });

      if (response.ok) {
        return response.json();
      }

      // If the first endpoint fails, try the fallback endpoint
      console.log('Falling back to legacy cart endpoint');
      const fallbackResponse = await fetch(`${baseUrl}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionId, testId: finalTestId }),
        cache: 'no-store',
      });

      if (!fallbackResponse.ok) {
        const errorData = await fallbackResponse.json();
        throw new Error(errorData.error || 'Failed to add question to cart');
      }

      return fallbackResponse.json();
    } catch (error) {
      console.error('Error adding question to cart:', error);
      if (error instanceof Error && error.message.includes('User with ID')) {
        throw new Error(`Your session has expired. Please log out and log in again.`);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in addQuestionToCart:', error);
    throw error;
  }
}

export async function exportTest(testId: string) {
  if (!testId) {
    throw new Error('Test ID is required');
  }

  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ testId }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to export test');
  }

  return response.blob();
}

export async function getCartItems(testId: string, token?: string) {
  console.log('server-actions.getCartItems called with testId:', testId);
  if (!testId || testId === 'undefined') {
    console.error('Invalid or missing testId:', testId);
    return { questions: [], count: 0 };
  }

  try {
    const baseUrl = await getBaseUrl();
    const headersList = headers();
    const authToken = (await headersList).get('authorization') || '';
    const response = await fetch(`${baseUrl}/api/cart?testId=${testId}`, {
      cache: 'no-store',
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : '',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch cart items');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return { questions: [], count: 0 };
  }
}
