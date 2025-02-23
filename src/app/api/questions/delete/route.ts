import { NextRequest, NextResponse } from 'next/server';
import { openDatabase } from '@/lib/database/queries';

export async function DELETE(request: NextRequest) {
    try {
        const { questions } = await request.json();
        
        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: questions must be a non-empty array' },
                { status: 400 }
            );
        }

        const db = await openDatabase();
        
        try {
            // Create placeholders for the SQL query
            const placeholders = questions.map(() => '?').join(',');
            const stmt = db.prepare(`DELETE FROM questions WHERE Question IN (${placeholders})`);
            
            // Execute the delete query
            const result = stmt.run(questions);
            
            return NextResponse.json({
                success: true,
                deletedCount: result.changes
            });
        } finally {
            db.close();
        }
    } catch (error) {
        console.error('Error deleting questions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
