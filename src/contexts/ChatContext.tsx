'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/types';
import { 
  generateSmartTitle,
  detectUserIntent 
} from '@/utils/chat';

// Helper function to extract LinkedIn URLs from text
function extractLinkedInUrls(text: string): string[] {
  const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/g;
  return text.match(linkedinRegex) || [];
}

interface ChatContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  isLoading: boolean;
  isChatsLoaded: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleNewChat: () => void;
  handleSelectChat: (chatId: string) => void;
  handleDeleteChat: (chatId: string) => void;
  handleRenameChat: (chatId: string, newTitle: string) => void;
  handleSendMessage: (content: string, fileUrls?: string[]) => void;
  setCurrentChatId: (chatId: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatsLoaded, setIsChatsLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load chats from API on initial render
  useEffect(() => {
    const loadChats = async () => {
      try {
        const response = await fetch('/api/chats');
        if (response.ok) {
          const { chats: savedChats } = await response.json();
          setChats(savedChats || []);
        } else {
          console.error('Failed to load chats:', response.statusText);
          setChats([]);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
        setChats([]);
      } finally {
        setIsChatsLoaded(true);
      }
    };
    
    loadChats();
  }, []);

  // Get the current chat
  const currentChat = chats.find(chat => chat.id === currentChatId) || null;
  
  // Navigate to empty chat state (home page)
  const handleNewChat = () => {
    setCurrentChatId(null);  // Clear current selection
    router.push('/');        // Navigate to home page
  };

  // Select a chat
  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    // Navigate to the selected chat
    router.push(`/chat/${chatId}`);
  };

  // Delete a chat
  const handleDeleteChat = async (chatId: string) => {
    // Optimistic update - remove from local state immediately
    const remaining = chats.filter(c => c.id !== chatId);
    setChats(remaining);

    // Always clear current chat and go to home page after deletion
    setCurrentChatId(null);
    router.push('/');
    
    // Call API to delete from database
    try {
      const response = await fetch(`/api/chats/${chatId}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete chat: ${response.statusText}`);
      }
      
      console.log('Chat deleted successfully:', chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      // Revert optimistic update on error
      setChats(chats);
    }
  };

  // Rename a chat
  const handleRenameChat = async (chatId: string, newTitle: string) => {
    // Store original title for potential rollback
    const originalChat = chats.find(chat => chat.id === chatId);
    const originalTitle = originalChat?.title || '';
    
    // Update local state immediately (optimistic update)
    setChats(chats.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
    
    // Call API to update in database
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to rename chat: ${response.statusText}`);
      }
      
      console.log('Chat renamed successfully:', chatId, newTitle);
    } catch (error) {
      console.error('Failed to rename chat:', error);
      // Revert optimistic update on error
      setChats(chats.map(chat => 
        chat.id === chatId ? { ...chat, title: originalTitle } : chat
      ));
    }
  };

  // Handle text message with optional file URLs
  const handleSendMessage = async (content: string, fileUrls: string[] = []) => {
    let targetChatId = currentChatId;
    let currentChats = chats;
    
    // Create a new chat if there isn't one
    if (!targetChatId) {
      try {
        // Generate smart title with AI
        const chatTitle = await generateSmartTitle(content);
        
        // Create chat in database first
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: chatTitle
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create chat: ${response.statusText}`);
        }
        
        const { chat: newChat } = await response.json();
        currentChats = [newChat, ...chats];
        setChats(currentChats);
        setCurrentChatId(newChat.id);
        targetChatId = newChat.id;
        router.push(`/chat/${newChat.id}`);
      } catch (error) {
        console.error('Failed to create new chat:', error);
        return; // Exit if we can't create a chat
      }
    }
    
    // Add user message to database
    try {
      const userMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChatId,
          role: 'USER',
          content
        })
      });
      
      if (!userMessageResponse.ok) {
        throw new Error(`Failed to save user message: ${userMessageResponse.statusText}`);
      }
      
      const { message: userMessage } = await userMessageResponse.json();
      
      // Update local state with user message
      const updatedChats = currentChats.map(chat => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: [...chat.messages, userMessage],
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
    } catch (error) {
      console.error('Failed to save user message:', error);
      return; // Exit if we can't save the message
    }
    
    // Start loading
    setIsLoading(true);
    
    try {
      // Check if files are uploaded OR LinkedIn URLs in text - if so, trigger analysis instead of regular chat
      const linkedInUrls = extractLinkedInUrls(content);
      if (fileUrls.length > 0 || linkedInUrls.length > 0) {
        console.log('Files detected, triggering analysis:', fileUrls);
        
        // Call analysis API with files
        const analysisResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            textInput: content,
            fileUrls: fileUrls,
            enhanceWithPerplexity: true
          })
        });

        if (!analysisResponse.ok) {
          throw new Error(`Analysis API failed: ${analysisResponse.statusText}`);
        }

        const analysisData = await analysisResponse.json();
        
        // Format analysis results for display - let AI format naturally
        let analysisMessage = analysisData.analysis || analysisData.rawAnalysis || 'Analysis completed successfully.';
        
        // Add score if available
        if (analysisData.overallScore) {
          analysisMessage = `**Overall Score:** ${analysisData.overallScore}/100\n\n${analysisMessage}`;
        }

        // Add multiple profiles results if available
        if (analysisData.multipleProfiles && analysisData.multipleProfiles.analyses.length > 0) {
          analysisMessage += `

## Multiple Profiles Analysis (${analysisData.multipleProfiles.totalProfiles} profiles)

**Average Score:** ${analysisData.multipleProfiles.averageScore}/100

`;
          
          analysisData.multipleProfiles.analyses.forEach((profileAnalysis: Record<string, unknown>) => {
            const analysis = profileAnalysis.analysis as Record<string, unknown>;
            analysisMessage += `### ${profileAnalysis.profileName}
**Score:** ${analysis.overallScore}/100
**Summary:** ${analysis.summary}
**Strengths:** ${Array.isArray(analysis.keyStrengths) ? analysis.keyStrengths.join(', ') : 'N/A'}
**Concerns:** ${Array.isArray(analysis.concerns) ? analysis.concerns.join(', ') : 'N/A'}

`;
          });
        }

        analysisMessage += `
**Processing Info:**
- Files processed: ${analysisData.processingInfo?.filesProcessed || 0}
- LinkedIn profiles found: ${analysisData.processingInfo?.linkedInUrlsFound || 0}
- Profiles analyzed: ${analysisData.processingInfo?.profilesAnalyzed || 1}
- Perplexity enhanced: ${analysisData.processingInfo?.perplexityEnhanced ? 'Yes' : 'No'}`;

        // Save structured analysis to database
        const saveAnalysisResponse = await fetch('/api/analyses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: targetChatId,
            analysisData: analysisData
          })
        });

        if (!saveAnalysisResponse.ok) {
          console.warn('Failed to save analysis to database:', saveAnalysisResponse.statusText);
        }

        // Save analysis response to database
        const aiMessageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: targetChatId,
            role: 'ASSISTANT',
            content: analysisMessage
          })
        });
        
        if (!aiMessageResponse.ok) {
          throw new Error(`Failed to save analysis message: ${aiMessageResponse.statusText}`);
        }
        
        const { message: aiMessage } = await aiMessageResponse.json();
        
        // Update chat with analysis message
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: [...chat.messages, aiMessage],
            };
          }
          return chat;
        }));
        
        return; // Exit early since we handled the analysis
      }

      // Regular chat flow - detect user intent with AI
      const userIntent = await detectUserIntent(content);
      
      // Map intent to conversation context
      let conversationContext = 'general_chat';
      switch (userIntent) {
        case 'founder_analysis':
        case 'follow_up_question':
        case 'investment_decision':
        case 'comparison_request':
        case 'data_request':
          conversationContext = 'founder_analysis';
          break;
        default:
          conversationContext = 'general_chat';
      }
      
      console.log('Detected user intent:', userIntent, '→ context:', conversationContext);
      
      // Get chat response from enhanced chat API
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          chatId: targetChatId,
          conversationContext
        })
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API failed: ${chatResponse.statusText}`);
      }

      const { response: aiResponse, contextInfo } = await chatResponse.json();
      
      console.log('Chat response received:', {
        hasAnalysisContext: contextInfo?.analysisContextAvailable,
        totalAnalyses: contextInfo?.totalAnalyses
      });

      // Save AI response to database
      const aiMessageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: targetChatId,
          role: 'ASSISTANT',
          content: aiResponse
        })
      });
      
      if (!aiMessageResponse.ok) {
        throw new Error(`Failed to save AI message: ${aiMessageResponse.statusText}`);
      }
      
      const { message: aiMessage } = await aiMessageResponse.json();
      
      // Update chat with AI message
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiMessage],
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error('Error:', error);
      
      // Save error message to database
      try {
        const errorMessageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: targetChatId,
            role: 'assistant',
            content: 'Sorry, there was an error processing your request. Please try again.'
          })
        });
        
        if (errorMessageResponse.ok) {
          const { message: errorMessage } = await errorMessageResponse.json();
          
          // Update chat with error message
          setChats(prevChats => prevChats.map(chat => {
            if (chat.id === targetChatId) {
              return {
                ...chat,
                messages: [...chat.messages, errorMessage],
              };
            }
            return chat;
          }));
        }
      } catch (saveError) {
        console.error('Failed to save error message:', saveError);
      }
    } finally {
      // Stop loading
      setIsLoading(false);
    }
  };

  const value: ChatContextType = {
    chats,
    currentChatId,
    currentChat,
    isLoading,
    isChatsLoaded,
    sidebarOpen,
    setSidebarOpen,
    handleNewChat,
    handleSelectChat,
    handleDeleteChat,
    handleRenameChat,
    handleSendMessage,
    setCurrentChatId,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
