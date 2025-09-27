import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with API token from environment
const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileUrls } = body;

    // Validate input
    if (!profileUrls || !Array.isArray(profileUrls) || profileUrls.length === 0) {
      return NextResponse.json(
        { error: 'profileUrls array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URLs
    const validUrls = profileUrls.filter(url => 
      typeof url === 'string' && url.includes('linkedin.com/in/')
    );

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: 'No valid LinkedIn profile URLs provided' },
        { status: 400 }
      );
    }

    console.log('Starting LinkedIn scraping for URLs:', validUrls);

    // Prepare Actor input
    const input = {
      profileUrls: validUrls
    };

    // Run the Actor and wait for it to finish
    const run = await client.actor("dev_fusion/linkedin-profile-scraper").call(input);

    console.log('Actor run completed:', run.id);

    // Fetch results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log('Scraped profiles count:', items.length);

    return NextResponse.json({
      success: true,
      runId: run.id,
      profilesCount: items.length,
      profiles: items,
    });

  } catch (error) {
    console.error('LinkedIn scraping error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape LinkedIn profiles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check API status
export async function GET() {
  return NextResponse.json({
    message: 'LinkedIn Scraper API is running',
    endpoint: '/api/scrape/linkedin',
    method: 'POST',
    requiredBody: {
      profileUrls: ['https://www.linkedin.com/in/username']
    }
  });
}
