import React, { useState } from 'react';
import { FoodItem, Medication } from '../types';
import { calculateDaysLeft } from '../utils/foodDatabase';
import {
  sendBrowserNotification,
  requestNotificationPermission,
  playFoodAlertBeep,
  playMedicationChime,
  shareOrSendPhoneAlert,
  generateFoodAlertSummary,
} from '../utils/notificationService';
import { speakText } from '../utils/voiceService';
import {
  Smartphone,
  Bell,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Clock,
  Settings,
  ShieldCheck,
  Moon,
} from 'lucide-react';
import { QuietHoursSettingsCard } from './Alerts/QuietHoursSettingsCard';
import { SupportedLanguage } from '../utils/translations';

interface AlertCenterProps {
  foodItems: FoodItem[];
  medications: Medication[];
  easyMode: boolean;
  currentLanguage?: SupportedLanguage;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({
  foodItems,
  medications,
  easyMode,
  currentLanguage = 'en',
}) => {
  const [permissionState, setPermissionState] = useState<string>(() => {
    return 'Notification' in window ? Notification.permission : 'unsupported';
  });
  const [morningAlert, setMorningAlert] = useState(true);
  const [eveningAlert, setEveningAlert] = useState(true);
  const [medAlarms, setMedAlarms] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeFoods = foodItems.filter((f) => !f.consumed);
  const atRiskFoods = activeFoods.filter((f) => calculateDaysLeft(f.expirationDate) <= 2);

  const handleEnablePermissions = async () => {
    const granted = await requestNotificationPermission();
    setPermissionState(granted ? 'granted' : 'denied');
    if (granted) {
      sendBrowserNotification('🔔 FreshGuard Connected!', {
        body: 'Expiration alerts and on-time medication reminders will now notify your device.',
      });
      playMedicationChime();
      setFeedback('Notifications successfully enabled!');
    } else {
      setFeedback('Permission was not granted. You can still use the SMS/Share button!');
    }
  };

  const handleTestAlert = () => {
    playFoodAlertBeep();
    const summary = generateFoodAlertSummary(foodItems);
    sendBrowserNotification('🚨 Food Expiration Alert Test', {
      body: summary.summaryText,
    });
    speakText('Test notification sent. Attention: Check your foods expiring soon!');
    setFeedback('Test alert triggered on your screen and speakers!');
  };

  const handleSendMobileSummary = async () => {
    playMedicationChime();
    const urgentNames = atRiskFoods.map((f) => f.name).join(', ') || 'None';
    const text = `🚨 *FreshGuard Food & Med Alert*\n\n` +
      `📅 Date: ${new Date().toLocaleDateString()}\n` +
      `🥦 Food at risk of rot (${atRiskFoods.length}): ${urgentNames}\n` +
      `💊 Active medications: ${medications.map((m) => `${m.name} (${m.dosage})`).join(', ')}\n\n` +
      `Remember to cook expiring items today to avoid food waste!`;

    const res = await shareOrSendPhoneAlert(text, 'FreshGuard Expiration & Med Alert');
    if (res === 'copied') {
      setFeedback('Alert text copied to clipboard! Paste directly into SMS or WhatsApp.');
    } else {
      setFeedback('Sharing window opened! Send to your phone contacts or save as note.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Phone Alerts & Notifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-700">
              Deliver food rot warnings and on-time pill reminders directly to your mobile phone
            </p>
          </div>
        </div>

        <button
          onClick={handleTestAlert}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2"
        >
          <Bell className="w-4 h-4 text-rose-600" />
          <span>Test Sound & Screen Alert</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Grid: Mobile Push Setup & Direct Share */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Browser / Device Push Notifications */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                1. Device Notifications
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  permissionState === 'granted'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Status: {permissionState === 'granted' ? 'Enabled ✅' : 'Not Allowed'}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Lockscreen & Browser Popups
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              Receive automatic banners when food is expiring in 24 hours and chime alarms when it is time to take your pills.
            </p>

            <div className="mt-4 space-y-2.5 text-xs text-slate-700">
              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
                <span className="font-semibold">Morning Expiration Alert (8:00 AM)</span>
                <input
                  type="checkbox"
                  checked={morningAlert}
                  onChange={(e) => setMorningAlert(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
                <span className="font-semibold">Dinner Pantry Rescue Alert (6:00 PM)</span>
                <input
                  type="checkbox"
                  checked={eveningAlert}
                  onChange={(e) => setEveningAlert(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl cursor-pointer">
                <span className="font-semibold">Right Medication On-Time Alarms</span>
                <input
                  type="checkbox"
                  checked={medAlarms}
                  onChange={(e) => setMedAlarms(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            {permissionState !== 'granted' ? (
              <button
                onClick={handleEnablePermissions}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>Turn On Push Notifications</span>
              </button>
            ) : (
              <button
                onClick={handleTestAlert}
                className="w-full py-2.5 bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-100 transition"
              >
                Send Test Alert Now
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Mobile Share to WhatsApp / SMS */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                2. Instant Phone SMS & WhatsApp
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Works on all phones
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Send Alert to Your Mobile Phone
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              One tap will send or copy your current food rot alert list and medication schedule directly to your phone via SMS, WhatsApp, or clipboard.
            </p>

            {/* Current Summary Preview */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
              <div className="font-bold text-slate-700">Preview:</div>
              <p className="text-slate-800 font-semibold">
                🚨 FreshGuard: {atRiskFoods.length} items at risk of rotting (
                {atRiskFoods.slice(0, 2).map((f) => f.name).join(', ') || 'None'}
                ).
              </p>
              <p className="text-slate-700">
                💊 {medications.length} active medications on schedule.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleSendMobileSummary}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send Expiration Alert to Phone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Section: Personalized Quiet Hours & No-Disturb Sleep Windows */}
      <QuietHoursSettingsCard
        currentLanguage={currentLanguage}
        easyMode={easyMode}
        medications={medications}
      />
    </div>
  );
};
