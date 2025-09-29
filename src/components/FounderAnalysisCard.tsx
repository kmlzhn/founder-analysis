'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, Save, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface FounderAnalysisCardProps {
  analysis: {
    overallScore: number;
    categoryScores?: {
      founderMarketFit: number;
      executionCapability: number;
      visionAmbition: number;
      resilienceGrit: number;
      networkInfluence: number;
      technicalDepth: number;
    };
    investmentThesis?: string;
    keyStrengths?: string[];
    redFlags?: string[];
    dealBreakers?: string[];
    successProbability?: string;
    riskLevel?: string;
    investmentReadiness?: string;
    comparableFounders?: string[];
    dueDiligencePriorities?: string[];
    recommendedFocusAreas?: string[];
  };
  founderName?: string;
  linkedinUrl?: string;
  onSave?: () => void;
}

export default function FounderAnalysisCard({ 
  analysis, 
  founderName = "Founder Analysis",
  linkedinUrl,
  onSave 
}: FounderAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const categoryLabels = {
    founderMarketFit: 'Founder-Market Fit',
    executionCapability: 'Execution Capability',
    visionAmbition: 'Vision & Ambition',
    resilienceGrit: 'Resilience & Grit',
    networkInfluence: 'Network & Influence',
    technicalDepth: 'Technical Depth'
  };

  return (
    <div className="border rounded-2xl border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">{founderName}</h3>
            </div>
            {linkedinUrl && (
              <a 
                href={linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.overallScore)}`}>
              {analysis.overallScore}/100
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </motion.div>
            </button>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          {analysis.riskLevel && (
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRiskColor(analysis.riskLevel)}`}>
              {analysis.riskLevel.toUpperCase()} RISK
            </span>
          )}
          {analysis.investmentReadiness && (
            <span className="text-gray-600">
              Status: <span className="font-medium">{analysis.investmentReadiness}</span>
            </span>
          )}
          {analysis.successProbability && (
            <span className="text-gray-600">
              Success: <span className="font-medium">{analysis.successProbability}</span>
            </span>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-6">
              {/* Category Scores */}
              {analysis.categoryScores && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Category Breakdown
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(analysis.categoryScores).map(([key, score]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-gray-600 truncate">
                          {categoryLabels[key as keyof typeof categoryLabels]}
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreBarColor(score)}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                        <div className="w-8 text-sm font-medium text-gray-700">
                          {score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investment Thesis */}
              {analysis.investmentThesis && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Investment Thesis</h4>
                  <p className="text-gray-700 text-sm leading-relaxed bg-blue-50/50 p-3 rounded-lg">
                    {analysis.investmentThesis}
                  </p>
                </div>
              )}

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.keyStrengths && analysis.keyStrengths.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-green-700">Key Strengths</h4>
                    <ul className="space-y-1">
                      {analysis.keyStrengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(analysis.redFlags || analysis.dealBreakers) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-red-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Concerns
                    </h4>
                    <ul className="space-y-1">
                      {analysis.redFlags?.map((flag, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                      {analysis.dealBreakers?.filter(db => db !== 'none').map((breaker, index) => (
                        <li key={`breaker-${index}`} className="text-sm text-red-700 font-medium flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-700 rounded-full mt-2 flex-shrink-0" />
                          🚨 {breaker}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.dueDiligencePriorities && analysis.dueDiligencePriorities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Due Diligence Priorities</h4>
                    <ul className="space-y-1">
                      {analysis.dueDiligencePriorities.map((priority, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {priority}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendedFocusAreas && analysis.recommendedFocusAreas.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Focus Areas</h4>
                    <ul className="space-y-1">
                      {analysis.recommendedFocusAreas.map((area, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Comparable Founders */}
              {analysis.comparableFounders && analysis.comparableFounders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Comparable Founders</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.comparableFounders.map((founder, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {founder}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              {onSave && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={onSave}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save Analysis
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
