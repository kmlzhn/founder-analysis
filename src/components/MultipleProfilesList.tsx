'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, ExternalLink, Save, TrendingUp, AlertTriangle } from 'lucide-react';

interface ProfileAnalysis {
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

interface MultipleProfilesListProps {
  multipleProfiles: {
    totalProfiles: number;
    averageScore: number;
    analyses: ProfileAnalysis[];
  };
  onSave?: () => void;
}

export default function MultipleProfilesList({ 
  multipleProfiles, 
  onSave 
}: MultipleProfilesListProps) {
  const [expandedProfile, setExpandedProfile] = useState<number | null>(null);

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

  const toggleProfile = (index: number) => {
    setExpandedProfile(expandedProfile === index ? null : index);
  };

  return (
    <div className="border rounded-2xl border-gray-200/60 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">
              Multiple Profiles Analysis ({multipleProfiles.totalProfiles} founders)
            </h3>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(multipleProfiles.averageScore)}`}>
            Avg: {multipleProfiles.averageScore}/100
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">{multipleProfiles.totalProfiles}</div>
            <div className="text-gray-500">Profiles</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{multipleProfiles.averageScore}</div>
            <div className="text-gray-500">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {multipleProfiles.analyses.filter(a => a.analysis.overallScore >= 80).length}
            </div>
            <div className="text-gray-500">High Potential</div>
          </div>
        </div>
      </div>

      {/* Profiles List */}
      <div className="divide-y divide-gray-100/60">
        {multipleProfiles.analyses.map((profile, index) => (
          <div key={profile.profileIndex} className="relative">
            {/* Profile Summary */}
            <div 
              className="p-4 hover:bg-gray-50/50 cursor-pointer transition-colors"
              onClick={() => toggleProfile(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {profile.profileName}
                      </h4>
                      {profile.linkedinUrl && (
                        <a 
                          href={profile.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {profile.analysis.summary}
                    </p>
                    
                    {/* Quick Indicators */}
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      {profile.analysis.keyStrengths.length > 0 && (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {profile.analysis.keyStrengths.length} strengths
                        </span>
                      )}
                      {profile.analysis.concerns.length > 0 && (
                        <span className="text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {profile.analysis.concerns.length} concerns
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-4">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(profile.analysis.overallScore)}`}>
                    {profile.analysis.overallScore}
                  </div>
                  
                  <motion.div
                    animate={{ rotate: expandedProfile === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </div>
              </div>

              {/* Score Bar */}
              <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${getScoreBarColor(profile.analysis.overallScore)}`}
                  style={{ width: `${profile.analysis.overallScore}%` }}
                />
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedProfile === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="overflow-hidden bg-gray-50/30"
                >
                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      {profile.analysis.keyStrengths.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 text-green-700">
                            Key Strengths
                          </h5>
                          <ul className="space-y-1">
                            {profile.analysis.keyStrengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concerns */}
                      {profile.analysis.concerns.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2 text-red-700">
                            Concerns
                          </h5>
                          <ul className="space-y-1">
                            {profile.analysis.concerns.map((concern, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Save Button */}
      {onSave && (
        <div className="p-4 border-t border-gray-100/60 bg-gray-50/30">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save All Analyses
          </button>
        </div>
      )}
    </div>
  );
}
