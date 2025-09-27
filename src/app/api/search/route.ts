import { NextRequest, NextResponse } from 'next/server';
import Perplexity from '@perplexity-ai/perplexity_ai';

const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 5, country } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    console.log('Searching with Perplexity:', query);

    const searchParams = {
      query,
      maxResults,
      maxTokensPerPage: 1024,
      ...(country && { country })
    };

    const search = await client.search.create(searchParams);

    console.log('Perplexity search completed, results:', search.results.length);

    return NextResponse.json({
      success: true,
      query,
      resultsCount: search.results.length,
      results: search.results,
    });

  } catch (error) {
    console.error('Perplexity search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search with Perplexity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Perplexity Search API is running',
    endpoint: '/api/search',
    method: 'POST',
    examples: {
      basic: {
        query: 'latest AI developments 2024',
        maxResults: 5
      },
      regional: {
        query: 'government policies on renewable energy',
        country: 'US',
        maxResults: 5
      }
    }
  });
}
