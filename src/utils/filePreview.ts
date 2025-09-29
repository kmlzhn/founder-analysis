import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface FilePreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  previewRows: number;
  error?: string;
}

// Parse CSV content and return preview data
export async function parseCSVContent(content: string): Promise<FilePreviewData> {
  try {
    const result = Papa.parse(content, {
      header: false,
      skipEmptyLines: true,
      preview: 6, // Only parse first 6 rows for preview
    });

    if (result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }

    const data = result.data as string[][];
    if (data.length === 0) {
      throw new Error('No data found in CSV file');
    }

    const headers = data[0] || [];
    const rows = data.slice(1, 6); // Show up to 5 data rows
    
    return {
      headers,
      rows,
      totalRows: result.meta.cursor || data.length,
      previewRows: rows.length,
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: 0,
      error: error instanceof Error ? error.message : 'Failed to parse CSV',
    };
  }
}

// Parse Excel content and return preview data
export async function parseExcelContent(arrayBuffer: ArrayBuffer): Promise<FilePreviewData> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get the first worksheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('No worksheets found in Excel file');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      range: 0, // Start from first row
      defval: '', // Default value for empty cells
    }) as string[][];

    if (jsonData.length === 0) {
      throw new Error('No data found in Excel file');
    }

    const headers = jsonData[0] || [];
    const rows = jsonData.slice(1, 6); // Show up to 5 data rows
    
    return {
      headers,
      rows,
      totalRows: jsonData.length - 1, // Exclude header row
      previewRows: rows.length,
    };
  } catch (error) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: 0,
      error: error instanceof Error ? error.message : 'Failed to parse Excel file',
    };
  }
}

// Fetch and parse file content based on file type
export async function getFilePreview(url: string, fileType: string): Promise<FilePreviewData> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    if (fileType === 'csv') {
      const content = await response.text();
      return parseCSVContent(content);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const arrayBuffer = await response.arrayBuffer();
      return parseExcelContent(arrayBuffer);
    } else if (fileType === 'txt') {
      // For text files, just show first few lines
      const content = await response.text();
      const lines = content.split('\n').slice(0, 10);
      return {
        headers: ['Content'],
        rows: lines.map(line => [line.substring(0, 100)]), // Truncate long lines
        totalRows: content.split('\n').length,
        previewRows: lines.length,
      };
    } else {
      // For unknown file types, try to detect based on content
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
        const arrayBuffer = await response.arrayBuffer();
        return parseExcelContent(arrayBuffer);
      } else {
        // Default to text
        const content = await response.text();
        const lines = content.split('\n').slice(0, 10);
        return {
          headers: ['Content'],
          rows: lines.map(line => [line.substring(0, 100)]),
          totalRows: content.split('\n').length,
          previewRows: lines.length,
        };
      }
    }
  } catch (error) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      previewRows: 0,
      error: error instanceof Error ? error.message : 'Failed to load file preview',
    };
  }
}

// Format preview data for display
export function formatPreviewForDisplay(preview: FilePreviewData): string {
  if (preview.error) {
    return `Error: ${preview.error}`;
  }

  if (preview.headers.length === 0 && preview.rows.length === 0) {
    return 'No data to preview';
  }

  let output = '';
  
  // Add headers if available
  if (preview.headers.length > 0) {
    const headerRow = preview.headers
      .slice(0, 4) // Show max 4 columns
      .map(h => (h || '').substring(0, 15).padEnd(15))
      .join(' | ');
    output += headerRow + '\n';
    output += '-'.repeat(headerRow.length) + '\n';
  }

  // Add data rows
  preview.rows.slice(0, 5).forEach(row => {
    const dataRow = row
      .slice(0, 4) // Show max 4 columns
      .map(cell => (cell || '').toString().substring(0, 15).padEnd(15))
      .join(' | ');
    output += dataRow + '\n';
  });

  // Add summary
  if (preview.totalRows > preview.previewRows) {
    output += `\n... and ${preview.totalRows - preview.previewRows} more rows`;
  }

  return output;
}
