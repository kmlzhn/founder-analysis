import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const prisma = new PrismaClient();

// Helper function to fetch analysis context for a chat
async function getAnalysisContext(chatId: string) {
  try {
    // Fetch chat with analyses and data sources
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        analyses: {
          include: {
            profile: true
          },
          orderBy: { createdAt: 'desc' }
        },
        dataSources: {
          include: {
            profiles: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!chat) return null;

    // Compile analysis context
    const analysisContext = {
      chatTitle: chat.title,
      totalAnalyses: chat.analyses.length,
      recentAnalyses: chat.analyses.slice(0, 3).map(analysis => ({
        id: analysis.id,
        type: analysis.type,
        overallScore: analysis.overallScore,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        profileName: analysis.profile?.name,
        createdAt: analysis.createdAt
      })),
      profilesAnalyzed: chat.dataSources.flatMap(ds => 
        ds.profiles.map(profile => ({
          name: profile.name,
          linkedinUrl: profile.linkedinUrl,
          twitterUrl: profile.twitterUrl
        }))
      ).slice(0, 5) // Limit to 5 most recent profiles
    };

    return analysisContext;
  } catch (error) {
    console.warn('Failed to fetch analysis context:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      messages, 
      chatId,
      conversationContext = 'general_chat'
    } = body;

    // Handle single message or conversation
    let conversationMessages;
    if (messages) {
      conversationMessages = messages;
    } else if (message) {
      conversationMessages = [{ role: 'user', content: message }];
    } else {
      return NextResponse.json(
        { error: 'Either "message" or "messages" is required' },
        { status: 400 }
      );
    }

    // Get analysis context if chatId is provided
    let analysisContext = null;
    if (chatId) {
      analysisContext = await getAnalysisContext(chatId);
    }

    // Create analysis-aware system prompt
    let systemPrompt = '';
    
    if (conversationContext === 'founder_analysis' && analysisContext) {
      systemPrompt = `You are a legendary venture capitalist with 30+ years of experience, having backed unicorns like Google, Facebook, Uber, and Airbnb. You are discussing analysis results with a colleague.

CHAT CONTEXT: "${analysisContext.chatTitle}"
TOTAL ANALYSES COMPLETED: ${analysisContext.totalAnalyses}

RECENT ANALYSIS RESULTS:
${analysisContext.recentAnalyses.map(analysis => `
- ${analysis.profileName || 'Unknown'} (Score: ${analysis.overallScore || 'N/A'}/100)
  Type: ${analysis.type}
  Summary: ${analysis.summary}
  Key Strengths: ${analysis.strengths.join(', ')}
  Areas for Improvement: ${analysis.weaknesses.join(', ')}
`).join('\n')}

PROFILES ANALYZED:
${analysisContext.profilesAnalyzed.map(profile => `- ${profile.name} (${profile.linkedinUrl})`).join('\n')}

Provide specific, actionable insights based on these analysis results. Reference specific founders, scores, and patterns when relevant. Be direct and insightful like a seasoned VC partner.`;
    } else if (conversationContext === 'founder_analysis') {
      systemPrompt = `You are a legendary venture capitalist with 30+ years of experience. You help analyze founders and provide investment insights. Be direct, insightful, and reference specific patterns from successful unicorn founders.`;
    } else {
      systemPrompt = `You are a helpful AI assistant specializing in founder analysis and venture capital insights.`;
    }

    // Prepare messages with system prompt
    const enhancedMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages
    ];

    console.log('Sending to Claude with analysis context:', {
      chatId,
      conversationContext,
      hasAnalysisContext: !!analysisContext,
      messagesCount: enhancedMessages.length
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500, // Increased for more detailed responses
      messages: enhancedMessages,
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : 'Response generation failed';

    return NextResponse.json({
      success: true,
      response: responseText,
      usage: response.usage,
      contextInfo: {
        chatId,
        conversationContext,
        analysisContextAvailable: !!analysisContext,
        totalAnalyses: analysisContext?.totalAnalyses || 0
      }
    });

  } catch (error) {
    console.error('Claude API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from Claude',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Analysis-Aware Claude Chat API is running',
    endpoint: '/api/chat',
    method: 'POST',
    capabilities: [
      'Analysis-aware conversations',
      'Chat context integration',
      'Founder-specific insights',
      'VC-style responses'
    ],
    inputOptions: {
      message: 'Single message string (alternative to messages array)',
      messages: 'Array of conversation messages',
      chatId: 'Optional: Chat ID for analysis context',
      conversationContext: 'Optional: "founder_analysis" or "general_chat"'
    },
    responseFormat: {
      response: 'Claude response text',
      contextInfo: 'Analysis context metadata',
      usage: 'Claude API usage statistics'
    },
    examples: {
      basicMessage: {
        message: 'Hello, how are you?'
      },
      analysisAwareChat: {
        message: 'Tell me more about this founder\'s technical background',
        chatId: 'chat_123',
        conversationContext: 'founder_analysis'
      },
      conversation: {
        messages: [
          { role: 'user', content: 'What do you think about the founder scores?' },
          { role: 'assistant', content: 'Based on the analysis...' },
          { role: 'user', content: 'How do they compare to successful founders?' }
        ],
        chatId: 'chat_123',
        conversationContext: 'founder_analysis'
      }
    }
  });
}
