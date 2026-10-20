/**
 * Cryptographic helpers, offline token generation, and local-first storage.
 * 100% on-device: zero data leaves the browser.
 */

import { AppCategory, CategoryRule, HavenApp, ParentSecurityConfig, SystemConfig, ChildTelemetry } from '../types';

const RECOVERY_WORD_POOL = [
  'apple', 'beacon', 'canyon', 'dolphin', 'echo', 'forest', 'galaxy', 'harbor',
  'island', 'jupiter', 'kinetic', 'lagoon', 'meadow', 'nebula', 'oasis', 'planet',
  'quantum', 'river', 'solar', 'timber', 'umbrella', 'valley', 'whisper', 'zenith',
  'amber', 'breeze', 'cedar', 'delta', 'eagle', 'falcon', 'glacier', 'horizon'
];

export const DEFAULT_RULES: Record<AppCategory, CategoryRule> = {
  reels: {
    category: 'reels',
    name: 'Short-Form Reels & Shorts',
    dailyLimitMinutes: 30,
    maxContinuousMinutes: 15,
    cooldownMinutes: 20,
    isRestricted: true,
    isUnlimited: false,
  },
  games: {
    category: 'games',
    name: 'Video Games & Arcade',
    dailyLimitMinutes: 45,
    maxContinuousMinutes: 25,
    cooldownMinutes: 15,
    isRestricted: true,
    isUnlimited: false,
  },
  education: {
    category: 'education',
    name: 'Educational & Creative',
    dailyLimitMinutes: 0,
    maxContinuousMinutes: 0,
    cooldownMinutes: 0,
    isRestricted: false,
    isUnlimited: true,
  },
  essential: {
    category: 'essential',
    name: 'Essentials & Communication',
    dailyLimitMinutes: 0,
    maxContinuousMinutes: 0,
    cooldownMinutes: 0,
    isRestricted: false,
    isUnlimited: true,
  },
};

export const DEFAULT_APPS: HavenApp[] = [
  // Short-form Reels & Shorts
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    category: 'reels',
    iconName: 'Instagram',
    publisher: 'Social Feed',
    description: 'Infinite video reel player',
    isAllowed: true,
    simulatedType: 'reels',
    dailyMinutesUsed: 12,
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    category: 'reels',
    iconName: 'Youtube',
    publisher: 'Video Network',
    description: 'Fast vertical video clips',
    isAllowed: true,
    simulatedType: 'shorts',
    dailyMinutesUsed: 9,
  },
  {
    id: 'tiktok_feed',
    name: 'TikTok Feed',
    category: 'reels',
    iconName: 'Film',
    publisher: 'Video Stream',
    description: 'Short dynamic video feed',
    isAllowed: false,
    simulatedType: 'reels',
    dailyMinutesUsed: 0,
  },
  // Gaming
  {
    id: 'roblox_game',
    name: 'Block World 3D',
    category: 'games',
    iconName: 'Gamepad2',
    publisher: 'Game Studio',
    description: 'Online sandbox game',
    isAllowed: true,
    simulatedType: 'game',
    dailyMinutesUsed: 22,
  },
  {
    id: 'subway_runner',
    name: 'Subway Sprint',
    category: 'games',
    iconName: 'Zap',
    publisher: 'Action Games',
    description: 'Endless runner track',
    isAllowed: true,
    simulatedType: 'game',
    dailyMinutesUsed: 14,
  },
  {
    id: 'brawl_battle',
    name: 'Super Arena',
    category: 'games',
    iconName: 'Trophy',
    publisher: 'Arcade Team',
    description: 'Action multiplayer arena',
    isAllowed: true,
    simulatedType: 'game',
    dailyMinutesUsed: 0,
  },
  // Educational & Creative (Always Accessible / Whitelisted)
  {
    id: 'khan_academy',
    name: 'Khan Academy',
    category: 'education',
    iconName: 'GraduationCap',
    publisher: 'Khan Learning',
    description: 'Interactive STEM & humanities courses',
    isAllowed: true,
    simulatedType: 'education',
    dailyMinutesUsed: 35,
  },
  {
    id: 'duolingo_app',
    name: 'Duolingo Spanish',
    category: 'education',
    iconName: 'Languages',
    publisher: 'Duolingo Labs',
    description: 'Gamified language learning bite-sized lessons',
    isAllowed: true,
    simulatedType: 'education',
    dailyMinutesUsed: 20,
  },
  {
    id: 'code_sandbox',
    name: 'Python Sandbox',
    category: 'education',
    iconName: 'Code',
    publisher: 'CodeEd Open Source',
    description: 'Interactive logic & algorithm builder',
    isAllowed: true,
    simulatedType: 'education',
    dailyMinutesUsed: 15,
  },
  {
    id: 'wikipedia_reader',
    name: 'Wikipedia Reader',
    category: 'education',
    iconName: 'BookOpen',
    publisher: 'Wikimedia',
    description: 'Comprehensive encyclopedia knowledge',
    isAllowed: true,
    simulatedType: 'education',
    dailyMinutesUsed: 10,
  },
  // Essentials
  {
    id: 'emergency_phone',
    name: 'Phone & Family Call',
    category: 'essential',
    iconName: 'PhoneCall',
    publisher: 'System Core',
    description: 'Emergency dials and direct parent calls',
    isAllowed: true,
    simulatedType: 'utility',
    dailyMinutesUsed: 2,
  },
  {
    id: 'calculator_tool',
    name: 'Scientific Calculator',
    category: 'essential',
    iconName: 'Calculator',
    publisher: 'System Tools',
    description: 'Math computations & formulas',
    isAllowed: true,
    simulatedType: 'utility',
    dailyMinutesUsed: 4,
  },
];

