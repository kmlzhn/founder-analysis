'use client';

import { useChatContext } from '@/contexts/ChatContext';
import ChatLayout from '@/components/ChatLayout';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';

export default function Home() {
  const {
    chats,
    currentChatId,
    currentChat,
    isLoading,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    handleSendMessage,
  } = useChatContext();

  // Don't auto-redirect - let user manually select chats or start typing
  

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