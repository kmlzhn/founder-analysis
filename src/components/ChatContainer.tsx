import { useRef, useEffect } from 'react';
import ChatMessage, { Message } from './ChatMessage';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatContainer({ messages, isLoading }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-md animate-fadeIn">
            <h1 className="text-3xl font-bold mb-6 animate-slideIn">Founder Analysis AI</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 animate-slideIn" style={{ animationDelay: '100ms' }}>
              Enter a person's name to analyze their potential as a founder of a great startup.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:border-blue-300 animate-slideIn" style={{ animationDelay: '200ms' }}>
                <h3 className="font-medium mb-2 text-blue-600">Comprehensive Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get detailed metrics and insights about founder potential
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:border-blue-300 animate-slideIn" style={{ animationDelay: '300ms' }}>
                <h3 className="font-medium mb-2 text-blue-600">Data-Driven</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analysis based on patterns of successful founders
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:border-blue-300 animate-slideIn" style={{ animationDelay: '400ms' }}>
                <h3 className="font-medium mb-2 text-blue-600">Visual Metrics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Charts and graphs to visualize founder potential
                </p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:border-blue-300 animate-slideIn" style={{ animationDelay: '500ms' }}>
                <h3 className="font-medium mb-2 text-blue-600">Conversation History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Save and review previous analyses
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="py-5 bg-gray-50 dark:bg-gray-700 animate-fadeIn">
              <div className="max-w-3xl mx-auto px-4 flex">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-4 flex-shrink-0 animate-pulse-slow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 transition-transform duration-700 animate-pulse">
                    <path d="M16.5 7.5h-9v9h9v-9z" />
                    <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1 text-blue-600">Founder Analysis AI</p>
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
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
