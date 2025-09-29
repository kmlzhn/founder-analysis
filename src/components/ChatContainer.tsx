import { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import AnalysisProgress from './AnalysisProgress';
import { Message } from '@/types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  analysisProgress: {
    isActive: boolean;
    stage: string;
  };
}

export default function ChatContainer({ messages, isLoading, analysisProgress }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto pb-32 bg-white">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-md">
            <p className="text-lg text-gray-500 mb-6">
              Welcome to Founder Analysis! Start a conversation to begin.
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {analysisProgress.isActive ? (
            <AnalysisProgress stage={analysisProgress.stage} />
          ) : isLoading && (
            <div className="py-6 bg-white">
              <div className="max-w-3xl mx-auto px-4">
                <div className="flex space-x-1 mb-4">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
