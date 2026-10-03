import React from 'react';
import {
  Apple,
  Pill,
  Utensils,
  ChefHat,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ShieldAlert,
  Eye,
  Smartphone,
  Camera,
  Activity,
  Languages,
  Globe,
  Heart,
  Sliders,
  HardDrive,
} from 'lucide-react';
import { TimeOfDay } from '../types';
import { getTimeOfDayLabel, getTimeOfDayIcon } from '../utils/notificationService';
import { speakText, setVoiceLanguage } from '../utils/voiceService';
import { MedicalLogo } from './Branding/MedicalLogo';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
  formatGreetingSpeech,
} from '../utils/translations';

interface HeaderProps {
  currentTab: 'inventory' | 'medications' | 'meals_recipes' | 'symptoms' | 'diabetes' | 'voice_alerts' | 'google_drive';
  onTabChange: (tab: 'inventory' | 'medications' | 'meals_recipes' | 'symptoms' | 'diabetes' | 'voice_alerts' | 'google_drive') => void;
  easyMode: boolean;
  onToggleEasyMode: () => void;
  dueMedsCount: number;
  expiringFoodCount: number;
  savedDollars: number;
  currentSlot: TimeOfDay;
  onOpenScanCamera?: () => void;
  onOpenSos?: () => void;
  onOpenButtonAdjuster?: () => void;
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  easyMode,
  onToggleEasyMode,
  dueMedsCount,
  expiringFoodCount,
  savedDollars,
  currentSlot,
  onOpenScanCamera,
  onOpenSos,
  onOpenButtonAdjuster,
  currentLanguage,
  onChangeLanguage,
}) => {
  const todayFormatted = new Intl.DateTimeFormat(
    currentLanguage === 'hi' ? 'hi-IN' : 'en-US',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  ).format(new Date());

  const handleReadAppSummary = () => {
    const greeting = formatGreetingSpeech(
      currentLanguage,
      getTimeOfDayLabel(currentSlot),
      dueMedsCount,
      expiringFoodCount
    );
    speakText(greeting, currentLanguage);
  };

  const navItems = [
    {
      id: 'inventory' as const,
      label: getTranslation('navFood', currentLanguage),
      icon: Apple,
      badge: expiringFoodCount > 0 ? expiringFoodCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'medications' as const,
      label: getTranslation('navMeds', currentLanguage),
      icon: Pill,
      badge: dueMedsCount > 0 ? dueMedsCount : undefined,
      badgeColor: 'bg-blue-600 animate-pulse',
    },
    {
      id: 'meals_recipes' as const,
      label: getTranslation('navMealsAndRecipes', currentLanguage),
      icon: Utensils,
      badge: currentLanguage === 'hi' ? 'मात्रा+रेसिपी' : 'Meals & Recipes',
      badgeColor: 'bg-amber-600',
    },
    {
      id: 'symptoms' as const,
      label: getTranslation('navSymptoms', currentLanguage),
      icon: Activity,
    },
    {
      id: 'diabetes' as const,
      label: getTranslation('navDiabetes', currentLanguage),
      icon: Heart,
      badge: currentLanguage === 'hi' ? 'शुगर' : 'Sugar',
      badgeColor: 'bg-teal-600',
    },
    {
      id: 'voice_alerts' as const,
      label: getTranslation('navVoiceAndAlerts', currentLanguage),
      icon: Languages,
      badge: currentLanguage === 'hi' ? 'आवाज़+अलर्ट' : 'Voice & Alerts',
      badgeColor: 'bg-purple-600',
    },
    {
      id: 'google_drive' as const,
      label: currentLanguage === 'hi' ? 'गूगल ड्राइव' : 'Google Drive',
      icon: HardDrive,
      badge: 'Cloud',
      badgeColor: 'bg-blue-600',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Subtitle: Health+Online with Medical Logo */}
        <div className="flex items-center gap-3">
          <MedicalLogo size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight flex items-center text-slate-900">
                <span>Health</span>
                <span className="text-rose-600 font-black text-2xl mx-0.5 leading-none drop-shadow-xs">+</span>
                <span className="text-emerald-700">Online</span>
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                {getTranslation('safeFoodMeds', currentLanguage)}
              </span>
            </div>
            <p className="text-xs text-slate-600 hidden sm:block">
              {getTranslation('appSubtitle', currentLanguage)}
            </p>
          </div>
        </div>

        {/* Right Info Controls: Language Switcher, Camera, Date, Slot & Easy Mode Switch */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Language Toggle Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
            <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 hidden xs:block" />
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onChangeLanguage(lang.code);
                  setVoiceLanguage(lang.code);
                  speakText(
                    lang.code === 'hi'
                      ? 'भाषा हिन्दी में बदल दी गई है।'
                      : 'Language set to English.',
                    lang.code
                  );
                }}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  currentLanguage === lang.code
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={`Switch language to ${lang.label}`}
              >
                <span>{lang.flag}</span>
                <span className="text-[11px] font-bold">{lang.nativeLabel}</span>
              </button>
            ))}
          </div>

          {/* Enclosed Camera & Small SOS Option */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-0.5 rounded-xl border border-slate-200">
            {/* Scan Medicine Camera button */}
            {onOpenScanCamera && (
              <button
                onClick={onOpenScanCamera}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 shadow-xs active:scale-95"
                title="Scan tablet bottle or pill strip with camera"
              >
                <Camera className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="hidden sm:inline">
                  {currentLanguage === 'hi' ? 'दवा स्कैन' : 'Scan Med'}
                </span>
              </button>
            )}

            {/* Small SOS Button (Enclosed on the right side of camera) */}
            {onOpenSos && (
              <button
                onClick={onOpenSos}
                className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 shadow-xs active:scale-95"
                title="Emergency Medical SOS & Caregiver Call"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
                <span className="font-black">
                  {currentLanguage === 'hi' ? 'आपातकाल' : 'SOS'}
                </span>
              </button>
            )}
          </div>

          {/* Audio helper button */}
          <button
            onClick={handleReadAppSummary}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
            title="Read summary out loud"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span className="hidden md:inline">
              {getTranslation('listenGreeting', currentLanguage)}
            </span>
          </button>

          {/* Button Adjuster Prototype button */}
          {onOpenButtonAdjuster && (
            <button
              onClick={onOpenButtonAdjuster}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition flex items-center gap-1.5 border border-teal-300 shadow-xs active:scale-95"
              title="Open Button Adjuster Prototype"
            >
              <Sliders className="w-4 h-4 text-teal-700" />
              <span className="hidden sm:inline">
                {currentLanguage === 'hi' ? 'बटन एडजस्ट' : 'Adjust Buttons'}
              </span>
            </button>
          )}

          {/* Elderly / Easy Mode Toggle */}
          <button
            onClick={onToggleEasyMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              easyMode
                ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Big Text Easy Mode for Elderly"
          >
            <Eye className="w-4 h-4 text-amber-700" />
            <span className="hidden sm:inline font-bold">
              {easyMode
                ? getTranslation('easyModeOn', currentLanguage)
                : getTranslation('easyModeOff', currentLanguage)}
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black text-white ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
