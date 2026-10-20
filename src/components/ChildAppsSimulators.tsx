/**
 * Interactive App Simulations for the Child Phone:
 * 1. Short-Form Reels / Shorts Player (Infinite dopamine loop with continuous timer)
 * 2. Mini-Game Arcade (Continuous gameplay with quota tracker)
 * 3. Educational Focus Academy (Interactive learning that awards bonus time)
 */

import React, { useState, useEffect } from 'react';
import { HavenApp } from '../types';
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface SimulatorProps {
  app: HavenApp;
  onClose: () => void;
  sessionSeconds: number;
  remainingDailySeconds: number;
  maxContinuousSeconds: number;
  onEarnBonusTime: (minutes: number) => void;
}

// Reel Data
const REEL_VIDEOS = [
  {
    id: 1,
    title: 'Satisfying Kinetic Sand Sculpting in 60fps',
    author: '@creative_satisfy',
    likes: '142.8K',
    comments: '1,240',
    tags: '#satisfying #art #kinetic',
    bgGradient: 'from-amber-700 via-rose-900 to-indigo-950',
    accentColor: '#f43f5e',
  },
  {
    id: 2,
    title: 'Top 5 Optical Illusions that trick your brain completely!',
    author: '@mind_bender',
    likes: '89.4K',
    comments: '840',
    tags: '#illusion #fun #viral',
    bgGradient: 'from-violet-900 via-purple-950 to-slate-950',
    accentColor: '#a855f7',
  },
  {
    id: 3,
    title: 'Parkour world record jump compilation reaction',
    author: '@extreme_daily',
    likes: '310.2K',
    comments: '4,102',
    tags: '#parkour #reaction #sports',
    bgGradient: 'from-blue-900 via-cyan-950 to-slate-950',
    accentColor: '#06b6d4',
  },
];

// Educational Quiz Questions
const QUIZ_QUESTIONS = [
  {
    question: "Which planet in our solar system is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1,
    explanation: "Mars appears red because of iron oxide (rust) in its soil!",
  },
  {
    question: "In computer science, what does 'HTML' stand for?",
    options: [
      "HyperText Markup Language",
      "High Tech Modern Language",
      "Home Tool Management Loop",
      "Hyperlink Text Machine Logic",
    ],
    correct: 0,
    explanation: "HTML is the standard markup language for creating Web pages.",
  },
  {
    question: "What is 15% of 80?",
    options: ["10", "12", "14", "16"],
    correct: 1,
    explanation: "10% of 80 is 8, 5% is 4. So 8 + 4 = 12!",
  },
];

