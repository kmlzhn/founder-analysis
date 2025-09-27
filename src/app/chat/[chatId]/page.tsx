'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useChatContext } from '@/contexts/ChatContext';
import ChatLayout from '@/components/ChatLayout';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  
  const {
    chats,
    currentChatId,
    currentChat,
    isLoading,
    isChatsLoaded,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    handleSendMessage,
    setCurrentChatId,
  } = useChatContext();

  // Set current chat based on URL parameter
  useEffect(() => {
    if (chatId && chatId !== currentChatId && isChatsLoaded) {
      // Check if the chat exists
      const chatExists = chats.some(chat => chat.id === chatId);
      if (chatExists) {
        setCurrentChatId(chatId);
      } else {
        // Chat doesn't exist, redirect to home page
        router.replace('/');
        return;
      }
    }
  }, [chatId, currentChatId, chats, setCurrentChatId, router, isChatsLoaded]);

  // If no chats exist after loading, redirect to home page
  useEffect(() => {
    if (isChatsLoaded && chats.length === 0) {
      router.replace('/');
      return;
    }
  }, [chats.length, router, isChatsLoaded]);

  // Show loading while chats are being loaded
  if (!isChatsLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // If chat doesn't exist, don't render anything (redirect will happen)
  if (!currentChat && chatId) {
    return null;
  }

  return (
    <ChatLayout
      chats={chats}
      currentChatId={currentChatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
      onRenameChat={handleRenameChat}
    >
      <ChatContainer
        messages={currentChat?.messages || []}
        isLoading={isLoading}
      />
      
      <div className="absolute bottom-0 left-0 right-0">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </ChatLayout>
  );
}
