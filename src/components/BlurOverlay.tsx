import React from 'react';

interface BlurOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BlurOverlay({ isVisible, onClose, children }: BlurOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-white bg-opacity-70 backdrop-blur-xl transition-all duration-300" 
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal content */}
        <div 
          className="inline-block align-middle bg-white rounded-lg text-left shadow-xl transform transition-all duration-500 sm:my-8 sm:max-w-lg sm:w-full border border-gray-200"
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(12px)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
