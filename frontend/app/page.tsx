"use client";

import { useState } from "react";
import QuizComponent from "../components/QuizComponent";
import LearningComponent from "../components/LearningComponent";
import GameComponent from "../components/GameComponent";
import CoachChat from "../components/CoachChat";

interface UserData {
  name: string;
  age: number;
  disability: string;
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    age: 8,
    disability: "",
  });
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  const disabilities = [
    "ADHD",
    "Dyslexia",
    "Autism Spectrum Disorder",
    "Hearing Impairment",
    "Visual Impairment",
    "Other",
  ];

  const subjects = ["Science", "History"];

  const handleInputChange = (field: keyof UserData, value: string | number) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (userData.name && userData.age && userData.disability) {
      setStep(2);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setStep(3);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setStep(4);
  };

  const resetToStart = () => {
    setStep(1);
    setSelectedSubject("");
    setSelectedOption("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Magical Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent mb-4">
            ✨ Professor Sparkle's Learning Academy ✨
          </h1>
          <div className="flex justify-center items-center space-x-2">
            <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 rounded"></div>
            <span className="text-2xl">🌟</span>
            <div className="w-16 h-1 bg-gradient-to-r from-pink-400 to-purple-400 rounded"></div>
          </div>
        </div>

        {/* Progress Bar */}
        {step > 1 && (
          <div className="bg-black/20 rounded-full p-1 mb-8 backdrop-blur-sm">
            <div className="flex items-center justify-between text-white/80 text-sm px-4 py-2">
              <span>🎯 Quest Progress</span>
              <span>
                {step}/4
              </span>
            </div>
            <div
              className="bg-gradient-to-r from-yellow-400 to-pink-400 h-2 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        )}

        {/* Step 1: Magical Character Creation */}
        {step === 1 && (
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🧙‍♂️</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Create Your Learning Avatar!
              </h2>
              <p className="text-blue-200">
                Tell Professor Sparkle about yourself to unlock magical
                learning!
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold text-yellow-300 mb-2">
                  🌟 What's your magical name?
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full p-4 bg-white/10 border-2 border-purple-400 rounded-xl focus:border-yellow-400 focus:outline-none text-white text-lg placeholder-white/50 backdrop-blur-sm"
                  placeholder="Enter your magical name..."
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-yellow-300 mb-2">
                  🎂 How many magical years old are you?
                </label>
                <input
                  type="number"
                  value={userData.age}
                  onChange={(e) =>
                    handleInputChange("age", parseInt(e.target.value, 10))
                  }
                  className="w-full p-4 bg-white/10 border-2 border-purple-400 rounded-xl focus:border-yellow-400 focus:outline-none text-white text-lg backdrop-blur-sm"
                  min="1"
                  max="18"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-yellow-300 mb-2">
                  🦄 What makes your learning special?
                </label>
                <select
                  value={userData.disability}
                  onChange={(e) =>
                    handleInputChange("disability", e.target.value)
                  }
                  className="w-full p-4 bg-white/10 border-2 border-purple-400 rounded-xl focus:border-yellow-400 focus:outline-none text-white text-lg backdrop-blur-sm"
                >
                  <option value="" className="text-gray-800">
                    Choose your superpower...
                  </option>
                  {disabilities.map((disability) => (
                    <option
                      key={disability}
                      value={disability}
                      className="text-gray-800"
                    >
                      {disability}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-xl border border-blue-400/30">
                <p className="text-blue-200 text-center">
                  ✨ Every learner has unique superpowers! This helps me create
                  the perfect magical experience for you! ✨
                </p>
              </div>

              <button
                onClick={handleNextStep}
                disabled={!userData.name || !userData.age || !userData.disability}
                className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 text-gray-900 py-4 px-6 rounded-xl text-xl font-bold hover:from-yellow-300 hover:to-pink-400 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🚀 Begin My Learning Adventure!
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Magical Subject Portal */}
        {step === 2 && (
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🌈</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Choose Your Learning Portal!
              </h2>
              <p className="text-blue-200">
                Hey {userData.name}! Which magical world do you want to explore?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => handleSubjectSelect("Science")}
                className="bg-gradient-to-br from-cyan-400 to-blue-600 text-white p-8 rounded-2xl text-center hover:from-cyan-300 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 shadow-xl border border-cyan-300/30"
              >
                <div className="text-6xl mb-4">🔬</div>
                <div className="text-2xl font-bold mb-2">Science Portal</div>
                <div className="text-cyan-100">
                  Discover amazing experiments & natural wonders!
                </div>
              </button>

              <button
                onClick={() => handleSubjectSelect("History")}
                className="bg-gradient-to-br from-amber-400 to-orange-600 text-white p-8 rounded-2xl text-center hover:from-amber-300 hover:to-orange-500 transform hover:scale-105 transition-all duration-300 shadow-xl border border-amber-300/30"
              >
                <div className="text-6xl mb-4">🏛️</div>
                <div className="text-2xl font-bold mb-2">History Portal</div>
                <div className="text-amber-100">
                  Journey through epic adventures & ancient mysteries!
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-6 text-yellow-300 hover:text-yellow-100 underline flex items-center justify-center w-full"
            >
              ← Change My Avatar
            </button>
          </div>
        )}

        {/* Step 3: Adventure Mode Selection */}
        {step === 3 && (
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Choose Your Adventure!
              </h2>
              <p className="text-blue-200">
                How do you want to explore {selectedSubject} today?
              </p>
            </div>

            <div className="space-y-6 grid grid-cols-2 gap-6 grid-rows-2">
              <button
                onClick={() => handleOptionSelect("explain")}
                className="w-full bg-gradient-to-r from-emerald-400 to-green-600 text-white p-8 rounded-2xl hover:from-emerald-300 hover:to-green-500 transform hover:scale-105 transition-all duration-300 shadow-xl border border-emerald-300/30"
              >
                <div className="text-5xl mb-4">📖</div>
                <div className="text-2xl font-bold mb-2">
                  🌟 Story & Discovery Mode
                </div>
                <div className="text-emerald-100">
                  Explore magical topics with interactive stories and amazing
                  facts!
                </div>
              </button>

              <button
                onClick={() => handleOptionSelect("game")}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white p-8 rounded-2xl hover:from-cyan-300 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 shadow-xl border border-cyan-300/30"
              >
                <div className="text-5xl mb-4">🎮</div>
                <div className="text-2xl font-bold mb-2">
                  🎪 Interactive Game Mode
                </div>
                <div className="text-cyan-100">
                  Learn through fun mini-games and interactive challenges!
                </div>
              </button>

              <button
                onClick={() => handleOptionSelect("quiz")}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-600 text-white p-8 rounded-2xl hover:from-purple-300 hover:to-pink-500 transform hover:scale-105 transition-all duration-300 shadow-xl border border-purple-300/30"
              >
                <div className="text-5xl mb-4">🎯</div>
                <div className="text-2xl font-bold mb-2">
                  🏆 Challenge Quest Mode
                </div>
                <div className="text-purple-100">
                  Test your knowledge with fun challenges and earn magical
                  rewards!
                </div>
              </button>

              <button
                onClick={() => handleOptionSelect("coach")}
                className="w-full bg-gradient-to-r from-teal-400 to-cyan-600 text-white p-8 rounded-2xl hover:from-teal-300 hover:to-cyan-500 transform hover:scale-105 transition-all duration-300 shadow-xl border border-teal-300/30"
              >
                <div className="text-5xl mb-4">💬</div>
                <div className="text-2xl font-bold mb-2">
                  🎓 Prof Chat Mode
                </div>
                <div className="text-teal-100">
                  Have a friendly chat with Professor Sparkle about any topic!
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 text-yellow-300 hover:text-yellow-100 underline flex items-center justify-center w-full"
            >
              ← Choose Different Portal
            </button>
          </div>
        )}

        {/* Step 4: Magical Content Arena */}
        {step === 4 && (
          <div>
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-4 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">
                    {selectedOption === "explain"
                      ? "📖"
                      : selectedOption === "game"
                      ? "🎮"
                      : selectedOption === "quiz"
                      ? "🎯"
                      : "💬"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedOption === "explain"
                        ? "✨ Discovery Mode"
                        : selectedOption === "game"
                        ? "🎮 Game Mode"
                        : selectedOption === "quiz"
                        ? "🎯 Challenge Quest"
                        : "🎓 Coach Chat"}
                    </h2>
                    <p className="text-blue-200">
                      {selectedSubject} Adventure
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setStep(3)}
                    className="bg-gray-600/80 text-white px-4 py-2 rounded-lg hover:bg-gray-500/80 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={resetToStart}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-400 hover:to-pink-400 transition-colors"
                  >
                    🏠 Home
                  </button>
                </div>
              </div>
            </div>

            {selectedOption === "explain" && (
              <LearningComponent
                subject={selectedSubject}
                userDisability={userData.disability}
                age={userData.age}
              />
            )}

            {selectedOption === "game" && (
              <GameComponent
                subject={selectedSubject}
                userDisability={userData.disability}
                age={userData.age}
              />
            )}

            {selectedOption === "quiz" && (
              <QuizComponent
                subject={selectedSubject}
                userDisability={userData.disability}
                age={userData.age}
              />
            )}

            {selectedOption === "coach" && (
              <CoachChat
                subject={selectedSubject}
                userDisability={userData.disability}
                age={userData.age}
                userName={userData.name}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
