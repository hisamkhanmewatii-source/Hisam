import React, { useState, useEffect } from 'react';
import { FoodItem, FoodCategory, StorageLocation } from '../../types';
import { autoDetectFood, addDaysToDate, getTodayDateString } from '../../utils/foodDatabase';
import { X, Sparkles, Calendar, Layers, MapPin, AlertCircle, Check } from 'lucide-react';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<FoodItem, 'id'>) => void;
  initialItem?: FoodItem | null;
}

const CATEGORIES: { value: FoodCategory; label: string; icon: string }[] = [
  { value: 'produce', label: 'Produce (Fruits & Veggies)', icon: '🥦' },
  { value: 'dairy', label: 'Dairy & Eggs', icon: '🥛' },
  { value: 'meat', label: 'Meat & Poultry', icon: '🥩' },
  { value: 'seafood', label: 'Fish & Seafood', icon: '🐟' },
  { value: 'bakery', label: 'Bakery & Bread', icon: '🍞' },
  { value: 'pantry', label: 'Pantry & Grains', icon: '🍚' },
  { value: 'frozen', label: 'Frozen Items', icon: '🧊' },
  { value: 'beverages', label: 'Beverages', icon: '🧃' },
  { value: 'condiments', label: 'Sauces & Condiments', icon: '🥫' },
  { value: 'snacks', label: 'Snacks', icon: '🥨' },
  { value: 'other', label: 'Other', icon: '📦' },
];

const LOCATIONS: { value: StorageLocation; label: string; icon: string }[] = [
  { value: 'fridge', label: 'Refrigerator', icon: '❄️' },
  { value: 'pantry', label: 'Pantry / Cupboard', icon: '🚪' },
  { value: 'freezer', label: 'Freezer', icon: '🧊' },
];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const today = getTodayDateString();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('produce');
  const [location, setLocation] = useState<StorageLocation>('fridge');
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [expirationDate, setExpirationDate] = useState(addDaysToDate(today, 5));
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pack');
  const [rotPreventionTip, setRotPreventionTip] = useState('');
  const [canFreeze, setCanFreeze] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState(3.5);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setLocation(initialItem.location);
      setPurchaseDate(initialItem.purchaseDate);
      setExpirationDate(initialItem.expirationDate);
      setQuantity(initialItem.quantity);
      setUnit(initialItem.unit);
      setRotPreventionTip(initialItem.rotPreventionTip || '');
      setCanFreeze(initialItem.canFreeze ?? true);
      setEstimatedCost(initialItem.estimatedCost ?? 3.5);
      setAutoDetected(false);
    } else {
      resetForm();
    }
  }, [initialItem, isOpen]);

  const resetForm = () => {
    setName('');
    setCategory('produce');
    setLocation('fridge');
    setPurchaseDate(today);
    setExpirationDate(addDaysToDate(today, 5));
    setQuantity(1);
    setUnit('pack');
    setRotPreventionTip('');
    setCanFreeze(true);
    setEstimatedCost(3.5);
    setAutoDetected(false);
  };

  // Auto-categorize and suggest dates when user types food name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (!initialItem && newName.trim().length >= 3) {
      const detected = autoDetectFood(newName);
      setCategory(detected.category);
      setLocation(detected.location);
      setRotPreventionTip(detected.rotPreventionTip);
      setCanFreeze(detected.canFreeze);
      
      // Auto-compute expiration date from purchaseDate + shelfLifeDays
      const calculatedExp = addDaysToDate(purchaseDate, detected.shelfLifeDays);
      setExpirationDate(calculatedExp);
      setAutoDetected(true);
    }
  };

  // When purchase date changes, re-adjust expiration if auto-detected
  const handlePurchaseDateChange = (newDate: string) => {
    setPurchaseDate(newDate);
    if (autoDetected && name.trim()) {
      const detected = autoDetectFood(name);
      setExpirationDate(addDaysToDate(newDate, detected.shelfLifeDays));
    }
  };

  const handleQuickAddDays = (days: number) => {
    setExpirationDate(addDaysToDate(purchaseDate, days));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      location,
      purchaseDate,
      expirationDate,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'item',
      rotPreventionTip: rotPreventionTip.trim(),
      canFreeze,
      estimatedCost: Number(estimatedCost) || 0,
      consumed: false,
    });

    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialItem ? 'Edit Food Item' : 'Add Food to Inventory'}
              </h2>
              <p className="text-xs text-emerald-100">
                Auto-categorizes item with rot-prevention storage tips
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Food Item Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Baby Spinach, Fresh Milk, Chicken Breast, Apples..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              {autoDetected && (
                <div className="absolute right-3 top-2.5 flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  Auto-Categorized
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Tip: Type common foods to automatically select category, shelf-life, and preservation tips.
            </p>
          </div>

          {/* Quick Suggestions Pills */}
          {!initialItem && !name && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Baby Spinach', 'Fresh Milk', 'Chicken Breast', 'Eggs', 'Roma Tomatoes', 'Greek Yogurt', 'Bananas'].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const detected = autoDetectFood(item);
                      setName(item);
                      setCategory(detected.category);
                      setLocation(detected.location);
                      setRotPreventionTip(detected.rotPreventionTip);
                      setCanFreeze(detected.canFreeze);
                      setExpirationDate(addDaysToDate(purchaseDate, detected.shelfLifeDays));
                      setAutoDetected(true);
                    }}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition"
                  >
                    + {item}
                  </button>
                )
              )}
            </div>
          )}

          {/* Category & Location (Manual Adjustment) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                Category (Adjustable)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                Storage Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as StorageLocation)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.icon} {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purchase Date & Expiration Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                Purchase Date
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => handlePurchaseDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                Expiration Date *
              </label>
              <input
                type="date"
                required
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Expiration date presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-600 font-medium">Quick Presets:</span>
            {[
              { label: '+2d', days: 2 },
              { label: '+4d', days: 4 },
              { label: '+1wk', days: 7 },
              { label: '+2wks', days: 14 },
              { label: '+1mo', days: 30 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleQuickAddDays(preset.days)}
                className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Quantity, Unit & Estimated Cost */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Qty
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pack, items, g, L"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Est. Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Rot Prevention Tip (Manual / Auto) */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              <span className="flex items-center gap-1 text-emerald-700">
                <AlertCircle className="w-3.5 h-3.5" />
                Rot Prevention & Storage Tip
              </span>
              <span className="text-[11px] font-normal text-slate-600">Manual adjustments allowed</span>
            </label>
            <textarea
              rows={2}
              value={rotPreventionTip}
              onChange={(e) => setRotPreventionTip(e.target.value)}
              placeholder="e.g. Keep paper towel in container; freeze if not eating in 2 days..."
              className="w-full px-3 py-2 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            />
          </div>

          {/* Can Freeze Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-700">Can be frozen to stop rot?</span>
              <p className="text-[11px] text-slate-600">
                Enables freeze reminders if item is expiring soon
              </p>
            </div>
            <input
              type="checkbox"
              checked={canFreeze}
              onChange={(e) => setCanFreeze(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-md shadow-emerald-600/20 rounded-xl transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {initialItem ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
