import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { analyzeFounderWithPerplexity, callPerplexity } from '@/utils/perplexity';
import { analyzeFounderWithClaude } from '@/utils/claude';
import { AnalysisResponse } from '@/types';
import type { Prisma } from '@prisma/client';

// Analyze LinkedIn profile using Perplexity ➜ Claude pipeline
async function analyzeLinkedInProfile(linkedinUrl: string): Promise<AnalysisResponse> {
  try {
    // 1) Ask Perplexity to retrieve FULL LinkedIn profile details verbatim, structured as JSON.
    // Strictly prohibit summarization; capture all sections.
    const perplSystem = `You are a precise research assistant.
Task: fetch the FULL content of a public LinkedIn profile and other reputable sources about this profile.
Rules:
- Do NOT summarize or shorten anything. Return verbatim text where possible.
- Use only information supported by accessible sources.
- If a field is unknown or unavailable, set it to null or [] accordingly.
- Output JSON only, no extra text.
- Include an array 'sources' with objects { title, url } for every claimed section.
Output schema (return as much as exists):
{
  "name": string|null,
  "headline": string|null,
  "location": string|null,
  "currentRole": string|null,
  "about": string|null, // full About text
  "experience": [
    {
      "company": string,
      "role": string|null,
      "employmentType": string|null,
      "location": string|null,
      "startDate": string|null,
      "endDate": string|null,
      "duration": string|null,
      "description": string|null // full description
    }
  ],
  "education": [
    {
      "school": string,
      "degree": string|null,
      "fieldOfStudy": string|null,
      "startDate": string|null,
      "endDate": string|null,
      "activities": string|null,
      "description": string|null
    }
  ],
  "skills": string[],
  "certifications": [
    {
      "name": string,
      "issuingOrganization": string|null,
      "issueDate": string|null,
      "expirationDate": string|null,
      "credentialId": string|null,
      "credentialUrl": string|null
    }
  ],
  "projects": [
    {
      "name": string,
      "role": string|null,
      "startDate": string|null,
      "endDate": string|null,
      "description": string|null,
      "url": string|null
    }
  ],
  "publications": [
    {
      "title": string,
      "publisher": string|null,
      "date": string|null,
      "description": string|null,
      "url": string|null
    }
  ],
  "honorsAwards": [
    {
      "title": string,
      "issuer": string|null,
      "date": string|null,
      "description": string|null
    }
  ],
  "recommendations": {
    "received": [
      { "from": string, "relationship": string|null, "text": string|null }
    ],
    "given": [
      { "to": string, "relationship": string|null, "text": string|null }
    ]
  },
  "volunteering": [
    {
      "organization": string,
      "role": string|null,
      "cause": string|null,
      "startDate": string|null,
      "endDate": string|null,
      "description": string|null
    }
  ],
  "languages": [
    { "language": string, "proficiency": string|null }
  ],
  "interests": string[],
  "links": string[],
  "sources": { title: string, url: string }[]
}`;
    const perplUser = `Fetch the FULL LinkedIn profile for this URL (and corroborating sources). Do NOT summarize or shorten anything. Return JSON only: ${linkedinUrl}`;

    const perplMessages = [
      { role: 'system' as const, content: perplSystem },
      { role: 'user' as const, content: perplUser },
    ];

    const perplRaw = await callPerplexity(perplMessages, {
      // allow large output to capture full profile
      max_tokens: 4000,
      temperature: 0.0,
    });

    // Extract JSON from Perplexity response, pass through unchanged
    let structuredProfile = '';
    try {
      const match = perplRaw.match(/```json\s*([\s\S]*?)\s*```/);
      structuredProfile = match?.[1] ? match[1] : perplRaw;
      // Validate JSON
      JSON.parse(structuredProfile);
    } catch {
      // If not valid JSON, return a clear error instead of fabricating
      throw new Error('Perplexity did not return valid JSON profile data');
    }

    // 2) Send the RAW Perplexity JSON to Claude for judgment and scoring
    const result = await analyzeFounderWithClaude({ linkedinUrl, profileData: structuredProfile });
    // Ensure analysis includes JSON block for chart rendering (Claude util already keeps it, but guard here if needed)
    if (!/```json[\s\S]*```/.test(result.analysis)) {
      const jsonBlock = `\n\n\`\`\`json\n${JSON.stringify(result.results, null, 2)}\n\`\`\``;
      result.analysis += jsonBlock;
    }
    return result;
  } catch (error) {
    console.error('Error analyzing LinkedIn profile with Claude/Perplexity:', error);
    // Do not fabricate analysis. Surface a clear error to the caller.
    throw error as Error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl, userId } = await request.json();
    
    if (!linkedinUrl || typeof linkedinUrl !== 'string') {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }
    
    const { analysis, score, results } = await analyzeLinkedInProfile(linkedinUrl);
    
    // If userId is provided, store the analysis results and LinkedIn URL in the database
    if (userId) {
      try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true }
        });
        
        if (user) {
          // If user has a profile, update it; otherwise create a new profile
          if ((user as any).profile) {
            await prisma.profile.update({
              where: { userId },
              data: {
                linkedInUrl: linkedinUrl,
                founderScore: score,
                analysisResults: (results as unknown) as Prisma.InputJsonValue
              }
            });
          } else {
            await prisma.profile.create({
              data: {
                userId,
                linkedInUrl: linkedinUrl,
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
          searchType: 'linkedin',
          searchQuery: linkedinUrl,
          founderScore: score,
          analysisResults: (results as unknown) as Prisma.InputJsonValue
        }
      });
    } catch (searchError) {
      console.error('Error saving search history:', searchError);
      // Continue with the response even if saving search history fails
    }
    
    return NextResponse.json({ analysis, score, results });
  } catch (error) {
    console.error('Error analyzing LinkedIn profile:', error);
    return NextResponse.json(
      { error: 'Failed to analyze LinkedIn profile' },
      { status: 500 }
    );
  }
}