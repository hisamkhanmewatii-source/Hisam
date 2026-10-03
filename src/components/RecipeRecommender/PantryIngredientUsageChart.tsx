import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Leaf,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Flame,
  UtensilsCrossed,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { FoodItem, RecipeItem } from '../../types';
import { SupportedLanguage } from '../../utils/translations';
import { playButtonClickSound } from '../../utils/buttonSettings';

export interface CookedMealRecord {
  id: string;
  recipeTitle: string;
  cookedDate: string; // YYYY-MM-DD
  ingredientsUsed: string[];
  category: 'produce' | 'protein' | 'grain' | 'dairy' | 'healthy_fat';
  preventedRot: boolean;
  calories: number;
}

interface PantryIngredientUsageChartProps {
  inventory: FoodItem[];
  currentLanguage?: SupportedLanguage;
  onFilterByIngredient?: (ingredient: string) => void;
}

// Initial realistic baseline of healthy meal cooking history
const BASELINE_COOKING_HISTORY: CookedMealRecord[] = [
  {
    id: 'cm-1',
    recipeTitle: 'Spinach & Egg White Scramble',
    cookedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Baby Spinach', 'Fresh Eggs', 'Olive Oil', 'Garlic'],
    category: 'produce',
    preventedRot: true,
    calories: 280,
  },
  {
    id: 'cm-2',
    recipeTitle: 'Warm Rolled Oats & Cinnamon Bowl',
    cookedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Rolled Oats', 'Fresh Whole Milk', 'Greek Yogurt (Plain)'],
    category: 'grain',
    preventedRot: false,
    calories: 340,
  },
  {
    id: 'cm-3',
    recipeTitle: 'Pan-Seared Herb Chicken Breast',
    cookedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Boneless Chicken Breast', 'Roma Tomatoes', 'Baby Spinach', 'Olive Oil'],
    category: 'protein',
    preventedRot: true,
    calories: 420,
  },
  {
    id: 'cm-4',
    recipeTitle: 'Hearty Tomato & Spinach Frittata',
    cookedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Fresh Eggs', 'Baby Spinach', 'Roma Tomatoes', 'Bell Peppers'],
    category: 'produce',
    preventedRot: true,
    calories: 310,
  },
  {
    id: 'cm-5',
    recipeTitle: 'High-Protein Greek Yogurt Parfait',
    cookedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Greek Yogurt (Plain)', 'Rolled Oats'],
    category: 'dairy',
    preventedRot: false,
    calories: 260,
  },
  {
    id: 'cm-6',
    recipeTitle: 'Spiced Lentils & Roasted Tomato Dal',
    cookedDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Lentils / Dal', 'Roma Tomatoes', 'Garlic', 'Baby Spinach'],
    category: 'produce',
    preventedRot: true,
    calories: 360,
  },
  {
    id: 'cm-7',
    recipeTitle: 'Whole Grain Avocado & Egg Toast',
    cookedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Whole Grain Sliced Bread', 'Fresh Eggs', 'Olive Oil'],
    category: 'grain',
    preventedRot: true,
    calories: 330,
  },
  {
    id: 'cm-8',
    recipeTitle: 'Garlic Sautéed Green Power Bowl',
    cookedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Baby Spinach', 'Garlic', 'Boneless Chicken Breast', 'Olive Oil'],
    category: 'produce',
    preventedRot: true,
    calories: 390,
  },
  {
    id: 'cm-9',
    recipeTitle: 'Mediterranean Chicken Tomato Skillet',
    cookedDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Boneless Chicken Breast', 'Roma Tomatoes', 'Bell Peppers', 'Garlic'],
    category: 'protein',
    preventedRot: true,
    calories: 410,
  },
  {
    id: 'cm-10',
    recipeTitle: 'Overnight Chia & Oat Protein Pudding',
    cookedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Rolled Oats', 'Fresh Whole Milk', 'Greek Yogurt (Plain)'],
    category: 'grain',
    preventedRot: false,
    calories: 290,
  },
  {
    id: 'cm-11',
    recipeTitle: 'Quick Vegetable Egg Bhurji',
    cookedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ingredientsUsed: ['Fresh Eggs', 'Roma Tomatoes', 'Bell Peppers', 'Garlic', 'Baby Spinach'],
    category: 'protein',
    preventedRot: true,
    calories: 320,
  },
];

