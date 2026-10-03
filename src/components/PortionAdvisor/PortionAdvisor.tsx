import React, { useState, useEffect } from 'react';
import { FoodItem, Medication, MealRecommendation, HealthyMealOption } from '../../types';
import { generateLocalMealRecommendation, generateThreeHealthyMealOptions } from '../../utils/portionEngine';
import { calculateDaysLeft } from '../../utils/foodDatabase';
import { speakText } from '../../utils/voiceService';
import { playMedicationChime } from '../../utils/notificationService';
import confetti from 'canvas-confetti';
import {
  Utensils,
  Volume2,
  Sparkles,
  ShieldAlert,
  Clock,
  Heart,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Flame,
  Check,
} from 'lucide-react';

interface PortionAdvisorProps {
  inventory: FoodItem[];
  medications: Medication[];
  easyMode: boolean;
  onCookMeal?: (ingredientsToDeduct: string[]) => void;
}

export const PortionAdvisor: React.FC<PortionAdvisorProps> = ({
  inventory,
  medications,
  easyMode,
  onCookMeal,
}) => {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [hungerLevel, setHungerLevel] = useState<'light' | 'moderate' | 'high'>('moderate');
  const [dietGoal, setDietGoal] = useState<'balanced' | 'weight_loss' | 'muscle_gain' | 'low_carb'>('balanced');
  const [isSugarPatientMode, setIsSugarPatientMode] = useState<boolean>(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [cookedFeedback, setCookedFeedback] = useState<string | null>(null);

  // 3 Healthy Meal Options Engine
  const [threeMeals, setThreeMeals] = useState<HealthyMealOption[]>(() =>
    generateThreeHealthyMealOptions(inventory, medications)
  );

  // Keep 3 meals synced with pantry inventory
  useEffect(() => {
    setThreeMeals(generateThreeHealthyMealOptions(inventory, medications));
  }, [inventory, medications]);

  const [recommendation, setRecommendation] = useState<MealRecommendation>(() =>
    generateLocalMealRecommendation(inventory, medications, {
      mealType: 'lunch',
      hungerLevel: 'moderate',
      dietGoal: 'balanced',
    })
  );

  const handleEatMealOption = (meal: HealthyMealOption) => {
    playMedicationChime();
    confetti({
      particleCount: 55,
      spread: 75,
      origin: { y: 0.65 },
      colors: ['#10b981', '#3b82f6', '#f59e0b'],
    });

    const ingredientNames = meal.allIngredients.map((i) => i.name);
    if (onCookMeal) {
      onCookMeal(ingredientNames);
    }

    setCookedFeedback(`Enjoyed "${meal.title}"! Pantry ingredients have been marked as consumed.`);
    speakText(`Enjoy your meal: ${meal.title}. Suggested portion was ${meal.suggestedPortionSize}.`);

    setTimeout(() => setCookedFeedback(null), 5000);
  };

  const handleSpeakMealOption = (meal: HealthyMealOption) => {
    let text = `Recommended meal option: ${meal.title}. `;
    text += `${meal.description}. `;
    text += `Suggested portion size: ${meal.suggestedPortionSize}. `;
    text += `Portion details: Protein is ${meal.handPortionGuide.protein}. Vegetables is ${meal.handPortionGuide.veggies}. Carbohydrates is ${meal.handPortionGuide.carbs}. `;
    text += `Total calories: ${meal.calories}. `;
    if (meal.expiringIngredientsRescued.length > 0) {
      text += `This meal rescues ${meal.expiringIngredientsRescued.map((i) => i.name).join(' and ')} before rotting!`;
    }
    speakText(text);
  };

  const handleGenerate = async (useAI = false) => {
    if (useAI) {
      setLoadingAI(true);
      try {
        const expiringFoods = inventory
          .filter((f) => !f.consumed && calculateDaysLeft(f.expirationDate) <= 2)
          .map((f) => f.name);
        const availableFoods = inventory.filter((f) => !f.consumed).map((f) => f.name);
        const medsWithFood = medications
          .filter((m) => m.foodRule === 'with_meal')
          .map((m) => `${m.name} (${m.dosage})`);

        const res = await fetch('/api/gemini/what-to-eat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mealTime: mealType,
            hungerLevel,
            dietGoal,
            availableFoods,
            expiringFoods,
            medicationsToTakeWithFood: medsWithFood,
          }),
        });

        const data = await res.json();
        if (data.success && data.advice) {
          setRecommendation(data.advice);
          setLoadingAI(false);
          return;
        }
      } catch (e) {
        console.warn('AI call failed, using smart local advisor:', e);
      }
      setLoadingAI(false);
    }

    // Local generation
    const local = generateLocalMealRecommendation(inventory, medications, {
      mealType,
      hungerLevel,
      dietGoal,
    });
    setRecommendation(local);
  };

  const handleSpeakMeal = () => {
    let text = `Here is what to eat right now: ${recommendation.recommendationName}. `;
    text += `${recommendation.summary} `;
    recommendation.itemsToEat.forEach((item) => {
      text += `Eat ${item.food}: amount is ${item.exactAmount}, or ${item.handGuide}. `;
    });
    if (recommendation.medicationGuidance) {
      text += recommendation.medicationGuidance;
    }
    speakText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Meal Suggestion Engine & Portion Guide
            </h1>
            <p className="text-xs sm:text-sm text-slate-700">
              3 healthy meals prioritizing expiring pantry ingredients • Suggested portion sizes & descriptions
            </p>
          </div>
        </div>

        <button
          onClick={handleSpeakMeal}
          className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2"
        >
          <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>🔊 Read Meal Out Loud</span>
        </button>
      </div>

      {/* 3 RECOMMENDED HEALTHY MEALS ENGINE (PRIORITIZING EXPIRING INGREDIENTS) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-2xl">
              🥗
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Pantry Inventory Match
                </span>
                <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  🛡️ Rot Prevention Priority
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                3 Healthy Meal Options Based on Your Pantry
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              const text = threeMeals
                .map(
                  (m, i) =>
                    `Option ${i + 1}: ${m.title}. ${m.description} Portion size is ${m.suggestedPortionSize}.`
                )
                .join(' ');
              speakText(`Here are 3 healthy meals from your pantry: ${text}`);
            }}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>🔊 Read All 3 Options</span>
          </button>
        </div>

        {cookedFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cookedFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {threeMeals.map((meal, idx) => (
            <div
              key={meal.id}
              className="bg-slate-50/70 border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            >
              <div>
                {/* Option Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                    Option {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {meal.prepTime}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {meal.title}
                </h3>

                {/* Brief description */}
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  {meal.description}
                </p>

                {/* Suggested portion size */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wide text-emerald-800 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      Suggested Portion Size:
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {meal.calories} kcal
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    {meal.suggestedPortionSize}
                  </p>
                </div>

                {/* Hand portion breakdown */}
                <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>🖐️ Protein:</span>
                    <strong className="text-slate-800 text-right">{meal.handPortionGuide.protein}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>✊ Veggies:</span>
                    <strong className="text-slate-800 text-right">{meal.handPortionGuide.veggies}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🥣 Carbs:</span>
                    <strong className="text-slate-800 text-right">{meal.handPortionGuide.carbs}</strong>
                  </div>
                </div>

                {/* Rescued expiring ingredients badge */}
                {meal.expiringIngredientsRescued.length > 0 && (
                  <div className="mt-3 p-2 bg-orange-100/70 border border-orange-200 rounded-xl text-[11px] text-orange-950 font-bold">
                    <span className="block text-orange-900 font-black mb-0.5">
                      🛡️ Rescues Expiring Foods:
                    </span>
                    <div className="space-y-0.5">
                      {meal.expiringIngredientsRescued.map((exp, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span>{exp.name}</span>
                          <span className="text-rose-700 font-extrabold">
                            {exp.daysLeft <= 0 ? 'Expires today' : `${exp.daysLeft}d left`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health benefits note */}
                <p className="mt-2 text-[11px] text-emerald-900 font-medium italic">
                  🌱 {meal.healthBenefits}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSpeakMealOption(meal)}
                  className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-white rounded-lg transition"
                  title="Read meal details out loud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleEatMealOption(meal)}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Ate / Cooked This</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Senior & Simple Visual Hand Guide Rule */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🖐️</span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              Universal Hand-Size Portion Guide (Easy for Everyone)
            </h2>
            <p className="text-xs text-slate-700">
              No scales needed! Just use your hand to measure the right amount to eat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs">
            <div className="text-3xl mb-1">🖐️</div>
            <h4 className="text-xs font-black text-slate-900">Palm of Hand</h4>
            <p className="text-[11px] font-bold text-emerald-700">Protein (Meat, Eggs, Fish, Tofu)</p>
            <span className="text-[10px] text-slate-600 block mt-0.5">Approx 100g - 140g</span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs">
            <div className="text-3xl mb-1">✊</div>
            <h4 className="text-xs font-black text-slate-900">Closed Fist</h4>
            <p className="text-[11px] font-bold text-teal-700">Vegetables & Salad Greens</p>
            <span className="text-[10px] text-slate-600 block mt-0.5">Approx 1 - 2 cups</span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs">
            <div className="text-3xl mb-1">🥣</div>
            <h4 className="text-xs font-black text-slate-900">Cupped Hand</h4>
            <p className="text-[11px] font-bold text-cyan-700">Grains (Rice, Oats, Bread)</p>
            <span className="text-[10px] text-slate-600 block mt-0.5">Approx 1/2 cup cooked</span>
          </div>

          <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-xs">
            <div className="text-3xl mb-1">👍</div>
            <h4 className="text-xs font-black text-slate-900">Thumb Tip</h4>
            <p className="text-[11px] font-bold text-amber-700">Fats (Oil, Butter, Ghee, Nuts)</p>
            <span className="text-[10px] text-slate-600 block mt-0.5">Approx 1 tablespoon</span>
          </div>
        </div>
      </div>

      {/* DIABETIC / SUGAR PATIENT MODE BANNER & MEAL PLAN */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 bg-rose-200 text-rose-900 rounded-xl">🩸</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                Sugar Patient Guidance (Diabetes / High Glucose)
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                What Can A Sugar Patient Eat Today?
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              speakText(
                "Diabetic patient guide for today: Breakfast: 2 eggs with sautéed spinach and 1 small slice of whole grain bread. Lunch: Grilled chicken breast with a large salad of greens and cucumbers, olive oil dressing. Snack: 1 small cup of plain Greek yogurt with a few berries. Dinner: Pan-seared fish or tofu with steamed broccoli and one cupped hand of brown rice. Always eat vegetables and protein first to prevent blood sugar spikes, then take your Metformin with your meal!"
              );
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
            <span>🔊 Listen to Diabetic Meals</span>
          </button>
        </div>

        {/* 4-Meal Plan for Sugar Patient based on available pantry items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>🌅 Breakfast</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">Low GI</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Spinach & Egg Scramble</h4>
            <p className="text-xs text-slate-600 mt-1">
              2 eggs (palm protein) + 2 fists spinach + 1 thin slice whole grain bread.
            </p>
            <span className="text-[10px] text-blue-700 font-bold block mt-2 bg-blue-50 p-1 rounded">
              💊 Take Morning Metformin 500mg with first bite!
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>☀️ Lunch</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">Zero Spike</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Grilled Chicken Salad</h4>
            <p className="text-xs text-slate-600 mt-1">
              1 palm chicken breast (120g) + 2 fists greens, tomato, cucumber + 1 spoon olive oil.
            </p>
            <span className="text-[10px] text-emerald-800 font-bold block mt-2 bg-emerald-50 p-1 rounded">
              🛡️ Rescues chicken before expiring!
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>🍎 4 PM Snack</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">Steady Glucose</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Greek Yogurt & Cinnamon</h4>
            <p className="text-xs text-slate-600 mt-1">
              1 small cup plain Greek yogurt (100g) + pinch cinnamon (helps insulin sensitivity).
            </p>
            <span className="text-[10px] text-slate-600 block mt-2">
              Prevents late-afternoon blood sugar dips.
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>🌆 Dinner</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">Controlled Carb</span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Steamed Veggies & Fish/Tofu</h4>
            <p className="text-xs text-slate-600 mt-1">
              1 palm salmon or firm tofu + generous broccoli + 1/2 cupped hand brown rice.
            </p>
            <span className="text-[10px] text-blue-700 font-bold block mt-2 bg-blue-50 p-1 rounded">
              💊 Take Evening Metformin with dinner.
            </span>
          </div>
        </div>

        {/* 3 Golden Rules for Sugar Patients */}
        <div className="bg-rose-100/60 p-3 rounded-xl text-xs text-rose-950 font-semibold flex flex-wrap items-center justify-between gap-2">
          <span>✨ <strong>Rule 1:</strong> Eat Vegetables & Protein first before carbs.</span>
          <span>✨ <strong>Rule 2:</strong> Max 1 cupped hand of carbs per meal.</span>
          <span>✨ <strong>Rule 3:</strong> Never take diabetes pills on empty stomach unless instructed.</span>
        </div>
      </div>

      {/* Select Meal Time & Hunger Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
            1. Select Meal Time
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
              { id: 'lunch', label: 'Lunch', icon: '☀️' },
              { id: 'dinner', label: 'Dinner', icon: '🌆' },
              { id: 'snack', label: 'Snack', icon: '🍎' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMealType(m.id as any)}
                className={`p-3 rounded-xl border text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                  mealType === m.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              2. How Hungry Are You?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', desc: 'Small snack' },
                { id: 'moderate', label: 'Normal', desc: 'Standard meal' },
                { id: 'high', label: 'Very Hungry', desc: 'Hearty portion' },
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHungerLevel(h.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    hungerLevel === h.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-xs font-extrabold">{h.label}</span>
                  <span className="text-[10px] opacity-80">{h.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
              3. Health Target
            </label>
            <select
              value={dietGoal}
              onChange={(e) => setDietGoal(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="balanced">Balanced & Healthy Digestion</option>
              <option value="weight_loss">Weight Management (High Fiber & Lean)</option>
              <option value="muscle_gain">Strength & Recovery (High Protein)</option>
              <option value="low_carb">Low Carb & Blood Sugar Control</option>
            </select>
          </div>
        </div>

        {/* Generate Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => handleGenerate(false)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition"
          >
            Update Suggestion
          </button>
          <button
            disabled={loadingAI}
            onClick={() => handleGenerate(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md active:scale-95 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{loadingAI ? 'Calculating...' : 'Ask Dietitian AI'}</span>
          </button>
        </div>
      </div>

      {/* Suggested Meal & Exact Amount Card */}
      <div className="bg-white rounded-2xl border-2 border-emerald-400 p-5 sm:p-6 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-xs font-black uppercase tracking-wider">
              Recommended For Right Now
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {recommendation.recommendationName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-1">
              {recommendation.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shrink-0">
            <Scale className="w-5 h-5 text-emerald-700" />
            <div>
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                Total Energy
              </span>
              <span className="text-base font-black text-emerald-900">
                ~{recommendation.totalCalories} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Exact Items & Amount Breakdown */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
            Exact Items To Eat & How Much To Measure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendation.itemsToEat.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {item.food}
                  </h4>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-black text-emerald-800 bg-emerald-100/60 px-2 py-1 rounded">
                      📏 Amount: {item.exactAmount}
                    </div>
                    <div className="text-xs font-bold text-teal-800 bg-teal-100/60 px-2 py-1 rounded">
                      🖐️ Hand Guide: {item.handGuide}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{item.whyNow}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medication Buffer & Safety Note */}
        {recommendation.medicationGuidance && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
            <span className="text-2xl">💊</span>
            <div>
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide">
                Medication Protection Manner
              </h4>
              <p className="text-xs font-medium text-blue-800 mt-0.5">
                {recommendation.medicationGuidance}
              </p>
            </div>
          </div>
        )}

        {/* Quick prep tip */}
        {recommendation.quickPrepTip && (
          <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Quick Prep Tip:</strong> {recommendation.quickPrepTip}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
