import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FoodItem, RecipeItem } from '../../types';
import { calculateDaysLeft } from '../../utils/foodDatabase';
import { speakText } from '../../utils/voiceService';
import { playFoodAlertBeep, playMedicationChime } from '../../utils/notificationService';
import { playButtonClickSound } from '../../utils/buttonSettings';
import {
  scoreAndRankRecipes,
  analyzePantryInventory,
  COMPREHENSIVE_RECIPE_CATALOG,
  ScoredRecipe,
} from '../../utils/recipeEngine';
import { getGoogleDriveAccessToken, signInWithGoogleDrive } from '../../utils/googleDriveAuth';
import { saveRecipeToDrive } from '../../utils/googleDriveService';
import {
  ChefHat,
  Sparkles,
  Clock,
  Heart,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  ShieldCheck,
  Check,
  ExternalLink,
  Video,
  Copy,
  Printer,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ShoppingBag,
  Sparkle,
  Utensils,
  Leaf,
  ChevronRight,
  DollarSign,
  Info,
  X,
  Plus,
  HardDrive,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PantryIngredientUsageChart } from './PantryIngredientUsageChart';
import { SupportedLanguage } from '../../utils/translations';

interface RecipeRecommenderProps {
  inventory: FoodItem[];
  onCookRecipe: (recipe: RecipeItem) => void;
  easyMode: boolean;
  filterIngredient?: string;
  onClearFilter?: () => void;
  currentLanguage?: SupportedLanguage;
}

