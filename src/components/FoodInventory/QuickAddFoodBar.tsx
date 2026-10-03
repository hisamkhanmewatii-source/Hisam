import React, { useState, useRef, useEffect } from 'react';
import { FoodItem, FoodCategory, StorageLocation } from '../../types';
import { autoDetectFood, addDaysToDate, getTodayDateString } from '../../utils/foodDatabase';
import { speakText } from '../../utils/voiceService';
import { isSpeechRecognitionSupported, parseVoiceInput } from '../../utils/speechRecognitionService';
import { playMedicationChime, playFoodAlertBeep } from '../../utils/notificationService';
import {
  Sparkles,
  Plus,
  Calendar,
  Check,
  Layers,
  MapPin,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Volume2,
  Pill,
  Apple,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickAddFoodBarProps {
  onAddFood: (item: Omit<FoodItem, 'id'>) => void;
  easyMode: boolean;
  onLogMedicationByVoice?: (voiceCommand: string) => { success: boolean; message: string };
}

const CATEGORIES: { value: FoodCategory; label: string; icon: string }[] = [
  { value: 'produce', label: 'Produce (Fruits & Veggies)', icon: '🥦' },
  { value: 'dairy', label: 'Dairy & Eggs', icon: '🥛' },
  { value: 'meat', label: 'Meat & Poultry', icon: '🥩' },
  { value: 'seafood', label: 'Fish & Seafood', icon: '🐟' },
  { value: 'bakery', label: 'Bakery & Bread', icon: '🍞' },
  { value: 'pantry', label: 'Pantry & Grains', icon: '🍚' },
  { value: 'frozen', label: 'Frozen Items', icon: '🧊' },
  { value: 'beverages', label: 'Beverages', icon: '🧃' },
  { value: 'condiments', label: 'Sauces & Condiments', icon: '🥫' },
  { value: 'snacks', label: 'Snacks', icon: '🥨' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const LOCATIONS: { value: StorageLocation; label: string; icon: string }[] = [
  { value: 'fridge', label: 'Fridge', icon: '❄️' },
  { value: 'pantry', label: 'Pantry', icon: '🚪' },
  { value: 'freezer', label: 'Freezer', icon: '🧊' },
];

export const QuickAddFoodBar: React.FC<QuickAddFoodBarProps> = ({
  onAddFood,
  easyMode,
  onLogMedicationByVoice,
}) => {
  const today = getTodayDateString();

  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [expirationDate, setExpirationDate] = useState(addDaysToDate(today, 5));
  const [category, setCategory] = useState<FoodCategory>('produce');
  const [location, setLocation] = useState<StorageLocation>('fridge');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pack');
  const [rotTip, setRotTip] = useState('');
  const [canFreeze, setCanFreeze] = useState(true);
  const [autoDetected, setAutoDetected] = useState(false);
  const [showAdvancedAdjustments, setShowAdvancedAdjustments] = useState(false);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceMessageType, setVoiceMessageType] = useState<'success' | 'medication' | 'info'>('info');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim().length >= 3) {
      const detected = autoDetectFood(val);
      setCategory(detected.category);
      setLocation(detected.location);
      setRotTip(detected.rotPreventionTip);
      setCanFreeze(detected.canFreeze);
      setExpirationDate(addDaysToDate(purchaseDate, detected.shelfLifeDays));
      setAutoDetected(true);
    }
  };

  const handlePurchaseDateChange = (val: string) => {
    setPurchaseDate(val);
    if (autoDetected && name.trim()) {
      const detected = autoDetectFood(name);
      setExpirationDate(addDaysToDate(val, detected.shelfLifeDays));
    }
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setVoiceFeedback('Microphone speech recognition is not supported in this browser. Try typing instead!');
      setVoiceMessageType('info');
      speakText('Speech recognition is not supported in this browser. Please type the food name.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      playMedicationChime();
      setVoiceFeedback('Listening... Speak a food item (e.g., "Fresh Milk") or medication command (e.g., "I took my morning pills").');
      setVoiceMessageType('info');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (!transcript.trim()) return;

      const parsed = parseVoiceInput(transcript);

      // Scenario A: Medication Intake Logged by voice
      if (parsed.isMedicationAction && onLogMedicationByVoice) {
        const result = onLogMedicationByVoice(transcript);
        setVoiceFeedback(`💊 Voice Medication Logged: "${transcript}" -> ${result.message}`);
        setVoiceMessageType('medication');
        playMedicationChime();
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981'],
        });
        speakText(`Success! ${result.message}`);
      } else {
        // Scenario B: Food Item Added by voice
        const detectedFood = parsed.foodNameHint || transcript;
        setName(detectedFood);
        const auto = autoDetectFood(detectedFood);
        setCategory(auto.category);
        setLocation(auto.location);
        setRotTip(auto.rotPreventionTip);
        setCanFreeze(auto.canFreeze);
        const newExp = addDaysToDate(purchaseDate, auto.shelfLifeDays);
        setExpirationDate(newExp);
        setAutoDetected(true);

        setVoiceFeedback(`🥦 Voice Food Detected: "${detectedFood}". Categorized as ${auto.category} in ${auto.location}! Tap "Add Food Item" to save.`);
        setVoiceMessageType('success');
        playFoodAlertBeep();
        speakText(`Heard: ${detectedFood}. Stored in ${auto.location}, expires on ${newExp}.`);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceFeedback(`Microphone issue: ${event.error}. Please ensure microphone permission is allowed.`);
      setVoiceMessageType('info');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddFood({
      name: name.trim(),
      category,
      location,
      purchaseDate,
      expirationDate,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'item',
      rotPreventionTip: rotTip.trim() || 'Store properly to maximize shelf-life.',
      canFreeze,
      estimatedCost: 3.5,
      consumed: false,
    });

    speakText(`Added ${name} to your ${location}. Expiration set for ${expirationDate}.`);

    // Reset
    setName('');
    setPurchaseDate(today);
    setExpirationDate(addDaysToDate(today, 5));
    setCategory('produce');
    setLocation('fridge');
    setQuantity(1);
    setUnit('pack');
    setAutoDetected(false);
    setShowAdvancedAdjustments(false);
    setVoiceFeedback(null);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-400 p-4 sm:p-5 shadow-md space-y-3">
      {/* Header with Title and Voice Button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Plus className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Quick Add Food & Voice Intake
            </h3>
            <p className="text-xs text-slate-600 hidden sm:block">
              Type or speak to add groceries or log medication intake
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice to text button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs active:scale-95 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/30'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
            }`}
            title="Click to speak food name or say 'I took my medicine'"
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 text-white animate-bounce" />
                <span>Listening... Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-emerald-700" />
                <span>🎤 Speak (Voice-to-Text)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowAdvancedAdjustments(!showAdvancedAdjustments)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50"
          >
            <span>{showAdvancedAdjustments ? 'Hide Details' : 'Manual Adjustments'}</span>
            {showAdvancedAdjustments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Voice Transcript & Action Banner */}
      {voiceFeedback && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 border animate-fade-in ${
            voiceMessageType === 'medication'
              ? 'bg-blue-50 border-blue-300 text-blue-900'
              : voiceMessageType === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {voiceMessageType === 'medication' ? (
              <Pill className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <Apple className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{voiceFeedback}</span>
          </div>

          <button
            type="button"
            onClick={() => setVoiceFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-black text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Primary Row: Name, Purchase Date, Expiration Date, Add Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Food Name with Auto-detect */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Food Item Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Milk, Spinach, Chicken..."
                className="w-full pl-3.5 pr-20 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {autoDetected && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Auto
                  </span>
                )}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`p-1 rounded-md transition ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-700'
                  }`}
                  title="Speak name"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Purchase Date *
            </label>
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => handlePurchaseDateChange(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
              Expiration Date *
            </label>
            <input
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-amber-50 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Food Item</span>
            </button>
          </div>
        </div>

        {/* Quick Expiration Helpers */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <span className="text-slate-600 font-medium">Quick Expiry:</span>
          {[
            { label: '+2 Days', d: 2 },
            { label: '+4 Days', d: 4 },
            { label: '+1 Week', d: 7 },
            { label: '+2 Weeks', d: 14 },
            { label: '+1 Month', d: 30 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setExpirationDate(addDaysToDate(purchaseDate, preset.d))}
              className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 rounded-md font-semibold text-[11px] transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Advanced Manual Adjustments: Category, Storage Location, Quantity, Rot Tips */}
        {showAdvancedAdjustments && (
          <div className="pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 p-3.5 rounded-xl">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 block">
              Manual Category & Storage Adjustments
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Category (Auto-categorized)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Storage Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value as StorageLocation)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.icon} {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Rot Prevention & Preservation Tip (Manual Adjustment)
              </label>
              <input
                type="text"
                value={rotTip}
                onChange={(e) => setRotTip(e.target.value)}
                placeholder="e.g. Wrap in paper towel, keep in crisper drawer, freeze if not cooking soon..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
