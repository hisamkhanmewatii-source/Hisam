import React, { useState } from 'react';
import { FoodItem } from '../../types';
import { calculateDaysLeft } from '../../utils/foodDatabase';
import {
  sendBrowserNotification,
  requestNotificationPermission,
  playFoodAlertBeep,
  shareOrSendPhoneAlert,
  generateFoodAlertSummary,
} from '../../utils/notificationService';
import { speakText } from '../../utils/voiceService';
import {
  Bell,
  Smartphone,
  ShieldAlert,
  Volume2,
  Calendar,
  CheckCircle,
  Share2,
  Clock,
} from 'lucide-react';

interface RottenAlertBannerProps {
  foodItems: FoodItem[];
  easyMode: boolean;
}

export const RottenAlertBanner: React.FC<RottenAlertBannerProps> = ({
  foodItems,
  easyMode,
}) => {
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  const activeFoods = foodItems.filter((f) => !f.consumed);
  const expiringToday = activeFoods.filter((f) => calculateDaysLeft(f.expirationDate) <= 0);
  const expiringSoon = activeFoods.filter((f) => {
    const d = calculateDaysLeft(f.expirationDate);
    return d > 0 && d <= 2;
  });

  const totalAtRisk = expiringToday.length + expiringSoon.length;

  const handleSendPhoneAlert = async () => {
    playFoodAlertBeep();

    // 1. Browser Notification
    const granted = await requestNotificationPermission();
    const summary = generateFoodAlertSummary(foodItems);

    if (granted) {
      sendBrowserNotification('🚨 Food Expiration Alert!', {
        body: summary.summaryText,
      });
    }

    // 2. Share to Phone / SMS / WhatsApp
    const result = await shareOrSendPhoneAlert(summary.summaryText, 'FreshGuard Expiration Warning');

    if (result === 'copied') {
      setNotificationFeedback('Alert copied to clipboard! Paste in SMS or WhatsApp.');
    } else if (result === 'shared') {
      setNotificationFeedback('Alert sent to your phone sharing sheet!');
    } else {
      setNotificationFeedback('Alert opened in SMS!');
    }

    speakText(summary.summaryText);

    setTimeout(() => {
      setNotificationFeedback(null);
    }, 4500);
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  if (totalAtRisk === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Food Safety Status
              </span>
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                Date: {todayFormatted}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              All Food is Fresh! No Rotting Hazards Today.
            </h3>
          </div>
        </div>

        <button
          onClick={handleSendPhoneAlert}
          className="px-3.5 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Test Phone Alert</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-lg border-2 border-rose-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Warning text & date check */}
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-white/20 rounded-2xl animate-bounce shrink-0">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-white text-rose-700 rounded-md text-xs font-black uppercase tracking-wider">
                Rotten Hazard Warning
              </span>
              <span className="text-xs text-rose-100 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Date Check: {todayFormatted}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white mt-1">
              {totalAtRisk} Food Item{totalAtRisk > 1 ? 's' : ''} About To Spoil!
            </h2>

            <p className="text-xs sm:text-sm text-white/95 mt-1 font-medium">
              {[...expiringToday, ...expiringSoon].slice(0, 3).map((f) => f.name).join(', ')}
              {totalAtRisk > 3 ? ` and ${totalAtRisk - 3} more` : ''} must be eaten or frozen immediately.
            </p>
          </div>
        </div>

        {/* Right Side: Phone Alert Sender Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const names = [...expiringToday, ...expiringSoon].map((f) => f.name).join(', ');
              speakText(`Attention: ${totalAtRisk} items are at risk of spoiling: ${names}. Please eat them or freeze them today.`);
            }}
            className="px-3.5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5"
            title="Read out loud"
          >
            <Volume2 className="w-4 h-4" />
            <span>Hear Alert</span>
          </button>

          <button
            onClick={handleSendPhoneAlert}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-amber-50 active:scale-95 text-xs sm:text-sm font-black rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>Send Alert To My Phone</span>
          </button>
        </div>
      </div>

      {notificationFeedback && (
        <div className="mt-3 py-1.5 px-3 bg-white/90 text-slate-900 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notificationFeedback}</span>
        </div>
      )}
    </div>
  );
};
