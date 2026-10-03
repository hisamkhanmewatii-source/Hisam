import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  Utensils,
  Pill,
  Flame,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Volume2,
  Sparkles,
  Info,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Dumbbell,
  Footprints,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Bar,
  Area,
  ComposedChart,
} from 'recharts';
import { SupportedLanguage, getTranslation } from '../../utils/translations';
import { speakText } from '../../utils/voiceService';
import confetti from 'canvas-confetti';

interface DiabetesCareProps {
  currentLanguage: SupportedLanguage;
  easyMode: boolean;
}

// Data structures for blood sugar and exercise logs
export interface SugarReading {
  id: string;
  day: string;
  date: string;
  time: string;
  fasting: number; // mg/dL
  postMeal: number; // mg/dL
  mealType: string;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  day: string;
  date: string;
  activity: string;
  durationMinutes: number;
  caloriesBurned: number;
  estimatedSugarDrop: number; // mg/dL
}

const DEFAULT_SUGAR_DATA: SugarReading[] = [
  { id: '1', day: 'Mon', date: '2026-09-23', time: '08:00 AM', fasting: 118, postMeal: 154, mealType: 'Oats & Almonds' },
  { id: '2', day: 'Tue', date: '2026-09-24', time: '08:15 AM', fasting: 122, postMeal: 168, mealType: 'Methi Roti & Dal' },
  { id: '3', day: 'Wed', date: '2026-09-25', time: '07:50 AM', fasting: 110, postMeal: 142, mealType: 'Moong Sprouts Salad' },
  { id: '4', day: 'Thu', date: '2026-09-26', time: '08:10 AM', fasting: 128, postMeal: 175, mealType: 'Brown Rice Khichdi' },
  { id: '5', day: 'Fri', date: '2026-09-27', time: '08:00 AM', fasting: 114, postMeal: 148, mealType: 'Tofu & Vegetable Stir-Fry' },
  { id: '6', day: 'Sat', date: '2026-09-28', time: '08:30 AM', fasting: 116, postMeal: 152, mealType: 'Besan Chilla with Mint' },
  { id: '7', day: 'Sun', date: '2026-09-29', time: '08:15 AM', fasting: 108, postMeal: 138, mealType: 'Palak & Paneer with Salad' },
];

const DEFAULT_EXERCISE_DATA: ExerciseLog[] = [
  { id: '1', day: 'Mon', date: '2026-09-23', activity: 'Brisk Walk Post-Dinner', durationMinutes: 25, caloriesBurned: 120, estimatedSugarDrop: 24 },
  { id: '2', day: 'Tue', date: '2026-09-24', activity: 'Yoga & Pranayama', durationMinutes: 30, caloriesBurned: 110, estimatedSugarDrop: 18 },
  { id: '3', day: 'Wed', date: '2026-09-25', activity: 'Post-Meal Walking', durationMinutes: 35, caloriesBurned: 165, estimatedSugarDrop: 32 },
  { id: '4', day: 'Thu', date: '2026-09-26', activity: 'Chair Squats & Resistance', durationMinutes: 20, caloriesBurned: 130, estimatedSugarDrop: 22 },
  { id: '5', day: 'Fri', date: '2026-09-27', activity: 'Morning Park Walk', durationMinutes: 40, caloriesBurned: 190, estimatedSugarDrop: 36 },
  { id: '6', day: 'Sat', date: '2026-09-28', activity: 'Stationary Cycling', durationMinutes: 25, caloriesBurned: 145, estimatedSugarDrop: 28 },
  { id: '7', day: 'Sun', date: '2026-09-29', activity: 'Evening Post-Meal Walk', durationMinutes: 30, caloriesBurned: 150, estimatedSugarDrop: 30 },
];

