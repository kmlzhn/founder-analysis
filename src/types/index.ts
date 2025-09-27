export interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface DataSource {
  id: string;
  chatId: string;
  type: 'LINKEDIN_URL' | 'TWITTER_URL' | 'CSV_FILE' | 'EXCEL_FILE';
  source: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rawData?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  dataSourceId: string;
  name?: string;
  email?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  profileData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  id: string;
  chatId: string;
  profileId?: string;
  type: 'FOUNDER_POTENTIAL' | 'BATCH_ANALYSIS' | 'COMPARISON' | 'CUSTOM';
  provider: string;
  overallScore?: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  
  // Multiple Profiles Support
  isMultiProfile: boolean;
  totalProfiles?: number;
  averageScore?: number;
  profileAnalyses?: ProfileAnalysisResult[];
  
  // Enhanced Processing Info
  linkedInUrlsFound?: number;
  filesProcessed?: number;
  profilesAnalyzed?: number;
  perplexityEnhanced: boolean;
  analysisContext?: string;
  profileSource?: string;
  
  detailedResults: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileAnalysisResult {
  profileIndex: number;
  profileName: string;
  linkedinUrl: string;
  analysis: {
    overallScore: number;
    summary: string;
    keyStrengths: string[];
    concerns: string[];
  };
}

