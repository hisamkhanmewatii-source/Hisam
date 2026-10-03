import { FoodItem, RecipeItem } from '../types';
import { calculateDaysLeft } from './foodDatabase';

/**
 * Normalizes an ingredient name by removing measurements, adjectives, and plurals
 * to allow fuzzy matching with pantry items.
 */
export function normalizeIngredient(name: string): string {
  let clean = name.toLowerCase().trim();

  // Remove parenthetical details like "(60g)", "(plain)", "(1L)"
  clean = clean.replace(/\(.*?\)/g, '').trim();

  // Remove common preparation adjectives
  const adjectivesToRemove = [
    'fresh', 'ripe', 'baby', 'boneless', 'skinless', 'plain', 'sliced',
    'diced', 'chopped', 'minced', 'whole', 'organic', 'raw', 'cooked',
    'canned', 'frozen', 'warm', 'cold', 'large', 'small', 'medium',
    'extra virgin', 'dry', 'rolled', 'ground', 'crushed', 'coarse'
  ];

  for (const adj of adjectivesToRemove) {
    clean = clean.replace(new RegExp(`\\b${adj}\\b`, 'gi'), '').trim();
  }

  // Common singularizations / stem mapping
  clean = clean
    .replace(/\btomatoes\b/g, 'tomato')
    .replace(/\beggs\b/g, 'egg')
    .replace(/\bbananas\b/g, 'banana')
    .replace(/\bpotatoes\b/g, 'potato')
    .replace(/\bonions\b/g, 'onion')
    .replace(/\bcarrots\b/g, 'carrot')
    .replace(/\bapples\b/g, 'apple')
    .replace(/\bberries\b/g, 'berry')
    .replace(/\boats\b/g, 'oat')
    .replace(/\bbreasts\b/g, 'breast')
    .replace(/\s+/g, ' ')
    .trim();

  return clean;
}

/**
 * Check if a required recipe ingredient matches any available item in the user's pantry
 */
export function matchIngredientToPantry(
  ingredientName: string,
  inventory: FoodItem[]
): { inPantry: boolean; matchedItem?: FoodItem } {
  const normRequired = normalizeIngredient(ingredientName);
  const activeItems = inventory.filter((f) => !f.consumed);

  // Exact or stem match
  for (const item of activeItems) {
    const normItem = normalizeIngredient(item.name);
    
    // Direct inclusion
    if (normItem.includes(normRequired) || normRequired.includes(normItem)) {
      return { inPantry: true, matchedItem: item };
    }

    // Common culinary equivalence checks
    if (
      (normRequired.includes('spinach') && normItem.includes('spinach')) ||
      (normRequired.includes('milk') && normItem.includes('milk')) ||
      (normRequired.includes('egg') && normItem.includes('egg')) ||
      (normRequired.includes('chicken') && normItem.includes('chicken')) ||
      (normRequired.includes('tomato') && normItem.includes('tomato')) ||
      (normRequired.includes('bread') && (normItem.includes('bread') || normItem.includes('toast'))) ||
      (normRequired.includes('oat') && (normItem.includes('oat') || normItem.includes('oatmeal'))) ||
      (normRequired.includes('banana') && normItem.includes('banana')) ||
      (normRequired.includes('yogurt') && normItem.includes('yogurt')) ||
      (normRequired.includes('garlic') && normItem.includes('garlic')) ||
      (normRequired.includes('rice') && normItem.includes('rice')) ||
      (normRequired.includes('cheese') && normItem.includes('cheese')) ||
      ((normRequired.includes('oil') || normRequired.includes('butter')) &&
        (normItem.includes('oil') || normItem.includes('butter')))
    ) {
      return { inPantry: true, matchedItem: item };
    }
  }

  return { inPantry: false };
}

export interface ScoredRecipe extends RecipeItem {
  availableIngredientsCount: number;
  totalIngredientsCount: number;
  missingIngredientsCount: number;
  missingIngredients: Array<{ name: string; amount: string; substitute?: string }>;
  availableIngredients: Array<{ name: string; amount: string; pantryItemName: string; daysLeft: number }>;
  expiringRescuedCount: number;
  expiringRescuedItems: Array<{ name: string; daysLeft: number; cost?: number }>;
  estimatedDollarsSaved: number;
  isFullyCookable: boolean;
  isExpiringRescue: boolean;
  rankScore: number;
}

export interface RecipeFilterOptions {
  searchQuery?: string;
  dietFilter?: string;
  mealTypeFilter?: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
  availabilityFilter?: 'all' | 'can_make_now' | 'missing_one' | 'rescues_expiring';
  sortBy?: 'best_match' | 'zero_waste' | 'fastest' | 'high_protein' | 'low_calorie';
  selectedIngredient?: string;
}

