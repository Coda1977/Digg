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
    console.log("[Deepgram] Fetching API key...");
    try {
      const response = await fetch("/api/deepgram");
      console.log("[Deepgram] API response status:", response.status);
      if (!response.ok) {
        const text = await response.text();
        console.error("[Deepgram] API error response:", text);
        throw new Error("Failed to fetch Deepgram API key");
      }
      const data = await response.json();
      console.log("[Deepgram] API key received:", data.apiKey ? "✓ (key present)" : "✗ (no key)");
      apiKeyRef.current = data.apiKey;
      return data.apiKey;
    } catch (err) {
      console.error("[Deepgram] fetchApiKey error:", err);
      const message = err instanceof Error ? err.message : "Failed to initialize Deepgram";
      onError?.(message);
      throw err;
    }
  }, [onError]);

  // Start listening
  const startListening = useCallback(async () => {
    console.log("[Deepgram] startListening called, isListening:", isListening);
    if (isListening) return;

    setIsLoading(true);

    try {
      // Get API key if we don't have it
      const apiKey = apiKeyRef.current || (await fetchApiKey());
      console.log("[Deepgram] Got API key, creating client...");

      // Create Deepgram client
      const deepgram = createClient(apiKey);

      // Setup live transcription connection
      console.log("[Deepgram] Setting up live transcription connection...");
      const connection = deepgram.listen.live({
        model: "nova-2",
        language,
        smart_format: true,
        punctuate: true,
        interim_results: true,
        endpointing: 300, // Auto-stop after 300ms of silence
      });

      deepgramRef.current = connection;

      // Handle connection open
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("[Deepgram] Connection opened");
      });

      // Handle metadata (contains model info, request_id, etc.)
      connection.on(LiveTranscriptionEvents.Metadata, (data) => {
        console.log("[Deepgram] Metadata received:", data);
      });

      // Handle transcription results
      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        console.log("[Deepgram] Transcript received:", data);
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          const isFinal = data.is_final ?? false;
          console.log("[Deepgram] Valid transcript:", transcript, "isFinal:", isFinal);
          onTranscript?.(transcript, isFinal);
        }
      });

      // Handle errors
      connection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error("[Deepgram] Connection error:", error);
        onError?.("Transcription error occurred");
      });

      // Handle connection close with reason
      connection.on(LiveTranscriptionEvents.Close, (event) => {
        console.log("[Deepgram] Connection closed, event:", event);
        setIsListening(false);
      });

      // Get microphone access
      console.log("[Deepgram] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Deepgram] Microphone access granted");

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      console.log("[Deepgram] MediaRecorder created with mimeType:", mediaRecorder.mimeType);

      mediaRecorderRef.current = mediaRecorder;

      // Send audio data to Deepgram
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && connection.getReadyState() === 1) {
          console.log("[Deepgram] Sending audio chunk, size:", event.data.size);
          connection.send(event.data);
        }
      };

      // Start recording in small chunks (100ms)
      mediaRecorder.start(100);
      console.log("[Deepgram] MediaRecorder started");

      setIsListening(true);
      setIsLoading(false);
      console.log("[Deepgram] Voice input active");
    } catch (err) {
      console.error("[Deepgram] Failed to start listening:", err);
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
    console.log("[Deepgram] stopListening called");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      console.log("[Deepgram] MediaRecorder stopped");
    }

    if (deepgramRef.current) {
      deepgramRef.current.finish();
      deepgramRef.current = null;
      console.log("[Deepgram] Connection finished");
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
