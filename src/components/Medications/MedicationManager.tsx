import React, { useState, useEffect } from 'react';
import {
  Medication,
  TimeOfDay,
  MedicationFoodRule,
  ReminderCategory,
  MedicineForm,
  QuietHoursSettings,
} from '../../types';
import {
  Pill,
  Clock,
  Plus,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  Info,
  Trash2,
  Edit2,
  ShieldCheck,
  Check,
  X,
  Bell,
  RefreshCw,
  Camera,
  Activity,
  Moon,
  Sun,
  VolumeX,
  Leaf,
  RotateCcw,
  Zap,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { MedicineCameraScanner } from './MedicineCameraScanner';
import { ActiveDoseAlertBanner } from './ActiveDoseAlertBanner';
import { QuietHoursSettingsCard } from '../Alerts/QuietHoursSettingsCard';
import { speakText } from '../../utils/voiceService';
import {
  playMedicationChime,
  getCurrentTimeOfDay,
  getTimeOfDayLabel,
  getTimeOfDayIcon,
  triggerMedicationPushNotification,
  requestNotificationPermission,
  loadQuietHoursSettings,
  isCurrentlyInQuietHours,
  formatTime12Hour,
  checkMedicationQuietHoursStatus,
  getNextUpcomingDose,
  checkAndTriggerDueReminders,
  NextDoseInfo,
} from '../../utils/notificationService';
import { SupportedLanguage } from '../../utils/translations';
import confetti from 'canvas-confetti';

interface MedicationManagerProps {
  medications: Medication[];
  todayDateStr: string;
  onUpdateMedications: (meds: Medication[]) => void;
  easyMode: boolean;
  onOpenSymptoms?: () => void;
  currentLanguage?: SupportedLanguage;
}

const TIME_SLOTS: { slot: TimeOfDay; label: string; icon: string; timeRange: string }[] = [
  { slot: 'morning', label: 'Morning', icon: '🌅', timeRange: '6:00 AM - 11:00 AM' },
  { slot: 'noon', label: 'Mid-Day', icon: '☀️', timeRange: '11:00 AM - 4:00 PM' },
  { slot: 'evening', label: 'Evening', icon: '🌆', timeRange: '4:00 PM - 9:00 PM' },
  { slot: 'bedtime', label: 'Bedtime', icon: '🌙', timeRange: '9:00 PM - Midnight' },
];

const MEDICINE_FORMS: { form: MedicineForm; label: string; icon: string }[] = [
  { form: 'tablet', label: 'Tablet', icon: '💊' },
  { form: 'capsule', label: 'Capsule', icon: '💊' },
  { form: 'liquid', label: 'Liquid/Syrup', icon: '💧' },
  { form: 'gummy', label: 'Gummy', icon: '🍬' },
  { form: 'drops', label: 'Drops', icon: '🌿' },
  { form: 'powder', label: 'Powder', icon: '🥄' },
  { form: 'inhaler', label: 'Inhaler', icon: '💨' },
  { form: 'injection', label: 'Injection', icon: '💉' },
];

interface QuickPreset {
  name: string;
  category: ReminderCategory;
  dosage: string;
  form: MedicineForm;
  times: TimeOfDay[];
  specificTimes: string[];
  foodRule: MedicationFoodRule;
  purpose: string;
  doctorInstructions: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    name: 'Vitamin D3 + K2',
    category: 'supplement',
    dosage: '2000 IU',
    form: 'capsule',
    times: ['morning'],
    specificTimes: ['08:30'],
    foodRule: 'with_meal',
    purpose: 'Bone strength, immunity & mood support',
    doctorInstructions: 'Take with breakfast containing healthy dietary fats for best absorption.',
  },
  {
    name: 'Omega-3 Fish Oil (EPA/DHA)',
    category: 'supplement',
    dosage: '1200 mg',
    form: 'capsule',
    times: ['noon'],
    specificTimes: ['13:00'],
    foodRule: 'with_meal',
    purpose: 'Heart health, triglycerides & joint lubrication',
    doctorInstructions: 'Take with lunch to avoid aftertaste.',
  },
  {
    name: 'Magnesium Glycinate',
    category: 'supplement',
    dosage: '200 mg',
    form: 'tablet',
    times: ['bedtime'],
    specificTimes: ['21:30'],
    foodRule: 'anytime',
    purpose: 'Deep sleep, muscle relaxation & anxiety relief',
    doctorInstructions: 'Take 45 minutes before sleep with water.',
  },
  {
    name: 'Daily Multivitamin & Minerals',
    category: 'supplement',
    dosage: '1 tablet',
    form: 'tablet',
    times: ['morning'],
    specificTimes: ['09:00'],
    foodRule: 'with_meal',
    purpose: 'Complete micro-nutrient support & vitality',
    doctorInstructions: 'Take after eating breakfast to prevent nausea.',
  },
  {
    name: 'Probiotics 50 Billion CFU',
    category: 'supplement',
    dosage: '1 capsule',
    form: 'capsule',
    times: ['morning'],
    specificTimes: ['07:30'],
    foodRule: 'empty_stomach',
    purpose: 'Gut microbiome balance & digestive immunity',
    doctorInstructions: 'Take 20-30 mins before breakfast with lukewarm water.',
  },
  {
    name: 'Metformin HCl',
    category: 'medication',
    dosage: '500 mg',
    form: 'tablet',
    times: ['morning', 'evening'],
    specificTimes: ['08:00', '19:30'],
    foodRule: 'with_meal',
    purpose: 'Blood sugar regulation & insulin sensitivity',
    doctorInstructions: 'Take with first bite of breakfast and dinner to avoid nausea.',
  },
  {
    name: 'Amlodipine Besylate',
    category: 'medication',
    dosage: '5 mg',
    form: 'tablet',
    times: ['morning'],
    specificTimes: ['08:00'],
    foodRule: 'anytime',
    purpose: 'Blood pressure regulation & cardiac protection',
    doctorInstructions: 'Take consistently every morning with a full glass of water.',
  },
  {
    name: 'Atorvastatin Calcium',
    category: 'medication',
    dosage: '20 mg',
    form: 'tablet',
    times: ['bedtime'],
    specificTimes: ['21:30'],
    foodRule: 'anytime',
    purpose: 'Cholesterol control & arterial plaque protection',
    doctorInstructions: 'Take at night for optimal liver synthesis regulation.',
  },
  {
    name: 'Omeprazole (Prilosec)',
    category: 'medication',
    dosage: '20 mg',
    form: 'capsule',
    times: ['morning'],
    specificTimes: ['07:15'],
    foodRule: 'empty_stomach',
    purpose: 'Acid reflux, GERD & stomach protection',
    doctorInstructions: 'Take 30-60 minutes BEFORE breakfast with water.',
  },
];

