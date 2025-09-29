import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

const prisma = new PrismaClient();

// Helper function to enhance response with Perplexity search
async function enhanceWithPerplexity(
  originalQuestion: string,
  claudeResponse: string,
  profileData: Record<string, unknown>,
  neededTopic: string
): Promise<string> {
  try {
    // Generate simple, focused search query
    const founderName = profileData.fullName || profileData.name || 'founder';
    const searchQuery = `"${founderName}" ${neededTopic}`;
    
    // Call Perplexity search API
    const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: searchQuery,
        maxResults: 5
      })
    });
    
    if (!searchResponse.ok) {
      return claudeResponse; // Return original response if search fails
    }
    
    const searchData = await searchResponse.json();
    const { results } = searchData;
    
    if (!results || results.length === 0) {
      return claudeResponse; // Return original if no results
    }
    
    // Generate enhanced response using Claude with search results
    const enhancedResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a legendary VC. The user asked: "${originalQuestion}"

You initially responded: "${claudeResponse}"

Now you have additional web search results about "${neededTopic}":
${JSON.stringify(results.slice(0, 3), null, 2)}

Provide a comprehensive response that:
1. Combines your original LinkedIn analysis with the new web research
2. Directly answers the user's question with the additional information found
3. Maintains your VC expertise and insight
4. Don't mention "NEED_MORE_INFO" - just provide the enhanced answer

Be specific and reference the search results when relevant.`
      }]
    });
    
    const enhancedText = enhancedResponse.content[0].type === 'text' ? enhancedResponse.content[0].text : claudeResponse;
    return enhancedText;
    
  } catch {
    return claudeResponse; // Return original response if enhancement fails
  }
}

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

    // DEBUG: Log database retrieval
    console.log('=== DATABASE DEBUG INFO ===');
    console.log('Chat found:', !!chat);
    console.log('Analyses count:', chat.analyses.length);
    console.log('DataSources count:', chat.dataSources.length);
    
    if (chat.analyses.length > 0) {
      const firstAnalysis = chat.analyses[0];
      console.log('First analysis ID:', firstAnalysis.id);
      console.log('First analysis has profile:', !!firstAnalysis.profile);
      console.log('First analysis detailedResults keys:', Object.keys(firstAnalysis.detailedResults as Record<string, unknown> || {}));
      
      if (firstAnalysis.profile) {
        console.log('Profile data keys:', Object.keys(firstAnalysis.profile.profileData as Record<string, unknown> || {}));
      }
      
      const detailedResults = firstAnalysis.detailedResults as Record<string, unknown>;
      if (detailedResults) {
        console.log('DetailedResults has linkedInProfiles:', !!detailedResults.linkedInProfiles);
        console.log('DetailedResults has primaryProfile:', !!detailedResults.primaryProfile);
        console.log('LinkedInProfiles count:', (detailedResults.linkedInProfiles as Array<Record<string, unknown>>)?.length || 0);
      }
    }
    console.log('=== END DATABASE DEBUG ===');

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
        createdAt: analysis.createdAt,
        // Add full data access with fallbacks
        fullProfileData: analysis.profile?.profileData as Record<string, unknown> || 
          (analysis.detailedResults as Record<string, unknown>)?.primaryProfile as Record<string, unknown> ||
          (analysis.detailedResults as Record<string, unknown>)?.profileData as Record<string, unknown>,
        linkedInProfiles: (analysis.detailedResults as Record<string, unknown>)?.linkedInProfiles as Record<string, unknown>[] || [],
        detailedAnalysis: analysis.detailedResults as Record<string, unknown>,
        perplexityData: (analysis.detailedResults as Record<string, unknown>)?.enhancedContext ||
          (analysis.detailedResults as Record<string, unknown>)?.perplexityData
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
      
      // If no analysis context but this looks like an analysis request, wait a bit
      if (!analysisContext || analysisContext.totalAnalyses === 0) {
        // Check if this might be an analysis request (mentions files, LinkedIn, etc.)
        const messageText = conversationMessages.map((m: { content: string }) => m.content).join(' ').toLowerCase();
        const isLikelyAnalysisRequest = messageText.includes('linkedin') || 
                                       messageText.includes('profile') || 
                                       messageText.includes('analyze') ||
                                       messageText.includes('file') ||
                                       messageText.includes('upload');
        
        if (isLikelyAnalysisRequest) {
          console.log('Detected potential analysis request, waiting for results...');
          // Wait up to 10 seconds for analysis to complete
          for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            const updatedContext = await getAnalysisContext(chatId);
            if (updatedContext && updatedContext.totalAnalyses > 0) {
              console.log('Analysis results found after waiting');
              analysisContext = updatedContext;
              break;
            }
          }
        }
      }
    }

    // Create analysis-aware system prompt
    let systemPrompt = '';
    
    if (analysisContext) {
      systemPrompt = `You are a legendary venture capitalist with 30+ years of experience, having backed unicorns like Google, Facebook, Uber, and Airbnb. You are discussing analysis results with a colleague.

