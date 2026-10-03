import React, { useState, useEffect } from 'react';
import { Medication, FoodItem, FoodSymptomProfile, MedicationSymptomProfile, SymptomLogEntry } from '../../types';
import {
  BUILTIN_FOOD_SYMPTOMS,
  fetchMedicationSymptomProfile,
  correlateSymptomWithTriggers,
} from '../../utils/symptomsDatabase';
import { calculateDaysLeft, getTodayDateString } from '../../utils/foodDatabase';
import { speakText } from '../../utils/voiceService';
import { playFoodAlertBeep, playMedicationChime } from '../../utils/notificationService';
import {
  Activity,
  AlertTriangle,
  Pill,
  Utensils,
  Volume2,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Search,
  Sparkles,
  Heart,
  Thermometer,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Flame,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SymptomsCenterProps {
  medications: Medication[];
  foodItems: FoodItem[];
  easyMode: boolean;
}

export const SymptomsCenter: React.FC<SymptomsCenterProps> = ({
  medications,
  foodItems,
  easyMode,
}) => {
  const [activeTab, setActiveTab] = useState<'correlate_logger' | 'medicine_symptoms' | 'food_symptoms'>('correlate_logger');

  // Medicine Symptoms State
  const [selectedMedId, setSelectedMedId] = useState<string>(
    medications.length > 0 ? medications[0].id : ''
  );
  const [medProfiles, setMedProfiles] = useState<Record<string, MedicationSymptomProfile>>({});
  const [isLoadingMedProfile, setIsLoadingMedProfile] = useState(false);
  const [quickSymptomInput, setQuickSymptomInput] = useState<string>('');
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  // Food Symptoms State
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('all');
  const [searchFoodSymptom, setSearchFoodSymptom] = useState<string>('');
  const [selectedUserSymptoms, setSelectedUserSymptoms] = useState<string[]>([]);
  const [detectedFoodCondition, setDetectedFoodCondition] = useState<FoodSymptomProfile | null>(null);

  // --- SYMPTOM LOGGER & CORRELATION STATE ---
  const [symptomLogs, setSymptomLogs] = useState<SymptomLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mohammed_hisam_symptom_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [loggerSymptom, setLoggerSymptom] = useState<string>('Nausea / Stomach ache');
  const [customSymptomText, setCustomSymptomText] = useState<string>('');
  const [loggerSeverity, setLoggerSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [loggerTiming, setLoggerTiming] = useState<string>('Within 30–60 minutes');
  const [selectedMedsForLog, setSelectedMedsForLog] = useState<string[]>([]);
  const [selectedFoodsForLog, setSelectedFoodsForLog] = useState<string[]>([]);
  const [customFoodItem, setCustomFoodItem] = useState<string>('');
  const [loggerNotes, setLoggerNotes] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestAnalysisResult, setLatestAnalysisResult] = useState<SymptomLogEntry | null>(null);

  const todayStr = getTodayDateString();

  // Expiring foods in kitchen
  const expiringKitchenFoods = foodItems.filter(
    (f) => !f.consumed && calculateDaysLeft(f.expirationDate) <= 2
  );

  // Auto-prefill recently taken meds and recently consumed foods on mount or when logging
  useEffect(() => {
    // Check which medications were recorded taken today
    const takenTodayIds = medications
      .filter((m) => m.history && m.history[todayStr] && Object.values(m.history[todayStr]).some(Boolean))
      .map((m) => m.id);

    // If none explicitly marked taken, default to all user active meds
    if (takenTodayIds.length > 0) {
      setSelectedMedsForLog(takenTodayIds);
    } else if (medications.length > 0) {
      setSelectedMedsForLog([medications[0].id]);
    }

    // Default recent foods: unconsumed kitchen foods or consumed items
    const defaultFoods = foodItems.slice(0, 3).map((f) => f.name);
    setSelectedFoodsForLog(defaultFoods);
  }, [medications, foodItems, todayStr]);

  // Save logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mohammed_hisam_symptom_logs', JSON.stringify(symptomLogs));
    } catch (e) {
      console.warn('Could not save symptom logs:', e);
    }
  }, [symptomLogs]);

  // Load symptom profiles for user medications
  useEffect(() => {
    async function loadProfiles() {
      if (medications.length === 0) return;
      setIsLoadingMedProfile(true);

      const map: Record<string, MedicationSymptomProfile> = {};
      for (const med of medications) {
        const profile = await fetchMedicationSymptomProfile(med.name, med.dosage);
        map[med.id] = profile;
      }
      setMedProfiles(map);
      setIsLoadingMedProfile(false);
    }

    loadProfiles();
  }, [medications]);

  // Keep selected med valid
  useEffect(() => {
    if (medications.length > 0 && (!selectedMedId || !medications.some((m) => m.id === selectedMedId))) {
      setSelectedMedId(medications[0].id);
    }
  }, [medications, selectedMedId]);

  const currentMed = medications.find((m) => m.id === selectedMedId) || medications[0];
  const currentMedProfile = currentMed ? medProfiles[currentMed.id] : null;

  // Speak medicine symptoms out loud
  const handleSpeakMedSymptoms = () => {
    if (!currentMed || !currentMedProfile) return;
    const mild = currentMedProfile.commonMildSymptoms.slice(0, 2).join(', ');
    const warnings = currentMedProfile.alertWarningSymptoms.slice(0, 2).join(', ');
    const text = `Symptom guide for ${currentMed.name}. Common mild symptoms include: ${mild}. How to relieve: ${currentMedProfile.howToPreventOrRelieve}. Serious warning symptoms: ${warnings}.`;
    speakText(text);
  };

  // Speak food symptoms out loud
  const handleSpeakFoodCondition = (cond: FoodSymptomProfile) => {
    const text = `Food reaction guide for ${cond.condition}. Symptoms: ${cond.commonSymptoms.slice(0, 3).join(', ')}. Immediate action: ${cond.immediateAction}`;
    speakText(text);
  };

  // Run Symptom Trigger Correlation Analysis
  const handleRunCorrelation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSymptomName =
      loggerSymptom === 'Other (type below)' && customSymptomText.trim()
        ? customSymptomText.trim()
        : loggerSymptom;

    if (!finalSymptomName) return;

    setIsAnalyzing(true);
    playFoodAlertBeep();

    // Prepare food list
    const finalFoods = [...selectedFoodsForLog];
    if (customFoodItem.trim() && !finalFoods.includes(customFoodItem.trim())) {
      finalFoods.push(customFoodItem.trim());
    }

    // Prepare meds list
    const finalMeds = medications
      .filter((m) => selectedMedsForLog.includes(m.id))
      .map((m) => ({
        name: m.name,
        dosage: m.dosage,
        foodRule: m.foodRule,
      }));

    try {
      const result = await correlateSymptomWithTriggers({
        symptomName: finalSymptomName,
        severity: loggerSeverity,
        timing: loggerTiming,
        recentFoods: finalFoods,
        recentMeds: finalMeds,
        notes: loggerNotes,
      });

      setLatestAnalysisResult(result);
      setSymptomLogs((prev) => [result, ...prev]);

      playMedicationChime();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#3b82f6'],
      });

      // Voice read-out of the identified trigger
      speakText(
        `Trigger analysis completed. ${result.identifiedPrimaryTrigger}. Action plan: ${result.actionPlan}`
      );
    } catch (err) {
      console.error('Trigger correlation failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteLog = (id: string) => {
    setSymptomLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // Quick symptom response in medicine tab
  const handleQuickMedSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSymptomInput.trim() || !currentMed) return;

    playMedicationChime();
    const advice = currentMed.foodRule === 'with_meal'
      ? `You reported "${quickSymptomInput}" for ${currentMed.name}. Remember that this medicine requires food to buffer your stomach lining. Eating 1 fist of complex carbs (toast or crackers) usually resolves mild nausea.`
      : `You reported "${quickSymptomInput}" for ${currentMed.name}. Drink a full glass of water and rest. If symptoms persist or dizziness worsens, alert your healthcare provider.`;

    setQuickFeedback(advice);
    speakText(advice);
    setQuickSymptomInput('');
  };

  // Interactive Food Symptom Evaluator
  const handleToggleSymptom = (sym: string) => {
    let updated: string[];
    if (selectedUserSymptoms.includes(sym)) {
      updated = selectedUserSymptoms.filter((s) => s !== sym);
    } else {
      updated = [...selectedUserSymptoms, sym];
    }
    setSelectedUserSymptoms(updated);

    if (updated.length === 0) {
      setDetectedFoodCondition(null);
      return;
    }

    const lower = updated.map((s) => s.toLowerCase());
    let bestMatch: FoodSymptomProfile | null = null;
    let maxMatches = 0;

    for (const cond of BUILTIN_FOOD_SYMPTOMS) {
      let matches = 0;
      for (const s of cond.commonSymptoms) {
        if (lower.some((userSym) => s.toLowerCase().includes(userSym))) {
          matches++;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = cond;
      }
    }

    setDetectedFoodCondition(bestMatch || BUILTIN_FOOD_SYMPTOMS[0]);
  };

  const filteredFoodSymptoms = BUILTIN_FOOD_SYMPTOMS.filter((f) => {
    const matchesCat = selectedFoodCategory === 'all' || f.category === selectedFoodCategory;
    const matchesQuery =
      searchFoodSymptom === '' ||
      f.condition.toLowerCase().includes(searchFoodSymptom.toLowerCase()) ||
      f.commonSymptoms.some((s) => s.toLowerCase().includes(searchFoodSymptom.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Food & Medicine Symptoms Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-700">
              Log symptoms to correlate triggers • Side effects for your added medicines • Food spoilage reactions
            </p>
          </div>
        </div>

        {/* Voice Speaker */}
        <button
          onClick={() => {
            speakText(
              activeTab === 'correlate_logger'
                ? `You are on the Trigger Correlator. Log any symptom you feel right now, and the system will cross-check your recent meals and medication doses to identify the cause.`
                : activeTab === 'medicine_symptoms'
                ? `You are viewing medicine symptoms. Select any of your added medications to see common side effects, relief tips, and warning signs.`
                : `You are viewing food symptoms. Learn about spoiled food bacteria, lactose intolerance, acid reflux, and sugar spikes.`
            );
          }}
          className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shrink-0 border border-purple-200"
        >
          <Volume2 className="w-4 h-4 text-purple-600 animate-pulse" />
          <span>🔊 Voice Overview</span>
        </button>
      </div>

      {/* THREE SEPARATE SECTIONS NAVIGATION TABS */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white p-1.5 rounded-2xl border shadow-xs gap-1.5 sm:gap-2">
        {/* Tab 1: Log Symptom & Correlate Trigger (The requested feature) */}
        <button
          type="button"
          onClick={() => setActiveTab('correlate_logger')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'correlate_logger'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>⚡ Log Symptom & Correlate Trigger</span>
          {symptomLogs.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'correlate_logger'
                  ? 'bg-purple-900 text-purple-100'
                  : 'bg-purple-100 text-purple-800'
              }`}
            >
              {symptomLogs.length}
            </span>
          )}
        </button>

        {/* Tab 2: Medicine Symptoms (For your added medications) */}
        <button
          type="button"
          onClick={() => setActiveTab('medicine_symptoms')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'medicine_symptoms'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>💊 Medicine Symptoms Guide</span>
          {medications.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'medicine_symptoms'
                  ? 'bg-blue-800 text-blue-100'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {medications.length}
            </span>
          )}
        </button>

        {/* Tab 3: Food Symptoms & Spoilage Reactions */}
        <button
          type="button"
          onClick={() => setActiveTab('food_symptoms')}
          className={`flex-1 py-3 px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'food_symptoms'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>🥗 Food Symptoms Directory</span>
          {expiringKitchenFoods.length > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'food_symptoms'
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {expiringKitchenFoods.length} Expiring
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: LOG SYMPTOM & CORRELATE WITH RECENT FOOD / MEDICATION INTAKE */}
      {/* ========================================================================= */}
      {activeTab === 'correlate_logger' && (
        <div className="space-y-6">
          {/* Main Symptom Logger & Correlation Form */}
          <div className="bg-white rounded-3xl border-2 border-purple-300 p-5 sm:p-7 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-purple-100 text-purple-700 rounded-2xl text-2xl">
                  🔍
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900">
                      Symptom Trigger Correlation Engine
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Food vs Medicine Analysis
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                    Log What You Feel & Identify The Cause
                  </h2>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Cross-references your active pills & pantry intake
              </div>
            </div>

            <form onSubmit={handleRunCorrelation} className="space-y-5">
              {/* STEP 1: Select What Symptom You Are Experiencing */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span>1. What Symptom Are You Experiencing Right Now?</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Nausea / Stomach ache',
                    'Sharp Stomach Cramps',
                    'Bloating & Gas',
                    'Watery Diarrhea',
                    'Heartburn / Acid Reflux',
                    'Dizziness / Lightheadedness',
                    'Sudden Fatigue / Brain Fog',
                    'Skin Itching / Hives',
                    'Dry Tickly Cough',
                    'Other (type below)',
                  ].map((sym) => {
                    const isSelected = loggerSymptom === sym;
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => setLoggerSymptom(sym)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isSelected ? '●' : '○'}</span>
                        <span>{sym}</span>
                      </button>
                    );
                  })}
                </div>

                {loggerSymptom === 'Other (type below)' && (
                  <input
                    type="text"
                    value={customSymptomText}
                    onChange={(e) => setCustomSymptomText(e.target.value)}
                    placeholder="Describe your symptom (e.g. Shakiness, metallic taste, headache)..."
                    className="w-full mt-2 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                )}
              </div>

              {/* STEP 2: Severity & Onset Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                    2. How Severe Is It?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mild', label: 'Mild', desc: 'Manageable' },
                      { id: 'moderate', label: 'Moderate', desc: 'Uncomfortable' },
                      { id: 'severe', label: 'Severe', desc: 'Very painful' },
                    ].map((sev) => (
                      <button
                        key={sev.id}
                        type="button"
                        onClick={() => setLoggerSeverity(sev.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          loggerSeverity === sev.id
                            ? 'bg-purple-50 border-purple-600 text-purple-950 font-black shadow-xs ring-1 ring-purple-600'
                            : 'bg-white border-slate-200 text-slate-700 font-semibold hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs capitalize">{sev.label}</span>
                        <span className="text-[10px] text-slate-500">{sev.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                    3. When Did It Start?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'Within 30–60 minutes',
                      '1 to 2 hours ago',
                      'Over 3 hours ago',
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLoggerTiming(t)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          loggerTiming === t
                            ? 'bg-purple-50 border-purple-600 text-purple-950 font-black shadow-xs ring-1 ring-purple-600'
                            : 'bg-white border-slate-200 text-slate-700 font-semibold hover:bg-slate-50'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-purple-600" />
                        <span className="block text-[11px] leading-tight">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STEP 3: Correlate With Taken Medications & Recent Food Intake */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
                {/* Check Taken Medications */}
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-blue-600" />
                      Recent Medication Doses
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold">
                      Check what you took recently
                    </span>
                  </div>

                  {medications.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No medications in your schedule.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {medications.map((m) => {
                        const isChecked = selectedMedsForLog.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                              isChecked
                                ? 'bg-white border-blue-400 font-bold text-slate-900 shadow-xs'
                                : 'bg-white/60 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedMedsForLog(selectedMedsForLog.filter((id) => id !== m.id));
                                  } else {
                                    setSelectedMedsForLog([...selectedMedsForLog, m.id]);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                              <span>
                                {m.name} ({m.dosage})
                              </span>
                            </div>
                            <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">
                              {m.foodRule === 'with_meal' ? 'Needs food' : 'Empty stomach'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Check Recent Food Intake */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      Recent Food / Drink Consumed
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Eaten in last 1–4 hours
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {foodItems.map((f) => {
                      const isChecked = selectedFoodsForLog.includes(f.name);
                      const isExpiring = calculateDaysLeft(f.expirationDate) <= 2;
                      return (
                        <label
                          key={f.id}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                            isChecked
                              ? 'bg-white border-emerald-400 font-bold text-slate-900 shadow-xs'
                              : 'bg-white/60 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedFoodsForLog(selectedFoodsForLog.filter((name) => name !== f.name));
                                } else {
                                  setSelectedFoodsForLog([...selectedFoodsForLog, f.name]);
                                }
                              }}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                            />
                            <span>{f.name}</span>
                          </div>
                          {isExpiring && (
                            <span className="text-[9px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-full font-black">
                              Expiring Soon
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Add Other Food Eaten */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customFoodItem}
                      onChange={(e) => setCustomFoodItem(e.target.value)}
                      placeholder="+ Other food (e.g. coffee, milk, pizza)..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customFoodItem.trim() && !selectedFoodsForLog.includes(customFoodItem.trim())) {
                          setSelectedFoodsForLog([...selectedFoodsForLog, customFoodItem.trim()]);
                          setCustomFoodItem('');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Additional Notes (Optional context: e.g. "Skipped breakfast before taking my pill"):
                </label>
                <input
                  type="text"
                  value={loggerNotes}
                  onChange={(e) => setLoggerNotes(e.target.value)}
                  placeholder="e.g. Took medicine with only black tea; ate dinner late..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cross-Checking Foods & Medications...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    <span>Correlate & Identify Trigger Now</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* LATEST IDENTIFIED CORRELATION RESULT */}
          {latestAnalysisResult && (
            <div className="bg-purple-50 border-2 border-purple-400 rounded-3xl p-5 sm:p-7 shadow-lg space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200">
                <div className="flex items-center gap-3">
                  <span className="p-3 bg-purple-600 text-white rounded-2xl text-2xl shadow-md">
                    🎯
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-200 text-purple-900">
                        Identified Likely Trigger
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          latestAnalysisResult.triggerType === 'medicine'
                            ? 'bg-blue-100 text-blue-900'
                            : latestAnalysisResult.triggerType === 'food'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {latestAnalysisResult.triggerType === 'medicine'
                          ? '💊 Medication Trigger'
                          : latestAnalysisResult.triggerType === 'food'
                          ? '🥗 Food Trigger'
                          : '🍽️ Food-Drug Interaction'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {latestAnalysisResult.identifiedPrimaryTrigger}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    speakText(
                      `Trigger Result: ${latestAnalysisResult.identifiedPrimaryTrigger}. Action to take: ${latestAnalysisResult.actionPlan}`
                    );
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                >
                  <Volume2 className="w-4 h-4 text-purple-200 animate-pulse" />
                  <span>🔊 Listen</span>
                </button>
              </div>

              {/* Correlation Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Medication Breakdown */}
                {latestAnalysisResult.correlatedMedications.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-purple-200 space-y-2 shadow-xs">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-blue-600" />
                      Medication Correlation Breakdown:
                    </span>
                    <div className="space-y-2">
                      {latestAnalysisResult.correlatedMedications.map((m, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-blue-950 font-bold">
                              {m.name} ({m.dosage})
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                m.likelihood === 'high'
                                  ? 'bg-rose-100 text-rose-800'
                                  : m.likelihood === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {m.likelihood} Likelihood
                            </span>
                          </div>
                          <p className="text-slate-700">{m.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Food Breakdown */}
                {latestAnalysisResult.correlatedFoods.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-purple-200 space-y-2 shadow-xs">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                      Food & Dietary Breakdown:
                    </span>
                    <div className="space-y-2">
                      {latestAnalysisResult.correlatedFoods.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-emerald-950 font-bold">
                              {f.name}
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                f.likelihood === 'high'
                                  ? 'bg-rose-100 text-rose-800'
                                  : f.likelihood === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {f.likelihood} Likelihood
                            </span>
                          </div>
                          <p className="text-slate-700">{f.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Immediate Action Plan */}
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-400 space-y-1.5 shadow-sm">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  What You Should Do Right Now (Action Plan):
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-semibold whitespace-pre-line leading-relaxed">
                  {latestAnalysisResult.actionPlan}
                </p>
              </div>

              {/* Red Flag Warning Signs */}
              <div className="p-3.5 bg-rose-100/90 border border-rose-300 rounded-2xl text-xs text-rose-950 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-rose-900">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Emergency Warning Signs (Seek Medical Care If):
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-rose-900">
                  {latestAnalysisResult.warningSigns.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* SYMPTOM LOG HISTORY TIMELINE */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">
                  Your Logged Symptoms & Trigger History ({symptomLogs.length})
                </h3>
              </div>

              {symptomLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all logged symptoms?')) {
                      setSymptomLogs([]);
                      setLatestAnalysisResult(null);
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            {symptomLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No symptoms logged yet. Use the form above whenever you feel discomfort after meals or medications!
              </div>
            ) : (
              <div className="space-y-3">
                {symptomLogs.map((log) => {
                  const dateFormatted = new Date(log.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 bg-slate-50/70 space-y-2 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {log.symptomName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                log.severity === 'severe'
                                  ? 'bg-rose-100 text-rose-800'
                                  : log.severity === 'moderate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {log.severity}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {log.timing}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-purple-900 mt-1">
                            🎯 Trigger: {log.identifiedPrimaryTrigger}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{dateFormatted}</span>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Delete this entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Small plan preview */}
                      <p className="text-xs text-slate-600 line-clamp-2 bg-white p-2 rounded-xl border border-slate-200">
                        {log.actionPlan}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: MEDICINE SYMPTOMS GUIDE (FOR USER'S ADDED MEDICATIONS) */}
      {/* ========================================================================= */}
      {activeTab === 'medicine_symptoms' && (
        <div className="space-y-6">
          {medications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <Pill className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                No medications added in your app yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Scan your medicine bottle with the camera or add your daily prescriptions in the
                Medications tab. The app will immediately generate a full symptom and side effect guide for each pill!
              </p>
            </div>
          ) : (
            <>
              {/* Medication Selector Chips */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  Select Medicine to View Its Symptoms & Side Effects:
                </span>
                <div className="flex flex-wrap gap-2">
                  {medications.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMedId(m.id);
                        setQuickFeedback(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                        selectedMedId === m.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>{m.name} ({m.dosage})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Medication Symptoms Detail Card */}
              {currentMed && (
                <div className="bg-white rounded-3xl border-2 border-blue-400 p-5 sm:p-6 shadow-md space-y-5">
                  {/* Card Title & Voice Speaker */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900">
                          Medication Symptom Profile
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            currentMed.foodRule === 'with_meal'
                              ? 'bg-amber-100 text-amber-900'
                              : currentMed.foodRule === 'empty_stomach'
                              ? 'bg-cyan-100 text-cyan-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {currentMed.foodRule === 'with_meal'
                            ? '🍽️ Take With Food Buffer'
                            : currentMed.foodRule === 'empty_stomach'
                            ? '💧 Take on Empty Stomach'
                            : '⏰ Take Anytime'}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                        {currentMed.name} ({currentMed.dosage})
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Purpose: {currentMed.purpose || 'Prescription medication management'}
                      </p>
                    </div>

                    <button
                      onClick={handleSpeakMedSymptoms}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Volume2 className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span>🔊 Listen to Symptoms</span>
                    </button>
                  </div>

                  {isLoadingMedProfile && (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Loading clinical symptom profile for {currentMed.name}...
                    </div>
                  )}

                  {currentMedProfile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Box 1: Normal Mild Symptoms & Relief */}
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                          <span className="text-xl">🟡</span>
                          <span>Common Mild Symptoms (What You Might Feel)</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {currentMedProfile.commonMildSymptoms.map((sym, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{sym}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 border-t border-amber-200 text-xs text-amber-950 font-bold">
                          <span className="block font-black text-amber-900 mb-1">
                            💡 How to Prevent & Relieve These Symptoms:
                          </span>
                          <p className="font-medium text-slate-800">
                            {currentMedProfile.howToPreventOrRelieve}
                          </p>
                        </div>
                      </div>

                      {/* Box 2: Positive Symptoms (How You Know It's Working) */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                          <span className="text-xl">🟢</span>
                          <span>Positive Symptoms (Signs the Medicine is Working)</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {currentMedProfile.positiveSymptoms.map((sym, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{sym}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="pt-2 border-t border-emerald-200 text-xs">
                          <span className="block font-black text-emerald-900 mb-1">
                            🥗 Food & Drink Interaction Alert:
                          </span>
                          <p className="text-slate-800">
                            {currentMedProfile.foodInteractionSymptoms}
                          </p>
                        </div>
                      </div>

                      {/* Box 3: Red Flag Warning Symptoms (Call Doctor) */}
                      <div className="md:col-span-2 bg-rose-50/80 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 space-y-2">
                        <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>🚨 Alert Warning Symptoms (Seek Medical Attention Immediately)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {currentMedProfile.alertWarningSymptoms.map((warn, i) => (
                            <div
                              key={i}
                              className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs font-bold text-rose-950 flex items-start gap-2 shadow-xs"
                            >
                              <span className="text-rose-600">⚠️</span>
                              <span>{warn}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QUICK REPORT SYMPTOM FOR THIS SPECIFIC MEDICINE */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs sm:text-sm">
                      <Thermometer className="w-4 h-4 text-blue-600" />
                      <span>Are you feeling any side effect after taking {currentMed.name}?</span>
                    </div>

                    <form onSubmit={handleQuickMedSymptom} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={quickSymptomInput}
                        onChange={(e) => setQuickSymptomInput(e.target.value)}
                        placeholder="e.g. Mild stomach cramps, headache, dizziness, metallic taste..."
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition"
                      >
                        Check Symptom Advice
                      </button>
                    </form>

                    {quickFeedback && (
                      <div className="p-3 bg-blue-100 border border-blue-300 rounded-xl text-xs text-blue-950 font-bold animate-fade-in flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                          <span>{quickFeedback}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: FOOD SYMPTOMS & SPOILAGE REACTIONS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'food_symptoms' && (
        <div className="space-y-6">
          {/* Expiring Food Alert Warning */}
          {expiringKitchenFoods.length > 0 && (
            <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-orange-950 font-black text-sm">
                  <span className="text-xl">⚠️</span>
                  <span>Kitchen Spoilage Risk Alert: Expiring Ingredients Could Trigger Symptoms!</span>
                </div>
                <span className="px-2.5 py-0.5 bg-orange-200 text-orange-900 rounded-full text-xs font-black">
                  {expiringKitchenFoods.length} At Risk
                </span>
              </div>
              <p className="text-xs text-orange-900">
                You have {expiringKitchenFoods.map((f) => f.name).join(', ')} expiring soon. Consuming decaying,
                slimy, or sour expired food carries bacteria like <em>Salmonella</em> or <em>Bacillus</em>, which
                triggers sudden stomach cramps, watery diarrhea, and vomiting within 1–8 hours. Cook them today or freeze them!
              </p>
            </div>
          )}

          {/* INTERACTIVE FOOD SYMPTOM CHECKER */}
          <div className="bg-white rounded-2xl border-2 border-emerald-400 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl text-xl">🩺</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Did Food Make You Sick? Quick Symptom Checker
                  </h3>
                  <p className="text-xs text-slate-600">
                    Tap the symptoms you feel right now to see the likely food cause and immediate remedies
                  </p>
                </div>
              </div>

              {selectedUserSymptoms.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedUserSymptoms([]);
                    setDetectedFoodCondition(null);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold underline self-start sm:self-auto"
                >
                  Clear symptoms
                </button>
              )}
            </div>

            {/* Common Symptom Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                'Stomach cramps',
                'Watery diarrhea',
                'Nausea & vomiting',
                'Heartburn / Chest burning',
                'Bloating & gas',
                'Fever & chills',
                'Intense thirst & drowsiness',
                'Itchy lips or hives',
                'Sour taste in throat',
              ].map((sym) => {
                const isSelected = selectedUserSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleToggleSymptom(sym)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{sym}</span>
                  </button>
                );
              })}
            </div>

            {/* Evaluated Condition Result */}
            {detectedFoodCondition && (
              <div className="mt-4 p-4 sm:p-5 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{detectedFoodCondition.icon}</span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Likely Food Reaction
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                        {detectedFoodCondition.condition}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSpeakFoodCondition(detectedFoodCondition)}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center gap-1 transition shrink-0"
                  >
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                    <span>🔊 Listen</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                    <strong className="block font-black text-emerald-950">
                      ⚡ Immediate Action Steps:
                    </strong>
                    <p className="text-slate-700 whitespace-pre-line">
                      {detectedFoodCondition.immediateAction}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                    <strong className="block font-black text-emerald-950">
                      🔎 Likely Culprit Foods:
                    </strong>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {detectedFoodCondition.culpritFoods.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Emergency Red Flags */}
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                  <strong className="font-bold flex items-center gap-1.5 text-rose-950">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    When to Go to Doctor / Urgent Care:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {detectedFoodCondition.redFlagDoctorSigns.map((sign, i) => (
                      <li key={i}>{sign}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* FILTER & BROWSE FOOD SYMPTOM PROFILES */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                All Food Reactions & Symptoms Directory
              </h3>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'All Reactions' },
                  { id: 'spoilage_poisoning', label: '🤢 Food Poisoning' },
                  { id: 'intolerance', label: '🥛 Lactose' },
                  { id: 'acid_gerd', label: '🔥 Acid Reflux' },
                  { id: 'sugar_spike', label: '🩸 Sugar Spikes' },
                  { id: 'allergy', label: '⚠️ Allergies' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFoodCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      selectedFoodCategory === cat.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Food Symptom Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFoodSymptoms.map((cond) => (
                <div
                  key={cond.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs flex flex-col justify-between transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{cond.icon}</span>
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            {cond.condition}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Timeframe: {cond.timeframe}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSpeakFoodCondition(cond)}
                        className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                        title="Read out loud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Common Symptoms List */}
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                        Recognized Bodily Symptoms:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {cond.commonSymptoms.map((sym, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{sym}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Culprit Foods */}
                    <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">
                        Culprit Foods:
                      </span>
                      <p className="text-slate-600">{cond.culpritFoods.join(' • ')}</p>
                    </div>

                    {/* First Aid Recovery */}
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <span className="font-black text-emerald-950 block">
                        First Aid Recovery Advice:
                      </span>
                      <p className="text-slate-800 whitespace-pre-line">
                        {cond.immediateAction}
                      </p>
                    </div>
                  </div>

                  {/* Red flags */}
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-rose-800 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Doctor warning: {cond.redFlagDoctorSigns[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
