import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prisma';

export async function POST(request: NextRequest) {
  try {
    const { chatId, analysisData } = await request.json();

    if (!chatId || !analysisData) {
      return NextResponse.json(
        { error: 'chatId and analysisData are required' },
        { status: 400 }
      );
    }

    // Extract main analysis data
    const mainAnalysis = analysisData.analysis || {};
    const multipleProfiles = analysisData.multipleProfiles;
    const processingInfo = analysisData.processingInfo || {};

    // Create the analysis record
    const analysis = await prisma.analysis.create({
      data: {
        chatId,
        type: multipleProfiles ? 'BATCH_ANALYSIS' : 'FOUNDER_POTENTIAL',
        provider: 'claude',
        
        // Main analysis results
        overallScore: mainAnalysis.overallScore || null,
        summary: mainAnalysis.summary || 'Analysis completed',
        strengths: mainAnalysis.keyStrengths || [],
        weaknesses: mainAnalysis.concerns || [],
        suggestions: mainAnalysis.recommendedFocusAreas || [],
        
        // Multiple profiles support
        isMultiProfile: !!multipleProfiles,
        totalProfiles: multipleProfiles?.totalProfiles || null,
        averageScore: multipleProfiles?.averageScore || null,
        profileAnalyses: multipleProfiles?.analyses || null,
        
        // Processing metadata
        linkedInUrlsFound: processingInfo.linkedInUrlsFound || 0,
        filesProcessed: processingInfo.filesProcessed || 0,
        profilesAnalyzed: processingInfo.profilesAnalyzed || 1,
        perplexityEnhanced: processingInfo.perplexityEnhanced || false,
        analysisContext: processingInfo.analysisContext || null,
        profileSource: processingInfo.profileSource || null,
        
        // Store full analysis data
        detailedResults: analysisData,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error('Failed to save analysis:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    const analyses = await prisma.analysis.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      analyses,
    });

  } catch (error) {
    console.error('Failed to fetch analyses:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analyses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
