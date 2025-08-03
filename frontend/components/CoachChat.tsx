"use client";

import { useState, useRef, useEffect } from "react";
import { getCoachResponse, ChatMessage } from "../chatbot/coach";
import { TextToSpeechButton } from "./voice/TextToSpeechButton";
import { SpeechToTextButton } from "./voice/SpeechToTextButton";

interface CoachChatProps {
  subject: string;
  userDisability: string;
  age: number;
  userName: string;
}

const CoachChat: React.FC<CoachChatProps> = ({ subject, userDisability, age, userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to send the initial message when the component loads
  useEffect(() => {
    const sendInitialMessage = async () => {
      setIsLoading(true);
      const initialSystemMessage: ChatMessage = {
        role: "system",
        content: `You are Professor Sparkle, an incredibly enthusiastic and friendly teacher. You are talking to a child named ${userName}, who is ${age} years old and has a disability profile of '${userDisability}'. Your current topic is ${subject}. Start the conversation by greeting ${userName} and asking an exciting, open-ended question about ${subject} to kick things off!`,
      };
      
      try {
        const response = await getCoachResponse([initialSystemMessage]);
        const coachGreeting: ChatMessage = { role: "assistant", content: response };
        setMessages([initialSystemMessage, coachGreeting]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          role: "assistant",
          content: "Oh dear! My connection to the idea-verse is a bit fuzzy. Let's try starting over! 📡",
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    sendInitialMessage();
  }, [subject, userDisability, age, userName]);

  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput("");
    setIsLoading(true);

    try {
      // We pass the entire history, including the initial system message
      const response = await getCoachResponse(currentMessages);
      const coachMessage: ChatMessage = { role: "assistant", content: response };
      setMessages((prev) => [...prev, coachMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Oh dear! My connection to the idea-verse is a bit fuzzy. Could you try again? 📡",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-black/40 backdrop-blur-lg rounded-2xl border border-purple-400/30 shadow-2xl flex flex-col h-[70vh]">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-t-2xl text-center text-white shadow-lg">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          🌟 Chat with Professor Sparkle! 🌟
          <TextToSpeechButton text="Chat with Professor Sparkle!" />
        </h2>
        <p className="text-sm text-purple-200 flex items-center justify-center gap-2">
          Your friendly learning coach for {subject}!
          <TextToSpeechButton text={`Your friendly learning coach for ${subject}!`} />
        </p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* We filter out the system message so it's not displayed in the chat UI */}
        {messages.filter(msg => msg.role !== 'system').map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-md p-4 rounded-2xl shadow-md ${
                msg.role === "user"
                  ? "bg-blue-500/80 text-white rounded-br-none"
                  : "bg-white/90 text-gray-800 rounded-bl-none"
              }`}
            >
              <div className="flex items-start gap-2">
                <p className="whitespace-pre-wrap flex-1">{msg.content}</p>
                {msg.role === "assistant" && (
                  <TextToSpeechButton text={msg.content} className="flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages.length > 1 && (
          <div className="flex justify-start">
            <div className="max-w-md p-4 rounded-2xl shadow-md bg-white/90 text-gray-800 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm">Professor Sparkle is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-purple-400/30">
        <div className="flex items-center bg-white/10 rounded-xl p-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask about anything! ✨"
            className="flex-1 bg-transparent text-white placeholder-white/60 focus:outline-none px-4 py-2"
            disabled={isLoading}
          />
          <SpeechToTextButton
            onTranscript={setInput}
            className="mx-2"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-6 py-2 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachChat;
