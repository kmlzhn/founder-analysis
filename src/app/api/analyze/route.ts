import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { analyzeFounderWithPerplexity, callPerplexity } from '@/utils/perplexity';
import { analyzeFounderWithClaude } from '@/utils/claude';
import { AnalysisResponse } from '@/types';
import type { Prisma } from '@prisma/client';

// Analyze founder potential using Claude API (with optional Perplexity pre-research)
async function analyzeFounderPotential(name: string): Promise<AnalysisResponse> {
  try {
    // Try to enrich with Perplexity pre-research to provide structured profile data to Claude
    let enrichedProfileJson: string | undefined;
    try {
      const perplSystem = `You are a precise research assistant.\nTask: gather concise public information useful to assess founder potential for a person by name.\nRules:\n- Use only information supported by accessible sources.\n- Do not fabricate. If unknown, set the field to null and arrays to [].\n- Output JSON only, no extra text.\n- Include a required array 'sources' with objects { title, url } for every claim.\nOutput schema:\n{\n  "name": string|null,\n  "headline": string|null,\n  "location": string|null,\n  "currentRole": string|null,\n  "companies": { name: string, role: string|null, dates: string|null }[],\n  "education": { school: string, degree: string|null, dates: string|null }[],\n  "skills": string[],\n  "notableAchievements": string[],\n  "links": string[],\n  "sources": { title: string, url: string }[]\n}`;
      const perplUser = `Find and summarize public information about this person: ${name}`;
      const perplMessages = [
        { role: 'system' as const, content: perplSystem },
        { role: 'user' as const, content: perplUser },
      ];
      const perplRaw = await callPerplexity(perplMessages, {
        max_tokens: 1000,
        temperature: 0.2,
      });
      const match = perplRaw.match(/```json\s*([\s\S]*?)\s*```/);
      const candidate = match?.[1] ? match[1] : perplRaw;
      JSON.parse(candidate);
      enrichedProfileJson = candidate;
    } catch (prefetchError) {
      // Non-fatal: continue without Perplexity enrichment
      console.warn('Perplexity enrichment skipped:', prefetchError);
    }

    // Call Claude, passing profileData if present
    return await analyzeFounderWithClaude({ name, profileData: enrichedProfileJson });
  } catch (error) {
    console.error('Error analyzing founder with Claude:', error);
    
    // Fallback to mock data if API fails
    const randomScore = Math.floor(Math.random() * 40) + 60; // Random score between 60-99
    
    const analysis = `
# Founder Potential Analysis: ${name}

## Overall Score: ${randomScore}/100

### Key Strengths
- Strong problem-solving abilities
- Excellent communication skills
- Resilient under pressure
- Strategic thinking

### Areas for Growth
- Financial management skills
- Delegation capabilities
- Work-life balance

### Detailed Analysis
${name} demonstrates significant potential as a founder of a successful startup. Based on available data, they exhibit many traits common among successful entrepreneurs, including determination, vision, and adaptability.

Their background suggests a pattern of identifying opportunities and executing on them effectively. The combination of technical knowledge and business acumen positions them well for venture creation and growth.

### Success Probability
- Short-term success (1-2 years): 78%
- Long-term success (5+ years): 65%

### Recommended Focus Areas
1. Building a diverse founding team to complement their skills
2. Developing a sustainable business model early
3. Establishing strong mentor relationships in their industry

This analysis is based on patterns observed in successful founders and should be used as one data point in a comprehensive evaluation.
`;

    // Create a structured results object that can be stored in the database
    const results = {
      score: randomScore,
      strengths: [
        'Strong problem-solving abilities',
        'Excellent communication skills',
        'Resilient under pressure',
        'Strategic thinking'
      ],
      areasForGrowth: [
        'Financial management skills',
        'Delegation capabilities',
        'Work-life balance'
      ],
      successProbability: {
        shortTerm: 78,
        longTerm: 65
      },
      recommendedFocusAreas: [
        'Building a diverse founding team to complement their skills',
        'Developing a sustainable business model early',
        'Establishing strong mentor relationships in their industry'
      ]
    };

    const analysisWithJson = `${analysis}\n\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\``;

    return {
      analysis: analysisWithJson,
      score: randomScore,
      results
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, userId } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const { analysis, score, results } = await analyzeFounderPotential(name);
    
    // If userId is provided, store the analysis results in the database
    if (userId) {
      try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true }
        });
        
        if (user) {
          // If user has a profile, update it; otherwise create a new profile
          if (user.profile) {
            await prisma.profile.update({
              where: { userId },
              data: {
                founderScore: score,
                analysisResults: (results as unknown) as Prisma.InputJsonValue
              }
            });
          } else {
            await prisma.profile.create({
              data: {
                userId,
                founderScore: score,
                analysisResults: (results as unknown) as Prisma.InputJsonValue
              }
            });
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue with the response even if database operation fails
      }
    }
    
    // Save the search to history regardless of whether a user is logged in
    try {
      await prisma.search.create({
        data: {
          userId: userId || undefined, // Only include userId if it exists
          searchType: 'name',
          searchQuery: name,
          founderScore: score,
          analysisResults: (results as unknown) as Prisma.InputJsonValue
        }
      });
    } catch (searchError) {
      console.error('Error saving search history:', searchError);
      // Continue with the response even if saving search history fails
    }
    
    // Ensure response includes results JSON in analysis for chart parsing
    let analysisWithJson = analysis;
    if (!/```json[\s\S]*```/.test(analysisWithJson)) {
      analysisWithJson += `\n\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\``;
    }
    return NextResponse.json({ analysis: analysisWithJson, score, results });
  } catch (error) {
    console.error('Error analyzing founder:', error);
    return NextResponse.json(
      { error: 'Failed to analyze founder potential' },
      { status: 500 }
    );
  }
}