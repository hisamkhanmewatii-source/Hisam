import React from 'react';
import { Volume2, AlertTriangle, Pill, Utensils, CheckCircle, Camera } from 'lucide-react';
import { speakText } from '../utils/voiceService';
import { Medication, FoodItem, TimeOfDay } from '../types';
import { calculateDaysLeft } from '../utils/foodDatabase';
import { getTimeOfDayLabel, getTimeOfDayIcon, playMedicationChime } from '../utils/notificationService';

interface SeniorModeBannerProps {
  currentSlot: TimeOfDay;
  dueMedsNow: Medication[];
  urgentFoods: FoodItem[];
  onTakeMed: (medId: string, slot: TimeOfDay) => void;
  onOpenPortion: () => void;
  onOpenInventory: () => void;
  onOpenScanCamera?: () => void;
}

export const SeniorModeBanner: React.FC<SeniorModeBannerProps> = ({
  currentSlot,
  dueMedsNow,
  urgentFoods,
  onTakeMed,
  onOpenPortion,
  onOpenInventory,
  onOpenScanCamera,
}) => {
  const slotLabel = getTimeOfDayLabel(currentSlot);
  const slotIcon = getTimeOfDayIcon(currentSlot);

  const handleSpeakStatus = () => {
    let msg = `Hello! It is currently ${slotLabel}. `;
    if (dueMedsNow.length > 0) {
      msg += `You have ${dueMedsNow.length} medicine to take right now. `;
      dueMedsNow.forEach((m) => {
        const rule = m.foodRule === 'with_meal' ? 'with food' : m.foodRule === 'empty_stomach' ? 'on an empty stomach' : '';
        msg += `Please take ${m.name}, dosage ${m.dosage}, ${rule}. `;
      });
    } else {
      msg += `All medicines for this time are completed! `;
    }

    if (urgentFoods.length > 0) {
      msg += `Also, ${urgentFoods.length} foods in your kitchen are about to spoil. ${urgentFoods.map((f) => f.name).join(', ')}. Please eat them today so they do not rot.`;
    }

    speakText(msg);
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-6 mb-6 shadow-md">
      {/* Top Banner with Voice Speaker */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-200">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl">{slotIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-lg text-xs font-black tracking-wider uppercase">
                Senior & Easy Helper
              </span>
              <span className="text-xs font-semibold text-amber-800">
                Current Time: {slotLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              What To Do Right Now
            </h2>
          </div>
        </div>

        <button
          onClick={handleSpeakStatus}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shadow transition"
          title="Click to hear your daily tasks spoken out loud"
        >
          <Volume2 className="w-5 h-5 animate-bounce" />
          <span>🔊 Listen Out Loud</span>
        </button>
      </div>

      {/* Grid of Big Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Medicine Tile */}
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900 uppercase tracking-wide">
                <Pill className="w-4 h-4 text-blue-600" />
                Right Medicine On Time
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {dueMedsNow.length} Due Now
              </span>
            </div>

            {dueMedsNow.length === 0 ? (
              <div className="py-3 flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Great job! You have taken all medications for {currentSlot}.</span>
              </div>
            ) : (
              <div className="space-y-2.5 py-1">
                {dueMedsNow.map((med) => (
                  <div
                    key={med.id}
                    className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">
                        {med.name} ({med.dosage})
                      </h4>
                      <p className="text-xs font-bold text-amber-700 mt-0.5">
                        {med.foodRule === 'with_meal'
                          ? '🍽️ MUST TAKE WITH FOOD'
                          : med.foodRule === 'empty_stomach'
                          ? '💧 TAKE WITH WATER ON EMPTY STOMACH'
                          : '⏰ Take anytime'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        playMedicationChime();
                        onTakeMed(med.id, currentSlot);
                        speakText(`Good job! You took ${med.name}.`);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow active:scale-95 transition shrink-0"
                    >
                      ✅ I Took It
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            {onOpenScanCamera && (
              <button
                onClick={onOpenScanCamera}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📸 Scan Medicine Bottle / Strip</span>
              </button>
            )}
          </div>
        </div>

        {/* Rotten Food Alert & What to Eat Tile */}
        <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-orange-900 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Foods About To Spoil (Eat Today)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                {urgentFoods.length} At Risk
              </span>
            </div>

            {urgentFoods.length === 0 ? (
              <div className="py-3 flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>All foods are fresh in your fridge and pantry!</span>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                {urgentFoods.slice(0, 2).map((food) => {
                  const days = calculateDaysLeft(food.expirationDate);
                  return (
                    <div
                      key={food.id}
                      className="p-2.5 bg-orange-50/80 rounded-xl border border-orange-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-extrabold text-slate-800 text-sm">
                          {food.name}
                        </span>
                        <span className="text-xs font-semibold text-orange-700 ml-2">
                          ({days <= 0 ? 'Expires today' : `${days} day left`})
                        </span>
                      </div>
                      <span className="text-xs bg-white px-2 py-0.5 rounded border border-orange-200 text-slate-700 font-semibold">
                        {food.location}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            <button
              onClick={onOpenPortion}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" />
              What Should I Eat?
            </button>
            <button
              onClick={onOpenInventory}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              See All Food
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