export interface PantryInventoryAnalysis {
  totalItems: number;
  expiringItemsCount: number;
  expiringItems: Array<{ name: string; daysLeft: number; cost: number }>;
  fullyCookableRecipesCount: number;
  almostCookableRecipesCount: number;
  totalPossibleDollarSavings: number;
  stapleCategoriesAvailable: string[];
}

/**
 * Rich Curated Recipe Catalog with verified recipe links, video search URLs,
 * step-by-step guides, macro breakdowns, and smart ingredient substitutions.
 */
export const COMPREHENSIVE_RECIPE_CATALOG: RecipeItem[] = [
  {
    id: 'rec-1',
    title: 'Speedy Spinach, Tomato & Feta Skillet Omelette',
    description: 'A protein-packed, 10-minute skillet scramble engineered to rescue tender spinach and juicy tomatoes before wilting.',
    mealType: 'breakfast',
    prepTime: '4 mins',
    cookTime: '6 mins',
    servings: 1,
    difficulty: 'Easy',
    caloriesPerServing: 310,
    macros: { protein: '22g', carbs: '6g', fat: '21g', fiber: '3g' },
    expiringItemsUsed: ['Baby Spinach', 'Roma Tomatoes', 'Fresh Eggs'],
    ingredientsRequired: [
      { name: 'Fresh Eggs', amount: '2-3 large', inPantry: true, substitute: 'Egg whites or 100g firm tofu scramble' },
      { name: 'Baby Spinach', amount: '2 generous handfuls (60g)', inPantry: true, substitute: 'Kale, arugula, or Swiss chard' },
      { name: 'Roma Tomatoes', amount: '1 medium diced', inPantry: true, substitute: 'Cherry tomatoes or 2 tbsp salsa' },
      { name: 'Olive Oil or Butter', amount: '1 tsp', inPantry: true, substitute: 'Avocado oil, coconut oil, or cooking spray' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'Gently heat 1 tsp olive oil or butter in a medium non-stick skillet over medium heat.',
      'Add the diced tomato and baby spinach. Sauté for 60 seconds until spinach just begins to wilt down.',
      'In a bowl, whisk eggs with a pinch of salt and cracked black pepper until frothy.',
      'Pour whisked eggs evenly over the warm vegetables in the pan.',
      'Tilt skillet gently so uncooked egg flows to the edges. Cook for 2-3 minutes until set, fold gently in half, and slide onto your plate.'
    ],
    healthBenefits: 'Loaded with lutein for vision protection, choline for sharp cognitive memory, and bioavailable iron. Serves as a gentle buffer for morning medications.',
    rotPreventionTip: 'Spinach oxidizes and wilts quickly once opened; cooking it today seals in vitamin C and chlorophyll.',
    recipeUrl: 'https://www.myplate.gov/recipes/supplemental-nutrition-assistance-program-snap/spinach-and-tomato-omelet',
    sourceName: 'USDA MyPlate Kitchen',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=how+to+make+spinach+tomato+omelette',
    dietaryTags: ['High Protein', 'Gluten Free', 'Vegetarian', 'Diabetic Friendly', 'Quick Prep'],
  },
  {
    id: 'rec-2',
    title: 'Golden Pan-Seared Chicken Breast with Wilted Garlic Greens',
    description: 'Juicy, seared lean chicken breast paired with pan-wilted greens and golden toasted whole grain bread.',
    mealType: 'dinner',
    prepTime: '6 mins',
    cookTime: '12 mins',
    servings: 2,
    difficulty: 'Easy',
    caloriesPerServing: 385,
    macros: { protein: '42g', carbs: '22g', fat: '11g', fiber: '5g' },
    expiringItemsUsed: ['Boneless Chicken Breast', 'Baby Spinach', 'Whole Grain Sliced Bread'],
    ingredientsRequired: [
      { name: 'Boneless Chicken Breast', amount: '350g (sliced horizontally)', inPantry: true, substitute: 'Chicken thighs, turkey cutlets, or firm tofu' },
      { name: 'Baby Spinach', amount: '120g', inPantry: true, substitute: 'Mixed greens, kale, or bok choy' },
      { name: 'Whole Grain Sliced Bread', amount: '2 slices toasted', inPantry: true, substitute: 'Brown rice, quinoa, or whole wheat pita' },
      { name: 'Olive Oil or Butter', amount: '1 tbsp', inPantry: true, substitute: 'Vegetable oil or ghee' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'Pat chicken breast dry with a paper towel. Season both sides with salt, black pepper, garlic powder, and paprika.',
      'Heat 1/2 tbsp olive oil in a skillet over medium-high heat. Place chicken cutlets down and sear undisturbed for 4-5 minutes.',
      'Flip chicken and sear the second side for another 4 minutes until golden-brown and cooked through (internal temp 165°F / 74°C). Transfer to a plate to rest.',
      'Lower heat to medium, add remaining oil and baby spinach into the flavorful chicken drippings. Sauté for 90 seconds until tender.',
      'Toast whole grain bread and plate alongside the rested sliced chicken and warm greens.'
    ],
    healthBenefits: 'Ultra-lean complete protein accelerates muscle repair, promotes healthy metabolism, and maintains level blood sugar.',
    rotPreventionTip: 'Cooking fresh chicken immediately prevents costly bacterial spoilage and saves $8.00 in wasted groceries.',
    recipeUrl: 'https://www.bbcgoodfood.com/recipes/pan-fried-chicken-breast',
    sourceName: 'BBC Good Food',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=pan+seared+chicken+breast+with+spinach',
    dietaryTags: ['High Protein', 'Lean Meal', 'Zero Waste Hero', 'Heart Healthy'],
  },
  {
    id: 'rec-3',
    title: 'High-Protein Banana Cream Overnight Oats',
    description: 'Creamy, naturally sweet breakfast prepared in 3 minutes the night before using ripe bananas, milk, and Greek yogurt.',
    mealType: 'breakfast',
    prepTime: '3 mins',
    cookTime: '0 mins',
    servings: 1,
    difficulty: 'Easy',
    caloriesPerServing: 340,
    macros: { protein: '20g', carbs: '54g', fat: '6g', fiber: '8g' },
    expiringItemsUsed: ['Ripe Bananas', 'Fresh Whole Milk', 'Greek Yogurt (Plain)'],
    ingredientsRequired: [
      { name: 'Rolled Oats', amount: '1/2 cup (50g)', inPantry: true, substitute: 'Quick oats or steel-cut flakes' },
      { name: 'Fresh Whole Milk', amount: '1/2 cup (120ml)', inPantry: true, substitute: 'Almond milk, soy milk, or oat milk' },
      { name: 'Greek Yogurt (Plain)', amount: '1/3 cup (80g)', inPantry: true, substitute: 'Regular plain yogurt or cottage cheese' },
      { name: 'Ripe Bananas', amount: '1 banana mashed', inPantry: true, substitute: 'Applesauce, chopped berries, or canned peaches' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'In a wide-mouth jar or sealable cereal bowl, thoroughly mash the ripe banana with a fork until smooth.',
      'Pour in 1/2 cup rolled oats, 1/2 cup milk, and 1/3 cup Greek yogurt.',
      'Stir vigorously for 30 seconds until all oats are submerged and the yogurt is smoothly blended.',
      'Cover with lid and place in the refrigerator for at least 2 hours (or overnight).',
      'Stir once before eating in the morning. Optional: sprinkle with cinnamon or crushed walnuts.'
    ],
    healthBenefits: 'Packed with prebiotic beta-glucan soluble fiber that helps lower LDL cholesterol and stabilizes morning glycemic response.',
    rotPreventionTip: 'Overripe, spotty bananas possess maximum natural sweetness, eliminating the need for added refined sugars.',
    recipeUrl: 'https://www.eatingwell.com/recipe/267926/creamy-banana-overnight-oats/',
    sourceName: 'EatingWell Healthy Kitchen',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=banana+overnight+oats+greek+yogurt+recipe',
    dietaryTags: ['Heart Healthy', 'No Cook', 'High Fiber', 'Vegetarian', 'Quick Prep'],
  },
  {
    id: 'rec-4',
    title: 'Warm Cinnamon Honey Sliced Banana Toast',
    description: 'Crispy toasted whole grain bread topped with Greek yogurt, sliced banana, and a gentle dusting of cinnamon.',
    mealType: 'breakfast',
    prepTime: '3 mins',
    cookTime: '2 mins',
    servings: 1,
    difficulty: 'Easy',
    caloriesPerServing: 245,
    macros: { protein: '11g', carbs: '44g', fat: '4g', fiber: '6g' },
    expiringItemsUsed: ['Whole Grain Sliced Bread', 'Ripe Bananas', 'Greek Yogurt (Plain)'],
    ingredientsRequired: [
      { name: 'Whole Grain Sliced Bread', amount: '2 slices toasted', inPantry: true, substitute: 'Sourdough, rye, or English muffin' },
      { name: 'Greek Yogurt (Plain)', amount: '3 tbsp', inPantry: true, substitute: 'Peanut butter, ricotta, or cream cheese' },
      { name: 'Ripe Bananas', amount: '1 sliced', inPantry: true, substitute: 'Sliced apple or strawberries' },
      { name: 'Ground Cinnamon or Honey', amount: '1 pinch / 1 tsp', inPantry: true, substitute: 'Maple syrup or nutmeg' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'Toast 2 slices of whole grain bread until golden and sturdy.',
      'Spread 1.5 tablespoons of Greek yogurt generously across each warm toast slice.',
      'Arrange sliced bananas in an overlapping pattern over the yogurt layer.',
      'Dust lightly with ground cinnamon and optional drizzle of honey. Serve immediately while warm.'
    ],
    healthBenefits: 'High potassium content supports healthy fluid balance and arterial blood pressure in adults.',
    rotPreventionTip: 'Uses bakery bread before mold spores can emerge, preserving full grain texture.',
    recipeUrl: 'https://www.tasteofhome.com/recipes/banana-cinnamon-toast/',
    sourceName: 'Taste of Home',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=healthy+banana+toast+breakfast',
    dietaryTags: ['Vegetarian', 'Quick Prep', 'Heart Healthy', 'Low Fat'],
  },
  {
    id: 'rec-5',
    title: 'Mediterranean Sautéed Tomato & Egg Shakshuka Skillet',
    description: 'A comforting, one-skillet dish of poached eggs resting in gently simmering spiced tomatoes and wilted greens.',
    mealType: 'lunch',
    prepTime: '5 mins',
    cookTime: '10 mins',
    servings: 2,
    difficulty: 'Easy',
    caloriesPerServing: 260,
    macros: { protein: '16g', carbs: '14g', fat: '17g', fiber: '4g' },
    expiringItemsUsed: ['Roma Tomatoes', 'Baby Spinach', 'Fresh Eggs'],
    ingredientsRequired: [
      { name: 'Roma Tomatoes', amount: '3 ripe tomatoes diced', inPantry: true, substitute: '1 can (400g) crushed tomatoes' },
      { name: 'Fresh Eggs', amount: '3 whole eggs', inPantry: true, substitute: '2 eggs + 1/2 cup cooked chickpeas' },
      { name: 'Baby Spinach', amount: '1 cup packed', inPantry: true, substitute: 'Arugula or bell pepper strips' },
      { name: 'Olive Oil or Butter', amount: '1 tbsp', inPantry: true, substitute: 'Any cooking oil' },
      { name: 'Whole Grain Sliced Bread', amount: '2 slices for dipping', inPantry: true, substitute: 'Pita bread or brown rice' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'Heat olive oil in a medium skillet over medium heat. Add diced tomatoes with a pinch of cumin, salt, and black pepper.',
      'Simmer the tomatoes for 4-5 minutes, crushing with the back of a spoon until a rich sauce forms.',
      'Stir in baby spinach until just wilted into the tomato base.',
      'Create 3 shallow wells in the sauce with your spoon and gently crack an egg into each well.',
      'Cover skillet with a lid and cook on low for 4-5 minutes until egg whites are set and yolks remain soft.',
      'Garnish with pepper and serve warm directly from the pan with toasted bread slices.'
    ],
    healthBenefits: 'Cooking tomatoes releases high levels of lycopene, a potent antioxidant that supports cardiovascular health.',
    rotPreventionTip: 'Soft or slightly wrinkling tomatoes make the sweetest, most flavorful skillet sauces.',
    recipeUrl: 'https://cooking.nytimes.com/recipes/1014721-shakshuka-with-feta',
    sourceName: 'NYT Cooking & Mediterranean Table',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=quick+easy+shakshuka+recipe',
    dietaryTags: ['Vegetarian', 'Diabetic Friendly', 'High Protein', 'Heart Healthy'],
  },
  {
    id: 'rec-6',
    title: 'Energizing Green Banana-Spinach Protein Smoothie',
    description: 'Refreshing, nutrient-dense blended smoothie combining leafy spinach, sweet banana, chilled milk, and yogurt.',
    mealType: 'snack',
    prepTime: '3 mins',
    cookTime: '0 mins',
    servings: 1,
    difficulty: 'Easy',
    caloriesPerServing: 230,
    macros: { protein: '14g', carbs: '38g', fat: '4g', fiber: '5g' },
    expiringItemsUsed: ['Baby Spinach', 'Ripe Bananas', 'Fresh Whole Milk', 'Greek Yogurt (Plain)'],
    ingredientsRequired: [
      { name: 'Baby Spinach', amount: '2 handfuls (50g)', inPantry: true, substitute: 'Frozen spinach or kale' },
      { name: 'Ripe Bananas', amount: '1 fresh or frozen', inPantry: true, substitute: 'Mango chunks or apple slices' },
      { name: 'Fresh Whole Milk', amount: '3/4 cup (180ml)', inPantry: true, substitute: 'Soy, almond, or oat milk' },
      { name: 'Greek Yogurt (Plain)', amount: '1/3 cup (80g)', inPantry: true, substitute: 'Protein powder or silken tofu' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'Add milk and Greek yogurt first into the blender pitcher so the blades spin smoothly.',
      'Toss in 2 handfuls of baby spinach leaves and the broken banana pieces.',
      'Blend on high for 45 to 60 seconds until completely silky and vivid green.',
      'Pour into a chilled glass and drink immediately for maximum cellular nutrient absorption.'
    ],
    healthBenefits: 'Delivers raw chlorophyll, magnesium, vitamins A and K, and natural electrolyte hydration without artificial flavorings.',
    rotPreventionTip: 'Instantly rescues spinach leaves that are starting to lose crispness before spoilage sets in.',
    recipeUrl: 'https://www.simplegreensmoothies.com/spinach-banana-smoothie',
    sourceName: 'Simple Green Smoothies',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=spinach+banana+smoothie+recipe',
    dietaryTags: ['Vegetarian', 'Gluten Free', 'No Cook', 'Quick Prep', 'High Fiber'],
  },
  {
    id: 'rec-7',
    title: 'Rustic Sautéed Chicken, Tomato & Oat Porridge Bowl',
    description: 'Savory oat porridge cooked in broth, topped with seared chicken strips and stewed tomatoes.',
    mealType: 'lunch',
    prepTime: '6 mins',
    cookTime: '10 mins',
    servings: 2,
    difficulty: 'Medium',
    caloriesPerServing: 350,
    macros: { protein: '34g', carbs: '36g', fat: '9g', fiber: '6g' },
    expiringItemsUsed: ['Boneless Chicken Breast', 'Roma Tomatoes', 'Rolled Oats'],
    ingredientsRequired: [
      { name: 'Boneless Chicken Breast', amount: '250g sliced', inPantry: true, substitute: 'Eggs or leftover rotisserie chicken' },
      { name: 'Rolled Oats', amount: '1 cup (90g)', inPantry: true, substitute: 'Quick oats, quinoa, or rice' },
      { name: 'Roma Tomatoes', amount: '2 diced', inPantry: true, substitute: '1 cup canned diced tomatoes' },
      { name: 'Water or Broth', amount: '2 cups', inPantry: true, substitute: 'Vegetable broth or chicken bouillon' },
      { name: 'Olive Oil or Butter', amount: '1 tsp', inPantry: true, substitute: 'Any cooking oil' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'In a saucepan, bring 2 cups of water or broth to a boil. Stir in 1 cup rolled oats and a pinch of salt. Reduce heat and simmer 4-5 minutes until thick and creamy.',
      'Meanwhile, heat 1 tsp oil in a skillet. Sear chicken strips with diced tomato and black pepper for 5-6 minutes until golden and thoroughly cooked.',
      'Spoon savory warm oats into bowls.',
      'Top with the seared chicken and juicy pan-stewed tomatoes.'
    ],
    healthBenefits: 'Savory oats offer a low-glycemic, deeply satiating meal that slows carbohydrate absorption and prevents energy dips.',
    rotPreventionTip: 'Cooks raw poultry and fresh vegetables into a comforting single-skillet pantry meal.',
    recipeUrl: 'https://www.thekitchn.com/savory-oatmeal-recipes-263884',
    sourceName: 'The Kitchn Savory Grain Guides',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=savory+oatmeal+with+chicken',
    dietaryTags: ['High Protein', 'Heart Healthy', 'Low Sugar', 'Zero Waste Hero'],
  },
  {
    id: 'rec-8',
    title: 'Classic Fluffy Scrambled Eggs with Buttered Toast',
    description: 'Silky, soft-curd scrambled eggs made with a splash of fresh milk, served alongside golden whole wheat toast.',
    mealType: 'breakfast',
    prepTime: '2 mins',
    cookTime: '4 mins',
    servings: 1,
    difficulty: 'Easy',
    caloriesPerServing: 280,
    macros: { protein: '18g', carbs: '18g', fat: '16g', fiber: '3g' },
    expiringItemsUsed: ['Fresh Eggs', 'Fresh Whole Milk', 'Whole Grain Sliced Bread'],
    ingredientsRequired: [
      { name: 'Fresh Eggs', amount: '2-3 eggs', inPantry: true, substitute: 'Egg whites or silken tofu' },
      { name: 'Fresh Whole Milk', amount: '2 tbsp', inPantry: true, substitute: 'Water or heavy cream' },
      { name: 'Whole Grain Sliced Bread', amount: '1-2 slices', inPantry: true, substitute: 'Gluten-free bread or bagel' },
      { name: 'Olive Oil or Butter', amount: '1 tsp', inPantry: true, substitute: 'Cooking spray' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'Crack eggs into a bowl, add 2 tablespoons of milk and a pinch of salt. Whisk vigorously for 30 seconds until uniform in color.',
      'Melt butter or warm oil in a non-stick pan over gentle low-medium heat.',
      'Pour egg mixture in. Let sit 15 seconds, then draw a rubber spatula across bottom to form soft, velvety curds.',
      'Remove from heat while eggs are still slightly glossy (they finish cooking from residual heat).',
      'Serve alongside warm whole grain toast.'
    ],
    healthBenefits: 'Simple, bioavailable amino acids with high biological value. Ideal for elderly individuals requiring easy-to-chew protein.',
    rotPreventionTip: 'Consumes milk carton dregs before expiry and rotates fresh dairy.',
    recipeUrl: 'https://www.seriouseats.com/fluffy-scrambled-eggs-recipe',
    sourceName: 'Serious Eats Culinary Guide',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=how+to+make+perfect+scrambled+eggs',
    dietaryTags: ['High Protein', 'Vegetarian', 'Quick Prep', 'Diabetic Friendly'],
  },
  {
    id: 'rec-9',
    title: 'Diabetic-Friendly Garden Veggie & Herb Frittata',
    description: 'Oven or stovetop baked egg frittata packed with sautéed spinach, diced tomatoes, and cracked black pepper.',
    mealType: 'lunch',
    prepTime: '6 mins',
    cookTime: '12 mins',
    servings: 3,
    difficulty: 'Easy',
    caloriesPerServing: 210,
    macros: { protein: '16g', carbs: '4g', fat: '14g', fiber: '2g' },
    expiringItemsUsed: ['Fresh Eggs', 'Baby Spinach', 'Roma Tomatoes'],
    ingredientsRequired: [
      { name: 'Fresh Eggs', amount: '5 large eggs', inPantry: true, substitute: '4 whole eggs + 2 egg whites' },
      { name: 'Baby Spinach', amount: '2 cups chopped', inPantry: true, substitute: 'Kale, chard, or shredded zucchini' },
      { name: 'Roma Tomatoes', amount: '2 diced', inPantry: true, substitute: 'Roasted peppers or sun-dried tomatoes' },
      { name: 'Fresh Whole Milk', amount: '3 tbsp', inPantry: true, substitute: 'Water or Greek yogurt' },
      { name: 'Olive Oil or Butter', amount: '1 tbsp', inPantry: true, substitute: 'Avocado oil' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'In a large bowl, whisk eggs with milk, salt, oregano, and black pepper until light and airy.',
      'In an oven-safe 10-inch skillet, heat olive oil over medium. Sauté diced tomatoes and spinach for 2 minutes until wilted.',
      'Pour the whisked egg mixture evenly over the vegetables.',
      'Cook over low heat for 5 minutes until edges begin to set, then transfer to a 375°F (190°C) oven or cover skillet with a lid for 6-8 minutes until puffed and golden in center.',
      'Slice into wedges and serve hot, warm, or chilled for meal-prep.'
    ],
    healthBenefits: 'Ultra-low glycemic impact (less than 4g carbs) prevents blood glucose spikes. Excellent for diabetic dietary regimens.',
    rotPreventionTip: 'Bakes multiple aging produce items simultaneously into 3-4 ready-to-eat balanced meals.',
    recipeUrl: 'https://www.diabetesfoodhub.org/recipes/easy-vegetable-frittata.html',
    sourceName: 'American Diabetes Association Hub',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=vegetable+frittata+diabetic+friendly',
    dietaryTags: ['Diabetic Friendly', 'Low Carb', 'Gluten Free', 'High Protein', 'Vegetarian'],
  },
  {
    id: 'rec-10',
    title: 'Creamy Greek Yogurt & Banana Fruit Parfait',
    description: 'Layered parfait of rich Greek yogurt, naturally sweet banana slices, and a dusting of rolled oats.',
    mealType: 'snack',
    prepTime: '3 mins',
    cookTime: '0 mins',
    servings: 1,
    difficulty: 'Easy',
    caloriesPerServing: 220,
    macros: { protein: '17g', carbs: '32g', fat: '3g', fiber: '4g' },
    expiringItemsUsed: ['Greek Yogurt (Plain)', 'Ripe Bananas', 'Rolled Oats'],
    ingredientsRequired: [
      { name: 'Greek Yogurt (Plain)', amount: '3/4 cup (170g)', inPantry: true, substitute: 'Skyr, cottage cheese, or coconut yogurt' },
      { name: 'Ripe Bananas', amount: '1 sliced', inPantry: true, substitute: 'Berries, sliced peach, or raisins' },
      { name: 'Rolled Oats', amount: '2 tbsp (toasted or raw)', inPantry: true, substitute: 'Granola or crushed walnuts' },
      { name: 'Honey or Cinnamon', amount: '1/2 tsp', inPantry: true, substitute: 'Pure vanilla extract' },
    ],
    pantryCoveragePercent: 100,
    instructions: [
      'In a tall glass or bowl, spoon half of the Greek yogurt as a base layer.',
      'Add a layer of sliced ripe bananas.',
      'Spoon remaining Greek yogurt over top.',
      'Garnish with 2 tablespoons of rolled oats and a gentle sprinkle of cinnamon or drizzle of honey.',
      'Enjoy immediately as a protein-rich midday snack or light breakfast.'
    ],
    healthBenefits: 'Live active probiotic cultures nurture digestive gut microbiome, enhancing nutrient absorption and bowel regularity.',
    rotPreventionTip: 'Smooths out yogurt before shelf-date expires, eliminating yogurt container waste.',
    recipeUrl: 'https://www.eatright.org/food/planning/smart-snacking/yogurt-fruit-parfait',
    sourceName: 'Academy of Nutrition & Dietetics',
    videoSearchUrl: 'https://www.youtube.com/results?search_query=healthy+greek+yogurt+parfait+recipe',
    dietaryTags: ['Vegetarian', 'High Protein', 'No Cook', 'Quick Prep', 'Gut Health'],
  }
];

/**
 * Analyzes pantry inventory and computes full stats, expiring alerts,
 * and counts of cookable recipes.
 */
export function analyzePantryInventory(
  inventory: FoodItem[],
  recipeCatalog: RecipeItem[] = COMPREHENSIVE_RECIPE_CATALOG
): PantryInventoryAnalysis {
  const activeItems = inventory.filter((f) => !f.consumed);

  const expiringItems = activeItems
    .filter((f) => calculateDaysLeft(f.expirationDate) <= 2)
    .map((f) => ({
      name: f.name,
      daysLeft: calculateDaysLeft(f.expirationDate),
      cost: f.estimatedCost || 3.5,
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const totalPossibleDollarSavings = expiringItems.reduce((acc, curr) => acc + curr.cost, 0);

  // Evaluate recipes against inventory
  let fullyCookableRecipesCount = 0;
  let almostCookableRecipesCount = 0;

  for (const recipe of recipeCatalog) {
    let availableCount = 0;
    for (const req of recipe.ingredientsRequired) {
      const match = matchIngredientToPantry(req.name, inventory);
      if (match.inPantry) availableCount++;
    }
    const missing = recipe.ingredientsRequired.length - availableCount;
    if (missing === 0) {
      fullyCookableRecipesCount++;
    } else if (missing === 1) {
      almostCookableRecipesCount++;
    }
  }

  const stapleCategoriesAvailable = Array.from(
    new Set(activeItems.map((i) => i.category))
  );

  return {
    totalItems: activeItems.length,
    expiringItemsCount: expiringItems.length,
    expiringItems,
    fullyCookableRecipesCount,
    almostCookableRecipesCount,
    totalPossibleDollarSavings,
    stapleCategoriesAvailable,
  };
}

/**
 * Core Recommendation Engine:
 * Scores, ranks, and filters recipes based on actual pantry inventory,
 * prioritising zero-waste perishables rescue and 100% available ingredients.
 */
export function scoreAndRankRecipes(
  inventory: FoodItem[],
  recipeCatalog: RecipeItem[] = COMPREHENSIVE_RECIPE_CATALOG,
  options: RecipeFilterOptions = {}
): ScoredRecipe[] {
  const {
    searchQuery = '',
    dietFilter = 'all',
    mealTypeFilter = 'all',
    availabilityFilter = 'all',
    sortBy = 'best_match',
    selectedIngredient = '',
  } = options;

  const activeItems = inventory.filter((f) => !f.consumed);

  const scored: ScoredRecipe[] = recipeCatalog.map((rec) => {
    const totalIngredients = rec.ingredientsRequired.length;
    let availableCount = 0;
    const missingList: ScoredRecipe['missingIngredients'] = [];
    const availableList: ScoredRecipe['availableIngredients'] = [];
    const expiringRescuedItems: ScoredRecipe['expiringRescuedItems'] = [];

    const updatedIngredientsRequired = rec.ingredientsRequired.map((req) => {
      const { inPantry, matchedItem } = matchIngredientToPantry(req.name, inventory);

      if (inPantry && matchedItem) {
        availableCount++;
        const daysLeft = calculateDaysLeft(matchedItem.expirationDate);
        availableList.push({
          name: req.name,
          amount: req.amount,
          pantryItemName: matchedItem.name,
          daysLeft,
        });

        // Check if this pantry item is expiring urgently (within 2 days)
        if (daysLeft <= 2) {
          expiringRescuedItems.push({
            name: matchedItem.name,
            daysLeft,
            cost: matchedItem.estimatedCost || 3.0,
          });
        }

        return { ...req, inPantry: true };
      } else {
        missingList.push({
          name: req.name,
          amount: req.amount,
          substitute: req.substitute,
        });
        return { ...req, inPantry: false };
      }
    });

    const missingCount = totalIngredients - availableCount;
    const dynamicCoveragePercent = totalIngredients > 0
      ? Math.round((availableCount / totalIngredients) * 100)
      : 100;

    // Calculate dollar savings
    const estimatedDollarsSaved = expiringRescuedItems.reduce(
      (sum, item) => sum + (item.cost || 3.0),
      0
    );

    // Compute composite rank score:
    // Base score = Coverage % (0-100)
    // Bonus: +25 if 100% cookable now
    // Bonus: +15 per expiring ingredient rescued (urgency incentive!)
    // Bonus: +5 for easy difficulty
    let rankScore = dynamicCoveragePercent;
    if (missingCount === 0) rankScore += 25;
    rankScore += expiringRescuedItems.length * 15;
    if (rec.difficulty === 'Easy') rankScore += 5;

    return {
      ...rec,
      ingredientsRequired: updatedIngredientsRequired,
      pantryCoveragePercent: dynamicCoveragePercent,
      availableIngredientsCount: availableCount,
      totalIngredientsCount: totalIngredients,
      missingIngredientsCount: missingCount,
      missingIngredients: missingList,
      availableIngredients: availableList,
      expiringRescuedCount: expiringRescuedItems.length,
      expiringRescuedItems,
      estimatedDollarsSaved,
      isFullyCookable: missingCount === 0,
      isExpiringRescue: expiringRescuedItems.length > 0,
      rankScore,
    };
  });

  // Apply filters
  const filtered = scored.filter((rec) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rec.title.toLowerCase().includes(q);
      const matchDesc = rec.description.toLowerCase().includes(q);
      const matchIng = rec.ingredientsRequired.some((i) => i.name.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchIng) return false;
    }

    // Specific ingredient filter (e.g. clicked from a food card)
    if (selectedIngredient.trim()) {
      const q = selectedIngredient.toLowerCase();
      const matchIng = rec.ingredientsRequired.some((i) =>
        i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase())
      );
      const matchRescue = rec.expiringRescuedItems.some((i) =>
        i.name.toLowerCase().includes(q) || q.includes(i.name.toLowerCase())
      );
      if (!matchIng && !matchRescue) return false;
    }

    // Meal type filter
    if (mealTypeFilter !== 'all' && rec.mealType) {
      if (rec.mealType !== mealTypeFilter) return false;
    }

    // Dietary filter
    if (dietFilter !== 'all') {
      if (!rec.dietaryTags?.includes(dietFilter)) return false;
    }

    // Availability filter
    if (availabilityFilter === 'can_make_now' && !rec.isFullyCookable) {
      return false;
    }
    if (availabilityFilter === 'missing_one' && rec.missingIngredientsCount > 1) {
      return false;
    }
    if (availabilityFilter === 'rescues_expiring' && !rec.isExpiringRescue) {
      return false;
    }

    return true;
  });

  // Sort recipes
  filtered.sort((a, b) => {
    if (sortBy === 'best_match') {
      // First prioritize highest rankScore (coverage + expiring bonus)
      return b.rankScore - a.rankScore;
    }
    if (sortBy === 'zero_waste') {
      // Most expiring ingredients rescued first
      if (b.expiringRescuedCount !== a.expiringRescuedCount) {
        return b.expiringRescuedCount - a.expiringRescuedCount;
      }
      return b.pantryCoveragePercent - a.pantryCoveragePercent;
    }
    if (sortBy === 'fastest') {
      const parseTime = (str: string) => {
        const m = str.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 15;
      };
      const totalTimeA = parseTime(a.prepTime) + parseTime(a.cookTime);
      const totalTimeB = parseTime(b.prepTime) + parseTime(b.cookTime);
      return totalTimeA - totalTimeB;
    }
    if (sortBy === 'high_protein') {
      const parseGram = (str: string) => parseInt(str.replace(/\D/g, ''), 10) || 0;
      return parseGram(b.macros.protein) - parseGram(a.macros.protein);
    }
    if (sortBy === 'low_calorie') {
      return a.caloriesPerServing - b.caloriesPerServing;
    }
    return b.rankScore - a.rankScore;
  });

  return filtered;
}
