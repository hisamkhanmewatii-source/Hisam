import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  BellOff,
  VolumeX,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Sliders,
  Bed,
  Coffee,
  Check,
  Zap,
} from 'lucide-react';
import { QuietHoursSettings, Medication } from '../../types';
import {
  loadQuietHoursSettings,
  saveQuietHoursSettings,
  isCurrentlyInQuietHours,
  formatTime12Hour,
  triggerMedicationPushNotification,
  DEFAULT_QUIET_HOURS,
} from '../../utils/notificationService';
import { SupportedLanguage } from '../../utils/translations';
import { playButtonClickSound } from '../../utils/buttonSettings';
import { speakText } from '../../utils/voiceService';

interface QuietHoursSettingsCardProps {
  currentLanguage?: SupportedLanguage;
  easyMode?: boolean;
  medications?: Medication[];
  onSettingsChange?: (settings: QuietHoursSettings) => void;
}

export const QuietHoursSettingsCard: React.FC<QuietHoursSettingsCardProps> = ({
  currentLanguage = 'en',
  easyMode = false,
  medications = [],
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState<QuietHoursSettings>(() => loadQuietHoursSettings());
  const [isCurrentlyActive, setIsCurrentlyActive] = useState<boolean>(() =>
    isCurrentlyInQuietHours()
  );
  const [testResult, setTestResult] = useState<{
    text: string;
    type: 'success' | 'silenced' | 'info';
  } | null>(null);

  // Keep live status updated every 15 seconds
  useEffect(() => {
    const check = () => {
      setIsCurrentlyActive(isCurrentlyInQuietHours(settings));
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [settings]);

  const updateSetting = <K extends keyof QuietHoursSettings>(key: K, value: QuietHoursSettings[K]) => {
    playButtonClickSound();
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveQuietHoursSettings(updated);
    setIsCurrentlyActive(isCurrentlyInQuietHours(updated));
    if (onSettingsChange) onSettingsChange(updated);
  };

  const applyPreset = (start: string, end: string, label: string) => {
    playButtonClickSound();
    const updated = {
      ...settings,
      enabled: true,
      startTime: start,
      endTime: end,
    };
    setSettings(updated);
    saveQuietHoursSettings(updated);
    setIsCurrentlyActive(isCurrentlyInQuietHours(updated));
    if (onSettingsChange) onSettingsChange(updated);

    const msg =
      currentLanguage === 'hi'
        ? `शांत घंटे सेट किए गए: रात ${formatTime12Hour(start)} से सुबह ${formatTime12Hour(end)}`
        : `Quiet Hours set to ${formatTime12Hour(start)} – ${formatTime12Hour(end)} (${label})`;
    setTestResult({ text: msg, type: 'success' });
    setTimeout(() => setTestResult(null), 4000);
  };

  // Test simulation
  const handleSimulateAlert = (isCriticalTest: boolean) => {
    playButtonClickSound();
    const testMed: Medication = isCriticalTest
      ? {
          id: 'test-insulin',
          name: 'Insulin Glargine (Long-Acting)',
          dosage: '18 Units',
          frequency: 'once_daily',
          times: ['bedtime'],
          foodRule: 'anytime',
          purpose: 'Nighttime Blood Sugar Basal Control',
          doctorInstructions: 'Take strictly at night',
          pillsRemaining: 15,
          totalPills: 30,
          refillThreshold: 5,
          reminderEnabled: true,
          history: {},
        }
      : {
          id: 'test-multivitamin',
          name: 'Calcium & Vitamin D3',
          dosage: '500 mg',
          frequency: 'once_daily',
          times: ['bedtime'],
          foodRule: 'with_meal',
          purpose: 'Bone Density Maintenance',
          pillsRemaining: 20,
          totalPills: 60,
          refillThreshold: 7,
          reminderEnabled: true,
          history: {},
        };

    const res = triggerMedicationPushNotification(testMed, 'bedtime', { force: false });

    if (res.silencedByQuietHours) {
      setTestResult({
        text:
          currentLanguage === 'hi'
            ? `🔇 शांत घंटे सक्रिय: ${testMed.name} का अलर्ट नींद के समय सफलतापूर्वक म्यूट (शांत) कर दिया गया!`
            : `🔇 Quiet Hours Working: ${testMed.name} alert was safely silenced so sleep is undisturbed!`,
        type: 'silenced',
      });
    } else if (res.isCriticalBypass) {
      setTestResult({
        text:
          currentLanguage === 'hi'
            ? `🚨 क्रिटिकल बाईपास: ${testMed.name} आवश्यक जीवनरक्षक दवा है, इसलिए शांत घंटों में भी धीरे से अलर्ट बजा!`
            : `🚨 Critical Bypass Active: ${testMed.name} is an essential medicine, so it alerted safely even during Quiet Hours!`,
        type: 'success',
      });
    } else {
      setTestResult({
        text:
          currentLanguage === 'hi'
            ? `🔔 सामान्य अलर्ट भेजा गया (अभी शांत घंटे का समय नहीं है)।`
            : `🔔 Standard Alert Triggered (Currently outside Quiet Hours window).`,
        type: 'info',
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md space-y-6">
      {/* Top Banner & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                settings.enabled
                  ? isCurrentlyActive
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {settings.enabled ? (
                isCurrentlyActive ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>{currentLanguage === 'hi' ? 'नींद मोड सक्रिय' : 'Sleep Mode Active Now'}</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{currentLanguage === 'hi' ? 'दिन का समय सक्रिय' : 'Daytime Active'}</span>
                  </>
                )
              ) : (
                <span>{currentLanguage === 'hi' ? 'शांत घंटे बंद' : 'Quiet Hours Disabled'}</span>
              )}
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
              {currentLanguage === 'hi' ? 'अबाधित नींद' : 'Restful Sleep'}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-600" />
            <span>
              {currentLanguage === 'hi'
                ? 'दवा अलर्ट शांत घंटे (डू नॉट डिस्टर्ब विंडो)'
                : 'Medication Alert Quiet Hours & Sleep Windows'}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-700">
            {currentLanguage === 'hi'
              ? 'सोते समय अनावश्यक बीप और आवाज़ को रोकें, ताकि बुजुर्गों की नींद में कोई बाधा न पहुंचे'
              : 'Customize specific no-disturb hours so chimes, voice readings, and popups do not disrupt healthy sleep'}
          </p>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-200 self-start sm:self-center">
          <span className="text-xs font-black text-slate-800">
            {settings.enabled
              ? currentLanguage === 'hi'
                ? 'सक्रिय (ON)'
                : 'Enabled (ON)'
              : currentLanguage === 'hi'
              ? 'बंद (OFF)'
              : 'Disabled (OFF)'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => updateSetting('enabled', !settings.enabled)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition duration-300 focus:outline-hidden ${
              settings.enabled ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center text-[10px] font-bold ${
                settings.enabled ? 'translate-x-6 text-indigo-600' : 'translate-x-0 text-slate-400'
              }`}
            >
              {settings.enabled ? '🌙' : '✕'}
            </div>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className={`space-y-6 transition-opacity ${settings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        {/* Time Window Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Time */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="quiet-start-time" className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>{currentLanguage === 'hi' ? '1. नींद शुरू (डू नॉट डिस्टर्ब)' : '1. Sleep Time (No-Disturb Starts)'}</span>
              </label>
              <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                {formatTime12Hour(settings.startTime)}
              </span>
            </div>
            <input
              id="quiet-start-time"
              type="time"
              value={settings.startTime}
              onChange={(e) => updateSetting('startTime', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-indigo-200 font-black text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden shadow-2xs"
            />
            <p className="text-[11px] text-indigo-800">
              {currentLanguage === 'hi'
                ? 'इस समय से सभी गैर-आपातकालीन अलर्ट्स म्यूट हो जाएंगे'
                : 'All non-critical sounds, voice readouts, and alerts are silenced from this time'}
            </p>
          </div>

          {/* End Time */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="quiet-end-time" className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-600" />
                <span>{currentLanguage === 'hi' ? '2. जागने का समय (अलर्ट पुनः चालू)' : '2. Wakeup Time (Alerts Resume)'}</span>
              </label>
              <span className="text-xs font-bold text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                {formatTime12Hour(settings.endTime)}
              </span>
            </div>
            <input
              id="quiet-end-time"
              type="time"
              value={settings.endTime}
              onChange={(e) => updateSetting('endTime', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-amber-200 font-black text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-2xs"
            />
            <p className="text-[11px] text-amber-800">
              {currentLanguage === 'hi'
                ? 'सुबह इस समय के बाद नियमित शेड्यूल के अलर्ट बजना शुरू होंगे'
                : 'Standard notifications and breakfast medicine reminders resume normally'}
            </p>
          </div>
        </div>

        {/* Quick Sleep Schedule Presets */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentLanguage === 'hi' ? '⚡ लोकप्रिय स्लीप विंडो प्रीसेट्स:' : '⚡ Quick Sleep Presets for Seniors & Family:'}</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset('22:00', '07:00', 'Standard Sleep')}
              className={`p-3 rounded-2xl border text-left transition active:scale-95 ${
                settings.startTime === '22:00' && settings.endTime === '07:00'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                  : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Bed className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'मानक नींद' : 'Standard Sleep'}</span>
              </div>
              <div className="text-[11px] font-bold mt-1 opacity-90">10:00 PM – 7:00 AM</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('21:00', '06:00', 'Early Riser')}
              className={`p-3 rounded-2xl border text-left transition active:scale-95 ${
                settings.startTime === '21:00' && settings.endTime === '06:00'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                  : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Sun className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'जल्दी सोने वाले' : 'Early Riser'}</span>
              </div>
              <div className="text-[11px] font-bold mt-1 opacity-90">9:00 PM – 6:00 AM</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('23:00', '08:00', 'Night Owl')}
              className={`p-3 rounded-2xl border text-left transition active:scale-95 ${
                settings.startTime === '23:00' && settings.endTime === '08:00'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                  : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Moon className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'देर से सोने वाले' : 'Night Owl'}</span>
              </div>
              <div className="text-[11px] font-bold mt-1 opacity-90">11:00 PM – 8:00 AM</div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('13:00', '15:30', 'Afternoon Nap')}
              className={`p-3 rounded-2xl border text-left transition active:scale-95 ${
                settings.startTime === '13:00' && settings.endTime === '15:30'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md'
                  : 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black text-xs">
                <Coffee className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'दोपहर की झपकी' : 'Afternoon Nap'}</span>
              </div>
              <div className="text-[11px] font-bold mt-1 opacity-90">1:00 PM – 3:30 PM</div>
            </button>
          </div>
        </div>

        {/* Granular Protection Toggles */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600">
            {currentLanguage === 'hi' ? 'सुरक्षा व ध्वनि विकल्प (Custom Rules):' : 'Custom Sleep Protection Rules:'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Toggle 1: Mute chimes */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.suppressChimes}
                onChange={(e) => updateSetting('suppressChimes', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="space-y-0.5">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-indigo-600" />
                  <span>{currentLanguage === 'hi' ? 'साउंड चाइम व बीप म्यूट रखें' : 'Mute Audio Chimes & Beeps'}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {currentLanguage === 'hi'
                    ? 'नींद के घंटों में कोई भी ऑडियो टोन या बीप नहीं बजेगा।'
                    : 'Suppresses synthesizer chimes completely while asleep.'}
                </p>
              </div>
            </label>

            {/* Toggle 2: Silence Voice */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.suppressVoice}
                onChange={(e) => updateSetting('suppressVoice', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="space-y-0.5">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <BellOff className="w-4 h-4 text-purple-600" />
                  <span>{currentLanguage === 'hi' ? 'आवाज़ घोषणाएं बंद रखें' : 'Silence Spoken Announcements'}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {currentLanguage === 'hi'
                    ? 'स्वचालित वॉइस ओवरव्यू या शेड्यूल रीडिंग रात में नहीं बोली जाएगी।'
                    : 'Prevents automatic Text-to-Speech speaking aloud during rest.'}
                </p>
              </div>
            </label>

            {/* Toggle 3: Suppress Push */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.suppressPushNotifications}
                onChange={(e) => updateSetting('suppressPushNotifications', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="space-y-0.5">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>{currentLanguage === 'hi' ? 'लॉकस्क्रीन बैनर रोकें' : 'Suppress Screen Popups'}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {currentLanguage === 'hi'
                    ? 'रात में मोबाइल स्क्रीन को चमकने से बचाएं।'
                    : 'Prevents phone display from waking up with banner alerts.'}
                </p>
              </div>
            </label>

            {/* Toggle 4: Critical Meds Bypass */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200 cursor-pointer transition">
              <input
                type="checkbox"
                checked={settings.allowCriticalMeds}
                onChange={(e) => updateSetting('allowCriticalMeds', e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <div className="font-black text-emerald-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-700" />
                  <span>{currentLanguage === 'hi' ? 'जीवनरक्षक / क्रिटिकल दवा छूट (Bypass)' : 'Critical Medicine Bypass (Recommended)'}</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  {currentLanguage === 'hi'
                    ? 'इंसुलिन, हृदय या बीपी की जरूरी दवाएं शांत घंटों में भी अलर्ट करेंगी।'
                    : 'Allows vital insulin, BP & heart medications to notify safely.'}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Live Simulator & Verification Panel */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>{currentLanguage === 'hi' ? 'नींद विंडो सिम्युलेटर' : 'Quiet Hours Safety Simulator'}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {currentLanguage === 'hi' ? 'तुरंत प्रभाव जांचें' : 'Verify silence logic live'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSimulateAlert(false)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
            >
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              <span>{currentLanguage === 'hi' ? 'सामान्य दवा टेस्ट (म्यूट होगी)' : 'Test Normal Medicine (Silenced)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateAlert(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-yellow-300" />
              <span>{currentLanguage === 'hi' ? 'क्रिटिकल दवा टेस्ट (बाईपास)' : 'Test Critical Medicine (Bypass)'}</span>
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2 ${
                testResult.type === 'silenced'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : testResult.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800'
                  : 'bg-indigo-950/80 text-indigo-200 border border-indigo-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testResult.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
