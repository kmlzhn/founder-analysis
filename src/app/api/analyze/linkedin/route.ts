import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';
import { analyzeFounderWithPerplexity, callPerplexity } from '@/utils/perplexity';
import { analyzeFounderWithClaude } from '@/utils/claude';
import { AnalysisResponse } from '@/types';
import type { Prisma } from '@prisma/client';
import axios from 'axios';
import { ApifyClient } from 'apify-client';

// Analyze LinkedIn profile using Apify scraper ➜ Claude pipeline
async function analyzeLinkedInProfile(linkedinUrl: string): Promise<AnalysisResponse> {
  try {
    // 1) Use Apify to scrape the LinkedIn profile data
    // Use absolute URL for axios in server components
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const scrapeResponse = await axios.post(`${baseUrl}/api/scrape/linkedin`, {
      url: linkedinUrl
    });
    
    if (!scrapeResponse.data || !scrapeResponse.data.data) {
      throw new Error('Failed to scrape LinkedIn profile data');
    }
    
    const profileData = scrapeResponse.data.data;
    
    // Convert Apify's output to a structured format for analysis
    const structuredProfile = JSON.stringify(profileData, null, 2);

    // 2) Send the structured profile data to Claude for judgment and scoring
    const result = await analyzeFounderWithClaude({ linkedinUrl, profileData: structuredProfile });
    
    // Ensure analysis includes JSON block for chart rendering
    if (!/```json[\s\S]*```/.test(result.analysis)) {
      const jsonBlock = `\n\n\`\`\`json\n${JSON.stringify(result.results, null, 2)}\n\`\`\``;
      result.analysis += jsonBlock;
    }
    
    return result;
  } catch (error) {
    console.error('Error analyzing LinkedIn profile with Apify/Claude:', error);
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