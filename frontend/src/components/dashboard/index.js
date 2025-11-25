/**
 * Dashboard Components Barrel
 * -------------------------------------------------------------
 * Centralized export file for all Dashboard-related UI components.
 *
 * Benefits:
 * - Cleaner imports across the app
 * - Easier maintenance and scalability
 * - Provides a single entry point for the Dashboard module
 *
 * Example:
 *   import { Header, ReadinessTrend } from "@/components/dashboard";
 */

export { default as Header } from "./Header";
export { default as KeyMetrics } from "./KeyMetrics";
export { default as ReadinessTrend } from "./ReadinessTrend";
export { default as ConfidenceDelivery } from "./ConfidenceDelivery";
export { default as KeywordTracking } from "./KeywordTracking";
export { default as RadarSection } from "./RadarSection";

export { default as LoadingView } from "./LoadingView";
export { default as ErrorView } from "./ErrorView";
export { default as InsightsView } from "./InsightsView";
