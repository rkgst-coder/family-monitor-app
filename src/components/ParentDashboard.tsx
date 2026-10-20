/**
 * Parent Control Dashboard
 * Direct remote management of child phone without requiring any common email account.
 */

import React, { useState, useEffect } from 'react';
import {
  AppCategory,
  CategoryRule,
  HavenApp,
  ChildTelemetry,
  ParentSecurityConfig,
  SystemConfig,
  TimeRequest,
} from '../types';
import { syncEngine } from '../services/syncEngine';
import {
  hashPin,
  generateOfflineToken,
  saveStoredConfig,
  saveAuth,
} from '../services/cryptoAndStorage';
import {
  Shield,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  Sparkles,
  Sliders,
  Smartphone,
  KeyRound,
  Check,
  X,
  Lock,
  Unlock,
  QrCode,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Flame,
  Gamepad2,
  Film,
  GraduationCap,
  Moon,
  Info,
} from 'lucide-react';

interface ParentDashboardProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  telemetry: ChildTelemetry;
  onUpdateTelemetry: (telemetry: ChildTelemetry) => void;
  auth: ParentSecurityConfig;
  onUpdateAuth: (newAuth: ParentSecurityConfig) => void;
  isUnlocked: boolean;
  onToggleLock: (unlocked: boolean) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  config,
  onUpdateConfig,
  telemetry,
  onUpdateTelemetry,
  auth,
  onUpdateAuth,
  isUnlocked,
  onToggleLock,
}) => {
  // Pin entry state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'control' | 'rules' | 'apps' | 'offline_sync'>('control');

  // Pending requests state
  const [requests, setRequests] = useState<TimeRequest[]>([]);
  const [declineNoteInput, setDeclineNoteInput] = useState<Record<string, string>>({});

  // Offline token generator state
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenMinutes, setTokenMinutes] = useState(15);

  // Success toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load pending requests and subscribe
  useEffect(() => {
    setRequests(syncEngine.getPendingRequests());

    const unsub = syncEngine.onRequest(newReq => {
      setRequests(syncEngine.getPendingRequests());
      showToast(`New request from Alex: +${newReq.requestedMinutes}m for ${newReq.appName}`);
    });

    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // PIN Unlock Verification
  const handleVerifyPin = async () => {
    const inputHash = await hashPin(pinInput, auth.salt);
    if (inputHash === auth.pinHash) {
      onToggleLock(true);
      setPinInput('');
      setPinError(false);
      showToast('Parent Hub Unlocked');
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Remote Action 1: Instant Screen Pause / Freeze
  const handleToggleInstantFreeze = () => {
    const nextLocked = !telemetry.isInstantlyLocked;
    const commandType = nextLocked ? 'INSTANT_LOCK' : 'UNLOCK';
    syncEngine.sendCommand(commandType);

    onUpdateTelemetry({
      ...telemetry,
      isInstantlyLocked: nextLocked,
    });

    showToast(nextLocked ? 'Instant Screen Freeze activated on child device' : 'Child screen unfrozen');
  };

  // Remote Action 2: Quick +15m Bonus
  const handleGrantBonusTime = (category: AppCategory, mins: number) => {
    syncEngine.sendCommand('ADD_BONUS_TIME', { category, minutes: mins });
    showToast(`Granted +${mins}m to Alex for ${category}`);
  };

  // Resolve Time Request
  const handleResolveRequest = (reqId: string, status: 'approved' | 'rejected') => {
    const note = declineNoteInput[reqId] || undefined;
    syncEngine.resolveTimeRequest(reqId, status, note);
    setRequests(syncEngine.getPendingRequests());

    if (status === 'approved') {
      // Award time
      handleGrantBonusTime('reels', 15);
    } else {
      showToast('Request declined');
    }
  };

  // Update Category Rule
  const handleRuleChange = (cat: AppCategory, field: keyof CategoryRule, value: any) => {
    const updatedRules = {
      ...config.rules,
      [cat]: {
        ...config.rules[cat],
        [field]: value,
      },
    };
    const nextConfig = { ...config, rules: updatedRules };
    onUpdateConfig(nextConfig);
    saveStoredConfig(nextConfig);
    syncEngine.sendCommand('UPDATE_CATEGORY_RULE', { category: cat, rules: updatedRules[cat] });
  };

  // Toggle App Allowed/Blocked
  const handleToggleApp = (appId: string) => {
    const updatedApps = config.apps.map(a => (a.id === appId ? { ...a, isAllowed: !a.isAllowed } : a));
    const nextConfig = { ...config, apps: updatedApps };
    onUpdateConfig(nextConfig);
    saveStoredConfig(nextConfig);
    syncEngine.sendCommand('TOGGLE_APP_ACCESS', { appId });
  };

  // Generate Offline 6-Digit Token
  const handleGenerateOfflineToken = async () => {
    const token = await generateOfflineToken(auth.sharedTokenSecret, tokenMinutes);
    setGeneratedToken(token);
    showToast(`Generated 6-digit bypass code for +${tokenMinutes}m`);
  };

  // Export JSON Config
  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `havenscreen-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported configuration file');
  };

  // If locked, show PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto my-8 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Parent Control Hub</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Enter your 4-digit Master PIN to manage child limits and remote controls.
        </p>

        {/* PIN Input Dots */}
        <div className="flex items-center justify-center gap-3 my-6">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border transition-all ${
                pinInput.length > i
                  ? 'bg-indigo-500 border-indigo-400 scale-110'
                  : 'bg-slate-800 border-slate-700'
              }`}
            />
          ))}
        </div>

        {pinError && (
          <p className="text-xs text-rose-400 mb-4 animate-shake">
            Incorrect PIN. Default is <span className="font-mono font-bold">1234</span>
          </p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => {
                if (pinInput.length < 4) setPinInput(p => p + num);
              }}
              className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-mono text-lg font-semibold active:scale-95 transition cursor-pointer border border-slate-700/60"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPinInput('')}
            className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 text-xs font-medium active:scale-95 transition cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => {
              if (pinInput.length < 4) setPinInput(p => p + '0');
            }}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-mono text-lg font-semibold active:scale-95 transition cursor-pointer border border-slate-700/60"
          >
            0
          </button>
          <button
            onClick={() => setPinInput(p => p.slice(0, -1))}
            className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 text-xs font-medium active:scale-95 transition cursor-pointer"
          >
            Delete
          </button>
        </div>

        <button
          onClick={handleVerifyPin}
          disabled={pinInput.length !== 4}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          Unlock Parent Hub
        </button>

        <p className="text-[11px] font-mono text-slate-500 mt-4">
          Default Master PIN: 1234 (Zero Cloud · Offline Only)
        </p>
      </div>
    );
  }

  // Active Unlocked Dashboard
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-indigo-600 text-white text-xs font-medium shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controller Strip */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Alex's Phone</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold">
                P2P Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero Google/Apple email account required · 100% on-device telemetry
            </p>
          </div>
        </div>

        {/* Lock / Security Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleLock(false)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-700/60"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Lock Hub</span>
          </button>
        </div>
      </div>

      {/* Remote Quick Command Center */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Instant Freeze / Pause Button */}
        <div className={`p-4 rounded-3xl border transition-all ${
          telemetry.isInstantlyLocked
            ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/50'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Instant Screen Control</span>
            {telemetry.isInstantlyLocked ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                SCREEN FROZEN
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                Normal Mode
              </span>
            )}
          </div>
          <button
            onClick={handleToggleInstantFreeze}
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
              telemetry.isInstantlyLocked
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
            }`}
          >
            {telemetry.isInstantlyLocked ? (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Resume Child Screen</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Instant Freeze Child Screen</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Instantly pauses all entertainment &amp; reels apps on child's device
          </p>
        </div>

        {/* Quick Bonus Reward Action */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Reward Good Behavior</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleGrantBonusTime('reels', 15)}
              className="py-2.5 px-2 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-semibold text-xs border border-indigo-500/30 active:scale-95 transition cursor-pointer"
            >
              +15m Reels
            </button>
            <button
              onClick={() => handleGrantBonusTime('games', 15)}
              className="py-2.5 px-2 rounded-2xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 font-semibold text-xs border border-amber-500/30 active:scale-95 transition cursor-pointer"
            >
              +15m Games
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Pushes bonus bank minutes directly to child phone
          </p>
        </div>

        {/* Curfew & Bedtime Control */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300">Bedtime Curfew</span>
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">Night Shutdown</span>
            <span className="font-mono text-indigo-300 font-semibold">21:00 - 07:00</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Educational apps remain available for bedtime reading
          </p>
        </div>
      </div>

      {/* Pending Requests Alert Box (if any) */}
      {pendingCount > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/50 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400 animate-spin" />
              <h3 className="text-sm font-bold text-white">
                Child Extension Request ({pendingCount} pending)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-indigo-300">Sent via Local Sync</span>
          </div>

          {requests
            .filter(r => r.status === 'pending')
            .map(req => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-semibold text-white">
                    Alex requested <span className="text-amber-300 font-bold">+{req.requestedMinutes} minutes</span> for {req.appName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Category: {req.category.toUpperCase()} · Sent just now
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolveRequest(req.id, 'rejected')}
                    className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleResolveRequest(req.id, 'approved')}
                    className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    Approve (+15m)
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('control')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'control'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Screen Time Analytics
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'rules'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Category Limits &amp; Cooldowns
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'apps'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          App Whitelist &amp; Blocks
        </button>
        <button
          onClick={() => setActiveTab('offline_sync')}
          className={`py-2 px-4 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'offline_sync'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Offline Bypass &amp; Pair Code
        </button>
      </div>

      {/* Tab 1: Screen Time Analytics */}
      {activeTab === 'control' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Today's Child Usage Breakdown</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Reels */}
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30">
                <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                  <Film className="w-3.5 h-3.5" />
                  <span>Reels &amp; Shorts</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">
                    {Math.floor((telemetry.categorySecondsUsed.reels || 0) / 60)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    / {config.rules.reels.dailyLimitMinutes}m
                  </span>
                </div>
                <span className="text-[10px] text-rose-400 font-mono">
                  {Math.max(0, config.rules.reels.dailyLimitMinutes - Math.floor((telemetry.categorySecondsUsed.reels || 0) / 60))}m left
                </span>
              </div>

              {/* Games */}
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Gaming</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">
                    {Math.floor((telemetry.categorySecondsUsed.games || 0) / 60)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    / {config.rules.games.dailyLimitMinutes}m
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">
                  {Math.max(0, config.rules.games.dailyLimitMinutes - Math.floor((telemetry.categorySecondsUsed.games || 0) / 60))}m left
                </span>
              </div>

              {/* Education */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Education</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">
                    {Math.floor((telemetry.categorySecondsUsed.education || 0) / 60)}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">mins</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Whitelisted (Free)</span>
              </div>

              {/* Essentials */}
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Essentials</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-white">
                    {Math.floor((telemetry.categorySecondsUsed.essential || 0) / 60)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">mins</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Always Allowed</span>
              </div>
            </div>

            {/* Privacy Verification Callout */}
            <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Private &amp; Decentralized Architecture</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                Zero Cloud Tracking · No Mail ID
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Category Limits & Cooldowns */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Reels & Shorts Limiter */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-rose-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Shorts &amp; Reels Guard (Instagram, YouTube Shorts)</h4>
                  <p className="text-xs text-slate-400">
                    Defend against infinite scroll dopamine traps with continuous session caps
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400">
                {config.rules.reels.dailyLimitMinutes}m daily
              </span>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Daily Quota Bank</span>
                  <span className="font-mono text-rose-300 font-bold">{config.rules.reels.dailyLimitMinutes} mins/day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={config.rules.reels.dailyLimitMinutes}
                  onChange={e => handleRuleChange('reels', 'dailyLimitMinutes', parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Max Continuous Binge Session (Before Cooldown)</span>
                  <span className="font-mono text-amber-300 font-bold">{config.rules.reels.maxContinuousMinutes} mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={config.rules.reels.maxContinuousMinutes}
                  onChange={e => handleRuleChange('reels', 'maxContinuousMinutes', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Mandatory Cooldown Eye Break</span>
                  <span className="font-mono text-indigo-300 font-bold">{config.rules.reels.cooldownMinutes} mins</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={config.rules.reels.cooldownMinutes}
                  onChange={e => handleRuleChange('reels', 'cooldownMinutes', parseInt(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Games Limiter */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Gaming Quota</h4>
                  <p className="text-xs text-slate-400">Total daily play bank for games</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {config.rules.games.dailyLimitMinutes}m daily
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Daily Game Bank</span>
                <span className="font-mono text-amber-300 font-bold">{config.rules.games.dailyLimitMinutes} mins</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={config.rules.games.dailyLimitMinutes}
                onChange={e => handleRuleChange('games', 'dailyLimitMinutes', parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Educational Whitelist Rule */}
          <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Educational Whitelist</h4>
                <p className="text-xs text-emerald-300/80">
                  Khan Academy, Duolingo, Wikipedia never lock out and reward study
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
              Always Unrestricted
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: App Whitelist & Blocks */}
      {activeTab === 'apps' && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-white">App Access Permissions</h4>
              <p className="text-xs text-slate-400">Granularly allow or block individual apps on child's phone</p>
            </div>
            <span className="text-xs font-mono text-slate-400">{config.apps.length} Monitored Apps</span>
          </div>

          <div className="divide-y divide-slate-800">
            {config.apps.map(app => (
              <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-200">
                    {app.category === 'reels' && <Film className="w-5 h-5 text-rose-400" />}
                    {app.category === 'games' && <Gamepad2 className="w-5 h-5 text-amber-400" />}
                    {app.category === 'education' && <GraduationCap className="w-5 h-5 text-emerald-400" />}
                    {app.category === 'essential' && <Smartphone className="w-5 h-5 text-sky-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{app.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {app.category.toUpperCase()} · {app.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleApp(app.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    app.isAllowed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {app.isAllowed ? 'Allowed' : 'Blocked'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Offline Bypass & Pairing Code */}
      {activeTab === 'offline_sync' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Offline 6-Digit Bypass Generator */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Emergency Offline Bypass Code</h4>
                <p className="text-xs text-slate-400">
                  Generate a 6-digit code to unlock the child device with zero internet
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[15, 30, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => setTokenMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    tokenMinutes === mins
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  +{mins}m Code
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateOfflineToken}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              Generate 6-Digit Code
            </button>

            {generatedToken && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 text-center">
                <span className="text-[11px] text-slate-400">Tell child to enter this code:</span>
                <p className="text-3xl font-bold font-mono tracking-widest text-indigo-300 my-1">
                  {generatedToken}
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Valid for 2 hours · No internet required
                </span>
              </div>
            )}
          </div>

          {/* Peer Sync Pairing Code */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Direct Device Pairing</h4>
                <p className="text-xs text-slate-400">Connect child's phone without any Google/Apple email</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Parent Pair Sync Code</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 tracking-wider my-1">
                {auth.pairSyncCode}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter on child phone to bind rules directly over Wi-Fi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportConfig}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700/60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
