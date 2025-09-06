import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/types';
import AnalysisCharts from './AnalysisCharts';
import { FounderAnalysisResults } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [analysisResults, setAnalysisResults] = useState<FounderAnalysisResults | null>(null);

  // Extract JSON data from assistant messages if available
  useEffect(() => {
    if (!isUser && message.content) {
      try {
        const jsonMatch = message.content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const results = JSON.parse(jsonMatch[1]);
          setAnalysisResults(results);
        }
      } catch (error) {
        console.error('Error parsing JSON from message:', error);
      }
    }
  }, [isUser, message.content]);

  // Clean up the message content by removing the JSON part
  const cleanContent = isUser 
    ? message.content 
    : message.content.replace(/```json\s*[\s\S]*?\s*```/, '');

  return (
    <div className={`py-5 animate-fadeIn ${isUser ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}`}>
      <div className="max-w-3xl mx-auto px-4 flex">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 transition-all duration-300 hover:scale-110 ${
          isUser ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {isUser ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 transition-transform duration-300">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5 transition-transform duration-300">
              <path d="M16.5 7.5h-9v9h9v-9z" />
              <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium mb-1 transition-colors duration-300 hover:text-blue-600">{isUser ? 'You' : 'Founder Analysis AI'}</p>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>
              {cleanContent}
            </ReactMarkdown>
            
            {/* Display charts for assistant messages with analysis results */}
            {!isUser && analysisResults && (
              <AnalysisCharts results={analysisResults} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
