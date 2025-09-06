import { Chat, Message } from '@/types';

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Create a new chat
export function createNewChat(): Chat {
  return {
    id: generateId(),
    title: 'New Analysis',
    messages: [],
    createdAt: new Date().toISOString(),
  };
}

// Create a new message
export function createMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: generateId(),
    role,
    content,
  };
}

// Save chats to localStorage
export function saveChatsToLocalStorage(chats: Chat[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('founder-analysis-chats', JSON.stringify(chats));
  }
}

// Load chats from localStorage
export function loadChatsFromLocalStorage(): Chat[] {
  if (typeof window !== 'undefined') {
    const savedChats = localStorage.getItem('founder-analysis-chats');
    if (savedChats) {
      return JSON.parse(savedChats);
    }
  }
  return [];
}

// Extract a title from the first user message
export function extractTitleFromMessage(message: string): string {
  // If the message is a name (less than 30 chars), use it as the title
  if (message.length < 30) {
    return `Analysis of ${message}`;
  }
  
  // Otherwise, use the first few words
  return message.split(' ').slice(0, 5).join(' ') + '...';
}
