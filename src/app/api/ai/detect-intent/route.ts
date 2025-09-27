import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(request: NextRequest) {
  let requestBody;
  
  try {
    // Parse request body once and store it
    requestBody = await request.json();
    const { message } = requestBody;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `Classify this user message intent. Return ONLY one of these exact options:

"${message}"

Options:
- founder_analysis (analyzing founders, LinkedIn profiles, startup potential)
- follow_up_question (questions about previous analysis results)
- investment_decision (should we invest, funding recommendations)
- comparison_request (comparing multiple founders or companies)
- data_request (asking for specific metrics, scores, details)
- general_chat (general conversation, greetings, other topics)

Return ONLY the option name:`
      }]
    });
    
    const intent = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    
    // Validate the response is one of our expected intents
    const validIntents = [
      'founder_analysis', 
      'follow_up_question', 
      'investment_decision', 
      'comparison_request', 
      'data_request', 
      'general_chat'
    ];
    
    const detectedIntent = validIntents.includes(intent) ? intent : 'general_chat';
    
    return NextResponse.json({ 
      intent: detectedIntent 
    });

  } catch (error) {
    console.error('AI intent detection failed:', error);
    
    // Use already parsed body or create fallback
    const message = requestBody?.message;
    const content = message?.toLowerCase() || '';
    
    let fallbackIntent = 'general_chat';
    if (content.includes('analyze') || content.includes('linkedin.com') || content.includes('founder')) {
      fallbackIntent = 'founder_analysis';
    }
    
    return NextResponse.json({ 
      intent: fallbackIntent
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Intent Detection API',
    description: 'POST /api/ai/detect-intent with { message: string }',
    validIntents: [
      'founder_analysis', 
      'follow_up_question', 
      'investment_decision', 
      'comparison_request', 
      'data_request', 
      'general_chat'
    ],
    example: {
      input: { message: "Analyze this LinkedIn profile" },
      output: { intent: "founder_analysis" }
    }
  });
}
