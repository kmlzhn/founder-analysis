import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/chats/[chatId] - Fetch specific chat with messages
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Transform to match frontend interface
    const transformedChat = {
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
    };

    return NextResponse.json({
      success: true,
      chat: transformedChat
    });

  } catch (error) {
    console.error('Failed to fetch chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/chats/[chatId] - Update chat (rename)
export async function PUT(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;
    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { title },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Transform to match frontend interface
    const transformedChat = {
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
    };

    return NextResponse.json({
      success: true,
      chat: transformedChat
    });

  } catch (error) {
    console.error('Failed to update chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/chats/[chatId] - Delete chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    // Delete chat (messages will be cascade deleted due to Prisma schema)
    await prisma.chat.delete({
      where: { id: chatId }
    });

    return NextResponse.json({
      success: true,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
