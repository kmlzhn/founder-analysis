'use client';

import { useEffect, useRef } from 'react';
import { FounderAnalysisResults } from '@/types';

interface AnalysisChartsProps {
  results: FounderAnalysisResults;
}

const AnalysisCharts = ({ results }: AnalysisChartsProps) => {
  const scoreChartRef = useRef<HTMLCanvasElement>(null);
  const probabilityChartRef = useRef<HTMLCanvasElement>(null);
  const traitsRadarRef = useRef<HTMLCanvasElement>(null);
  const skillsChartRef = useRef<HTMLCanvasElement>(null);
  const timelineChartRef = useRef<HTMLCanvasElement>(null);

  // Safe fallbacks to avoid runtime errors if some fields are missing
  const score = typeof results?.score === 'number' ? results.score : 0;
  const strengths = Array.isArray(results?.strengths) ? results.strengths : [];
  const areasForGrowth = Array.isArray(results?.areasForGrowth) ? results.areasForGrowth : [];
  const recommendedFocusAreas = Array.isArray(results?.recommendedFocusAreas) ? results.recommendedFocusAreas : [];
  const success = results?.successProbability || { shortTerm: 0, longTerm: 0 };
  const founderTraits = results?.founderTraits;
  const skills = results?.skillsDistribution;
  const milestones = Array.isArray(results?.careerMilestones) ? results.careerMilestones : [];
  const profileInsights = results?.profileInsights;

  useEffect(() => {
    if (!results) return;

    // Import Chart.js dynamically to avoid SSR issues
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      
      // Set default colors for charts
      const chartColors = {
        blue: 'rgba(54, 162, 235, 0.8)',
        green: 'rgba(75, 192, 192, 0.8)',
        purple: 'rgba(153, 102, 255, 0.8)',
        orange: 'rgba(255, 159, 64, 0.8)',
        red: 'rgba(255, 99, 132, 0.8)',
        yellow: 'rgba(255, 206, 86, 0.8)',
        gray: 'rgba(220, 220, 220, 0.3)'
      };
      
      // Create score gauge chart
      if (scoreChartRef.current) {
        const scoreCtx = scoreChartRef.current.getContext('2d');
        
        if (scoreCtx) {
          // Destroy existing chart if it exists
          const existingChart = Chart.getChart(scoreCtx.canvas);
          if (existingChart) existingChart.destroy();
          
          new Chart(scoreCtx, {
            type: 'doughnut',
            data: {
              labels: ['Score', 'Remaining'],
              datasets: [{
                data: [score, 100 - score],
                backgroundColor: [
                  chartColors.blue,
                  chartColors.gray
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '80%',
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: false
                }
              }
            }
          });
        }
      }
      
      // Create probability comparison chart
      if (probabilityChartRef.current) {
        const probabilityCtx = probabilityChartRef.current.getContext('2d');
        
        if (probabilityCtx) {
          // Destroy existing chart if it exists
          const existingChart = Chart.getChart(probabilityCtx.canvas);
          if (existingChart) existingChart.destroy();
          
          new Chart(probabilityCtx, {
            type: 'bar',
            data: {
              labels: ['Short-term (1-2 years)', 'Long-term (5+ years)'],
              datasets: [{
                label: 'Success Probability (%)',
                data: [
                  success.shortTerm,
                  success.longTerm
                ],
                backgroundColor: [
                  chartColors.blue,
                  chartColors.green
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: function(value) {
                      return value + '%';
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
        }
      }
      
      // Create radar chart for founder traits if data exists
      if (traitsRadarRef.current && founderTraits) {
        const traitsCtx = traitsRadarRef.current.getContext('2d');
        
        if (traitsCtx) {
          // Destroy existing chart if it exists
          const existingChart = Chart.getChart(traitsCtx.canvas);
          if (existingChart) existingChart.destroy();
          
          const traits = founderTraits;
          
          new Chart(traitsCtx, {
            type: 'radar',
            data: {
              labels: ['Vision', 'Execution', 'Resilience', 'Leadership', 'Innovation', 'Adaptability'],
              datasets: [{
                label: 'Founder Traits',
                data: [
                  traits.vision || 0,
                  traits.execution || 0,
                  traits.resilience || 0,
                  traits.leadership || 0,
                  traits.innovation || 0,
                  traits.adaptability || 0
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: chartColors.blue,
                borderWidth: 2,
                pointBackgroundColor: chartColors.blue,
                pointRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  angleLines: {
                    display: true
                  },
                  suggestedMin: 0,
                  suggestedMax: 100
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              }
            }
          });
        }
      }
      
      // Create skills distribution chart if data exists
      if (skillsChartRef.current && skills) {
        const skillsCtx = skillsChartRef.current.getContext('2d');
        
        if (skillsCtx) {
          // Destroy existing chart if it exists
          const existingChart = Chart.getChart(skillsCtx.canvas);
          if (existingChart) existingChart.destroy();
          
          const skillsObj = skills;
          const skillLabels = Object.keys(skillsObj).map(key => 
            key.charAt(0).toUpperCase() + key.slice(1)
          );
          const skillValues = Object.values(skillsObj);
          
          new Chart(skillsCtx, {
            type: 'polarArea',
            data: {
              labels: skillLabels,
              datasets: [{
                data: skillValues,
                backgroundColor: [
                  chartColors.blue,
                  chartColors.green,
                  chartColors.purple,
                  chartColors.orange,
                  chartColors.red
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }
          });
        }
      }
      
      // Create timeline chart if career milestones exist
      if (timelineChartRef.current && milestones && milestones.length > 0) {
        const timelineCtx = timelineChartRef.current.getContext('2d');
        
        if (timelineCtx) {
          // Destroy existing chart if it exists
          const existingChart = Chart.getChart(timelineCtx.canvas);
          if (existingChart) existingChart.destroy();
          
          const sortedMilestones = [...milestones].sort((a, b) => a.year - b.year);
          
          new Chart(timelineCtx, {
            type: 'line',
            data: {
              labels: sortedMilestones.map(m => m.year.toString()),
              datasets: [{
                label: 'Career Progression',
                data: sortedMilestones.map(m => m.significance),
                backgroundColor: chartColors.purple,
                borderColor: chartColors.purple,
                borderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: false,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Significance'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Year'
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      const index = context.dataIndex;
                      return sortedMilestones[index].event;
                    }
                  }
                }
              }
            }
          });
        }
      }
    });
  }, [results, score, success, founderTraits, skills, milestones]);

  if (!results) return null;

  return (
    <div className="mt-6 space-y-8">
      {/* Score Gauge */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          Overall Founder Potential Score
        </h3>
        <div className="relative h-60 w-full">
          <canvas ref={scoreChartRef} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl font-bold text-gray-900">{score}</span>
              <span className="text-xl text-gray-500">/100</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Probability */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
          Success Probability
        </h3>
        <div className="h-60 w-full">
          <canvas ref={probabilityChartRef} />
        </div>
      </div>
      
      {/* Strengths and Areas for Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Key Strengths
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="text-gray-700">
                {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Areas for Growth
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {areasForGrowth.map((area, index) => (
              <li key={index} className="text-gray-700">
                {area}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Recommended Focus Areas */}
      <div className="bg-white rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recommended Focus Areas
        </h3>
        <ol className="list-decimal pl-5 space-y-2">
          {recommendedFocusAreas.map((area, index) => (
            <li key={index} className="text-gray-700">
              {area}
            </li>
          ))}
        </ol>
      </div>
      
      {/* Founder Traits Radar Chart */}
      {founderTraits && (
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Founder Traits Profile
          </h3>
          <div className="h-80 w-full">
            <canvas ref={traitsRadarRef} />
          </div>
        </div>
      )}
      
      {/* Skills Distribution Chart */}
      {skills && (
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Skills Distribution
          </h3>
          <div className="h-80 w-full">
            <canvas ref={skillsChartRef} />
          </div>
        </div>
      )}
      
      {/* Career Timeline */}
      {milestones && milestones.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Career Timeline
          </h3>
          <div className="h-60 w-full">
            <canvas ref={timelineChartRef} />
          </div>
        </div>
      )}
      
      {/* LinkedIn Profile Insights (if available) */}
      {profileInsights && (
        <div className="bg-white rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            LinkedIn Profile Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileInsights.connectionNetwork && (
              <div>
                <h4 className="font-medium text-gray-800">Connection Network</h4>
                <p className="text-gray-700">{profileInsights.connectionNetwork}</p>
              </div>
            )}
            {profileInsights.experience && (
              <div>
                <h4 className="font-medium text-gray-800">Experience</h4>
                <p className="text-gray-700">{profileInsights.experience}</p>
              </div>
            )}
            {profileInsights.education && (
              <div>
                <h4 className="font-medium text-gray-800">Education</h4>
                <p className="text-gray-700">{profileInsights.education}</p>
              </div>
            )}
            {profileInsights.recommendations && (
              <div>
                <h4 className="font-medium text-gray-800">Recommendations</h4>
                <p className="text-gray-700">{profileInsights.recommendations}</p>
              </div>
            )}
            {profileInsights.contentEngagement && (
              <div>
                <h4 className="font-medium text-gray-800">Content Engagement</h4>
                <p className="text-gray-700">{profileInsights.contentEngagement}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCharts;