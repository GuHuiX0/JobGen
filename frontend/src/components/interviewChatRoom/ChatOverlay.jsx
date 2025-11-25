/**
 * ChatOverlay
 * ------------------------------------------------------------------
 * Core interactive interview interface used during live interview sessions.
 * Provides the full question–answer workflow with text, voice, timing, 
 * mic access, hints, and real-time AI assistant chat.
 *
 * Responsibilities:
 * - Fetch interview questions and manage question progression
 * - Provide input-mode selection (text / voice) with camera prompt
 * - Handle countdown timers, elapsed-time tracking, and auto-submit
 * - Record audio answers (MediaRecorder) and speech-to-text transcription
 * - Manage text answers with real-time updates
 * - Support AI assistant chat (hint requester + general guidance)
 * - Submit multi-question responses to backend; poll for feedback readiness
 * - Provide UI transitions, progress indicators, overflow handling
 * - Render immersive interview layout via GlassCard + RingTimer components
 *
 * Key Behaviors:
 * - Auto-scroll AI chat; assistant and user messages kept in synced state
 * - Auto-detect question text overflow with “Show full” toggle
 * - Auto-stop recording when user stops speaking
 * - Validate answers before allowing Next / Submit
 * - Convert recorded audio to Base64 before submission (WAV)
 * - Poll interviewAPI.getFeedback() until backend finishes processing
 *
 * Props:
 * - onExitInterview: callback to exit session and return to dashboard
 * - onCameraAutoStartChange: notify parent when user enables camera
 * - onLoadingChange: propagate loading state upward to parent container
 *
 * Important:
 * - This component owns the complete session state machine
 * - UI uses Tailwind + custom animation classes + GlassCard wrappers
 * - No business logic changed; this file only adds documentation
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { interviewAPI } from '../../services/api';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';

import GlassCard from './chatOverlay/GlassCard';
import RingTimer from './chatOverlay/RingTimer';
import InputModeModal from './chatOverlay/InputModeModal';
import CameraPromptModal from './chatOverlay/CameraPromptModal';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/** Helper function to convert blob to base64 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/** Helper function to wait for feedback to be ready */
const waitForFeedbackReady = async (interviewId) => {
  const MAX_ATTEMPTS = 60;
  const POLL_INTERVAL = 5000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await interviewAPI.getFeedback(interviewId);
      if (response.status === 'ready') return;
    } catch (error) {
      console.log(`Feedback not ready yet (attempt ${attempt + 1}), waiting...`);
    }
    await delay(POLL_INTERVAL);
  }

  throw new Error('Feedback processing timeout');
};

