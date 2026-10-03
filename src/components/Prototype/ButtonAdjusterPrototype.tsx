import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Check,
  RotateCcw,
  ShieldAlert,
  Mic,
  MicOff,
  Pause,
  Play,
  Send,
  Plus,
  Heart,
  Pill,
  Apple,
  X,
  CheckCircle2,
  Sun,
  Flame,
  Zap,
  LayoutGrid,
  Smartphone,
  Move,
} from 'lucide-react';
import {
  ButtonSettings,
  DEFAULT_BUTTON_SETTINGS,
  ButtonRadiusOption,
  ButtonThemeOption,
  ButtonSosPosition,
  ActionDeckPosition,
  playButtonClickSound,
} from '../../utils/buttonSettings';
import { SupportedLanguage } from '../../utils/translations';
import { speakText } from '../../utils/voiceService';
import confetti from 'canvas-confetti';

interface ButtonAdjusterPrototypeProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ButtonSettings;
  onUpdateSettings: (newSettings: ButtonSettings) => void;
  currentLanguage: SupportedLanguage;
}

export const ButtonAdjusterPrototype: React.FC<ButtonAdjusterPrototypeProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentLanguage,
}) => {
  const [localSettings, setLocalSettings] = useState<ButtonSettings>(settings);
  const [testMicState, setTestMicState] = useState<'idle' | 'listening' | 'paused'>('idle');
  const [testMedTaken, setTestMedTaken] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  if (!isOpen) return null;

  const handleTestClick = (actionName: string, speechText?: string) => {
    if (localSettings.soundFeedback) {
      playButtonClickSound();
    }
    if (localSettings.voiceAnnouncement) {
      speakText(
        speechText || (currentLanguage === 'hi' ? `${actionName} बटन दबाया गया` : `${actionName} button tapped`),
        currentLanguage
      );
    }
  };

  const handleApplyGlobal = () => {
    onUpdateSettings(localSettings);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    if (localSettings.soundFeedback) playButtonClickSound(800);
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 2500);
    speakText(
      currentLanguage === 'hi'
        ? 'सभी बटन सफलतापूर्वक अपडेट और लागू कर दिए गए हैं।'
        : 'All button styles applied globally across the app.',
      currentLanguage
    );
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_BUTTON_SETTINGS);
    onUpdateSettings(DEFAULT_BUTTON_SETTINGS);
    if (localSettings.soundFeedback) playButtonClickSound(450);
  };

  // Preset Profiles
  const applyPreset = (presetName: 'senior' | 'modern' | 'high_contrast' | 'compact') => {
    let preset: ButtonSettings;
    switch (presetName) {
      case 'senior':
        preset = {
          ...DEFAULT_BUTTON_SETTINGS,
          scale: 1.3,
          radius: 'rounded-2xl',
          theme: 'emerald_clinical',
          fontWeight: 'font-black',
          soundFeedback: true,
          voiceAnnouncement: true,
          borderWidth: 2,
          elevation: 'strong',
          sosPosition: 'bottom-right',
        };
        break;
      case 'high_contrast':
        preset = {
          ...DEFAULT_BUTTON_SETTINGS,
          scale: 1.25,
          radius: 'rounded-xl',
          theme: 'high_contrast',
          fontWeight: 'font-black',
          soundFeedback: true,
          voiceAnnouncement: true,
          borderWidth: 3,
          elevation: 'glow',
          sosPosition: 'bottom-right',
        };
        break;
      case 'modern':
        preset = {
          ...DEFAULT_BUTTON_SETTINGS,
          scale: 1.05,
          radius: 'rounded-2xl',
          theme: 'royal_indigo',
          fontWeight: 'font-bold',
          soundFeedback: true,
          voiceAnnouncement: false,
          borderWidth: 1,
          elevation: 'normal',
          sosPosition: 'bottom-right',
        };
        break;
      case 'compact':
        preset = {
          ...DEFAULT_BUTTON_SETTINGS,
          scale: 0.95,
          radius: 'rounded-md',
          theme: 'emerald_clinical',
          fontWeight: 'font-semibold',
          soundFeedback: false,
          voiceAnnouncement: false,
          borderWidth: 1,
          elevation: 'none',
          sosPosition: 'bottom-right',
        };
        break;
    }
    setLocalSettings(preset);
    onUpdateSettings(preset);
    if (preset.soundFeedback) playButtonClickSound(700);
    confetti({ particleCount: 25, spread: 50 });
  };

  // Style generators for testing sandbox
  const getRadiusClass = (r: ButtonRadiusOption) => {
    switch (r) {
      case 'rounded-md':
        return 'rounded-md';
      case 'rounded-xl':
        return 'rounded-xl';
      case 'rounded-2xl':
        return 'rounded-2xl';
      case 'rounded-full':
        return 'rounded-full';
    }
  };

  const getThemeClass = (theme: ButtonThemeOption) => {
    switch (theme) {
      case 'emerald_clinical':
        return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-600/20';
      case 'high_contrast':
        return 'bg-black text-yellow-300 border-2 border-yellow-400 shadow-yellow-400/30';
      case 'royal_indigo':
        return 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-600/20';
      case 'warm_amber':
        return 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-amber-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl border-2 border-slate-200 my-auto space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-teal-600 to-cyan-700 text-white rounded-2xl shadow-md shadow-teal-600/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentLanguage === 'hi'
                    ? 'बटन एडजस्ट प्रोटोटाइप (Button Adjuster)'
                    : 'Button Adjuster Prototype & Control Lab'}
                </h2>
                <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-black uppercase rounded-full">
                  Live Sandbox
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                {currentLanguage === 'hi'
                  ? 'सभी बटनों का साइज़, आकार, कंट्रास्ट, ध्वनि एवं टच फीडबैक लाइव बदलें और टेस्ट करें।'
                  : 'Customize size, shape, contrast, sound feedback & voice readouts for all buttons across the app.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-TAP PRESET PROFILES */}
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
            {currentLanguage === 'hi' ? '⚡ त्वरित प्रीसेट प्रोफाइल (1-Tap Presets):' : '⚡ 1-Tap Quick Presets:'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('senior')}
              className="p-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition active:scale-95"
            >
              <span className="text-xs font-black text-emerald-950 block">👵 Senior Care (Jumbo)</span>
              <span className="text-[10px] text-emerald-800">130% Size • Bold • Voice Readout</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('high_contrast')}
              className="p-3 rounded-2xl border-2 border-yellow-400 bg-black text-left transition active:scale-95"
            >
              <span className="text-xs font-black text-yellow-300 block">👁️ High Contrast AAA</span>
              <span className="text-[10px] text-yellow-100">Deep Black & Neon Yellow</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('modern')}
              className="p-3 rounded-2xl border-2 border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-left transition active:scale-95"
            >
              <span className="text-xs font-black text-indigo-950 block">📱 Modern Indigo</span>
              <span className="text-[10px] text-indigo-700">Smooth 105% • Royal Indigo</span>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('compact')}
              className="p-3 rounded-2xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-left transition active:scale-95"
            >
              <span className="text-xs font-black text-slate-800 block">⚡ Compact Standard</span>
              <span className="text-[10px] text-slate-600">95% Size • Clean & Minimal</span>
            </button>
          </div>
        </div>

        {/* CONTROLS SLIDERS & OPTIONS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50 rounded-3xl border border-slate-200 text-xs">
          {/* 1. Button Size Scale Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                {currentLanguage === 'hi' ? 'बटन का आकार (Button Size Scale)' : 'Button Size & Padding Scale'}
              </span>
              <span className="font-black text-teal-700 bg-teal-100 px-2 py-0.5 rounded-lg text-xs">
                {Math.round(localSettings.scale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.90"
              max="1.45"
              step="0.05"
              value={localSettings.scale}
              onChange={(e) => {
                const s = parseFloat(e.target.value);
                setLocalSettings({ ...localSettings, scale: s });
                handleTestClick('Scale Adjust');
              }}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold">
              <span>Compact (90%)</span>
              <span>Standard (105%)</span>
              <span>Jumbo Senior (145%)</span>
            </div>
          </div>

          {/* 2. Corner Curvature (Shape) */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              {currentLanguage === 'hi' ? 'बटन का कोना / आकार (Corner Shape)' : 'Corner Curvature (Shape)'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'rounded-md' as const, label: 'Sharp (6px)' },
                { id: 'rounded-xl' as const, label: 'Soft (12px)' },
                { id: 'rounded-2xl' as const, label: 'Deep (16px)' },
                { id: 'rounded-full' as const, label: 'Pill Oval' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setLocalSettings({ ...localSettings, radius: r.id });
                    handleTestClick('Corner Shape');
                  }}
                  className={`py-2 px-1 text-center font-bold text-[11px] border transition ${
                    localSettings.radius === r.id
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  } ${r.id}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Theme & Contrast Palette */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              {currentLanguage === 'hi' ? 'कलर थीम एवं कंट्रास्ट (Theme)' : 'Color & Contrast Theme'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'emerald_clinical' as const, label: '🌿 Emerald Clinical', bg: 'bg-emerald-600 text-white' },
                { id: 'high_contrast' as const, label: '👁️ High Contrast (AAA)', bg: 'bg-black text-yellow-300 border-yellow-400' },
                { id: 'royal_indigo' as const, label: '👑 Royal Indigo', bg: 'bg-indigo-600 text-white' },
                { id: 'warm_amber' as const, label: '🌅 Warm Amber', bg: 'bg-amber-600 text-white' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setLocalSettings({ ...localSettings, theme: t.id });
                    handleTestClick('Theme');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-left font-bold text-xs border transition flex items-center justify-between ${
                    localSettings.theme === t.id
                      ? 'ring-2 ring-teal-500 shadow-md ' + t.bg
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.label}</span>
                  {localSettings.theme === t.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Font Weight & Border Width */}
          <div className="space-y-3">
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1.5">
                {currentLanguage === 'hi' ? 'अक्षरों की मोटाई (Font Weight)' : 'Font Weight / Boldness'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'font-semibold' as const, label: 'Semibold' },
                  { id: 'font-bold' as const, label: 'Bold' },
                  { id: 'font-black' as const, label: 'Ultra Black' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, fontWeight: f.id });
                      handleTestClick('Font Weight');
                    }}
                    className={`py-2 text-center text-xs border rounded-xl transition ${f.id} ${
                      localSettings.fontWeight === f.id
                        ? 'bg-teal-700 text-white border-teal-800'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Border thickness */}
            <div>
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-1.5">
                {currentLanguage === 'hi' ? 'बटन बॉर्डर मोटाई (Border Outline)' : 'Border Outline Thickness'}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { w: 0, label: 'None' },
                  { w: 1, label: '1px' },
                  { w: 2, label: '2px Bold' },
                  { w: 3, label: '3px High' },
                ].map((b) => (
                  <button
                    key={b.w}
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, borderWidth: b.w });
                      handleTestClick('Border Width');
                    }}
                    className={`py-1.5 text-center text-xs border rounded-xl font-bold transition ${
                      localSettings.borderWidth === b.w
                        ? 'bg-teal-700 text-white border-teal-800'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Audio & Voice Feedback Toggles */}
          <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              {currentLanguage === 'hi' ? 'ध्वनि एवं टच फीडबैक (Sound & Voice Assistance)' : 'Sound & Voice Feedback Assistance'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sound Click */}
              <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-300 cursor-pointer hover:bg-slate-50 transition">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      {currentLanguage === 'hi' ? 'क्लिक ध्वनि (Audio Click Feedback)' : 'Tactile Click Sound'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {currentLanguage === 'hi' ? 'बटन दबाने पर स्पष्ट आवाज़' : 'Crisp audio synthesizer click on tap'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.soundFeedback}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, soundFeedback: e.target.checked });
                    if (e.target.checked) playButtonClickSound();
                  }}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
              </label>

              {/* Voice Readout */}
              <label className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-300 cursor-pointer hover:bg-slate-50 transition">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      {currentLanguage === 'hi' ? 'आवाज़ में बटन का नाम बोलना (Voice Announce)' : 'Spoken Voice Announcement'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {currentLanguage === 'hi' ? 'बुजुर्गों के लिए बटन का नाम बोलता है' : 'Reads button action aloud for elderly users'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.voiceAnnouncement}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, voiceAnnouncement: e.target.checked });
                    if (e.target.checked) {
                      speakText(
                        currentLanguage === 'hi' ? 'आवाज़ सहायता चालू है' : 'Voice announcements enabled',
                        currentLanguage
                      );
                    }
                  }}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* 6. APP FRAME POSITION ADJUSTER & INTERACTIVE MINIMAP */}
          <div className="space-y-4 md:col-span-2 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-teal-600" />
                <span className="font-black text-slate-800 uppercase tracking-wider text-xs">
                  {currentLanguage === 'hi'
                    ? 'ऐप फ्रेम में बटनों की स्थिति (App Frame Position & Minimap)'
                    : 'App Frame Position Adjuster & Interactive Minimap'}
                </span>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                SOS: {localSettings.sosPosition} ({localSettings.sosOffsetX}px X, {localSettings.sosOffsetY}px Y)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
              {/* Interactive Screen Wireframe Minimap */}
              <div className="bg-slate-900 rounded-2xl p-4 text-white border-2 border-slate-700 shadow-inner relative flex flex-col justify-between h-56 select-none">
                {/* Mini App Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400">
                  <span className="font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Mohammed Hisam Health
                  </span>
                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">App Frame Wireframe</span>
                </div>

                {/* 7 Position Click Targets Inside Minimap */}
                <div className="relative flex-1 my-1 flex items-center justify-center">
                  {/* Top-Left */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'top-left' });
                      handleTestClick('Top-Left Anchor', 'आपातकालीन बटन ऊपर बाईं तरफ');
                    }}
                    className={`absolute top-1 left-1 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'top-left'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Top Left"
                  >
                    ↖️ Top-L
                  </button>

                  {/* Top-Right */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'top-right' });
                      handleTestClick('Top-Right Anchor', 'आपातकालीन बटन ऊपर दाईं तरफ');
                    }}
                    className={`absolute top-1 right-1 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'top-right'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Top Right"
                  >
                    ↗️ Top-R
                  </button>

                  {/* Mid-Left */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'mid-left' });
                      handleTestClick('Mid-Left Anchor', 'आपातकालीन बटन मध्य बाईं तरफ');
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 left-1 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'mid-left'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Mid Left"
                  >
                    ⬅️ Mid-L
                  </button>

                  {/* Center Mockup Info */}
                  <div className="text-center px-3 py-2 bg-slate-800/70 rounded-xl border border-slate-700/60 max-w-[190px]">
                    <p className="text-[11px] font-bold text-teal-400">
                      {currentLanguage === 'hi' ? 'स्क्रीन कोने को छुएं' : 'Tap any anchor to place SOS button'}
                    </p>
                    <p className="text-[9px] text-slate-300 mt-0.5">
                      Active: <span className="text-rose-400 font-bold uppercase">{localSettings.sosPosition}</span>
                    </p>
                  </div>

                  {/* Mid-Right */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'mid-right' });
                      handleTestClick('Mid-Right Anchor', 'आपातकालीन बटन मध्य दाईं तरफ');
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 right-1 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'mid-right'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Mid Right"
                  >
                    ➡️ Mid-R
                  </button>

                  {/* Bottom-Left */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'bottom-left' });
                      handleTestClick('Bottom-Left Anchor', 'आपातकालीन बटन नीचे बाईं तरफ');
                    }}
                    className={`absolute bottom-1 left-1 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'bottom-left'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Bottom Left"
                  >
                    ↙️ Btm-L
                  </button>

                  {/* Bottom-Center */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'bottom-center' });
                      handleTestClick('Bottom-Center Anchor', 'आपातकालीन बटन नीचे बीच में');
                    }}
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'bottom-center'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Bottom Center"
                  >
                    ⬇️ Btm-C
                  </button>

                  {/* Bottom-Right */}
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings({ ...localSettings, sosPosition: 'bottom-right' });
                      handleTestClick('Bottom-Right Anchor', 'आपातकालीन बटन नीचे दाईं तरफ');
                    }}
                    className={`absolute bottom-1 right-1 p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                      localSettings.sosPosition === 'bottom-right'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-110 shadow-lg z-10'
                        : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                    title="Bottom Right (Default)"
                  >
                    ↘️ Btm-R
                  </button>
                </div>

                {/* Mini Bottom Action Bar Indicator */}
                <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400 px-1">
                  <span>Dock Mode: <strong className="text-teal-400">{localSettings.actionDeckPosition}</strong></span>
                  <span className="text-emerald-400">Thumb Reach Safe Zone ✓</span>
                </div>
              </div>

              {/* Sliders & Dock Mode Settings */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-300">
                {/* Horizontal Offset X */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{currentLanguage === 'hi' ? 'किनारे से दूरी (Horizontal Offset X)' : 'Horizontal Edge Margin (X)'}</span>
                    <span className="text-teal-700 font-black">{localSettings.sosOffsetX} px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="80"
                    step="4"
                    value={localSettings.sosOffsetX}
                    onChange={(e) => setLocalSettings({ ...localSettings, sosOffsetX: parseInt(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>12px (Tight)</span>
                    <span>48px</span>
                    <span>80px (Inward)</span>
                  </div>
                </div>

                {/* Vertical Offset Y */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{currentLanguage === 'hi' ? 'नीचे/ऊपर से दूरी (Vertical Offset Y)' : 'Vertical Edge Margin (Y)'}</span>
                    <span className="text-teal-700 font-black">{localSettings.sosOffsetY} px</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="120"
                    step="4"
                    value={localSettings.sosOffsetY}
                    onChange={(e) => setLocalSettings({ ...localSettings, sosOffsetY: parseInt(e.target.value) })}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>12px (Bottom edge)</span>
                    <span>60px</span>
                    <span>120px (Elevated)</span>
                  </div>
                </div>

                {/* Action Deck Position Selector */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">
                    {currentLanguage === 'hi' ? 'त्वरित बॉटम बार डॉक स्थिति:' : 'Quick-Access Action Dock Position:'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { id: 'bottom-bar' as const, label: '📱 Bottom Bar (Sticky)' },
                      { id: 'floating-dock' as const, label: '💊 Floating Pill Dock' },
                      { id: 'floating-island' as const, label: '🏝️ Corner Island' },
                      { id: 'hidden' as const, label: '🚫 Hidden' },
                    ].map((dock) => (
                      <button
                        key={dock.id}
                        type="button"
                        onClick={() => {
                          setLocalSettings({ ...localSettings, actionDeckPosition: dock.id });
                          handleTestClick('Dock Mode', `डॉक स्थिति ${dock.label}`);
                        }}
                        className={`p-2 rounded-xl border text-left font-bold text-[11px] transition ${
                          localSettings.actionDeckPosition === dock.id
                            ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {dock.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LIVE INTERACTIVE BUTTON TESTING SANDBOX */}
        <div className="space-y-3 p-5 bg-white rounded-3xl border-2 border-dashed border-teal-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {currentLanguage === 'hi'
                  ? 'लाइव टेस्ट सैंडबॉक्स — बटनों को दबाकर देखें'
                  : 'Live Interactive Button Test Sandbox (Tap any button to test)'}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-bold">
              Scale: {Math.round(localSettings.scale * 100)}% • {localSettings.radius}
            </span>
          </div>

          {/* Test Buttons Row 1: Microphone Controls (User's Recent Feature!) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 uppercase">
              1. Voice Translator Microphone Controls:
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Record / Stop */}
              <button
                type="button"
                onClick={() => {
                  setTestMicState(testMicState === 'listening' ? 'idle' : 'listening');
                  handleTestClick(
                    testMicState === 'listening' ? 'Microphone Stopped' : 'Microphone Listening',
                    testMicState === 'listening' ? 'माइक बंद किया गया' : 'माइक शुरू हुआ'
                  );
                }}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )} ${
                  testMicState === 'listening'
                    ? 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                    : getThemeClass(localSettings.theme)
                }`}
              >
                {testMicState === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>
                  {testMicState === 'listening'
                    ? currentLanguage === 'hi' ? 'माइक बंद करें' : 'Stop Listening'
                    : currentLanguage === 'hi' ? '🎙️ माइक में बोलें' : '🎙️ Speak with Microphone'}
                </span>
              </button>

              {/* Pause Mic */}
              <button
                type="button"
                onClick={() => {
                  setTestMicState('paused');
                  handleTestClick('Mic Paused', 'माइक रोका गया');
                }}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )}`}
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>{currentLanguage === 'hi' ? 'माइक रोकें (⏸️)' : 'Pause Mic (⏸️)'}</span>
              </button>

              {/* Resume Mic */}
              <button
                type="button"
                onClick={() => {
                  setTestMicState('listening');
                  handleTestClick('Mic Resumed', 'माइक फिर से शुरू हुआ');
                }}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )}`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{currentLanguage === 'hi' ? 'फिर शुरू करें (▶️)' : 'Resume Mic (▶️)'}</span>
              </button>

              {/* Post & Translate */}
              <button
                type="button"
                onClick={() => {
                  setTestMicState('idle');
                  handleTestClick('Post and Translate', 'पोस्ट व अनुवाद किया गया');
                  confetti({ particleCount: 30, spread: 60 });
                }}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 text-white font-black text-xs transition shadow-lg shadow-indigo-600/25 active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )}`}
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>{currentLanguage === 'hi' ? 'पोस्ट व अनुवाद करें (🚀)' : 'Post & Translate (🚀)'}</span>
              </button>
            </div>
          </div>

          {/* Test Buttons Row 2: Medical & Food Buttons */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase">
              2. Clinical Healthcare & Medication Actions:
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Take Pill */}
              <button
                type="button"
                onClick={() => {
                  setTestMedTaken(!testMedTaken);
                  handleTestClick(
                    testMedTaken ? 'Medication un-taken' : 'Metformin Taken Successfully',
                    testMedTaken ? 'दवा का समय रीसेट' : 'मेटफ़ॉर्मिन दवा ले ली गई'
                  );
                }}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )} ${
                  testMedTaken
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {testMedTaken ? <CheckCircle2 className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                <span>
                  {testMedTaken
                    ? currentLanguage === 'hi' ? '✓ दवा ले ली' : '✓ Metformin Taken'
                    : currentLanguage === 'hi' ? 'दवा ली (Mark Taken)' : 'Take Dose'}
                </span>
              </button>

              {/* Add Food */}
              <button
                type="button"
                onClick={() => handleTestClick('Add Food Item', 'भोजन जोड़ने का मेनू')}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )}`}
              >
                <Plus className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'भोजन जोड़ें' : 'Add Food Item'}</span>
              </button>

              {/* SOS Emergency Button Test */}
              <button
                type="button"
                onClick={() => handleTestClick('Emergency SOS Alert', 'आपातकालीन सहायता अलर्ट')}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )}`}
              >
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span>{currentLanguage === 'hi' ? '🆘 आपातकाल (SOS)' : '🆘 Emergency SOS'}</span>
              </button>

              {/* Calorie Burn Counter Test */}
              <button
                type="button"
                onClick={() => handleTestClick('Calorie Burn Logged', '120 कैलोरी बर्न दर्ज')}
                style={{
                  transform: `scale(${localSettings.scale})`,
                  transformOrigin: 'left center',
                }}
                className={`py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-md active:scale-95 flex items-center gap-1.5 ${getRadiusClass(
                  localSettings.radius
                )}`}
              >
                <Flame className="w-4 h-4 text-white" />
                <span>{currentLanguage === 'hi' ? '🔥 120 कैलोरी बर्न' : '🔥 Burn 120 kcal'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{currentLanguage === 'hi' ? 'डिफ़ॉल्ट पर रीसेट करें' : 'Reset to Default'}</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {appliedNotice && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 animate-pulse">
                <Check className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'सफलतापूर्वक लागू हो गया!' : 'Applied globally!'}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleApplyGlobal}
              className="flex-1 sm:flex-initial py-3.5 px-7 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-black rounded-2xl text-sm shadow-xl shadow-teal-600/30 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>
                {currentLanguage === 'hi'
                  ? 'संपूर्ण ऐप पर लागू करें (Apply to All Buttons)'
                  : 'Apply to All Buttons Across App'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
