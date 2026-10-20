/**
 * HavenScreen Data Models & State Contracts
 * Local-First, Zero-Cloud Parental Screen Time Control
 */

export type AppCategory = 'reels' | 'games' | 'education' | 'essential';

export interface HavenApp {
  id: string;
  name: string;
  category: AppCategory;
  iconName: string;
  publisher: string;
  description: string;
  isAllowed: boolean;
  simulatedType: 'reels' | 'shorts' | 'game' | 'education' | 'utility';
  dailyMinutesUsed: number;
}

export interface CategoryRule {
  category: AppCategory;
  name: string;
  dailyLimitMinutes: number;
  maxContinuousMinutes: number;
  cooldownMinutes: number;
  isRestricted: boolean;
  isUnlimited: boolean;
}

export interface TimeRequest {
  id: string;
  childName: string;
  appId: string;
  appName: string;
  category: AppCategory;
  requestedMinutes: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  parentResponseNote?: string;
}

export interface RemoteCommand {
  id: string;
  type: 
    | 'INSTANT_LOCK'
    | 'UNLOCK'
    | 'ADD_BONUS_TIME'
    | 'UPDATE_CATEGORY_RULE'
    | 'TOGGLE_APP_ACCESS'
    | 'REQUEST_TIME'
    | 'RESOLVE_REQUEST'
    | 'SET_BEDTIME_MODE'
    | 'HEARTBEAT';
  payload?: any;
  timestamp: number;
}

export interface ChildTelemetry {
  categorySecondsUsed: Record<AppCategory, number>;
  activeAppId: string | null;
  activeSessionSeconds: number;
  isInstantlyLocked: boolean;
  isBedtimeLocked: boolean;
  cooldownUntil: Record<AppCategory, number>; // timestamps
  bonusMinutesEarned: number;
  lastActiveTimestamp: number;
}

export interface ParentSecurityConfig {
  pinHash: string;
  salt: string;
  recoveryWords: string[];
  isConfigured: boolean;
  pairSyncCode: string;
  sharedTokenSecret: string;
}

export interface SystemConfig {
  rules: Record<AppCategory, CategoryRule>;
  apps: HavenApp[];
  earnedTimeRate: number; // minutes of education needed to earn 1 minute of games (default 2)
  bedtimeStart: string; // "21:00"
  bedtimeEnd: string; // "07:00"
  isBedtimeEnabled: boolean;
}
