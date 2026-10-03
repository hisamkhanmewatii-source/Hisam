import React, { useEffect, useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  Volume2,
  X,
  Sparkles,
  Pill,
  Leaf,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Medication, TimeOfDay } from '../../types';
import { speakText } from '../../utils/voiceService';
import { playButtonClickSound } from '../../utils/buttonSettings';
import { SupportedLanguage } from '../../utils/translations';
import confetti from 'canvas-confetti';

interface ActiveDoseAlertBannerProps {
  medication: Medication;
  slot: TimeOfDay;
  onTakeDose: (medId: string, slot: TimeOfDay) => void;
  onSnooze: (medId: string, minutes: number) => void;
  onDismiss: () => void;
  currentLanguage?: SupportedLanguage;
}

export const ActiveDoseAlertBanner: React.FC<ActiveDoseAlertBannerProps> = ({
  medication,
  slot,
  onTakeDose,
  onSnooze,
  onDismiss,
  currentLanguage = 'en',
}) => {
  const isSupplement = medication.category === 'supplement';

  const handleTake = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.2 },
      });
    } catch {}
    playButtonClickSound(800);
    onTakeDose(medication.id, slot);
  };

  const handleSnooze = (minutes: number) => {
    playButtonClickSound();
    onSnooze(medication.id, minutes);
    speakText(
      currentLanguage === 'hi'
        ? `अलर्ट ${minutes} मिनट के लिए स्नूज़ कर दिया गया है।`
        : `Reminder snoozed for ${minutes} minutes.`,
      currentLanguage
    );
  };

  const handleListen = () => {
    const text =
      currentLanguage === 'hi'
        ? `समय हो गया है: ${isSupplement ? 'सप्लीमेंट' : 'दवा'} ${medication.name}, खुराक ${medication.dosage}। ${
            medication.foodRule === 'with_meal' ? 'कृपया भोजन के साथ लें।' : ''
          }`
        : `Time for your ${isSupplement ? 'supplement' : 'medication'}: ${medication.name}, dosage ${medication.dosage}. ${
            medication.foodRule === 'with_meal' ? 'Take with food or a meal.' : ''
          }`;
    speakText(text, currentLanguage);
  };

  return (
    <div
      role="alert"
      className={`rounded-2xl p-4 sm:p-5 shadow-xl border-2 transition-all animate-in slide-in-from-top-4 duration-300 ${
        isSupplement
          ? 'bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 border-emerald-400 text-white'
          : 'bg-gradient-to-r from-indigo-950 via-blue-900 to-indigo-900 border-blue-400 text-white'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info Column */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-2xl shrink-0 shadow-md ${
              isSupplement ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
            }`}
          >
            {isSupplement ? (
              <Leaf className="w-7 h-7 text-emerald-400 animate-bounce" />
            ) : (
              <Pill className="w-7 h-7 text-blue-400 animate-bounce" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isSupplement
                    ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                    : 'bg-blue-400/20 text-blue-200 border border-blue-400/30'
                }`}
              >
                {isSupplement
                  ? currentLanguage === 'hi'
                    ? '🌿 स्वास्थ्य सप्लीमेंट देय'
                    : '🌿 Health Supplement Due Now'
                  : currentLanguage === 'hi'
                  ? '💊 दवा का समय'
                  : '💊 Prescription Medicine Due Now'}
              </span>

              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-yellow-300" />
                <span>{slot.toUpperCase()} DOSE</span>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{medication.name}</span>
              <span className="text-sm font-semibold opacity-90 px-2 py-0.5 rounded-md bg-white/10">
                {medication.dosage}
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-200">
              {medication.purpose || 'Scheduled health intake'} •{' '}
              <span className="font-bold text-yellow-200">
                {medication.foodRule === 'with_meal'
                  ? '🍽️ Take with meal'
                  : medication.foodRule === 'empty_stomach'
                  ? '💧 Empty stomach'
                  : '🍏 Flexible timing'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          {/* Audio helper */}
          <button
            type="button"
            onClick={handleListen}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
            title="Read reminder in voice"
          >
            <Volume2 className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">
              {currentLanguage === 'hi' ? 'सुनें' : 'Listen'}
            </span>
          </button>

          {/* Snooze 10 min */}
          <button
            type="button"
            onClick={() => handleSnooze(10)}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1 border border-white/20 active:scale-95"
            title="Snooze reminder for 10 minutes"
          >
            <RotateCcw className="w-3.5 h-3.5 text-yellow-300" />
            <span>{currentLanguage === 'hi' ? '10 मिनट बाद' : 'Snooze 10m'}</span>
          </button>

          {/* Mark as Taken */}
          <button
            type="button"
            onClick={handleTake}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{currentLanguage === 'hi' ? 'ले ली (Mark Taken)' : 'Take Dose Now'}</span>
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
