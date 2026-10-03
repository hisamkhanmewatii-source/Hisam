import React, { useState } from 'react';
import { Mic, Smartphone, Bell, Sparkles, Volume2, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { VoiceTranslator } from '../Translator/VoiceTranslator';
import { AlertCenter } from '../AlertCenter';
import { FoodItem, Medication } from '../../types';
import { calculateDaysLeft } from '../../utils/foodDatabase';
import { SupportedLanguage, getTranslation } from '../../utils/translations';
import { playButtonClickSound } from '../../utils/buttonSettings';

interface VoiceAndAlertsHubProps {
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  easyMode: boolean;
  foodItems: FoodItem[];
  medications: Medication[];
  initialSubTab?: 'voice' | 'alerts' | 'both';
}

export const VoiceAndAlertsHub: React.FC<VoiceAndAlertsHubProps> = ({
  currentLanguage,
  onChangeLanguage,
  easyMode,
  foodItems,
  medications,
  initialSubTab = 'voice',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'voice' | 'alerts' | 'both'>(initialSubTab);

  // Calculate quick notification counts
  const expiringFoodCount = foodItems.filter(
    (f) => !f.consumed && calculateDaysLeft(f.expirationDate) <= 3
  ).length;

  const dueMedsCount = medications.filter((m) => m.reminderEnabled && m.times.length > 0).length;

  const handleSubTabChange = (tab: 'voice' | 'alerts' | 'both') => {
    playButtonClickSound();
    setActiveSubTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Top Combined Hub Banner & Mode Selector */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                {currentLanguage === 'hi' ? 'एकीकृत केंद्र' : 'Unified Audio & Alert Hub'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{currentLanguage === 'hi' ? '🎙️ आवाज़, अनुवादक एवं 📲 फ़ोन अलर्ट' : '🎙️ Voice & Translator + 📲 Phone Alerts'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              {currentLanguage === 'hi'
                ? 'माइक में बोलकर अनुवाद करें, दवा व भोजन के फ़ोन पुश नोटिफ़िकेशन एवं सायरन अलार्म नियंत्रित करें।'
                : 'Microphone speech translation (English ⇄ Hindi) & instant phone push notifications for expiring groceries and pill times.'}
            </p>
          </div>

          {/* Quick Sub-Tab Navigation Bar */}
          <div className="bg-indigo-950/70 p-1.5 rounded-2xl border border-indigo-700/60 flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-inner">
            {/* Sub-Tab 1: Voice & Mic */}
            <button
              type="button"
              onClick={() => handleSubTabChange('voice')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'voice'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Mic className="w-4 h-4 text-pink-300" />
              <span>{currentLanguage === 'hi' ? 'आवाज़ व अनुवाद' : 'Voice & Translator'}</span>
            </button>

            {/* Sub-Tab 2: Phone Alerts */}
            <button
              type="button"
              onClick={() => handleSubTabChange('alerts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'alerts'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <span>{currentLanguage === 'hi' ? 'फ़ोन अलर्ट' : 'Phone Alerts'}</span>
              {(expiringFoodCount > 0 || dueMedsCount > 0) && (
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Sub-Tab 3: View Both */}
            <button
              type="button"
              onClick={() => handleSubTabChange('both')}
              className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-bold transition items-center gap-1.5 ${
                activeSubTab === 'both'
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{currentLanguage === 'hi' ? 'दोनों देखें' : 'View Both'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE VIEWS */}
      {activeSubTab === 'voice' && (
        <VoiceTranslator
          currentLanguage={currentLanguage}
          onChangeLanguage={onChangeLanguage}
          easyMode={easyMode}
        />
      )}

      {activeSubTab === 'alerts' && (
        <AlertCenter
          foodItems={foodItems}
          medications={medications}
          easyMode={easyMode}
          currentLanguage={currentLanguage}
        />
      )}

      {activeSubTab === 'both' && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-indigo-700" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                {currentLanguage === 'hi' ? '1. आवाज़ एवं अनुवादक (Voice & Translator)' : '1. Voice & Microphone Translator'}
              </h2>
            </div>
            <VoiceTranslator
              currentLanguage={currentLanguage}
              onChangeLanguage={onChangeLanguage}
              easyMode={easyMode}
            />
          </div>

          <div className="pt-6 border-t-2 border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-indigo-700" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                {currentLanguage === 'hi' ? '2. फ़ोन अलर्ट एवं सूचनाएं (Phone Alerts)' : '2. Phone Alerts & Push Notifications'}
              </h2>
            </div>
            <AlertCenter
              foodItems={foodItems}
              medications={medications}
              easyMode={easyMode}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>
      )}
    </div>
  );
};