export const INITIAL_CONFIG: SystemConfig = {
  rules: DEFAULT_RULES,
  apps: DEFAULT_APPS,
  earnedTimeRate: 2, // 2 mins of education unlocks 1 min of game
  bedtimeStart: '21:00',
  bedtimeEnd: '07:00',
  isBedtimeEnabled: true,
};

export const INITIAL_TELEMETRY: ChildTelemetry = {
  categorySecondsUsed: {
    reels: 21 * 60, // 21 minutes
    games: 36 * 60, // 36 minutes
    education: 80 * 60, // 80 minutes
    essential: 6 * 60,
  },
  activeAppId: null,
  activeSessionSeconds: 0,
  isInstantlyLocked: false,
  isBedtimeLocked: false,
  cooldownUntil: {
    reels: 0,
    games: 0,
    education: 0,
    essential: 0,
  },
  bonusMinutesEarned: 0,
  lastActiveTimestamp: Date.now(),
};

/**
 * Hash a 4-digit PIN using SHA-256 with salt
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}:havenscreen_security`);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate 12-word recovery mnemonic
 */
export function generateRecoveryWords(): string[] {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = Math.floor(Math.random() * RECOVERY_WORD_POOL.length);
    words.push(RECOVERY_WORD_POOL[idx]);
  }
  return words;
}

/**
 * Generate random 6-character sync code (e.g. "HV-8421")
 */
export function generatePairSyncCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `HS-${digits}`;
}

/**
 * Generate an offline 6-digit cryptographic bypass token
 * Based on shared secret + current date + bonus minutes
 * Can be validated on child device even if offline!
 */
export async function generateOfflineToken(sharedSecret: string, bonusMinutes: number): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hourBlock = Math.floor(new Date().getHours() / 2); // 2-hour validity window
  const payload = `${sharedSecret}-${dateStr}-${hourBlock}-${bonusMinutes}`;
  
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(payload));
  const hashArr = new Uint8Array(hashBuf);
  // Extract 6 digits from hash
  const num = ((hashArr[0] << 16) | (hashArr[1] << 8) | hashArr[2]) % 900000 + 100000;
  return num.toString();
}

/**
 * Validate an offline token on the child device
 */
export async function verifyOfflineToken(
  token: string,
  sharedSecret: string
): Promise<{ valid: boolean; bonusMinutes: number }> {
  // Test common bonus values: 15 mins, 30 mins, 60 mins
  for (const bonus of [15, 30, 60]) {
    const expected = await generateOfflineToken(sharedSecret, bonus);
    if (expected === token.trim()) {
      return { valid: true, bonusMinutes: bonus };
    }
  }
  return { valid: false, bonusMinutes: 0 };
}

// Local Storage Keys
const STORAGE_CONFIG_KEY = 'havenscreen_system_config';
const STORAGE_TELEMETRY_KEY = 'havenscreen_child_telemetry';
const STORAGE_AUTH_KEY = 'havenscreen_parent_auth';

export function loadStoredConfig(): SystemConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored config', e);
  }
  return INITIAL_CONFIG;
}

export function saveStoredConfig(config: SystemConfig): void {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config', e);
  }
}

export function loadStoredTelemetry(): ChildTelemetry {
  try {
    const raw = localStorage.getItem(STORAGE_TELEMETRY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse telemetry', e);
  }
  return INITIAL_TELEMETRY;
}

export function saveStoredTelemetry(telemetry: ChildTelemetry): void {
  try {
    localStorage.setItem(STORAGE_TELEMETRY_KEY, JSON.stringify(telemetry));
  } catch (e) {
    console.error('Failed to save telemetry', e);
  }
}

export async function loadOrCreateAuth(): Promise<ParentSecurityConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse auth', e);
  }

  // Initial default PIN: 1234
  const defaultSalt = 'haven_salt_' + Math.random().toString(36).substring(2, 9);
  const defaultPinHash = await hashPin('1234', defaultSalt);
  const initialAuth: ParentSecurityConfig = {
    pinHash: defaultPinHash,
    salt: defaultSalt,
    recoveryWords: generateRecoveryWords(),
    isConfigured: true,
    pairSyncCode: generatePairSyncCode(),
    sharedTokenSecret: 'haven_secret_' + Math.random().toString(36).substring(2, 10),
  };
  localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(initialAuth));
  return initialAuth;
}

export function saveAuth(auth: ParentSecurityConfig): void {
  try {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(auth));
  } catch (e) {
    console.error('Failed to save auth', e);
  }
}
