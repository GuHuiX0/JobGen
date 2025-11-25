/**
 * ============================================================================
 * Dashboard Page
 * ----------------------------------------------------------------------------
 * Provides a personalized analytics dashboard for interview performance.
 *
 * Displays:
 *   • Key performance metrics (score, keyword usage, delivery quality)
 *   • Readiness trend over time (line chart)
 *   • AI-generated insights summarizing user improvement areas
 *   • Confidence & delivery breakdown
 *   • Keyword usage and trends
 *   • Radar chart by interview type
 *   • Recent interview history with metadata
 *
 * Responsibilities:
 *   - Fetch dashboard analytics (trend, radar, interview history)
 *   - Handle loading & error UI states
 *   - Normalize and pass analytics to modular visualization components
 *   - Provide a clean, component-driven analytics layout
 *
 * Notes:
 *   - Trend and radar analytics come from backend API
 *   - Interview list is currently mock data but structured to match real API
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';

import {
  Header,
  KeyMetrics,
  ReadinessTrend,
  ConfidenceDelivery,
  KeywordTracking,
  RadarSection,
  LoadingView,
  ErrorView,
  InsightsView
} from "../../components/dashboard";


const Dashboard = () => {
  const navigate = useNavigate();

  /* --------------------------------------------------------------------------
   * Local State
   * --------------------------------------------------------------------------
   * loading          — Whether analytics data is being fetched
   * trendData        — Readiness trend data (time-series)
   * radarData        — Radar breakdown by interview type
   * recentInterviews — Recent interview history (mocked or real)
   * error            — Stores fetch errors for fallback UI
   * ------------------------------------------------------------------------ */
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [error, setError] = useState(null);

  /**
   * ============================================================================
   * Fetch all dashboard analytics on mount (parallel requests)
   * ----------------------------------------------------------------------------
   * Includes:
   *   • Readiness Trend (line chart)
   *   • Type Radar breakdown (radar chart)
   *   • Recent interviews (mocked for now; structured for real API)
   *
   * All requests executed concurrently via Promise.all for performance.
   * ============================================================================
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [trend, radar, interviews] = await Promise.all([
          dashboardAPI.getReadinessTrend('2025-09-01', '2025-10-15'),
          dashboardAPI.getTypeRadar('90d'),
          // Mocked history; can be replaced with backend in future
          Promise.resolve({
            interviews: [
              {
                id: 'ivw_001',
                date: '2025-11-15',
                type: 'behavioral',
                score: 85,
                keywordUsage: 78,
                confidence: 82,
                clarity: 88,
                keywords: ['leadership', 'teamwork', 'problem-solving'],
                topKeywords: [
                  { keyword: 'leadership', count: 5, trend: 'up' },
                  { keyword: 'teamwork', count: 3, trend: 'up' },
                  { keyword: 'problem-solving', count: 4, trend: 'stable' }
                ]
              },
              {
                id: 'ivw_002',
                date: '2025-11-12',
                type: 'technical',
                score: 78,
                keywordUsage: 72,
                confidence: 75,
                clarity: 80,
                keywords: ['algorithm', 'optimization', 'database'],
                topKeywords: [
                  { keyword: 'algorithm', count: 4, trend: 'up' },
                  { keyword: 'optimization', count: 3, trend: 'stable' },
                  { keyword: 'database', count: 2, trend: 'down' }
                ]
              },
              {
                id: 'ivw_003',
                date: '2025-11-10',
                type: 'behavioral',
                score: 82,
                keywordUsage: 75,
                confidence: 80,
                clarity: 85,
                keywords: ['communication', 'conflict', 'leadership'],
                topKeywords: [
                  { keyword: 'communication', count: 6, trend: 'up' },
                  { keyword: 'conflict', count: 2, trend: 'stable' },
                  { keyword: 'leadership', count: 3, trend: 'up' }
                ]
              }
            ]
          })
        ]);

        setTrendData(trend);
        setRadarData(radar);
        setRecentInterviews(interviews.interviews || []);
        setLoading(false);

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* --------------------------------------------------------------------------
   * Loading & Error Fallback UI
   * ------------------------------------------------------------------------ */
  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  /**
   * ============================================================================
   * Render Analytics Dashboard
   * ----------------------------------------------------------------------------
   * Modular sections:
   *   1. Key Metrics (quick performance summary)
   *   2. Readiness Trend (line graph)
   *   3. AI Insights
   *   4. Confidence / Delivery metrics
   *   5. Keyword Tracking
   *   6. Radar by Interview Type
   * ============================================================================
   */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <Header navigate={navigate} />

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <KeyMetrics
          recentInterviews={recentInterviews}
          trendData={trendData}
        />

        <ReadinessTrend trendData={trendData} />

        <InsightsView insights={trendData?.gpt_insights} />

        <ConfidenceDelivery recentInterviews={recentInterviews} />

        <KeywordTracking recentInterviews={recentInterviews} />

        <RadarSection radarData={radarData} />
      </div>
    </div>
  );
};

export default Dashboard;
