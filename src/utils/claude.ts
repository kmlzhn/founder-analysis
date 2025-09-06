// Claude API integration

// Define the request type
interface ClaudeRequest {
  model: string;
  system?: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

// Define the response type
interface ClaudeResponse {
  id: string;
  model: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Call the Claude API with the provided messages
 */
export async function callClaude(
  messages: ClaudeRequest['messages'],
  options: {
    system?: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('CLAUDE_API_KEY is not defined in environment variables');
  }

  // Use a currently supported model name per Anthropic Messages API
  const model = options.model || 'claude-sonnet-4-20250514';
  const max_tokens = options.max_tokens || 4096;
  const temperature = options.temperature || 0.7;

  const requestBody: ClaudeRequest = {
    model,
    messages,
    max_tokens,
    temperature,
  };
  
  if (options.system) {
    requestBody.system = options.system;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorText: string;
      try {
        // Anthropic errors return JSON with an error.message
        const errJson = await response.json();
        errorText = errJson?.error?.message || JSON.stringify(errJson);
      } catch {
        errorText = await response.text();
      }
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as ClaudeResponse;
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

/**
 * Analyze founder potential using Claude API
 */
export async function analyzeFounderWithClaude(
  input: {
    name?: string;
    linkedinUrl?: string;
    csvData?: string;
    profileData?: string;
  }
): Promise<{
  analysis: string;
  score: number;
  results: any;
}> {
  let systemPrompt = `You are an expert founder potential analyzer with deep knowledge of what makes successful startup founders. 
Analyze the provided information and give a detailed assessment of the person's potential as a founder.
Your response should be in markdown format and include:
1. An overall founder potential score (0-100)
2. Key strengths
3. Areas for growth
4. Detailed analysis with specific traits and indicators
5. Success probability (short-term and long-term)
6. Recommended focus areas

IMPORTANT: Use a professional, formal tone throughout your analysis. Do not use emojis, emoticons, or casual language. Present information in a structured, business-appropriate format with clear headings and concise bullet points. All section titles should be clear and descriptive without decorative elements.

Additionally, provide structured data in JSON format at the end of your response, enclosed in triple backticks with the json tag: \`\`\`json\`\`\`
The JSON should include:
{
  "score": number,
  "strengths": string[],
  "areasForGrowth": string[],
  "successProbability": {
    "shortTerm": number,
    "longTerm": number
  },
  "recommendedFocusAreas": string[],
  "founderTraits": {
    "vision": number,
    "execution": number,
    "resilience": number,
    "leadership": number,
    "innovation": number,
    "adaptability": number
  },
  "skillsDistribution": {
    "technical": number,
    "business": number,
    "leadership": number,
    "communication": number,
    "problemSolving": number
  },
  "careerMilestones": [
    {
      "year": number,
      "event": string,
      "significance": number
    }
  ]
}`;

  let userPrompt = '';

  if (input.name) {
    userPrompt = `Please analyze the founder potential for a person named: ${input.name}`;
  } else if (input.linkedinUrl) {
    systemPrompt += `\nYou are analyzing a LinkedIn profile URL. Extract as much information as possible from the URL and username.`;
    userPrompt = `Please analyze the founder potential based on this LinkedIn profile: ${input.linkedinUrl}`;
    if (input.profileData) {
      systemPrompt += `\nAdditional structured profile data has been provided below. Use it as the primary source of truth for the analysis.`;
      userPrompt += `\n\nHere is structured profile data (JSON):\n${input.profileData}`;
    }
  } else if (input.csvData) {
    systemPrompt += `\nYou are analyzing CSV data that contains information about a potential founder. Parse this data carefully.`;
    userPrompt = `Please analyze the founder potential based on this CSV data:\n\n${input.csvData}`;
  }

  const messages = [
    { role: 'user' as const, content: userPrompt },
  ];

  const response = await callClaude(messages, {
    system: systemPrompt,
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    temperature: 0.7,
  });

  // Extract JSON data from the response
  let results;
  try {
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      results = JSON.parse(jsonMatch[1]);
    } else {
      // Fallback to default values if JSON extraction fails
      results = {
        score: 75,
        strengths: ['Adaptability', 'Problem-solving'],
        areasForGrowth: ['Experience', 'Network'],
        successProbability: {
          shortTerm: 70,
          longTerm: 65
        },
        recommendedFocusAreas: ['Building experience', 'Expanding network'],
        founderTraits: {
          vision: 65,
          execution: 70,
          resilience: 75,
          leadership: 60,
          innovation: 72,
          adaptability: 80
        },
        skillsDistribution: {
          technical: 65,
          business: 60,
          leadership: 55,
          communication: 70,
          problemSolving: 75
        },
        careerMilestones: [
          {
            year: new Date().getFullYear() - 5,
            event: "Started career",
            significance: 40
          },
          {
            year: new Date().getFullYear() - 2,
            event: "Key achievement",
            significance: 65
          },
          {
            year: new Date().getFullYear(),
            event: "Current position",
            significance: 75
          }
        ]
      };
    }
  } catch (error) {
    console.error('Error parsing JSON from response:', error);
    // Fallback to default values
    results = {
      score: 75,
      strengths: ['Adaptability', 'Problem-solving'],
      areasForGrowth: ['Experience', 'Network'],
      successProbability: {
        shortTerm: 70,
        longTerm: 65
      },
      recommendedFocusAreas: ['Building experience', 'Expanding network'],
      founderTraits: {
        vision: 65,
        execution: 70,
        resilience: 75,
        leadership: 60,
        innovation: 72,
        adaptability: 80
      },
      skillsDistribution: {
        technical: 65,
        business: 60,
        leadership: 55,
        communication: 70,
        problemSolving: 75
      },
      careerMilestones: [
        {
          year: new Date().getFullYear() - 5,
          event: "Started career",
          significance: 40
        },
        {
          year: new Date().getFullYear() - 2,
          event: "Key achievement",
          significance: 65
        },
        {
          year: new Date().getFullYear(),
          event: "Current position",
          significance: 75
        }
      ]
    };
  }

  // Keep the JSON block in the analysis so the UI can render charts
  return {
    analysis: response,
    score: results.score,
    results
  };
}
