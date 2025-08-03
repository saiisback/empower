"use client";

import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { Volume2, Square } from 'lucide-react';

interface TextToSpeechButtonProps {
  text: string;
  className?: string;
}

export const TextToSpeechButton = ({ text, className }: TextToSpeechButtonProps) => {
  const { isSpeaking, speak, cancel } = useTextToSpeech();

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent onClick events
    if (isSpeaking) {
      cancel();
    } else {
      speak(text);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      className={`p-2 rounded-full transition-colors duration-200 ${
        isSpeaking 
          ? 'bg-red-500 text-white' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } ${className}`}
      aria-label={isSpeaking ? 'Stop speaking' : 'Read text aloud'}
    >
      {isSpeaking ? <Square size={16} /> : <Volume2 size={16} />}
    </button>
  );
};
