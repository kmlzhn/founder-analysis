# LinkedIn Scraper Setup Instructions

This document provides instructions for setting up and using the LinkedIn scraper functionality in the Founder Analysis project.

## Prerequisites

1. Apify API Token (already set up in the environment)
2. LinkedIn cookies for authentication

## Setting up LinkedIn Cookies

For the LinkedIn scraper to work properly, you need to provide your LinkedIn authentication cookies. Follow these steps:

1. Log in to your LinkedIn account in your web browser
2. Open the browser's developer tools (F12 or right-click > Inspect)
3. Go to the "Application" or "Storage" tab
4. Find "Cookies" in the left sidebar and click on "https://www.linkedin.com"
5. Look for the following cookies:
   - `li_at` - This is your main authentication cookie
   - `JSESSIONID` - This is your session ID

6. Copy these values and add them to your `.env` file in the following format:
   ```
   LINKEDIN_COOKIES=li_at=YOUR_LI_AT_VALUE; JSESSIONID=YOUR_JSESSIONID_VALUE
   ```

## Running the Scraper

You can run the LinkedIn scraper in two ways:

### 1. Using the Test Script

```bash
npx tsx src/scripts/test-linkedin-scraper.ts [optional_linkedin_url]
```

If you don't provide a LinkedIn URL, it will use the default URL in the script.

### 2. Using the API Endpoint

Send a POST request to `/api/scrape/linkedin` with the following JSON body:

```json
{
  "url": "https://www.linkedin.com/in/username/"
}
```

## Analyzing LinkedIn Profiles

To analyze a LinkedIn profile, send a POST request to `/api/analyze/linkedin` with the following JSON body:

```json
{
  "linkedinUrl": "https://www.linkedin.com/in/username/",
  "userId": "optional_user_id_for_saving_results"
}
```

This will:
1. Scrape the LinkedIn profile using Apify
2. Analyze the profile data using Claude AI
3. Return the analysis results and founder score

## Troubleshooting

If you encounter issues with the LinkedIn scraper:

1. Make sure your LinkedIn cookies are valid and up-to-date
2. Check that the Apify API token is correct
3. Verify that the LinkedIn URL is valid and publicly accessible
4. Check the server logs for specific error messages

LinkedIn may detect and block automated access, so use this functionality responsibly and consider implementing rate limiting to avoid issues.
