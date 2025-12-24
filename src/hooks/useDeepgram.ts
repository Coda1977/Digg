import { useCallback, useEffect, useRef, useState } from "react";
import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";

const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

type WebkitAudioContext = typeof AudioContext & { new (): AudioContext };

function createAudioContext(): AudioContext {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: WebkitAudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error("AudioContext not supported in this browser.");
  }

  return new AudioContextConstructor();
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);

  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return output;
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
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const apiKeyRef = useRef<string | null>(null);

  const stopMediaStream = useCallback(() => {
    if (!mediaStreamRef.current) return;
    mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const stopAudioProcessing = useCallback(() => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
      audioProcessorRef.current.onaudioprocess = null;
      audioProcessorRef.current = null;
    }

    if (audioSourceRef.current) {
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }

    if (audioGainRef.current) {
      audioGainRef.current.disconnect();
      audioGainRef.current = null;
    }

    if (audioContextRef.current) {
      const context = audioContextRef.current;
      audioContextRef.current = null;
      context.close().catch(() => {});
    }
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

      // Get microphone access
      console.log("[Deepgram] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("[Deepgram] Microphone access granted");
      mediaStreamRef.current = stream;

      const audioContext = createAudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      audioSourceRef.current = source;

      const processor = audioContext.createScriptProcessor(
        SCRIPT_PROCESSOR_BUFFER_SIZE,
        1,
        1
      );
      audioProcessorRef.current = processor;

      const gain = audioContext.createGain();
      gain.gain.value = 0;
      audioGainRef.current = gain;

      const sampleRate = audioContext.sampleRate;

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
        encoding: "linear16",
        sample_rate: sampleRate,
        channels: 1,
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
        stopAudioProcessing();
        stopMediaStream();
        setIsListening(false);
        setIsLoading(false);
      });

      processor.onaudioprocess = (event) => {
        if (connection.getReadyState() !== 1) {
          return;
        }

        const input = event.inputBuffer.getChannelData(0);
        const pcm = floatTo16BitPCM(input);
        connection.send(pcm.buffer);
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

      source.connect(processor);
      processor.connect(gain);
      gain.connect(audioContext.destination);

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

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
      stopAudioProcessing();
      stopMediaStream();
      if (deepgramRef.current) {
        deepgramRef.current.disconnect();
        deepgramRef.current = null;
      }
      setIsListening(false);
      setIsLoading(false);
    }
  }, [
    isListening,
    language,
    onTranscript,
    onError,
    fetchApiKey,
    stopAudioProcessing,
    stopMediaStream,
  ]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log("[Deepgram] stopListening called");
    stopAudioProcessing();
    stopMediaStream();

    if (deepgramRef.current) {
      deepgramRef.current.requestClose();
      deepgramRef.current = null;
      console.log("[Deepgram] Connection close requested");
    }

    setIsListening(false);
    setIsLoading(false);
  }, [stopAudioProcessing, stopMediaStream]);

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