IMPORTANT: If you don't have sufficient information to fully answer a question about the founder (such as education details, work history, or background not in the LinkedIn data), start your response with "NEED_MORE_INFO: [specific topic]" followed by what you do know from the available data.

CHAT CONTEXT: "${analysisContext.chatTitle}"
TOTAL ANALYSES COMPLETED: ${analysisContext.totalAnalyses}

RECENT ANALYSIS RESULTS:
${analysisContext.recentAnalyses.map(analysis => {
  let result = `
- ${analysis.profileName || 'Unknown'} (Score: ${analysis.overallScore || 'N/A'}/100)
  Type: ${analysis.type}
  Summary: ${analysis.summary}
  Key Strengths: ${analysis.strengths.join(', ')}
  Areas for Improvement: ${analysis.weaknesses.join(', ')}`;

  // Add LinkedIn profile data if available
  if (analysis.fullProfileData) {
    const profile = analysis.fullProfileData as Record<string, unknown>;
    result += `
  
  LINKEDIN PROFILE DETAILS:
  - Name: ${profile.name || profile.fullName || 'N/A'}
  - Headline: ${profile.headline || 'N/A'}
  - Location: ${profile.addressWithCountry || profile.location || 'N/A'}
  - Connections: ${profile.connections || 'N/A'}
  - About: ${profile.about || 'N/A'}
  - Current Job: ${profile.jobTitle || 'N/A'} at ${profile.companyName || 'N/A'}
  - Education: ${JSON.stringify(profile.educations || profile.education || [])}
  - Experience: ${JSON.stringify(profile.experiences || profile.experience || [])}
  - Skills: ${JSON.stringify((profile.skills as Array<{title: string}>)?.map(s => s.title) || [])}
  - Languages: ${JSON.stringify(profile.languages || [])}`;
  }
  
  // Add multiple LinkedIn profiles if available
  if (analysis.linkedInProfiles && analysis.linkedInProfiles.length > 0) {
    result += `
  
  ALL LINKEDIN PROFILES ANALYZED:`;
    analysis.linkedInProfiles.forEach((profile: Record<string, unknown>, index: number) => {
      result += `
  
  Profile ${index + 1}: ${profile.name || profile.fullName || 'Unknown'}
  - Headline: ${profile.headline || 'N/A'}
  - Current Job: ${profile.jobTitle || 'N/A'} at ${profile.companyName || 'N/A'}
  - Experience: ${JSON.stringify(profile.experiences || profile.experience || [])}
  - Education: ${JSON.stringify(profile.educations || profile.education || [])}
  - Skills: ${JSON.stringify((profile.skills as Array<{title: string}>)?.map(s => s.title) || [])}`;
    });
  }
  
  // Add multiple profiles data if available
  if (analysis.detailedAnalysis?.multipleProfiles) {
    const multipleProfiles = (analysis.detailedAnalysis as Record<string, unknown>).multipleProfiles as Record<string, unknown>;
    const analyses = multipleProfiles.analyses as Record<string, unknown>[];
    if (analyses && analyses.length > 0) {
      result += `
  
  MULTIPLE PROFILES CONTEXT:
  - Total Profiles: ${multipleProfiles.totalProfiles || analyses.length}
  - Average Score: ${multipleProfiles.averageScore || 'N/A'}`;
      
      analyses.forEach((profileAnalysis: Record<string, unknown>, index: number) => {
        const analysis = profileAnalysis.analysis as Record<string, unknown> | undefined;
        result += `
  - Profile ${index + 1}: ${profileAnalysis.profileName} (Score: ${analysis?.overallScore || 'N/A'})`;
      });
    }
  }

  // Add detailed analysis if available
  if (analysis.detailedAnalysis?.analysis) {
    const detailed = (analysis.detailedAnalysis as Record<string, unknown>).analysis as Record<string, unknown>;
    result += `
  
  DETAILED ANALYSIS:
  - Investment Thesis: ${detailed.investmentThesis || 'N/A'}
  - Category Scores: ${JSON.stringify(detailed.categoryScores || {})}
  - Success Probability: ${detailed.successProbability || 'N/A'}
  - Risk Level: ${detailed.riskLevel || 'N/A'}
  - Deal Breakers: ${JSON.stringify(detailed.dealBreakers || [])}`;
  }

  // Add Perplexity research if available
  if (analysis.perplexityData) {
    result += `
  
  MARKET RESEARCH CONTEXT:
  ${typeof analysis.perplexityData === 'string' ? analysis.perplexityData : JSON.stringify(analysis.perplexityData)}`;
  }

  return result;
}).join('\n')}

PROFILES ANALYZED:
${analysisContext.profilesAnalyzed.map(profile => `- ${profile.name} (${profile.linkedinUrl})`).join('\n')}