export const DiabetesCare: React.FC<DiabetesCareProps> = ({ currentLanguage, easyMode }) => {
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'meals' | 'meds' | 'exercise'>('trends');
  
  // Stored readings & exercise data
  const [readings, setReadings] = useState<SugarReading[]>(() => {
    try {
      const saved = localStorage.getItem('freshguard_sugar_readings');
      return saved ? JSON.parse(saved) : DEFAULT_SUGAR_DATA;
    } catch {
      return DEFAULT_SUGAR_DATA;
    }
  });

  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() => {
    try {
      const saved = localStorage.getItem('freshguard_exercise_logs');
      return saved ? JSON.parse(saved) : DEFAULT_EXERCISE_DATA;
    } catch {
      return DEFAULT_EXERCISE_DATA;
    }
  });

  // Modal for new reading
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [fastingInput, setFastingInput] = useState('');
  const [postMealInput, setPostMealInput] = useState('');
  const [mealTypeInput, setMealTypeInput] = useState('');

  // Modal for new exercise
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [exerciseActivity, setExerciseActivity] = useState('Brisk Walking');
  const [exerciseMinutes, setExerciseMinutes] = useState('25');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('freshguard_sugar_readings', JSON.stringify(readings));
    } catch {}
  }, [readings]);

  useEffect(() => {
    try {
      localStorage.setItem('freshguard_exercise_logs', JSON.stringify(exerciseLogs));
    } catch {}
  }, [exerciseLogs]);

  // Calorie & Exercise totals
  const totalCaloriesBurnedWeek = exerciseLogs.reduce((acc, curr) => acc + curr.caloriesBurned, 0);
  const totalMinutesWeek = exerciseLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const latestReading = readings[readings.length - 1];

  // Helper status for sugar reading
  const getSugarStatus = (fasting: number, postMeal: number) => {
    if (fasting < 70 || postMeal < 70) {
      return {
        label: currentLanguage === 'hi' ? 'कम शुगर (लो अलर्ट)' : 'Hypoglycemia (Low)',
        color: 'text-amber-700 bg-amber-100 border-amber-300',
        badge: 'bg-amber-600',
      };
    }
    if (fasting <= 126 && postMeal <= 160) {
      return {
        label: currentLanguage === 'hi' ? 'नियंत्रित एवं सुरक्षित' : 'In Optimal Target',
        color: 'text-emerald-700 bg-emerald-100 border-emerald-300',
        badge: 'bg-emerald-600',
      };
    }
    if (fasting <= 140 && postMeal <= 180) {
      return {
        label: currentLanguage === 'hi' ? 'हल्का सा बढ़ा हुआ' : 'Slightly Elevated',
        color: 'text-blue-700 bg-blue-100 border-blue-300',
        badge: 'bg-blue-600',
      };
    }
    return {
      label: currentLanguage === 'hi' ? 'उच्च स्तर (सावधानी)' : 'High Blood Sugar Alert',
      color: 'text-rose-700 bg-rose-100 border-rose-300',
      badge: 'bg-rose-600',
    };
  };

  const handleAddReading = (e: React.FormEvent) => {
    e.preventDefault();
    const fasting = parseFloat(fastingInput);
    const postMeal = parseFloat(postMealInput);
    if (isNaN(fasting) || isNaN(postMeal)) return;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const newEntry: SugarReading = {
      id: Date.now().toString(),
      day: days[now.getDay()],
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fasting,
      postMeal,
      mealType: mealTypeInput || (currentLanguage === 'hi' ? 'संतुलित भोजन' : 'Balanced Meal'),
    };

    setReadings([...readings, newEntry]);
    setIsReadingModalOpen(false);
    setFastingInput('');
    setPostMealInput('');
    setMealTypeInput('');

    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    speakText(
      currentLanguage === 'hi'
        ? `शुगर रीडिंग दर्ज हो गई है। खाली पेट ${fasting}, खाने के बाद ${postMeal}।`
        : `Blood sugar logged successfully. Fasting ${fasting}, Post-meal ${postMeal}.`,
      currentLanguage
    );
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(exerciseMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;

    // Approximate calories: ~5.5 kcal per min of brisk walking
    const cals = Math.round(mins * 5.2);
    const sugarDrop = Math.round(mins * 0.9);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const newExercise: ExerciseLog = {
      id: Date.now().toString(),
      day: days[now.getDay()],
      date: now.toISOString().split('T')[0],
      activity: exerciseActivity,
      durationMinutes: mins,
      caloriesBurned: cals,
      estimatedSugarDrop: sugarDrop,
    };

    setExerciseLogs([...exerciseLogs, newExercise]);
    setIsExerciseModalOpen(false);
    setExerciseMinutes('25');

    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    speakText(
      currentLanguage === 'hi'
        ? `शाबाश! आपने ${mins} मिनट व्यायाम किया और लगभग ${cals} कैलोरी जलाई। इससे शुगर स्पाइक रुकेगी।`
        : `Well done! Logged ${mins} minutes of ${exerciseActivity}. Burned ${cals} calories to prevent sugar spikes.`,
      currentLanguage
    );
  };

  // Indian & Diabetic routine guidelines
  const diabeticRoutineSchedule = [
    {
      slot: currentLanguage === 'hi' ? 'सुबह खाली पेट (6:30 - 7:00 AM)' : 'Empty Stomach (6:30 - 7:00 AM)',
      icon: Coffee,
      title: currentLanguage === 'hi' ? 'मेथी दाना पानी या दालचीनी काढ़ा' : 'Methi Water / Cinnamon Detox',
      desc: currentLanguage === 'hi' 
        ? 'रात भर भीगा 1 चम्मच मेथी दाना का गुनगुना पानी पिएं। यह इंसुलिन संवेदनशीलता (Insulin Sensitivity) को 25% तक बढ़ाता है।'
        : 'Drink 1 glass of soaked fenugreek (methi) water or warm cinnamon tea. Naturally enhances insulin sensitivity before meals.',
      gi: 'Low GI (< 15)',
      rule: currentLanguage === 'hi' ? 'दवा नियम: थायरॉइड या खाली पेट की दवा हो तो 30 मिनट का अंतर रखें' : 'Keep 30 min gap with fasting meds',
    },
    {
      slot: currentLanguage === 'hi' ? 'नाश्ता (8:00 - 8:30 AM)' : 'Nutritious Breakfast (8:00 - 8:30 AM)',
      icon: Sun,
      title: currentLanguage === 'hi' ? 'बेसन चिल्ला / ओट्स दलिया / मूंग स्प्राउट्स' : 'Besan Chilla / Steel-Cut Oats / Sprout Salad',
      desc: currentLanguage === 'hi'
        ? 'प्रोटीन और फाइबर से भरपूर नाश्ता करें। सफेद ब्रेड, कॉर्नफ्लेक्स या मीठी चाय से बचें। 2 अखरोट और 4 भीगे बादाम साथ लें।'
        : 'Rich in lean protein & soluble beta-glucan fiber. Avoid white bread and sugary beverages to prevent sudden morning glucose spikes.',
      gi: 'Low GI (< 35)',
      rule: currentLanguage === 'hi' ? 'दवा नियम: मेटफ़ॉर्मिन (Metformin) नाश्ते के बीच में या तुरंत बाद पानी से लें' : 'Take Metformin during or right after breakfast',
    },
    {
      slot: currentLanguage === 'hi' ? 'दोपहर का भोजन (1:00 - 1:30 PM)' : 'Balanced Lunch (1:00 - 1:30 PM)',
      icon: Utensils,
      title: currentLanguage === 'hi' ? 'जौ-चना-गेहूं रोटी, हरी सब्जी, गाढ़ी दाल व खीरा' : 'Multi-Grain / Barley Roti, Greens, Dal & Salad',
      desc: currentLanguage === 'hi'
        ? '50% थाली सलाद (खीरा, ककड़ी, टमाटर), 25% प्रोटीन (दाल/पनीर/टोफू), और 25% साबुत अनाज। करेला, मेथी या पालक सब्जी सबसे उत्तम है।'
        : 'The 50-25-25 Plate Rule: 50% non-starchy raw salad, 25% lean protein/dal, 25% complex whole grains.',
      gi: 'Low-Medium GI (40-45)',
      rule: currentLanguage === 'hi' ? 'दवा नियम: भोजन से 10 मिनट पहले पानी पिएं, भोजन के तुरंत बाद 15 मिनट टहलें' : 'Walk for 15 mins after meal to blunt sugar rise',
    },
    {
      slot: currentLanguage === 'hi' ? 'शाम का नाश्ता (4:30 - 5:00 PM)' : 'Evening Snack (4:30 - 5:00 PM)',
      icon: Sunset,
      title: currentLanguage === 'hi' ? 'भुना मखाना / भुने चने / ग्रीन टी' : 'Roasted Makhana / Roasted Chana / Green Tea',
      desc: currentLanguage === 'hi'
        ? 'बिस्कुट या तले समोसे की जगह 1 मुट्ठी भुने चने और मखाना लें। यह शाम की शुगर क्रेविंग को शांत रखता है।'
        : 'Swap packaged biscuits for 1 handful of dry roasted makhana (foxnuts) and roasted chana. Zero refined sugar.',
      gi: 'Low GI (< 30)',
      rule: currentLanguage === 'hi' ? 'दवा नियम: कोई मीठा फल शाम के बाद न लें' : 'Avoid high-sugar fruits in late evening',
    },
    {
      slot: currentLanguage === 'hi' ? 'रात का भोजन (7:30 - 8:15 PM)' : 'Early Dinner (7:30 - 8:15 PM)',
      icon: Moon,
      title: currentLanguage === 'hi' ? 'हल्का सुपाच्य भोजन (मूंग दाल खिचड़ी या सूप + सब्जी)' : 'Light Dinner (Lentil Soup / Steamed Veggies & Paneer)',
      desc: currentLanguage === 'hi'
        ? 'सोने से कम से कम 2.5 घंटे पहले हल्का भोजन करें। भारी चावल या आलू से बचें ताकि रात में ब्लड शुगर न बढ़े।'
        : 'Finish dinner 2.5 hours before bedtime. Avoid heavy refined carbs at night to prevent morning dawn phenomenon.',
      gi: 'Low GI (< 35)',
      rule: currentLanguage === 'hi' ? 'दवा नियम: नाइट इंसुलिन (Lantus/Glargine) या डॉक्टर द्वारा निर्धारित दवा निश्चित समय पर लें' : 'Take bedtime basal insulin at exact consistent time',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HERO BANNER - Calm Blue & Emerald Medical Theme */}
      <div className="bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 rounded-full border border-teal-300/30 text-xs font-bold text-teal-200">
              <Activity className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
              <span>
                {currentLanguage === 'hi'
                  ? '🛡️ मधुमेह व शुगर नियंत्रण क्लिनिकल केंद्र'
                  : '🛡️ Clinical Diabetes & Sugar Care Hub'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentLanguage === 'hi'
                ? 'मधुमेह एवं ब्लड शुगर नियंत्रण गाइड'
                : 'Diabetes & Blood Sugar Control Care'}
            </h1>
            <p className="text-sm sm:text-base text-teal-100 font-medium leading-relaxed">
              {currentLanguage === 'hi'
                ? 'दैनिक भोजन दिनचर्या, इंसुलिन व दवा समय नियम, और शुगर स्पाइक रोकने के लिए कैलोरी बर्न व्यायाम ट्रैकर।'
                : 'Diabetic meal planner, insulin & medication timing rules, plus calorie burning exercises to keep glucose in target safe zones.'}
            </p>
          </div>

          {/* Quick Metrics & Voice Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                const speech =
                  currentLanguage === 'hi'
                    ? 'मधुमेह नियंत्रण में आपका स्वागत है। नवीनतम खाली पेट शुगर 108 है जो सुरक्षित है। इस सप्ताह आपने 1,010 कैलोरी जलाई हैं।'
                    : `Welcome to Diabetes Care. Latest fasting sugar is ${latestReading?.fasting || 108} mg/dL. You burned ${totalCaloriesBurnedWeek} calories this week.`;
                speakText(speech, currentLanguage);
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-2xl border border-white/20 text-xs font-bold transition flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Volume2 className="w-4 h-4 text-teal-300" />
              <span>{currentLanguage === 'hi' ? 'आवाज़ में सुनें' : 'Listen Status'}</span>
            </button>

            <button
              onClick={() => setIsReadingModalOpen(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-teal-950 rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{currentLanguage === 'hi' ? 'शुगर रीडिंग जोड़ें' : 'Log Blood Sugar'}</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
              {currentLanguage === 'hi' ? 'नवीनतम खाली पेट (Fasting)' : 'Latest Fasting'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{latestReading?.fasting || 108}</span>
              <span className="text-xs text-teal-300 font-bold">mg/dL</span>
            </div>
            <span className="text-[10px] text-emerald-300 font-semibold block mt-0.5">
              {currentLanguage === 'hi' ? '✓ सुरक्षित सीमा (70-130)' : '✓ Target safe (70-130)'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
              {currentLanguage === 'hi' ? 'नवीनतम भोजन बाद (PP)' : 'Latest Post-Meal'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-white">{latestReading?.postMeal || 138}</span>
              <span className="text-xs text-teal-300 font-bold">mg/dL</span>
            </div>
            <span className="text-[10px] text-teal-300 font-semibold block mt-0.5">
              {currentLanguage === 'hi' ? '✓ सुरक्षित सीमा (< 180)' : '✓ Safe (< 180 mg/dL)'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
              {currentLanguage === 'hi' ? 'सप्ताहिक कैलोरी बर्न' : 'Weekly Calorie Burn'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-amber-300">{totalCaloriesBurnedWeek}</span>
              <span className="text-xs text-amber-200 font-bold">kcal</span>
            </div>
            <span className="text-[10px] text-amber-300 font-semibold block mt-0.5">
              {currentLanguage === 'hi' ? '🔥 शुगर स्पाइक रोकथाम' : '🔥 Prevents insulin resistance'}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
            <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
              {currentLanguage === 'hi' ? 'सक्रिय व्यायाम समय' : 'Active Exercise'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-cyan-300">{totalMinutesWeek}</span>
              <span className="text-xs text-cyan-200 font-bold">mins</span>
            </div>
            <span className="text-[10px] text-cyan-300 font-semibold block mt-0.5">
              {currentLanguage === 'hi' ? '✓ 150+ मिनट/सप्ताह लक्ष्य' : '✓ 150+ min/wk goal'}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('trends')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
            activeSubTab === 'trends'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{currentLanguage === 'hi' ? '📈 चार्ट एवं साप्ताहिक ट्रेंड' : '📈 Blood Sugar & Calorie Charts'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('meals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
            activeSubTab === 'meals'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>{currentLanguage === 'hi' ? '🍽️ मधुमेह भोजन दिनचर्या (Meal Plan)' : '🍽️ Diabetic Daily Meal Routine'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exercise')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
            activeSubTab === 'exercise'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-500" />
          <span>{currentLanguage === 'hi' ? '🔥 व्यायाम व कैलोरी बर्न काउंटर' : '🔥 Exercise & Calorie Burn Counter'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('meds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
            activeSubTab === 'meds'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>{currentLanguage === 'hi' ? '💊 इंसुलिन व दवा समय नियम' : '💊 Insulin & Meds Safe Timing'}</span>
        </button>
      </div>

      {/* TAB 1: RECHARTS DATA VISUALIZATION */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6">
          {/* Chart 1: Blood Sugar Trend with Safe Zone Reference Band */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {currentLanguage === 'hi'
                      ? 'साप्ताहिक ब्लड शुगर रीडिंग ग्राफ (mg/dL)'
                      : 'Weekly Blood Sugar Trends (Fasting vs Post-Meal)'}
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                    Target Safe Band
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600">
                  {currentLanguage === 'hi'
                    ? 'हरा शेडेड क्षेत्र (70 - 130 mg/dL खाली पेट, < 180 mg/dL भोजन बाद) सुरक्षित लक्ष्य को दर्शाता है।'
                    : 'Green band indicates optimal safe glycemic zone. Dots plot actual readings.'}
                </p>
              </div>

              <button
                onClick={() => setIsReadingModalOpen(true)}
                className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'नई रीडिंग जोड़ें' : 'Log Reading'}</span>
              </button>
            </div>

            {/* Recharts Line/Area Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={readings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fastingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="postMealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis domain={[50, 220]} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} mg/dL`,
                      name === 'fasting'
                        ? currentLanguage === 'hi' ? 'खाली पेट (Fasting)' : 'Fasting Sugar'
                        : currentLanguage === 'hi' ? 'भोजन बाद (Post-Meal)' : 'Post-Meal Sugar',
                    ]}
                    labelFormatter={(label) => `Day: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(value) =>
                      value === 'fasting'
                        ? currentLanguage === 'hi' ? 'खाली पेट (Fasting - Target 70-130)' : 'Fasting (Target 70-130)'
                        : currentLanguage === 'hi' ? 'भोजन बाद (Post-Meal - Target < 180)' : 'Post-Meal (Target < 180)'
                    }
                  />

                  {/* Reference Safe Bands */}
                  <ReferenceArea y1={70} y2={130} fill="#10b981" fillOpacity={0.08} />
                  <ReferenceLine y={130} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Fasting Upper (130)', position: 'right', fill: '#059669', fontSize: 10 }} />
                  <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Post-Meal Upper (180)', position: 'right', fill: '#d97706', fontSize: 10 }} />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Hypo Alert (70)', position: 'right', fill: '#dc2626', fontSize: 10 }} />

                  <Area type="monotone" dataKey="fasting" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#fastingGradient)" dot={{ r: 4, fill: '#0d9488' }} />
                  <Line type="monotone" dataKey="postMeal" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Readings Table */}
            <div className="overflow-x-auto pt-3 border-t border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-600 font-bold uppercase border-b border-slate-100">
                    <th className="py-2 px-3">{currentLanguage === 'hi' ? 'दिन / समय' : 'Day / Time'}</th>
                    <th className="py-2 px-3">{currentLanguage === 'hi' ? 'खाली पेट' : 'Fasting'}</th>
                    <th className="py-2 px-3">{currentLanguage === 'hi' ? 'भोजन बाद' : 'Post-Meal'}</th>
                    <th className="py-2 px-3">{currentLanguage === 'hi' ? 'संबंधित भोजन' : 'Associated Meal'}</th>
                    <th className="py-2 px-3">{currentLanguage === 'hi' ? 'स्थिति' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {readings.slice(-5).reverse().map((r) => {
                    const status = getSugarStatus(r.fasting, r.postMeal);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {r.day} <span className="text-[11px] text-slate-500 font-normal">({r.time})</span>
                        </td>
                        <td className="py-2.5 px-3 font-black text-teal-800">{r.fasting} mg/dL</td>
                        <td className="py-2.5 px-3 font-black text-blue-700">{r.postMeal} mg/dL</td>
                        <td className="py-2.5 px-3 text-slate-600">{r.mealType}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.badge}`} />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart 2: Exercise & Calorie Burn Chart */}
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {currentLanguage === 'hi'
                    ? '🔥 दैनिक व्यायाम व कैलोरी बर्न प्रोग्रेस'
                    : '🔥 Daily Exercise Duration & Calories Burned'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {currentLanguage === 'hi'
                    ? 'भोजन के बाद 20-30 मिनट टहलने से मांसपेशियां बिना इंसुलिन के ग्लूकोज सोखती हैं और शुगर 30-40 mg/dL तक कम होती है।'
                    : 'Post-meal activity triggers muscular GLUT4 translocation, dropping blood sugar by 25-45 mg/dL without medication.'}
                </p>
              </div>

              <button
                onClick={() => setIsExerciseModalOpen(true)}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-amber-700" />
                <span>{currentLanguage === 'hi' ? 'व्यायाम दर्ज करें' : 'Log Exercise'}</span>
              </button>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exerciseLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'caloriesBurned' ? `${value} kcal burned` : `${value} mins`,
                      name === 'caloriesBurned' ? 'Calories' : 'Duration',
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    formatter={(val) =>
                      val === 'caloriesBurned'
                        ? currentLanguage === 'hi' ? 'कैलोरी बर्न (kcal)' : 'Calories Burned (kcal)'
                        : currentLanguage === 'hi' ? 'अवधि (मिनट)' : 'Duration (mins)'
                    }
                  />
                  <ReferenceLine y={150} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Daily Target (150 kcal)', fill: '#d97706', fontSize: 10 }} />
                  <Bar dataKey="caloriesBurned" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="durationMinutes" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIABETIC MEAL PLANNER & ROUTINE */}
      {activeSubTab === 'meals' && (
        <div className="space-y-6">
          {/* Essential Hindi & English Sugar Prevention Guidelines Banner */}
          <div className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm sm:text-base font-black text-emerald-950">
                {currentLanguage === 'hi'
                  ? '🌿 भारतीय आहार में शुगर स्पाइक रोकने के 5 स्वर्णिम नियम'
                  : '🌿 5 Golden Dietary Rules to Prevent Sugar Spikes'}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-emerald-900">
              <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 space-y-1">
                <span className="font-black text-emerald-950 block">
                  {currentLanguage === 'hi' ? '1. आटे में जौ और चना मिलाएं' : '1. Barley & Chickpea Flour Blend'}
                </span>
                <p className="text-slate-600 text-xs">
                  {currentLanguage === 'hi'
                    ? 'केवल गेहूं का आटा तुरंत शुगर बढ़ाता है। 50% गेहूं + 30% चना + 20% जौ आटा मिलाकर रोटी बनाएं।'
                    : 'Pure wheat flour has high GI. Blending 30% gram flour (besan) and 20% barley cuts glycemic index in half.'}
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 space-y-1">
                <span className="font-black text-emerald-950 block">
                  {currentLanguage === 'hi' ? '2. भोजन का क्रम: फाइबर ➔ प्रोटीन ➔ कार्ब्स' : '2. Food Order Sequencing'}
                </span>
                <p className="text-slate-600 text-xs">
                  {currentLanguage === 'hi'
                    ? 'हमेशा पहले खीरा/सलाद खाएं, फिर दाल/सब्जी, और सबसे अंत में रोटी या चावल खाएं। इससे शुगर 35% कम बढ़ती है।'
                    : 'Eat raw salad first, then protein/dal, and finish with carbs last. Soluble fiber coats the intestinal lining.'}
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 space-y-1">
                <span className="font-black text-emerald-950 block">
                  {currentLanguage === 'hi' ? '3. मेथी दाना व करेला रस' : '3. Fenugreek & Bitter Gourd (Karela)'}
                </span>
                <p className="text-slate-600 text-xs">
                  {currentLanguage === 'hi'
                    ? 'हफ्ते में 2-3 बार करेले की सब्जी या मेथी पानी पिएं। इनमें मौजूद "कैराटिन" और "पॉलीपेप्टाइड-पी" प्राकृतिक इंसुलिन जैसा कार्य करते हैं।'
                    : 'Contains charantin and polypeptide-p which mimic insulin activity in peripheral tissues.'}
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 space-y-1">
                <span className="font-black text-emerald-950 block">
                  {currentLanguage === 'hi' ? '4. फलों का सही चयन (Low GI Fruits)' : '4. Pick Low Glycemic Fruits'}
                </span>
                <p className="text-slate-600 text-xs">
                  {currentLanguage === 'hi'
                    ? 'अमरूद, सेब (छिलके सहित), जामुन और पपीता खाएं। आम, चीकू, अंगूर और केले की मात्रा बेहद सीमित रखें।'
                    : 'Opt for guavas, apples with peel, Indian jamun, and berries. Avoid high-sugar mangoes, sapodilla (chikoo), and grapes.'}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Schedule Cards */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {currentLanguage === 'hi'
                ? '📅 शुगर मरीज की सम्पूर्ण दैनिक आहार दिनचर्या (Daily Schedule)'
                : '📅 Daily Routine Meal Plan for Diabetic Patients'}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {diabeticRoutineSchedule.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-teal-400 transition space-y-2 group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-teal-50 group-hover:bg-teal-600 group-hover:text-white text-teal-700 rounded-2xl transition">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-black uppercase text-teal-800 tracking-wider block">
                            {item.slot}
                          </span>
                          <h4 className="text-base font-black text-slate-900">{item.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-xl">
                          {item.gi}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-12">
                      {item.desc}
                    </p>

                    <div className="pl-12 pt-1 flex items-center gap-1.5 text-xs font-bold text-teal-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.rule}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXERCISE & CALORIE BURN COUNTER */}
      {activeSubTab === 'exercise' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {currentLanguage === 'hi'
                    ? '🔥 कैलोरी बर्न एवं व्यायाम कैलकुलेटर'
                    : '🔥 Exercise Calorie Burn & Sugar Spike Buster'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  {currentLanguage === 'hi'
                    ? 'हर 100 कैलोरी जलाने से इंसुलिन संवेदनशीलता बढ़ती है और खून में शुगर तेजी से कोशिकाओं में पहुंचती है।'
                    : 'Physical muscle movement acts as a non-insulin mediated glucose sink, actively preventing postprandial surges.'}
                </p>
              </div>

              <button
                onClick={() => setIsExerciseModalOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{currentLanguage === 'hi' ? 'नया व्यायाम दर्ज करें' : 'Log New Exercise'}</span>
              </button>
            </div>

            {/* Quick 1-Tap Exercise Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                {
                  name: currentLanguage === 'hi' ? 'भोजन बाद तेज टहलना' : 'Post-Meal Brisk Walk',
                  time: 20,
                  cal: 110,
                  drop: '25-35 mg/dL',
                  icon: Footprints,
                  color: 'border-emerald-200 bg-emerald-50/50 text-emerald-950',
                },
                {
                  name: currentLanguage === 'hi' ? 'मंडूकासन व प्राणायाम' : 'Yoga & Mandukasana',
                  time: 25,
                  cal: 95,
                  drop: '15-25 mg/dL',
                  icon: Activity,
                  color: 'border-teal-200 bg-teal-50/50 text-teal-950',
                },
                {
                  name: currentLanguage === 'hi' ? 'कुर्सी पर उठक-बैठक (Squats)' : 'Chair Squats & Resistance',
                  time: 15,
                  cal: 105,
                  drop: '20-30 mg/dL',
                  icon: Dumbbell,
                  color: 'border-blue-200 bg-blue-50/50 text-blue-950',
                },
                {
                  name: currentLanguage === 'hi' ? 'स्थिर साइकिल (Cycling)' : 'Stationary Cycling',
                  time: 20,
                  cal: 135,
                  drop: '30-40 mg/dL',
                  icon: Zap,
                  color: 'border-amber-200 bg-amber-50/50 text-amber-950',
                },
              ].map((ex, idx) => {
                const ExIcon = ex.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const now = new Date();
                      const newLog: ExerciseLog = {
                        id: Date.now().toString(),
                        day: days[now.getDay()],
                        date: now.toISOString().split('T')[0],
                        activity: ex.name,
                        durationMinutes: ex.time,
                        caloriesBurned: ex.cal,
                        estimatedSugarDrop: parseInt(ex.drop.split('-')[0], 10),
                      };
                      setExerciseLogs([...exerciseLogs, newLog]);
                      confetti({ particleCount: 30, spread: 50 });
                      speakText(
                        currentLanguage === 'hi'
                          ? `${ex.name} दर्ज हो गया। ${ex.cal} कैलोरी बर्न हुई।`
                          : `${ex.name} logged. ${ex.cal} calories burned.`,
                        currentLanguage
                      );
                    }}
                    className={`p-4 rounded-2xl border text-left transition hover:shadow-md hover:scale-[1.01] active:scale-95 space-y-2 ${ex.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 bg-white rounded-xl shadow-xs">
                        <ExIcon className="w-4 h-4 text-slate-800" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-white/80 rounded-full">
                        + Log 1-Tap
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs sm:text-sm font-black">{ex.name}</span>
                      <span className="block text-[11px] text-slate-600 font-medium">
                        ⏱️ {ex.time} mins • 🔥 {ex.cal} kcal
                      </span>
                    </div>

                    <div className="pt-1 text-[11px] font-bold text-emerald-700">
                      ↓ Sugar Drop: ~{ex.drop}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INSULIN & DIABETES MEDICATION TIMING RULES */}
      {activeSubTab === 'meds' && (
        <div className="space-y-6">
          {/* Hypoglycemia Emergency Alert Banner */}
          <div className="bg-rose-50 border-2 border-rose-300 p-5 sm:p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2.5 text-rose-800">
              <ShieldAlert className="w-6 h-6 shrink-0 text-rose-600 animate-bounce" />
              <div>
                <h3 className="text-base font-black">
                  {currentLanguage === 'hi'
                    ? '🚨 लो शुगर (Hypoglycemia < 70 mg/dL) इमरजेंसी: 15-15 का नियम'
                    : '🚨 Hypoglycemia Alert (< 70 mg/dL): The 15-15 Rule'}
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  {currentLanguage === 'hi'
                    ? 'यदि चक्कर, अत्यधिक पसीना, हाथ कांपना या घबराहट महसूस हो:'
                    : 'If experiencing severe trembling, cold sweats, confusion, or dizziness:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-rose-950 pt-2">
              <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-xs">
                <span className="font-black text-rose-700 block text-sm">कदम 1: तुरंत 15g चीनी लें</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  आधा गिलास फलों का रस या 3 चम्मच ग्लूकोज/शहद तुरंत पिएं।
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-xs">
                <span className="font-black text-rose-700 block text-sm">कदम 2: 15 मिनट आराम करें</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  बैठ जाएं, आराम करें और 15 मिनट बाद दोबारा शुगर चेक करें।
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-xs">
                <span className="font-black text-rose-700 block text-sm">कदम 3: हल्का नाश्ता लें</span>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  शुगर 80 से ऊपर आने पर 1 बिस्कुट या रोटी लें ताकि दोबारा न गिरे।
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Medication Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-teal-800">
                <Pill className="w-5 h-5 text-teal-600" />
                <h4 className="text-base font-black text-slate-900">
                  {currentLanguage === 'hi' ? 'मेटफ़ॉर्मिन (Metformin) नियम' : 'Metformin Safe Protocol'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentLanguage === 'hi'
                  ? 'हमेशा भोजन के बीच में या भोजन के तुरंत बाद एक पूरे गिलास पानी के साथ लें। खाली पेट लेने से पेट दर्द या मतली हो सकती है।'
                  : 'Always take with or immediately following meals with plenty of water to minimize gastrointestinal discomfort.'}
              </p>
              <div className="p-2.5 bg-teal-50 rounded-xl text-[11px] font-bold text-teal-900">
                ✓ पेट की सुरक्षा • भोजन के साथ अनिवार्य
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-blue-800">
                <Pill className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-black text-slate-900">
                  {currentLanguage === 'hi' ? 'ग्लिमेपिराइड / सल्फोनील्यूरिया नियम' : 'Glimepiride / Sulfonylureas'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentLanguage === 'hi'
                  ? 'नाश्ते से ठीक पहले (10-15 मिनट) लें। यह दवा लेने के बाद कभी भी खाना न छोड़ें, अन्यथा लो-शुगर हो सकती है।'
                  : 'Take 10-15 minutes prior to the first substantial meal of the day. Never skip meals after taking this dose.'}
              </p>
              <div className="p-2.5 bg-blue-50 rounded-xl text-[11px] font-bold text-blue-900">
                ⚠️ खाना कभी न छोड़ें • समय की पाबंदी
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-800">
                <Activity className="w-5 h-5 text-purple-600" />
                <h4 className="text-base font-black text-slate-900">
                  {currentLanguage === 'hi' ? 'इंसुलिन इंजेक्शन व साइट रोटेशन' : 'Insulin Injection Site Rotation'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentLanguage === 'hi'
                  ? 'रोजाना एक ही जगह पर सुई न लगाएं। पेट (नाभि से 2 इंच दूर), जांघ और बांह के बीच जगह बदलते रहें ताकि गांठ (lipohypertrophy) न बने।'
                  : 'Rotate injection sites across abdomen, outer thighs, and upper arms to avoid fatty lump formation.'}
              </p>
              <div className="p-2.5 bg-purple-50 rounded-xl text-[11px] font-bold text-purple-900">
                🔄 साइट रोटेशन: नाभि से 2 इंच दूर
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-cyan-800">
                <Clock className="w-5 h-5 text-cyan-600" />
                <h4 className="text-base font-black text-slate-900">
                  {currentLanguage === 'hi' ? 'रात का बेसल इंसुलिन (Lantus / Glargine)' : 'Bedtime Basal Insulin'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentLanguage === 'hi'
                  ? 'रात को ठीक उसी समय (जैसे रात 10:00 बजे) लें। यह 24 घंटे लगातार धीरे-धीरे काम करता है और सुबह की शुगर नियंत्रित रखता है।'
                  : 'Administer at the exact same hour every night to establish a stable 24-hour basal plateau.'}
              </p>
              <div className="p-2.5 bg-cyan-50 rounded-xl text-[11px] font-bold text-cyan-900">
                ⏰ निश्चित समय • 24 घंटे सुरक्षा
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG NEW BLOOD SUGAR READING */}
      {isReadingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {currentLanguage === 'hi' ? 'नई ब्लड शुगर रीडिंग दर्ज करें' : 'Log Blood Sugar Reading'}
              </h3>
              <button
                onClick={() => setIsReadingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReading} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'hi' ? 'खाली पेट रीडिंग (Fasting mg/dL)' : 'Fasting Blood Sugar (mg/dL)'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 110"
                  value={fastingInput}
                  onChange={(e) => setFastingInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-slate-500">Target: 70 - 130 mg/dL</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'hi' ? 'भोजन के 2 घंटे बाद (Post-Meal mg/dL)' : 'Post-Meal Sugar (mg/dL)'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 145"
                  value={postMealInput}
                  onChange={(e) => setPostMealInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-[10px] text-slate-500">Target: &lt; 180 mg/dL</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'hi' ? 'संबंधित भोजन / नाश्ता' : 'Meal Consumed'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Besan Chilla with Curd"
                  value={mealTypeInput}
                  onChange={(e) => setMealTypeInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReadingModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs shadow-md shadow-teal-600/20 transition"
                >
                  {currentLanguage === 'hi' ? 'सेव करें' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG NEW EXERCISE */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {currentLanguage === 'hi' ? 'व्यायाम व कैलोरी दर्ज करें' : 'Log Exercise Session'}
              </h3>
              <button
                onClick={() => setIsExerciseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'hi' ? 'व्यायाम का प्रकार' : 'Exercise Activity'}
                </label>
                <select
                  value={exerciseActivity}
                  onChange={(e) => setExerciseActivity(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Brisk Walking">Brisk Walking (तेज टहलना)</option>
                  <option value="Post-Meal Walking">Post-Meal Walking (भोजन बाद टहलना)</option>
                  <option value="Yoga & Pranayama">Yoga & Pranayama (योग व प्राणायाम)</option>
                  <option value="Stationary Cycling">Stationary Cycling (साइकिल)</option>
                  <option value="Chair Squats & Resistance">Chair Squats & Resistance (उठक-बैठक)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLanguage === 'hi' ? 'अवधि (मिनट में)' : 'Duration (Minutes)'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  required
                  value={exerciseMinutes}
                  onChange={(e) => setExerciseMinutes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-amber-700 font-bold block mt-1">
                  Estimated burn: ~{Math.round(parseInt(exerciseMinutes || '0', 10) * 5.2)} kcal • Sugar drop: ~{Math.round(parseInt(exerciseMinutes || '0', 10) * 0.9)} mg/dL
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExerciseModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition"
                >
                  {currentLanguage === 'hi' ? 'सेव करें' : 'Save & Burn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
