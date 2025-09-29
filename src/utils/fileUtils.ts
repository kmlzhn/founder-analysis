import { FileAttachment } from '@/types';

// Extract file name from URL
export function getFileNameFromUrl(url: string): string {
  try {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    // Remove query parameters if any
    return fileName.split('?')[0] || 'file';
  } catch {
    return 'file';
  }
}

// Get file type from URL or name
export function getFileTypeFromUrl(url: string): string {
  try {
    const fileName = getFileNameFromUrl(url);
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      case 'txt':
        return 'txt';
      default:
        return 'file';
    }
  } catch {
    return 'file';
  }
}

// Create file attachment from URL
export function createFileAttachment(url: string, originalName?: string): FileAttachment {
  const name = originalName || getFileNameFromUrl(url);
  const type = getFileTypeFromUrl(url);
  
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    url,
    type
  };
}

// Create multiple file attachments from URLs
export function createFileAttachments(fileUrls: string[]): FileAttachment[] {
  return fileUrls.map(url => createFileAttachment(url));
}
