export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  searchType?: 'name' | 'linkedin' | 'csv';
  searchQuery?: string;
  founderScore?: number;
}

export interface FounderAnalysisResults {
  score: number;
  strengths: string[];
  areasForGrowth: string[];
  successProbability: {
    shortTerm: number;
    longTerm: number;
  };
  recommendedFocusAreas: string[];
  founderTraits?: {
    vision?: number;
    execution?: number;
    resilience?: number;
    leadership?: number;
    innovation?: number;
    adaptability?: number;
  };
  skillsDistribution?: {
    technical?: number;
    business?: number;
    leadership?: number;
    communication?: number;
    problemSolving?: number;
  };
  careerMilestones?: Array<{
    year: number;
    event: string;
    significance: number;
  }>;
  profileInsights?: {
    connectionNetwork?: string;
    experience?: string;
    education?: string;
    recommendations?: string;
    contentEngagement?: string;
  };
}

export interface AnalysisResponse {
  analysis: string;
  score: number;
  results: FounderAnalysisResults;
}