export const RecipeRecommender: React.FC<RecipeRecommenderProps> = ({
  inventory,
  onCookRecipe,
  easyMode,
  filterIngredient,
  onClearFilter,
  currentLanguage = 'en',
}) => {
  // Store custom AI-generated recipes alongside curated catalog
  const [customRecipes, setCustomRecipes] = useState<RecipeItem[]>(() => {
    try {
      const saved = localStorage.getItem('freshguard_custom_recipes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fullCatalog = useMemo(() => {
    return [...customRecipes, ...COMPREHENSIVE_RECIPE_CATALOG];
  }, [customRecipes]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'can_make_now' | 'missing_one' | 'rescues_expiring'>('all');
  const [mealTypeFilter, setMealTypeFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const [dietFilter, setDietFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'best_match' | 'zero_waste' | 'fastest' | 'high_protein' | 'low_calorie'>('best_match');

  // Selected recipe state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');

  // Interactive cooking helpers
  const [servingMultiplier, setServingMultiplier] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedToast, setCopiedToast] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Cooking Countdown Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<any>(null);

  // Shopping list quick-add state
  const [shoppingList, setShoppingList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('freshguard_shopping_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);

  // Google Drive Save State
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveStatus, setDriveSaveStatus] = useState<string | null>(null);

  // Analyze inventory metrics
  const pantryAnalysis = useMemo(() => {
    return analyzePantryInventory(inventory, fullCatalog);
  }, [inventory, fullCatalog]);

  // Rank and filter recipes dynamically
  const rankedRecipes = useMemo(() => {
    return scoreAndRankRecipes(inventory, fullCatalog, {
      searchQuery,
      availabilityFilter,
      mealTypeFilter,
      dietFilter,
      sortBy,
      selectedIngredient: filterIngredient,
    });
  }, [inventory, fullCatalog, searchQuery, availabilityFilter, mealTypeFilter, dietFilter, sortBy, filterIngredient]);

  // Select first recipe if none or invalid
  useEffect(() => {
    if (rankedRecipes.length > 0) {
      const exists = rankedRecipes.some((r) => r.id === selectedRecipeId);
      if (!exists || !selectedRecipeId) {
        setSelectedRecipeId(rankedRecipes[0].id);
        setServingMultiplier(1);
        setCompletedSteps({});
      }
    }
  }, [rankedRecipes, selectedRecipeId]);

  const activeRecipe = useMemo(() => {
    return rankedRecipes.find((r) => r.id === selectedRecipeId) || rankedRecipes[0];
  }, [rankedRecipes, selectedRecipeId]);

  // Timer countdown handler
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            playFoodAlertBeep();
            speakText('Timer complete! Your dish is ready to check.', currentLanguage);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerSeconds, currentLanguage]);

  const startTimerForMinutes = (minutes: number) => {
    playButtonClickSound();
    setTimerSeconds(minutes * 60);
    setTimerRunning(true);
  };

  const toggleTimer = () => {
    playButtonClickSound();
    setTimerRunning(!timerRunning);
  };

  const resetTimer = () => {
    playButtonClickSound();
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  // Helper to scale ingredient amounts
  const scaleAmount = (amountStr: string, multiplier: number) => {
    if (multiplier === 1) return amountStr;
    return amountStr.replace(/(\d+(?:\.\d+)?|\d+\/\d+)/g, (match) => {
      if (match.includes('/')) {
        const [num, den] = match.split('/').map(Number);
        const val = (num / den) * multiplier;
        return val % 1 === 0 ? val.toString() : val.toFixed(1);
      }
      const val = parseFloat(match) * multiplier;
      return val % 1 === 0 ? val.toString() : val.toFixed(1);
    });
  };

  // Handle shopping list additions
  const handleAddToShoppingList = (ingredientName: string) => {
    playButtonClickSound();
    if (!shoppingList.includes(ingredientName)) {
      const updated = [...shoppingList, ingredientName];
      setShoppingList(updated);
      try {
        localStorage.setItem('freshguard_shopping_list', JSON.stringify(updated));
      } catch {}
      speakText(`Added ${ingredientName} to your shopping list.`);
    }
  };

  const handleRemoveFromShoppingList = (item: string) => {
    playButtonClickSound();
    const updated = shoppingList.filter((i) => i !== item);
    setShoppingList(updated);
    try {
      localStorage.setItem('freshguard_shopping_list', JSON.stringify(updated));
    } catch {}
  };

  // AI Recipe Generator
  const handleGenerateAIRecipe = async () => {
    setIsGeneratingAI(true);
    playButtonClickSound();
    try {
      const activeFoods = inventory.filter((f) => !f.consumed).map((f) => f.name);
      const expiringFoods = inventory
        .filter((f) => !f.consumed && calculateDaysLeft(f.expirationDate) <= 2)
        .map((f) => f.name);

      const res = await fetch('/api/gemini/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: activeFoods,
          expiringItems: expiringFoods,
          dietaryPreference: dietFilter !== 'all' ? dietFilter : 'Healthy & Balanced',
          maxTimeMinutes: 25,
        }),
      });

      const data = await res.json();
      if (data.success && data.recipe) {
        const newRecipe: RecipeItem = {
          id: `ai-rec-${Date.now()}`,
          title: data.recipe.title || 'AI Zero-Waste Kitchen Creation',
          description: data.recipe.description || 'Custom crafted recipe using your pantry ingredients.',
          mealType: data.recipe.mealType || 'dinner',
          prepTime: data.recipe.prepTime || '8 mins',
          cookTime: data.recipe.cookTime || '12 mins',
          servings: data.recipe.servings || 2,
          difficulty: data.recipe.difficulty || 'Easy',
          caloriesPerServing: data.recipe.caloriesPerServing || 340,
          macros: data.recipe.macros || { protein: '24g', carbs: '30g', fat: '12g', fiber: '7g' },
          expiringItemsUsed: data.recipe.expiringItemsUsed || expiringFoods.slice(0, 2),
          ingredientsRequired: data.recipe.ingredientsRequired || [],
          pantryCoveragePercent: data.recipe.pantryCoveragePercent || 95,
          instructions: data.recipe.instructions || [],
          healthBenefits: data.recipe.healthBenefits || 'High in nutrients, balanced macros.',
          rotPreventionTip: data.recipe.rotPreventionTip || 'Cooks items before spoiling.',
          recipeUrl: data.recipe.recipeUrl || 'https://www.myplate.gov/myplate-kitchen/recipes',
          sourceName: data.recipe.sourceName || 'AI Studio Kitchen Partner',
          videoSearchUrl: data.recipe.videoSearchUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(data.recipe.title || 'healthy recipe')}`,
          dietaryTags: ['AI Chef', 'Zero Waste Hero', 'Heart Healthy'],
        };

        const updatedCustom = [newRecipe, ...customRecipes];
        setCustomRecipes(updatedCustom);
        try {
          localStorage.setItem('freshguard_custom_recipes', JSON.stringify(updatedCustom));
        } catch {}

        setSelectedRecipeId(newRecipe.id);
        speakText(`Generated a new recipe: ${newRecipe.title}. Ready in ${newRecipe.cookTime}!`, currentLanguage);
      }
    } catch (e) {
      console.warn('AI recipe generation error:', e);
    }
    setIsGeneratingAI(false);
  };

  // Handle cooking a recipe
  const handleCook = (rec: ScoredRecipe) => {
    confetti({
      particleCount: 75,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'],
    });

    try {
      const stored = localStorage.getItem('mohammed_hisam_cooking_history');
      const history = stored ? JSON.parse(stored) : [];
      const newRecord = {
        id: `cm-${Date.now()}`,
        recipeTitle: rec.title,
        cookedDate: new Date().toISOString().split('T')[0],
        ingredientsUsed: rec.ingredientsRequired.map((i) => i.name),
        category: 'produce',
        preventedRot: Boolean(rec.expiringRescuedCount > 0),
        calories: rec.caloriesPerServing,
      };
      localStorage.setItem('mohammed_hisam_cooking_history', JSON.stringify([newRecord, ...history]));
    } catch (e) {
      console.warn('Failed to record cooked meal history:', e);
    }

    onCookRecipe(rec);
    speakText(`Delicious! You marked ${rec.title} as cooked. Used pantry items have been updated.`);
  };

  // Speak step-by-step
  const handleSpeakSteps = (rec: ScoredRecipe) => {
    playButtonClickSound();
    let text = `Recipe for ${rec.title}. `;
    text += `Prep time: ${rec.prepTime}. Cook time: ${rec.cookTime}. `;
    text += `Ingredients: ${rec.ingredientsRequired.map((i) => `${scaleAmount(i.amount, servingMultiplier)} of ${i.name}`).join(', ')}. `;
    text += `Step by step instructions: `;
    rec.instructions.forEach((step, idx) => {
      text += `Step ${idx + 1}: ${step}. `;
    });
    speakText(text, currentLanguage);
  };

  // Copy full recipe to clipboard
  const handleCopyRecipe = (rec: ScoredRecipe) => {
    playButtonClickSound();
    let text = `🍳 ${rec.title}\n`;
    text += `${rec.description}\n\n`;
    text += `⏱️ Prep: ${rec.prepTime} | Cook: ${rec.cookTime} | Servings: ${rec.servings * servingMultiplier}\n`;
    text += `🔥 Calories: ${rec.caloriesPerServing} kcal (Protein: ${rec.macros.protein}, Carbs: ${rec.macros.carbs}, Fat: ${rec.macros.fat})\n\n`;
    text += `🛒 INGREDIENTS:\n`;
    rec.ingredientsRequired.forEach((ing) => {
      text += `• ${scaleAmount(ing.amount, servingMultiplier)} ${ing.name} ${ing.inPantry ? '✅ (In Pantry)' : '❌ (Missing)'}\n`;
    });
    text += `\n👨‍🍳 STEP-BY-STEP INSTRUCTIONS:\n`;
    rec.instructions.forEach((step, idx) => {
      text += `${idx + 1}. ${step}\n`;
    });
    if (rec.recipeUrl) {
      text += `\n🔗 Full Recipe Link: ${rec.recipeUrl}\n`;
    }
    if (rec.videoSearchUrl) {
      text += `🎥 Watch Cooking Video: ${rec.videoSearchUrl}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Save recipe directly into Google Drive
  const handleSaveRecipeToDrive = async (rec: ScoredRecipe) => {
    playButtonClickSound();
    setIsSavingToDrive(true);
    try {
      let token = await getGoogleDriveAccessToken();
      if (!token) {
        const authRes = await signInWithGoogleDrive();
        token = authRes.accessToken;
      }
      const uploaded = await saveRecipeToDrive(token, rec);
      setDriveSaveStatus(`Saved to Google Drive as "${uploaded.name}"`);
      setTimeout(() => setDriveSaveStatus(null), 4000);
      speakText(`Saved recipe ${rec.title} to your Google Drive!`);
    } catch (err: any) {
      console.error('Failed to save recipe to drive:', err);
      setDriveSaveStatus('Failed to save to Google Drive');
      setTimeout(() => setDriveSaveStatus(null), 4000);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. PANTRY INVENTORY ANALYSIS & RECIPE ENGINE DASHBOARD BANNER */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-emerald-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/30 text-amber-200 border border-amber-400/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-300" />
                Pantry Recommendation Engine
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-[11px] font-bold">
                ⚡ Real-Time Pantry Inventory Matching
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Pantry-Based Recipe Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
              Analyzes your kitchen fridge, pantry, and freezer to suggest nutritious meals using primarily
              ingredients you already have, with step-by-step cooking steps and verified recipe links.
            </p>
          </div>

          {/* AI Chef Button & Quick Shopping List */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              disabled={isGeneratingAI}
              onClick={handleGenerateAIRecipe}
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-orange-950/40 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-100 animate-spin" />
              <span>{isGeneratingAI ? 'Chef Crafting...' : 'AI Chef: Custom Recipe'}</span>
            </button>

            <button
              onClick={() => setShowShoppingListModal(true)}
              className="px-3.5 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm backdrop-blur-md transition flex items-center gap-2 border border-white/20"
            >
              <ShoppingBag className="w-4 h-4 text-amber-300" />
              <span>Shopping List ({shoppingList.length})</span>
            </button>
          </div>
        </div>

        {/* Real-time Inventory Health Metrics */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase font-black block">Pantry Ingredients</span>
            <span className="text-base sm:text-lg font-black text-white">{pantryAnalysis.totalItems} Available</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-orange-200 uppercase font-black block">Expiring Perishables</span>
            <span className="text-base sm:text-lg font-black text-orange-300 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              {pantryAnalysis.expiringItemsCount} Urgent
            </span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-emerald-200 uppercase font-black block">Ready to Cook (100%)</span>
            <span className="text-base sm:text-lg font-black text-emerald-300">{pantryAnalysis.fullyCookableRecipesCount} Recipes</span>
          </div>
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
            <span className="text-[10px] text-amber-200 uppercase font-black block">Waste Prevention Value</span>
            <span className="text-base sm:text-lg font-black text-amber-300">${pantryAnalysis.totalPossibleDollarSavings.toFixed(2)} Saved</span>
          </div>
        </div>
      </div>

      {/* FILTER BY SPECIFIC INGREDIENT BANNER (if clicked from a food card) */}
      {filterIngredient && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-800 text-sm font-bold flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span>Showing recipes engineered for ingredient:</span>
              <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg font-black text-sm">
                {filterIngredient}
              </span>
            </span>
          </div>
          {onClearFilter && (
            <button
              onClick={onClearFilter}
              className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-black rounded-xl transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* 2. SEARCH & FILTER ENGINE BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Top search & sorting row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes by name, available ingredients (e.g. spinach, eggs, oats)..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="best_match">🏆 Best Pantry Match</option>
              <option value="zero_waste">🛡️ Most Perishables Rescued</option>
              <option value="fastest">⚡ Fastest Time (Cook + Prep)</option>
              <option value="high_protein">💪 Highest Protein</option>
              <option value="low_calorie">🥗 Lowest Calories</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {/* Availability pills */}
          <button
            onClick={() => setAvailabilityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              availabilityFilter === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Recipes ({fullCatalog.length})
          </button>
          <button
            onClick={() => setAvailabilityFilter('can_make_now')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              availabilityFilter === 'can_make_now'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% In Pantry ({pantryAnalysis.fullyCookableRecipesCount})</span>
          </button>
          <button
            onClick={() => setAvailabilityFilter('missing_one')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              availabilityFilter === 'missing_one'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🟡 Missing Only 1 Item ({pantryAnalysis.almostCookableRecipesCount})
          </button>
          <button
            onClick={() => setAvailabilityFilter('rescues_expiring')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              availabilityFilter === 'rescues_expiring'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Waste Expiring Rescues</span>
          </button>

          {/* Meal types */}
          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
              <button
                key={meal}
                onClick={() => setMealTypeFilter(meal)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  mealTypeFilter === meal
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {meal === 'all' ? 'All Meals' : meal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MAIN RECOMMENDATION WORKSPACE: RECIPE LIST & INTERACTIVE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ranked Recipe Recommendations (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-700" />
              <span>Recommended Recipes ({rankedRecipes.length})</span>
            </h2>
            <span className="text-[11px] text-slate-600">
              Sorted by: {sortBy.replace('_', ' ')}
            </span>
          </div>

          {rankedRecipes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-black text-slate-800 text-sm">No recipes match current filters</h3>
              <p className="text-xs text-slate-600">
                Try clearing your search query or switching from &quot;100% In Pantry&quot; to &quot;All Recipes&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setAvailabilityFilter('all');
                  setMealTypeFilter('all');
                  setDietFilter('all');
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
              {rankedRecipes.map((rec) => {
                const isSelected = activeRecipe?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => {
                      playButtonClickSound();
                      setSelectedRecipeId(rec.id);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition text-left relative ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-400/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                          {rec.mealType || 'Meal'}
                        </span>
                        {rec.difficulty && (
                          <span className="text-[10px] text-slate-600 font-bold">
                            • {rec.difficulty}
                          </span>
                        )}
                      </div>

                      {/* Pantry Coverage Badge */}
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                          rec.pantryCoveragePercent === 100
                            ? 'text-emerald-800 bg-emerald-100'
                            : rec.missingIngredientsCount === 1
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-slate-700 bg-slate-100'
                        }`}
                      >
                        {rec.pantryCoveragePercent === 100 ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>100% In Pantry</span>
                          </>
                        ) : (
                          <span>{rec.pantryCoveragePercent}% In Pantry</span>
                        )}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                      {rec.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {rec.description}
                    </p>

                    {/* Stats & Expiring items */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-semibold">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {rec.prepTime} + {rec.cookTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          {rec.caloriesPerServing} kcal
                        </span>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-800">
                        Protein: {rec.macros.protein}
                      </span>
                    </div>

                    {/* Rescued expiring alert */}
                    {rec.expiringRescuedCount > 0 && (
                      <div className="mt-2.5 text-[11px] font-bold text-orange-900 bg-orange-100/80 px-2.5 py-1 rounded-xl flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                          <span>Rescues {rec.expiringRescuedCount} expiring food items</span>
                        </span>
                        {rec.estimatedDollarsSaved > 0 && (
                          <span className="text-emerald-800 font-black">
                            +${rec.estimatedDollarsSaved.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Missing ingredient hint if 1 item is missing */}
                    {rec.missingIngredientsCount === 1 && (
                      <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg font-medium">
                        Missing: {rec.missingIngredients[0].name} (Substitutable)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Recipe Workspace & Step-by-Step Cooking (7 cols on lg) */}
        <div className="lg:col-span-7">
          {activeRecipe ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-7 space-y-6 text-left">
              {/* Recipe Header & External Action Links */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-md font-black text-xs uppercase tracking-wider">
                      {activeRecipe.mealType || 'Healthy Recipe'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                        activeRecipe.pantryCoveragePercent === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeRecipe.pantryCoveragePercent}% Pantry Ready
                    </span>
                    {activeRecipe.sourceName && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold">
                        Source: {activeRecipe.sourceName}
                      </span>
                    )}
                  </div>

                  {/* Top Action buttons: Speech, Copy, Print */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSaveRecipeToDrive(activeRecipe)}
                      disabled={isSavingToDrive}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl transition flex items-center gap-1 text-xs font-bold border border-blue-200"
                      title="Save Recipe to your Google Drive"
                    >
                      <HardDrive className={`w-4 h-4 text-blue-600 ${isSavingToDrive ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isSavingToDrive ? 'Saving...' : 'Drive'}</span>
                    </button>

                    <button
                      onClick={() => handleSpeakSteps(activeRecipe)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                      title="Read Recipe & Steps Aloud"
                    >
                      <Volume2 className="w-4 h-4 text-amber-600" />
                      <span className="hidden sm:inline">Read Aloud</span>
                    </button>

                    <button
                      onClick={() => handleCopyRecipe(activeRecipe)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1 text-xs font-bold relative"
                      title="Copy recipe text & links"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                      {copiedToast && (
                        <span className="absolute -top-7 right-0 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow">
                          Copied!
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-bold"
                      title="Print Recipe"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {activeRecipe.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeRecipe.description}
                </p>

                {/* Direct Recipe Source Links */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {activeRecipe.recipeUrl && (
                    <a
                      href={activeRecipe.recipeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visit Full Culinary Recipe Guide</span>
                    </a>
                  )}

                  {activeRecipe.videoSearchUrl && (
                    <a
                      href={activeRecipe.videoSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Watch Cooking Video Tutorial</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Time, Nutrition & Serving Scaler Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Total Time</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {activeRecipe.prepTime} + {activeRecipe.cookTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Calories</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900">
                    {activeRecipe.caloriesPerServing} kcal
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Protein</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-800">
                    {activeRecipe.macros.protein}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Fiber / Carbs</span>
                  <span className="text-xs sm:text-sm font-black text-teal-800">
                    {activeRecipe.macros.fiber} / {activeRecipe.macros.carbs}
                  </span>
                </div>
                {/* Serving Scaler */}
                <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0">
                  <span className="text-[10px] uppercase font-bold text-slate-600 block">Servings</span>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {[1, 2, 4].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => {
                          playButtonClickSound();
                          setServingMultiplier(mult);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          servingMultiplier === mult
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {mult * activeRecipe.servings}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* INGREDIENTS BREAKDOWN: In Pantry vs Missing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-700" />
                    <span>Ingredients Checklist ({activeRecipe.availableIngredientsCount} of {activeRecipe.totalIngredientsCount} in pantry)</span>
                  </h3>
                  {activeRecipe.missingIngredientsCount > 0 && (
                    <button
                      onClick={() => {
                        activeRecipe.missingIngredients.forEach((m) => handleAddToShoppingList(m.name));
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Missing to Shopping List
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeRecipe.ingredientsRequired.map((ing, i) => {
                    const scaled = scaleAmount(ing.amount, servingMultiplier);
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl border flex flex-col justify-between gap-1.5 text-xs transition ${
                          ing.inPantry
                            ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                            : 'bg-amber-50/60 border-amber-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            {ing.inPantry ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-black text-slate-900 block">{ing.name}</span>
                              <span className="text-slate-600 font-bold">{scaled}</span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                              ing.inPantry
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {ing.inPantry ? 'In Pantry' : 'Missing'}
                          </span>
                        </div>

                        {/* Substitution advice if missing */}
                        {!ing.inPantry && ing.substitute && (
                          <div className="text-[11px] text-amber-900 bg-white/70 p-1.5 rounded-lg border border-amber-200/60">
                            <strong>Substitute:</strong> {ing.substitute}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP-BY-STEP COOKING MODE WITH INTERACTIVE CHECKLIST & TIMER */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4 text-amber-700" />
                    <span>Interactive Step-by-Step Instructions</span>
                  </h3>

                  {/* Built-in Kitchen Timer widget */}
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                    <Timer className="w-4 h-4 text-amber-700" />
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {timerSeconds > 0 ? formatTimer(timerSeconds) : 'Timer'}
                    </span>
                    {timerSeconds > 0 ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={toggleTimer}
                          className="p-1 hover:bg-slate-200 rounded text-slate-700"
                          title={timerRunning ? 'Pause' : 'Start'}
                        >
                          {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-700" />}
                        </button>
                        <button
                          onClick={resetTimer}
                          className="p-1 hover:bg-slate-200 rounded text-slate-700"
                          title="Reset"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startTimerForMinutes(5)}
                          className="px-1.5 py-0.5 bg-white text-slate-700 hover:bg-amber-100 rounded text-[10px] font-bold"
                        >
                          +5m
                        </button>
                        <button
                          onClick={() => startTimerForMinutes(10)}
                          className="px-1.5 py-0.5 bg-white text-slate-700 hover:bg-amber-100 rounded text-[10px] font-bold"
                        >
                          +10m
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {activeRecipe.instructions.length > 0 && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{
                        width: `${
                          (activeRecipe.instructions.filter((_, idx) => completedSteps[`${activeRecipe.id}-${idx}`]).length /
                            activeRecipe.instructions.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                )}

                {/* Numbered Steps */}
                <div className="space-y-3">
                  {activeRecipe.instructions.map((step, idx) => {
                    const stepKey = `${activeRecipe.id}-${idx}`;
                    const isDone = Boolean(completedSteps[stepKey]);
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          playButtonClickSound();
                          setCompletedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
                        }}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                          isDone
                            ? 'bg-emerald-50/60 border-emerald-300 text-slate-500 line-through'
                            : 'bg-amber-50/40 border-amber-200/80 text-slate-800 hover:border-amber-300'
                        }`}
                      >
                        <button
                          type="button"
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </button>
                        <p className="text-xs sm:text-sm font-medium leading-relaxed select-none">
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Health Benefits & Rot Prevention Callouts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-emerald-900">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>Health & Nutrition Benefit:</span>
                  </div>
                  <p className="leading-relaxed">{activeRecipe.healthBenefits}</p>
                </div>

                <div className="p-3.5 bg-orange-50/80 rounded-2xl border border-orange-200 text-orange-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-orange-900">
                    <ShieldCheck className="w-4 h-4 text-orange-600" />
                    <span>Food Rot Prevention:</span>
                  </div>
                  <p className="leading-relaxed">{activeRecipe.rotPreventionTip}</p>
                </div>
              </div>

              {/* Cooked This Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 text-left">
                  Rescuing <strong className="text-slate-900">{activeRecipe.availableIngredientsCount}</strong> pantry items today.
                </div>

                <button
                  onClick={() => handleCook(activeRecipe)}
                  className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/25 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>I Cooked This Recipe!</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* SHOPPING LIST MODAL */}
      {showShoppingListModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Kitchen Shopping List</h3>
                  <p className="text-xs text-slate-600">Missing ingredients for recommended recipes</p>
                </div>
              </div>
              <button
                onClick={() => setShowShoppingListModal(false)}
                className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shoppingList.length === 0 ? (
              <div className="py-8 text-center text-slate-600 text-xs">
                Your shopping list is empty. You can add missing items from any recipe card with 1 click!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {shoppingList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">• {item}</span>
                    <button
                      onClick={() => handleRemoveFromShoppingList(item)}
                      className="text-rose-600 hover:text-rose-800 font-bold p-1"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `🛒 Grocery Shopping List:\n` + shoppingList.map((i) => `• ${i}`).join('\n')
                  );
                  speakText('Copied shopping list to clipboard.');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy List
              </button>
              <button
                onClick={() => setShowShoppingListModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANTRY INGREDIENT FREQUENCY USAGE CHART (RECHARTS) */}
      <PantryIngredientUsageChart
        inventory={inventory}
        currentLanguage={currentLanguage}
        onFilterByIngredient={(ing) => {
          if (filterIngredient?.toLowerCase() === ing.toLowerCase()) {
            if (onClearFilter) onClearFilter();
          } else {
            const matched = fullCatalog.find(
              (r) =>
                r.ingredientsRequired.some((i) => i.name.toLowerCase().includes(ing.toLowerCase())) ||
                r.expiringItemsUsed.some((e) => e.toLowerCase().includes(ing.toLowerCase()))
            );
            if (matched) {
              setSelectedRecipeId(matched.id);
            }
            window.scrollTo({ top: 220, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
};
