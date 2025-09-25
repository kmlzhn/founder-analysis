# Founder Analysis

A tool for analyzing founder profiles using LinkedIn data and AI.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in the required API keys and configuration values

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL database URL
- `DIRECT_URL`: Direct PostgreSQL connection URL
- `NEXTAUTH_SECRET`: Secret for NextAuth
- `NEXTAUTH_URL`: URL for NextAuth
- `CLAUDE_API_KEY`: API key for Anthropic Claude
- `PERPLEXITY_API_KEY`: API key for Perplexity
- `APIFY_API_TOKEN`: API token for Apify
- `LINKEDIN_COOKIES`: LinkedIn cookies for authenticated scraping (optional)

## LinkedIn Scraping with Apify

This project uses Apify for LinkedIn data scraping. To set up:

1. Create an account on [Apify](https://apify.com/)
2. Get your API token from the Apify console
3. Add the token to your `.env` file as `APIFY_API_TOKEN`
4. Set up LinkedIn cookies for authenticated scraping (see below)

### LinkedIn Cookie Setup

For the LinkedIn scraper to work properly, you need to provide your LinkedIn authentication cookies:

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

### Testing the LinkedIn Scraper

You can test the LinkedIn scraper using:

```bash
npx tsx src/scripts/test-linkedin-scraper.ts "https://www.linkedin.com/in/username"
```

Or set up a package.json script:

```
npm run test:linkedin-scraper -- "https://www.linkedin.com/in/username"
```

## Development

Run the development server:

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Apify Integration

This project uses the [Apify API](https://docs.apify.com/api/v2) to scrape LinkedIn profiles. The integration works as follows:

1. The frontend sends a request to `/api/scrape/linkedin` with a LinkedIn URL
2. The backend uses the Apify API client to run the [LinkedIn Scraper](https://apify.com/apify/linkedin-scraper) actor
3. The actor scrapes the profile and returns structured data
4. The data is stored in the database and returned to the frontend
5. For analysis, the data is sent to Claude AI via the `/api/analyze/linkedin` endpoint

### Apify Actor Parameters

The LinkedIn Scraper actor accepts the following parameters:

```json
{
  "linkedInProfilesUrls": ["https://www.linkedin.com/in/username/"],
  "includeContactInfo": true,
  "includeEducationDetails": true,
  "includeExperienceDetails": true,
  "includeSkills": true,
  "sessionCookies": "li_at=value; JSESSIONID=value"
}
```

See the [Apify documentation](https://docs.apify.com/) for more details on how to use the API.

## API Routes

- `POST /api/scrape`: General scraping endpoint for different LinkedIn content types
  - Body: `{ "url": "https://www.linkedin.com/in/username", "type": "profile" }`
  - Types: `profile`, `company`, `posts`, `search`

- `POST /api/scrape/linkedin`: Specialized endpoint for LinkedIn profile scraping
  - Body: `{ "url": "https://www.linkedin.com/in/username" }`

- `POST /api/analyze/linkedin`: Analyze a LinkedIn profile with AI
  - Body: `{ "linkedinUrl": "https://www.linkedin.com/in/username", "userId": "optional-user-id" }`
  - This endpoint will scrape the profile and then analyze it with Claude AI

## License

[MIT](LICENSE)