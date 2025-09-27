import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/chats - Fetch all chats for user
export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform to match frontend Chat interface
    const transformedChats = chats.map(chat => ({
      id: chat.id,
      title: chat.title,
      messages: chat.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString()
      })),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      chats: transformedChats
    });

  } catch (error) {
    console.error('Failed to fetch chats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/chats - Create new chat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title = 'New Analysis' } = body;

    const chat = await prisma.chat.create({
      data: {
        title,
        userId: null // Anonymous for now
      },
      include: {
        messages: true
      }
    });

    // Transform to match frontend interface
    const transformedChat = {
      id: chat.id,
      title: chat.title,
      messages: [],
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      chat: transformedChat
    });

  } catch (error) {
    console.error('Failed to create chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
