"use client";

import { useSpeechToText } from '../../hooks/useSpeechToText';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface SpeechToTextButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

export const SpeechToTextButton = ({ onTranscript, className }: SpeechToTextButtonProps) => {
  const { isListening, isProcessing, startListening, stopListening } = useSpeechToText(onTranscript);

  const handleToggleListening = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else if (!isProcessing) {
      startListening();
    }
  };

  const getButtonContent = () => {
    if (isProcessing) {
      return <Loader2 size={16} className="animate-spin" />;
    }
    return isListening ? <MicOff size={16} /> : <Mic size={16} />;
  };

  const getButtonColor = () => {
    if (isProcessing) {
      return 'bg-yellow-500 text-white';
    }
    return isListening 
      ? 'bg-red-500 text-white' 
      : 'bg-green-500 text-white hover:bg-green-600';
  };

  const getAriaLabel = () => {
    if (isProcessing) {
      return 'Processing audio';
    }
    return isListening ? 'Stop listening' : 'Start voice input';
  };

  return (
    <button
      onClick={handleToggleListening}
      disabled={isProcessing}
      className={`p-2 rounded-full transition-colors duration-200 ${getButtonColor()} ${className}`}
      aria-label={getAriaLabel()}
    >
      {getButtonContent()}
    </button>
  );
};
