import { NextResponse } from 'next/server';

const subjects = [
    'Economics',
    'History',
    'Geography',
    'Polity and Governance',
    'Science and Technology',
    'Ecology and Environment'
];

export async function GET() {
    try {
        return NextResponse.json(subjects);
    } catch (error) {
        console.error('Error in /api/subjects:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
