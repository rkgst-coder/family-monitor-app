/**
 * HavenScreen Application
 * Local-First Parental Control & Screen Time Limiter
 * Compliant with Top Bar Contract and Universal Frontend Design
 */

import React, { useState, useEffect } from 'react';
import {
  SystemConfig,
  ChildTelemetry,
  ParentSecurityConfig,
} from './types';
import {
  loadStoredConfig,
  saveStoredConfig,
  loadStoredTelemetry,
  saveStoredTelemetry,
  loadOrCreateAuth,
  saveAuth,
} from './services/cryptoAndStorage';
import { syncEngine } from './services/syncEngine';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildDevice } from './components/ChildDevice';
import { DualSimulatorView } from './components/DualSimulatorView';
import { PrivacyAndArchitectureModal } from './components/PrivacyAndArchitectureModal';
import {
  Shield,
  Smartphone,
  Sliders,
  Radio,
  Lock,
  Unlock,
  Info,
  PauseCircle,
  PlayCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SystemConfig>(loadStoredConfig());
  const [telemetry, setTelemetry] = useState<ChildTelemetry>(loadStoredTelemetry());
  const [auth, setAuth] = useState<ParentSecurityConfig | null>(null);
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [activeView, setActiveView] = useState<'dual' | 'parent' | 'child'>('dual');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Initialize auth
  useEffect(() => {
    loadOrCreateAuth().then(loadedAuth => {
      setAuth(loadedAuth);
    });
  }, []);

  // Save config changes
  const handleUpdateConfig = (newConfig: SystemConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  // Save telemetry changes
  const handleUpdateTelemetry = (newTelemetry: ChildTelemetry) => {
    setTelemetry(newTelemetry);
    saveStoredTelemetry(newTelemetry);
  };

  // Save auth updates
  const handleUpdateAuth = (newAuth: ParentSecurityConfig) => {
    setAuth(newAuth);
    saveAuth(newAuth);
  };

  // Quick Instant Freeze action in header zone 3
  const handleToggleInstantFreezeHeader = () => {
    const nextLocked = !telemetry.isInstantlyLocked;
    syncEngine.sendCommand(nextLocked ? 'INSTANT_LOCK' : 'UNLOCK');
    handleUpdateTelemetry({
      ...telemetry,
      isInstantlyLocked: nextLocked,
    });
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 
        Strict Top Bar Contract:
        [Brand title, one line] — [4–5 nav links, 1–2 word labels, single-line] — [1 primary action]
      */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          className="text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span>HavenScreen</span>
        </a>

        {/* Zone 2: 4 clean single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveView('dual')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'dual' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            Dual Simulator
          </button>
          <button
            onClick={() => setActiveView('parent')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'parent' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            Parent Hub
          </button>
          <button
            onClick={() => setActiveView('child')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'child' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
            }`}
          >
            Child Device
          </button>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
          >
            <span>Architecture &amp; Privacy</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggleInstantFreezeHeader}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md ${
              telemetry.isInstantlyLocked
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {telemetry.isInstantlyLocked ? (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Resume Child</span>
              </>
            ) : (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Instant Freeze</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Mobile Navigation Bar (visible on small screens) */}
        <div className="md:hidden flex items-center justify-around p-1.5 rounded-2xl bg-slate-900 border border-slate-800 mb-6 text-xs">
          <button
            onClick={() => setActiveView('dual')}
            className={`py-2 px-3 rounded-xl font-semibold transition ${
              activeView === 'dual' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Dual View
          </button>
          <button
            onClick={() => setActiveView('parent')}
            className={`py-2 px-3 rounded-xl font-semibold transition ${
              activeView === 'parent' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Parent
          </button>
          <button
            onClick={() => setActiveView('child')}
            className={`py-2 px-3 rounded-xl font-semibold transition ${
              activeView === 'child' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            Child Phone
          </button>
        </div>

        {/* Render Selected View */}
        {activeView === 'dual' && (
          <DualSimulatorView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            telemetry={telemetry}
            onUpdateTelemetry={handleUpdateTelemetry}
            auth={auth}
            onUpdateAuth={handleUpdateAuth}
            isParentUnlocked={isParentUnlocked}
            onToggleParentLock={setIsParentUnlocked}
          />
        )}

        {activeView === 'parent' && (
          <div className="py-4">
            <ParentDashboard
              config={config}
              onUpdateConfig={handleUpdateConfig}
              telemetry={telemetry}
              onUpdateTelemetry={handleUpdateTelemetry}
              auth={auth}
              onUpdateAuth={handleUpdateAuth}
              isUnlocked={isParentUnlocked}
              onToggleLock={setIsParentUnlocked}
            />
          </div>
        )}

        {activeView === 'child' && (
          <div className="py-4 flex flex-col items-center">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-white">Standalone Child Phone View</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                This is what your child sees on their phone: educational apps are unrestricted, while Reels and games enforce daily quotas and continuous cooldowns.
              </p>
            </div>
            <ChildDevice
              config={config}
              telemetry={telemetry}
              onUpdateTelemetry={handleUpdateTelemetry}
              sharedSecret={auth.sharedTokenSecret}
              isSimulatorView={false}
            />
          </div>
        )}
      </main>

      {/* Architecture & Privacy Modal */}
      {showPrivacyModal && (
        <PrivacyAndArchitectureModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500">
        <p>
          HavenScreen · Open-source local-first parental control architecture · Zero cloud data collection · No common email requirement
        </p>
      </footer>
    </div>
  );
}
