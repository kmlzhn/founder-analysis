"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Upload, LinkIcon, Send, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import FileUploadPanel from './FileUploadPanel';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload?: (file: File) => void;
  onLinkedInSubmit?: (url: string) => void;
  isLoading: boolean;
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

const AnimatedPlaceholder = ({ showUpload }: { showUpload: boolean }) => (
  <AnimatePresence mode="wait">
    <motion.p
      key={showUpload ? "upload" : "analyze"}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none text-sm absolute text-gray-500 whitespace-nowrap"
    >
      {showUpload ? "Upload CSV or LinkedIn..." : "Analyze founder potential..."}
    </motion.p>
  </AnimatePresence>
);

export default function ChatInput({ 
  onSendMessage, 
  onFileUpload = () => {}, 
  onLinkedInSubmit = () => {}, 
  isLoading 
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
  });
  const [showUpload, setShowUpload] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [activeUploadTab, setActiveUploadTab] = useState<'csv' | 'linkedin'>('csv');

  const handleSubmit = () => {
    if (value.trim() && !isLoading) {
      onSendMessage(value);
      setValue("");
      adjustHeight(true);
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
      <div className="p-6">
        <div className="relative max-w-2xl border rounded-[22px] border-gray-200/60 p-1 w-full mx-auto shadow-sm bg-white/80 backdrop-blur-sm">
          <div className="relative rounded-2xl border border-gray-100 bg-transparent flex flex-col">
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
                    <AnimatedPlaceholder showUpload={showUpload} />
                  </div>
                )}
              </div>
            </div>

            <div className="h-12 bg-transparent rounded-b-xl">
              <div className="absolute left-2 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openUploadPanel('csv')}
                  disabled={isLoading}
                  className={cn(
                    "cursor-pointer relative rounded-full p-2 transition-all duration-200",
                    "bg-gray-100/80 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowUpload(!showUpload)}
                  disabled={isLoading}
                  className={cn(
                    "rounded-full transition-all flex items-center gap-2 px-2 py-1.5 border h-8 duration-200",
                    showUpload
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-gray-100/80 border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{
                        rotate: showUpload ? 180 : 0,
                        scale: showUpload ? 1 : 1,
                      }}
                      whileHover={{
                        rotate: showUpload ? 180 : 0,
                        scale: 1,
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
                      <Upload
                        className={cn(
                          "w-4 h-4",
                          showUpload ? "text-blue-600" : "text-inherit"
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showUpload && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{
                          width: "auto",
                          opacity: 1,
                        }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm overflow-hidden whitespace-nowrap text-blue-600 flex-shrink-0"
                      >
                        Upload
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>

                <button
                  type="button"
                  onClick={() => openUploadPanel('linkedin')}
                  disabled={isLoading}
                  className={cn(
                    "cursor-pointer relative rounded-full p-2 transition-all duration-200",
                    "bg-gray-100/80 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="absolute right-3 bottom-3">
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !value.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "rounded-full p-2 transition-all duration-200",
                    value.trim() && !isLoading
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