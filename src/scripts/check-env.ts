import 'dotenv/config';

console.log('Checking environment variables:');
console.log('APIFY_API_TOKEN:', process.env.APIFY_API_TOKEN ? 'Set ✅' : 'Not set ❌');
console.log('LINKEDIN_COOKIES:', process.env.LINKEDIN_COOKIES ? 'Set ✅' : 'Not set ❌');
console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'Set ✅' : 'Not set ❌');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set ✅' : 'Not set ❌');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? 'Set ✅' : 'Not set ❌');
