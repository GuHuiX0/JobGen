/**
 * Feedback Components Barrel
 * -------------------------------------------------------------
 * This file centralizes and re-exports all Feedback-related UI
 * components, allowing cleaner and shorter imports throughout
 * the application.
 *
 * Purpose:
 * - Improve maintainability by grouping related components
 * - Provide a single import source for the Feedback module
 * - Keep folder structure organized and scalable for future growth
 *
 * Usage Example:
 *   import { LoadingScreen, QuestionCard } from "@/components/feedback";
 *
 * No logic is contained in this file; it simply re-exports modules.
 */

export { default as LoadingScreen } from "./LoadingScreen";
export { default as ErrorScreen } from "./ErrorScreen";
export { default as HeaderSection } from "./HeaderSection";
export { default as OverallScoreCard } from "./OverallScoreCard";
export { default as SummarySection } from "./SummarySection";
export { default as QuestionCard } from "./QuestionCard";
