import React from 'react';
import { CheckCircle2, Lock, ArrowLeft } from 'lucide-react';

interface StepperProps {
  activeStage: 1 | 2 | 3;
  isStage1Complete: boolean;
  hasStage2Recommendations: boolean;
  onSelectStage: (stage: 1 | 2 | 3) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  activeStage,
  isStage1Complete,
  hasStage2Recommendations,
  onSelectStage
}) => {
  const steps = [
    {
      id: 1,
      title: 'שלב 1: איסוף נתונים ושער שלמות',
      subtitle: 'אנמנזה, STRAW+10, אינטראקציות ובדיקות עזר',
      isUnlocked: true,
      isDone: isStage1Complete
    },
    {
      id: 2,
      title: 'שלב 2: הגדרת טיפול והמלצות',
      subtitle: 'משטר HRT, ציר מתן עורי/פומי, ארסנל תרופות בישראל',
      isUnlocked: isStage1Complete,
      isDone: hasStage2Recommendations
    },
    {
      id: 3,
      title: 'שלב 3: מעקב אורכי ופתרון בעיות',
      subtitle: 'ציר זמן ביקורים, ניהול דימומים, TVS ושינוי מינונים',
      isUnlocked: isStage1Complete && hasStage2Recommendations,
      isDone: false
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 shadow-sm no-print">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step, idx) => {
            const isActive = activeStage === step.id;
            const isClickable = step.isUnlocked;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onSelectStage(step.id as 1 | 2 | 3)}
                disabled={!isClickable}
                className={`flex items-center gap-3 p-3 rounded-xl border text-right transition ${
                  isActive
                    ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500'
                    : isClickable
                    ? 'bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/80 cursor-pointer'
                    : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : step.isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : isClickable
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step.isDone ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : !step.isUnlocked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <span>0{step.id}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-bold truncate ${
                        isActive ? 'text-teal-900' : 'text-slate-800'
                      }`}
                    >
                      {step.title}
                    </p>
                    {isActive && (
                      <span className="text-[10px] bg-teal-200/60 text-teal-800 px-1.5 py-0.2 rounded font-semibold">
                        פעיל
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