export const MedicationManager: React.FC<MedicationManagerProps> = ({
  medications,
  todayDateStr,
  onUpdateMedications,
  easyMode,
  onOpenSymptoms,
  currentLanguage = 'en',
}) => {
  const currentSlot = getCurrentTimeOfDay();
  const [selectedSlot, setSelectedSlot] = useState<TimeOfDay>(currentSlot);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'medication' | 'supplement'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [isQuietHoursModalOpen, setIsQuietHoursModalOpen] = useState(false);
  const [quietSettings, setQuietSettings] = useState<QuietHoursSettings>(() => loadQuietHoursSettings());
  const [quietNotice, setQuietNotice] = useState<string | null>(null);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Timely notification engine state
  const [nextDose, setNextDose] = useState<NextDoseInfo | null>(() =>
    getNextUpcomingDose(medications, todayDateStr)
  );
  const [activeAlertDose, setActiveAlertDose] = useState<{ med: Medication; slot: TimeOfDay } | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Sync quiet hours settings
  useEffect(() => {
    const handleUpdate = () => {
      setQuietSettings(loadQuietHoursSettings());
    };
    window.addEventListener('freshguard_quiet_hours_updated', handleUpdate);
    return () => window.removeEventListener('freshguard_quiet_hours_updated', handleUpdate);
  }, []);

  // Listen for background timely reminder alerts
  useEffect(() => {
    const handleTrigger = (e: any) => {
      if (e.detail?.med && e.detail?.slot) {
        setActiveAlertDose({ med: e.detail.med, slot: e.detail.slot });
      }
    };
    window.addEventListener('freshguard_dose_reminder_triggered', handleTrigger);
    return () => window.removeEventListener('freshguard_dose_reminder_triggered', handleTrigger);
  }, []);

  // Background Timely Reminder Engine: Runs every 20 seconds to evaluate scheduled times & snoozes
  useEffect(() => {
    setNextDose(getNextUpcomingDose(medications, todayDateStr));

    const interval = setInterval(() => {
      // 1. Update next dose calculation
      setNextDose(getNextUpcomingDose(medications, todayDateStr));

      // 2. Check and trigger due reminders
      const { dueItems } = checkAndTriggerDueReminders(medications, todayDateStr);
      if (dueItems.length > 0) {
        setActiveAlertDose((prev) => prev || dueItems[0]);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [medications, todayDateStr]);

  // Modal Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('medication');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState<MedicineForm>('tablet');
  const [frequency, setFrequency] = useState<Medication['frequency']>('once_daily');
  const [times, setTimes] = useState<TimeOfDay[]>(['morning']);
  const [specificTime, setSpecificTime] = useState('08:00');
  const [foodRule, setFoodRule] = useState<MedicationFoodRule>('with_meal');
  const [purpose, setPurpose] = useState('');
  const [doctorInstructions, setDoctorInstructions] = useState('');
  const [pillsRemaining, setPillsRemaining] = useState(30);
  const [totalPills, setTotalPills] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(7);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const openAddModal = (presetCategory: ReminderCategory = 'medication') => {
    setEditingMed(null);
    setName('');
    setCategory(presetCategory);
    setDosage('');
    setForm(presetCategory === 'supplement' ? 'capsule' : 'tablet');
    setFrequency('once_daily');
    setTimes(['morning']);
    setSpecificTime('08:00');
    setFoodRule('with_meal');
    setPurpose('');
    setDoctorInstructions('');
    setPillsRemaining(30);
    setTotalPills(30);
    setRefillThreshold(7);
    setReminderEnabled(true);
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setCategory(med.category || 'medication');
    setDosage(med.dosage);
    setForm(med.form || 'tablet');
    setFrequency(med.frequency);
    setTimes([...med.times]);
    setSpecificTime(med.specificTimes?.[0] || '08:00');
    setFoodRule(med.foodRule);
    setPurpose(med.purpose);
    setDoctorInstructions(med.doctorInstructions || '');
    setPillsRemaining(med.pillsRemaining);
    setTotalPills(med.totalPills);
    setRefillThreshold(med.refillThreshold);
    setReminderEnabled(med.reminderEnabled !== false);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: QuickPreset) => {
    setName(preset.name);
    setCategory(preset.category);
    setDosage(preset.dosage);
    setForm(preset.form);
    setTimes(preset.times);
    if (preset.specificTimes && preset.specificTimes[0]) {
      setSpecificTime(preset.specificTimes[0]);
    }
    setFoodRule(preset.foodRule);
    setPurpose(preset.purpose);
    setDoctorInstructions(preset.doctorInstructions);
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const specificTimesArray = [specificTime];

    if (editingMed) {
      const updated = medications.map((m) =>
        m.id === editingMed.id
          ? {
              ...m,
              name: name.trim(),
              category,
              dosage: dosage.trim(),
              form,
              frequency,
              times,
              specificTimes: specificTimesArray,
              foodRule,
              purpose: purpose.trim(),
              doctorInstructions: doctorInstructions.trim(),
              pillsRemaining: Number(pillsRemaining) || 0,
              totalPills: Number(totalPills) || 30,
              refillThreshold: Number(refillThreshold) || 5,
              reminderEnabled,
            }
          : m
      );
      onUpdateMedications(updated);
    } else {
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: name.trim(),
        category,
        dosage: dosage.trim() || (category === 'supplement' ? '1 capsule' : '1 tablet'),
        form,
        frequency,
        times,
        specificTimes: specificTimesArray,
        foodRule,
        purpose: purpose.trim() || (category === 'supplement' ? 'Dietary health supplement' : 'Prescription medicine'),
        doctorInstructions: doctorInstructions.trim(),
        pillsRemaining: Number(pillsRemaining) || 30,
        totalPills: Number(totalPills) || 30,
        refillThreshold: Number(refillThreshold) || 7,
        reminderEnabled,
        history: {
          [todayDateStr]: {},
        },
        streakDays: 1,
      };
      onUpdateMedications([...medications, newMed]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteMedication = (id: string) => {
    if (window.confirm('Are you sure you want to remove this item from your schedule?')) {
      onUpdateMedications(medications.filter((m) => m.id !== id));
      if (activeAlertDose?.med.id === id) {
        setActiveAlertDose(null);
      }
    }
  };

  const handleToggleTaken = (medId: string, slot: TimeOfDay) => {
    playMedicationChime();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#10b981', '#60a5fa'],
    });

    const updated = medications.map((m) => {
      if (m.id === medId) {
        const todayLog = { ...(m.history?.[todayDateStr] || {}) };
        const currentlyTaken = !!todayLog[slot];
        todayLog[slot] = !currentlyTaken;

        let remaining = m.pillsRemaining;
        if (!currentlyTaken && remaining > 0) {
          remaining -= 1;
        } else if (currentlyTaken) {
          remaining += 1;
        }

        return {
          ...m,
          pillsRemaining: remaining,
          history: {
            ...(m.history || {}),
            [todayDateStr]: todayLog,
          },
        };
      }
      return m;
    });

    onUpdateMedications(updated);

    if (activeAlertDose?.med.id === medId && activeAlertDose.slot === slot) {
      setActiveAlertDose(null);
    }

    const med = medications.find((m) => m.id === medId);
    if (med) {
      speakText(
        currentLanguage === 'hi'
          ? `शानदार! आपने ${med.name} ले ली है।`
          : `Great job! You took your ${med.name} dose.`
      );
    }
  };

  const handleSnooze = (medId: string, minutes: number = 10) => {
    const snoozeTime = Date.now() + minutes * 60 * 1000;
    const updated = medications.map((m) =>
      m.id === medId ? { ...m, snoozedUntil: snoozeTime } : m
    );
    onUpdateMedications(updated);
    setActiveAlertDose(null);
  };

  const handleEnablePermissions = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      playMedicationChime();
      setQuietNotice(
        currentLanguage === 'hi'
          ? '✅ समय पर सूचनाएं (Timely Notifications) चालू कर दी गई हैं!'
          : '✅ Timely reminders enabled! You will receive prompt alerts when doses are due.'
      );
      setTimeout(() => setQuietNotice(null), 5000);
    }
  };

  const handleTestNotification = () => {
    playMedicationChime(true);
    const sample = medications[0] || {
      id: 'test-pill',
      name: 'Sample Reminder Dose',
      dosage: '1 dose',
      times: [currentSlot],
      foodRule: 'with_meal',
      purpose: 'Reminder Verification',
      pillsRemaining: 10,
      totalPills: 30,
      refillThreshold: 5,
      reminderEnabled: true,
      history: {},
    };
    triggerMedicationPushNotification(sample as Medication, currentSlot, { force: true });
    setActiveAlertDose({ med: sample as Medication, slot: currentSlot });
  };

  // Filtered by Category & Slot
  const categorizedMeds = medications.filter((m) => {
    if (categoryFilter === 'all') return true;
    return (m.category || 'medication') === categoryFilter;
  });

  const medsForSlot = categorizedMeds.filter((m) => m.times.includes(selectedSlot));

  // Meds due right now at the current time slot
  const medsDueRightNow = medications.filter((m) => {
    const isScheduledNow = m.times.includes(currentSlot);
    const taken = !!m.history?.[todayDateStr]?.[currentSlot];
    return isScheduledNow && !taken;
  });

  const medCount = medications.filter((m) => (m.category || 'medication') === 'medication').length;
  const suppCount = medications.filter((m) => m.category === 'supplement').length;

  return (
    <div className="space-y-6">
      {/* 1. ACTIVE REAL-TIME DOSE ALERT BANNER (If a timely alert fired or is due) */}
      {activeAlertDose && (
        <ActiveDoseAlertBanner
          medication={activeAlertDose.med}
          slot={activeAlertDose.slot}
          onTakeDose={handleToggleTaken}
          onSnooze={handleSnooze}
          onDismiss={() => setActiveAlertDose(null)}
          currentLanguage={currentLanguage}
        />
      )}

      {/* 2. Top Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <Pill className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentLanguage === 'hi'
                    ? 'दवा एवं सप्लीमेंट रिमाइंडर्स'
                    : 'Medications & Supplements Reminder System'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  {medications.length} Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {currentLanguage === 'hi'
                  ? 'दवाएं व विटामिन्स दर्ज करें • सटीक समय पर फ़ोन सूचनाएं • भोजन बफर नियम • स्मार्ट स्नूज़'
                  : 'Track prescriptions & vitamins • Timely push alerts • Meal buffer rules • Smart snooze'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quiet Hours / Sleep Mode Button */}
          <button
            type="button"
            onClick={() => setIsQuietHoursModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 border shadow-2xs active:scale-95 ${
              isCurrentlyInQuietHours(quietSettings)
                ? 'bg-indigo-900 text-white border-indigo-700 ring-2 ring-indigo-400'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
            }`}
            title="Configure Quiet Hours & Sleep Windows"
          >
            <Moon className={`w-4 h-4 ${isCurrentlyInQuietHours(quietSettings) ? 'text-yellow-300 animate-pulse' : 'text-indigo-600'}`} />
            <span>
              {isCurrentlyInQuietHours(quietSettings)
                ? (currentLanguage === 'hi'
                    ? `🌙 नींद मोड (${formatTime12Hour(quietSettings.startTime)} – ${formatTime12Hour(quietSettings.endTime)})`
                    : `🌙 Sleep Mode (${formatTime12Hour(quietSettings.startTime)} – ${formatTime12Hour(quietSettings.endTime)})`)
                : (currentLanguage === 'hi'
                    ? `शांत घंटे (${formatTime12Hour(quietSettings.startTime)} – ${formatTime12Hour(quietSettings.endTime)})`
                    : `Quiet Hours (${formatTime12Hour(quietSettings.startTime)} – ${formatTime12Hour(quietSettings.endTime)})`)}
            </span>
          </button>

          {/* Camera Scanner */}
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition flex items-center gap-1.5"
            title="Scan pill bottle or supplement box with camera"
          >
            <Camera className="w-4 h-4 text-white animate-pulse" />
            <span className="hidden sm:inline">
              {currentLanguage === 'hi' ? 'कैमरा स्कैन' : 'Scan Box / Pill'}
            </span>
          </button>

          {/* Add Supplement shortcut */}
          <button
            type="button"
            onClick={() => openAddModal('supplement')}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs sm:text-sm border border-emerald-300 shadow-2xs active:scale-95 transition flex items-center gap-1.5"
            title="Add a daily vitamin or dietary supplement"
          >
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span>{currentLanguage === 'hi' ? '+ सप्लीमेंट' : '+ Supplement'}</span>
          </button>

          {/* Add Medication primary button */}
          <button
            type="button"
            onClick={() => openAddModal('medication')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/30 active:scale-95 transition flex items-center gap-1.5"
            title="Add a prescription medication"
          >
            <Plus className="w-4 h-4" />
            <span>{currentLanguage === 'hi' ? '+ दवा जोड़ें' : '+ Add Medicine'}</span>
          </button>
        </div>
      </div>

      {/* 3. TIMELY NOTIFICATION & NEXT DOSE ENGINE STATUS CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-indigo-900/50 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{currentLanguage === 'hi' ? 'समय पर सूचनाएं सक्रिय' : 'Timely Notification Engine Active'}</span>
              </span>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {notificationPermission === 'granted'
                  ? currentLanguage === 'hi'
                    ? 'फोन पुश सक्षम ✅'
                    : 'Device Push: Enabled ✅'
                  : currentLanguage === 'hi'
                  ? 'पुश अनुमति आवश्यक 🔔'
                  : 'Push Permission Needed 🔔'}
              </span>
            </div>

            {/* Next upcoming dose countdown */}
            {nextDose ? (
              <div className="pt-1">
                <div className="text-xs text-indigo-200 font-bold uppercase tracking-wider">
                  {currentLanguage === 'hi' ? 'अगली आने वाली खुराक:' : 'Next Upcoming Scheduled Dose:'}
                </div>
                <div className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                  <span>
                    {nextDose.medication.category === 'supplement' ? '🌿' : '💊'}{' '}
                    {nextDose.medication.name} ({nextDose.medication.dosage})
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600/80 text-white text-xs font-black">
                    {nextDose.timeLabel} • {nextDose.formattedRemaining}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm font-bold text-slate-300 pt-1">
                {currentLanguage === 'hi'
                  ? 'आज की सभी निर्धारित खुराकें पूरी हो चुकी हैं! 🎉'
                  : 'All scheduled doses for today have been taken! Great health adherence! 🎉'}
              </div>
            )}
          </div>

          {/* Quick Notification Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleEnablePermissions}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center gap-1.5 shadow-md shadow-emerald-500/30 active:scale-95"
              >
                <Bell className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>{currentLanguage === 'hi' ? 'पुश अलर्ट चालू करें' : 'Enable Device Push Alerts'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition flex items-center gap-1.5 border border-white/20 active:scale-95"
              title="Test notification chime sound & push alert"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>{currentLanguage === 'hi' ? 'अलर्ट टेस्ट करें' : 'Test Alert Sound'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quiet notice toast */}
      {quietNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-950 text-white border border-indigo-700 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>{quietNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsQuietHoursModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-indigo-200 text-xs font-black transition shrink-0"
          >
            {currentLanguage === 'hi' ? 'सेटिंग्स बदलें' : 'Adjust Settings'}
          </button>
        </div>
      )}

      {/* 4. Category Filter Bar (All / Medications / Supplements) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 ${
              categoryFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{currentLanguage === 'hi' ? '📋 सभी रिमाइंडर्स' : '📋 All Items'}</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-bold">
              {medications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('medication')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 ${
              categoryFilter === 'medication'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'hi' ? 'दवाएं' : 'Prescription Meds'}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                categoryFilter === 'medication' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {medCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoryFilter('supplement')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-1.5 ${
              categoryFilter === 'supplement'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'hi' ? 'सप्लीमेंट्स व विटामिन्स' : 'Supplements & Vitamins'}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                categoryFilter === 'supplement' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {suppCount}
            </span>
          </button>
        </div>

        {/* Read Schedule button */}
        <button
          type="button"
          onClick={() => {
            playMedicationChime();
            const names = medsForSlot.map((m) => `${m.name}, dosage ${m.dosage}`).join(', ');
            speakText(
              `In your ${selectedSlot} schedule, you have ${medsForSlot.length} items: ${names || 'none scheduled'}.`
            );
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          title="Read currently selected slot schedule out loud"
        >
          <Volume2 className="w-4 h-4 text-indigo-700" />
          <span>{currentLanguage === 'hi' ? 'शेड्यूल सुनें' : 'Read Slot Aloud'}</span>
        </button>
      </div>

      {/* 5. DUE NOW BANNER CARD (If anything is due right now in the active slot) */}
      {medsDueRightNow.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl border-2 border-blue-400">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-white/20 rounded-2xl text-2xl animate-pulse">
                ⏰
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-black text-blue-200">
                    {currentLanguage === 'hi' ? 'अभी लेने का समय' : 'DUE RIGHT NOW'} • ({getTimeOfDayLabel(currentSlot)})
                  </span>
                  {isCurrentlyInQuietHours(quietSettings) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-950/80 text-yellow-300 border border-yellow-400/40 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-yellow-300" />
                      <span>{currentLanguage === 'hi' ? 'नींद मोड' : 'Sleep Window Active'}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black">
                  {currentLanguage === 'hi'
                    ? `आपके पास अभी ${medsDueRightNow.length} दवा/सप्लीमेंट देय हैं!`
                    : `You Have ${medsDueRightNow.length} Medicine/Supplement${medsDueRightNow.length > 1 ? 's' : ''} Due Right Now!`}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await requestNotificationPermission();
                  let silencedCount = 0;
                  let sentCount = 0;
                  let criticalBypassCount = 0;

                  medsDueRightNow.forEach((m) => {
                    const res = triggerMedicationPushNotification(m, currentSlot);
                    if (res.silencedByQuietHours) silencedCount++;
                    else if (res.sent) sentCount++;
                    if (res.isCriticalBypass) criticalBypassCount++;
                  });

                  if (silencedCount > 0) {
                    setQuietNotice(
                      `🌙 ${silencedCount} alert(s) silenced by Quiet Hours (${formatTime12Hour(quietSettings.startTime)} – ${formatTime12Hour(quietSettings.endTime)}) to protect sleep.`
                    );
                    setTimeout(() => setQuietNotice(null), 6000);
                  } else if (sentCount > 0) {
                    setQuietNotice(`✅ ${sentCount} push notification reminder sent to your device!`);
                    setTimeout(() => setQuietNotice(null), 4000);
                  }
                }}
                className="px-3.5 py-2 bg-white text-blue-900 hover:bg-blue-50 text-xs sm:text-sm font-black rounded-xl flex items-center gap-1.5 transition shadow active:scale-95"
                title="Send push notification reminder to your phone/device"
              >
                <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
                <span>Send Push Alert Now</span>
              </button>
            </div>
          </div>

          {/* Quick Cards inside Due Now */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {medsDueRightNow.map((med) => (
              <div
                key={med.id}
                className="bg-white text-slate-900 rounded-2xl p-4 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {med.category === 'supplement' ? '🌿 Supplement' : '💊 Medicine'}
                      </span>
                      {med.specificTimes?.[0] && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          ⏰ {formatTime12Hour(med.specificTimes[0])}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{med.name}</h3>
                    <span className="text-sm font-bold text-blue-700">{med.dosage}</span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      med.foodRule === 'with_meal'
                        ? 'bg-amber-50 text-amber-900 border-amber-300'
                        : med.foodRule === 'empty_stomach'
                        ? 'bg-cyan-50 text-cyan-900 border-cyan-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {med.foodRule === 'with_meal' ? '🍽️ Take With Food' : med.foodRule === 'empty_stomach' ? '💧 Empty Stomach' : '⏰ Anytime'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSnooze(med.id, 10)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>Snooze 10m</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleTaken(med.id, currentSlot)}
                    className="px-4 py-2 font-black text-xs sm:text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Take Dose Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Routine Time Slot Selector Tabs (Morning, Noon, Evening, Bedtime) */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIME_SLOTS.map((ts) => {
            const count = categorizedMeds.filter((m) => m.times.includes(ts.slot)).length;
            const completedCount = categorizedMeds.filter(
              (m) => m.times.includes(ts.slot) && m.history?.[todayDateStr]?.[ts.slot]
            ).length;
            const isSelected = selectedSlot === ts.slot;
            const isCurrent = currentSlot === ts.slot;

            return (
              <button
                key={ts.slot}
                type="button"
                onClick={() => setSelectedSlot(ts.slot)}
                className={`relative p-4 rounded-3xl border-2 text-left transition active:scale-95 shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                {isCurrent && (
                  <span
                    className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected ? 'bg-white text-blue-900' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    Now
                  </span>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ts.icon}</span>
                    <span className="font-black text-sm sm:text-base">
                      {ts.label}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      isSelected ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {ts.timeRange}
                  </span>
                </div>

                <div className="mt-2 text-xs font-bold flex items-center justify-between">
                  <span>
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        completedCount === count
                          ? isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                          : isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {completedCount}/{count} taken
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Medication & Supplement Schedule List for Selected Slot */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>{getTimeOfDayIcon(selectedSlot)}</span>
            <span>
              {getTimeOfDayLabel(selectedSlot)}{' '}
              {categoryFilter === 'supplement'
                ? 'Supplements'
                : categoryFilter === 'medication'
                ? 'Medications'
                : 'Schedule'}
            </span>
            <span className="text-xs text-slate-500 font-normal">
              ({medsForSlot.length} scheduled)
            </span>
          </h3>

          <button
            type="button"
            onClick={() => {
              const text = medsForSlot
                .map((m) => `${m.name}, dosage ${m.dosage}. Instructions: ${m.doctorInstructions || m.purpose}`)
                .join('. ');
              speakText(`Your ${selectedSlot} items are: ${text || 'none scheduled'}`);
            }}
            className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Hear All {selectedSlot} Items
          </button>
        </div>

        {medsForSlot.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500">
              <Pill className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No items scheduled for {getTimeOfDayLabel(selectedSlot)}
            </h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Tap below to schedule a prescription medicine or dietary supplement for this time window.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => openAddModal('supplement')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 border border-emerald-200 transition"
              >
                + Add Supplement
              </button>
              <button
                type="button"
                onClick={() => openAddModal('medication')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-800 font-bold text-xs hover:bg-blue-100 border border-blue-200 transition"
              >
                + Add Medication
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medsForSlot.map((med) => {
              const isTaken = !!med.history?.[todayDateStr]?.[selectedSlot];
              const isRefillLow = med.pillsRemaining <= med.refillThreshold;
              const isSupplement = med.category === 'supplement';

              return (
                <div
                  key={med.id}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-sm flex flex-col justify-between ${
                    isTaken
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isSupplement
                      ? 'border-emerald-100 hover:border-emerald-300'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Category tag, exact time, and Taken status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 ${
                            isSupplement
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {isSupplement ? <Leaf className="w-3 h-3 text-emerald-700" /> : <Pill className="w-3 h-3 text-blue-700" />}
                          <span>{isSupplement ? 'Supplement' : 'Medication'}</span>
                        </span>

                        {med.specificTimes?.[0] && (
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{formatTime12Hour(med.specificTimes[0])}</span>
                          </span>
                        )}
                      </div>

                      {isTaken && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Taken
                        </span>
                      )}
                    </div>

                    {/* Name & Dosage */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-black text-slate-900 leading-tight">
                          {med.name}
                        </h4>
                        <span className="text-sm font-bold text-blue-700">
                          {med.dosage} {med.form ? `• ${med.form}` : ''}
                        </span>
                      </div>

                      {/* Read Out Loud Button */}
                      <button
                        type="button"
                        onClick={() =>
                          speakText(
                            `${isSupplement ? 'Supplement' : 'Medication'}: ${med.name}. Dosage: ${med.dosage}. ${
                              med.foodRule === 'with_meal'
                                ? 'Important: take with food'
                                : med.foodRule === 'empty_stomach'
                                ? 'Take on an empty stomach'
                                : ''
                            }. ${med.doctorInstructions || med.purpose}`
                          )
                        }
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Read out loud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Food Rule Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                          med.foodRule === 'with_meal'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : med.foodRule === 'empty_stomach'
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {med.foodRule === 'with_meal'
                          ? '🍽️ Take With Food (Meal Buffer)'
                          : med.foodRule === 'empty_stomach'
                          ? '💧 Take on Empty Stomach'
                          : '⏰ Anytime with water'}
                      </span>
                    </div>

                    {/* Purpose / Instructions */}
                    <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-700 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>Purpose & Timing:</span>
                      </div>
                      <p className="text-slate-700">{med.purpose}</p>
                      {med.doctorInstructions && (
                        <p className="text-[11px] text-amber-900 font-semibold pt-1 border-t border-slate-200">
                          Note: {med.doctorInstructions}
                        </p>
                      )}
                    </div>

                    {/* Pill Count & Refill Warning */}
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Supply remaining:{' '}
                        <strong className={isRefillLow ? 'text-rose-600 font-black' : 'text-slate-900'}>
                          {med.pillsRemaining} of {med.totalPills}
                        </strong>
                      </span>
                      {isRefillLow && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Refill Soon!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {/* Send Push Alert Now */}
                      <button
                        type="button"
                        onClick={async () => {
                          await requestNotificationPermission();
                          triggerMedicationPushNotification(med, selectedSlot, { force: true });
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                        title="Send timely push reminder to device now"
                      >
                        <Bell className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(med)}
                        className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Edit details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete from schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleTaken(med.id, selectedSlot)}
                      className={`px-4 py-2 font-black text-xs sm:text-sm rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1.5 ${
                        isTaken
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
                      }`}
                    >
                      {isTaken ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          Taken (Tap to undo)
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          I Took This Dose
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. Add / Edit Medication & Supplement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white">
              <div className="flex items-center gap-2">
                {category === 'supplement' ? (
                  <Leaf className="w-5 h-5 text-emerald-300" />
                ) : (
                  <Pill className="w-5 h-5 text-blue-300" />
                )}
                <h2 className="text-lg font-black tracking-tight">
                  {editingMed
                    ? category === 'supplement'
                      ? 'Edit Supplement Reminder'
                      : 'Edit Medication Reminder'
                    : category === 'supplement'
                    ? 'Add Dietary Supplement / Vitamin'
                    : 'Add Prescription Medication'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Category Selector Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Item Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('medication');
                      setForm('tablet');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition ${
                      category === 'medication'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span>Prescription Medicine</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory('supplement');
                      setForm('capsule');
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition ${
                      category === 'supplement'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Leaf className="w-4 h-4" />
                    <span>Dietary Supplement / Vitamin</span>
                  </button>
                </div>
              </div>

              {/* Quick Template Presets for Instant Input */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Popular 1-Tap Presets ({category === 'supplement' ? 'Supplements' : 'Medications'}):</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.filter((p) => p.category === category).map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-2xs"
                    >
                      <span>{preset.category === 'supplement' ? '🌿' : '💊'}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  {category === 'supplement' ? 'Supplement / Vitamin Name *' : 'Medication Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    category === 'supplement'
                      ? 'e.g. Vitamin D3, Omega-3 Fish Oil, Magnesium, Multivitamin...'
                      : 'e.g. Metformin, Amlodipine, Atorvastatin, Omeprazole...'
                  }
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              {/* Dosage & Medicine Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 500 mg, 2000 IU, 1 capsule, 10 ml"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Form / Delivery
                  </label>
                  <select
                    value={form}
                    onChange={(e) => setForm(e.target.value as MedicineForm)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    {MEDICINE_FORMS.map((f) => (
                      <option key={f.form} value={f.form}>
                        {f.icon} {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Frequency & Exact Notification Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as Medication['frequency'])}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="once_daily">Once Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="three_times_daily">Three Times Daily</option>
                    <option value="every_other_day">Every Other Day</option>
                    <option value="weekly">Weekly</option>
                    <option value="as_needed">As Needed (PRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                    <span>Exact Alert Time</span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {formatTime12Hour(specificTime)}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={specificTime}
                    onChange={(e) => setSpecificTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Routine Time Slot Buttons */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Routine Schedule Slots (Select all that apply) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((ts) => {
                    const checked = times.includes(ts.slot);
                    return (
                      <button
                        key={ts.slot}
                        type="button"
                        onClick={() => {
                          if (checked) {
                            if (times.length > 1) {
                              setTimes(times.filter((t) => t !== ts.slot));
                            }
                          } else {
                            setTimes([...times, ts.slot]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-1 ${
                          checked
                            ? 'bg-blue-50 border-blue-500 text-blue-800'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xl">{ts.icon}</span>
                        <span>{ts.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meal & Food Instruction */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Food Alignment Rule *
                </label>
                <select
                  value={foodRule}
                  onChange={(e) => setFoodRule(e.target.value as MedicationFoodRule)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="with_meal">🍽️ Take with Food / After Eating (Meal Buffer)</option>
                  <option value="empty_stomach">💧 Take on Empty Stomach (with water)</option>
                  <option value="anytime">⏰ Anytime with water (Flexible)</option>
                </select>
              </div>

              {/* Purpose & Doctor Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Purpose / Health Reason (Why you take this)
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. For bone strength, blood pressure, heart health..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Doctor or Label Instructions
                </label>
                <textarea
                  rows={2}
                  value={doctorInstructions}
                  onChange={(e) => setDoctorInstructions(e.target.value)}
                  placeholder="e.g. Do not take with grapefruit juice. Drink full glass of water."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stock and Refill tracking */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Units Left
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pillsRemaining}
                    onChange={(e) => setPillsRemaining(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Bottle Total
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalPills}
                    onChange={(e) => setTotalPills(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Refill Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={refillThreshold}
                    onChange={(e) => setRefillThreshold(parseInt(e.target.value, 10) || 7)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Reminder toggle */}
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-blue-950">
                    Enable Timely Push Reminders & Chime
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
                >
                  {editingMed ? 'Save Changes' : 'Save Reminder to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Camera Scanner Modal */}
      <MedicineCameraScanner
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        existingMedications={medications}
        onMarkMedicationTaken={(id, slot) => handleToggleTaken(id, slot)}
        onAddNewMedication={(newMed) => onUpdateMedications([...medications, newMed])}
        easyMode={easyMode}
      />

      {/* 10. Dedicated Quiet Hours / Sleep Mode Modal */}
      {isQuietHoursModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-3xl w-full my-8 animate-in fade-in zoom-in-95">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setIsQuietHoursModalOpen(false)}
                className="bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full font-bold shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <QuietHoursSettingsCard
              currentLanguage={currentLanguage}
              easyMode={easyMode}
              medications={medications}
              onSettingsChange={(newS) => setQuietSettings(newS)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
