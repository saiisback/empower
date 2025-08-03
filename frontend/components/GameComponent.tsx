"use client";

import { useState, useEffect, useCallback } from "react";

interface GameData {
  title: string;
  description: string;
  instructions: string;
  htmlCode: string;
  learningGoals?: string[];
  achievements?: string[];
  funFacts?: string[]; // Kept for consistency if LLM provides it
}

interface GameComponentProps {
  subject: string;
  userDisability: string;
  age: number;
}

const GameComponent: React.FC<GameComponentProps> = ({ subject, userDisability, age }) => {
  const [topic, setTopic] = useState("");
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // New state to track achievements unlocked within the iframe game
  const [completedAchievements, setCompletedAchievements] = useState<string[]>([]);

  // Callback to handle messages from the iframe
  const handleGameMessage = useCallback((event: MessageEvent) => {
    // Basic security check: you could enhance this to check event.origin
    // if your app is deployed to a specific domain.
    // For local dev, checking for data type is usually fine.
    
    const { type, payload } = event.data;

    if (type === 'achievement') {
      console.log('🏆 Achievement Unlocked:', payload.title);
      // Avoid adding duplicate achievements
      if (!completedAchievements.includes(payload.title)) {
        setCompletedAchievements(prev => [...prev, payload.title]);
      }
    } else if (type === 'scoreUpdate') {
      console.log('💯 Score Updated:', payload.score);
      // You could display this score in the UI if you add a state for it
    } else if (type === 'gameEnd') {
      console.log('🎉 Game Over! Final Score:', payload.finalScore);
      // You could show a "Game Complete" modal here
    }
  }, [completedAchievements]);


  // Effect to add/remove the event listener for iframe communication
  useEffect(() => {
    window.addEventListener("message", handleGameMessage);

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      window.removeEventListener("message", handleGameMessage);
    };
  }, [handleGameMessage]);


  const fetchGame = async () => {
    if (!topic) {
      setError("Please enter a topic to create a game!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGameData(null);
    setCompletedAchievements([]); // Reset achievements for new game

    try {
      const response = await fetch("http://127.0.0.1:8000/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: age,
          disability: userDisability,
          subject: subject,
          topic: topic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Professor Sparkle's game workshop is busy. Please try again!");
      }

      const data = await response.json();
      setGameData(data);
      setShowInstructions(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = () => {
    setShowInstructions(false);
  };

  const handleBackToMenu = () => {
    setGameData(null);
    setTopic('');
    setError(null);
    setCompletedAchievements([]);
    setShowInstructions(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* ... The input form section is unchanged and looks great ... */}
      {!gameData && (
         <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <h2 className="text-4xl font-bold text-white mb-2">🌟 Ultra-Premium Game Creator!</h2>
          <p className="text-blue-200 mb-6 text-xl">What amazing topic should we turn into a game? 🎪</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full sm:w-2/3 p-6 bg-white/10 border-2 border-purple-400 rounded-xl focus:border-yellow-400 focus:outline-none text-white text-xl placeholder-white/50 backdrop-blur-sm"
              placeholder="🌱 Plants, 🚀 Space, 🦖 Dinosaurs..."
            />
            <button
              onClick={fetchGame}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-400 to-pink-600 text-white py-6 px-10 rounded-xl text-2xl font-bold hover:from-purple-300 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              {isLoading ? "🎪 Creating Magic..." : "🚀 Create Game!"}
            </button>
          </div>
        </div>
      )}

      {/* ... The loading and error sections are also unchanged ... */}
       {isLoading && (
        <div className="text-center p-8 bg-black/30 backdrop-blur-lg rounded-2xl mt-6">
          <div className="text-8xl animate-spin mb-4">🎪</div>
          <p className="text-3xl text-yellow-300 font-bold animate-pulse">✨ Professor Sparkle is creating your ultra-premium game...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border-2 border-red-500 text-white p-6 rounded-2xl mt-6 text-center">
          <p className="text-4xl mb-2">😟</p>
          <p className="font-bold text-2xl text-red-300">Game Creation Mishap!</p>
          <p className="text-red-200">{error}</p>
        </div>
      )}


      {gameData && showInstructions && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 mt-6 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent mb-4">
              {gameData.title}
            </h2>
            <p className="text-blue-200 text-xl">{gameData.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-400/30">
              <h3 className="text-3xl font-bold text-green-300 mb-4 flex items-center">
                <span className="text-4xl mr-3">🎯</span> You'll Learn
              </h3>
              <ul className="space-y-3">
                {(gameData.learningGoals || []).map((objective, index) => (
                  <li key={index} className="text-green-100 flex items-start text-lg">
                    <span className="text-green-400 mr-3 text-2xl">✨</span>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 rounded-xl border border-yellow-400/30">
              <h3 className="text-3xl font-bold text-yellow-300 mb-4 flex items-center">
                <span className="text-4xl mr-3">🎮</span> How to Play
              </h3>
              <p className="text-yellow-100 leading-relaxed text-xl">{gameData.instructions}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-6 rounded-xl border border-purple-400/30 mb-8">
            <h3 className="text-3xl font-bold text-purple-300 mb-4 flex items-center">
              <span className="text-4xl mr-3">🏆</span> Win These!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(gameData.achievements || []).map((achievement, index) => (
                <div key={index} className={`bg-purple-500/30 text-purple-100 px-6 py-4 rounded-full text-center text-lg font-bold transition-all duration-500 ${completedAchievements.includes(achievement) ? 'bg-yellow-400/50 text-yellow-100 ring-2 ring-yellow-300' : 'opacity-60'}`}>
                  {achievement}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-6">
            <button
              onClick={handleStartGame}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-12 py-6 rounded-xl text-3xl font-bold hover:from-emerald-400 hover:to-green-500 transition-all duration-300 transform hover:scale-110 shadow-2xl animate-pulse"
            >
              🎮 LET'S PLAY!
            </button>
            <button
              onClick={handleBackToMenu}
              className="bg-gray-600/80 text-white px-8 py-6 rounded-xl text-xl hover:bg-gray-500/80 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {gameData && !showInstructions && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-4 mt-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4 p-2">
            <div>
                 <h2 className="text-2xl font-bold text-white">{gameData.title}</h2>
                 <div className="flex flex-wrap gap-2 mt-2">
                    {(gameData.achievements || []).map(ach => (
                        <span key={ach} className={`text-xs px-3 py-1 rounded-full transition-all duration-500 ${completedAchievements.includes(ach) ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                           {ach}
                        </span>
                    ))}
                 </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowInstructions(true)}
                className="bg-blue-600/80 text-white px-4 py-2 rounded-lg hover:bg-blue-500/80 transition-colors"
              >
                📖 Instructions
              </button>
              <button
                onClick={handleBackToMenu}
                className="bg-gray-600/80 text-white px-4 py-2 rounded-lg hover:bg-gray-500/80 transition-colors"
              >
                🏠 Menu
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-2xl border-4 border-yellow-400">
            <iframe
              key={topic} // Adding a key ensures the iframe re-mounts for a new game
              srcDoc={gameData.htmlCode}
              className="w-full h-[75vh] border-0"
              title="Ultra-Premium Learning Game"
              sandbox="allow-scripts allow-same-origin" // allow-same-origin is needed for postMessage
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameComponent;