import { FoodCategory, StorageLocation, FreshnessStatus } from '../types';

export interface FoodProfile {
  name: string;
  category: FoodCategory;
  defaultLocation: StorageLocation;
  shelfLifeDays: {
    fridge?: number;
    pantry?: number;
    freezer?: number;
  };
  rotPreventionTip: string;
  signsOfSpoilage: string;
  canFreeze: boolean;
  glycemicIndex?: 'low' | 'medium' | 'high';
  isDiabeticFriendly?: boolean;
}

export const FOOD_DATABASE: Record<string, FoodProfile> = {
  // Produce / Veggies
  spinach: {
    name: 'Baby Spinach',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 5, freezer: 90 },
    rotPreventionTip: 'Place a dry paper towel in the container to absorb moisture and keep crisp.',
    signsOfSpoilage: 'Dark slimy leaves, wilting, pungent odor.',
    canFreeze: true,
  },
  lettuce: {
    name: 'Lettuce / Salad Greens',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 6 },
    rotPreventionTip: 'Store loosely in a ventilated bag with paper towel; avoid cold spots at the back of fridge.',
    signsOfSpoilage: 'Browning, soggy texture, sour smell.',
    canFreeze: false,
  },
  tomatoes: {
    name: 'Tomatoes',
    category: 'produce',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 6, fridge: 10 },
    rotPreventionTip: 'Store stem-side down at room temperature to preserve rich flavor and prevent shriveling.',
    signsOfSpoilage: 'Wrinkled skin, very soft spots, mold around stem.',
    canFreeze: true,
  },
  bananas: {
    name: 'Bananas',
    category: 'produce',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 5, freezer: 60 },
    rotPreventionTip: 'Wrap stems in foil or plastic wrap to reduce ethylene gas emission. Keep away from other fruits.',
    signsOfSpoilage: 'Liquid leaking, fruit flies, foul smell, black mushy flesh.',
    canFreeze: true,
  },
  berries: {
    name: 'Strawberries / Berries',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 4, freezer: 180 },
    rotPreventionTip: 'Do not wash until immediately before eating. Give quick vinegar rinse if storing longer.',
    signsOfSpoilage: 'White fuzzy mold, leaking juice, soft mush.',
    canFreeze: true,
  },
  avocado: {
    name: 'Avocado',
    category: 'produce',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 4, fridge: 7, freezer: 60 },
    rotPreventionTip: 'Keep on counter until ripe, then refrigerate to halt ripening. Squeeze lemon on cut halves.',
    signsOfSpoilage: 'Stringy black flesh throughout, rancid oil odor.',
    canFreeze: true,
  },
  broccoli: {
    name: 'Broccoli',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 6, freezer: 120 },
    rotPreventionTip: 'Keep stem in a small glass of water in fridge like flowers, or wrap loosely in perforated bag.',
    signsOfSpoilage: 'Yellowing florets, rubbery stem, strong sulfur smell.',
    canFreeze: true,
  },
  mushrooms: {
    name: 'Mushrooms',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 5 },
    rotPreventionTip: 'Store in a brown paper bag so they can breathe without getting slimy.',
    signsOfSpoilage: 'Slimy coating, dark discoloration, fishy smell.',
    canFreeze: false,
  },
  carrots: {
    name: 'Carrots',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 21, freezer: 180 },
    rotPreventionTip: 'Cut off green tops immediately as they draw out moisture. Store submerged in water for crunch.',
    signsOfSpoilage: 'Bendy rubber texture, white discoloration, foul odor.',
    canFreeze: true,
  },
  cucumber: {
    name: 'Cucumber',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 7 },
    rotPreventionTip: 'Store in crisper drawer away from ethylene-emitting apples and bananas.',
    signsOfSpoilage: 'Sunken soft spots, leaking fluid, translucent slime.',
    canFreeze: false,
  },
  apples: {
    name: 'Apples',
    category: 'produce',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 28, pantry: 10 },
    rotPreventionTip: 'Refrigerate crisply. One bad apple emits high ethylene, so isolate any bruised fruit!',
    signsOfSpoilage: 'Brown spongy bruises, alcohol smell.',
    canFreeze: true,
  },

  // Dairy
  milk: {
    name: 'Fresh Whole Milk / Skim Milk',
    category: 'dairy',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 7, freezer: 60 },
    rotPreventionTip: 'Store in middle fridge shelf, not on door where temperatures fluctuate every time opened.',
    signsOfSpoilage: 'Sour sour smell, curdling, lumpy texture.',
    canFreeze: true,
  },
  yogurt: {
    name: 'Greek Yogurt / Plain Yogurt',
    category: 'dairy',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 14 },
    rotPreventionTip: 'Smooth the surface flat before sealing with lid to reduce surface area exposed to oxygen.',
    signsOfSpoilage: 'Pink or green mold dots, pungent acidic smell, whey separation with bubbly film.',
    canFreeze: false,
  },
  cheese: {
    name: 'Cheddar / Mozzarella Cheese',
    category: 'dairy',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 21, freezer: 120 },
    rotPreventionTip: 'Wrap in parchment paper then loose plastic wrap so cheese breathes without drying out.',
    signsOfSpoilage: 'Visible white/green fuzz (except blue cheese), ammonia smell.',
    canFreeze: true,
  },
  eggs: {
    name: 'Fresh Eggs',
    category: 'dairy',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 28 },
    rotPreventionTip: 'Keep in original carton on a middle shelf. Test freshness: fresh eggs sink in a bowl of water.',
    signsOfSpoilage: 'Floats to top of water bowl, rotten sulfur smell when cracked.',
    canFreeze: false,
  },
  butter: {
    name: 'Butter',
    category: 'dairy',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 45, freezer: 240 },
    rotPreventionTip: 'Keep sealed in butter compartment or freeze sticks for up to 9 months.',
    signsOfSpoilage: 'Translucent darker crust, sour or rancid taste.',
    canFreeze: true,
  },

  // Meat & Seafood
  chicken: {
    name: 'Chicken Breast / Poultry',
    category: 'meat',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 2, freezer: 180 },
    rotPreventionTip: 'Keep on the bottom shelf on a plate so drips never touch other foods. Freeze if not cooked in 48h.',
    signsOfSpoilage: 'Grey or greenish hue, slimy film, strong sweet/sulfuric odor.',
    canFreeze: true,
  },
  beef: {
    name: 'Ground Beef / Steak',
    category: 'meat',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 3, freezer: 180 },
    rotPreventionTip: 'Press air out of packaging; brown inside can be oxygen loss, but check odor and texture.',
    signsOfSpoilage: 'Sticky or tacky surface, sour pungent odor.',
    canFreeze: true,
  },
  salmon: {
    name: 'Fresh Salmon / Fish Fillet',
    category: 'seafood',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 2, freezer: 90 },
    rotPreventionTip: 'Place on a bed of crushed ice inside a container in the coldest part of your fridge.',
    signsOfSpoilage: 'Overly fishy or ammonia stench, dull grayish appearance, mushy flesh.',
    canFreeze: true,
  },
  shrimp: {
    name: 'Raw Shrimp',
    category: 'seafood',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 2, freezer: 120 },
    rotPreventionTip: 'Cook within 24-48 hours of thawing. Keep chilled at all times.',
    signsOfSpoilage: 'Ammonia smell, slimy black spots on shell.',
    canFreeze: true,
  },

  // Bakery
  bread: {
    name: 'Whole Grain Bread / Loaf',
    category: 'bakery',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 5, freezer: 90, fridge: 10 },
    rotPreventionTip: 'Never store in fridge (accelerates staling). Freeze pre-sliced bread and toast directly!',
    signsOfSpoilage: 'Blue, green or white mold spores, musty yeast smell.',
    canFreeze: true,
  },
  tortillas: {
    name: 'Tortillas / Wraps',
    category: 'bakery',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 10, fridge: 21, freezer: 120 },
    rotPreventionTip: 'Refrigerate once opened to avoid condensation moisture that breeds mold.',
    signsOfSpoilage: 'Dark mold spots, stiff or damp sour smell.',
    canFreeze: true,
  },

  // Pantry & Grains
  rice: {
    name: 'Brown Rice / White Rice',
    category: 'pantry',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 180 },
    rotPreventionTip: 'Store in an airtight container with a bay leaf to deter pantry weevils.',
    signsOfSpoilage: 'Rancid oily smell (especially brown rice), webbing or insect larvae.',
    canFreeze: false,
  },
  oats: {
    name: 'Rolled Oats / Oatmeal',
    category: 'pantry',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 240 },
    rotPreventionTip: 'Keep tightly sealed away from heat, steam, and direct sunlight.',
    signsOfSpoilage: 'Stale odor, clumping from dampness, bugs.',
    canFreeze: false,
  },
  pasta: {
    name: 'Pasta',
    category: 'pantry',
    defaultLocation: 'pantry',
    shelfLifeDays: { pantry: 365 },
    rotPreventionTip: 'Store in moisture-proof container.',
    signsOfSpoilage: 'Discoloration, pest infestation.',
    canFreeze: false,
  },
  tofu: {
    name: 'Firm Tofu',
    category: 'pantry',
    defaultLocation: 'fridge',
    shelfLifeDays: { fridge: 7, freezer: 90 },
    rotPreventionTip: 'After opening, submerge unused tofu in clean water and change water daily.',
    signsOfSpoilage: 'Bloated pack, sour smell, curdled slimy water.',
    canFreeze: true,
  },
};