const ChatOverlay = ({ onExitInterview, onCameraAutoStartChange, onLoadingChange }) => {
  const navigate = useNavigate();
  const { interviewId } = useParams();
  const location = useLocation();
  const interviewData = location.state;

  /** State */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [cameraAutoStart, setCameraAutoStart] = useState(false);
  const [showQuestionDropdown, setShowQuestionDropdown] = useState(false);
  const [showInputModePrompt, setShowInputModePrompt] = useState(false);
  const [inputMode, setInputMode] = useState(null);
  const [hasCompletedRecording, setHasCompletedRecording] = useState(false);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);

  // question text overflow
  const questionTextRef = useRef(null);
  const [isQuestionTextOverflow, setIsQuestionTextOverflow] = useState(false);

  /** Chat area */
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Welcome! I provide hints only, not full answers. Ask me for guidance anytime.' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  /** Voice recognition */
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const current = questions[index];
  const total = current?.duration_seconds ?? 0;
  const [remain, setRemain] = useState(total);

  /** Progress */
  const progress = useMemo(() =>
    questions.length > 0 ? Math.round(((index + 1) / questions.length) * 100) : 0,
    [index, questions.length]
  );

  /** Auto-scroll chat */
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const pushAssistant = (text) =>
    setMessages((prev) => [...prev, { id: Date.now(), role: 'assistant', text }]);
  const pushUser = (text) =>
    setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'user', text }]);

  /** Fetch questions */
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!interviewId) {
        setError('No interview ID provided');
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }

      try {
        setLoading(true);
        if (onLoadingChange) onLoadingChange(true);

        const questionCount = interviewData?.question_count || 5;
        const data = await interviewAPI.getQuestions(interviewId, questionCount);

        setQuestions(data.items || []);

        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        pushAssistant('Error loading. Please refresh.');
      }
    };

    fetchQuestions();
  }, [interviewId, interviewData]);

  /** Reset timer when question changes */
  useEffect(() => {
    if (!started || !current) return;
    setRemain(current.duration_seconds);
    setQuestionStartTime(Date.now());
    setShowQuestionDropdown(false);

    if (index > 0) {
      setShowInputModePrompt(true);
    }
  }, [started, current, index]);

  /** Check overflow */
  useEffect(() => {
    if (!current || !started) {
      setIsQuestionTextOverflow(false);
      return;
    }

    const timer = setTimeout(() => {
      const questionText = current.question_text || current.text || '';
      const shouldShow = questionText.length > 100;

      if (questionTextRef.current) {
        const element = questionTextRef.current;
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
        const maxHeight = lineHeight * 2;

        const original = {
          display: element.style.display,
          clamp: element.style.webkitLineClamp,
          orient: element.style.webkitBoxOrient,
          overflow: element.style.overflow,
          maxHeight: element.style.maxHeight,
        };

        element.style.display = 'block';
        element.style.webkitLineClamp = 'none';
        element.style.webkitBoxOrient = 'unset';
        element.style.overflow = 'visible';
        element.style.maxHeight = 'none';

        const actualHeight = element.scrollHeight;

        Object.assign(element.style, original);

        setIsQuestionTextOverflow(shouldShow || actualHeight > maxHeight + 1);
      } else {
        setIsQuestionTextOverflow(shouldShow);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [current, index, started]);

  /** Countdown */
  useEffect(() => {
    if (!started || remain <= 0) return;

    const timer = setInterval(() => {
      setRemain((s) => {
        const newRemain = s - 1;
        if (newRemain <= 0) {
          handleTimeUp();
          return 0;
        }
        return newRemain;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, remain, index]);

  /** Time up */
  const handleTimeUp = () => {
    if (!current) return;

    const elapsed = current.duration_seconds;
    setAnswers((prev) => ({
      ...prev,
      [current.question_id]: {
        text: prev[current.question_id]?.text || '',
        inputMode: inputMode || 'text',
        elapsed_seconds: elapsed,
      },
    }));

    if (index < questions.length - 1) {
      pushAssistant("Time's up. Next question.");
      setTimeout(() => setIndex((i) => i + 1), 500);
    } else {
      pushAssistant("Time's up. Submitting...");
      setTimeout(() => handleAutoSubmit(), 1000);
    }
  };

  /** Manual next */
  const onNext = () => {
    if (!current) return;

    const currentAnswer = answers[current.question_id]?.text?.trim();
    const hasAnswer =
      inputMode === 'voice'
        ? hasCompletedRecording || !!currentAnswer
        : !!currentAnswer;

    if (!hasAnswer) {
      pushAssistant('Please provide an answer before moving to the next question.');
      return;
    }

    const elapsed = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : current.duration_seconds - remain;

    setAnswers((prev) => ({
      ...prev,
      [current.question_id]: {
        text: prev[current.question_id]?.text || '',
        inputMode: inputMode || 'text',
        elapsed_seconds: elapsed,
        ...(inputMode === 'voice' &&
          recordedAudio && {
            audioData: recordedAudio,
            audioMimeType: 'audio/wav',
          }),
      },
    }));

    setInputMode(null);
    setHasCompletedRecording(false);
    setIsRecording(false);
    setRecordedAudio(null);
    setIndex((i) => Math.min(questions.length - 1, i + 1));
  };

  /** Start interview */
  const onStart = () => {
    if (questions.length === 0) {
      pushAssistant('No questions. Refresh page.');
      return;
    }
    setStarted(true);
    setQuestionStartTime(Date.now());
    pushAssistant('Started. Use STAR structure.');
    setShowInputModePrompt(true);
  };
  /** Voice transcription → auto update answer */
  useEffect(() => {
    if (transcript && current) {
      updateAnswer((answers[current.question_id]?.text || '') + transcript);
      resetTranscript();
    }
  }, [transcript]);

  /** Detect completed voice */
  useEffect(() => {
    if (
      inputMode === 'voice' &&
      !isListening &&
      current &&
      !hasCompletedRecording &&
      !!answers[current.question_id]?.text?.trim()
    ) {
      setHasCompletedRecording(true);
    }
  }, [inputMode, isListening, current, answers, hasCompletedRecording]);

  /** Voice recording button */
  const onVoiceRecord = async () => {
    if (!isSupported) {
      pushAssistant('Speech recognition not supported in this browser.');
      return;
    }

    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          setRecordedAudio(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        setMediaRecorder(recorder);
        recorder.start();
        setIsRecording(true);
        startListening();

        pushAssistant('Recording... Speak now.');
      } catch (error) {
        pushAssistant('Could not access microphone. Please check permissions.');
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      stopListening();
      setIsRecording(false);
      setHasCompletedRecording(true);
      pushAssistant('Recording completed.');
    }
  };

  /** Submit */
  const handleSubmit = async () => {
    const currentAnswer = answers[current?.question_id]?.text?.trim();
    if (!currentAnswer) {
      pushAssistant('Please provide an answer before submitting.');
      return;
    }

    const elapsed = questionStartTime
      ? Math.floor((Date.now() - questionStartTime) / 1000)
      : current.duration_seconds - remain;

    const finalAnswers = {
      ...answers,
      [current.question_id]: {
        text: answers[current.question_id]?.text || '',
        inputMode: inputMode || 'text',
        elapsed_seconds: elapsed,
        ...(inputMode === 'voice' && recordedAudio && {
          audioData: recordedAudio,
          audioMimeType: 'audio/wav'
        })
      }
    };

    const unanswered = questions.filter(q => {
      const answer = finalAnswers[q.question_id];
      if (!answer) return true;

      if (answer.inputMode === 'text') {
        return !answer.text?.trim();
      }
      if (answer.inputMode === 'voice') {
        return false;
      }
      return true;
    });

    if (unanswered.length > 0) {
      pushAssistant(`${unanswered.length} unanswered question(s). Please provide answers or attempt voice recording for all questions before submitting.`);
      setSubmitting(false);
      return;
    }

    try {
      setSubmitting(true);
      pushAssistant('Submitting...');

      const responses = await Promise.all(
        questions.map(async q => {
          const answer = finalAnswers[q.question_id];
          const response = {
            question_id: q.question_id,
            text: answer?.text?.trim() || '',
            elapsed_seconds: answer?.elapsed_seconds || 0,
            input_mode: answer?.inputMode || 'text'
          };

          if (answer?.inputMode === 'voice') {
            if (answer?.audioData) {
              const base64Audio = await blobToBase64(answer.audioData);
              response.audio_data = base64Audio;
              response.audio_mime_type = answer.audioMimeType;
            } else {
              response.audio_data =
                'UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrDw66xXEQ9HvOvwuWoY';
              response.audio_mime_type = 'audio/wav';
            }
          }

          return response;
        })
      );

      const data = await interviewAPI.submitResponses(interviewId, responses);

      pushAssistant('✓ Submitted. Processing feedback...');

      await waitForFeedbackReady(interviewId);
      navigate(`/interview/${interviewId}/feedback`);
    } catch (err) {
      pushAssistant('Submit failed. Retry?');
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => handleSubmit();

  /** Ask for hint */
  const send = async () => {
    const content = input.trim();
    if (!content) return;

    pushUser(content);
    setInput('');

    if (content.toLowerCase().includes('hint') && current) {
      try {
        pushAssistant('Getting hint...');
        const data = await interviewAPI.getQuestionHint(
          interviewId,
          current.question_id,
          content
        );
        pushAssistant(data.hint || 'Try focusing on the STAR method: Situation, Task, Action, Result.');
      } catch {
        pushAssistant('Could not get hint. Suggestion: Use STAR structure - Situation → Task → Action → Result');
      }
    } else {
      pushAssistant('Ask me for a "hint" to get specific guidance on structuring your answer.');
    }
  };

  /** Update answer text */
  const updateAnswer = (text) => {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.question_id]: {
        text,
        inputMode: inputMode || 'text',
        elapsed_seconds: prev[current.question_id]?.elapsed_seconds || 0,
      },
    }));
  };

  /** Loading */
  if (loading) {
    return (
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
        <GlassCard className="p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
            <p className="text-white text-lg">Loading interview questions...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  /** Error */
  if (error) {
    return (
      <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
        <GlassCard className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold">Error Loading Interview</p>
            <p className="text-white/70 text-sm text-center">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl hover:scale-105 transition-all"
            >
              Retry
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  /** Camera Modal */
  const handleCameraYes = () => {
    setShowCameraPrompt(false);
    setCameraAutoStart(true);
    if (onCameraAutoStartChange) onCameraAutoStartChange(true);
  };

  const handleCameraNo = () => setShowCameraPrompt(false);

  const handleInputModeSelect = (mode) => {
    setInputMode(mode);
    setShowInputModePrompt(false);

    if (index === 0) {
      setTimeout(() => setShowCameraPrompt(true), 500);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0">

      {/* 输入方式选择弹窗 */}
      <InputModeModal
        visible={showInputModePrompt}
        onSelect={handleInputModeSelect}
      />

      {/* 摄像头弹窗 */}
      <CameraPromptModal
        visible={showCameraPrompt}
        onYes={handleCameraYes}
        onNo={handleCameraNo}
      />

      {/* Top-center title */}
      <div className="pointer-events-auto absolute top-8 left-1/2 -translate-x-1/2 z-20 select-none">
        <h1 className="font-orbitron text-white text-3xl md:text-4xl tracking-wider drop-shadow-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          Immersive AI Interview Space
        </h1>
      </div>

      {/* Top-left bar */}
      <div className="pointer-events-auto absolute top-6 left-6 z-50 flex items-center gap-3 animate-fadeIn">
        <button
          onClick={onExitInterview}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md border border-gray-200/80 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 text-gray-700 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Exit Interview</span>
        </button>

        <GlassCard className="px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/15 transition-all duration-300">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
          <span className="text-white text-xs font-medium tracking-wide">Online</span>
        </GlassCard>

        {started && current && (
          <GlassCard className="px-3 py-2 hover:bg-white/15 transition-all duration-300">
            <RingTimer total={total} remain={remain} />
          </GlassCard>
        )}
      </div>

      {/* Left panel */}
      <div className="pointer-events-auto absolute top-24 left-8 bottom-24 w-[520px] z-10 flex flex-col animate-slideInLeft">
        <GlassCard className="p-6 mb-4 hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-semibold text-sm">
              Question {index + 1} of {questions.length}
            </div>
            <div className="text-white/70 text-xs">{progress}% Complete</div>
          </div>

          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${progress}%` }}
            />
          </div>
        </GlassCard>

        <GlassCard className="flex-1 p-6 overflow-auto custom-scrollbar hover:bg-white/15 transition-all duration-300">
          {!started ? (
            /** Not started */
            <div className="h-full flex items-center justify-center text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white text-xl font-semibold">Interview Ready</p>
                <p className="text-white/70 text-sm">{questions.length} questions loaded</p>
                <button
                  className="mt-6 pointer-events-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl border border-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  onClick={onStart}
                >
                  Start Interview
                </button>
              </div>
            </div>
          ) : current && (
            /** Started view */
            <div className="h-full flex flex-col">
              
              {/* Question type */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold bg-emerald-400/20 px-3 py-1 rounded-full">
                  {current.question_type || current.type}
                </span>
              </div>

              {/* Question text */}
              <div className="relative mb-4">
                <h2
                  ref={questionTextRef}
                  className="text-white text-xl font-semibold leading-relaxed drop-shadow-lg transition-all duration-300"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: showQuestionDropdown ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: showQuestionDropdown ? 'visible' : 'hidden',
                    textOverflow: 'ellipsis',
                    maxHeight: showQuestionDropdown ? 'none' : '3.6em',
                  }}
                >
                  {current.question_text || current.text}
                </h2>

                {isQuestionTextOverflow && (
                  <button
                    onClick={() => setShowQuestionDropdown(!showQuestionDropdown)}
                    className="mt-2 flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                  >
                    <span>{showQuestionDropdown ? 'Show Less' : 'Show Full Question'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showQuestionDropdown ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Answer panel */}
              <div className="flex-1 flex flex-col min-h-0">

                {inputMode === 'text' && (
                  <>
                    <div className="flex-1 relative mb-3">
                      <textarea
                        value={answers[current.question_id]?.text || ''}
                        onChange={(e) => updateAnswer(e.target.value)}
                        placeholder="Type your answer here (suggested: STAR - Situation, Task, Action, Result)"
                        className="w-full h-full bg-white/10 border-2 border-white/20 rounded-2xl p-4 outline-none text-white placeholder-white/40 resize-none focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300 shadow-inner"
                        disabled={submitting}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-white/60">💡 Suggested: {current.duration_seconds}s</span>
                      <span className="text-white/60">
                        {(answers[current.question_id]?.text || '').length} characters
                      </span>
                    </div>
                  </>
                )}

                {inputMode === 'voice' && (
                  <>
                    <div className="flex-1 flex flex-col items-center justify-center mb-3">
                      <div className="text-center space-y-4">
                        <div>
                          <p className="text-white/80 font-medium">Voice Recording Mode</p>
                          <p className="text-white/60 text-sm">Click the microphone to start recording your answer</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center mb-3">
                      <button
                        onClick={onVoiceRecord}
                        disabled={submitting || !isSupported}
                        className={`pointer-events-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-4 shadow-xl ${
                          isRecording
                            ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-400 animate-pulse shadow-lg shadow-red-500/50'
                            : hasCompletedRecording
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-400 shadow-lg shadow-green-500/50'
                            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-emerald-400/50 hover:from-emerald-600 hover:to-cyan-600 hover:scale-110'
                        } active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isListening ? (
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="6" width="12" height="12" rx="2" />
                          </svg>
                        ) : (
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {isListening && (
                        <div className="text-center">
                          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-medium">
                            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                            Recording...
                          </div>
                        </div>
                      )}

                      {hasCompletedRecording && !isListening && (
                        <div className="text-center">
                          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recording completed
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <span className="text-white/60 text-xs">💡 Suggested: {current.duration_seconds}s</span>
                      </div>
                    </div>
                  </>
                )}

                {!inputMode && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-white/80 font-medium">Choose Input Method</p>
                      <p className="text-white/60 text-sm">Select how you'd like to answer this question</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-end pt-4 border-t border-white/20">
                {index < questions.length - 1 ? (
                  <button
                    className="pointer-events-auto px-6 py-2 rounded-xl border-2 border-white/30 text-white font-medium bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={onNext}
                    disabled={
                      submitting ||
                      !inputMode ||
                      (inputMode === 'text' && !answers[current?.question_id]?.text?.trim()) ||
                      (inputMode === 'voice' && !(hasCompletedRecording || answers[current?.question_id]?.text?.trim()))
                    }
                  >
                    <span>Next</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    className="pointer-events-auto px-8 py-2.5 rounded-xl border-2 border-emerald-400/50 text-white font-semibold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={submitting || !answers[current?.question_id]?.text?.trim() || !inputMode}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Submit</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Right chat panel */}
      <div className="pointer-events-auto absolute top-[272px] right-8 bottom-24 w-[450px] z-10 flex flex-col animate-slideInRight">

        <GlassCard className="flex-1 p-5 overflow-hidden hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <div className="text-white font-semibold">AI Assistant</div>
              <div className="text-white/60 text-xs">Real-time Guidance</div>
            </div>
          </div>

          <div ref={listRef} className="h-[calc(100%-5rem)] overflow-y-auto pr-2 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`mb-4 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] relative ${
                  m.role === 'user'
                    ? 'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white backdrop-blur-md border border-white/20'
                    : 'px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg bg-white/20 text-white/95 backdrop-blur-xl border border-white/30'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="h-4" />

        <GlassCard className="p-3 flex items-center gap-3 hover:bg-white/15 transition-all duration-300">
          <input
            className="flex-1 bg-white/10 outline-none text-white placeholder-white/50 px-4 py-3 rounded-xl border border-white/20 focus:border-emerald-400/50 focus:bg-white/15 transition-all duration-300"
            placeholder="Ask the assistant (e.g., outline my answer)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            disabled={submitting}
          />
          <button
            className="pointer-events-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 active:scale-95 text-white font-medium px-5 py-3 rounded-xl border border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={send}
            disabled={submitting}
          >
            Send
          </button>
        </GlassCard>
      </div>
    </div>
  );
};

export default ChatOverlay;
