import { FoodItem, MealRecommendation, Medication, HealthyMealOption } from '../types';
import { calculateDaysLeft } from './foodDatabase';

export interface PortionProfile {
  hungerLevel: 'light' | 'moderate' | 'high';
  dietGoal: 'balanced' | 'weight_loss' | 'muscle_gain' | 'low_carb';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export function generateLocalMealRecommendation(
  inventory: FoodItem[],
  medications: Medication[],
  profile: PortionProfile
): MealRecommendation {
  const activeFoods = inventory.filter((f) => !f.consumed);
  
  // Sort by urgency of expiration
  const expiringFirst = [...activeFoods].sort(
    (a, b) => calculateDaysLeft(a.expirationDate) - calculateDaysLeft(b.expirationDate)
  );

  const urgentItems = expiringFirst.slice(0, 3);
  const medFoodRequirements = medications
    .filter((m) => m.foodRule === 'with_meal')
    .map((m) => m.name);

  // Default healthy templates if pantry is sparse
  let recTitle = 'Nutritious Pantry Rescue Bowl';
  let summary = 'A fiber-rich and protein-balanced meal crafted to consume your most fragile ingredients first.';
  
  const items = [];
  let totalCalories = 0;

  if (profile.mealType === 'breakfast') {
    recTitle = 'Wholesome Morning Energy & Med Buffer';
    summary = 'Gentle on digestion, high in antioxidants, and perfectly portioned to protect your stomach for morning medications.';
  } else if (profile.mealType === 'lunch') {
    recTitle = 'Crisp Fresh-Rescue Power Lunch';
    summary = 'Sustained midday focus with balanced complex carbs and vibrant vegetables rescue.';
  } else if (profile.mealType === 'dinner') {
    recTitle = 'Restorative Anti-Waste Evening Plate';
    summary = 'Light yet deeply nourishing, designed to avoid late-night sluggishness while clearing fridge surplus.';
  } else {
    recTitle = 'Quick Nutrient-Dense Fuel Snack';
    summary = 'A fast portion-calibrated snack to curb hunger between meals.';
  }

  // Construct items from pantry or high-nutrition staples
  if (urgentItems.length > 0) {
    urgentItems.forEach((item) => {
      const days = calculateDaysLeft(item.expirationDate);
      const isUrgent = days <= 2;
      
      let amountStr = '1 standard portion (100g)';
      let handStr = '1 fist-sized portion';
      let cals = 75;

      if (item.category === 'produce') {
        amountStr = '1.5 cups fresh (approx 90g)';
        handStr = '1 to 2 closed fists (fresh vegetables)';
        cals = 35;
      } else if (item.category === 'dairy') {
        amountStr = '1 cup (240ml) or 150g yogurt';
        handStr = '1 cupped hand (calcium & protein)';
        cals = 130;
      } else if (item.category === 'meat' || item.category === 'seafood') {
        amountStr = '120g - 150g cooked fillet';
        handStr = '1 flat palm size (lean protein)';
        cals = 180;
      } else if (item.category === 'bakery') {
        amountStr = '1 to 2 slices (60g)';
        handStr = '1 cupped hand (whole grains)';
        cals = 140;
      } else if (item.category === 'pantry') {
        amountStr = '1/2 cup cooked (100g)';
        handStr = '1 cupped hand (energy)';
        cals = 150;
      }

      items.push({
        food: item.name,
        exactAmount: amountStr,
        handGuide: handStr,
        whyNow: isUrgent ? `Expires in ${days <= 0 ? 'today' : days + 'd'} — consume now to stop rotten waste!` : 'Fresh pantry pick',
        calories: cals,
      });
      totalCalories += cals;
    });
  } else {
    items.push(
      {
        food: 'Rolled Oats or Whole Grain Toast',
        exactAmount: '1/2 cup dry oats (45g) or 2 bread slices',
        handGuide: '1 cupped hand (complex carbs)',
        whyNow: 'Sustained energy and gut fiber',
        calories: 150,
      },
      {
        food: 'Eggs or Greek Yogurt',
        exactAmount: '2 large eggs (100g) or 150g yogurt',
        handGuide: '1 open palm (lean protein)',
        whyNow: 'Muscle repair and satiety',
        calories: 140,
      },
      {
        food: 'Mixed Greens / Seasonal Fruit',
        exactAmount: '1 medium fruit (140g) or 2 cups greens',
        handGuide: '1 closed fist (micronutrients)',
        whyNow: 'Vitamins & vital minerals',
        calories: 60,
      }
    );
    totalCalories = 350;
  }

  // Adjust portion size based on hunger
  if (profile.hungerLevel === 'high') {
    totalCalories = Math.round(totalCalories * 1.3);
  } else if (profile.hungerLevel === 'light') {
    totalCalories = Math.round(totalCalories * 0.8);
  }

  let medGuidance = 'Take with a full 250ml glass of water.';
  if (medFoodRequirements.length > 0) {
    medGuidance = `⚠️ Critical: You take ${medFoodRequirements.join(', ')} with meals. Consume this food first, then take your medication 5-10 minutes into the meal to avoid stomach upset.`;
  }

  return {
    recommendationName: recTitle,
    summary,
    itemsToEat: items,
    totalCalories,
    macroBreakdown: {
      protein: `${Math.round(totalCalories * 0.25 / 4)}g`,
      carbs: `${Math.round(totalCalories * 0.50 / 4)}g`,
      fat: `${Math.round(totalCalories * 0.25 / 9)}g`,
      fiber: '7g',
    },
    medicationGuidance: medGuidance,
    quickPrepTip: 'Simple skillet or one-bowl prep in under 12 minutes.',
  };
}

export function generateThreeHealthyMealOptions(
  inventory: FoodItem[],
  medications: Medication[] = []
): HealthyMealOption[] {
  const activeFoods = inventory.filter((f) => !f.consumed);

  // Sort inventory items by expiration date ascending (expiring soonest first)
  const expiringSorted = [...activeFoods].sort(
    (a, b) => calculateDaysLeft(a.expirationDate) - calculateDaysLeft(b.expirationDate)
  );

  const urgentItems = expiringSorted.filter((f) => calculateDaysLeft(f.expirationDate) <= 3);
  const findItem = (keywords: RegExp) =>
    activeFoods.find((f) => keywords.test(f.name) || keywords.test(f.category));

  // Identify expiring or available staples
  const poultryOrMeat = findItem(/(chicken|turkey|beef|steak|pork|meat)/i);
  const fishOrSeafood = findItem(/(salmon|fish|tuna|shrimp|seafood)/i);
  const greenVeg = findItem(/(spinach|kale|salad|lettuce|greens)/i);
  const tomatoesOrVeggies = findItem(/(tomato|pepper|broccoli|cucumber|carrot)/i);
  const dairyOrEggs = findItem(/(egg|yogurt|milk|cheese|tofu)/i);
  const breadOrGrain = findItem(/(bread|toast|oat|rice|pasta|grain|tortilla)/i);
  const fruit = findItem(/(banana|apple|berry|berries|fruit)/i);

  // Option 1: High-Protein Sauté / Rot-Rescue Plate
  const opt1Expiring = [poultryOrMeat, greenVeg, breadOrGrain].filter(Boolean) as FoodItem[];
  const opt1: HealthyMealOption = {
    id: 'meal-opt-1',
    title: poultryOrMeat
      ? `Pan-Seared ${poultryOrMeat.name} with Wilted ${greenVeg ? greenVeg.name : 'Greens'}`
      : `High-Protein Scramble with ${greenVeg ? greenVeg.name : 'Fresh Greens'}`,
    description: `A lean, satisfying high-protein meal specifically designed to rescue ${
      opt1Expiring.map((i) => i.name).join(' & ') || 'fragile ingredients'
    } before they spoil.`,
    suggestedPortionSize: '1 dinner plate (approx 360g total)',
    handPortionGuide: {
      protein: '1 flat palm (approx 120g - 140g lean cooked protein)',
      veggies: '2 closed fists (fresh greens collapse when cooked)',
      carbs: '1 cupped hand (1-2 slices whole grain bread or 1/2 cup cooked grains)',
      fats: '1 thumb tip (approx 1 tablespoon olive oil or butter for skillet)',
    },
    calories: 380,
    macros: {
      protein: '38g',
      carbs: '24g',
      fat: '12g',
      fiber: '5g',
    },
    prepTime: '12-15 mins',
    expiringIngredientsRescued: opt1Expiring.map((f) => ({
      name: f.name,
      daysLeft: calculateDaysLeft(f.expirationDate),
      amountToUse: f.category === 'produce' ? '80g - 100g' : f.category === 'meat' ? '140g' : '1-2 slices',
    })),
    allIngredients: [
      { name: poultryOrMeat?.name || 'Lean Protein Fillet', amount: '140g', inPantry: !!poultryOrMeat },
      { name: greenVeg?.name || 'Leafy Greens', amount: '2 generous handfuls (80g)', inPantry: !!greenVeg },
      { name: breadOrGrain?.name || 'Whole Grain Toast', amount: '1-2 slices', inPantry: !!breadOrGrain },
      { name: 'Olive Oil & Garlic', amount: '1 tsp', inPantry: true },
    ],
    healthBenefits: 'High in bioavailable iron, zinc, and lean amino acids for sustained satiety without blood sugar spikes.',
    rotPreventionNote: 'Consuming fresh poultry and greens today rescues your most perishable fridge investments.',
    dietaryTags: ['High Protein', 'Blood Sugar Friendly', 'Zero Waste Hero'],
  };

  // Option 2: Quick Anti-Waste Farm Skillet / Scramble
  const opt2Expiring = [dairyOrEggs, tomatoesOrVeggies, greenVeg].filter(Boolean) as FoodItem[];
  const opt2: HealthyMealOption = {
    id: 'meal-opt-2',
    title: `Golden Skillet with ${tomatoesOrVeggies ? tomatoesOrVeggies.name : 'Diced Veggies'} & ${
      greenVeg ? greenVeg.name : 'Spinach'
    }`,
    description: `A fast 8-minute meal rich in choline and lutein. Sautéing softened tomatoes and greens locks in their vitamins before they turn sour.`,
    suggestedPortionSize: '1 medium skillet portion (approx 310g total)',
    handPortionGuide: {
      protein: '1 open palm (2-3 large eggs or 120g firm tofu)',
      veggies: '1 to 2 closed fists (sautéed tomatoes & greens)',
      carbs: '1 small cupped hand (optional 1 slice toasted bread)',
      fats: '1 thumb tip (light butter or olive oil drizzle)',
    },
    calories: 320,
    macros: {
      protein: '22g',
      carbs: '12g',
      fat: '20g',
      fiber: '4g',
    },
    prepTime: '8 mins',
    expiringIngredientsRescued: opt2Expiring.map((f) => ({
      name: f.name,
      daysLeft: calculateDaysLeft(f.expirationDate),
      amountToUse: f.name.includes('Egg') ? '2-3 eggs' : '1 cup diced',
    })),
    allIngredients: [
      { name: dairyOrEggs?.name || 'Fresh Eggs', amount: '2-3 eggs', inPantry: !!dairyOrEggs },
      { name: tomatoesOrVeggies?.name || 'Roma Tomatoes', amount: '1 diced', inPantry: !!tomatoesOrVeggies },
      { name: greenVeg?.name || 'Baby Spinach', amount: '1 large cup (50g)', inPantry: !!greenVeg },
      { name: 'Black Pepper & Salt', amount: 'Pinch', inPantry: true },
    ],
    healthBenefits: 'Carotenoids and healthy egg fats support brain focus, retinal cell health, and safe medication absorption.',
    rotPreventionNote: 'Uses slightly soft tomatoes and delicate greens before condensation causes mold.',
    dietaryTags: ['Quick 10-Min', 'Low Carb', 'Vegetarian', 'Diabetic Safe'],
  };

  // Option 3: Prebiotic Energy Bowl / Overnight Oats
  const opt3Expiring = [fruit, dairyOrEggs, breadOrGrain].filter(Boolean) as FoodItem[];
  const opt3: HealthyMealOption = {
    id: 'meal-opt-3',
    title: fruit?.name.includes('Banana')
      ? `Creamy ${fruit.name} & Yogurt Power Bowl`
      : 'Prebiotic Fruit & Greek Yogurt Parfait',
    description: `A refreshing gut-friendly meal combining soluble oat beta-glucan and natural probiotics to improve digestive motility.`,
    suggestedPortionSize: '1 deep breakfast or snack bowl (approx 330g total)',
    handPortionGuide: {
      protein: '1 cupped hand (150g Greek yogurt or cottage cheese)',
      veggies: 'None (replaced with 1 whole fresh fruit)',
      carbs: '1 cupped hand (1/2 cup rolled oats or seeded granola)',
      fats: '1 thumb tip (crushed walnuts, chia, or peanut butter)',
    },
    calories: 340,
    macros: {
      protein: '21g',
      carbs: '48g',
      fat: '7g',
      fiber: '8g',
    },
    prepTime: '4 mins (No Cooking)',
    expiringIngredientsRescued: opt3Expiring.map((f) => ({
      name: f.name,
      daysLeft: calculateDaysLeft(f.expirationDate),
      amountToUse: '1 whole fruit + 150g yogurt/milk',
    })),
    allIngredients: [
      { name: fruit?.name || 'Ripe Banana', amount: '1 sliced', inPantry: !!fruit },
      { name: dairyOrEggs?.name || 'Greek Yogurt or Milk', amount: '150g (3/4 cup)', inPantry: !!dairyOrEggs },
      { name: breadOrGrain?.name || 'Rolled Oats', amount: '1/2 cup (45g)', inPantry: !!breadOrGrain },
      { name: 'Ground Cinnamon', amount: 'Dash', inPantry: true },
    ],
    healthBenefits: 'Prebiotic soluble fibers feed beneficial Bifidobacteria while potassium regulates electrolyte balance.',
    rotPreventionNote: 'Rescues ripe bananas and dairy approaching expiration without requiring heat or stove use.',
    dietaryTags: ['Heart Healthy', 'No Stove Required', 'High Fiber', 'Gut Health'],
  };

  return [opt1, opt2, opt3];
}

