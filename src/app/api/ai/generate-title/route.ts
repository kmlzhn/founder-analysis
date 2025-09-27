import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 30,
      messages: [{
        role: 'user',
        content: `Generate a short chat title (max 25 characters) for this message:

"${message}"

Rules:
- If founder name mentioned: use name
- If LinkedIn URL: "Founder Analysis"  
- If analysis request: focus on type
- Keep it simple and short
- No quotes or extra words

Examples:
"Analyze John Smith" → "John Smith"
"linkedin.com/in/jane-doe" → "Jane Doe Analysis"
"Young B2B founders" → "Young B2B Founders"

Return ONLY the title:`
      }]
    });
    
    const aiTitle = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    
    // Ensure title is not too long and clean it up
    const cleanTitle = aiTitle.replace(/['"]/g, '').substring(0, 25);
    
    // Fallback title generation
    const fallbackTitle = message.length < 30 
      ? `Analysis of ${message}` 
      : message.split(' ').slice(0, 5).join(' ') + '...';
    
    return NextResponse.json({ 
      title: cleanTitle || fallbackTitle 
    });

  } catch (error) {
    console.error('AI title generation failed:', error);
    
    // Fallback title generation
    const { message } = await request.json();
    const fallbackTitle = message?.length < 30 
      ? `Analysis of ${message}` 
      : message?.split(' ').slice(0, 5).join(' ') + '...';
    
    return NextResponse.json({ 
      title: fallbackTitle || 'New Analysis'
    });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Title Generation API',
    description: 'POST /api/ai/generate-title with { message: string }',
    example: {
      input: { message: "Analyze John Smith LinkedIn profile" },
      output: { title: "John Smith Analysis" }
    }
  });
}
