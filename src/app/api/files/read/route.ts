import { NextRequest, NextResponse } from 'next/server';

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
    
    // Handle different file types - CSV, Excel, and Text only
    if (fileType === 'csv' || fileUrl.endsWith('.csv')) {
      content = await response.text();
    } else if (fileType === 'excel' || fileUrl.endsWith('.xlsx') || fileUrl.endsWith('.xls')) {
      // For Excel files, we'll read as text for now (can be enhanced later)
      content = await response.text();
    } else if (fileType === 'txt' || fileUrl.endsWith('.txt')) {
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
