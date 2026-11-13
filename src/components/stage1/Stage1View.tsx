import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  Heart,
  Pill,
  Sparkles,
  HelpCircle,
  AlertOctagon,
  ArrowLeft
} from 'lucide-react';
import { Stage1Data, CompletenessGateResult } from '../../clinical-engine/types';
import { calculateStrawStage } from '../../clinical-engine/strawStaging';
import { calculateEndometrialRisk, calculateVteRisk, calculateCvdRisk } from '../../clinical-engine/riskCalculators';
import { detectDrugInteractions } from '../../clinical-engine/drugInteractions';
import { evaluateCompletenessGate } from '../../clinical-engine/completenessGate';

interface Stage1ViewProps {
  data: Stage1Data;
  onChange: (updated: Partial<Stage1Data>) => void;
  onProceedToStage2: () => void;
  onPrintPatientInstructions: () => void;
}

export const Stage1View: React.FC<Stage1ViewProps> = ({
  data,
  onChange,
  onProceedToStage2,
  onPrintPatientInstructions
}) => {
  // חישובים קליניים חיים
  const straw = calculateStrawStage(data);
  const endometrialRisk = calculateEndometrialRisk(data);
  const vteRisk = calculateVteRisk(data);
  const cvdRisk = calculateCvdRisk(data);
  const interactions = detectDrugInteractions(data);
  const gateResult = evaluateCompletenessGate(data);

  // עדכון גובה/משקל וחישוב BMI
  const handleWeightChange = (weight: number) => {
    const hM = data.heightCm / 100;
    const bmi = hM > 0 ? weight / (hM * hM) : 0;
    onChange({ weightKg: weight, bmi });
  };

  const handleHeightChange = (height: number) => {
    const hM = height / 100;
    const bmi = hM > 0 && data.weightKg > 0 ? data.weightKg / (hM * hM) : 0;
    onChange({ heightCm: height, bmi });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* כותרת שלב 1 ותיאור */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              שלב 1 מתוך 3
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              מפגש ראשון: איסוף נתונים ושער שלמות הנתונים
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            הערכה דמוגרפית, אנמנזה גינקולוגית מקיפה, סיווג STRAW+10, זיהוי אינטראקציות (בדגש על GLP-1) ושער בטיחות רפואי.
          </p>
        </div>

        {/* תגית שלב STRAW+10 מחושבת בלייב */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100/70 border border-teal-200 rounded-xl p-3 shrink-0 text-right">
          <div className="text-[11px] font-semibold text-teal-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>סיווג STRAW+10 נוכחי:</span>
          </div>
          <div className="font-bold text-sm text-teal-950 mt-0.5">
            {straw.titleHebrew}
          </div>
          <div className="text-[11px] text-teal-700 font-medium">
            שלב: {straw.stageCode}
          </div>
        </div>
      </div>

      {/* גריד טפסים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* חלק 1: דמוגרפיה ומדדים */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">1. דמוגרפיה ומדדים בסיסיים</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">שם המטופלת</label>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => onChange({ fullName: e.target.value })}
                placeholder="שם מלא"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">מזהה / ת.ז</label>
              <input
                type="text"
                value={data.patientId}
                onChange={(e) => onChange({ patientId: e.target.value })}
                placeholder="מזהה פנימי"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">גיל (שנים) *</label>
              <input
                type="number"
                value={data.age || ''}
                onChange={(e) => onChange({ age: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 font-semibold text-teal-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">גובה (ס"מ)</label>
              <input
                type="number"
                value={data.heightCm || ''}
                onChange={(e) => handleHeightChange(parseFloat(e.target.value) || 0)}
                placeholder="165"
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">משקל (ק"ג)</label>
              <input
                type="number"
                value={data.weightKg || ''}
                onChange={(e) => handleWeightChange(parseFloat(e.target.value) || 0)}
                placeholder="68"
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">BMI מחושב</label>
              <div className={`p-2 rounded-lg text-xs font-bold border ${
                data.bmi >= 30 ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}>
                {data.bmi > 0 ? `${data.bmi.toFixed(1)} kg/m²` : '---'}
                {data.bmi >= 30 && <span className="text-[10px] block font-normal text-amber-700">השמנה (מעבר לעורי)</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ל"ד סיסטולי (mmHg)</label>
              <input
                type="number"
                value={data.bpSystolic || ''}
                onChange={(e) => onChange({ bpSystolic: parseInt(e.target.value) || 0 })}
                placeholder="120"
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ל"ד דיאסטולי (mmHg)</label>
              <input
                type="number"
                value={data.bpDiastolic || ''}
                onChange={(e) => onChange({ bpDiastolic: parseInt(e.target.value) || 0 })}
                placeholder="80"
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">עיסוק</label>
              <input
                type="text"
                value={data.occupation}
                onChange={(e) => onChange({ occupation: e.target.value })}
                placeholder="משלח יד"
                className="w-full text-xs p-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* הרגלים */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.isSmoker}
                onChange={(e) => onChange({ isSmoker: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="text-slate-800 font-medium">מעשנת פעילה</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.exerciseRegular}
                onChange={(e) => onChange({ exerciseRegular: e.target.checked })}
                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
              />
              <span className="text-slate-800 font-medium">פעילות גופנית סדירה</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-slate-700">אלכוהול (מנות/שבוע):</span>
              <input
                type="number"
                value={data.alcoholUnitsPerWeek || 0}
                onChange={(e) => onChange({ alcoholUnitsPerWeek: parseInt(e.target.value) || 0 })}
                className="w-14 text-xs p-1 border rounded"
              />
            </div>
          </div>
        </div>

        {/* חלק 2: דפוס דימומים נוכחי ו-STRAW */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Heart className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">2. דפוס דימומים ושלב STRAW+10</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                דפוס המחזורים ב-12 החודשים האחרונים:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { id: 'REGULAR', label: 'סדירים ללא שינוי מובהק' },
                  { id: 'VARIATION_OVER_7_DAYS', label: 'שוני מתמיד של ≥7 ימים באורך המחזור' },
                  { id: 'SKIPPED_OVER_60_DAYS', label: 'אל-ווסת של ≥60 יום (דילוג על 2 מחזורים)' },
                  { id: 'AMENORRHEA_OVER_12_MONTHS', label: 'היעדר ווסת מעל 12 חודשים רצופים' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange({ cyclePattern: item.id as any })}
                    className={`p-2.5 rounded-xl border text-right font-medium transition ${
                      data.cyclePattern === item.id
                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-medium text-slate-700 mb-1">תאריך ווסת אחרונה (FMP/LMP)</label>
                <input
                  type="date"
                  value={data.lastPeriodDate}
                  onChange={(e) => onChange({ lastPeriodDate: e.target.value })}
                  className="w-full p-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">עוצמת הדימומים כיום</label>
                <select
                  value={data.bleedingIntensity}
                  onChange={(e) => onChange({ bleedingIntensity: e.target.value as any })}
                  className="w-full p-2 border rounded-lg text-xs"
                >
                  <option value="NORMAL">רגילה / תקינה</option>
                  <option value="LIGHT">קלה / הכתמות מועטות</option>
                  <option value="HEAVY">כבדה מוגברת (סכנת אנמיה)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.hadHysterectomy}
                  onChange={(e) => onChange({ hadHysterectomy: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">כריתת רחם בעבר (ללא רחם)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.hadRrso}
                  onChange={(e) => onChange({ hadRrso: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">כריתת שחלות מניעתית (RRSO)</span>
              </label>
            </div>

            {/* הסבר קליני על השלב */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700">
              <span className="font-bold text-slate-900">השלכה קלינית: </span>
              {straw.clinicalImplicationsHebrew}
            </div>
          </div>
        </div>

        {/* חלק 3: אנמנזה מיילדותית ורקע משפחתי/גנטי */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">3. אנמנזה מיילדותית וגנטית</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-700 mb-1">הריונות (G)</label>
                <input
                  type="number"
                  value={data.gravida || 0}
                  onChange={(e) => onChange({ gravida: parseInt(e.target.value) || 0 })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">לידות (P)</label>
                <input
                  type="number"
                  value={data.para || 0}
                  onChange={(e) => onChange({ para: parseInt(e.target.value) || 0 })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1">הפלות (Ab)</label>
                <input
                  type="number"
                  value={data.abortions || 0}
                  onChange={(e) => onChange({ abortions: parseInt(e.target.value) || 0 })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="font-medium text-slate-700">סיבוכי הריון בעבר (סמני סיכון קרדיווסקולרי עתידי):</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hadGestationalDiabetes}
                    onChange={(e) => onChange({ hadGestationalDiabetes: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>סוכרת הריונית (GDM)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hadGestationalHtn}
                    onChange={(e) => onChange({ hadGestationalHtn: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>יתר לחץ דם בהריון</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hadPreeclampsia}
                    onChange={(e) => onChange({ hadPreeclampsia: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>רעלת הריון (Preeclampsia)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hadPretermDelivery}
                    onChange={(e) => onChange({ hadPretermDelivery: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>לידה מוקדמת</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="font-medium text-slate-700">רקע משפחתי וגנטי:</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.familyVte}
                    onChange={(e) => onChange({ familyVte: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>קרישיות יתר / VTE במשפחה</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.familyOsteoporosis}
                    onChange={(e) => onChange({ familyOsteoporosis: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>אוסטאופורוזיס / שברי ירך</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.familyCvd}
                    onChange={(e) => onChange({ familyCvd: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>מחלות לב מוקדמות במשפחה</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hadEndometriosis}
                    onChange={(e) => onChange({ hadEndometriosis: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span className="font-semibold text-rose-800">היסטוריה של אנדומטריוזיס</span>
                </label>
              </div>
            </div>

            {/* סקר BRCA ולינץ' */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-700 mb-1">סטטוס סקר מוטציות BRCA1/2</label>
                <select
                  value={data.brcaStatus}
                  onChange={(e) => onChange({ brcaStatus: e.target.value as any })}
                  className="w-full p-1.5 border rounded text-xs"
                >
                  <option value="NEGATIVE">נבדקה – שלילית למוטציה</option>
                  <option value="BRCA1">נשאית מוטציית BRCA1</option>
                  <option value="BRCA2">נשאית מוטציית BRCA2</option>
                  <option value="NOT_TESTED">לא נבדקה (לפי זכאות)</option>
                  <option value="UNKNOWN">לא ידוע</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">תסמונת לינץ' (Lynch / Cowden)</label>
                <select
                  value={data.lynchSyndrome ? 'YES' : 'NO'}
                  onChange={(e) => onChange({ lynchSyndrome: e.target.value === 'YES' })}
                  className="w-full p-1.5 border rounded text-xs"
                >
                  <option value="NO">שלילית / ללא סיפור משפחתי</option>
                  <option value="YES">נשאית ידועה (גורם מג'ורי לרירית)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* חלק 4: סריקת תסמינים (Symptoms Scan) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">4. סריקת תסמיני גיל המעבר</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                חומרת תסמינים וזומוטוריים (VMS - גלי חום והזעות לילה):
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'NONE', label: 'ללא' },
                  { id: 'MILD', label: 'קלים (1-2 ליום)' },
                  { id: 'MODERATE', label: 'בינוניים (3-5)' },
                  { id: 'SEVERE', label: 'חמורים (≥6 ביום)' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange({ vmsSeverity: s.id as any })}
                    className={`p-2 rounded-lg border text-center font-medium transition ${
                      data.vmsSeverity === s.id
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-1 ring-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={data.hasNightSweats}
                  onChange={(e) => onChange({ hasNightSweats: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>הזעות לילה והפרעות שינה</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={data.hasPalpitations}
                  onChange={(e) => onChange({ hasPalpitations: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>דפיקות לב (Palpitations)</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="font-semibold text-slate-800">תסמונת גניטואורינרית (GSM) ומיניות:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hasVaginalDryness}
                    onChange={(e) => onChange({ hasVaginalDryness: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>יובש בנרתיק</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hasDyspareunia}
                    onChange={(e) => onChange({ hasDyspareunia: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>כאב ביחסי מין</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hasRecurrentUtis}
                    onChange={(e) => onChange({ hasRecurrentUtis: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>דלקות שתן חוזרות</span>
                </label>
              </div>

              <div className="pt-1">
                <label className="block text-slate-700 mb-1">שינוי בחשק המיני (Libido):</label>
                <select
                  value={data.libidoChange}
                  onChange={(e) => onChange({ libidoChange: e.target.value as any })}
                  className="w-full p-2 border rounded-lg text-xs"
                >
                  <option value="NORMAL">ללא שינוי מיוחד</option>
                  <option value="DECREASED">ירידה בחשק המיני (מועדף עורי לשמירת SHBG)</option>
                  <option value="ABSENT">היעדר חשק מוחלט / מצוקה (שקילת טסטוסטרון)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <p className="font-semibold text-slate-800">קוגניציה, מצב רוח ושריר-שלד:</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hasBrainFog}
                    onChange={(e) => onChange({ hasBrainFog: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>ערפול מוחי ("Brain Fog") וקשיי שליפה</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hasRageOrShortFuse}
                    onChange={(e) => onChange({ hasRageOrShortFuse: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>פתיל קצר, התפרצויות זעם או חרדה</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={data.hasJointMusculoskeletalPain}
                    onChange={(e) => onChange({ hasJointMusculoskeletalPain: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>כאבי מפרקים ושרירים</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* חלק 5: אינטראקציות תרופתיות והתוויות נגד (מדגיש GLP-1) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Pill className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-base">5. תרופות קבועות, אינטראקציות והתוויות נגד</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* עמודת תרופות ואינטראקציות */}
          <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <h4 className="font-bold text-purple-900 text-sm">זיהוי תרופות בעלות אינטראקציה עם HRT</h4>

            <label className="flex items-start gap-3 p-2 bg-white rounded-lg border border-purple-200 cursor-pointer shadow-sm">
              <input
                type="checkbox"
                checked={data.takingGlp1}
                onChange={(e) => onChange({ takingGlp1: e.target.checked })}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-purple-950 block">נוטלת אנלוגים ל-GLP-1 / GIP (אוזמפיק, וויגובי, מונג'רו)</span>
                <span className="text-[11px] text-purple-800">
                  עיכוב ריקון קיבה מפחית ספיגת פרוגסטרון פומי ⬅️ העדפת מירנה / מדבקה משולבת.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 bg-white rounded-lg border border-purple-200 cursor-pointer shadow-sm">
              <input
                type="checkbox"
                checked={data.takingEnzymeInducers}
                onChange={(e) => onChange({ takingEnzymeInducers: e.target.checked })}
                className="rounded text-purple-600 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-purple-950 block">משרני אנזימי כבד (קרבמזפין, פניטואין, ריפמפיצין)</span>
                <span className="text-[11px] text-purple-800">מאיצים פירוק כבדי ודורשים מינונים גבוהים יותר / מתן עורי.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 bg-white rounded-lg border border-purple-200 cursor-pointer shadow-sm">
              <input
                type="checkbox"
                checked={data.takingLevothyroxine}
                onChange={(e) => onChange({ takingLevothyroxine: e.target.checked })}
                className="rounded text-purple-600 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-purple-950 block">אלטרוקסין / יוטירוקס (Levothyroxine)</span>
                <span className="text-[11px] text-purple-800">אסטרוגן פומי מעלה TBG ומחייב מעקב TSH; מתן עורי עדיף.</span>
              </div>
            </label>
          </div>

          {/* עמודת התוויות נגד מוחלטות */}
          <div className="space-y-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
            <h4 className="font-bold text-rose-900 text-sm">התוויות נגד מוחלטות (Contraindications)</h4>

            <label className="flex items-start gap-3 p-2 bg-white rounded-lg border border-rose-200 cursor-pointer shadow-sm">
              <input
                type="checkbox"
                checked={data.historyOfBreastCancer}
                onChange={(e) => onChange({ historyOfBreastCancer: e.target.checked })}
                className="rounded text-rose-600 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-rose-950 block">סרטן שד נוכחי או בעבר</span>
                <span className="text-[11px] text-rose-800">התווית נגד מוחלטת ל-HRT סיסטמי (נפתח מסלול חלופות לא-הורמונליות בלבד).</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 bg-white rounded-lg border border-rose-200 cursor-pointer shadow-sm">
              <input
                type="checkbox"
                checked={data.uninvestigatedBleeding}
                onChange={(e) => onChange({ uninvestigatedBleeding: e.target.checked })}
                className="rounded text-rose-600 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-rose-950 block">דימום גניטלי חריג שטרם בורר</span>
                <span className="text-[11px] text-rose-800">חובה לשלול ממאירות גינקולוגית לפני כל טיפול הורמונלי!</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-2 bg-white rounded-lg border border-rose-200 cursor-pointer shadow-sm">
              <input
                type="checkbox"
                checked={data.activeVteOrThrombophilia}
                onChange={(e) => onChange({ activeVteOrThrombophilia: e.target.checked })}
                className="rounded text-rose-600 w-4 h-4 mt-0.5"
              />
              <div>
                <span className="font-bold text-rose-950 block">אירוע VTE בעבר / הפרעת קרישה תרומבופילית</span>
                <span className="text-[11px] text-rose-800">איסור על מתן פומי. מחייב ייעוץ המטולוג לפני מתן עורי.</span>
              </div>
            </label>
          </div>
        </div>

        {/* התראות אינטראקציה דינמיות */}
        {interactions.length > 0 && (
          <div className="space-y-2 pt-2">
            {interactions.map((alert, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-bold block">{alert.drugClassHebrew}</span>
                  <p className="mt-0.5">{alert.clinicalMechanismHebrew}</p>
                  <p className="font-semibold mt-1">הנחיה: {alert.actionableGuidanceHebrew}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* חלק 6: בדיקות סקר שגרה ומעבדה */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-base">6. בדיקות סקר, מעקבים ומעבדה (Completeness Gate Prerequisite)</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">סקר שד / ממוגרפיה *</label>
            <select
              value={data.mammographyStatus}
              onChange={(e) => onChange({ mammographyStatus: e.target.value as any })}
              className={`w-full p-2 border rounded-lg font-medium ${
                data.mammographyStatus === 'UP_TO_DATE_NORMAL'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              <option value="UP_TO_DATE_NORMAL">מעודכנת ותקינה (בשנתיים האחרונות)</option>
              <option value="OVERDUE">לא מעודכנת / עברו מעל שנתיים</option>
              <option value="ABNORMAL_SUSPECTED">ממצא חריג שדורש המשך בירור</option>
              <option value="NOT_PERFORMED">מעולם לא בוצעה</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">משטח צוואר הרחם (Pap / HPV)</label>
            <select
              value={data.papHpvStatus}
              onChange={(e) => onChange({ papHpvStatus: e.target.value as any })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="UP_TO_DATE_NORMAL">תקין ומעודכן לפי הנחיות</option>
              <option value="OVERDUE">לא מעודכן</option>
              <option value="ABNORMAL">חריג (דורש קולפוסקופיה)</option>
              <option value="NOT_PERFORMED">לא בוצע</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">ספירת דם (CBC) ומאגרי ברזל</label>
            <select
              value={data.cbcStatus}
              onChange={(e) => onChange({ cbcStatus: e.target.value as any })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="NORMAL">תקינה (המוגלובין ופריטין תקינים)</option>
              <option value="ANEMIA">אנמיה או חסר ברזל ידוע</option>
              <option value="NOT_TESTED">לא נבדק לאחרונה</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">פרופיל שומנים וסוכר בצום</label>
            <select
              value={data.glucoseLipidsStatus}
              onChange={(e) => onChange({ glucoseLipidsStatus: e.target.value as any })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="NORMAL">תקין</option>
              <option value="ABNORMAL">דיסליפידמיה / סוכר גבולי או מוגבר</option>
              <option value="NOT_TESTED">לא נבדק</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">צפיפות עצם (DXA / FRAX)</label>
            <select
              value={data.dxaStatus}
              onChange={(e) => onChange({ dxaStatus: e.target.value as any })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="NORMAL">תקינה (T-score > -1.0)</option>
              <option value="OSTEOPENIA">אוסטאופניה (-1.0 עד -2.5)</option>
              <option value="OSTEOPOROSIS">אוסטאופורוזיס (T-score ≤ -2.5)</option>
              <option value="NOT_PERFORMED">טרם בוצעה בדיקה</option>
            </select>
          </div>

          {data.age < 40 && (
            <div>
              <label className="block font-medium text-slate-700 mb-1">רמת FSH מעבדתית (לחשד ל-POI)</label>
              <input
                type="number"
                value={data.fshLevel || ''}
                onChange={(e) => onChange({ fshLevel: parseFloat(e.target.value) || 0 })}
                placeholder="למשל 45 IU/L"
                className="w-full p-2 border rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* 🛑 / ✅ שער שלמות הנתונים (Completeness Gate Box) */}
      <div className={`rounded-2xl p-6 border shadow-sm transition ${
        gateResult.isPassed
          ? 'bg-gradient-to-l from-emerald-50 to-teal-50 border-emerald-300'
          : 'bg-gradient-to-l from-rose-50 to-amber-50 border-rose-300'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {gateResult.isPassed ? (
              <CheckCircle className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`text-base font-bold ${gateResult.isPassed ? 'text-emerald-950' : 'text-rose-950'}`}>
                {gateResult.isPassed
                  ? '✅ שער שלמות הנתונים אושר! ניתן לעבור לשלב 2 (הגדרת טיפול)'
                  : '🛑 שער שלמות הנתונים חסום: חסרים בירורים או בדיקות חיוניות'}
              </h3>
              <p className="text-xs text-slate-700 mt-1 max-w-3xl">
                {gateResult.isPassed
                  ? 'כל המדדים הקליניים, בדיקות הסקר וסיווגי הסיכון הושלמו ותקינים. המערכת מוכנה להפיק המלצת טיפול מותאמת אישית.'
                  : 'לפני התחלת טיפול הורמונלי, יש לוודא שלילת פתולוגיות והשלמת בדיקות סקר עדכניות להבטחת בטיחות המטופלת.'}
              </p>

              {/* רשימת הסיבות לחסימה */}
              {!gateResult.isPassed && (
                <ul className="mt-3 space-y-1 text-xs text-rose-900 list-disc list-inside font-medium bg-white/70 p-3 rounded-xl border border-rose-200">
                  {gateResult.blockingReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!gateResult.isPassed && (
              <button
                type="button"
                onClick={onPrintPatientInstructions}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-rose-700 border border-rose-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>הדפס דף הנחיות להשלמת בדיקות</span>
              </button>
            )}

            {gateResult.isPassed && (
              <button
                type="button"
                onClick={onProceedToStage2}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow transition"
              >
                <span>המשך לשלב 2: הגדרת טיפול והמלצות</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
