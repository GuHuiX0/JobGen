import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

import {
  TypeSelect,
  WhatYouGet,
  SampleQuestions,
  PracticeTips,
  CTASection
} from "../components/interviewType";

import { INTERVIEW_TYPES } from '../services/interviewApi';
import { interviewAPI } from '../services/api';

/**
 * Static card definitions for rendering type selections.
 * Keys must correspond to entries in INTERVIEW_TYPES.
 */
const TYPE_CARDS = [
    { key: 'behavioral', title: 'Behavioral', desc: 'Focus on past behavior, collaboration, conflict resolution, and STAR-style answers.', color: 'green' },
    { key: 'technical', title: 'Technical', desc: 'Assess algorithms, data structures, troubleshooting, and system design fundamentals.', color: 'blue' },
    { key: 'psychometric', title: 'Psychometric', desc: 'Evaluate logical thinking, decision styles, and situational judgement tendencies.', color: 'purple' },
];

const FEATURE_HIGHLIGHTS = [
    { Icon: AccessTimeFilledIcon, text: 'Structured prompts & timers' },
    { Icon: AutoAwesomeIcon, text: 'STAR highlighting' },
    { Icon: ChatRoundedIcon, text: 'Immediate feedback' },
];

/**
 * ============================================================================
 * InterviewType Page
 * ----------------------------------------------------------------------------
 * Allows users to configure their interview session before entering the chat:
 *
 * Features:
 * - Select interview type (behavioral / technical / psychometric)
 * - Choose number of questions (3–10)
 * - Add optional job context (job name + job description)
 * - Create interview session using backend API
 * - Keyboard accessibility (arrow navigation + Enter)
 *
 * UX Goals:
 * - Smooth selection workflow
 * - Clear feedback on errors or loading
 * - Flexible configuration before entering interview flow
 * ============================================================================
 */
export default function InterviewType() {
    const navigate = useNavigate();

    /** ------------------------------ State ------------------------------ */

    /** Currently selected interview type (string or null) */
    const [selected, setSelected] = useState(null);

    /** API creation status */
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    /** Optional job context */
    const [jobName, setJobName] = useState('');
    const [jobDescription, setJobDescription] = useState('');

    /** Number of interview questions */
    const [questionCount, setQuestionCount] = useState(5);

    /** Filter cards to only show supported types */
    const typeCards = TYPE_CARDS.filter(card => INTERVIEW_TYPES.includes(card.key));

    /** Index of currently selected type for arrow-key navigation */
    const index = useMemo(
        () => typeCards.findIndex(c => c.key === selected),
        [selected, typeCards]
    );

    /**
     * ============================================================================
     * Keyboard Navigation
     * ----------------------------------------------------------------------------
     * Enables:
     *   • ArrowRight → move to next card
     *   • ArrowLeft  → move to previous card
     *   • Enter      → continue (if type is selected)
     *
     * Provides a keyboard-friendly UX alternative to clicking.
     * ============================================================================
     */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') {
                const next = index < 0 ? 0 : Math.min(index + 1, typeCards.length - 1);
                setSelected(typeCards[next].key);
            } else if (e.key === 'ArrowLeft') {
                const prev = index < 0 ? 0 : Math.max(index - 1, 0);
                setSelected(typeCards[prev].key);
            } else if (e.key === 'Enter' && selected) {
                handleContinue();
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [index, selected, typeCards]);

    /**
     * ============================================================================
     * Create Interview Session
     * ----------------------------------------------------------------------------
     * Sends configuration payload to /interviews and redirects user into:
     *   /interview/:interview_id
     *
     * Includes:
     * - Type
     * - Question count
     * - Optional job context
     * - Default duration per question
     *
     * Handles:
     * - Loading state
     * - Error display
     * - Navigation into chat room
     * ============================================================================
     */
    const handleContinue = useCallback(async () => {
        if (!selected || creating) return;

        try {
            setCreateError('');
            setCreating(true);

            const payload = {
                type: selected,
                duration_seconds: 180, // default per-question timer
                question_count: questionCount,
                job_name: jobName,
                job_description: jobDescription,
            };

            const res = await interviewAPI.createInterview(payload);

            navigate(`/interview/${res.interview_id}`, { state: res });
        } catch (e) {
            setCreateError(e?.message || 'Failed to create interview');
        } finally {
            setCreating(false);
        }
    }, [selected, creating, navigate, jobName, jobDescription, questionCount]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">

            {/* ------------------------------------------------------------------
               Header
               Shows: Badge + Title + Features list
            ------------------------------------------------------------------ */}
            <div className="border-b border-gray-200/80 bg-white/80 backdrop-blur">
                <div className="mt-16 max-w-7xl mx-auto px-6 py-8 flex flex-col gap-3">
                    <div>
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold tracking-widest text-indigo-600 bg-indigo-100/80 rounded-full uppercase mb-3">
                            Interview type
                        </span>

                        <h1 className="text-4xl font-light text-gray-900 mb-2">
                            Select Interview Type
                        </h1>
                        <p className="text-gray-500">
                            Choose a path to get tailored questions and structured feedback.
                        </p>
                    </div>

                    <ul className="mt-4 grid sm:grid-cols-3 gap-3 text-sm sm:text-base text-gray-900 font-semibold">
                        {FEATURE_HIGHLIGHTS.map(({ Icon, text }) => (
                            <li key={text} className="rounded-xl border border-white/60 bg-white/60 backdrop-blur-md px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-indigo-500">
                                        <Icon fontSize="small" />
                                    </span>
                                    <span>{text}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* ------------------------------------------------------------------
               Main Content
            ------------------------------------------------------------------ */}
            <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">

                {/* Type Selection Grid */}
                <TypeSelect
                    typeCards={typeCards}
                    selected={selected}
                    onSelect={setSelected}
                />

                {/* Question Count Selector */}
                {selected && (
                    <div className="mt-6 flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/80 px-6 py-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">🔢</span>
                            <div>
                                <label className="text-sm font-medium text-gray-900">
                                    Number of Questions
                                </label>
                                <p className="text-xs text-gray-500">Choose 3–10 questions</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {[3, 5, 8, 10].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setQuestionCount(num)}
                                    className={`w-10 h-10 text-sm font-semibold rounded-lg border-2 transition-all ${
                                        questionCount === num
                                            ? 'bg-indigo-500 text-white border-indigo-500 scale-110'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:scale-105'
                                    }`}
                                >
                                    {num}
                                </button>
                            ))}

                            <div className="w-px h-8 bg-gray-300 mx-1" />

                            <input
                                type="number"
                                min="3"
                                max="10"
                                value={questionCount}
                                onChange={(e) =>
                                    setQuestionCount(
                                        Math.max(3, Math.min(10, parseInt(e.target.value) || 3))
                                    )
                                }
                                className="w-16 px-3 py-2 text-center text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* CTA Buttons: Skip / Continue */}
                <CTASection
                    selected={selected}
                    onSkip={() => setSelected(null)}
                    onContinue={handleContinue}
                    loading={creating}
                    error={createError}
                />

                {/* Sample Questions Section */}
                <div>
                    <h2 className="text-2xl font-light text-gray-900 mb-6">
                        Sample Questions
                    </h2>
                    <SampleQuestions />
                </div>

                {/* Supplemental Sections (What You Get + Tips) */}
                <div className="grid md:grid-cols-2 gap-6">
                    <WhatYouGet />
                    <PracticeTips />
                </div>
            </div>
        </div>
    );
}