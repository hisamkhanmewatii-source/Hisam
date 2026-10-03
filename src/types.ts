export type FoodCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'condiments'
  | 'snacks'
  | 'other';

export type StorageLocation = 'fridge' | 'pantry' | 'freezer';

export type FreshnessStatus = 'fresh' | 'expiring_soon' | 'expiring_today' | 'expired';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  location: StorageLocation;
  purchaseDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  notes?: string;
  rotPreventionTip?: string;
  canFreeze?: boolean;
  consumed?: boolean;
  consumedDate?: string;
  estimatedCost?: number;
  glycemicIndex?: 'low' | 'medium' | 'high';
  isDiabeticFriendly?: boolean;
}

export interface MedicationFoodRule_Type {
  rule: MedicationFoodRule;
}

export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // e.g. "22:00" (10:00 PM)
  endTime: string;   // e.g. "07:00" (7:00 AM)
  suppressChimes: boolean; // Mute sound chimes & beeps during sleep window
  suppressVoice: boolean;  // Silence spoken voice announcements
  suppressPushNotifications: boolean; // Suppress or silence lockscreen notifications
  allowCriticalMeds: boolean; // Allow emergency/critical medicines (insulin, heart meds) to bypass
  bedtimeDoseAdjustment?: 'notify_at_bedtime' | 'shift_before_quiet_hours' | 'silent_log';
}

export type MedicationFoodRule = 'with_meal' | 'empty_stomach' | 'anytime';
export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'bedtime';
export type ReminderCategory = 'medication' | 'supplement';
export type MedicineForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'gummy' | 'drops' | 'powder' | 'inhaler' | 'other';

export interface Medication {
  id: string;
  name: string;
  category?: ReminderCategory; // 'medication' or 'supplement'
  dosage: string;
  form?: MedicineForm;
  frequency: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'every_other_day' | 'weekly' | 'as_needed';
  times: TimeOfDay[];
  specificTimes?: string[]; // e.g. ["08:00", "20:00"]
  foodRule: MedicationFoodRule;
  purpose: string;
  doctorInstructions?: string;
  pillsRemaining: number;
  totalPills: number;
  refillThreshold: number;
  reminderEnabled: boolean;
  history: Record<string, Record<string, boolean>>; // date "YYYY-MM-DD" -> { "morning": true, ... }
  streakDays?: number;
  snoozedUntil?: number; // epoch ms if snoozed
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'food_rot_alert' | 'medication_alert' | 'meal_suggestion' | 'system';
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'urgent';
  relatedItemId?: string;
}

export interface MealPortionItem {
  food: string;
  exactAmount: string;
  handGuide: string;
  whyNow: string;
  calories: number;
}

export interface MealRecommendation {
  recommendationName: string;
  summary: string;
  itemsToEat: MealPortionItem[];
  totalCalories: number;
  macroBreakdown: {
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
  medicationGuidance?: string;
  quickPrepTip?: string;
}

export interface HealthyMealOption {
  id: string;
  title: string;
  description: string;
  suggestedPortionSize: string;
  handPortionGuide: {
    protein: string;
    veggies: string;
    carbs: string;
    fats: string;
  };
  calories: number;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
  prepTime: string;
  expiringIngredientsRescued: Array<{
    name: string;
    daysLeft: number;
    amountToUse: string;
  }>;
  allIngredients: Array<{
    name: string;
    amount: string;
    inPantry: boolean;
  }>;
  healthBenefits: string;
  rotPreventionNote: string;
  dietaryTags: string[];
}


export interface MedicationSymptomProfile {
  medicationName: string;
  dosage?: string;
  purpose?: string;
  commonMildSymptoms: string[];
  howToPreventOrRelieve: string;
  alertWarningSymptoms: string[];
  positiveSymptoms: string[];
  foodInteractionSymptoms: string;
}

export interface FoodSymptomProfile {
  id: string;
  condition: string;
  category: 'spoilage_poisoning' | 'intolerance' | 'acid_gerd' | 'allergy' | 'sugar_spike';
  icon: string;
  commonSymptoms: string[];
  culpritFoods: string[];
  timeframe: string;
  immediateAction: string;
  preventionAdvice: string;
  redFlagDoctorSigns: string[];
}

export interface SymptomLogEntry {
  id: string;
  timestamp: string;
  symptomName: string;
  severity: 'mild' | 'moderate' | 'severe';
  timing: string;
  notes?: string;
  identifiedPrimaryTrigger: string;
  triggerType: 'medicine' | 'food' | 'food_med_combination' | 'unknown';
  confidenceScore: 'high' | 'medium' | 'low';
  correlatedMedications: Array<{
    name: string;
    dosage: string;
    likelihood: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  correlatedFoods: Array<{
    name: string;
    likelihood: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  actionPlan: string;
  warningSigns: string[];
}

export interface RecipeItem {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  caloriesPerServing: number;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
  expiringItemsUsed: string[];
  ingredientsRequired: {
    name: string;
    amount: string;
    inPantry: boolean;
    substitute?: string;
    category?: string;
  }[];
  pantryCoveragePercent: number;
  instructions: string[];
  healthBenefits: string;
  rotPreventionTip: string;
  dietaryTags?: string[];
  recipeUrl?: string;
  sourceName?: string;
  videoSearchUrl?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  estimatedCostSaved?: number;
}
