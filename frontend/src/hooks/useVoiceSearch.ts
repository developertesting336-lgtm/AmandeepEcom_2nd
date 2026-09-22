import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

// SpeechRecognition type declarations for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

interface UseVoiceSearchOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
}

export const useVoiceSearch = (options?: UseVoiceSearchOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultCallbackRef = useRef(options?.onResult);

  useEffect(() => {
    onResultCallbackRef.current = options?.onResult;
  }, [options?.onResult]);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    Boolean(
      (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
    );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Recognition might already be stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const msg = "Voice search is not supported in this browser. Please try Chrome, Edge, or Safari.";
      console.warn("❌ [VoiceSearch]", msg);
      toast.error(msg);
      setError(msg);
      return;
    }

    // If already active, stop
    if (isListening && recognitionRef.current) {
      stopListening();
      return;
    }

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition: SpeechRecognitionInstance = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = options?.lang || "en-US";

      recognition.onstart = () => {
        console.log("🎤 [VoiceSearch] Listening... Speak into your microphone now.");
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const speechResult = event.results[0]?.[0]?.transcript || "";
        console.log("🗣️ [VoiceSearch] Final Recognized Speech:", speechResult);
        setTranscript(speechResult);

        if (onResultCallbackRef.current && speechResult) {
          onResultCallbackRef.current(speechResult);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("⚠️ [VoiceSearch] Error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast.error("Microphone access blocked. Please allow microphone permissions.");
          setError("Microphone permission denied");
        } else if (event.error === "no-speech") {
          toast("No speech detected. Please try again.", { icon: "🎙️" });
          setError("No speech detected");
        } else if (event.error !== "aborted") {
          setError(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log("⏹️ [VoiceSearch] Stopped listening.");
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("❌ [VoiceSearch] Start failed:", err);
      setIsListening(false);
      setError(err?.message || "Failed to start speech recognition");
    }
  }, [isSupported, isListening, options?.lang, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
};

export default useVoiceSearch;
