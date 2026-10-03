import React, { useState, useEffect } from 'react';
import { FoodItem, Medication, RecipeItem, StorageLocation, FoodCategory, TimeOfDay } from './types';
import { INITIAL_FOOD_ITEMS, INITIAL_MEDICATIONS } from './utils/mockData';
import { calculateDaysLeft, addDaysToDate, getTodayDateString } from './utils/foodDatabase';
import {
  getCurrentTimeOfDay,
  getDueMedicationsForToday,
  playFoodAlertBeep,
  playMedicationChime,
  checkAndTriggerDueReminders,
} from './utils/notificationService';
import { speakText } from './utils/voiceService';
import { Header } from './components/Header';
import { SeniorModeBanner } from './components/SeniorModeBanner';
import { ActiveDoseAlertBanner } from './components/Medications/ActiveDoseAlertBanner';
import { RottenAlertBanner } from './components/FoodInventory/RottenAlertBanner';
import { QuickAddFoodBar } from './components/FoodInventory/QuickAddFoodBar';
import { FoodCard } from './components/FoodInventory/FoodCard';
import { AddFoodModal } from './components/FoodInventory/AddFoodModal';
import { InventoryCategoryChart } from './components/FoodInventory/InventoryCategoryChart';
import { MedicationManager } from './components/Medications/MedicationManager';
import { MedicineCameraScanner } from './components/Medications/MedicineCameraScanner';
import { MealsAndRecipesHub } from './components/MealsAndRecipes/MealsAndRecipesHub';
import { SymptomsCenter } from './components/Symptoms/SymptomsCenter';
import { DiabetesCare } from './components/Diabetes/DiabetesCare';
import { VoiceAndAlertsHub } from './components/VoiceAndAlerts/VoiceAndAlertsHub';
import { GoogleDriveHub } from './components/GoogleDrive/GoogleDriveHub';
import { SosModal } from './components/Emergency/SosModal';
import { QuickActionDock } from './components/Navigation/QuickActionDock';
import { ButtonAdjusterPrototype } from './components/Prototype/ButtonAdjusterPrototype';
import {
  ButtonSettings,
  loadButtonSettings,
  saveButtonSettings,
  applyButtonSettingsToDOM,
} from './utils/buttonSettings';
import { SupportedLanguage } from './utils/translations';
import { setVoiceLanguage } from './utils/voiceService';
import {
  Plus,
  Search,
  Filter,
  Layers,
  MapPin,
  Calendar,
  Volume2,
  DollarSign,
  Heart,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  const today = getTodayDateString();

  // LocalStorage state management
  const [foodItems, setFoodItems] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('freshguard_food_items');
      return saved ? JSON.parse(saved) : INITIAL_FOOD_ITEMS;
    } catch {
      return INITIAL_FOOD_ITEMS;
    }
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem('freshguard_medications');
      return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
    } catch {
      return INITIAL_MEDICATIONS;
    }
  });

  const [easyMode, setEasyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('freshguard_easy_mode') === 'true';
    } catch {
      return false;
    }
  });

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('mohammed_hisam_language') as SupportedLanguage;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'ar')) {
        setVoiceLanguage(saved);
        return saved;
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    setVoiceLanguage(lang);
    try {
      localStorage.setItem('mohammed_hisam_language', lang);
    } catch {}
  };

  const [currentTab, setCurrentTab] = useState<'inventory' | 'medications' | 'meals_recipes' | 'symptoms' | 'diabetes' | 'voice_alerts' | 'google_drive'>('inventory');
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [isGlobalCameraOpen, setIsGlobalCameraOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isButtonAdjusterOpen, setIsButtonAdjusterOpen] = useState(false);
  const [globalAlertDose, setGlobalAlertDose] = useState<{ med: Medication; slot: TimeOfDay } | null>(null);
  const [buttonSettings, setButtonSettings] = useState<ButtonSettings>(() => loadButtonSettings());
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | StorageLocation>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expiring' | 'fresh' | 'expired'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [recipeFilterIngredient, setRecipeFilterIngredient] = useState<string | undefined>(undefined);
  const [currentSlot, setCurrentSlot] = useState(getCurrentTimeOfDay());

  // Apply button settings to DOM
  useEffect(() => {
    applyButtonSettingsToDOM(buttonSettings);
  }, [buttonSettings]);

  const handleUpdateSettings = (newSettings: ButtonSettings) => {
    setButtonSettings(newSettings);
    saveButtonSettings(newSettings);
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('freshguard_food_items', JSON.stringify(foodItems));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [foodItems]);

  useEffect(() => {
    try {
      localStorage.setItem('freshguard_medications', JSON.stringify(medications));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [medications]);

  useEffect(() => {
    try {
      localStorage.setItem('freshguard_easy_mode', String(easyMode));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [easyMode]);

  // Keep time slot updated and run timely medication/supplement reminders engine
  useEffect(() => {
    checkAndTriggerDueReminders(medications, today);
    const timer = setInterval(() => {
      setCurrentSlot(getCurrentTimeOfDay());
      const { dueItems } = checkAndTriggerDueReminders(medications, today);
      if (dueItems.length > 0) {
        setGlobalAlertDose((prev) => prev || dueItems[0]);
      }
    }, 25000);
    return () => clearInterval(timer);
  }, [medications, today]);

  // Listen for global dose reminder events
  useEffect(() => {
    const handleReminder = (e: any) => {
      if (e.detail?.med && e.detail?.slot) {
        setGlobalAlertDose({ med: e.detail.med, slot: e.detail.slot });
      }
    };
    window.addEventListener('freshguard_dose_reminder_triggered', handleReminder);
    return () => window.removeEventListener('freshguard_dose_reminder_triggered', handleReminder);
  }, []);

  const handleGlobalTakeDose = (medId: string, slot: TimeOfDay) => {
    playMedicationChime();
    const updated = medications.map((m) => {
      if (m.id === medId) {
        const todayLog = { ...(m.history?.[today] || {}) };
        todayLog[slot] = true;
        return {
          ...m,
          pillsRemaining: Math.max(0, m.pillsRemaining - 1),
          history: { ...(m.history || {}), [today]: todayLog },
        };
      }
      return m;
    });
    setMedications(updated);
    setGlobalAlertDose(null);
  };

  const handleGlobalSnoozeDose = (medId: string, minutes: number = 10) => {
    const snoozeTime = Date.now() + minutes * 60 * 1000;
    const updated = medications.map((m) =>
      m.id === medId ? { ...m, snoozedUntil: snoozeTime } : m
    );
    setMedications(updated);
    setGlobalAlertDose(null);
  };

  // Medication and Food stats
  const activeFoods = foodItems.filter((f) => !f.consumed);
  const expiringFoodCount = activeFoods.filter((f) => calculateDaysLeft(f.expirationDate) <= 2).length;

  const dueSummary = getDueMedicationsForToday(medications, today);
  const dueMedsCount = dueSummary.dueNow.length;

  // Rescued / dollars saved calculation
  const consumedFoods = foodItems.filter((f) => f.consumed);
  const savedDollars = consumedFoods.reduce((acc, f) => acc + (f.estimatedCost || 3.0), 0);

  // Food handlers
  const handleSaveFood = (newItem: Omit<FoodItem, 'id'>) => {
    if (editingFood) {
      setFoodItems(
        foodItems.map((f) =>
          f.id === editingFood.id
            ? { ...newItem, id: editingFood.id, consumed: editingFood.consumed }
            : f
        )
      );
    } else {
      const created: FoodItem = {
        ...newItem,
        id: `food-${Date.now()}`,
        consumed: false,
      };
      setFoodItems([created, ...foodItems]);
    }
    setEditingFood(null);
  };

  const handleMarkConsumed = (id: string) => {
    setFoodItems(
      foodItems.map((f) =>
        f.id === id ? { ...f, consumed: true, consumedDate: today } : f
      )
    );
  };

  const handleDeleteFood = (id: string) => {
    setFoodItems(foodItems.filter((f) => f.id !== id));
  };

  const handleMoveToFreezer = (id: string) => {
    setFoodItems(
      foodItems.map((f) => {
        if (f.id === id) {
          // Freeze extends expiration by 90 days
          const newExp = addDaysToDate(today, 90);
          return {
            ...f,
            location: 'freezer',
            expirationDate: newExp,
            rotPreventionTip: 'Safely frozen! Extends shelf-life by 3+ months.',
          };
        }
        return f;
      })
    );
    speakText('Item moved to freezer and expiration extended by 90 days!');
  };

  const handleFindRecipe = (ingredientName: string) => {
    setRecipeFilterIngredient(ingredientName);
    setCurrentTab('meals_recipes');
  };

  const handleCookRecipe = (recipe: RecipeItem) => {
    // Mark matching ingredients as consumed
    const usedNames = recipe.ingredientsRequired.map((i) => i.name.toLowerCase());
    setFoodItems(
      foodItems.map((f) => {
        const matches = usedNames.some((u) => u.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(u));
        if (matches && !f.consumed) {
          return { ...f, consumed: true, consumedDate: today };
        }
        return f;
      })
    );
  };

  const handleSeniorTakeMed = (medId: string, slot: any) => {
    setMedications(
      medications.map((m) => {
        if (m.id === medId) {
          const todayLog = { ...(m.history?.[today] || {}) };
          todayLog[slot] = true;
          return {
            ...m,
            pillsRemaining: Math.max(0, m.pillsRemaining - 1),
            history: {
              ...(m.history || {}),
              [today]: todayLog,
            },
          };
        }
        return m;
      })
    );
  };

  const handleVoiceLogMedication = (command: string): { success: boolean; message: string } => {
    const clean = command.toLowerCase();

    // Check time slot mentioned
    let targetSlot = currentSlot;
    if (clean.includes('morning')) targetSlot = 'morning';
    else if (clean.includes('noon') || clean.includes('lunch') || clean.includes('midday')) targetSlot = 'noon';
    else if (clean.includes('evening') || clean.includes('dinner')) targetSlot = 'evening';
    else if (clean.includes('night') || clean.includes('bedtime')) targetSlot = 'bedtime';

    // Find if user mentioned a specific medication
    let targetMed = medications.find((m) => clean.includes(m.name.toLowerCase()));

    // If no specific med named, find untaken med for that slot
    if (!targetMed) {
      targetMed =
        medications.find((m) => m.times.includes(targetSlot) && !m.history?.[today]?.[targetSlot]) ||
        medications.find((m) => m.times.includes(targetSlot)) ||
        medications[0];
    }

    if (targetMed) {
      handleSeniorTakeMed(targetMed.id, targetSlot);
      return {
        success: true,
        message: `Marked ${targetMed.name} (${targetMed.dosage}) as taken for ${targetSlot}!`,
      };
    }

    return {
      success: false,
      message: 'Medication logged for today.',
    };
  };

  // Filtered Food items
  const filteredFoodItems = activeFoods
    .filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      if (locationFilter !== 'all' && item.location !== locationFilter) {
        return false;
      }
      if (statusFilter !== 'all') {
        const days = calculateDaysLeft(item.expirationDate);
        if (statusFilter === 'expiring' && (days > 2 || days < 0)) return false;
        if (statusFilter === 'expired' && days >= 0) return false;
        if (statusFilter === 'fresh' && days <= 2) return false;
      }
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by expiration date ascending (urgent items first)
      return calculateDaysLeft(a.expirationDate) - calculateDaysLeft(b.expirationDate);
    });

  const urgentFoodsForSenior = activeFoods.filter(
    (f) => calculateDaysLeft(f.expirationDate) <= 2
  );

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans ${easyMode ? 'text-base' : 'text-sm'}`}>
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'meals_recipes') setRecipeFilterIngredient(undefined);
        }}
        easyMode={easyMode}
        onToggleEasyMode={() => setEasyMode(!easyMode)}
        dueMedsCount={dueMedsCount}
        expiringFoodCount={expiringFoodCount}
        savedDollars={savedDollars}
        currentSlot={currentSlot}
        onOpenScanCamera={() => setIsGlobalCameraOpen(true)}
        onOpenSos={() => setIsSosOpen(true)}
        currentLanguage={currentLanguage}
        onChangeLanguage={handleLanguageChange}
        onOpenButtonAdjuster={() => setIsButtonAdjusterOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Global Timely Dose Reminder Alert Banner (Appears across any tab when dose is due) */}
        {globalAlertDose && currentTab !== 'medications' && (
          <ActiveDoseAlertBanner
            medication={globalAlertDose.med}
            slot={globalAlertDose.slot}
            onTakeDose={handleGlobalTakeDose}
            onSnooze={handleGlobalSnoozeDose}
            onDismiss={() => setGlobalAlertDose(null)}
            currentLanguage={currentLanguage}
          />
        )}

        {/* Senior / Easy Mode Banner (Shown prominently if easyMode is enabled or on first turn) */}
        {easyMode && (
          <SeniorModeBanner
            currentSlot={currentSlot}
            dueMedsNow={dueSummary.dueNow}
            urgentFoods={urgentFoodsForSenior}
            onTakeMed={handleSeniorTakeMed}
            onOpenPortion={() => setCurrentTab('meals_recipes')}
            onOpenInventory={() => setCurrentTab('inventory')}
            onOpenScanCamera={() => setIsGlobalCameraOpen(true)}
          />
        )}

        {/* Tab 1: Food Inventory & Expiration Tracker */}
        {currentTab === 'inventory' && (
          <div className="space-y-6">
            {/* Rotten Alert Warning Banner */}
            <RottenAlertBanner foodItems={foodItems} easyMode={easyMode} />

            {/* Quick Add Food Bar with Automatic Categorization, Manual Adjustments & Voice Intake */}
            <QuickAddFoodBar
              onAddFood={handleSaveFood}
              easyMode={easyMode}
              onLogMedicationByVoice={handleVoiceLogMedication}
            />

            {/* Quick Metrics Bar: Rescued food & Savings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Total in Kitchen
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {activeFoods.length} items
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                  Expiring In &le; 48h
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-600">
                  {expiringFoodCount} items
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Food Rescued & Eaten
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700">
                  {consumedFoods.length} items
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                  Est. Money Saved
                </span>
                <span className="text-xl sm:text-2xl font-black text-teal-700">
                  ${savedDollars.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Doughnut Chart of Food Distribution by Category (Recharts) */}
            <InventoryCategoryChart
              foodItems={foodItems}
              selectedCategory={categoryFilter}
              onSelectCategory={setCategoryFilter}
              currentLanguage={currentLanguage}
              easyMode={easyMode}
            />

            {/* Controls Bar: Search, Storage Location, Status Filter, and Add Food Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by food name or category (e.g., spinach, milk, chicken)..."
                    className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Add Food Button */}
                <button
                  onClick={() => {
                    setEditingFood(null);
                    setIsAddFoodOpen(true);
                  }}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Food Item</span>
                </button>
              </div>

              {/* Filters Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                {/* Location Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <span className="font-bold text-slate-600 mr-1">Storage:</span>
                  {[
                    { id: 'all', label: 'All Places' },
                    { id: 'fridge', label: '❄️ Refrigerator' },
                    { id: 'pantry', label: '🚪 Pantry' },
                    { id: 'freezer', label: '🧊 Freezer' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setLocationFilter(loc.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                        locationFilter === loc.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>

                {/* Freshness Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'expiring', label: '⚠️ Expiring Soon' },
                    { id: 'fresh', label: '🟢 Fresh' },
                    { id: 'expired', label: '🔴 Expired' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStatusFilter(st.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold transition ${
                        statusFilter === st.id
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Active Category Filter Indicator */}
                {categoryFilter !== 'all' && (
                  <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-300 font-bold text-xs animate-in fade-in duration-150">
                    <span>Category: <strong className="capitalize">{categoryFilter}</strong></span>
                    <button
                      onClick={() => setCategoryFilter('all')}
                      className="text-emerald-700 hover:text-emerald-950 font-black ml-1 text-sm leading-none"
                      title="Clear category filter"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Food Cards Grid */}
            {filteredFoodItems.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {searchQuery || locationFilter !== 'all' || statusFilter !== 'all'
                    ? 'No matching food items found'
                    : 'Your kitchen inventory is empty!'}
                </h3>
                <p className="text-xs text-slate-700 mt-1">
                  Add food items with their names and expiration dates to prevent rotting and get healthy recipe ideas.
                </p>
                <button
                  onClick={() => setIsAddFoodOpen(true)}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-700 shadow transition"
                >
                  + Add Food Item Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFoodItems.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    onMarkConsumed={handleMarkConsumed}
                    onDelete={handleDeleteFood}
                    onEdit={(f) => {
                      setEditingFood(f);
                      setIsAddFoodOpen(true);
                    }}
                    onFindRecipe={handleFindRecipe}
                    onMoveToFreezer={handleMoveToFreezer}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Mamurise My Medications */}
        {currentTab === 'medications' && (
          <MedicationManager
            medications={medications}
            todayDateStr={today}
            onUpdateMedications={setMedications}
            easyMode={easyMode}
            onOpenSymptoms={() => setCurrentTab('symptoms')}
            currentLanguage={currentLanguage}
          />
        )}

        {/* Combined Tab 3: What to Eat, Portions & Healthy Recipes Hub */}
        {currentTab === 'meals_recipes' && (
          <MealsAndRecipesHub
            inventory={foodItems}
            medications={medications}
            easyMode={easyMode}
            currentLanguage={currentLanguage}
            filterIngredient={recipeFilterIngredient}
            onClearFilter={() => setRecipeFilterIngredient(undefined)}
            onCookMeal={(ingredientNames) => {
              const lower = ingredientNames.map((n) => n.toLowerCase());
              setFoodItems(
                foodItems.map((f) => {
                  const match = lower.some(
                    (l) => l.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(l)
                  );
                  if (match && !f.consumed) {
                    return { ...f, consumed: true, consumedDate: today };
                  }
                  return f;
                })
              );
            }}
            onCookRecipe={handleCookRecipe}
          />
        )}

        {/* Tab 5: Food Symptoms & Medicine Symptoms */}
        {currentTab === 'symptoms' && (
          <SymptomsCenter
            medications={medications}
            foodItems={foodItems}
            easyMode={easyMode}
          />
        )}

        {/* Tab 6: Diabetes & Blood Sugar Care */}
        {currentTab === 'diabetes' && (
          <DiabetesCare
            currentLanguage={currentLanguage}
            easyMode={easyMode}
          />
        )}

        {/* Combined Tab 7: Voice, Translator & Phone Alerts Hub */}
        {currentTab === 'voice_alerts' && (
          <VoiceAndAlertsHub
            currentLanguage={currentLanguage}
            onChangeLanguage={handleLanguageChange}
            easyMode={easyMode}
            foodItems={foodItems}
            medications={medications}
          />
        )}

        {/* Tab 8: Google Drive Cloud Hub */}
        {currentTab === 'google_drive' && (
          <GoogleDriveHub
            foodItems={foodItems}
            medications={medications}
            onRestoreData={(restored) => {
              if (restored.foodItems) setFoodItems(restored.foodItems);
              if (restored.medications) setMedications(restored.medications);
            }}
            currentLanguage={currentLanguage}
            easyMode={easyMode}
          />
        )}
      </main>

      {/* Emergency Medical SOS Modal (Controlled dialog without floating screen button) */}
      <SosModal
        currentLanguage={currentLanguage}
        easyMode={easyMode}
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        showFloatingButton={false}
        sosPosition={buttonSettings.sosPosition}
        offsetX={buttonSettings.sosOffsetX}
        offsetY={buttonSettings.sosOffsetY}
        soundFeedback={buttonSettings.soundFeedback}
      />

      {/* Quick Access Action Dock (Configurable position in app frame) */}
      <QuickActionDock
        settings={buttonSettings}
        currentLanguage={currentLanguage}
        onOpenMic={() => setCurrentTab('voice_alerts')}
        onOpenScanCamera={() => setIsGlobalCameraOpen(true)}
        onOpenSos={() => setIsSosOpen(true)}
        onOpenAddFood={() => setIsAddFoodOpen(true)}
        onOpenAdjustButtons={() => setIsButtonAdjusterOpen(true)}
      />

      {/* Button Adjuster Prototype Modal */}
      <ButtonAdjusterPrototype
        isOpen={isButtonAdjusterOpen}
        onClose={() => setIsButtonAdjusterOpen(false)}
        settings={buttonSettings}
        onUpdateSettings={handleUpdateSettings}
        currentLanguage={currentLanguage}
      />

      {/* Add / Edit Food Modal */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => {
          setIsAddFoodOpen(false);
          setEditingFood(null);
        }}
        onSave={handleSaveFood}
        initialItem={editingFood}
      />

      {/* Global Camera Medicine & Tablet Scanner Modal */}
      <MedicineCameraScanner
        isOpen={isGlobalCameraOpen}
        onClose={() => setIsGlobalCameraOpen(false)}
        existingMedications={medications}
        onMarkMedicationTaken={(id, slot) => handleSeniorTakeMed(id, slot)}
        onAddNewMedication={(newMed) => setMedications([...medications, newMed])}
        easyMode={easyMode}
      />
    </div>
  );
}
