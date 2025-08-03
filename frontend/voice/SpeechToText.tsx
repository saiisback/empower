"use client";
import React from 'react';
import { SpeechToTextButton } from '../components/voice/SpeechToTextButton';
import { TextToSpeechButton } from '../components/voice/TextToSpeechButton';

const SpeechToText = () => {
  const [transcript, setTranscript] = React.useState('');
  const [textToSpeak, setTextToSpeak] = React.useState('');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Voice Commands</h1>
      
      <div className="mb-4">
        <h2 className="text-xl">Speech to Text</h2>
        <SpeechToTextButton onTranscript={setTranscript} />
        <p className="mt-2">Transcript: {transcript}</p>
      </div>

      <div>
        <h2 className="text-xl">Text to Speech</h2>
        <input 
          type="text"
          value={textToSpeak}
          onChange={(e) => setTextToSpeak(e.target.value)}
          className="border p-2 mr-2"
        />
        <TextToSpeechButton text={textToSpeak} />
      </div>
    </div>
  );
};

export default SpeechToText;
