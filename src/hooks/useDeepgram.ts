import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";

const MEDIA_RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

function pickSupportedMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }

  for (const mimeType of MEDIA_RECORDER_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

function getEncodingForMimeType(mimeType: string): string | null {
  if (mimeType.includes("opus")) {
    return "opus";
  }

  if (mimeType.includes("webm") || mimeType.includes("ogg")) {
    return "opus";
  }

  if (mimeType.includes("mp4")) {
    return "aac";
  }

  return null;
}

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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const apiKeyRef = useRef<string | null>(null);

  const stopMediaStream = useCallback(() => {
    if (!mediaStreamRef.current) return;
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

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

      const mimeType = pickSupportedMimeType();
      if (!mimeType) {
        throw new Error("No supported audio MIME type for MediaRecorder.");
      }

      const encoding = getEncodingForMimeType(mimeType);
      if (!encoding) {
        throw new Error(`Unsupported MediaRecorder MIME type: ${mimeType}`);
      }

      // Get microphone access
      console.log("[Deepgram] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Deepgram] Microphone access granted");
      mediaStreamRef.current = stream;

      const trackSettings = stream.getAudioTracks()[0]?.getSettings?.();
      const sampleRate = trackSettings?.sampleRate;
      const channels = trackSettings?.channelCount;

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
        encoding,
        ...(typeof sampleRate === "number" ? { sample_rate: sampleRate } : {}),
        ...(typeof channels === "number" ? { channels } : {}),
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
        console.log("[Deepgram] Transcript received:", JSON.stringify(data, null, 2));
        // Try different paths based on SDK version
        const transcript =
          data.channel?.alternatives?.[0]?.transcript ||
          data.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
          data.transcript;
        console.log("[Deepgram] Extracted transcript:", transcript);
        if (transcript && transcript.trim()) {
          const isFinal = data.is_final ?? false;
          console.log("[Deepgram] Valid transcript:", transcript, "isFinal:", isFinal);
          onTranscript?.(transcript, isFinal);
        } else {
          console.log("[Deepgram] No valid transcript text found in data");
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

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
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

      mediaRecorder.onstop = () => {
        console.log("[Deepgram] MediaRecorder stopped");
        stopMediaStream();
        mediaRecorderRef.current = null;

        if (deepgramRef.current === connection) {
          connection.requestClose();
          deepgramRef.current = null;
          console.log("[Deepgram] Connection close requested");
        }
      };

      const waitForOpen = () =>
        new Promise<void>((resolve, reject) => {
          if (connection.getReadyState() === 1) {
            resolve();
            return;
          }

          const timeoutId = setTimeout(() => {
            reject(new Error("Deepgram connection timed out"));
          }, 10000);

          connection.once(LiveTranscriptionEvents.Open, () => {
            clearTimeout(timeoutId);
            resolve();
          });

          connection.once(LiveTranscriptionEvents.Error, (error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
        });

      await waitForOpen();

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
      stopMediaStream();
      if (deepgramRef.current) {
        deepgramRef.current.disconnect();
        deepgramRef.current = null;
      }
      mediaRecorderRef.current = null;
      setIsListening(false);
      setIsLoading(false);
    }
  }, [isListening, language, onTranscript, onError, fetchApiKey, stopMediaStream]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log("[Deepgram] stopListening called");
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    } else {
      stopMediaStream();

      if (deepgramRef.current) {
        deepgramRef.current.requestClose();
        deepgramRef.current = null;
        console.log("[Deepgram] Connection close requested");
      }
    }

    setIsListening(false);
  }, [stopMediaStream]);

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