export const ReelSimulator: React.FC<SimulatorProps> = ({
  sessionSeconds,
  remainingDailySeconds,
  maxContinuousSeconds,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState<Record<number, boolean>>({});

  const video = REEL_VIDEOS[currentIdx % REEL_VIDEOS.length];
  const isLiked = liked[video.id] || false;

  const sessionMins = Math.floor(sessionSeconds / 60);
  const sessionSecs = sessionSeconds % 60;
  const maxSessionMins = Math.floor(maxContinuousSeconds / 60);
  const remainingMins = Math.max(0, Math.floor(remainingDailySeconds / 60));

  return (
    <div className={`relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b ${video.bgGradient} text-white select-none`}>
      {/* Session Limit HUD Banner */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs">
        <div className="flex items-center gap-1.5 font-mono">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-slate-300">Continuous:</span>
          <span className="font-semibold text-amber-300">
            {sessionMins}:{sessionSecs.toString().padStart(2, '0')} / {maxSessionMins}:00
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
          <span>Daily Left:</span>
          <span className="text-rose-400 font-bold">{remainingMins}m</span>
        </div>
      </div>

      {/* Center Simulated Reel Animation Content */}
      <div className="flex-1 flex flex-col items-center justify-center my-12 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mb-4 bg-white/5 animate-pulse">
          <Play className="w-10 h-10 text-white/80 fill-white/80 ml-1" />
        </div>
        <p className="text-sm font-medium text-white/90 max-w-xs px-2 drop-shadow">
          {video.title}
        </p>
        <span className="text-xs text-rose-300 font-mono mt-2">{video.tags}</span>
      </div>

      {/* Right Action Rail */}
      <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
        <button
          onClick={() => setLiked({ ...liked, [video.id]: !isLiked })}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className={`p-2.5 rounded-full ${isLiked ? 'bg-rose-500 text-white' : 'bg-black/40 text-white/90'} backdrop-blur-sm transition-transform active:scale-90`}>
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-[11px] font-mono mt-0.5">{isLiked ? 'Liked' : video.likes}</span>
        </button>

        <button className="flex flex-col items-center group cursor-pointer">
          <div className="p-2.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-mono mt-0.5">{video.comments}</span>
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button className="p-2.5 rounded-full bg-black/40 text-white/90 backdrop-blur-sm cursor-pointer">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Reel Author & Swipe Button */}
      <div className="z-20 flex items-end justify-between">
        <div className="max-w-[75%]">
          <p className="font-semibold text-sm drop-shadow">{video.author}</p>
          <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{video.title}</p>
        </div>
        <button
          onClick={() => setCurrentIdx(prev => prev + 1)}
          className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-semibold text-xs flex items-center gap-1 shadow-lg active:scale-95 transition cursor-pointer"
        >
          <span>Next Reel</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const GameSimulator: React.FC<SimulatorProps> = ({
  app,
  sessionSeconds,
  remainingDailySeconds,
  onEarnBonusTime,
}) => {
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: 40, left: 45 });
  const [highScore, setHighScore] = useState(12);

  // Move tap target
  const handleTap = () => {
    setScore(s => {
      const next = s + 1;
      if (next > highScore) setHighScore(next);
      return next;
    });
    setTargetPos({
      top: 20 + Math.random() * 55,
      left: 15 + Math.random() * 70,
    });
  };

  const sessionMins = Math.floor(sessionSeconds / 60);
  const sessionSecs = sessionSeconds % 60;
  const remainingMins = Math.max(0, Math.floor(remainingDailySeconds / 60));

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 bg-slate-900 text-slate-100 select-none overflow-hidden">
      {/* Game HUD */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 backdrop-blur text-xs z-20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{app.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">
            Score: {score}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400">Time:</span>
          <span className="text-amber-400 font-bold">
            {sessionMins}:{sessionSecs.toString().padStart(2, '0')}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-rose-400 font-bold">{remainingMins}m left</span>
        </div>
      </div>

      {/* Game Playfield */}
      <div className="flex-1 relative my-2 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-center overflow-hidden">
        {/* Animated Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        {/* Dynamic Click Target */}
        <button
          onClick={handleTap}
          style={{ top: `${targetPos.top}%`, left: `${targetPos.left}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 flex items-center justify-center cursor-pointer active:scale-90 transition-transform duration-75"
        >
          <Trophy className="w-7 h-7 text-white animate-bounce" />
        </button>

        <div className="absolute bottom-3 text-center pointer-events-none">
          <p className="text-xs text-slate-400 font-mono">Tap the power crystal to score points!</p>
          <p className="text-[11px] text-slate-500 mt-0.5">High Score: {highScore}</p>
        </div>
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <button
          onClick={() => setScore(0)}
          className="flex items-center gap-1 hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Run</span>
        </button>
        <span className="text-[11px] font-mono text-slate-400">Screen Time Limit Monitored Locally</span>
      </div>
    </div>
  );
};

export const EducationSimulator: React.FC<SimulatorProps> = ({
  app,
  sessionSeconds,
  onEarnBonusTime,
}) => {
  const [qIndex, setQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(1);
  const [earnedBonusTotal, setEarnedBonusTotal] = useState(0);

  const question = QUIZ_QUESTIONS[qIndex % QUIZ_QUESTIONS.length];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === question.correct) {
      setStreak(s => s + 1);
      // Award 2 bonus minutes every 2 correct answers
      if ((streak + 1) % 2 === 0) {
        onEarnBonusTime(2);
        setEarnedBonusTotal(b => b + 2);
      }
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setQIndex(q => q + 1);
  };

  const sessionMins = Math.floor(sessionSeconds / 60);
  const sessionSecs = sessionSeconds % 60;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 bg-emerald-950/30 text-slate-100 select-none">
      {/* Education HUD */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-900/30 border border-emerald-500/30 backdrop-blur text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-300">{app.name}</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200 font-mono text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Unlimited Mode
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-emerald-300">
          <span>Studied:</span>
          <span className="font-bold">
            {sessionMins}:{sessionSecs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Reward Notification Banner */}
      {earnedBonusTotal > 0 && (
        <div className="my-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Earned Reward:</span>
          </div>
          <span className="font-bold font-mono text-emerald-200">+{earnedBonusTotal}m Game Time Added</span>
        </div>
      )}

      {/* Lesson / Quiz Card */}
      <div className="flex-1 my-2 p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Bite-Sized Mastery Quest</span>
            <span className="font-mono text-emerald-400 font-bold">Streak: {streak} 🔥</span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-snug mt-1">
            {question.question}
          </h3>

          {/* Options */}
          <div className="mt-4 space-y-2">
            {question.options.map((option, idx) => {
              let btnClass = 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-200 border-slate-700/60';
              if (isAnswered) {
                if (idx === question.correct) {
                  btnClass = 'bg-emerald-600/30 text-emerald-200 border-emerald-500 font-semibold';
                } else if (idx === selectedOption) {
                  btnClass = 'bg-rose-600/30 text-rose-200 border-rose-500';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  {isAnswered && idx === question.correct && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isAnswered && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-300 max-w-[70%]">
              {question.explanation}
            </p>
            <button
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-[11px] text-emerald-400/80 font-mono">
        Educational resources are never blocked by parental limits
      </div>
    </div>
  );
};
