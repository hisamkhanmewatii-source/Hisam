import { Medication, TimeOfDay, FoodItem, QuietHoursSettings } from '../types';
import { calculateDaysLeft } from './foodDatabase';

export const DEFAULT_QUIET_HOURS: QuietHoursSettings = {
  enabled: true,
  startTime: '22:00', // 10:00 PM
  endTime: '07:00',   // 7:00 AM
  suppressChimes: true,
  suppressVoice: true,
  suppressPushNotifications: true,
  allowCriticalMeds: true,
  bedtimeDoseAdjustment: 'shift_before_quiet_hours',
};

export function loadQuietHoursSettings(): QuietHoursSettings {
  try {
    const raw = localStorage.getItem('freshguard_quiet_hours_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_QUIET_HOURS, ...parsed };
    }
  } catch (e) {
    console.warn('Error reading quiet hours settings:', e);
  }
  return DEFAULT_QUIET_HOURS;
}

export function saveQuietHoursSettings(settings: QuietHoursSettings): void {
  try {
    localStorage.setItem('freshguard_quiet_hours_settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('freshguard_quiet_hours_updated', { detail: settings }));
  } catch (e) {
    console.warn('Error saving quiet hours settings:', e);
  }
}

export function formatTime12Hour(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m < 10 ? '0' : ''}${m} ${ampm}`;
}

export function isCurrentlyInQuietHours(customSettings?: QuietHoursSettings, checkDate?: Date): boolean {
  const settings = customSettings || loadQuietHoursSettings();
  if (!settings.enabled) return false;

  const now = checkDate || new Date();
  const currentTotal = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = settings.startTime.split(':').map((v) => parseInt(v, 10) || 0);
  const [endH, endM] = settings.endTime.split(':').map((v) => parseInt(v, 10) || 0);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  // Crosses midnight window (e.g., 22:00 to 07:00)
  if (startTotal > endTotal) {
    return currentTotal >= startTotal || currentTotal < endTotal;
  }
  // Same-day window (e.g., 13:00 to 15:00 afternoon rest)
  if (startTotal < endTotal) {
    return currentTotal >= startTotal && currentTotal < endTotal;
  }
  // Exactly equal means 24h quiet mode
  return true;
}

export function isMedicationCritical(med: Medication): boolean {
  const text = `${med.name} ${med.purpose} ${med.doctorInstructions || ''}`.toLowerCase();
  const criticalKeywords = [
    'insulin',
    'metformin',
    'glipizide',
    'heart',
    'cardiac',
    'blood pressure',
    'bp',
    'lisinopril',
    'amlodipine',
    'aspirin',
    'warfarin',
    'clopidogrel',
    'nitroglycerin',
    'digoxin',
    'epinephrine',
    'stroke',
    'anticoagulant',
    'critical',
    'urgent',
  ];
  return criticalKeywords.some((kw) => text.includes(kw));
}

// Web Audio synthesizer for crisp alert sounds without external audio assets
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playMedicationChime(force = false) {
  if (!force) {
    const quiet = loadQuietHoursSettings();
    if (isCurrentlyInQuietHours(quiet) && quiet.suppressChimes) {
      console.log('🔇 Medication chime silenced by Quiet Hours / Sleep Mode');
      return;
    }
  }

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Pleasant 3-note harmonic chime (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.55);
    });
  } catch (e) {
    console.warn('Audio chime play blocked:', e);
  }
}

export function playFoodAlertBeep(force = false) {
  if (!force) {
    const quiet = loadQuietHoursSettings();
    if (isCurrentlyInQuietHours(quiet) && quiet.suppressChimes) {
      console.log('🔇 Food alert beep silenced by Quiet Hours / Sleep Mode');
      return;
    }
  }

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Urgent dual tone warning (A4 -> F5)
    const freqs = [440, 698.46];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      
      gain.gain.setValueAtTime(0.18, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.35);
    });
  } catch (e) {
    console.warn('Audio food alert play blocked:', e);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions): boolean {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    return true;
  } catch (err) {
    console.warn('Notification failed:', err);
    return false;
  }
}

export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'noon';
  if (hour >= 16 && hour < 21) return 'evening';
  return 'bedtime';
}

export function getTimeOfDayLabel(time: TimeOfDay): string {
  switch (time) {
    case 'morning':
      return 'Morning (Breakfast)';
    case 'noon':
      return 'Mid-Day / Lunch';
    case 'evening':
      return 'Evening / Dinner';
    case 'bedtime':
      return 'Bedtime / Night';
  }
}

export function getTimeOfDayIcon(time: TimeOfDay): string {
  switch (time) {
    case 'morning':
      return '🌅';
    case 'noon':
      return '☀️';
    case 'evening':
      return '🌆';
    case 'bedtime':
      return '🌙';
  }
}

export interface DueMedicationSummary {
  dueNow: Medication[];
  upcomingToday: Medication[];
  missedEarlier: Medication[];
  currentTimeSlot: TimeOfDay;
}

export function getDueMedicationsForToday(
  medications: Medication[],
  todayDateStr: string
): DueMedicationSummary {
  const currentSlot = getCurrentTimeOfDay();
  const slotOrder: TimeOfDay[] = ['morning', 'noon', 'evening', 'bedtime'];
  const currentIdx = slotOrder.indexOf(currentSlot);

  const dueNow: Medication[] = [];
  const upcomingToday: Medication[] = [];
  const missedEarlier: Medication[] = [];

  medications.forEach((med) => {
    const todayLog = med.history?.[todayDateStr] || {};
    
    med.times.forEach((t) => {
      const isTaken = !!todayLog[t];
      const slotIdx = slotOrder.indexOf(t);

      if (!isTaken) {
        if (slotIdx === currentIdx) {
          if (!dueNow.some((m) => m.id === med.id)) {
            dueNow.push(med);
          }
        } else if (slotIdx < currentIdx) {
          if (!missedEarlier.some((m) => m.id === med.id)) {
            missedEarlier.push(med);
          }
        } else {
          if (!upcomingToday.some((m) => m.id === med.id)) {
            upcomingToday.push(med);
          }
        }
      }
    });
  });

  return {
    dueNow,
    upcomingToday,
    missedEarlier,
    currentTimeSlot: currentSlot,
  };
}

export function generateFoodAlertSummary(foodItems: FoodItem[]): {
  urgentCount: number;
  expiringSoonCount: number;
  summaryText: string;
} {
  const unconsumed = foodItems.filter((i) => !i.consumed);
  const expiringToday: FoodItem[] = [];
  const expiringSoon: FoodItem[] = [];

  unconsumed.forEach((item) => {
    const days = calculateDaysLeft(item.expirationDate);
    if (days <= 0) expiringToday.push(item);
    else if (days <= 2) expiringSoon.push(item);
  });

  const totalAtRisk = expiringToday.length + expiringSoon.length;
  let summaryText = '';

  if (totalAtRisk === 0) {
    summaryText = 'All items in your pantry and fridge are fresh! No food rot risks detected.';
  } else {
    const topNames = [...expiringToday, ...expiringSoon].slice(0, 3).map((f) => f.name).join(', ');
    summaryText = `🚨 FreshGuard Alert: ${totalAtRisk} item${totalAtRisk > 1 ? 's' : ''} at risk of rotting (${topNames}). Cook or freeze them today!`;
  }

  return {
    urgentCount: expiringToday.length,
    expiringSoonCount: expiringSoon.length,
    summaryText,
  };
}

export async function shareOrSendPhoneAlert(text: string, title = 'FreshGuard Alert'): Promise<'shared' | 'copied' | 'sms'> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: window.location.href,
      });
      return 'shared';
    } catch (e) {
      // Fallback
    }
  }

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch (e) {
      // Fallback
    }
  }

  // Mobile SMS fallback
  const smsUrl = `sms:?body=${encodeURIComponent(text)}`;
  window.open(smsUrl, '_blank');
  return 'sms';
}

export interface MedicationNotificationResult {
  sent: boolean;
  silencedByQuietHours: boolean;
  reason?: string;
  isCriticalBypass?: boolean;
}

export function checkMedicationQuietHoursStatus(med?: Medication): {
  isQuietHours: boolean;
  isSilenced: boolean;
  isCriticalBypass: boolean;
  quietHoursMessage: string;
} {
  const quiet = loadQuietHoursSettings();
  const inQuietHours = isCurrentlyInQuietHours(quiet);
  if (!inQuietHours) {
    return {
      isQuietHours: false,
      isSilenced: false,
      isCriticalBypass: false,
      quietHoursMessage: quiet.enabled
        ? `Quiet Hours scheduled: ${formatTime12Hour(quiet.startTime)} – ${formatTime12Hour(quiet.endTime)}`
        : 'Quiet Hours disabled',
    };
  }

  const isCritical = med ? isMedicationCritical(med) : false;
  const isCriticalBypass = quiet.allowCriticalMeds && isCritical;
  const isSilenced = !isCriticalBypass;

  return {
    isQuietHours: true,
    isSilenced,
    isCriticalBypass,
    quietHoursMessage: isCriticalBypass
      ? `🌙 Sleep Mode Active (${formatTime12Hour(quiet.startTime)} – ${formatTime12Hour(quiet.endTime)}), but this critical medication bypasses quiet hours.`
      : `🌙 Sleep Mode Active (${formatTime12Hour(quiet.startTime)} – ${formatTime12Hour(quiet.endTime)}): Non-critical alerts are muted.`,
  };
}

export function triggerMedicationPushNotification(
  med: Medication,
  slot: TimeOfDay,
  options?: { force?: boolean }
): MedicationNotificationResult {
  const quiet = loadQuietHoursSettings();
  const inQuietHours = isCurrentlyInQuietHours(quiet);
  const isCritical = isMedicationCritical(med);
  const isCriticalBypass = inQuietHours && quiet.allowCriticalMeds && isCritical;

  if (!options?.force && inQuietHours && !isCriticalBypass) {
    console.log(`🌙 Notification for ${med.name} silenced by quiet hours`);
    return {
      sent: false,
      silencedByQuietHours: true,
      reason: `Silenced by Quiet Hours (${formatTime12Hour(quiet.startTime)} – ${formatTime12Hour(quiet.endTime)}) to protect your sleep.`,
    };
  }

  // Play chime if not suppressed
  if (!inQuietHours || !quiet.suppressChimes || options?.force) {
    playMedicationChime(options?.force);
  }

  const ruleText =
    med.foodRule === 'with_meal'
      ? ' (🍽️ Must take with food/meal!)'
      : med.foodRule === 'empty_stomach'
      ? ' (💧 Take on empty stomach with water!)'
      : '';

  const isSupplement = med.category === 'supplement';
  const categoryBadge = isSupplement ? '🌿 [Supplement]' : '💊 [Medicine]';

  const title = isCriticalBypass
    ? `🚨 [Critical Dose Bypass] Time for ${slot}: ${med.name}`
    : `⏰ ${categoryBadge} Time for your ${slot} dose: ${med.name}`;
  const body = `Dosage: ${med.dosage} (${med.form || 'dose'})${ruleText}. ${med.doctorInstructions || med.purpose}`;

  const sent = sendBrowserNotification(title, {
    body,
    tag: `med-${med.id}-${slot}`,
    requireInteraction: true,
  });

  return {
    sent,
    silencedByQuietHours: false,
    isCriticalBypass,
  };
}

export interface NextDoseInfo {
  medication: Medication;
  slot: TimeOfDay;
  timeLabel: string;
  timeRemainingMinutes: number;
  formattedRemaining: string;
  isToday: boolean;
}

export function getNextUpcomingDose(medications: Medication[], todayDateStr: string): NextDoseInfo | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slotMinutesMap: Record<TimeOfDay, { minutes: number; label: string }> = {
    morning: { minutes: 8 * 60, label: '08:00 AM' },
    noon: { minutes: 13 * 60, label: '01:00 PM' },
    evening: { minutes: 19 * 60 + 30, label: '07:30 PM' },
    bedtime: { minutes: 21 * 60 + 45, label: '09:45 PM' },
  };

  interface Candidate {
    med: Medication;
    slot: TimeOfDay;
    targetMinutes: number;
    timeLabel: string;
    isToday: boolean;
  }

  const candidates: Candidate[] = [];

  medications.forEach((med) => {
    if (!med.reminderEnabled) return;
    const todayLog = med.history?.[todayDateStr] || {};

    med.times.forEach((slot, idx) => {
      const isTaken = !!todayLog[slot];
      if (isTaken) return;

      let targetM = slotMinutesMap[slot].minutes;
      let label = slotMinutesMap[slot].label;

      if (med.specificTimes && med.specificTimes[idx]) {
        const [h, m] = med.specificTimes[idx].split(':').map((v) => parseInt(v, 10) || 0);
        targetM = h * 60 + m;
        label = formatTime12Hour(med.specificTimes[idx]);
      } else if (med.specificTimes && med.specificTimes[0]) {
        const [h, m] = med.specificTimes[0].split(':').map((v) => parseInt(v, 10) || 0);
        targetM = h * 60 + m;
        label = formatTime12Hour(med.specificTimes[0]);
      }

      // Check if snoozed
      if (med.snoozedUntil && med.snoozedUntil > Date.now()) {
        const snoozeDate = new Date(med.snoozedUntil);
        targetM = snoozeDate.getHours() * 60 + snoozeDate.getMinutes();
        label = `Snoozed (${formatTime12Hour(`${snoozeDate.getHours()}:${snoozeDate.getMinutes()}`)})`;
      }

      if (targetM >= currentMinutes) {
        candidates.push({ med, slot, targetMinutes: targetM, timeLabel: label, isToday: true });
      } else {
        candidates.push({ med, slot, targetMinutes: targetM + 24 * 60, timeLabel: label, isToday: false });
      }
    });
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.targetMinutes - b.targetMinutes);
  const best = candidates[0];
  const diffMinutes = Math.max(0, best.targetMinutes - currentMinutes);

  let formatted = '';
  if (diffMinutes === 0) {
    formatted = 'Due right now!';
  } else if (diffMinutes < 60) {
    formatted = `in ${diffMinutes} min${diffMinutes > 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    formatted = `in ${hours} hr${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins}m` : ''}`.trim();
  }

  return {
    medication: best.med,
    slot: best.slot,
    timeLabel: best.timeLabel,
    timeRemainingMinutes: diffMinutes,
    formattedRemaining: formatted,
    isToday: best.isToday,
  };
}

// Session cache of sent notifications to avoid repetitive duplicate alerts during the same minute window
const sentNotificationsCache = new Set<string>();

export function checkAndTriggerDueReminders(
  medications: Medication[],
  todayDateStr: string
): { triggeredCount: number; dueItems: Array<{ med: Medication; slot: TimeOfDay }> } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotal = currentHour * 60 + currentMinute;
  const currentSlot = getCurrentTimeOfDay();

  const slotMinutesMap: Record<TimeOfDay, number> = {
    morning: 8 * 60,
    noon: 13 * 60,
    evening: 19 * 60 + 30,
    bedtime: 21 * 60 + 45,
  };

  const dueItems: Array<{ med: Medication; slot: TimeOfDay }> = [];
  let triggeredCount = 0;

  medications.forEach((med) => {
    if (!med.reminderEnabled) return;
    const todayLog = med.history?.[todayDateStr] || {};

    med.times.forEach((slot, idx) => {
      const isTaken = !!todayLog[slot];
      if (isTaken) return;

      const cacheKey = `${todayDateStr}_${med.id}_${slot}_${currentHour}_${Math.floor(currentMinute / 5)}`;
      if (sentNotificationsCache.has(cacheKey)) return;

      let isDue = false;

      // Check if snoozed
      if (med.snoozedUntil && Date.now() >= med.snoozedUntil) {
        isDue = true;
      } else if (med.specificTimes && med.specificTimes[idx]) {
        const [h, m] = med.specificTimes[idx].split(':').map((v) => parseInt(v, 10) || 0);
        const specificTotal = h * 60 + m;
        if (Math.abs(currentTotal - specificTotal) <= 2) {
          isDue = true;
        }
      } else if (slot === currentSlot) {
        const standardTotal = slotMinutesMap[slot];
        if (Math.abs(currentTotal - standardTotal) <= 15) {
          isDue = true;
        }
      }

      if (isDue) {
        sentNotificationsCache.add(cacheKey);
        dueItems.push({ med, slot });

        const result = triggerMedicationPushNotification(med, slot);
        if (result.sent || !result.silencedByQuietHours) {
          triggeredCount++;
          window.dispatchEvent(
            new CustomEvent('freshguard_dose_reminder_triggered', {
              detail: { med, slot, result },
            })
          );
        }
      }
    });
  });

  return { triggeredCount, dueItems };
}

