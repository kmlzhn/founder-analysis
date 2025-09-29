import ReactMarkdown from 'react-markdown';
import { Message } from '@/types';
import FounderAnalysisCard from './FounderAnalysisCard';
import MultipleProfilesList from './MultipleProfilesList';
import FileAttachment from './FileAttachment';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'USER';

  // Keep the full message content including JSON blocks for text display
  const content = message.content;

  // Check if this is an analysis result message with embedded data
  const isAnalysisResult = !isUser && content.includes('<!--ANALYSIS_DATA:');

  // Parse analysis data from embedded JSON in HTML comment
  const parseAnalysisData = () => {
    if (!isAnalysisResult) return null;

    try {
      // Extract JSON data from HTML comment
      const dataMatch = content.match(/<!--ANALYSIS_DATA:([\s\S]*?)-->/);
      if (!dataMatch) {
        console.log('No ANALYSIS_DATA comment found in content');
        return null;
      }

      console.log('Found analysis data, parsing...');
      const analysisData = JSON.parse(dataMatch[1]);
      console.log('Parsed analysis data:', analysisData);
      
      // Check for multiple profiles
      if (analysisData.multipleProfiles && analysisData.multipleProfiles.analyses.length > 0) {
        console.log('Multiple profiles detected');
        return {
          type: 'multiple' as const,
          multipleProfiles: analysisData.multipleProfiles
        };
      }

      // Single founder analysis
      if (analysisData.analysis) {
        console.log('Single founder analysis detected');
        return {
          type: 'single' as const,
          analysis: analysisData.analysis,
          founderName: "Founder Analysis"
        };
      }

      console.log('No valid analysis structure found');
      return null;
    } catch (error) {
      console.error('Failed to parse embedded analysis data:', error);
      console.log('Content that failed to parse:', content.substring(0, 500));
      return null;
    }
  };

  const analysisData = parseAnalysisData();

  return (
    <div className="py-6 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {isUser ? (
          // User message - right aligned with light gray modern bubble
          <div className="flex justify-end mb-4">
            <div className="max-w-sm lg:max-w-lg xl:max-w-xl">
              <div className="border rounded-2xl border-gray-200/60 bg-light-gray/70 backdrop-blur-sm px-3 py-1">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <ReactMarkdown>
                    {content}
                  </ReactMarkdown>
                </div>
                
                {/* File Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200/60">
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((file) => (
                        <FileAttachment key={file.id} file={file} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // AI message - left aligned without bubble
          <div className="flex justify-start mb-4">
            <div className="max-w-full">
              {analysisData ? (
                // Render custom analysis cards
                <div className="space-y-4">
                  {analysisData.type === 'single' && analysisData.analysis && (
                    <FounderAnalysisCard
                      analysis={analysisData.analysis}
                      founderName={analysisData.founderName}
                      onSave={() => console.log('Save analysis')}
                    />
                  )}
                  
                  {analysisData.type === 'multiple' && analysisData.multipleProfiles && (
                    <MultipleProfilesList
                      multipleProfiles={analysisData.multipleProfiles}
                      onSave={() => console.log('Save all analyses')}
                    />
                  )}
                </div>
              ) : (
                // Regular markdown content
                <div className="prose max-w-none text-gray-900">
                  <ReactMarkdown>
                    {content.replace(/<!--ANALYSIS_DATA:[\s\S]*?-->/, '').trim()}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