export function autoDetectFood(inputName: string): {
  category: FoodCategory;
  location: StorageLocation;
  shelfLifeDays: number;
  rotPreventionTip: string;
  canFreeze: boolean;
  glycemicIndex: 'low' | 'medium' | 'high';
  isDiabeticFriendly: boolean;
} {
  const clean = inputName.trim().toLowerCase();
  
  // Direct match or partial match in database
  for (const [key, profile] of Object.entries(FOOD_DATABASE)) {
    if (clean.includes(key) || profile.name.toLowerCase().includes(clean)) {
      const location = profile.defaultLocation;
      const days = profile.shelfLifeDays[location] || profile.shelfLifeDays.fridge || 7;
      const isHighSugar = /(soda|candy|cookie|cake|sugar|juice|sweet)/i.test(clean);
      const isLowGI = /(spinach|egg|chicken|salmon|tofu|lettuce|broccoli|cucumber|mushroom|yogurt|avocado)/i.test(clean);
      return {
        category: profile.category,
        location,
        shelfLifeDays: days,
        rotPreventionTip: profile.rotPreventionTip,
        canFreeze: profile.canFreeze,
        glycemicIndex: isHighSugar ? 'high' : isLowGI ? 'low' : 'medium',
        isDiabeticFriendly: !isHighSugar,
      };
    }
  }

  // Keyword heuristic matching
  if (/(milk|yogurt|cheese|cream|butter|curd|kefir)/i.test(clean)) {
    return {
      category: 'dairy',
      location: 'fridge',
      shelfLifeDays: 7,
      rotPreventionTip: 'Store in the main body of the fridge away from temperature swings.',
      canFreeze: true,
      glycemicIndex: 'low',
      isDiabeticFriendly: true,
    };
  }
  if (/(apple|banana|berry|orange|lemon|grape|mango|peach|fruit|melon)/i.test(clean)) {
    const isBerriesOrApple = /(berry|berries|apple)/i.test(clean);
    return {
      category: 'produce',
      location: clean.includes('apple') ? 'fridge' : 'pantry',
      shelfLifeDays: 7,
      rotPreventionTip: 'Inspect regularly and isolate bruised fruits to prevent ethylene rot acceleration.',
      canFreeze: true,
      glycemicIndex: isBerriesOrApple ? 'low' : 'medium',
      isDiabeticFriendly: true,
    };
  }
  if (/(spinach|kale|salad|lettuce|onion|garlic|potato|carrot|tomato|pepper|broccoli|celery|veg)/i.test(clean)) {
    const isRoot = /(potato|onion|garlic)/i.test(clean);
    return {
      category: 'produce',
      location: isRoot ? 'pantry' : 'fridge',
      shelfLifeDays: isRoot ? 21 : 6,
      rotPreventionTip: isRoot
        ? 'Keep in a cool, dry, dark pantry. Do not store onions and potatoes together!'
        : 'Line container with paper towels to absorb excess moisture that causes rot.',
      canFreeze: !isRoot,
      glycemicIndex: clean.includes('potato') ? 'medium' : 'low',
      isDiabeticFriendly: true,
    };
  }
  if (/(chicken|beef|pork|turkey|steak|meat|bacon|sausage|lamb)/i.test(clean)) {
    return {
      category: 'meat',
      location: 'fridge',
      shelfLifeDays: 3,
      rotPreventionTip: 'Keep in the coldest spot on bottom fridge shelf. Freeze immediately if not cooking within 48h.',
      canFreeze: true,
      glycemicIndex: 'low',
      isDiabeticFriendly: true,
    };
  }
  if (/(fish|salmon|tuna|shrimp|prawn|crab|seafood|cod)/i.test(clean)) {
    return {
      category: 'seafood',
      location: 'fridge',
      shelfLifeDays: 2,
      rotPreventionTip: 'Keep on ice or cook immediately. Seafood spoils faster than any other protein.',
      canFreeze: true,
      glycemicIndex: 'low',
      isDiabeticFriendly: true,
    };
  }
  if (/(bread|bagel|bun|croissant|muffin|pita|tortilla)/i.test(clean)) {
    const isWholeGrain = /(whole|grain|seeded|rye)/i.test(clean);
    return {
      category: 'bakery',
      location: 'pantry',
      shelfLifeDays: 5,
      rotPreventionTip: 'Freeze slices to preserve freshness for months without staling in the fridge.',
      canFreeze: true,
      glycemicIndex: isWholeGrain ? 'medium' : 'high',
      isDiabeticFriendly: isWholeGrain,
    };
  }
  if (/(rice|pasta|grain|quinoa|lentil|beans|flour|cereal|oat)/i.test(clean)) {
    return {
      category: 'pantry',
      location: 'pantry',
      shelfLifeDays: 180,
      rotPreventionTip: 'Seal in airtight glass or BPA-free plastic jars to keep out moisture and insects.',
      canFreeze: false,
      glycemicIndex: 'medium',
      isDiabeticFriendly: true,
    };
  }
  if (/(juice|soda|tea|coffee|water|smoothie|kombucha)/i.test(clean)) {
    const isSweetDrink = /(juice|soda|sweet)/i.test(clean);
    return {
      category: 'beverages',
      location: 'fridge',
      shelfLifeDays: 10,
      rotPreventionTip: 'Keep cap tightly sealed and refrigerate once opened.',
      canFreeze: false,
      glycemicIndex: isSweetDrink ? 'high' : 'low',
      isDiabeticFriendly: !isSweetDrink,
    };
  }
  if (/(sauce|ketchup|mustard|mayo|dressing|soy|oil|vinegar)/i.test(clean)) {
    return {
      category: 'condiments',
      location: 'fridge',
      shelfLifeDays: 60,
      rotPreventionTip: 'Wipe rim clean before closing to prevent bacterial growth on the neck.',
      canFreeze: false,
      glycemicIndex: 'low',
      isDiabeticFriendly: true,
    };
  }
  if (/(chip|nut|snack|cracker|chocolate|cookie|popcorn)/i.test(clean)) {
    const isNut = /(nut|almond|walnut|peanut)/i.test(clean);
    return {
      category: 'snacks',
      location: 'pantry',
      shelfLifeDays: 30,
      rotPreventionTip: 'Clip bag tightly shut or transfer to airtight container.',
      canFreeze: false,
      glycemicIndex: isNut ? 'low' : 'high',
      isDiabeticFriendly: isNut,
    };
  }

  // Default fallback
  return {
    category: 'pantry',
    location: 'fridge',
    shelfLifeDays: 7,
    rotPreventionTip: 'Store in an airtight container at proper temperature to maximize shelf-life.',
    canFreeze: true,
    glycemicIndex: 'medium',
    isDiabeticFriendly: true,
  };
}

export function calculateDaysLeft(expirationDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getFreshnessStatus(daysLeft: number): FreshnessStatus {
  if (daysLeft < 0) return 'expired';
  if (daysLeft === 0) return 'expiring_today';
  if (daysLeft <= 2) return 'expiring_soon';
  return 'fresh';
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
