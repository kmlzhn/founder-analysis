import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/messages - Add message to chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, role, content, attachments } = body;

    if (!chatId || !role || !content) {
      return NextResponse.json(
        { error: 'chatId, role, and content are required' },
        { status: 400 }
      );
    }

    if (!['USER', 'ASSISTANT'].includes(role.toUpperCase())) {
      return NextResponse.json(
        { error: 'role must be either "user" or "assistant"' },
        { status: 400 }
      );
    }

    // Create message
    const messageData = {
      chatId,
      role: role.toUpperCase() as 'USER' | 'ASSISTANT',
      content,
      ...(attachments && { attachments })
    };
    
    const message = await prisma.message.create({
      data: messageData
    });

    // Update chat's updatedAt timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    // Transform to match frontend interface
    const transformedMessage = {
      id: message.id,
      role: message.role,
      content: message.content,
      attachments: (message as Record<string, unknown>).attachments as unknown[] || undefined,
      createdAt: message.createdAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      message: transformedMessage
    });

  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/messages - Get messages for a chat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId query parameter is required' },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' }
    });

    // Transform to match frontend interface
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      attachments: (msg as Record<string, unknown>).attachments as unknown[] || undefined,
      createdAt: msg.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      messages: transformedMessages
    });

  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
