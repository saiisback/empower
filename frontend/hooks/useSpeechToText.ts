"use client";

import { useState, useRef } from 'react';

export const useSpeechToText = (onTranscript: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startListening = async () => {
    try {
      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        // Fallback to browser Speech Recognition
        return startBrowserSpeechRecognition();
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Send to Groq API
        await transcribeAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      setIsListening(true);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Fallback to browser Speech Recognition
      startBrowserSpeechRecognition();
    }
  };

  const startBrowserSpeechRecognition = () => {
    try {
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          onTranscript('Sorry, speech recognition failed. Please try typing instead.');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onTranscript(transcript);
        };
        
        recognition.start();
      } else {
        onTranscript('Speech recognition not supported. Please type your message.');
      }
    } catch (error) {
      console.error('Browser speech recognition error:', error);
      onTranscript('Speech recognition not available. Please type your message.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Call our backend API endpoint that handles Groq transcription
      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      onTranscript(result.transcript || '');
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      onTranscript('Sorry, could not transcribe audio. Please try again or type your message.');
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    isListening, 
    isProcessing, 
    startListening, 
    stopListening 
  };
};
