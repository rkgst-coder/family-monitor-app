/**
 * Child Device Simulator & Launcher
 * Enforces local category quotas, binge cooldowns, and responds in real time
 * to parent commands (instant freeze, remote bonus time, bedtime).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AppCategory,
  CategoryRule,
  HavenApp,
  ChildTelemetry,
  SystemConfig,
  TimeRequest,
} from '../types';
import { syncEngine } from '../services/syncEngine';
import { verifyOfflineToken } from '../services/cryptoAndStorage';
import {
  ReelSimulator,
  GameSimulator,
  EducationSimulator,
} from './ChildAppsSimulators';
import {
  Wifi,
  Battery,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  KeyRound,
  Send,
  ArrowLeft,
  Flame,
  AlertTriangle,
  Instagram,
  Youtube,
  Gamepad2,
  Film,
  Zap,
  Trophy,
  BookOpen,
  Code,
  Languages,
  PhoneCall,
  Calculator,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';

interface ChildDeviceProps {
  config: SystemConfig;
  telemetry: ChildTelemetry;
  onUpdateTelemetry: (telemetry: ChildTelemetry) => void;
  sharedSecret: string;
  isSimulatorView?: boolean;
}

// Icon helper map
const ICON_MAP: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="w-5 h-5 text-rose-400" />,
  Youtube: <Youtube className="w-5 h-5 text-red-500" />,
  Film: <Film className="w-5 h-5 text-violet-400" />,
  Gamepad2: <Gamepad2 className="w-5 h-5 text-amber-400" />,
  Zap: <Zap className="w-5 h-5 text-amber-500" />,
  Trophy: <Trophy className="w-5 h-5 text-yellow-400" />,
  GraduationCap: <GraduationCap className="w-5 h-5 text-emerald-400" />,
  Languages: <Languages className="w-5 h-5 text-emerald-300" />,
  Code: <Code className="w-5 h-5 text-teal-400" />,
  BookOpen: <BookOpen className="w-5 h-5 text-emerald-200" />,
  PhoneCall: <PhoneCall className="w-5 h-5 text-sky-400" />,
  Calculator: <Calculator className="w-5 h-5 text-slate-300" />,
};

export const ChildDevice: React.FC<ChildDeviceProps> = ({
  config,
  telemetry,
  onUpdateTelemetry,
  sharedSecret,
  isSimulatorView = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | AppCategory>('all');
  const [activeApp, setActiveApp] = useState<HavenApp | null>(null);
  const [offlineTokenInput, setOfflineTokenInput] = useState('');
  const [offlineTokenError, setOfflineTokenError] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'sent' | 'approved' | 'rejected'>('idle');
  const [parentMessage, setParentMessage] = useState<string | null>(null);

  // Active time tracking interval
  useEffect(() => {
    const timer = setInterval(() => {
      if (!activeApp) return;

      const category = activeApp.category;
      const rule = config.rules[category];

      // Update telemetry
      const updatedSeconds = {
        ...telemetry.categorySecondsUsed,
        [category]: (telemetry.categorySecondsUsed[category] || 0) + 1,
      };

      const updatedSessionSecs = telemetry.activeSessionSeconds + 1;

      // Check continuous limit trigger
      let updatedCooldownUntil = { ...telemetry.cooldownUntil };
      if (
        rule &&
        rule.isRestricted &&
        rule.maxContinuousMinutes > 0 &&
        updatedSessionSecs >= rule.maxContinuousMinutes * 60
      ) {
        // Trigger cooldown
        updatedCooldownUntil[category] = Date.now() + rule.cooldownMinutes * 60 * 1000;
      }

      onUpdateTelemetry({
        ...telemetry,
        categorySecondsUsed: updatedSeconds,
        activeSessionSeconds: updatedSessionSecs,
        cooldownUntil: updatedCooldownUntil,
        lastActiveTimestamp: Date.now(),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeApp, telemetry, config, onUpdateTelemetry]);

  // Listen to remote commands from parent phone
  useEffect(() => {
    const unsubscribe = syncEngine.onCommand(command => {
      if (command.type === 'INSTANT_LOCK') {
        onUpdateTelemetry({
          ...telemetry,
          isInstantlyLocked: true,
        });
        setParentMessage('Parent paused your screen for family focus');
      } else if (command.type === 'UNLOCK') {
        onUpdateTelemetry({
          ...telemetry,
          isInstantlyLocked: false,
        });
        setParentMessage('Parent unlocked your screen');
      } else if (command.type === 'ADD_BONUS_TIME') {
        const bonusMins = command.payload?.minutes || 15;
        // Reduce used seconds for current or target category
        const targetCategory = command.payload?.category || 'reels';
        const currentUsed = telemetry.categorySecondsUsed[targetCategory as AppCategory] || 0;
        const newUsed = Math.max(0, currentUsed - bonusMins * 60);

        onUpdateTelemetry({
          ...telemetry,
          categorySecondsUsed: {
            ...telemetry.categorySecondsUsed,
            [targetCategory]: newUsed,
          },
          bonusMinutesEarned: telemetry.bonusMinutesEarned + bonusMins,
        });
        setParentMessage(`Parent granted +${bonusMins} bonus minutes! 🎉`);
      } else if (command.type === 'RESOLVE_REQUEST') {
        if (command.payload?.status === 'approved') {
          setRequestStatus('approved');
          setParentMessage('Parent approved your request (+15 mins)! 🚀');
        } else {
          setRequestStatus('rejected');
          setParentMessage(
            command.payload?.note
              ? `Request declined: "${command.payload.note}"`
              : 'Parent declined request. Switch to study!'
          );
        }
      }
    });

    return () => unsubscribe();
  }, [telemetry, onUpdateTelemetry]);

  // Dismiss parent alert toast after 4s
  useEffect(() => {
    if (parentMessage) {
      const t = setTimeout(() => setParentMessage(null), 4500);
      return () => clearTimeout(t);
    }
  }, [parentMessage]);

  // Evaluate Lockout condition for an app/category
  const isCategoryLocked = (cat: AppCategory) => {
    if (cat === 'education' || cat === 'essential') return false; // Educational & Essentials are whitelisted!
    if (telemetry.isInstantlyLocked) return true;

    const rule = config.rules[cat];
    if (!rule || !rule.isRestricted) return false;

    // Daily bank check
    const usedSeconds = telemetry.categorySecondsUsed[cat] || 0;
    const dailySecsLimit = rule.dailyLimitMinutes * 60;
    if (usedSeconds >= dailySecsLimit) return true;

    // Cooldown check
    const cooldownExpires = telemetry.cooldownUntil[cat] || 0;
    if (Date.now() < cooldownExpires) return true;

    return false;
  };

  const getLockReason = (cat: AppCategory): string => {
    if (telemetry.isInstantlyLocked) return 'Paused by Parent Phone';

    const rule = config.rules[cat];
    if (!rule) return 'Locked';

    const usedSeconds = telemetry.categorySecondsUsed[cat] || 0;
    if (usedSeconds >= rule.dailyLimitMinutes * 60) {
      return `Daily ${rule.name} limit (${rule.dailyLimitMinutes} mins) reached`;
    }

    const cooldownExpires = telemetry.cooldownUntil[cat] || 0;
    if (Date.now() < cooldownExpires) {
      const remainingCooldownMins = Math.ceil((cooldownExpires - Date.now()) / 60000);
      return `Binge Cooldown: ${remainingCooldownMins}m eye break remaining`;
    }

    return 'Locked by Parental Control';
  };

  // Launch App
  const handleLaunchApp = (app: HavenApp) => {
    if (!app.isAllowed) return;
    setActiveApp(app);
    onUpdateTelemetry({
      ...telemetry,
      activeAppId: app.id,
      activeSessionSeconds: 0, // Reset continuous session on new app start
    });
    setRequestStatus('idle');
  };

  const handleCloseApp = () => {
    setActiveApp(null);
    onUpdateTelemetry({
      ...telemetry,
      activeAppId: null,
      activeSessionSeconds: 0,
    });
  };

  // Switch to Educational app from Lockout Curtain
  const handleSwitchToEducation = () => {
    const eduApp = config.apps.find(a => a.category === 'education' && a.isAllowed) || config.apps[6];
    handleLaunchApp(eduApp);
  };

  // Ask Parent for 15 Minutes
  const handleAskParent = () => {
    if (!activeApp) return;
    const req: TimeRequest = {
      id: 'req_' + Date.now(),
      childName: "Alex's Phone",
      appId: activeApp.id,
      appName: activeApp.name,
      category: activeApp.category,
      requestedMinutes: 15,
      status: 'pending',
      createdAt: Date.now(),
    };
    syncEngine.sendTimeRequest(req);
    setRequestStatus('sent');
  };

  // Submit Offline Token
  const handleVerifyOfflineToken = async () => {
    setOfflineTokenError('');
    const res = await verifyOfflineToken(offlineTokenInput, sharedSecret);
    if (res.valid) {
      // Apply bonus minutes
      const cat = activeApp ? activeApp.category : 'reels';
      const currentUsed = telemetry.categorySecondsUsed[cat] || 0;
      const newUsed = Math.max(0, currentUsed - res.bonusMinutes * 60);

      onUpdateTelemetry({
        ...telemetry,
        isInstantlyLocked: false,
        cooldownUntil: {
          ...telemetry.cooldownUntil,
          [cat]: 0,
        },
        categorySecondsUsed: {
          ...telemetry.categorySecondsUsed,
          [cat]: newUsed,
        },
      });
      setShowOfflineModal(false);
      setOfflineTokenInput('');
      setParentMessage(`Offline code accepted! +${res.bonusMinutes} mins unlocked`);
    } else {
      setOfflineTokenError('Invalid or expired code. Ask your parent for a fresh 6-digit code.');
    }
  };

  // Filter apps for launcher
  const filteredApps = config.apps.filter(app => {
    if (activeTab === 'all') return true;
    return app.category === activeTab;
  });

  // Calculate remaining quotas
  const reelsLimitSecs = config.rules.reels.dailyLimitMinutes * 60;
  const reelsUsedSecs = telemetry.categorySecondsUsed.reels || 0;
  const reelsRemainingMins = Math.max(0, Math.floor((reelsLimitSecs - reelsUsedSecs) / 60));

  const gamesLimitSecs = config.rules.games.dailyLimitMinutes * 60;
  const gamesUsedSecs = telemetry.categorySecondsUsed.games || 0;
  const gamesRemainingMins = Math.max(0, Math.floor((gamesLimitSecs - gamesUsedSecs) / 60));

  const isCurrentAppLocked = activeApp ? isCategoryLocked(activeApp.category) : false;

  return (
    <div className={`flex flex-col items-center justify-center ${isSimulatorView ? 'w-full' : 'w-full max-w-sm mx-auto'}`}>
      {/* Smartphone Chassis Frame */}
      <div className="relative w-full max-w-[360px] h-[680px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 mr-4" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/80" />
        </div>

        {/* Mobile OS Top Status Bar */}
        <div className="w-full flex items-center justify-between px-6 pt-3 pb-2 text-[11px] font-mono text-slate-300 z-30 select-none">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="text-[10px] text-emerald-400 font-sans font-semibold">P2P Synced</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Incoming Remote Notification Toast */}
        {parentMessage && (
          <div className="absolute top-14 left-4 right-4 z-50 p-2.5 rounded-2xl bg-indigo-600 text-white text-xs shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
            <span className="font-medium text-[11px] leading-tight">{parentMessage}</span>
          </div>
        )}

        {/* Main Phone Viewport Area */}
        <div className="relative flex-1 rounded-[32px] bg-slate-900/90 border border-slate-800 flex flex-col overflow-hidden">
          
          {/* Active App Screen */}
          {activeApp ? (
            <div className="relative w-full h-full flex flex-col">
              {/* App Top Title Bar with Close Button */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800 z-30">
                <button
                  onClick={handleCloseApp}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 transition flex items-center gap-1 text-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <span className="text-xs font-semibold text-slate-200">{activeApp.name}</span>
                <div className="w-12 text-right">
                  {activeApp.category === 'education' ? (
                    <span className="text-[10px] text-emerald-400 font-mono">Whitelisted</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-mono">Protected</span>
                  )}
                </div>
              </div>

              {/* Render Respective App Simulator */}
              <div className="flex-1 relative overflow-hidden">
                {activeApp.simulatedType === 'reels' || activeApp.simulatedType === 'shorts' ? (
                  <ReelSimulator
                    app={activeApp}
                    onClose={handleCloseApp}
                    sessionSeconds={telemetry.activeSessionSeconds}
                    remainingDailySeconds={Math.max(0, reelsLimitSecs - reelsUsedSecs)}
                    maxContinuousSeconds={config.rules.reels.maxContinuousMinutes * 60}
                    onEarnBonusTime={mins => {
                      onUpdateTelemetry({
                        ...telemetry,
                        bonusMinutesEarned: telemetry.bonusMinutesEarned + mins,
                      });
                    }}
                  />
                ) : activeApp.category === 'games' ? (
                  <GameSimulator
                    app={activeApp}
                    onClose={handleCloseApp}
                    sessionSeconds={telemetry.activeSessionSeconds}
                    remainingDailySeconds={Math.max(0, gamesLimitSecs - gamesUsedSecs)}
                    maxContinuousSeconds={config.rules.games.maxContinuousMinutes * 60}
                    onEarnBonusTime={mins => {
                      onUpdateTelemetry({
                        ...telemetry,
                        bonusMinutesEarned: telemetry.bonusMinutesEarned + mins,
                      });
                    }}
                  />
                ) : activeApp.category === 'education' ? (
                  <EducationSimulator
                    app={activeApp}
                    onClose={handleCloseApp}
                    sessionSeconds={telemetry.activeSessionSeconds}
                    remainingDailySeconds={999999}
                    maxContinuousSeconds={999999}
                    onEarnBonusTime={mins => {
                      // Deduct from game usage to unlock games!
                      const currentGameUsed = telemetry.categorySecondsUsed.games || 0;
                      onUpdateTelemetry({
                        ...telemetry,
                        categorySecondsUsed: {
                          ...telemetry.categorySecondsUsed,
                          games: Math.max(0, currentGameUsed - mins * 60),
                        },
                        bonusMinutesEarned: telemetry.bonusMinutesEarned + mins,
                      });
                      setParentMessage(`Studying reward: +${mins}m Game Time Unlocked!`);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300">
                    <PhoneCall className="w-12 h-12 text-sky-400 mb-3" />
                    <h4 className="font-semibold text-white">{activeApp.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{activeApp.description}</p>
                    <span className="text-[11px] font-mono text-emerald-400 mt-4">
                      Emergency & essentials are always accessible.
                    </span>
                  </div>
                )}

                {/* Lockout Curtain Overlay when category limit/cooldown expires */}
                {isCurrentAppLocked && (
                  <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md p-5 flex flex-col items-center justify-between text-center animate-in fade-in zoom-in-95 duration-200">
                    <div className="mt-4">
                      <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-500/20">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-white">App Locked</h3>
                      <p className="text-xs text-rose-300 font-medium mt-1">
                        {getLockReason(activeApp.category)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-2 max-w-[220px] mx-auto leading-relaxed">
                        To encourage healthy habits, entertainment apps pause when limits or cooldowns trigger.
                      </p>
                    </div>

                    {/* Constructive Options for Child */}
                    <div className="w-full space-y-2.5 my-auto">
                      {/* 1. Switch to Educational Resources */}
                      <button
                        onClick={handleSwitchToEducation}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Switch to Khan Academy &amp; Duolingo</span>
                      </button>

                      {/* 2. Request 15 mins from Parent Phone */}
                      {requestStatus === 'idle' ? (
                        <button
                          onClick={handleAskParent}
                          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Ask Parent for +15 Minutes</span>
                        </button>
                      ) : requestStatus === 'sent' ? (
                        <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-xs flex items-center justify-center gap-2">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Request sent to parent's phone...</span>
                        </div>
                      ) : requestStatus === 'rejected' ? (
                        <div className="p-2 rounded-xl bg-slate-800 text-slate-400 text-xs">
                          Parent declined. Try again later or study!
                        </div>
                      ) : null}

                      {/* 3. Enter Offline Parent Token */}
                      <button
                        onClick={() => setShowOfflineModal(true)}
                        className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Enter 6-digit Parent Code</span>
                      </button>
                    </div>

                    <button
                      onClick={handleCloseApp}
                      className="text-xs text-slate-400 hover:text-white transition pb-1 cursor-pointer"
                    >
                      Return to Home Screen
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Launcher Home Screen */
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Child Device Header & Greeting */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">Alex's Phone</h2>
                    <p className="text-[11px] text-slate-400">Offline Protected Mode</p>
                  </div>
                  {telemetry.isInstantlyLocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Paused by Parent
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Active Protection
                    </span>
                  )}
                </div>

                {/* Quota Glance Card */}
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 mb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-rose-400" />
                      Reels &amp; Shorts Today
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-300">
                      {reelsRemainingMins}m left
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (reelsUsedSecs / Math.max(1, reelsLimitSecs)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                      Games Bank Today
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {gamesRemainingMins}m left
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (gamesUsedSecs / Math.max(1, gamesLimitSecs)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-400">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Educational Apps
                    </span>
                    <span className="font-semibold">Unlimited Access</span>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-950/60 rounded-xl mb-3 text-[11px]">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${activeTab === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('reels')}
                    className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${activeTab === 'reels' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Reels
                  </button>
                  <button
                    onClick={() => setActiveTab('games')}
                    className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${activeTab === 'games' ? 'bg-amber-950 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Games
                  </button>
                  <button
                    onClick={() => setActiveTab('education')}
                    className={`flex-1 py-1 rounded-lg font-medium transition cursor-pointer ${activeTab === 'education' ? 'bg-emerald-950 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Study
                  </button>
                </div>

                {/* App Launcher Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {filteredApps.map(app => {
                    const locked = isCategoryLocked(app.category);
                    const isEdu = app.category === 'education';

                    return (
                      <button
                        key={app.id}
                        onClick={() => handleLaunchApp(app)}
                        className={`flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer group active:scale-95 ${
                          locked
                            ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
                            : isEdu
                            ? 'bg-slate-800/80 border-emerald-500/30 hover:border-emerald-500/60'
                            : 'bg-slate-800/70 border-slate-700/60 hover:border-indigo-500/50'
                        }`}
                      >
                        <div className="relative w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center mb-1.5 shadow-md">
                          {ICON_MAP[app.iconName] || <Flame className="w-5 h-5 text-slate-300" />}
                          {locked && (
                            <div className="absolute inset-0 rounded-2xl bg-slate-950/80 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-rose-400" />
                            </div>
                          )}
                          {isEdu && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-slate-200 text-center leading-tight line-clamp-1">
                          {app.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {isEdu ? 'Open' : locked ? 'Paused' : 'Allowed'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Launcher Bottom Dock */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-around text-slate-400">
                <button
                  onClick={() => setShowOfflineModal(true)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter Parent Bypass Code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Home Navigation Indicator Bar */}
        <div className="w-full flex justify-center py-2 z-30">
          <div
            onClick={handleCloseApp}
            className="w-28 h-1 bg-slate-600/70 hover:bg-slate-400 rounded-full cursor-pointer transition"
          />
        </div>
      </div>

      {/* Offline Code Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs p-5 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <KeyRound className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Enter Parent Bypass Code</h4>
            <p className="text-xs text-slate-400 mt-1">
              Ask your parent for the 6-digit offline token generated on their phone.
            </p>

            <input
              type="text"
              maxLength={6}
              value={offlineTokenInput}
              onChange={e => setOfflineTokenInput(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full mt-4 p-3 rounded-xl bg-slate-950 border border-slate-700 text-center font-mono text-lg font-bold tracking-widest text-indigo-300 focus:outline-none focus:border-indigo-500"
            />

            {offlineTokenError && (
              <p className="text-xs text-rose-400 mt-2 text-center">{offlineTokenError}</p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  setShowOfflineModal(false);
                  setOfflineTokenError('');
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOfflineToken}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
