"use client";

import { useState } from "react";

interface LearningContent {
  title: string;
  content: string;
  achievement_unlocked: string;
  fun_fact: string;
}

interface LearningComponentProps {
  subject: string;
  userDisability: string;
  age: number;
}

const LearningComponent: React.FC<LearningComponentProps> = ({ subject, userDisability, age }) => {
  const [topic, setTopic] = useState("");
  const [learningContent, setLearningContent] = useState<LearningContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningContent = async () => {
    if (!topic) {
        setError("Please enter a topic to explore!");
        return;
    }

    setIsLoading(true);
    setError(null);
    setLearningContent(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/explain", {
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
        throw new Error(errorData.detail || "Professor Sparkle is busy polishing his spells. Please try again!");
      }

      const data = await response.json();
      setLearningContent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!learningContent && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
          <div className="text-5xl mb-4">📖</div>
          <h2 className="text-3xl font-bold text-white mb-2">What magical {subject} topic do you wish to explore?</h2>
          <p className="text-blue-200 mb-6">Enter a topic below and Professor Sparkle will conjure up an explanation!</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full sm:w-2/3 p-4 bg-white/10 border-2 border-purple-400 rounded-xl focus:border-yellow-400 focus:outline-none text-white text-lg placeholder-white/50 backdrop-blur-sm"
              placeholder="e.g., 'The Roman Empire' or 'Black Holes'"
            />
            <button
              onClick={fetchLearningContent}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-400 to-green-600 text-white py-4 px-8 rounded-xl text-xl font-bold hover:from-emerald-300 hover:to-green-500 disabled:from-gray-600 disabled:to-gray-700 transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? "Conjuring..." : "Explore!"}
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center p-8 bg-black/30 backdrop-blur-lg rounded-2xl mt-6">
          <div className="text-6xl animate-spin mb-4">✨</div>
          <p className="text-2xl text-yellow-300 font-bold">Professor Sparkle is weaving his magic...</p>
          <p className="text-blue-200">Please wait while the explanation materializes!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border-2 border-red-500 text-white p-6 rounded-2xl mt-6 text-center">
          <p className="text-4xl mb-2">😟</p>
          <p className="font-bold text-2xl text-red-300">An Arcane Mishap!</p>
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {learningContent && (
        <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 mt-6">
          <button
            onClick={() => {
              setLearningContent(null);
              setTopic('');
              setError(null);
            }}
            className="mb-6 bg-gray-600/80 text-white px-4 py-2 rounded-lg hover:bg-gray-500/80 transition-colors"
          >
            ← Explore Another Topic
          </button>
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-300 to-pink-400 bg-clip-text text-transparent">
              {learningContent.title}
            </h2>
          </div>

          <div 
            className="prose prose-invert prose-lg max-w-none text-gray-200 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: learningContent.content }}
          />

          <div className="mt-10 space-y-6">
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-6 rounded-xl border-2 border-amber-400/40 shadow-lg">
              <h3 className="text-2xl font-bold text-amber-300 mb-2 flex items-center">
                <span className="text-3xl mr-3">🏆</span> Achievement Unlocked!
              </h3>
              <p className="text-amber-100 text-lg">{learningContent.achievement_unlocked}</p>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 rounded-xl border-2 border-cyan-400/40 shadow-lg">
              <h3 className="text-2xl font-bold text-cyan-300 mb-2 flex items-center">
                <span className="text-3xl mr-3">💡</span> Fun Fact!
              </h3>
              <p className="text-cyan-100 text-lg">{learningContent.fun_fact}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningComponent;
