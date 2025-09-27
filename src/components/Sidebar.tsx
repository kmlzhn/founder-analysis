import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MessageSquare, 
  Trash2,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import RenameModal from './RenameModal';
import { useChatContext } from '@/contexts/ChatContext';
import { Chat } from '@/types';

interface SidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export default function Sidebar({ 
  chats, 
  currentChatId, 
  onSelectChat, 
  onNewChat,
  onDeleteChat,
  onRenameChat
}: SidebarProps) {
  const { sidebarOpen: isOpen, setSidebarOpen: setIsOpen } = useChatContext();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [chatToRename, setChatToRename] = useState<{id: string, title: string} | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const getIconForChat = () => {
    return MessageSquare;
  };

  const handleRenameClick = (chat: Chat) => {
    setChatToRename({ id: chat.id, title: chat.title });
  };

  const handleRenameSubmit = async (newTitle: string) => {
    if (chatToRename) {
      setIsRenaming(true);
      try {
        await onRenameChat(chatToRename.id, newTitle);
        setChatToRename(null);
      } catch (error) {
        console.error('Failed to rename chat:', error);
      } finally {
        setIsRenaming(false);
      }
    }
  };

  const handleRenameClose = () => {
    setChatToRename(null);
    setIsRenaming(false);
  };


  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden h-16 px-4 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
        <h1 className="text-lg font-semibold text-gray-900">Founder Analysis</h1>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-gray-100/80 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        className="hidden md:flex h-full bg-white/80 backdrop-blur-sm border-r border-gray-200/60 flex-shrink-0"
        animate={{
          width: isOpen ? "300px" : "60px",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex flex-col h-full w-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/60">
            <div className="flex items-center justify-between h-8">
              <motion.h1
                animate={{
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="text-lg font-semibold text-gray-900 whitespace-nowrap"
                style={{ display: isOpen ? "block" : "none" }}
              >
                Founder Analysis
              </motion.h1>
              
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 rounded-lg bg-gray-100/80 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                {isOpen ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-hidden p-2">
            <div className="h-8 flex items-center justify-between mb-3 px-2">
              <motion.h2
                animate={{
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                style={{ display: isOpen ? "block" : "none" }}
              >
                Recent Chats
              </motion.h2>
              
              <button
                onClick={onNewChat}
                className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center p-1.5 flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-1">
              {chats.map((chat) => {
                const IconComponent = getIconForChat();
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "flex items-center gap-2 pl-1 pr-2 py-2 rounded-2xl cursor-pointer transition-all group h-12",
                      currentChatId === chat.id 
                        ? 'bg-blue-50 border border-blue-200/60' 
                        : 'hover:bg-gray-100/80 border border-transparent'
                    )}
                  >
                    <div className={cn(
                      "p-2 flex-shrink-0 w-8 h-8 flex items-center justify-center",
                      currentChatId === chat.id
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    )}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    
                    <motion.div
                      animate={{
                        display: isOpen ? "flex" : "none",
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 flex items-center justify-between overflow-hidden"
                    >
                      <motion.h3
                        className={cn(
                          "font-medium truncate text-sm whitespace-pre",
                          currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'
                        )}
                      >
                        {chat.title}
                      </motion.h3>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleRenameClick(chat);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-blue-500 transition-all"
                          title="Rename chat"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setChatToDelete(chat.id); 
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              
              {chats.length === 0 && isOpen && (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gray-100/80 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    No chats yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Start a new analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-white z-50 flex flex-col md:hidden"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-gray-200/60">
              <h1 className="text-lg font-semibold text-gray-900">Founder Analysis</h1>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-lg bg-gray-100/80 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden p-4">
              <button
                onClick={() => {
                  onNewChat();
                  setIsMobileOpen(false);
                }}
                className="w-full py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-2xl transition-colors flex items-center justify-center gap-2 font-medium mb-6"
              >
                <Plus className="w-4 h-4" />
                <span>New Analysis</span>
              </button>
              
              <h2 className="text-xs font-medium text-gray-500 mb-3 px-1 uppercase tracking-wide">
                Recent Chats
              </h2>
              
              <div className="overflow-y-auto space-y-2">
                {chats.map((chat) => {
                  const IconComponent = getIconForChat();
                  
                  return (
                    <div
                      key={chat.id}
                      onClick={() => {
                        onSelectChat(chat.id);
                        setIsMobileOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors group",
                        currentChatId === chat.id 
                          ? 'bg-blue-50 border border-blue-200/60' 
                          : 'hover:bg-gray-100/80 border border-transparent'
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        currentChatId === chat.id
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100/80 text-gray-500'
                      )}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <h3 className={cn(
                            "font-medium truncate text-sm",
                            currentChatId === chat.id ? 'text-blue-900' : 'text-gray-900'
                          )}>
                            {chat.title}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleRenameClick(chat);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-opacity"
                          title="Rename chat"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setChatToDelete(chat.id); 
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-opacity"
                          title="Delete chat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setChatToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm border rounded-[22px] border-gray-200/60 p-1 w-full mx-auto shadow-sm bg-white/80 backdrop-blur-sm"
            >
              <div className="relative rounded-2xl border border-gray-100 bg-transparent flex flex-col p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Chat?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  This action cannot be undone. The chat will be permanently deleted.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setChatToDelete(null)}
                    className="flex-1 py-2.5 px-4 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-[18px] transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onDeleteChat(chatToDelete);
                      setChatToDelete(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-[18px] transition-all duration-200 font-medium shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!chatToRename}
        currentTitle={chatToRename?.title || ''}
        onClose={handleRenameClose}
        onRename={handleRenameSubmit}
        isLoading={isRenaming}
      />
    </>
  );
}