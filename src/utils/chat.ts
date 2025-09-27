import { Chat, Message } from '@/types';

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Create a new chat
export function createNewChat(): Chat {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'New Analysis',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

// Create a new message
export function createMessage(role: 'USER' | 'ASSISTANT', content: string): Message {
  return {
    id: generateId(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

// localStorage functions removed - now using API persistence

// AI-powered smart title generation (via API)
export async function generateSmartTitle(message: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.statusText}`);
    }

    const { title } = await response.json();
    return title || extractTitleFromMessage(message); // Fallback
  } catch (error) {
    console.warn('AI title generation failed:', error);
    return extractTitleFromMessage(message); // Fallback
  }
}

// AI-powered user intent detection (via API)
export async function detectUserIntent(message: string): Promise<string> {
  try {
    const response = await fetch('/api/ai/detect-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`API failed: ${response.statusText}`);
    }

    const { intent } = await response.json();
    return intent || 'general_chat'; // Fallback
  } catch (error) {
    console.warn('AI intent detection failed:', error);
    // Fallback to simple detection
    const content = message.toLowerCase();
    if (content.includes('analyze') || content.includes('linkedin.com') || content.includes('founder')) {
      return 'founder_analysis';
    }
    return 'general_chat';
  }
}

// Extract a title from the first user message (fallback function)
export function extractTitleFromMessage(message: string): string {
  // If the message is a name (less than 30 chars), use it as the title
  if (message.length < 30) {
    return `Analysis of ${message}`;
  }
  
  // Otherwise, use the first few words
  return message.split(' ').slice(0, 5).join(' ') + '...';
}
