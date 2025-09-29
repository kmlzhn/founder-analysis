'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/types';
import { 
  generateSmartTitle,
  detectUserIntent 
} from '@/utils/chat';
import { createFileAttachments } from '@/utils/fileUtils';

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
  analysisProgress: {
    isActive: boolean;
    stage: string;
  };
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
  const [analysisProgress, setAnalysisProgress] = useState<{
    isActive: boolean;
    stage: string;
  }>({
    isActive: false,
    stage: ''
  });

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
    
    // Generate temporary message ID for optimistic update
    const tempMessageId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempMessageId,
      role: 'USER' as const,
      content,
      attachments: fileUrls.length > 0 ? createFileAttachments(fileUrls) : undefined,
      createdAt: new Date().toISOString()
    };
    
    // Create a new chat if there isn't one
    if (!targetChatId) {
      try {
        // Use immediate fallback title for instant UI update
        const tempTitle = content.length < 30 
          ? `Analysis of ${content}` 
          : content.split(' ').slice(0, 5).join(' ') + '...';
        
        // Create chat in database with temp title
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tempTitle
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create chat: ${response.statusText}`);
        }
        
        const { chat: newChat } = await response.json();
        
        // Add optimistic message to new chat immediately
        const newChatWithMessage = {
          ...newChat,
          messages: [optimisticMessage]
        };
        
        currentChats = [newChatWithMessage, ...chats];
        setChats(currentChats);
        setCurrentChatId(newChat.id);
        targetChatId = newChat.id;
        router.push(`/chat/${newChat.id}`);
        
        // Generate AI title in background (non-blocking)
        generateSmartTitle(content).then(aiTitle => {
          if (aiTitle && aiTitle !== tempTitle) {
            // Update title in background
            fetch(`/api/chats/${newChat.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: aiTitle })
            }).then(() => {
              // Update local state with new title
              setChats(prevChats => prevChats.map(chat => 
                chat.id === newChat.id ? { ...chat, title: aiTitle } : chat
              ));
            }).catch(error => {
              console.warn('Failed to update chat title:', error);
            });
          }
        }).catch(error => {
          console.warn('AI title generation failed:', error);
        });
      } catch (error) {
        console.error('Failed to create new chat:', error);
        return; // Exit if we can't create a chat
      }
    } else {
      // Add optimistic message to existing chat immediately
      const updatedChats = currentChats.map(chat => {
        if (chat.id === targetChatId) {
          return {
            ...chat,
            messages: [...chat.messages, optimisticMessage],
          };
        }
        return chat;
      });
      
      setChats(updatedChats);
      currentChats = updatedChats;
    }
    
    // Save user message to database in background (don't wait)
    const saveMessageToDatabase = async () => {
      try {
        const userMessageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: targetChatId,
            role: 'USER',
            content,
            attachments: fileUrls.length > 0 ? createFileAttachments(fileUrls) : undefined
          })
        });
        
        if (!userMessageResponse.ok) {
          throw new Error(`Failed to save user message: ${userMessageResponse.statusText}`);
        }
        
        const { message: realMessage } = await userMessageResponse.json();
        
        // Replace temporary message with real message from database
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === tempMessageId ? realMessage : msg
              ),
            };
          }
          return chat;
        }));
        
        console.log('Message saved to database successfully');
      } catch (error) {
        console.error('Failed to save user message:', error);
        
        // Error recovery: Mark message as failed and show retry option
        setChats(prevChats => prevChats.map(chat => {
          if (chat.id === targetChatId) {
            return {
              ...chat,
              messages: chat.messages.map(msg => 
                msg.id === tempMessageId ? { ...msg, failed: true } : msg
              ),
            };
          }
          return chat;
        }));
      }
    };
    
    // Start background save (don't await)
    saveMessageToDatabase();
    
    // Start loading
    setIsLoading(true);
    
    try {
      // Check if files are uploaded OR LinkedIn URLs in text - if so, trigger analysis in background
      const linkedInUrls = extractLinkedInUrls(content);
      if (fileUrls.length > 0 || linkedInUrls.length > 0) {
        console.log('Files detected, starting background analysis:', fileUrls);
        
        // Just show loading state, no extra messages
        
        // Start analysis in background (non-blocking)
        (async () => {
          try {
            // Start progress simulation
            const simulateAnalysisProgress = () => {
              const stages = [
                { stage: 'Extracting context', duration: 2000 },
                { stage: 'Scraping LinkedIn profiles', duration: 8000 },
                { stage: 'Gathering market research', duration: 15000 },
                { stage: 'Running AI analysis', duration: 25000 },
                { stage: 'Finalizing results', duration: 2000 }
              ];

              let currentStage = 0;
              const updateStage = () => {
                if (currentStage < stages.length) {
                  const stage = stages[currentStage];
                  setAnalysisProgress({
                    isActive: true,
                    stage: stage.stage
                  });
                  
                  setTimeout(() => {
                    currentStage++;
                    updateStage();
                  }, stage.duration);
                } else {
                  setAnalysisProgress({ isActive: false, stage: '' });
                }
              };
              
              updateStage();
            };
            
            simulateAnalysisProgress();
        
        // Call analysis API with files
        const requestBody = {
          textInput: content,
          fileUrls: fileUrls,
          enhanceWithPerplexity: false, // Perplexity integration disabled
          chatId: currentChatId // NEW: Pass chat ID for database operations
        };
        
        console.log('Sending analysis request:', requestBody);
        console.log('LinkedIn URLs found:', linkedInUrls);
        
        const analysisResponse = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json().catch(() => ({}));
          console.error('Analysis API error:', errorData);
          throw new Error(`Analysis API failed: ${analysisResponse.statusText}. ${errorData.error || ''}`);
        }

        const analysisData = await analysisResponse.json();
        
        console.log('Analysis data received:', analysisData);
        
        // Embed structured analysis data for custom card rendering
        let analysisMessage;
        try {
          const jsonString = JSON.stringify(analysisData);
          analysisMessage = `<!--ANALYSIS_DATA:${jsonString}-->

**Analysis Complete!** 

The analysis has been processed and is ready for review. Click to expand the detailed analysis card below.

**Processing Info:**
- Files processed: ${analysisData.processingInfo?.filesProcessed || 0}
- LinkedIn profiles found: ${analysisData.processingInfo?.linkedInUrlsFound || 0}
- Profiles analyzed: ${analysisData.processingInfo?.profilesAnalyzed || 1}
- Enhanced analysis: ${analysisData.processingInfo?.perplexityEnhanced ? 'Yes' : 'No'}`;
        } catch (error) {
          console.error('Failed to stringify analysis data:', error);
          // Fallback to simple message
          analysisMessage = `**Analysis Complete!** 

Score: ${analysisData.analysis?.overallScore || analysisData.score || 'N/A'}/100

**Processing Info:**
- Files processed: ${analysisData.processingInfo?.filesProcessed || 0}
- LinkedIn profiles found: ${analysisData.processingInfo?.linkedInUrlsFound || 0}
- Profiles analyzed: ${analysisData.processingInfo?.profilesAnalyzed || 1}
- Enhanced analysis: ${analysisData.processingInfo?.perplexityEnhanced ? 'Yes' : 'No'}`;
        }

        // Save structured analysis to database with proper profile linking
        const saveAnalysisData = {
          chatId: targetChatId,
          analysisData: analysisData,
          // Handle both single and multiple profile scenarios
          profileId: analysisData.databaseInfo?.primaryProfileId || null,
          profileIds: analysisData.databaseInfo?.allProfileIds || [],
          isMultiProfile: analysisData.multipleProfiles !== null
        };

        const saveAnalysisResponse = await fetch('/api/analyses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveAnalysisData)
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
            
          } catch (error) {
            console.error('Background analysis failed:', error);
            
            // Add error message to chat
            const errorMessage = {
              id: `analysis-error-${Date.now()}`,
              role: 'ASSISTANT' as const,
              content: `❌ **Analysis Failed**\n\nSorry, the analysis encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`,
              createdAt: new Date().toISOString()
            };
            
            setChats(prevChats => prevChats.map(chat => {
              if (chat.id === targetChatId) {
                return {
                  ...chat,
                  messages: [...chat.messages, errorMessage]
                };
              }
              return chat;
            }));
          }
        })();
        
        // Don't continue with regular chat flow - analysis will handle the response
        return;
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
    analysisProgress,
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
