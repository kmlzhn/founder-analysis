import { NextRequest, NextResponse } from 'next/server';
import Perplexity from '@perplexity-ai/perplexity_ai';
import Anthropic from '@anthropic-ai/sdk';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// AI-powered strategic query generation for Perplexity
async function generateStrategicQueries(profileData: Record<string, unknown>, analysisType: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Generate 3 strategic Perplexity search queries for this founder analysis:

PROFILE: ${JSON.stringify(profileData, null, 2)}
ANALYSIS TYPE: ${analysisType}

Generate queries that will uncover:
1. Founder's track record and credibility
2. Market reputation and industry standing  
3. Recent developments and competitive positioning

Return ONLY a JSON array of 3 query strings:
["query1", "query2", "query3"]`
      }]
    });

    const queryResponse = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    
    try {
      const queries = JSON.parse(queryResponse);
      if (Array.isArray(queries) && queries.length > 0) {
        return queries.slice(0, 3);
      }
    } catch (parseError) {
      console.warn('Failed to parse AI query response:', parseError);
    }

    // Fallback queries
    const name = profileData.name || profileData.fullName || 'founder';
    const company = profileData.companyName || 'startup';
    
    return [
      `"${name}" founder background achievements`,
      `"${company}" startup market position`,
      `${analysisType} success patterns industry`
    ];

  } catch (error) {
    console.warn('AI query generation failed:', error);
    
    const name = profileData.name || profileData.fullName || 'founder';
    const company = profileData.companyName || 'startup';
    
    return [
      `"${name}" founder entrepreneur`,
      `"${company}" startup analysis`,
      `${analysisType} founder patterns`
    ];
  }
}

// AI-powered comprehensive analysis generation
async function generatePerplexityAnalysis(profileData: Record<string, unknown>, searchResults: Record<string, unknown>[], analysisType: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `You are a legendary VC analyst. Provide comprehensive founder analysis using this data:

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

PERPLEXITY SEARCH RESULTS:
${JSON.stringify(searchResults.slice(0, 10), null, 2)}

ANALYSIS TYPE: ${analysisType}

Provide detailed analysis covering:
1. **Founder Background & Credibility**
2. **Market Position & Reputation**  
3. **Track Record & Achievements**
4. **Industry Standing & Network**
5. **Investment Potential Assessment**
6. **Risk Factors & Concerns**
7. **Strategic Recommendations**

Be specific, reference the search results, and provide actionable VC insights.`
      }]
    });

    return response.content[0].type === 'text' ? response.content[0].text : 'Analysis generation failed';
  } catch (error) {
    console.warn('AI analysis generation failed:', error);
    return `Analysis of ${profileData.name || 'this founder'} based on available data and search results.`;
  }
}

// AI-powered intelligent scoring
async function generateIntelligentScore(profileData: Record<string, unknown>, searchResults: Record<string, unknown>[], analysis: string): Promise<{ score: number; reasoning: string }> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Score this founder's potential (1-100) based on the analysis:

PROFILE: ${JSON.stringify(profileData, null, 2)}
SEARCH RESULTS COUNT: ${searchResults.length}
ANALYSIS: ${analysis.substring(0, 1000)}...

Consider:
- Track record and achievements
- Market reputation and credibility
- Network and industry connections
- Search result quality and quantity
- Overall founder potential

Return ONLY a JSON object:
{"score": <number 1-100>, "reasoning": "<brief explanation>"}`
      }]
    });

    const scoreResponse = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
    
    try {
      const result = JSON.parse(scoreResponse);
      if (result.score && typeof result.score === 'number') {
        return {
          score: Math.max(1, Math.min(100, result.score)),
          reasoning: result.reasoning || 'AI-generated score based on comprehensive analysis'
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse AI score response:', parseError);
    }

    // Fallback scoring logic
    let score = 60;
    if (profileData.experiences && Array.isArray(profileData.experiences) && profileData.experiences.length > 2) score += 10;
    if (profileData.connections && typeof profileData.connections === 'number' && profileData.connections > 500) score += 10;
    if (searchResults.length > 5) score += 10;
    if (profileData.headline && typeof profileData.headline === 'string' && profileData.headline.includes('founder')) score += 10;

    return {
      score,
      reasoning: 'Score based on profile completeness and search result availability'
    };

  } catch (error) {
    console.warn('AI scoring failed:', error);
    return {
      score: 65,
      reasoning: 'Default score due to analysis limitations'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileData, analysisType = 'founder' } = body;

    if (!profileData) {
      return NextResponse.json(
        { error: 'profileData is required' },
        { status: 400 }
      );
    }

    console.log('AI-powered Perplexity analysis starting...');

    // Generate strategic search queries with AI
    const queries = await generateStrategicQueries(profileData, analysisType);
    console.log('AI-generated queries:', queries);

    // Execute Perplexity searches
    const searchResults = [];
    for (const query of queries) {
      try {
        const search = await client.search.create({
          query,
          max_results: 3,
          max_tokens_per_page: 512
        });
        searchResults.push(...search.results);
      } catch (error) {
        console.error('Search error for query:', query, error);
      }
    }

    console.log('Search completed, results:', searchResults.length);

    // Generate comprehensive AI analysis
    const analysis = await generatePerplexityAnalysis(profileData, searchResults as unknown as Record<string, unknown>[], analysisType);

    // Generate intelligent scoring with reasoning
    const { score, reasoning } = await generateIntelligentScore(profileData, searchResults as unknown as Record<string, unknown>[], analysis);

    console.log('AI analysis completed, score:', score);

    return NextResponse.json({
      success: true,
      analysis,
      score,
      scoreReasoning: reasoning,
      searchResults: searchResults.slice(0, 8), // Return top 8 search results
      queriesUsed: queries,
      metadata: {
        analysisType,
        searchResultsCount: searchResults.length,
        aiPowered: true,
        profileName: profileData.name || 'Unknown'
      }
    });

  } catch (error) {
    console.error('Perplexity analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze with Perplexity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI-Powered Perplexity Analysis API is running',
    endpoint: '/api/analyze/perplexity',
    method: 'POST',
    capabilities: [
      'AI-generated strategic search queries',
      'Comprehensive founder analysis with web context',
      'Intelligent scoring with reasoning',
      'Enhanced search result processing'
    ],
    requiredBody: {
      profileData: 'Profile data object with name, linkedinUrl, companyName, etc.',
      analysisType: 'Optional: founder, entrepreneur, executive (defaults to founder)'
    },
    responseFormat: {
      analysis: 'Comprehensive AI-generated analysis',
      score: 'Intelligent score (1-100)',
      scoreReasoning: 'AI explanation for the score',
      searchResults: 'Top 8 Perplexity search results',
      queriesUsed: 'AI-generated search queries',
      metadata: 'Analysis metadata and statistics'
    },
    examples: {
      basic: {
        profileData: {
          name: 'John Smith',
          linkedinUrl: 'https://linkedin.com/in/johnsmith',
          companyName: 'TechCorp',
          headline: 'CEO & Founder'
        }
      },
      withType: {
        profileData: {
          name: 'Jane Doe',
          companyName: 'DataFlow Inc',
          experiences: [/* experience array */]
        },
        analysisType: 'technical founder'
      }
    }
  });
}
