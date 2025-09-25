import { NextRequest, NextResponse } from 'next/server';
import 'dotenv/config';
import { prisma } from '@/utils/prisma';
import { ApifyClient } from 'apify-client';

/**
 * POST endpoint to scrape LinkedIn profiles using Apify
 */
export async function POST(request: NextRequest) {
  try {
    // Extract URL from request body
    const { url, type = 'profile' } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Check if Apify API token is available
    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: 'Apify API token is not configured' },
        { status: 500 }
      );
    }

    // Initialize the ApifyClient with API token
    const client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    console.log(`Scraping LinkedIn ${type} with URL: ${url}`);
    
    try {
      let actorCall;
      let scrapedData;
      
      switch (type) {
        case 'profile':
          // Use LinkedIn Profile Scraper
          actorCall = await client.actor("apify/linkedin-scraper").call({
            linkedInProfilesUrls: [url],
            includeContactInfo: true,
            includeEducationDetails: true,
            includeExperienceDetails: true,
            includeSkills: true,
            sessionCookies: process.env.LINKEDIN_COOKIES || '',
          });
          
          // Get the dataset with the results
          const { items } = await client.dataset(actorCall.defaultDatasetId).listItems();
          scrapedData = items.length > 0 ? items[0] : null;
          break;
          
        case 'company':
          // Use LinkedIn Company Scraper
          actorCall = await client.actor("apify/linkedin-company-scraper").call({
            linkedInCompanyProfilesUrls: [url],
            sessionCookies: process.env.LINKEDIN_COOKIES || '',
          });
          
          // Get the dataset with the results
          const companyItems = await client.dataset(actorCall.defaultDatasetId).listItems();
          scrapedData = companyItems.items.length > 0 ? companyItems.items[0] : null;
          break;
          
        case 'posts':
          // Use LinkedIn Post Scraper
          actorCall = await client.actor("apify/linkedin-post-scraper").call({
            linkedInPostsUrls: [url],
            sessionCookies: process.env.LINKEDIN_COOKIES || '',
          });
          
          // Get the dataset with the results
          const postItems = await client.dataset(actorCall.defaultDatasetId).listItems();
          scrapedData = postItems.items.length > 0 ? postItems.items[0] : null;
          break;
          
        case 'search':
          // Use LinkedIn Search Scraper
          actorCall = await client.actor("apify/linkedin-search-scraper").call({
            searchUrls: [url],
            sessionCookies: process.env.LINKEDIN_COOKIES || '',
          });
          
          // Get the dataset with the results
          const searchItems = await client.dataset(actorCall.defaultDatasetId).listItems();
          scrapedData = searchItems.items;
          break;
          
        default:
          return NextResponse.json(
            { error: 'Invalid scraper type. Must be one of: profile, company, posts, search' },
            { status: 400 }
          );
      }
      
      if (!scrapedData) {
        return NextResponse.json(
          { error: 'No data was scraped' },
          { status: 404 }
        );
      }
      
      // Save the search to history
      try {
        await prisma.search.create({
          data: {
            searchType: `linkedin-${type}`,
            searchQuery: url,
            founderScore: 0, // Default value as required by schema
            analysisResults: scrapedData || {}
          }
        });
      } catch (searchError) {
        console.error('Error saving search history:', searchError);
        // Continue with the response even if saving search history fails
      }
      
      // Return the scraped data
      return NextResponse.json({ data: scrapedData });
    } catch (apiError: any) {
      console.error('Error calling Apify API:', apiError);
      return NextResponse.json(
        { error: `Apify API error: ${apiError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error scraping LinkedIn profile:', error);
    return NextResponse.json(
      { error: 'Failed to scrape LinkedIn profile' },
      { status: 500 }
    );
  }
}