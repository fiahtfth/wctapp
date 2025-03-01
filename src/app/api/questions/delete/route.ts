import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/database/supabaseClient';

export async function DELETE(request: NextRequest) {
    try {
        const { questions } = await request.json();
        
        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: questions must be a non-empty array' },
                { status: 400 }
            );
        }

        // Delete questions using Supabase
        const { error } = await supabase
            .from('questions')
            .delete()
            .in('text', questions);
        
        if (error) {
            console.error('Error deleting questions:', error);
            return NextResponse.json(
                { error: 'Failed to delete questions' },
                { status: 500 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${questions.length} questions`
        });
    } catch (error) {
        console.error('Error deleting questions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
