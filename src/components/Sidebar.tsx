import { useState } from 'react';

interface Chat {
  id: string;
  title: string;
  timestamp: string;
  searchType?: 'name' | 'linkedin' | 'csv';
  searchQuery?: string;
  founderScore?: number;
}

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export default function Sidebar({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onNewChat,
  onDeleteChat
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white text-gray-800 rounded-md shadow-md transition-all duration-300 hover:shadow-lg"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-gray-50 text-gray-800 border-r border-gray-200 transform transition-all duration-300 ease-in-out z-30 shadow-lg ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 h-full flex flex-col">
          <button 
            onClick={onNewChat}
            className="w-full mb-4 py-3 px-4 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow flex items-center justify-center gap-2 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="font-medium">New Chat</span>
          </button>
          
          <div className="overflow-y-auto flex-1">
            <h2 className="text-sm font-medium text-gray-500 mb-3 ml-1">Recent Chats & Searches</h2>
            <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id} className="transition-all duration-300 hover:translate-x-1">
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSelectChat(chat.id); } }}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 transition-all duration-300 ${
                      currentChatId === chat.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {chat.searchType ? (
                      // Show search-specific icon
                      chat.searchType === 'name' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : chat.searchType === 'linkedin' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )
                    ) : (
                      // Default chat icon
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                      </svg>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{chat.title}</span>
                        </div>
                        {chat.founderScore && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {chat.founderScore}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600 transition-colors"
                          aria-label="Delete chat"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.5 4.5V6h3.75a.75.75 0 010 1.5h-.708l-1.036 12.43A2.25 2.25 0 0116.265 22.5H7.735a2.25 2.25 0 01-2.241-2.57L4.458 7.5H3.75A.75.75 0 013 6h3V4.5A2.25 2.25 0 018.25 2.25h7.5A2.25 2.25 0 0118 4.5zM9 6h6V4.5a.75.75 0 00-.75-.75h-4.5A.75.75 0 009 4.5V6zm-.75 4.5a.75.75 0 011.5 0v6.75a.75.75 0 01-1.5 0v-6.75zm6 0a.75.75 0 011.5 0v6.75a.75.75 0 01-1.5 0v-6.75z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {chats.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">
                  No chats yet. Start a new chat!
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
