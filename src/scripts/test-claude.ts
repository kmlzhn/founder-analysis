// Test script for Claude API integration
import { analyzeFounderWithClaude } from '../utils/claude';
import 'dotenv/config';

// API key should be set via .env.local (CLAUDE_API_KEY)

async function testClaudeAPI() {
  console.log('Testing Claude API integration...');
  
  try {
    // Test with a name
    console.log('\n=== Testing with a name ===');
    const nameResult = await analyzeFounderWithClaude({ name: 'Elon Musk' });
    console.log('Score:', nameResult.score);
    console.log('Analysis excerpt:', nameResult.analysis.substring(0, 200) + '...');
    
    // Test with a LinkedIn URL
    console.log('\n=== Testing with a LinkedIn URL ===');
    const linkedinResult = await analyzeFounderWithClaude({ 
      linkedinUrl: 'https://www.linkedin.com/in/elonmusk/' 
    });
    console.log('Score:', linkedinResult.score);
    console.log('Analysis excerpt:', linkedinResult.analysis.substring(0, 200) + '...');
    
    // Test with CSV data
    console.log('\n=== Testing with CSV data ===');
    const csvResult = await analyzeFounderWithClaude({ 
      csvData: `name,age,education,experience,skills
John Doe,35,MBA,10 years in tech,leadership,programming,marketing
` 
    });
    console.log('Score:', csvResult.score);
    console.log('Analysis excerpt:', csvResult.analysis.substring(0, 200) + '...');
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the test
testClaudeAPI();
