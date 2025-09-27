import ReactMarkdown from 'react-markdown';
import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'USER';

  // Keep the full message content including JSON blocks for text display
  const content = message.content;

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
                    {content}
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
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
