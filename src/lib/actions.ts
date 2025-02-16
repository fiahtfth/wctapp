'use server';

export async function addQuestionToCart(questionId: number, testId?: string) {
    if (!testId) {
        testId = localStorage.getItem('testId') || uuidv4();
        localStorage.setItem('testId', testId);
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ questionId, testId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add question to cart');
        }

        return response.json();
    } catch (error) {
        console.error('Error adding question to cart:', error);
        throw error;
    }
}

export async function exportTest(testId: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testId }),
    });

    if (!response.ok) {
        throw new Error('Failed to export test');
    }

    return response.blob();
}

export async function getCartItems(testId?: string) {
    if (!testId) {
        testId = localStorage.getItem('testId');
        if (!testId) {
            return [];  // No test ID available
        }
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart?testId=${testId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch cart items');
        }

        return response.json();
    } catch (error) {
        console.error('Error fetching cart items:', error);
        return [];
    }
}
