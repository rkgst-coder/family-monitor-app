/**
 * Privacy, Decentralization & Open-Source Architecture Documentation
 * Explains how this parental control system replaces big-tech common email
 * accounts with zero-telemetry cryptographic pairing and local enforcement.
 */

import React from 'react';
import {
  ShieldCheck,
  ServerOff,
  Code2,
  Lock,
  Layers,
  Sparkles,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const PrivacyAndArchitectureModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Private &amp; Decentralized Architecture</h3>
              <p className="text-xs text-slate-400">Zero-email requirement · Open-source transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 text-xs text-slate-300 leading-relaxed pr-1">
          {/* Section 1: The Email ID Dilemma */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <ServerOff className="w-4 h-4 text-rose-400" />
              Why We Eliminate The Common Email Account Requirement
            </h4>
            <p>
              Mainstream parental controls (like Google Family Link and Apple Screen Time) require you to create a corporate email account for your child and link it to your personal account in a centralized cloud tree. This subjects your child's app usage to cloud tracking, telemetry harvesting, and remote profiling.
            </p>
            <p className="text-emerald-400 font-medium">
              HavenScreen eliminates this: parents and children pair devices directly using local cryptographic keys (<span className="font-mono text-white">Pair Sync Codes</span> or local network discovery). No Google account, no Apple ID, and no third-party account is ever needed.
            </p>
          </div>

          {/* Section 2: How Remote Control Works Without A Server */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Direct Peer-to-Peer Remote Control
            </h4>
            <p>
              When both parent and child are on home Wi-Fi or local network, parent commands (such as <strong className="text-white">Instant Screen Freeze</strong>, <strong className="text-white">Quota Adjustments</strong>, and <strong className="text-white">Approval of Extension Requests</strong>) transmit directly between the devices with end-to-end encryption.
            </p>
            <p>
              If devices are off-grid or away from Wi-Fi, the parent phone acts as a cryptographic token generator, creating time-stamped 6-digit emergency bypass codes that the child enters directly on their device.
            </p>
          </div>

          {/* Section 3: Reels & Short-Form Dopamine Cooldown Engine */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Continuous Binge Limiting (Shorts &amp; Reels Protection)
            </h4>
            <p>
              Standard parental timers only set flat daily limits (e.g. 1 hour). A child often burns that entire hour in one continuous 60-minute binge of YouTube Shorts or Instagram Reels.
            </p>
            <p>
              HavenScreen implements <strong className="text-white">Continuous Session Cooldowns</strong>: after 15 minutes of uninterrupted scrolling, the app requires a mandatory 20-minute break. This prevents algorithmic dopamine lock-in while keeping educational resources completely unrestricted.
            </p>
          </div>

          {/* Section 4: Open Source Verification & Android APK Deployment */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-teal-400" />
              Clean Open-Source Stack &amp; Self-Hosting
            </h4>
            <p>
              The system is built on standard Web APIs (<span className="font-mono text-slate-200">BroadcastChannel, SubtleCrypto, IndexedDB, ServiceWorker PWA</span>) and can be packaged into an Android Device Admin launcher or run directly in browser kiosk mode. All configuration profiles can be exported and imported as clean, human-readable JSON files.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Open-Source Architecture · Zero Telemetry
          </span>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
