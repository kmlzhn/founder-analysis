import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
// import Perplexity from '@perplexity-ai/perplexity_ai';
import { PrismaClient, Prisma } from '@prisma/client';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// const perplexity = new Perplexity({
//   apiKey: process.env.PERPLEXITY_API_KEY,
// });

const prisma = new PrismaClient();

// Helper function to extract LinkedIn URLs from text
function extractLinkedInUrls(text: string): string[] {
  const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?/g;
  return text.match(linkedinRegex) || [];
}

// AI-powered analysis context extraction
async function extractAnalysisContext(text: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Extract the founder analysis context from this text. Return ONLY one specific context phrase that best describes the analysis focus.

Text: "${text}"

Valid contexts include:
- young founders
- technical founders  
- repeat entrepreneurs
- first-time founders
- B2B SaaS founders
- enterprise software founders
- consumer tech founders
- fintech founders
- healthtech founders
- edtech founders
- AI/ML founders
- hardware founders
- social impact founders
- international founders
- female founders
- diverse founders
- general founder analysis

Return only the most specific matching context phrase, or "general founder analysis" if no specific context is found.`
      }]
    });

    const extractedContext = response.content[0].type === 'text' ? response.content[0].text.trim() : 'general founder analysis';
    console.log('AI extracted context:', extractedContext);
    return extractedContext;
  } catch (error) {
    console.warn('AI context extraction failed, using fallback:', error);
    return 'general founder analysis';
  }
}

// AI-powered god-level search query generation - DISABLED
// async function generateGodLevelQueries(profileData: Record<string, unknown>, analysisContext: string): Promise<string[]> {
//   try {
//     const response = await anthropic.messages.create({
//       model: 'claude-sonnet-4-20250514',
//       max_tokens: 300,
//       messages: [{
//         role: 'user',
//         content: `You are a legendary VC researcher. Generate 5 highly specific search queries to research this founder for investment analysis.

// FOUNDER PROFILE:
// ${JSON.stringify(profileData, null, 2)}

// ANALYSIS CONTEXT: ${analysisContext}

// Generate 5 strategic search queries that will uncover:
// 1. Track record and achievements
// 2. Market reputation and credibility  
// 3. Industry expertise and domain knowledge
// 4. Competitive landscape and positioning
// 5. Recent developments and market sentiment

// Make queries specific, using exact names and companies when available. Focus on the analysis context (${analysisContext}).

// Return ONLY a JSON array of 5 search query strings, nothing else:
// ["query1", "query2", "query3", "query4", "query5"]`
//       }]
//     });

//     const queryResponse = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]';
    
//     // Parse the JSON response
//     try {
//       // Strip markdown code blocks if present
//       const cleanResponse = queryResponse.replace(/```json\n?|\n?```/g, '').trim();
//       const queries = JSON.parse(cleanResponse);
//       if (Array.isArray(queries) && queries.length > 0) {
//         console.log('AI generated queries:', queries);
//         return queries.slice(0, 5); // Ensure max 5 queries
//       }
//     } catch (parseError) {
//       console.warn('Failed to parse AI query response:', parseError);
//     }

//     // Fallback to basic queries if AI fails
//     const name = profileData.name || profileData.fullName;
//     const company = profileData.companyName;
    
//     return [
//       `"${name}" founder entrepreneur background`,
//       `"${company}" startup funding valuation`,
//       `${analysisContext} success patterns`,
//       `"${name}" industry expertise achievements`,
//       `"${company}" competitors market position`
//     ].filter(q => !q.includes('undefined') && !q.includes('null'));

//   } catch (error) {
//     console.warn('AI query generation failed, using fallback:', error);
    
//     // Simple fallback
//     const name = profileData.name || profileData.fullName || 'founder';
//     const company = profileData.companyName || 'startup';
    
//     return [
//       `"${name}" founder background`,
//       `"${company}" startup analysis`,
//       `${analysisContext} patterns`,
//       `founder success metrics`,
//       `startup market trends`
//     ];
//   }
// }

// Helper function to save profiles to database
async function saveProfilesToDatabase(chatId: string, profiles: Record<string, unknown>[], linkedInUrls: string[], fileUrls: string[]) {
  const savedProfiles = [];
  const savedDataSources = [];
  
  try {
    // Create DataSource records for LinkedIn URLs
    for (const url of linkedInUrls) {
      const dataSource = await prisma.dataSource.create({
        data: {
          chatId,
          type: 'LINKEDIN_URL',
          source: url,
          status: 'COMPLETED',
          rawData: profiles.find(p => p.linkedinUrl === url || p.url === url) as Prisma.JsonObject || {}
        }
      });
      savedDataSources.push(dataSource);
      
      // Create Profile record linked to DataSource
      const profile = profiles.find(p => p.linkedinUrl === url || p.url === url);
      if (profile) {
        const savedProfile = await prisma.profile.create({
          data: {
            dataSourceId: dataSource.id,
            name: String(profile.name || profile.fullName || ''),
            linkedinUrl: String(profile.linkedinUrl || profile.url || ''),
            profileData: profile as Prisma.JsonObject
          }
        });
        savedProfiles.push(savedProfile);
      }
    }
    
    // Create DataSource records for files
    for (const fileUrl of fileUrls) {
      const fileDataSource = await prisma.dataSource.create({
        data: {
          chatId,
          type: fileUrl.includes('.csv') ? 'CSV_FILE' : 'EXCEL_FILE',
          source: fileUrl,
          status: 'COMPLETED',
          rawData: { 
            linkedInUrls: linkedInUrls,
            profilesFound: profiles.length
          }
        }
      });
      savedDataSources.push(fileDataSource);
    }
    
    console.log('Successfully saved to database:', {
      profiles: savedProfiles.length,
      dataSources: savedDataSources.length
    });
    
    return { savedProfiles, savedDataSources };
  } catch (error) {
    console.error('Database save error:', error);
    throw error;
  }
}

// Helper function to process file content and extract URLs
async function processFileContent(fileUrl: string): Promise<string[]> {
  try {
    console.log('Calling /api/files/read for:', fileUrl);
    
    // Try to detect file type from URL or assume Excel for UploadThing URLs
    let fileType = 'unknown';
    if (fileUrl.includes('utfs.io') || fileUrl.includes('uploadthing')) {
      // UploadThing URLs don't have extensions, assume Excel for now
      fileType = 'xlsx';
    } else if (fileUrl.endsWith('.csv')) {
      fileType = 'csv';
    } else if (fileUrl.endsWith('.xlsx') || fileUrl.endsWith('.xls')) {
      fileType = 'xlsx';
    } else if (fileUrl.endsWith('.txt')) {
      fileType = 'txt';
    }
    
    console.log('Detected file type:', fileType);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/files/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUrl, fileType })
    });
    
    if (!response.ok) {
      console.warn(`Failed to read file ${fileUrl}:`, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.warn('Error details:', errorData);
      return [];
    }
    
    const { content } = await response.json();
    console.log('File content preview:', content.substring(0, 200) + '...');
    const urls = extractLinkedInUrls(content);
    console.log('Extracted LinkedIn URLs:', urls);
    return urls;
  } catch (error) {
    console.warn(`Error processing file ${fileUrl}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      profileData, 
      analysisContext = 'general founder analysis',
      textInput,
      fileUrls = [],
      // enhanceWithPerplexity = false, // Perplexity integration disabled
      chatId // NEW: Accept chatId for database operations
    } = body;

    // Handle multiple input types
    let finalProfileData = profileData;
    let finalAnalysisContext = analysisContext;
    const allLinkedInUrls: string[] = [];

    // Process text input for URLs and context
    if (textInput) {
      const textUrls = extractLinkedInUrls(textInput);
      allLinkedInUrls.push(...textUrls);
      
      // Extract context from text if not explicitly provided
      if (analysisContext === 'general founder analysis') {
        finalAnalysisContext = await extractAnalysisContext(textInput);
      }
    }

    // Process file URLs
    if (fileUrls.length > 0) {
      console.log('Processing files for LinkedIn URLs...', fileUrls);
      for (const fileUrl of fileUrls) {
        console.log('Processing file:', fileUrl);
        const fileLinkedInUrls = await processFileContent(fileUrl);
        console.log('LinkedIn URLs found in file:', fileLinkedInUrls);
        allLinkedInUrls.push(...fileLinkedInUrls);
      }
      console.log('Total LinkedIn URLs found:', allLinkedInUrls);
    }

    // If we have LinkedIn URLs but no profileData, scrape them
    let allProfiles = [];
    if (allLinkedInUrls.length > 0 && !profileData) {
      console.log('Scraping LinkedIn profiles:', allLinkedInUrls);
      
      try {
        const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/scrape/linkedin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileUrls: allLinkedInUrls })
        });

        if (scrapeResponse.ok) {
          const { profiles } = await scrapeResponse.json();
          if (profiles && profiles.length > 0) {
            allProfiles = profiles;
            finalProfileData = profiles[0]; // Keep for backward compatibility
            console.log('Successfully scraped profile data:', profiles.length, 'profiles');
          }
        }
      } catch (scrapeError) {
        console.warn('LinkedIn scraping failed:', scrapeError);
      }
    } else if (profileData) {
      // If profileData is provided directly, use it
      allProfiles = [profileData];
    }

    // Validate we have profile data or LinkedIn URLs
    if (!finalProfileData && allProfiles.length === 0 && allLinkedInUrls.length === 0) {
      return NextResponse.json(
        { error: 'profileData is required, or provide textInput/fileUrls with LinkedIn URLs' },
        { status: 400 }
      );
    }

    // If we have LinkedIn URLs but scraping failed, provide helpful error
    if (allLinkedInUrls.length > 0 && !finalProfileData && allProfiles.length === 0) {
      return NextResponse.json(
        { 
          error: 'LinkedIn profile scraping failed. Please check the URLs or try again later.',
          linkedInUrls: allLinkedInUrls,
          suggestion: 'Verify the LinkedIn URLs are accessible and try again.'
        },
        { status: 400 }
      );
    }

    // Save profiles to database for future chat context
    let savedProfiles: { id: string; name: string | null }[] = [];
    let savedDataSources: { id: string; type: string }[] = [];
    try {
      if (allProfiles.length > 0 && chatId) {
        const saveResult = await saveProfilesToDatabase(
          chatId,
          allProfiles, 
          allLinkedInUrls, 
          fileUrls
        );
        savedProfiles = saveResult.savedProfiles;
        savedDataSources = saveResult.savedDataSources;
        console.log('Successfully saved profiles to database:', savedProfiles.length);
      }
    } catch (dbError) {
      console.warn('Failed to save profiles to database:', dbError);
      // Continue with analysis even if DB save fails
    }

    // Enhanced context gathering with Perplexity - DISABLED
    // let enhancedContext = '';
    // if (enhanceWithPerplexity) {
    //   console.log('Enhancing analysis with Perplexity research...');
    //   
    //   try {
    //     const searchQueries = await generateGodLevelQueries(finalProfileData, finalAnalysisContext);

    //     // Execute searches in parallel for better performance
    //     const searchPromises = searchQueries.map(async (query) => {
    //       try {
    //         const search = await perplexity.search.create({
    //           query,
    //           max_results: 3,
    //           max_tokens_per_page: 512
    //         });
    //         return { query, results: search.results };
    //       } catch (error) {
    //         console.warn(`Search failed for query "${query}":`, error);
    //         return { query, results: [] };
    //       }
    //     });

    //     const allSearchResults = await Promise.all(searchPromises);
        
    //     // Compile enhanced context
    //     enhancedContext = allSearchResults
    //       .filter(result => result.results.length > 0)
    //       .map(result => {
    //         const resultTexts = result.results.map((r) => {
    //           const searchResult = r as { snippet?: string; content?: string };
    //           return searchResult.snippet || searchResult.content || '';
    //         });
    //         return `SEARCH: ${result.query}\nRESULTS: ${resultTexts.join(' | ')}`;
    //       })
    //       .join('\n\n');

    //     console.log('Perplexity research completed, context length:', enhancedContext.length);
    //   } catch (perplexityError) {
    //     console.warn('Perplexity enhancement failed:', perplexityError);
    //     enhancedContext = 'Enhanced context unavailable due to search API limitations.';
    //   }
    // }

    const analysisPrompt = `
You are a legendary venture capitalist with 30+ years of experience, having backed unicorns like Google, Facebook, Uber, and Airbnb. You have an uncanny ability to spot billion-dollar founders before anyone else.

USER REQUEST: "${textInput || 'Comprehensive founder analysis'}"

ANALYSIS CONTEXT: ${finalAnalysisContext}

FOUNDER PROFILE DATA:
${JSON.stringify(finalProfileData, null, 2)}

LINKEDIN PROFILE ANALYSIS:
Analyzing based on LinkedIn profile data and AI knowledge base.

ANALYSIS FRAMEWORK - Rate each category 1-100 with detailed reasoning:

1. FOUNDER-MARKET FIT (25% weight)
   - Domain expertise depth
   - Market timing intuition  
   - Problem-solution clarity
   - Customer empathy

2. EXECUTION CAPABILITY (25% weight)
   - Track record of delivery
   - Speed of iteration
   - Resource optimization
   - Team building ability

3. VISION & AMBITION (20% weight)
   - Market size thinking
   - Long-term strategic vision
   - Disruption potential
   - Moonshot capability

4. RESILIENCE & GRIT (15% weight)
   - Failure recovery patterns
   - Persistence indicators
   - Stress handling
   - Pivot intelligence

5. NETWORK & INFLUENCE (10% weight)
   - Industry connections
   - Thought leadership
   - Mentor relationships
   - Investor access

6. TECHNICAL/OPERATIONAL DEPTH (5% weight)
   - Core competency strength
   - Innovation capacity
   - Scalability understanding
   - Competitive moats

PROVIDE YOUR ANALYSIS AS A STRUCTURED JSON RESPONSE:
{
  "overallScore": <weighted composite score 1-100>,
  "categoryScores": {
    "founderMarketFit": <score>,
    "executionCapability": <score>,
    "visionAmbition": <score>,
    "resilienceGrit": <score>,
    "networkInfluence": <score>,
    "technicalDepth": <score>
  },
  "investmentThesis": "<3-sentence investment rationale>",
  "keyStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "redFlags": ["<concern 1>", "<concern 2>"],
  "dealBreakers": ["<critical issue>" or "none"],
  "successProbability": "<high/medium/low>",
  "comparableFounders": ["<similar successful founder 1>", "<similar founder 2>"],
  "dueDiligencePriorities": ["<priority 1>", "<priority 2>", "<priority 3>"],
  "valuationImplications": "<founder premium/discount assessment>",
  "recommendedFocusAreas": ["<area 1>", "<area 2>", "<area 3>"],
  "riskLevel": "<low/medium/high>",
  "investmentReadiness": "<ready/needs-work/not-ready>"
}

Be ruthlessly honest. This analysis will determine million-dollar investment decisions.
`;

    console.log('Analyzing profile with Claude...');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
    });

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : 'Analysis failed';

    // Parse JSON response from Claude
    let structuredAnalysis;
    try {
      // Extract JSON from the response (Claude might wrap it in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON response, falling back to text analysis:', parseError);
      
      // Fallback: extract score with regex and create basic structure
      const scoreMatch = analysisText.match(/score[:\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;
      
      structuredAnalysis = {
        overallScore: score,
        categoryScores: {
          founderMarketFit: score,
          executionCapability: score,
          visionAmbition: score,
          resilienceGrit: score,
          networkInfluence: score,
          technicalDepth: score
        },
        investmentThesis: "Analysis parsing failed - see raw analysis text",
        keyStrengths: ["Analysis parsing failed"],
        redFlags: ["Analysis parsing failed"],
        dealBreakers: ["none"],
        successProbability: "medium",
        comparableFounders: [],
        dueDiligencePriorities: ["Review analysis manually"],
        valuationImplications: "Neutral",
        recommendedFocusAreas: ["Review analysis manually"],
        riskLevel: "medium",
        investmentReadiness: "needs-work",
        rawAnalysis: analysisText
      };
    }

    // Generate component specifications for frontend
    const componentSpecs = {
      founderScoreCard: {
        type: 'score_display',
        data: {
          overallScore: structuredAnalysis.overallScore,
          categoryScores: structuredAnalysis.categoryScores,
          riskLevel: structuredAnalysis.riskLevel,
          investmentReadiness: structuredAnalysis.investmentReadiness
        }
      },
      investmentThesis: {
        type: 'thesis_card',
        data: {
          thesis: structuredAnalysis.investmentThesis,
          successProbability: structuredAnalysis.successProbability,
          valuationImplications: structuredAnalysis.valuationImplications
        }
      },
      strengthsWeaknesses: {
        type: 'strengths_weaknesses',
        data: {
          strengths: structuredAnalysis.keyStrengths,
          redFlags: structuredAnalysis.redFlags,
          dealBreakers: structuredAnalysis.dealBreakers
        }
      },
      comparativeAnalysis: {
        type: 'comparison_chart',
        data: {
          comparableFounders: structuredAnalysis.comparableFounders,
          currentFounderScore: structuredAnalysis.overallScore
        }
      },
      actionItems: {
        type: 'action_list',
        data: {
          dueDiligencePriorities: structuredAnalysis.dueDiligencePriorities,
          recommendedFocusAreas: structuredAnalysis.recommendedFocusAreas
        }
      }
    };

    // If we have multiple profiles, analyze them in parallel
    let multipleAnalyses = [];
    if (allProfiles.length > 1) {
      console.log('Running parallel analysis for', allProfiles.length, 'profiles...');
      
      const analysisPromises = allProfiles.map(async (profile: Record<string, unknown>, index: number) => {
        try {
          // Generate enhanced context for each profile - DISABLED
          // let profileEnhancedContext = '';
          // if (enhanceWithPerplexity) {
          //   const profileQueries = await generateGodLevelQueries(profile, finalAnalysisContext);
          //   const profileSearchPromises = profileQueries.slice(0, 3).map(async (query) => { // Limit to 3 queries per profile
          //     try {
          //       const search = await perplexity.search.create({
          //         query,
          //         max_results: 2,
          //         max_tokens_per_page: 256
          //       });
          //       return { query, results: search.results };
          //     } catch {
          //       return { query, results: [] };
          //     }
          //   });
          //   const profileSearchResults = await Promise.all(profileSearchPromises);
          //   profileEnhancedContext = profileSearchResults
          //     .filter(result => result.results.length > 0)
          //     .map(result => {
          //       const resultTexts = result.results.map((r) => {
          //         const searchResult = r as { snippet?: string; content?: string };
          //         return searchResult.snippet || searchResult.content || '';
          //       });
          //       return `${result.query}: ${resultTexts.join(' | ')}`;
          //     })
          //     .join('\n');
          // }

          // Create analysis prompt for this profile
          const profileAnalysisPrompt = `
You are a legendary venture capitalist. Analyze this founder profile:

USER REQUEST: "${textInput || 'Analyze this founder'}"

ANALYSIS CONTEXT: ${finalAnalysisContext}

FOUNDER PROFILE DATA:
${JSON.stringify(profile, null, 2)}

LINKEDIN PROFILE DATA:
Analyzing based on LinkedIn profile information.

Provide a concise analysis with an overall score (1-100) and key insights.
Return as JSON: {"overallScore": <number>, "summary": "<brief summary>", "keyStrengths": ["<strength1>", "<strength2>"], "concerns": ["<concern1>", "<concern2>"]}
`;

          const profileResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: profileAnalysisPrompt }]
          });

          const profileAnalysisText = profileResponse.content[0].type === 'text' ? profileResponse.content[0].text : '{}';
          
          // Parse the response
          let profileAnalysis;
          try {
            const jsonMatch = profileAnalysisText.match(/\{[\s\S]*\}/);
            profileAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
              overallScore: 50,
              summary: 'Analysis parsing failed',
              keyStrengths: [],
              concerns: []
            };
          } catch {
            profileAnalysis = {
              overallScore: 50,
              summary: 'Analysis parsing failed',
              keyStrengths: [],
              concerns: []
            };
          }

          return {
            profileIndex: index,
            profileName: profile.name || profile.fullName || `Profile ${index + 1}`,
            linkedinUrl: profile.linkedinUrl || profile.url || '',
            analysis: profileAnalysis
          };
        } catch (error) {
          console.warn(`Analysis failed for profile ${index}:`, error);
          return {
            profileIndex: index,
            profileName: profile.name || profile.fullName || `Profile ${index + 1}`,
            linkedinUrl: profile.linkedinUrl || profile.url || '',
            analysis: {
              overallScore: 0,
              summary: 'Analysis failed',
              keyStrengths: [],
              concerns: ['Analysis failed']
            }
          };
        }
      });

      multipleAnalyses = await Promise.all(analysisPromises);
      console.log('Parallel analysis completed for', multipleAnalyses.length, 'profiles');
    }

    return NextResponse.json({
      success: true,
      analysis: structuredAnalysis,
      componentSpecs,
      usage: response.usage,
      // Multiple profiles analysis
      multipleProfiles: multipleAnalyses.length > 0 ? {
        totalProfiles: allProfiles.length,
        analyses: multipleAnalyses,
        averageScore: multipleAnalyses.length > 0 ? 
          Math.round(multipleAnalyses.reduce((sum, a) => sum + a.analysis.overallScore, 0) / multipleAnalyses.length) : 0
      } : null,
      // Enhanced processing metadata
      processingInfo: {
        linkedInUrlsFound: allLinkedInUrls.length,
        filesProcessed: fileUrls.length,
        profilesAnalyzed: allProfiles.length,
        perplexityEnhanced: false, // Perplexity integration disabled
        analysisContext: finalAnalysisContext,
        profileSource: profileData ? 'provided' : 'scraped'
      },
      // NEW: Database persistence info
      databaseInfo: {
        profilesSaved: savedProfiles.length,
        dataSourcesCreated: savedDataSources.length,
        primaryProfileId: savedProfiles[0]?.id || null,
        allProfileIds: savedProfiles.map(p => p.id)
      },
      // ADD: LinkedIn profile data for chat context
      linkedInProfiles: allProfiles,
      primaryProfile: finalProfileData,
      // Legacy fields for backward compatibility
      score: structuredAnalysis.overallScore,
      rawAnalysis: analysisText
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'God-Level VC Analysis API with LinkedIn + Claude Analysis',
    endpoint: '/api/analyze',
    method: 'POST',
    capabilities: [
      'Text + File simultaneous processing',
      'LinkedIn URL extraction and scraping',
      'LinkedIn profile analysis with Claude AI',
      'Context-aware analysis',
      'Structured JSON output with UI components'
    ],
    inputOptions: {
      profileData: 'LinkedIn profile data (optional if providing URLs)',
      analysisContext: 'Optional: "young founders", "B2B SaaS", "technical founders", etc.',
      textInput: 'Text containing LinkedIn URLs and analysis context',
      fileUrls: 'Array of file URLs (CSV/Excel) containing LinkedIn URLs',
      enhanceWithPerplexity: 'Boolean: Enable market research enhancement (DISABLED - always false)'
    },
    responseFormat: {
      analysis: 'Structured JSON analysis with 13+ fields',
      componentSpecs: 'UI component specifications (5 components)',
      processingInfo: 'Metadata about enhanced processing',
      score: 'Overall founder score (1-100)',
      usage: 'Claude API usage statistics'
    },
    examples: {
      basicProfile: {
        profileData: { name: 'John Doe', linkedinUrl: '...', companyName: '...' }
      },
      textWithUrls: {
        textInput: 'Analyze these young B2B SaaS founders: https://linkedin.com/in/user1, https://linkedin.com/in/user2',
        enhanceWithPerplexity: false
      },
      filesAndText: {
        textInput: 'Analyze technical founders in this list',
        fileUrls: ['https://uploadthing.com/file1.csv', 'https://uploadthing.com/file2.xlsx'],
        analysisContext: 'technical founders'
      },
      comprehensive: {
        profileData: { name: 'Jane Smith', linkedinUrl: '...', companyName: '...' },
        analysisContext: 'young B2B SaaS founders',
        enhanceWithPerplexity: false
      }
    }
  });
}
