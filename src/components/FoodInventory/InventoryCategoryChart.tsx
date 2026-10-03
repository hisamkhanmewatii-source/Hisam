import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { FoodItem, FoodCategory } from '../../types';
import { calculateDaysLeft } from '../../utils/foodDatabase';
import { playButtonClickSound } from '../../utils/buttonSettings';
import { SupportedLanguage } from '../../utils/translations';
import {
  PieChart as PieIcon,
  Layers,
  Sparkles,
  ShieldAlert,
  DollarSign,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InventoryCategoryChartProps {
  foodItems: FoodItem[];
  selectedCategory: string; // 'all' or FoodCategory
  onSelectCategory: (category: string) => void;
  currentLanguage?: SupportedLanguage;
  easyMode?: boolean;
}

// Category metadata: labels, icons, and theme colors
export const CATEGORY_META: Record<
  string,
  { label: string; labelHi: string; icon: string; color: string; bgLight: string }
> = {
  produce: {
    label: 'Produce',
    labelHi: 'फल व सब्ज़ियाँ (Produce)',
    icon: '🥦',
    color: '#10b981', // emerald-500
    bgLight: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
  dairy: {
    label: 'Dairy & Eggs',
    labelHi: 'डेयरी व अंडे (Dairy)',
    icon: '🥛',
    color: '#38bdf8', // sky-400
    bgLight: 'bg-sky-50 text-sky-900 border-sky-200',
  },
  meat: {
    label: 'Meat & Poultry',
    labelHi: 'मांस व पोल्ट्री (Protein)',
    icon: '🥩',
    color: '#f59e0b', // amber-500
    bgLight: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  seafood: {
    label: 'Seafood',
    labelHi: 'मछली व सीफूड (Seafood)',
    icon: '🐟',
    color: '#06b6d4', // cyan-500
    bgLight: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  },
  bakery: {
    label: 'Bakery',
    labelHi: 'बेकरी व ब्रेड (Bakery)',
    icon: '🍞',
    color: '#f97316', // orange-500
    bgLight: 'bg-orange-50 text-orange-900 border-orange-200',
  },
  pantry: {
    label: 'Pantry & Grains',
    labelHi: 'पेंट्री व अनाज (Grains)',
    icon: '🍚',
    color: '#6366f1', // indigo-500
    bgLight: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  },
  frozen: {
    label: 'Frozen',
    labelHi: 'फ्रोजन खाद्य (Frozen)',
    icon: '🧊',
    color: '#8b5cf6', // purple-500
    bgLight: 'bg-purple-50 text-purple-900 border-purple-200',
  },
  beverages: {
    label: 'Beverages',
    labelHi: 'पेय पदार्थ (Beverages)',
    icon: '🧃',
    color: '#ec4899', // pink-500
    bgLight: 'bg-pink-50 text-pink-900 border-pink-200',
  },
  condiments: {
    label: 'Condiments',
    labelHi: 'मसाले व सॉस (Condiments)',
    icon: '🥫',
    color: '#eab308', // yellow-500
    bgLight: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  },
  snacks: {
    label: 'Snacks',
    labelHi: 'स्नैक्स (Snacks)',
    icon: '🥨',
    color: '#14b8a6', // teal-500
    bgLight: 'bg-teal-50 text-teal-900 border-teal-200',
  },
  other: {
    label: 'Other',
    labelHi: 'अन्य (Other)',
    icon: '📦',
    color: '#64748b', // slate-500
    bgLight: 'bg-slate-50 text-slate-900 border-slate-200',
  },
};

export const InventoryCategoryChart: React.FC<InventoryCategoryChartProps> = ({
  foodItems,
  selectedCategory,
  onSelectCategory,
  currentLanguage = 'en',
  easyMode = false,
}) => {
  const [metricMode, setMetricMode] = useState<'count' | 'value'>('count');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Active (non-consumed) food items
  const activeFoods = useMemo(() => {
    return foodItems.filter((f) => !f.consumed);
  }, [foodItems]);

  // Group by category and compute counts, values, and expiring count
  const categoryData = useMemo(() => {
    const map: Record<
      string,
      {
        categoryKey: string;
        count: number;
        value: number;
        expiringCount: number;
        itemNames: string[];
      }
    > = {};

    activeFoods.forEach((item) => {
      const cat = item.category || 'other';
      if (!map[cat]) {
        map[cat] = {
          categoryKey: cat,
          count: 0,
          value: 0,
          expiringCount: 0,
          itemNames: [],
        };
      }
      map[cat].count += 1;
      map[cat].value += item.estimatedCost || 3.0;
      map[cat].itemNames.push(item.name);

      if (calculateDaysLeft(item.expirationDate) <= 2) {
        map[cat].expiringCount += 1;
      }
    });

    const totalCount = activeFoods.length;
    const totalValue = Object.values(map).reduce((sum, c) => sum + c.value, 0);

    return Object.values(map)
      .map((item) => {
        const meta = CATEGORY_META[item.categoryKey] || CATEGORY_META.other;
        const percentCount = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
        const percentValue = totalValue > 0 ? (item.value / totalValue) * 100 : 0;

        return {
          name: meta.label,
          categoryKey: item.categoryKey,
          labelHi: meta.labelHi,
          icon: meta.icon,
          color: meta.color,
          count: item.count,
          value: item.value,
          percent: metricMode === 'count' ? percentCount : percentValue,
          expiringCount: item.expiringCount,
          itemNames: item.itemNames,
        };
      })
      .sort((a, b) => (metricMode === 'count' ? b.count - a.count : b.value - a.value));
  }, [activeFoods, metricMode]);

  const totalItemsCount = activeFoods.length;
  const totalValue = useMemo(() => {
    return activeFoods.reduce((acc, f) => acc + (f.estimatedCost || 3.0), 0);
  }, [activeFoods]);

  // Center display data when hovering or selecting
  const activeCategoryInfo = useMemo(() => {
    if (activeIndex !== null && categoryData[activeIndex]) {
      return categoryData[activeIndex];
    }
    if (selectedCategory !== 'all') {
      return categoryData.find((c) => c.categoryKey === selectedCategory) || null;
    }
    return null;
  }, [activeIndex, categoryData, selectedCategory]);

  const handleSliceClick = (entry: any) => {
    playButtonClickSound();
    if (selectedCategory === entry.categoryKey) {
      onSelectCategory('all');
    } else {
      onSelectCategory(entry.categoryKey);
    }
  };

  // Custom Doughnut Tooltip
  const CustomDoughnutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1 z-50">
          <div className="flex items-center gap-2">
            <span className="text-base">{data.icon}</span>
            <span className="font-black text-sm text-emerald-300">{data.name}</span>
          </div>
          <div className="text-slate-200">
            <strong>{data.count} items</strong> ({data.percent.toFixed(1)}% of inventory)
          </div>
          <div className="text-slate-300 text-[11px]">
            Est. Value: <strong>${data.value.toFixed(2)}</strong>
          </div>
          {data.expiringCount > 0 && (
            <div className="text-rose-400 font-bold text-[10px] flex items-center gap-1 pt-1 border-t border-slate-700">
              <ShieldAlert className="w-3 h-3" />
              <span>{data.expiringCount} expiring within 48h!</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (activeFoods.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5 text-left">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {currentLanguage === 'hi'
                  ? 'खाद्य श्रेणी वितरण (Category Distribution)'
                  : 'Food Category Distribution'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Recharts Doughnut
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {currentLanguage === 'hi'
                ? 'रसोई में उपलब्ध सामग्री का श्रेणीवार अनुपात (सब्ज़ी, डेयरी, प्रोटीन)'
                : 'Interactive breakdown of available food items across kitchen categories'}
            </p>
          </div>
        </div>

        {/* View Toggle: Item Count vs Value ($) & Collapse */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => {
                playButtonClickSound();
                setMetricMode('count');
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                metricMode === 'count'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Items ({totalItemsCount})
            </button>
            <button
              onClick={() => {
                playButtonClickSound();
                setMetricMode('value');
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                metricMode === 'value'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Value (${totalValue.toFixed(0)})
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition"
            title={isCollapsed ? 'Expand Chart' : 'Collapse Chart'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Recharts Doughnut Chart (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <div className="h-64 sm:h-72 w-full max-w-xs relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomDoughnutTooltip />} />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={3}
                    dataKey={metricMode === 'count' ? 'count' : 'value'}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={(entry) => handleSliceClick(entry)}
                    cursor="pointer"
                  >
                    {categoryData.map((entry) => {
                      const isSelected = selectedCategory === entry.categoryKey;
                      return (
                        <Cell
                          key={entry.categoryKey}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 4 : 2}
                          className="transition-all duration-200 hover:opacity-90"
                          style={{
                            filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' : 'none',
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Doughnut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-4">
                {activeCategoryInfo ? (
                  <div className="space-y-0.5 animate-in fade-in duration-150">
                    <span className="text-xl sm:text-2xl">{activeCategoryInfo.icon}</span>
                    <span className="text-xs font-black text-slate-900 block truncate max-w-[120px]">
                      {activeCategoryInfo.name}
                    </span>
                    <span className="text-base sm:text-lg font-black" style={{ color: activeCategoryInfo.color }}>
                      {metricMode === 'count'
                        ? `${activeCategoryInfo.count} items`
                        : `$${activeCategoryInfo.value.toFixed(1)}`}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {activeCategoryInfo.percent.toFixed(0)}% of pantry
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
                      {totalItemsCount}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Total Items
                    </span>
                    <span className="text-[10px] text-emerald-700 font-black">
                      ${totalValue.toFixed(2)} Value
                    </span>
                  </div>
                )}
              </div>
            </div>

            <span className="text-[11px] text-slate-500 mt-1">
              Tap any slice to filter inventory
            </span>
          </div>

          {/* Right Column: Interactive Category Breakdown Cards (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Category Breakdown ({categoryData.length} active)</span>
              </span>

              {selectedCategory !== 'all' && (
                <button
                  onClick={() => {
                    playButtonClickSound();
                    onSelectCategory('all');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Show All Categories
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categoryData.map((cat) => {
                const isSelected = selectedCategory === cat.categoryKey;
                return (
                  <button
                    key={cat.categoryKey}
                    type="button"
                    onClick={() => handleSliceClick(cat)}
                    onMouseEnter={() => {
                      const idx = categoryData.findIndex((c) => c.categoryKey === cat.categoryKey);
                      setActiveIndex(idx);
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-400/40'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                        style={{ backgroundColor: `${cat.color}22` }}
                      >
                        <span>{cat.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {cat.name}
                          </span>
                          {cat.expiringCount > 0 && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                              }`}
                              title={`${cat.expiringCount} item(s) expiring within 48 hours`}
                            >
                              ⚠️ {cat.expiringCount}
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] block truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {cat.itemNames.slice(0, 2).join(', ')}
                          {cat.itemNames.length > 2 ? ` +${cat.itemNames.length - 2}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black block ${isSelected ? 'text-emerald-400' : 'text-slate-900'}`}>
                        {metricMode === 'count' ? `${cat.count} items` : `$${cat.value.toFixed(1)}`}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                        {cat.percent.toFixed(0)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Active Notice */}
            {selectedCategory !== 'all' && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Filtered by: <strong>{CATEGORY_META[selectedCategory]?.label || selectedCategory}</strong>
                  </span>
                </span>
                <button
                  onClick={() => onSelectCategory('all')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
