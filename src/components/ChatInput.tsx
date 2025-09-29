"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Send, X, FileText, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { uploadFiles } from "@/utils/uploadthing";

interface ChatInputProps {
  onSendMessage: (message: string, fileUrls?: string[]) => void;
  isLoading: boolean;
}

interface SelectedFile {
  file: File;
  name: string;
  type: string;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const MIN_HEIGHT = 48;
const MAX_HEIGHT = 164;

// Helper functions
const getFileIcon = (fileType: string) => {
  if (fileType.includes('csv') || fileType === 'text/csv') return FileSpreadsheet;
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('sheet')) return FileSpreadsheet;
  if (fileType.includes('text') || fileType === 'text/plain') return FileText;
  return FileText;
};

// Note: getFileName will be used when UploadThing integration is added

export default function ChatInput({ 
  onSendMessage, 
  isLoading
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });

  const handleSubmit = async () => {
    if ((value.trim() || selectedFiles.length > 0) && !isLoading && !isUploading) {
      let fileUrls: string[] = [];
      
      // Upload files first if any (but don't block message display)
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try {
          const files = selectedFiles.map(sf => sf.file);
          const uploadResults = await uploadFiles("documentUploader", { files });
          fileUrls = uploadResults.map(file => file.url);
        } catch (error) {
          console.error('Upload failed during send:', error);
          setIsUploading(false);
          return; // Don't send message if upload fails
        }
        setIsUploading(false);
      }
      
      // Send message with real file URLs (or empty array)
      onSendMessage(value, fileUrls);
      setValue("");
      setSelectedFiles([]);
      adjustHeight(true);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    console.log('Triggering file input...');
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    console.log('Files selected:', files.map(f => f.name));

    // Just store files locally, don't upload yet
    const newSelectedFiles: SelectedFile[] = files.map(file => ({
      file,
      name: file.name,
      type: file.type
    }));

    setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    
    // Clear the input
    e.target.value = '';
  };


  return (
    <>
      <div className="p-6">
        <div className="relative max-w-3xl border rounded-[22px] border-gray-200/60 p-1 w-full mx-auto shadow-sm bg-white/80 backdrop-blur-sm">
          <div className="relative rounded-2xl border border-gray-100 bg-transparent flex flex-col">
            {/* File List */}
            {selectedFiles.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((selectedFile, index) => {
                    const IconComponent = getFileIcon(selectedFile.type);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                      >
                        <IconComponent className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 max-w-[120px] truncate">
                          {selectedFile.name}
                        </span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div
              className="overflow-y-auto"
              style={{ maxHeight: `${MAX_HEIGHT}px` }}
            >
              <div className="relative">
                <Textarea
                  value={value}
                  placeholder=""
                  className="w-full rounded-2xl rounded-b-none px-4 py-3 bg-transparent border-none text-gray-900 resize-none focus-visible:ring-0 leading-[1.3] min-h-[48px] placeholder:text-gray-500"
                  ref={textareaRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  onChange={(e) => {
                    setValue(e.target.value);
                    adjustHeight();
                  }}
                  disabled={isLoading}
                />
                {!value && (
                  <div className="absolute left-4 top-3 right-16">
                    <p className="pointer-events-none text-sm text-gray-500 whitespace-nowrap">
                      Start a conversation...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="h-12 bg-transparent rounded-b-xl">
              <div className="absolute left-2 bottom-3 flex items-center gap-2">
                <div className="relative">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {/* Custom circular button */}
                  <button
                    type="button"
                    onClick={triggerUpload}
                    disabled={isLoading || isUploading}
                    className={cn(
                      "rounded-full transition-all flex items-center gap-2 px-2 py-1.5 border h-8 duration-200",
                      isUploading 
                        ? "bg-blue-50 border-transparent text-blue-600"
                        : "bg-gray-100/80 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50",
                      (isLoading || isUploading) && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <motion.div
                        whileHover={{
                          scale: isUploading ? 1 : 1.1,
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 10,
                          },
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 25,
                        }}
                      >
                        <Upload className="w-4 h-4" />
                      </motion.div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="absolute right-3 bottom-3">
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || isUploading || (!value.trim() && selectedFiles.length === 0)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "rounded-full p-2 transition-all duration-200",
                    (value.trim() || selectedFiles.length > 0) && !isLoading && !isUploading
                      ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                      : "bg-gray-100/80 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}