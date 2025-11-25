/**
 * Application Router
 * ============================================================================
 * Defines all top-level routes for the application using React Router v6.
 *
 * Responsibilities:
 * - Map page components to SPA routes
 * - Apply layout wrappers (with header / no header)
 * - Provide a clean separation between normal navigation and immersive sessions
 * - Ensure predictable routing and consistent UX across features
 *
 * Structure:
 * - WithHeaderLayout → Standard pages (Landing, Interview Type, Dashboard, Feedback)
 * - BareLayout       → Immersive, full-screen interview sessions
 * - Fallback routing → Redirect unknown paths to landing
 * ============================================================================
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import WithHeaderLayout from "./components/layout/WithHeaderLayout";
import BareLayout from "./components/layout/BareLayout";

// Views
import Landing from './pages/Landing';
import InterviewType from './pages/InterviewType';
import InterviewChatRoom from './pages/InterviewChatRoom';
import FeedbackPage from './pages/FeedbackPage';
import Dashboard from './pages/Dashboard/Dashboard';

function App() {
  return (
    <Routes>

      {/**
       * Standard Application Routes
       * ----------------------------------------------------------------------
       * Wrapped with <WithHeaderLayout />, which provides:
       *  - Global navigation header
       *  - Consistent app frame for non-immersive pages
       *
       * Includes:
       *  - Landing page
       *  - Interview type selection
       *  - Dashboard analytics
       *  - Feedback summary pages
       * ----------------------------------------------------------------------
       */}
      <Route element={<WithHeaderLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/interview" element={<InterviewType />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/interview/:interviewId/feedback"
          element={<FeedbackPage />}
        />
      </Route>

      {/**
       * Immersive Interview Route
       * ----------------------------------------------------------------------
       * Wrapped with <BareLayout />:
       *  - No header or navigation controls
       *  - Designed for focused, full-screen interview experience
       *
       * Route:
       *  - /interview/:interviewId → Live interview chat room
       * ----------------------------------------------------------------------
       */}
      <Route element={<BareLayout />}>
        <Route
          path="/interview/:interviewId"
          element={<InterviewChatRoom />}
        />
      </Route>

      {/**
       * Fallback / 404 Handling
       * ----------------------------------------------------------------------
       * Any unknown route redirects to the Landing page.
       * Ensures users never encounter an undefined view.
       * ----------------------------------------------------------------------
       */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;
