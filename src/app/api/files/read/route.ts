import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, fileType } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'fileUrl is required' },
        { status: 400 }
      );
    }

    console.log('Reading file:', fileUrl);

    // Fetch the file content
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    let content;
    
    // Auto-detect file type from Content-Type header if not provided
    const contentType = response.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let detectedFileType = fileType;
    if (!fileType || fileType === 'unknown') {
      if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
        detectedFileType = 'xlsx';
      } else if (contentType.includes('csv') || contentType.includes('text/csv')) {
        detectedFileType = 'csv';
      } else if (contentType.includes('text/plain')) {
        detectedFileType = 'txt';
      } else {
        // For UploadThing files, try Excel first since that's most common
        detectedFileType = 'xlsx';
      }
    }
    
    console.log('Final detected file type:', detectedFileType);
    
    // Handle different file types properly
    if (detectedFileType === 'csv' || fileUrl.endsWith('.csv')) {
      const textContent = await response.text();
      content = textContent;
    } else if (detectedFileType === 'xlsx' || detectedFileType === 'excel' || fileUrl.endsWith('.xlsx') || fileUrl.endsWith('.xls')) {
      // Properly handle Excel files
      try {
        const arrayBuffer = await response.arrayBuffer();
        console.log('Excel file size:', arrayBuffer.byteLength, 'bytes');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in Excel file');
        }
        
        console.log('Found worksheet:', firstSheetName);
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to CSV format for LinkedIn URL extraction
        content = XLSX.utils.sheet_to_csv(worksheet);
        console.log('Converted to CSV, length:', content.length);
      } catch (excelError) {
        console.error('Excel parsing failed, trying as text:', excelError);
        // Fallback to text if Excel parsing fails
        const textContent = await response.text();
        content = textContent;
      }
    } else if (detectedFileType === 'txt' || fileUrl.endsWith('.txt')) {
      content = await response.text();
    } else {
      // Default to text for any other supported format
      content = await response.text();
    }

    return NextResponse.json({
      success: true,
      content,
      fileUrl,
      fileType: fileType || 'unknown',
    });

  } catch (error) {
    console.error('File reading error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to read file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File Reader API is running',
    endpoint: '/api/files/read',
    method: 'POST',
    requiredBody: {
      fileUrl: 'https://uploadthing.com/f/your-file-key',
      fileType: 'csv | excel | txt (optional)'
    }
  });
}