Provide specific, actionable insights based on these analysis results. Reference specific founders, scores, and patterns when relevant. Be direct and insightful like a seasoned VC partner.`;
    } else if (conversationContext === 'founder_analysis') {
      systemPrompt = `You are a legendary venture capitalist with 30+ years of experience. You help analyze founders and provide investment insights. Be direct, insightful, and reference specific patterns from successful unicorn founders.`;
    } else {
      systemPrompt = `You are a helpful AI assistant specializing in founder analysis and venture capital insights.`;
    }

    console.log('Sending to Claude with analysis context:', {
      chatId,
      conversationContext,
      hasAnalysisContext: !!analysisContext,
      messagesCount: conversationMessages.length,
      totalAnalyses: analysisContext?.totalAnalyses || 0,
      hasProfileData: (analysisContext?.recentAnalyses?.[0] as Record<string, unknown>)?.detailedAnalysis ? 'YES' : 'NO',
      hasLinkedInProfiles: analysisContext?.recentAnalyses?.[0]?.linkedInProfiles?.length || 0,
      perplexityFallbackEnabled: true
    });

    // DEBUG: Log LinkedIn data structure
    if (analysisContext?.recentAnalyses?.[0]) {
      const firstAnalysis = analysisContext.recentAnalyses[0];
      console.log('=== LINKEDIN DEBUG INFO ===');
      console.log('Profile data exists:', !!firstAnalysis.fullProfileData);
      console.log('LinkedIn profiles count:', firstAnalysis.linkedInProfiles?.length || 0);
      
      if (firstAnalysis.fullProfileData) {
        const profile = firstAnalysis.fullProfileData as Record<string, unknown>;
        console.log('Profile fields available:', Object.keys(profile));
        console.log('Profile name:', profile.name || profile.fullName);
        console.log('Profile headline:', profile.headline);
        console.log('Profile job:', profile.jobTitle, 'at', profile.companyName);
        console.log('Profile educations count:', (profile.educations as Array<Record<string, unknown>>)?.length || 0);
        console.log('Profile experiences count:', (profile.experiences as Array<Record<string, unknown>>)?.length || 0);
        console.log('Profile skills count:', (profile.skills as Array<Record<string, unknown>>)?.length || 0);
        
        // Log first education and experience for debugging
        if (profile.educations && Array.isArray(profile.educations) && profile.educations.length > 0) {
          console.log('First education:', JSON.stringify(profile.educations[0], null, 2));
        }
        if (profile.experiences && Array.isArray(profile.experiences) && profile.experiences.length > 0) {
          console.log('First experience:', JSON.stringify(profile.experiences[0], null, 2));
        }
      }
      
      if (firstAnalysis.linkedInProfiles && firstAnalysis.linkedInProfiles.length > 0) {
        console.log('LinkedIn profiles data:');
        firstAnalysis.linkedInProfiles.forEach((profile: Record<string, unknown>, index: number) => {
          console.log(`Profile ${index + 1}:`, {
            name: profile.name || profile.fullName,
            headline: profile.headline,
            educationsCount: (profile.educations as Array<Record<string, unknown>>)?.length || 0,
            experiencesCount: (profile.experiences as Array<Record<string, unknown>>)?.length || 0,
            skillsCount: (profile.skills as Array<Record<string, unknown>>)?.length || 0
          });
        });
      }
      
      console.log('=== END LINKEDIN DEBUG ===');
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500, // Increased for more detailed responses
      system: systemPrompt,
      messages: conversationMessages,
    });

    let responseText = response.content[0].type === 'text' ? response.content[0].text : 'Response generation failed';

    // Check if Claude needs more information and enhance with Perplexity BEFORE sending to user
    if (responseText.includes('NEED_MORE_INFO:') && (analysisContext?.recentAnalyses?.[0] as Record<string, unknown>)?.detailedAnalysis) {
      
      // Extract the needed topic from Claude's response
      const needMoreMatch = responseText.match(/NEED_MORE_INFO:\s*([^.]+)/);
      const neededTopic = needMoreMatch ? needMoreMatch[1].trim() : 'additional information';
      
      // Get the original user question
      const originalQuestion = conversationMessages[conversationMessages.length - 1]?.content || '';
      
      // Get profile data for search (use primary profile or first LinkedIn profile)
      const detailedAnalysis = (analysisContext!.recentAnalyses[0] as Record<string, unknown>).detailedAnalysis as Record<string, unknown>;
      const profileData = (detailedAnalysis.primaryProfile || (detailedAnalysis.linkedInProfiles as Array<Record<string, unknown>>)?.[0] || {}) as Record<string, unknown>;
      
      // Enhance response with Perplexity search - this will return a clean response without "NEED_MORE_INFO"
      responseText = await enhanceWithPerplexity(
        originalQuestion,
        responseText,
        profileData,
        neededTopic
      );
    }

    return NextResponse.json({
      success: true,
      response: responseText,
      usage: response.usage,
      contextInfo: {
        chatId,
        conversationContext,
        analysisContextAvailable: !!analysisContext,
        totalAnalyses: analysisContext?.totalAnalyses || 0,
        perplexityEnhanced: responseText !== (response.content[0].type === 'text' ? response.content[0].text : '') // Indicate if enhanced
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
