import { useState, useRef, useEffect } from 'react';
import BlurOverlay from './BlurOverlay';

interface FileUploadPanelProps {
  onFileUpload: (file: File) => void;
  onLinkedInSubmit: (url: string) => void;
  isVisible: boolean;
  onClose: () => void;
  activeTab?: 'csv' | 'linkedin';
}

export default function FileUploadPanel({ 
  onFileUpload, 
  onLinkedInSubmit, 
  isVisible, 
  onClose,
  activeTab = 'csv'
}: FileUploadPanelProps) {
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [currentTab, setCurrentTab] = useState<'csv' | 'linkedin'>(activeTab);
  
  // Update current tab when activeTab prop changes
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setFileName(file.name);
        onFileUpload(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setFileName(file.name);
        onFileUpload(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleLinkedInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkedInUrl.trim()) {
      onLinkedInSubmit(linkedInUrl);
      setLinkedInUrl('');
    }
  };

  return (
    <BlurOverlay isVisible={isVisible} onClose={onClose}>
      <div className="p-6 relative animate-slideIn">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Upload Data</h2>
        
        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 transition-colors ${currentTab === 'csv' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCurrentTab('csv')}
          >
            CSV File
          </button>
          <button
            className={`flex-1 py-2 transition-colors ${currentTab === 'linkedin' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setCurrentTab('linkedin')}
          >
            LinkedIn Profile
          </button>
        </div>
        
        {/* CSV Upload */}
        {currentTab === 'csv' && (
          <div>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".csv" 
                className="hidden" 
              />
              
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              
              {fileName ? (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900">{fileName}</p>
                  <p className="text-xs text-gray-500">File selected</p>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-1">Drag CSV file here or click to select</p>
                  <p className="text-gray-500 text-sm">File should contain founder data</p>
                </>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              <p>CSV file should contain the following columns:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>First Name</li>
                <li>Last Name</li>
                <li>Company</li>
                <li>Position</li>
                <li>Email (optional)</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* LinkedIn URL */}
        {currentTab === 'linkedin' && (
          <form onSubmit={handleLinkedInSubmit}>
            <div className="mb-4">
              <label htmlFor="linkedin-url" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                id="linkedin-url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/username"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Analyze Profile
            </button>
            
            <p className="mt-4 text-sm text-gray-500">
              We will analyze public LinkedIn profile data to assess founder potential.
            </p>
          </form>
        )}
      </div>
    </BlurOverlay>
  );
}
