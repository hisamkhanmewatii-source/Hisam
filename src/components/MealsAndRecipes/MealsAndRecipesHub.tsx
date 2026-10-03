import React, { useState, useEffect } from 'react';
import { Utensils, ChefHat, Sparkles, PieChart, Heart, Leaf, Volume2 } from 'lucide-react';
import { PortionAdvisor } from '../PortionAdvisor/PortionAdvisor';
import { RecipeRecommender } from '../RecipeRecommender/RecipeRecommender';
import { FoodItem, Medication, RecipeItem } from '../../types';
import { SupportedLanguage } from '../../utils/translations';
import { playButtonClickSound } from '../../utils/buttonSettings';

interface MealsAndRecipesHubProps {
  inventory: FoodItem[];
  medications: Medication[];
  easyMode: boolean;
  currentLanguage?: SupportedLanguage;
  filterIngredient?: string;
  onClearFilter?: () => void;
  onCookMeal: (ingredientNames: string[]) => void;
  onCookRecipe: (recipe: RecipeItem) => void;
  initialSubTab?: 'portions' | 'recipes' | 'both';
}

export const MealsAndRecipesHub: React.FC<MealsAndRecipesHubProps> = ({
  inventory,
  medications,
  easyMode,
  currentLanguage = 'en',
  filterIngredient,
  onClearFilter,
  onCookMeal,
  onCookRecipe,
  initialSubTab = 'portions',
}) => {
  // If redirected with a specific ingredient filter, default to recipes view
  const [activeSubTab, setActiveSubTab] = useState<'portions' | 'recipes' | 'both'>(() => {
    return filterIngredient ? 'recipes' : initialSubTab;
  });

  // Automatically switch to recipes if an ingredient filter is set
  useEffect(() => {
    if (filterIngredient) {
      setActiveSubTab('recipes');
    }
  }, [filterIngredient]);

  const handleSubTabChange = (tab: 'portions' | 'recipes' | 'both') => {
    playButtonClickSound();
    setActiveSubTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Top Combined Hub Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-amber-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {currentLanguage === 'hi' ? 'एकीकृत पोषण व व्यंजन हब' : 'Nutrition & Kitchen Hub'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>
                {currentLanguage === 'hi'
                  ? '🍽️ क्या खाएं, मात्रा एवं 👨‍🍳 स्वस्थ व्यंजन'
                  : '🍽️ What To Eat & Portions + 👨‍🍳 Healthy Recipes'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              {currentLanguage === 'hi'
                ? 'दवाइयों के अनुसार भोजन का सही समय, सरल हस्त-माप मात्रा, शून्य-बर्बादी पेंट्री व्यंजन एवं उपयोगिता चार्ट।'
                : 'Medication-timed meal advice, simple hand portion rules, zero-rot pantry chef recipes & cooking analytics.'}
            </p>
          </div>

          {/* Quick Sub-Tab Switcher */}
          <div className="bg-emerald-950/80 p-1.5 rounded-2xl border border-emerald-700/60 flex items-center gap-1.5 self-start md:self-auto shrink-0 shadow-inner">
            {/* Sub-Tab 1: What to Eat & Portions */}
            <button
              type="button"
              onClick={() => handleSubTabChange('portions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'portions'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Utensils className="w-4 h-4 text-amber-300" />
              <span>{currentLanguage === 'hi' ? 'क्या खाएं व मात्रा' : 'What To Eat & Portions'}</span>
            </button>

            {/* Sub-Tab 2: Healthy Recipes */}
            <button
              type="button"
              onClick={() => handleSubTabChange('recipes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'recipes'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <ChefHat className="w-4 h-4 text-emerald-300" />
              <span>{currentLanguage === 'hi' ? 'स्वस्थ व्यंजन' : 'Healthy Recipes'}</span>
              {filterIngredient && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Sub-Tab 3: View Both */}
            <button
              type="button"
              onClick={() => handleSubTabChange('both')}
              className={`hidden sm:flex px-3 py-2 rounded-xl text-xs font-bold transition items-center gap-1.5 ${
                activeSubTab === 'both'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{currentLanguage === 'hi' ? 'दोनों देखें' : 'View Both'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE VIEWS */}
      {activeSubTab === 'portions' && (
        <PortionAdvisor
          inventory={inventory}
          medications={medications}
          easyMode={easyMode}
          onCookMeal={onCookMeal}
        />
      )}

      {activeSubTab === 'recipes' && (
        <RecipeRecommender
          inventory={inventory}
          onCookRecipe={onCookRecipe}
          easyMode={easyMode}
          filterIngredient={filterIngredient}
          onClearFilter={onClearFilter}
          currentLanguage={currentLanguage}
        />
      )}

      {activeSubTab === 'both' && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Utensils className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                {currentLanguage === 'hi'
                  ? '1. क्या खाएं एवं भोजन मात्रा (What To Eat & Portions)'
                  : '1. What To Eat & Elderly Hand Portions'}
              </h2>
            </div>
            <PortionAdvisor
              inventory={inventory}
              medications={medications}
              easyMode={easyMode}
              onCookMeal={onCookMeal}
            />
          </div>

          <div className="pt-6 border-t-2 border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">
                {currentLanguage === 'hi'
                  ? '2. स्वस्थ पेंट्री व्यंजन एवं उपयोगिता चार्ट (Healthy Recipes & Analytics)'
                  : '2. Healthy Pantry Recipes & Usage Analytics'}
              </h2>
            </div>
            <RecipeRecommender
              inventory={inventory}
              onCookRecipe={onCookRecipe}
              easyMode={easyMode}
              filterIngredient={filterIngredient}
              onClearFilter={onClearFilter}
              currentLanguage={currentLanguage}
            />
          </div>
        </div>
      )}
    </div>
  );
};
