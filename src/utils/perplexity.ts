// Perplexity API integration

// Define the request type
interface PerplexityRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

// Define the response type
interface PerplexityResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call the Perplexity API with the provided messages
 */
export async function callPerplexity(
  messages: PerplexityRequest['messages'],
  options: {
    model?: string;
    max_tokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY is not defined in environment variables');
  }

  const model = options.model || 'sonar-pro';
  const max_tokens = options.max_tokens || 1024;
  const temperature = options.temperature || 0.7;

  const requestBody: PerplexityRequest = {
    model,
    messages,
    max_tokens,
    temperature,
  };

  try {
    const candidateModels = [
      model,
      'sonar-medium-online',
      'sonar-small-online',
      'sonar',
    ];

    let lastErrorText = '';
    for (const selectedModel of candidateModels) {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...requestBody, model: selectedModel }),
      });

      if (response.ok) {
        const data = await response.json() as PerplexityResponse;
        return data.choices[0].message.content;
      } else {
        lastErrorText = await response.text();
        // Try next model on invalid model/plan errors
        if (!(response.status === 404 || response.status === 400 || /model|not permitted|invalid_model/i.test(lastErrorText))) {
          throw new Error(`Perplexity API error: ${response.status} ${lastErrorText}`);
        }
      }
    }

    throw new Error(`Perplexity API error: invalid_model. Tried models: ${candidateModels.join(', ')}. Last error: ${lastErrorText}`);
  } catch (error) {
    console.error('Error calling Perplexity API:', error);
    throw error;
  }
}

/**
 * Analyze founder potential using Perplexity API
 */
export async function analyzeFounderWithPerplexity(
  input: {
    name?: string;
    linkedinUrl?: string;
    csvData?: string;
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
  } else if (input.csvData) {
    systemPrompt += `\nYou are analyzing CSV data that contains information about a potential founder. Parse this data carefully.`;
    userPrompt = `Please analyze the founder potential based on this CSV data:\n\n${input.csvData}`;
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  const response = await callPerplexity(messages, {
    model: 'sonar-pro',
    max_tokens: 2048,
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