// Color palette for ingredient categories
const CATEGORY_COLORS: Record<string, string> = {
  Produce: '#10b981', // emerald-500
  Protein: '#f59e0b', // amber-500
  Grains: '#3b82f6', // blue-500
  Dairy: '#8b5cf6', // purple-500
  'Healthy Fats & Spices': '#06b6d4', // cyan-500
};

export const PantryIngredientUsageChart: React.FC<PantryIngredientUsageChartProps> = ({
  inventory,
  currentLanguage = 'en',
  onFilterByIngredient,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d'>('all');
  const [viewMode, setViewMode] = useState<'bar' | 'pie'>('bar');
  const [selectedBar, setSelectedBar] = useState<any | null>(null);

  // Load and merge cooking history from localStorage
  const cookingHistory = useMemo(() => {
    try {
      const stored = localStorage.getItem('mohammed_hisam_cooking_history');
      if (stored) {
        const parsed: CookedMealRecord[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading cooking history:', e);
    }
    return BASELINE_COOKING_HISTORY;
  }, []);

  // Filter history by time range
  const filteredHistory = useMemo(() => {
    const now = Date.now();
    return cookingHistory.filter((item) => {
      const itemDate = new Date(item.cookedDate).getTime();
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
      if (timeRange === '7d') return diffDays <= 7;
      if (timeRange === '30d') return diffDays <= 30;
      return true;
    });
  }, [cookingHistory, timeRange]);

  // Aggregate ingredient frequencies
  const { ingredientStats, categoryStats, totalCookedMeals, rotPreventedCount } = useMemo(() => {
    const counts: Record<string, { count: number; category: string; healthBenefit: string; rotPrevented: number }> = {};
    const catCounts: Record<string, number> = {
      Produce: 0,
      Protein: 0,
      Grains: 0,
      Dairy: 0,
      'Healthy Fats & Spices': 0,
    };

    let rotCount = 0;

    // First include ingredients from consumed inventory items
    inventory
      .filter((item) => item.consumed)
      .forEach((item) => {
        const name = item.name;
        if (!counts[name]) {
          let category = 'Produce';
          if (item.category === 'meat' || item.category === 'seafood') category = 'Protein';
          else if (item.category === 'dairy') category = 'Dairy';
          else if (item.category === 'bakery' || item.category === 'pantry') category = 'Grains';

          counts[name] = {
            count: 0,
            category,
            healthBenefit: item.rotPreventionTip || 'Rich in micro-nutrients & pantry staple',
            rotPrevented: 1,
          };
        }
        counts[name].count += 1;
        rotCount += 1;
      });

    // Then process cooking history records
    filteredHistory.forEach((meal) => {
      if (meal.preventedRot) rotCount += 1;
      meal.ingredientsUsed.forEach((ing) => {
        // Categorize ingredient intelligently
        let cat = 'Produce';
        let benefit = 'Antioxidant & fiber rich, gentle on blood sugar';

        if (ing.toLowerCase().includes('egg') || ing.toLowerCase().includes('chicken') || ing.toLowerCase().includes('fish') || ing.toLowerCase().includes('lentil') || ing.toLowerCase().includes('dal')) {
          cat = 'Protein';
          benefit = 'Lean muscle maintenance & steady satiety';
        } else if (ing.toLowerCase().includes('oat') || ing.toLowerCase().includes('bread') || ing.toLowerCase().includes('rice') || ing.toLowerCase().includes('grain')) {
          cat = 'Grains';
          benefit = 'Heart-healthy beta-glucans & slow digestion';
        } else if (ing.toLowerCase().includes('yogurt') || ing.toLowerCase().includes('milk') || ing.toLowerCase().includes('cheese')) {
          cat = 'Dairy';
          benefit = 'Bone strength, calcium & gut probiotics';
        } else if (ing.toLowerCase().includes('oil') || ing.toLowerCase().includes('garlic') || ing.toLowerCase().includes('spice')) {
          cat = 'Healthy Fats & Spices';
          benefit = 'Cardiovascular support & anti-inflammatory';
        }

        if (!counts[ing]) {
          counts[ing] = {
            count: 0,
            category: cat,
            healthBenefit: benefit,
            rotPrevented: 0,
          };
        }
        counts[ing].count += 1;
        if (meal.preventedRot) counts[ing].rotPrevented += 1;
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });
    });

    const ingList = Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        category: data.category,
        healthBenefit: data.healthBenefit,
        rotPrevented: data.rotPrevented,
        color: CATEGORY_COLORS[data.category] || '#10b981',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 most frequent ingredients

    const catList = Object.entries(catCounts)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || '#10b981',
      }));

    return {
      ingredientStats: ingList,
      categoryStats: catList,
      totalCookedMeals: filteredHistory.length,
      rotPreventedCount: rotCount,
    };
  }, [filteredHistory, inventory]);

  const topIngredient = ingredientStats[0]?.name || 'Baby Spinach';
  const topCount = ingredientStats[0]?.count || 0;

  // Custom Recharts Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-xs z-50">
          <div className="flex items-center justify-between gap-3">
            <span className="font-black text-sm text-emerald-300">{data.name}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-900"
              style={{ backgroundColor: data.color }}
            >
              {data.category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {currentLanguage === 'hi' ? 'कुल बार पकाया:' : 'Cooked in meals:'}{' '}
              <strong className="text-white font-black">{data.count} times</strong>
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight pt-1 border-t border-slate-700">
            ✨ {data.healthBenefit}
          </p>
          {data.rotPrevented > 0 && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {currentLanguage === 'hi'
                  ? `सड़ने से पहले बचाया: ${data.rotPrevented} बार`
                  : `Prevented food rot: ${data.rotPrevented} times`}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              {currentLanguage === 'hi' ? 'पेंट्री उपयोग विज़ुअलाइज़ेशन' : 'Pantry Usage Analytics'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
              Recharts Engine
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
            <span>
              {currentLanguage === 'hi'
                ? 'सर्वाधिक पकाए गए स्वस्थ भोजन सामग्री'
                : 'Most Frequently Cooked Healthy Meal Ingredients'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-700">
            {currentLanguage === 'hi'
              ? 'आपकी रसोई की उपयोगिता व पकाए गए भोजन का डेटा चार्ट — यह जानने के लिए कि आप सबसे ज़्यादा क्या खाते हैं'
              : 'Interactive chart visualizing cooking patterns & frequent ingredients based on your healthy meal log'}
          </p>
        </div>

        {/* Action and Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range buttons */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                playButtonClickSound();
                setTimeRange('all');
              }}
              className={`px-2.5 py-1.5 rounded-xl transition ${
                timeRange === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {currentLanguage === 'hi' ? 'सभी समय' : 'All Time'}
            </button>
            <button
              type="button"
              onClick={() => {
                playButtonClickSound();
                setTimeRange('30d');
              }}
              className={`px-2.5 py-1.5 rounded-xl transition ${
                timeRange === '30d'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {currentLanguage === 'hi' ? '30 दिन' : 'Past 30D'}
            </button>
            <button
              type="button"
              onClick={() => {
                playButtonClickSound();
                setTimeRange('7d');
              }}
              className={`px-2.5 py-1.5 rounded-xl transition ${
                timeRange === '7d'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {currentLanguage === 'hi' ? '7 दिन' : 'Past 7D'}
            </button>
          </div>

          {/* Toggle between Bar Chart and Pie Breakdown */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                playButtonClickSound();
                setViewMode('bar');
              }}
              className={`p-1.5 rounded-xl transition flex items-center gap-1 ${
                viewMode === 'bar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Bar Chart View"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Bars</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playButtonClickSound();
                setViewMode('pie');
              }}
              className={`p-1.5 rounded-xl transition flex items-center gap-1 ${
                viewMode === 'pie'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Category Distribution View"
            >
              <PieIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Groups</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <Leaf className="w-4 h-4 text-emerald-600" />
            <span>{currentLanguage === 'hi' ? 'नंबर 1 सामग्री' : 'Top Superfood'}</span>
          </div>
          <div className="text-base sm:text-lg font-black truncate">{topIngredient}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {topCount} {currentLanguage === 'hi' ? 'बार इस्तेमाल' : 'meals prepared'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>{currentLanguage === 'hi' ? 'कुल पके भोजन' : 'Cooked Meals'}</span>
          </div>
          <div className="text-base sm:text-lg font-black">{totalCookedMeals}</div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {currentLanguage === 'hi' ? 'पेंट्री से बनाए गए' : 'from pantry items'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>{currentLanguage === 'hi' ? 'खराबी से बचाया' : 'Rot Prevented'}</span>
          </div>
          <div className="text-base sm:text-lg font-black">{rotPreventedCount} items</div>
          <div className="text-[11px] text-teal-700 font-semibold">
            {currentLanguage === 'hi' ? 'समाप्ति से पहले पकाया' : 'used before expiry'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>{currentLanguage === 'hi' ? 'स्वस्थ स्कोर' : 'Health Score'}</span>
          </div>
          <div className="text-base sm:text-lg font-black">94% Healthy</div>
          <div className="text-[11px] text-indigo-700 font-semibold">
            {currentLanguage === 'hi' ? 'कम शुगर व संतुलित' : 'low GI & fiber rich'}
          </div>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION AREA */}
      <div className="bg-slate-50/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80">
        {viewMode === 'bar' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>
                  {currentLanguage === 'hi'
                    ? '📊 सामग्री आवृत्ति (Frequency in Cooked Recipes)'
                    : '📊 Top Ingredients by Cooking Frequency'}
                </span>
              </span>
              <span className="text-[11px] text-slate-700 hidden sm:inline">
                {currentLanguage === 'hi'
                  ? 'बार पर टैप करके रेसिपीज़ खोजें'
                  : 'Tap bar or button to find recipes with this food'}
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ingredientStats}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length) {
                      const ing = state.activePayload[0].payload;
                      setSelectedBar(ing);
                      if (onFilterByIngredient) onFilterByIngredient(ing.name);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    domain={[0, 'dataMax + 2']}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="count"
                    name={currentLanguage === 'hi' ? 'पकाने की संख्या' : 'Times Cooked'}
                    radius={[0, 8, 8, 0]}
                    cursor="pointer"
                  >
                    {ingredientStats.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {currentLanguage === 'hi'
                  ? '🥧 खाद्य समूह वितरण (Food Group Distribution in Cooked Meals)'
                  : '🥧 Food Group Distribution in Cooked Meals'}
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-64 w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        `${value} times used`,
                        name,
                      ]}
                    />
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }: any) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Summary breakdown */}
              <div className="w-full sm:w-1/2 space-y-2.5">
                {categoryStats.map((cat, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-md"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-slate-800">{cat.name}</span>
                    </div>
                    <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {cat.value} uses
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quick-Action Chips for Top Cooked Ingredients */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">
            {currentLanguage === 'hi'
              ? '⚡ सामग्री के अनुसार रेसिपी खोजें (Filter Recipes by Your Top Ingredients):'
              : '⚡ Quick Cook: Filter recipes featuring your top cooked ingredients:'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ingredientStats.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                playButtonClickSound();
                if (onFilterByIngredient) onFilterByIngredient(item.name);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-xs font-bold text-slate-700 transition active:scale-95 flex items-center gap-1.5 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white text-[10px] font-black text-slate-600 border border-slate-200">
                {item.count}×
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
