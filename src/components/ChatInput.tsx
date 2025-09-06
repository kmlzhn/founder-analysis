import { FormEvent, useState } from 'react';
import FileUploadPanel from './FileUploadPanel';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload?: (file: File) => void;
  onLinkedInSubmit?: (url: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onFileUpload = () => {}, 
  onLinkedInSubmit = () => {}, 
  isLoading 
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState<'csv' | 'linkedin'>('csv');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleFileUpload = (file: File) => {
    onFileUpload(file);
    setShowUploadPanel(false);
  };

  const handleLinkedInSubmit = (url: string) => {
    onLinkedInSubmit(url);
    setShowUploadPanel(false);
  };
  
  const openUploadPanel = (tab: 'csv' | 'linkedin') => {
    setActiveUploadTab(tab);
    setShowUploadPanel(true);
  };

  return (
    <>
      <div className="border-t border-gray-100 bg-white dark:bg-gray-800 py-4 shadow-inner">
        <div className="max-w-3xl mx-auto px-4">
          {/* Upload buttons */}
          <div className="flex justify-center mb-3 space-x-2">
            <button
              type="button"
              onClick={() => openUploadPanel('csv')}
              disabled={isLoading}
              className="flex items-center text-sm text-gray-500 hover:text-blue-500 transition-colors px-3 py-1 rounded-md hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload CSV
            </button>
            <button
              type="button"
              onClick={() => openUploadPanel('linkedin')}
              disabled={isLoading}
              className="flex items-center text-sm text-gray-500 hover:text-blue-500 transition-colors px-3 py-1 rounded-md hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              LinkedIn Profile
            </button>
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a founder's name or upload data..."
              className="w-full p-4 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all duration-300 hover:shadow-md focus:shadow-md"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-500 disabled:opacity-50 transition-all duration-300 hover:scale-110"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className="w-6 h-6 transition-transform duration-300 hover:translate-x-1"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* File Upload Panel */}
      <FileUploadPanel
        isVisible={showUploadPanel}
        onClose={() => setShowUploadPanel(false)}
        onFileUpload={handleFileUpload}
        onLinkedInSubmit={handleLinkedInSubmit}
        activeTab={activeUploadTab}
      />
    </>
  );
}
