import React, { useState } from 'react';
import { FoodItem } from '../../types';
import { calculateDaysLeft, getFreshnessStatus, addDaysToDate, getTodayDateString } from '../../utils/foodDatabase';
import {
  Clock,
  MapPin,
  Calendar,
  Snowflake,
  ChefHat,
  CheckCircle2,
  Trash2,
  Edit2,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FoodCardProps {
  item: FoodItem;
  onMarkConsumed: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (item: FoodItem) => void;
  onFindRecipe: (ingredientName: string) => void;
  onMoveToFreezer: (id: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onMarkConsumed,
  onDelete,
  onEdit,
  onFindRecipe,
  onMoveToFreezer,
}) => {
  const [showTip, setShowTip] = useState(false);
  const daysLeft = calculateDaysLeft(item.expirationDate);
  const status = getFreshnessStatus(daysLeft);

  const getStatusBadge = () => {
    switch (status) {
      case 'expired':
        return {
          label: `Expired ${Math.abs(daysLeft)}d ago`,
          bg: 'bg-rose-100 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          urgent: true,
        };
      case 'expiring_today':
        return {
          label: 'Expiring Today!',
          bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse',
          dot: 'bg-amber-500',
          urgent: true,
        };
      case 'expiring_soon':
        return {
          label: `${daysLeft} days left (Use Soon)`,
          bg: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          urgent: true,
        };
      case 'fresh':
      default:
        return {
          label: `${daysLeft} days left (Fresh)`,
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          urgent: false,
        };
    }
  };

  const badge = getStatusBadge();

  const handleCelebrateConsumed = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34d399', '#6ee7b7', '#059669'],
    });
    onMarkConsumed(item.id);
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-200 hover:shadow-lg overflow-hidden flex flex-col justify-between ${
        status === 'expired'
          ? 'border-rose-300 bg-rose-50/20'
          : status === 'expiring_today'
          ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
          : status === 'expiring_soon'
          ? 'border-orange-200 shadow-sm'
          : 'border-slate-200/80 shadow-xs'
      }`}
    >
      {/* Top Banner Indicator for Urgent Items */}
      {badge.urgent && (
        <div
          className={`w-full text-[11px] font-semibold tracking-wide uppercase px-3.5 py-1 flex items-center justify-between ${
            status === 'expired'
              ? 'bg-rose-600 text-white'
              : status === 'expiring_today'
              ? 'bg-amber-500 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            {status === 'expired' ? 'Action Needed: Check or Discard' : 'At Risk of Rotting - Eat Soon!'}
          </span>
          {item.canFreeze && item.location !== 'freezer' && (
            <button
              onClick={() => onMoveToFreezer(item.id)}
              className="text-[10px] bg-white/20 hover:bg-white/30 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1"
              title="Move to freezer to stop rotting and gain 90+ days!"
            >
              <Snowflake className="w-3 h-3" />
              Freeze Now
            </button>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-5 flex-1">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
              <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                {item.category}
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3 h-3" />
                <span className="capitalize">{item.location}</span>
              </span>
              <span className="font-semibold text-slate-700">
                {item.quantity} {item.unit}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.label}
          </div>
        </div>

        {/* Dates and Expiration meter */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-600" />
              Expires:
            </span>
            <span className={`font-mono font-semibold ${badge.urgent ? 'text-rose-600' : 'text-slate-700'}`}>
              {item.expirationDate}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Bought: {item.purchaseDate}</span>
            {item.estimatedCost ? <span>Est. Value: ${item.estimatedCost.toFixed(2)}</span> : null}
          </div>
        </div>

        {/* Rot Prevention Tip Box */}
        {item.rotPreventionTip && (
          <div className="mt-3 bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
            <button
              onClick={() => setShowTip(!showTip)}
              className="w-full flex items-center justify-between text-left text-xs font-semibold text-emerald-800"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                Rot Prevention Tip
              </span>
              {showTip ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showTip && (
              <p className="mt-1 text-xs text-emerald-950 leading-relaxed pt-1 border-t border-emerald-100/60">
                {item.rotPreventionTip}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onFindRecipe(item.name)}
            className="px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg transition flex items-center gap-1"
            title="Find healthy recipes using this"
          >
            <ChefHat className="w-3.5 h-3.5" />
            Recipe
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
            title="Edit item details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Consumed / Rescued Action */}
        <button
          onClick={handleCelebrateConsumed}
          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm rounded-lg transition flex items-center gap-1.5"
          title="Mark as eaten! Rescues item and logs savings"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Consumed
        </button>
      </div>
    </div>
  );
};
