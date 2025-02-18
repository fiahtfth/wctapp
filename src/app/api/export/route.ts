import { NextRequest, NextResponse } from 'next/server';
import { getCartQuestions } from '@/types/question';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { testId } = body;

        if (!testId) {
            return NextResponse.json(
                { error: 'Test ID is required' }, 
                { status: 400 }
            );
        }

        // Retrieve cart questions
        const cartQuestions = await getCartQuestions(testId);

        // Transform questions for Excel export
        const exportData = cartQuestions.map(q => ({
            'Question': q.question_text,
            'Subject': q.subject,
            'Topic': q.topic || 'N/A',
            'Difficulty': q.difficulty_level,
            'Answer': q.answer,
            'Explanation': q.explanation || 'N/A'
        }));

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Questions');

        // Convert workbook to buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Return Excel file
        return new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename=test_questions_${testId}.xlsx`
            }
        });
    } catch (error) {
        console.error('Error exporting questions:', error);
        return NextResponse.json(
            { error: 'Failed to export questions' }, 
            { status: 500 }
        );
    }
}
