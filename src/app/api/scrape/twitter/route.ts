import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      twitterHandles, 
      searchTerms, 
      startUrls,
      maxItems = 50 
    } = body;

    // Validate input - at least one of these is required
    if (!twitterHandles && !searchTerms && !startUrls) {
      return NextResponse.json(
        { error: 'At least one of twitterHandles, searchTerms, or startUrls is required' },
        { status: 400 }
      );
    }

    console.log('Starting Twitter scraping...');

    // Prepare Actor input
    const input: Record<string, unknown> = {
      maxItems,
      sort: "Latest",
      tweetLanguage: "en"
    };

    if (twitterHandles) input.twitterHandles = twitterHandles;
    if (searchTerms) input.searchTerms = searchTerms;
    if (startUrls) input.startUrls = startUrls;

    // Run the Actor and wait for it to finish
    const run = await client.actor("apidojo/tweet-scraper").call(input);

    console.log('Actor run completed:', run.id);

    // Fetch results from the run's dataset
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log('Scraped tweets count:', items.length);

    return NextResponse.json({
      success: true,
      runId: run.id,
      tweetsCount: items.length,
      tweets: items,
    });

  } catch (error) {
    console.error('Twitter scraping error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to scrape Twitter data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Twitter Scraper API is running',
    endpoint: '/api/scrape/twitter',
    method: 'POST',
    examples: {
      byHandle: {
        twitterHandles: ['elonmusk', 'taylorswift13'],
        maxItems: 50
      },
      bySearch: {
        searchTerms: ['web scraping', 'AI'],
        maxItems: 100
      },
      byUrl: {
        startUrls: ['https://twitter.com/elonmusk'],
        maxItems: 20
      }
    }
  });
}
