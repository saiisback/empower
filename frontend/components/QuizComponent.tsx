"use client";

import { useState, useEffect } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: number;
  points?: number;
}

interface QuizComponentProps {
  subject: string;
  userDisability: string;
  age: number;
}

const QuizComponent: React.FC<QuizComponentProps> = ({ subject, userDisability, age }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizQuestions();
  }, [subject]);

  const fetchQuizQuestions = async () => {
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setScore(0);
    setTotalPoints(0);
    setStreak(0);
    setMaxStreak(0);

    try {
      const response = await fetch("http://127.0.0.1:8000/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: age,
          disability: userDisability,
          subject: subject,
          topic: "general"
        }),
      });

      if (!response.ok) {
        throw new Error("🔮 Professor Sparkle is preparing something magical! Please try again.");
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
      } else {
        throw new Error("🎭 No magical quests found! Let's try a different adventure!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAchievements = (correct: boolean) => {
    const newAchievements = [];
    
    if (correct) {
      if (streak + 1 === 3) newAchievements.push("🔥 Triple Threat!");
      if (streak + 1 === 5) newAchievements.push("🌟 Quiz Master!");
      if (score + 1 === questions.length) newAchievements.push("🏆 Perfect Score Legend!");
    }
    
    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements]);
      setNewAchievement(newAchievements[0]);
      setTimeout(() => setNewAchievement(null), 3000);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    
    const isCorrect = answerIndex === questions[currentQuestion].correctAnswer;
    const questionPoints = questions[currentQuestion].points || 100;
    
    if (isCorrect) {
      setScore(score + 1);
      setTotalPoints(totalPoints + questionPoints + (streak * 10)); // Bonus for streak
      setStreak(streak + 1);
      setMaxStreak(Math.max(maxStreak, streak + 1));
      checkAchievements(true);
    } else {
      setStreak(0);
      checkAchievements(false);
    }
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setTotalPoints(0);
    setStreak(0);
    setMaxStreak(0);
    setAchievements([]);
    fetchQuizQuestions();
  };

  const getScoreEmoji = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "🏆";
    if (percentage >= 80) return "🌟";
    if (percentage >= 60) return "⭐";
    if (percentage >= 40) return "👍";
    return "🎯";
  };

  const getEncouragementMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "✨ MAGICAL PERFECTION! You're a true wizard! ✨";
    if (percentage >= 80) return "🌟 STELLAR PERFORMANCE! Almost perfect! 🌟";
    if (percentage >= 60) return "⭐ GREAT JOB! You're learning so much! ⭐";
    if (percentage >= 40) return "👍 NICE WORK! Keep practicing and you'll shine! 👍";
    return "🎯 GOOD EFFORT! Every try makes you stronger! 🎯";
  };

  const getDifficultyInfo = (question?: QuizQuestion) => {
    const difficulty = question?.difficulty;
    if (difficulty === undefined || difficulty === null) {
      return { level: 1, icon: "🌟" };
    }
    if (difficulty >= 4) {
      return { level: difficulty, icon: "🔥" };
    }
    if (difficulty >= 3) {
      return { level: difficulty, icon: "⚡" };
    }
    return { level: difficulty, icon: "🌟" };
  };

  if (isLoading) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-12 text-center">
        <div className="text-6xl mb-4 animate-spin">🔮</div>
        <p className="text-white text-xl">Professor Sparkle is conjuring magical questions...</p>
        <div className="mt-4">
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-red-400/30 p-8 text-center">
        <div className="text-6xl mb-4">😅</div>
        <p className="text-red-200 text-xl mb-6">{error}</p>
        <button
          onClick={fetchQuizQuestions}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-400 hover:to-pink-400 transition-colors"
        >
          ✨ Try Again!
        </button>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{getScoreEmoji()}</div>
          <h2 className="text-4xl font-bold text-white mb-4">Quest Complete!</h2>
          <p className="text-2xl text-blue-200 mb-2">{getEncouragementMessage()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-xl p-6 text-center border border-green-400/30">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-white">{score}/{questions.length}</div>
            <div className="text-green-200">Correct Answers</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl p-6 text-center border border-yellow-400/30">
            <div className="text-4xl mb-2">💎</div>
            <div className="text-3xl font-bold text-white">{totalPoints.toLocaleString()}</div>
            <div className="text-yellow-200">Total Points</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-xl p-6 text-center border border-purple-400/30">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-3xl font-bold text-white">{maxStreak}</div>
            <div className="text-purple-200">Best Streak</div>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="bg-gradient-to-r from-amber-400/20 to-yellow-500/20 rounded-xl p-6 mb-8 border border-amber-400/30">
            <h3 className="text-2xl font-bold text-amber-200 mb-4 text-center">🏆 Achievements Unlocked!</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {achievements.map((achievement, index) => (
                <span key={index} className="bg-amber-500/30 text-amber-100 px-4 py-2 rounded-full text-lg">
                  {achievement}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={restartQuiz}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-purple-400 hover:to-pink-400 transition-colors"
          >
            🎪 Try New Adventure!
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const { level, icon } = getDifficultyInfo(questions[currentQuestion]);

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
      {/* Achievement Popup */}
      {newAchievement && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce">
          <div className="font-bold">🎉 {newAchievement}</div>
        </div>
      )}

      {/* Enhanced Header with Stats */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🎯 {subject} Challenge Quest</h2>
          <div className="flex items-center space-x-6 text-lg">
            <span className="text-blue-200">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-yellow-200">💎 {totalPoints.toLocaleString()} pts</span>
            {streak > 0 && <span className="text-orange-200">🔥 {streak} streak</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl mb-2">{icon}</div>
          <div className="text-white/80">Level {level}</div>
        </div>
      </div>

      {/* Magical Progress Bar */}
      <div className="mb-8">
        <div className="bg-black/40 rounded-full p-1 mb-2">
          <div 
            className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        <div className="flex justify-between text-white/60 text-sm">
          <span>Quest Progress</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl p-8 mb-8 border border-indigo-400/30">
        <h3 className="text-2xl font-bold mb-6 text-white leading-relaxed">
          {questions[currentQuestion].question}
        </h3>
        
        <div className="space-y-4">
          {questions[currentQuestion].options.map((option, index) => {
            const isCorrect = index === questions[currentQuestion].correctAnswer;
            const isSelected = selectedAnswer === index;
            let buttonClass = "border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20 text-white";
            
            if (showExplanation) {
              if (isCorrect) {
                buttonClass = "border-green-400 bg-green-400/20 text-green-200 shadow-lg shadow-green-400/25";
              } else if (isSelected) {
                buttonClass = "border-red-400 bg-red-400/20 text-red-200 shadow-lg shadow-red-400/25";
              } else {
                buttonClass = "border-white/20 bg-white/5 text-white/60";
              }
            } else if (isSelected) {
              buttonClass = "border-yellow-400 bg-yellow-400/20 text-yellow-200 shadow-lg shadow-yellow-400/25";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${buttonClass}`}
              >
                <span className="inline-block w-8 h-8 bg-white/20 rounded-full text-center leading-8 font-bold mr-4">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Magical Explanation */}
      {showExplanation && (
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 mb-8 border border-blue-400/30">
          <div className="flex items-center mb-3">
            <div className="text-3xl mr-3">
              {selectedAnswer === questions[currentQuestion].correctAnswer ? "🎉" : "💫"}
            </div>
            <p className="font-bold text-xl text-white">
              {selectedAnswer === questions[currentQuestion].correctAnswer ? "Brilliant! ✨" : "Learning moment! 🌟"}
            </p>
          </div>
          <p className="text-blue-200 text-lg leading-relaxed">{questions[currentQuestion].explanation}</p>
          {selectedAnswer === questions[currentQuestion].correctAnswer && (
            <div className="mt-3 text-yellow-200">
              +{(questions[currentQuestion].points || 100) + (streak > 0 ? (streak - 1) * 10 : 0)} points 
              {streak > 1 && <span className="ml-2">🔥 +{(streak - 1) * 10} streak bonus!</span>}
            </div>
          )}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        {showExplanation ? (
          <button
            onClick={handleNextQuestion}
            className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-10 py-4 rounded-xl text-xl font-bold hover:from-emerald-400 hover:to-green-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            {currentQuestion < questions.length - 1 ? "🚀 Next Challenge!" : "🏆 Complete Quest!"}
          </button>
        ) : (
          <div className="text-center">
            <button
              disabled={true}
              className="bg-gray-600/50 text-white/50 px-10 py-4 rounded-xl text-xl font-bold cursor-not-allowed"
            >
              🤔 Choose your answer...
            </button>
            <p className="text-white/60 mt-2">Select an option to continue your quest!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizComponent;
