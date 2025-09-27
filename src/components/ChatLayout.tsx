import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Chat } from '@/types';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatLayoutProps {
  children: ReactNode;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  showSidebar?: boolean;
}

export default function ChatLayout({
  children,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  showSidebar = true,
}: ChatLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useChatContext();
  return (
    <div className="flex flex-col md:flex-row h-screen bg-white text-gray-900">
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={onSelectChat}
          onNewChat={onNewChat}
          onDeleteChat={onDeleteChat}
          onRenameChat={onRenameChat}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 flex flex-col relative">
        {children}
      </div>
    </div>
  );
}
