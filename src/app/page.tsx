'use client';

import { useChatContext } from '@/contexts/ChatContext';
import ChatLayout from '@/components/ChatLayout';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import WelcomeScreen from '@/components/WelcomeScreen';

export default function Home() {
  const {
    chats,
    currentChatId,
    currentChat,
    isLoading,
    analysisProgress,
    handleSelectChat,
    handleNewChat,
    handleDeleteChat,
    handleRenameChat,
    handleSendMessage,
  } = useChatContext();

  // Don't auto-redirect - let user manually select chats or start typing
  

  // Check if we should show welcome screen (no current chat or empty chat)
  const showWelcomeScreen = !currentChatId || !currentChat || currentChat.messages.length === 0;

  return (
    <ChatLayout
      chats={chats}
      currentChatId={currentChatId}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
      onDeleteChat={handleDeleteChat}
      onRenameChat={handleRenameChat}
    >
      {showWelcomeScreen ? (
        <WelcomeScreen 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      ) : (
        <>
          <ChatContainer
            messages={currentChat?.messages || []}
            isLoading={isLoading}
            analysisProgress={analysisProgress}
          />
          
          <div className="absolute bottom-0 left-0 right-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </>
      )}
    </ChatLayout>
  );
}