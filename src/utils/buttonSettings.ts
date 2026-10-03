// Button Adjuster Prototype Configuration & Audio Synthesizer

export type ButtonRadiusOption = 'rounded-md' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
export type ButtonThemeOption = 'emerald_clinical' | 'high_contrast' | 'royal_indigo' | 'warm_amber';
export type ButtonSosPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'mid-right'
  | 'mid-left';

export type ActionDeckPosition = 'floating-dock' | 'bottom-bar' | 'floating-island' | 'hidden';

export interface ButtonSettings {
  scale: number; // 0.9 to 1.45
  radius: ButtonRadiusOption;
  theme: ButtonThemeOption;
  fontWeight: 'font-semibold' | 'font-bold' | 'font-black';
  soundFeedback: boolean;
  voiceAnnouncement: boolean;
  borderWidth: number; // 0, 1, 2, 3
  elevation: 'none' | 'normal' | 'strong' | 'glow';
  sosPosition: ButtonSosPosition;
  sosOffsetX: number; // 12px to 80px
  sosOffsetY: number; // 12px to 120px
  actionDeckPosition: ActionDeckPosition;
  floatingDockOffsetY: number; // 0px to 60px
}

export const DEFAULT_BUTTON_SETTINGS: ButtonSettings = {
  scale: 1.05,
  radius: 'rounded-2xl',
  theme: 'emerald_clinical',
  fontWeight: 'font-black',
  soundFeedback: true,
  voiceAnnouncement: false,
  borderWidth: 1,
  elevation: 'normal',
  sosPosition: 'bottom-right',
  sosOffsetX: 24,
  sosOffsetY: 24,
  actionDeckPosition: 'hidden',
  floatingDockOffsetY: 12,
};

const STORAGE_KEY = 'freshguard_button_custom_settings';

export function loadButtonSettings(): ButtonSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_BUTTON_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Could not read button settings from storage:', err);
  }
  return DEFAULT_BUTTON_SETTINGS;
}

export function saveButtonSettings(settings: ButtonSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applyButtonSettingsToDOM(settings);
  } catch (err) {
    console.warn('Could not save button settings:', err);
  }
}

// Applies CSS variables to document.documentElement
export function applyButtonSettingsToDOM(settings: ButtonSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--app-btn-scale', `${settings.scale}`);
  
  const radiusMap: Record<ButtonRadiusOption, string> = {
    'rounded-md': '0.375rem',
    'rounded-xl': '0.75rem',
    'rounded-2xl': '1rem',
    'rounded-full': '9999px',
  };
  root.style.setProperty('--app-btn-radius', radiusMap[settings.radius] || '1rem');
  root.style.setProperty('--app-btn-border-width', `${settings.borderWidth}px`);

  // High contrast class toggle
  if (settings.theme === 'high_contrast') {
    document.body.classList.add('app-high-contrast');
  } else {
    document.body.classList.remove('app-high-contrast');
  }
}

// Lightweight Web Audio API Synthesizer for tactile button clicks
let audioCtx: AudioContext | null = null;

export function playButtonClickSound(frequency = 600, type: OscillatorType = 'sine'): void {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {
    // Audio context may be restricted before user gesture
  }
}
