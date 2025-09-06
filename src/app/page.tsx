'use client';

import { useState, useEffect } from 'react';
import { Chat, Message } from '@/types';
import { createNewChat, createMessage, saveChatsToLocalStorage, loadChatsFromLocalStorage, extractTitleFromMessage } from '@/utils/chat';
import ChatInput from '@/components/ChatInput';
import ChatContainer from '@/components/ChatContainer';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chats from localStorage and search history on initial render
  useEffect(() => {
    const loadData = async () => {
      // Load chats from localStorage
      const savedChats = loadChatsFromLocalStorage();
      
      // Load search history from database
      try {
        const response = await fetch('/api/searches?limit=20');
        if (response.ok) {
          const data = await response.json();
          const searchChats = data.searches.map((search: any) => ({
            id: `search-${search.id}`,
            title: search.searchType === 'name' 
              ? `Analysis of ${search.searchQuery}`
              : search.searchType === 'linkedin'
                ? `LinkedIn Analysis: ${search.searchQuery.split('/').pop() || 'Profile'}`
                : `CSV Analysis: ${search.searchQuery}`,
            messages: [
              {
                id: `user-${search.id}`,
                role: 'user' as const,
                content: search.searchType === 'name' 
                  ? search.searchQuery
                  : search.searchType === 'linkedin'
                    ? `LinkedIn Profile: ${search.searchQuery}`
                    : `CSV File: ${search.searchQuery}`
              },
              {
                id: `assistant-${search.id}`,
                role: 'assistant' as const,
                content: `Analysis completed with score: ${search.founderScore}/100\n\n\`\`\`json\n${JSON.stringify(search.analysisResults, null, 2)}\n\`\`\``
              }
            ],
            createdAt: search.createdAt,
            searchType: search.searchType,
            searchQuery: search.searchQuery,
            founderScore: search.founderScore
          }));
          
          // Filter out duplicate chats by ID before combining
          const searchChatIds = new Set(searchChats.map((chat: Chat) => chat.id));
          const uniqueSavedChats = savedChats.filter((chat: Chat) => !searchChatIds.has(chat.id));
          
          // Combine unique saved chats with search history
          const allChats = [...uniqueSavedChats, ...searchChats];
          
          if (allChats.length > 0) {
            setChats(allChats);
            setCurrentChatId(allChats[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading search history:', error);
        // Fallback to just localStorage chats
        if (savedChats.length > 0) {
          setChats(savedChats);
          setCurrentChatId(savedChats[0].id);
        }
      }
    };
    
    loadData();
  }, []);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    // Persist only local chats (exclude server-side search history items)
    const localChats = chats.filter(chat => !chat.id.startsWith('search-'));
    saveChatsToLocalStorage(localChats);
  }, [chats]);

  // Get the current chat
  const currentChat = chats.find(chat => chat.id === currentChatId) || null;
  
  // Create a new chat
  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  // Select a chat
  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    
    // If this is a search from history, we can optionally rerun the analysis
    const selectedChat = chats.find(chat => chat.id === chatId);
    if (selectedChat && selectedChat.searchType && selectedChat.searchQuery) {
      // The chat is already loaded with the analysis results
      // User can view the previous analysis or start a new one
    }
  };

  // Delete a chat (local chat or server-side search history)
  const handleDeleteChat = async (chatId: string) => {
    const chatToDelete = chats.find(c => c.id === chatId);
    if (!chatToDelete) return;

    // If this is a saved search from the server, call the DELETE API
    if (chatId.startsWith('search-')) {
      const serverId = chatId.replace('search-', '');
      try {
        await fetch(`/api/searches?id=${encodeURIComponent(serverId)}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete search from server:', e);
      }
    }

    // Remove from local state
    const remaining = chats.filter(c => c.id !== chatId);
    setChats(remaining);

    // Update current chat selection if needed
    if (currentChatId === chatId) {
      setCurrentChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Process analysis request
  const processAnalysisRequest = async (content: string, requestType: 'text' | 'csv' | 'linkedin', payload?: any) => {
    // Create a new chat if there isn't one
    if (!currentChatId) {
      handleNewChat();
    }
    
    // Add user message
    let userMessageContent = content;
    
    if (requestType === 'csv') {
      userMessageContent = `Analysis of uploaded CSV file: ${content}`;
    } else if (requestType === 'linkedin') {
      userMessageContent = `Analysis of LinkedIn profile: ${content}`;
    }
    
    const userMessage = createMessage('user', userMessageContent);
    
    // Update chat with user message
    const updatedChats = chats.map(chat => {
      if (chat.id === currentChatId) {
        // Update the chat title if this is the first message
        const updatedChat = {
          ...chat,
          messages: [...chat.messages, userMessage],
        };
        
        if (chat.messages.length === 0) {
          updatedChat.title = extractTitleFromMessage(content);
          // Add search type information
          if (requestType === 'text') {
            updatedChat.searchType = 'name';
            updatedChat.searchQuery = content;
          } else if (requestType === 'linkedin') {
            updatedChat.searchType = 'linkedin';
            updatedChat.searchQuery = content;
          } else if (requestType === 'csv') {
            updatedChat.searchType = 'csv';
            updatedChat.searchQuery = content;
          }
        }
        
        return updatedChat;
      }
      return chat;
    });
    
    setChats(updatedChats);
    
    // Start loading
    setIsLoading(true);
    
    try {
      // Call the API
      let apiEndpoint;
      
      if (requestType === 'linkedin') {
        apiEndpoint = '/api/analyze/linkedin';
      } else if (requestType === 'csv') {
        apiEndpoint = '/api/analyze/csv';
      } else {
        apiEndpoint = '/api/analyze';
      }
      
      const requestBody = requestType === 'text' 
        ? { name: content }
        : requestType === 'linkedin'
          ? { linkedinUrl: content }
          : { csvData: payload };
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze founder (${requestType})`);
      }
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage = createMessage('assistant', data.analysis);
      
      // Update chat with AI message and score
      const finalChats = updatedChats.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiMessage],
            founderScore: data.score || undefined,
          };
        }
        return chat;
      });
      
      setChats(finalChats);
    } catch (error) {
      console.error('Error:', error);
      
      // Add error message
      const errorMessage = createMessage(
        'assistant',
        'Sorry, there was an error during analysis. Please try again.'
      );
      
      // Update chat with error message
      const finalChats = updatedChats.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [...chat.messages, errorMessage],
          };
        }
        return chat;
      });
      
      setChats(finalChats);
    } finally {
      // Stop loading
      setIsLoading(false);
    }
  };

  // Handle text message
  const handleSendMessage = async (content: string) => {
    await processAnalysisRequest(content, 'text');
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csvData = e.target?.result as string;
        
        // Update the processAnalysisRequest to handle the file name
        const requestType = 'csv';
        const content = file.name;
        
        // Create a new chat if there isn't one
        if (!currentChatId) {
          handleNewChat();
        }
        
        // Add user message
        const userMessageContent = `Analysis of uploaded CSV file: ${content}`;
        const userMessage = createMessage('user', userMessageContent);
        
        // Update chat with user message
        const updatedChats = chats.map(chat => {
          if (chat.id === currentChatId) {
            // Update the chat title if this is the first message
            const updatedChat = {
              ...chat,
              messages: [...chat.messages, userMessage],
            };
            
            if (chat.messages.length === 0) {
              updatedChat.title = extractTitleFromMessage(content);
            }
            
            return updatedChat;
          }
          return chat;
        });
        
        setChats(updatedChats);
        
        // Start loading
        setIsLoading(true);
        
        try {
          // Call the API with the filename included
          const apiEndpoint = '/api/analyze/csv';
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              csvData,
              fileName: file.name
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to analyze founder (${requestType})`);
          }
          
          const data = await response.json();
          
          // Add AI response
          const aiMessage = createMessage('assistant', data.analysis);
          
          // Update chat with AI message
          const finalChats = updatedChats.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: [...chat.messages, aiMessage],
              };
            }
            return chat;
          });
          
          setChats(finalChats);
        } catch (error) {
          console.error('Error:', error);
          
          // Add error message
          const errorMessage = createMessage(
            'assistant',
            'Sorry, there was an error during analysis. Please try again.'
          );
          
          // Update chat with error message
          const finalChats = updatedChats.map(chat => {
            if (chat.id === currentChatId) {
              return {
                ...chat,
                messages: [...chat.messages, errorMessage],
              };
            }
            return chat;
          });
          
          setChats(finalChats);
        } finally {
          // Stop loading
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        throw new Error('Failed to read file');
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };
  
  // Handle LinkedIn URL submission
  const handleLinkedInSubmit = async (url: string) => {
    await processAnalysisRequest(url, 'linkedin');
  };



  return (
    <div className="flex flex-col md:flex-row h-screen bg-white text-gray-900">
      {/* Sidebar */}
      <Sidebar
        chats={chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          timestamp: chat.createdAt,
          searchType: chat.searchType,
          searchQuery: chat.searchQuery,
          founderScore: chat.founderScore,
        }))}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat container */}
        <ChatContainer
          messages={currentChat?.messages || []}
          isLoading={isLoading}
        />
        
        {/* Input - positioned over content */}
        <div className="absolute bottom-0 left-0 right-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onLinkedInSubmit={handleLinkedInSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}