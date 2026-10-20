/**
 * Dual Simulator View
 * Side-by-side interactive simulation of Parent Phone and Child Phone
 * demonstrating instant remote control over local wireless sync without an email ID.
 */

import React from 'react';
import {
  SystemConfig,
  ChildTelemetry,
  ParentSecurityConfig,
} from '../types';
import { ParentDashboard } from './ParentDashboard';
import { ChildDevice } from './ChildDevice';
import {
  Radio,
  ArrowLeftRight,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';

interface DualSimulatorViewProps {
  config: SystemConfig;
  onUpdateConfig: (newConfig: SystemConfig) => void;
  telemetry: ChildTelemetry;
  onUpdateTelemetry: (telemetry: ChildTelemetry) => void;
  auth: ParentSecurityConfig;
  onUpdateAuth: (newAuth: ParentSecurityConfig) => void;
  isParentUnlocked: boolean;
  onToggleParentLock: (unlocked: boolean) => void;
}

export const DualSimulatorView: React.FC<DualSimulatorViewProps> = ({
  config,
  onUpdateConfig,
  telemetry,
  onUpdateTelemetry,
  auth,
  onUpdateAuth,
  isParentUnlocked,
  onToggleParentLock,
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Interactive Explanation Banner */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-white">Live Remote Control Active</p>
            <p className="text-slate-400 text-[11px]">
              Tap "Instant Freeze" on the parent dashboard to watch the child phone lock in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            No Shared Email Required
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-indigo-400">
            <Zap className="w-3.5 h-3.5" />
            Local P2P Sync
          </span>
        </div>
      </div>

      {/* Side-by-Side Dual Perspective Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Parent Controller (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Parent Controller
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Master Authority</span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800/80">
            <ParentDashboard
              config={config}
              onUpdateConfig={onUpdateConfig}
              telemetry={telemetry}
              onUpdateTelemetry={onUpdateTelemetry}
              auth={auth}
              onUpdateAuth={onUpdateAuth}
              isUnlocked={isParentUnlocked}
              onToggleLock={onToggleParentLock}
            />
          </div>
        </div>

        {/* Right Column: Child Device Simulator (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Child Protected Phone
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Enforcing Boundaries</span>
          </div>

          <div className="p-4 rounded-3xl bg-slate-950/60 border border-slate-800/80 flex justify-center">
            <ChildDevice
              config={config}
              telemetry={telemetry}
              onUpdateTelemetry={onUpdateTelemetry}
              sharedSecret={auth.sharedTokenSecret}
              isSimulatorView={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
