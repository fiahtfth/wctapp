import * as XLSX from 'xlsx';

interface ExportTestParams {
  testName: string;
  batch: string;
  date: string;
  questions: any[];
}

export function exportTest({ testName, batch, date, questions }: ExportTestParams) {
  try {
    console.log('Exporting test with questions:', questions);
    
    // Ensure all questions have the required fields
    const processedQuestions = questions.map((q, index) => {
      // Log each question to help debug
      console.log(`Question ${index + 1}:`, q);
      
      // Return the question as is - it should already be processed by the caller
      return q;
    });
    
    // Create a worksheet from the questions data
    const ws = XLSX.utils.json_to_sheet(processedQuestions);
    
    // Create a workbook and add the worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    
    // Generate filename with test details
    const fileName = `${testName || 'Test'}_${batch || 'Batch'}_${date || new Date().toISOString().split('T')[0]}.xlsx`;
    console.log('Exporting to file:', fileName);
    
    // Export the workbook to a file
    XLSX.writeFile(wb, fileName);
    
    return { success: true, fileName };
  } catch (error) {
    console.error('Error exporting test:', error);
    return { success: false, error };
  }
} 