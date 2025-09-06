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
    <div className="py-6 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {isUser ? (
          // User message - right aligned with light grey bubble
          <div className="flex justify-end mb-4">
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-gray-100/80 rounded-2xl px-4 py-3 text-gray-900">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {cleanContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // AI message - left aligned without bubble
          <div className="flex justify-start mb-4">
            <div className="max-w-full">
              <div className="prose max-w-none text-gray-900">
                <ReactMarkdown>
                  {cleanContent}
                </ReactMarkdown>
                
                {/* Display charts for assistant messages with analysis results */}
                {analysisResults && (
                  <AnalysisCharts results={analysisResults} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
