import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";

export interface UseDeepgramOptions {
  language?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useDeepgram({ language = "en-US", onTranscript, onError }: UseDeepgramOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const deepgramRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const apiKeyRef = useRef<string | null>(null);

  // Fetch Deepgram API key from our backend
  const fetchApiKey = useCallback(async () => {
    try {
      const response = await fetch("/api/deepgram");
      if (!response.ok) {
        throw new Error("Failed to fetch Deepgram API key");
      }
      const data = await response.json();
      apiKeyRef.current = data.apiKey;
      return data.apiKey;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize Deepgram";
      onError?.(message);
      throw err;
    }
  }, [onError]);

  // Start listening
  const startListening = useCallback(async () => {
    if (isListening) return;

    setIsLoading(true);

    try {
      // Get API key if we don't have it
      const apiKey = apiKeyRef.current || (await fetchApiKey());

      // Create Deepgram client
      const deepgram = createClient(apiKey);

      // Setup live transcription connection
      const connection = deepgram.listen.live({
        model: "nova-2",
        language,
        smart_format: true,
        punctuate: true,
        interim_results: true,
        endpointing: 300, // Auto-stop after 300ms of silence
      });

      deepgramRef.current = connection;

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          const isFinal = data.is_final ?? false;
          onTranscript?.(transcript, isFinal);
        }
      });

      // Handle errors
      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error("Deepgram error:", error);
        onError?.("Transcription error occurred");
      });

      // Handle connection close
      connection.on(LiveTranscriptionEvents.Close, () => {
        setIsListening(false);
      });

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      // Send audio data to Deepgram
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          connection.send(event.data);
        }
      };

      // Start recording in small chunks (100ms)
      mediaRecorder.start(100);

      setIsListening(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to start listening:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to start voice input";
      onError?.(message);
      setIsListening(false);
      setIsLoading(false);
    }
  }, [isListening, language, onTranscript, onError, fetchApiKey]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    if (deepgramRef.current) {
      deepgramRef.current.finish();
      deepgramRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isLoading,
    startListening,
    stopListening,
  };
}
