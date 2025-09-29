'use client';

import { useState, useEffect } from 'react';
import ChatInput from './ChatInput';

interface WelcomeScreenProps {
  onSendMessage: (message: string, fileUrls?: string[]) => void;
  isLoading: boolean;
}

const investmentMessages = [
  "Need help with investment decisions?",
  "Analyze founders like a legendary VC",
  "Discover the next billion-dollar founder", 
  "Make smarter investment choices",
  "Evaluate startup potential with AI"
];

export default function WelcomeScreen({ onSendMessage, isLoading }: WelcomeScreenProps) {
  const [currentMessage, setCurrentMessage] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * investmentMessages.length);
    setCurrentMessage(investmentMessages[randomIndex]);
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 bg-white">
      <div className="max-w-4xl w-full text-center mb-0h">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-gray-900 mb-8 leading-tighter">
          {currentMessage}
        </h1>
      </div>
      
      <div className="w-full max-w-3xl">
        <ChatInput 
          onSendMessage={onSendMessage}
          isLoading={isLoading} 
        />
      </div>
      
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
      </div>
    </div>
  );
}
