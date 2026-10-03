import React from 'react';
import {
  Mic,
  Camera,
  Plus,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { ButtonSettings, playButtonClickSound } from '../../utils/buttonSettings';
import { SupportedLanguage } from '../../utils/translations';
import { speakText } from '../../utils/voiceService';

interface QuickActionDockProps {
  settings: ButtonSettings;
  currentLanguage: SupportedLanguage;
  onOpenMic: () => void;
  onOpenScanCamera: () => void;
  onOpenSos?: () => void;
  onOpenAddFood: () => void;
  onOpenAdjustButtons: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  settings,
  currentLanguage,
  onOpenMic,
  onOpenScanCamera,
  onOpenSos,
  onOpenAddFood,
  onOpenAdjustButtons,
}) => {
  if (settings.actionDeckPosition === 'hidden') return null;

  const handleClick = (action: () => void, labelEn: string, labelHi: string) => {
    if (settings.soundFeedback) playButtonClickSound();
    if (settings.voiceAnnouncement) {
      speakText(currentLanguage === 'hi' ? labelHi : labelEn, currentLanguage);
    }
    action();
  };

  const isFloatingPill = settings.actionDeckPosition === 'floating-dock';
  const isIsland = settings.actionDeckPosition === 'floating-island';

  const containerClasses = isFloatingPill
    ? 'fixed left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-3 py-2 rounded-full shadow-2xl border-2 border-slate-200 ring-4 ring-black/5 flex items-center gap-2 max-w-sm sm:max-w-md w-auto'
    : isIsland
    ? 'fixed bottom-5 left-4 z-40 bg-white/95 backdrop-blur-md p-2 rounded-3xl shadow-2xl border-2 border-slate-200 flex flex-col items-center gap-2'
    : 'fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md px-3 py-2 border-t-2 border-slate-200 shadow-xl flex items-center justify-around max-w-lg mx-auto sm:rounded-t-3xl';

  const containerStyle: React.CSSProperties = isFloatingPill
    ? { bottom: `${settings.floatingDockOffsetY}px` }
    : {};

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* 1. Mic & Voice Translator */}
      <button
        type="button"
        onClick={() => handleClick(onOpenMic, 'Voice Translator', 'आवाज़ अनुवादक')}
        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex flex-col sm:flex-row items-center gap-1 transition active:scale-95 border border-indigo-200"
        title="Microphone & Voice Translator"
      >
        <Mic className="w-4 h-4 text-indigo-600" />
        <span className="text-[10px] sm:text-xs">
          {currentLanguage === 'hi' ? 'माइक' : 'Mic'}
        </span>
      </button>

      {/* 2. Scan Med */}
      <button
        type="button"
        onClick={() => handleClick(onOpenScanCamera, 'Scan Medicine', 'दवा स्कैन करें')}
        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex flex-col sm:flex-row items-center gap-1 transition active:scale-95 border border-blue-200"
        title="Scan Pill / Blister Pack"
      >
        <Camera className="w-4 h-4 text-blue-600" />
        <span className="text-[10px] sm:text-xs">
          {currentLanguage === 'hi' ? 'स्कैन' : 'Scan'}
        </span>
      </button>

      {/* 2b. SOS Option - Right side of camera */}
      {onOpenSos && (
        <button
          type="button"
          onClick={() => handleClick(onOpenSos, 'Emergency SOS', 'आपातकाल (SOS)')}
          className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex flex-col sm:flex-row items-center gap-1 transition active:scale-95 border border-rose-200"
          title="Emergency Medical SOS"
        >
          <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black">
            {currentLanguage === 'hi' ? 'SOS' : 'SOS'}
          </span>
        </button>
      )}

      {/* 3. Add Food */}
      <button
        type="button"
        onClick={() => handleClick(onOpenAddFood, 'Add Food', 'भोजन जोड़ें')}
        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex flex-col sm:flex-row items-center gap-1 transition active:scale-95 border border-emerald-200"
        title="Add Food Item"
      >
        <Plus className="w-4 h-4 text-emerald-700" />
        <span className="text-[10px] sm:text-xs">
          {currentLanguage === 'hi' ? 'भोजन' : 'Food'}
        </span>
      </button>

      {/* 4. Adjust Buttons (Prototype) */}
      <button
        type="button"
        onClick={() => handleClick(onOpenAdjustButtons, 'Adjust Buttons', 'बटन एडजस्ट करें')}
        className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex flex-col sm:flex-row items-center gap-1 transition active:scale-95 border border-teal-200"
        title="Adjust Buttons & Frame Positions"
      >
        <Sliders className="w-4 h-4 text-teal-700" />
        <span className="text-[10px] sm:text-xs">
          {currentLanguage === 'hi' ? 'पोजीशन' : 'Layout'}
        </span>
      </button>
    </div>
  );
};
