'use server';

export async function addQuestionToCart(questionId: number, testId: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, testId }),
    });

    if (!response.ok) {
        throw new Error('Failed to add question to cart');
    }

    return response.json();
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

export async function getCartItems(testId: string) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cart?testId=${testId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch cart items');
    }

    return response.json();
}
