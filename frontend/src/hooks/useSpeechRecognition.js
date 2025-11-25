import { useState, useEffect, useRef } from 'react';

/**
 * useSpeechRecognition
 * ----------------------------------------------------------------------------
 * Minimal wrapper around the native Web Speech API.
 *
 * Provides:
 *  - Listening state
 *  - Final + interim transcripts
 *  - Error handling
 *  - Controls: start(), stop(), reset()
 *
 * Notes:
 *  - Automatically detects browser support
 *  - Uses continuous + interim recognition for real-time transcription
 */
const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  /** Initialize SpeechRecognition on mount */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Browser does not support speech recognition');
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript + ' ';
        } else {
          interimText += r[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => recognitionRef.current?.stop();
  }, []);

  /** Start recognition session */
  const startListening = () => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }

    try {
      setTranscript('');
      setInterimTranscript('');
      setError(null);

      recognitionRef.current?.start();
      setIsListening(true);
    } catch (err) {
      console.error('Start error:', err);
      setError(err.message);
    }
  };

  /** Stop current session */
  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      setIsListening(false);
    } catch (err) {
      console.error('Stop error:', err);
    }
  };

  /** Clear transcripts + errors */
  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
