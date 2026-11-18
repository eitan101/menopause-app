import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  HeartPulse,
  Info,
  Pill,
  Plus,
  Printer,
  ShieldAlert,
  Sliders,
  Sparkles,
  Stethoscope,
  Trash2,
  Users
} from 'lucide-react';
import { evaluateCompletenessGate } from '../../clinical-engine/completenessGate';
import { checkDrugInteractions } from '../../clinical-engine/drugInteractions';
import {
  IMS_19_SYMPTOM_ITEMS,
  IMS_SYMPTOM_DOMAINS,
  ImsSymptomDomainId,
  SCORE_LABELS_FREQUENCY,
  SCORE_LABELS_IMPORTANCE,
  SCORE_LABELS_SEVERITY,
  createEmptySymptomsMap,
  getSymptomEntry,
  summarizeSymptoms
} from '../../clinical-engine/imsSymptoms';
import {
  calculateAhaPreventRisk,
  calculateBoneRisk,
  calculateEndometrialRisk,
  calculateVteRisk
} from '../../clinical-engine/riskCalculators';
import { evaluateContraceptionAndMirena, evaluateSTRAWStage } from '../../clinical-engine/strawStaging';
import {
  ContraceptionMethod,
  CyclePattern,
  MedicalHistoryHierarchical,
  MedicationHistoryHierarchical,
  PriorFailedTreatment,
  Score0To4,
  ScreeningStatus,
  Stage1Data
} from '../../clinical-engine/types';

interface Stage1ViewProps {
  data: Stage1Data;
  onChange: (updated: Partial<Stage1Data>) => void;
  onProceedToStage2: () => void;
  onPrintPatientInstructions: () => void;
}

const PRIOR_TREATMENT_LABELS: Record<PriorFailedTreatment['treatmentKey'], string> = {
  ESTROGEL_SANDRENA: 'ג׳ל אסטרדיול (אסטרוג׳ל / סנדרנה)',
  EVOREL_PATCH: 'מדבקות אוורל / אוורל קונטי / סקווי',
  UTROGESTAN_ORAL: 'אוטרוגסטן פומי',
  MIRENA_IUS: 'התקן מירנה',
  ORAL_FEMOSTON: 'פמוסטון / פמוסטון קונטי',
  ORAL_COMBINED_NETA: 'אקטיבל / אוויאנה / נובופם / אנג׳ליק',
  VEOZA_NK3: 'ויוזה (Fezolinetant)',
  SSRI_SNRI: 'ונלפקסין / ציפרלקס / SSRI-SNRI',
  OTHER: 'טיפול אחר'
};

const FreeTextPhysicianBox: React.FC<{
  label: string;
  value: string;
  placeholder?: string;
  onChange: (val: string) => void;
}> = ({ label, value, placeholder, onChange }) => (
  <div className="mt-3 bg-slate-50/90 border border-slate-200 rounded-xl p-3">
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1.5">
      <FileText className="w-3.5 h-3.5 text-teal-600" />
      <span>{label} (לידיעת הרופא/ה – נשמר בתיק ובסיכום הרשומה):</span>
    </label>
    <textarea
      rows={2}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || 'הזן/י פרטים חופשיים, רקע נוסף או הערות קליניות...'}
      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
    />
  </div>
);

export const Stage1View: React.FC<Stage1ViewProps> = ({
  data,
  onChange,
  onProceedToStage2,
  onPrintPatientInstructions
}) => {
  const [activeSymptomDomain, setActiveSymptomDomain] = useState<'ALL' | ImsSymptomDomainId>('ALL');
  const [newFailedKey, setNewFailedKey] = useState<PriorFailedTreatment['treatmentKey']>('ORAL_FEMOSTON');
  const [newFailedReason, setNewFailedReason] = useState('');

  // חישובים קליניים חיים
  const straw = evaluateSTRAWStage(data);
  const contraEval = evaluateContraceptionAndMirena(data);
  const symSummary = summarizeSymptoms(data.symptoms);
  const prevent = calculateAhaPreventRisk(data);
  const vte = calculateVteRisk(data);
  const endoRisk = calculateEndometrialRisk(data);
  const boneRisk = calculateBoneRisk(data);
  const interactions = checkDrugInteractions(data);
  const gate = evaluateCompletenessGate(data);

  // עוזרי עדכון מקוננים
  const updateMedical = (patch: Partial<MedicalHistoryHierarchical>) => {
    onChange({ medicalHistory: { ...data.medicalHistory, ...patch } });
  };

  const updateMedications = (patch: Partial<MedicationHistoryHierarchical>) => {
    onChange({ medications: { ...data.medications, ...patch } });
  };

  const handleWeightHeightChange = (weightKg: number, heightCm: number) => {
    const heightM = heightCm > 0 ? heightCm / 100 : 1.64;
    const bmi = weightKg > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 0;
    onChange({ weightKg, heightCm, bmi });
  };

  const updateSymptomScore = (
    id: string,
    field: 'severity' | 'importance' | 'frequency',
    val: Score0To4
  ) => {
    const prev = getSymptomEntry(data.symptoms, id);
    const updated = { ...prev, [field]: val };
    // חיסכון בקליקים: אם מסמנים לראשונה עוצמה > 0 והחשיבות עדיין 0, נאתחל חשיבות לעוצמה (ניתן לשינוי חופשי!)
    if (field === 'severity' && val > 0 && prev.severity === 0 && prev.importance === 0) {
      updated.importance = val;
    }
    if (field === 'severity' && val === 0) {
      if (updated.frequency !== undefined) updated.frequency = 0;
    }
    onChange({
      symptoms: {
        ...data.symptoms,
        [id]: updated
      }
    });
  };

  const addPriorFailedTreatment = () => {
    if (!newFailedReason.trim()) return;
    const item: PriorFailedTreatment = {
      id: `failed_${Date.now()}`,
      treatmentKey: newFailedKey,
      customName: PRIOR_TREATMENT_LABELS[newFailedKey],
      reasonStopped: newFailedReason.trim()
    };
    onChange({
      preferences: {
        ...data.preferences,
        priorFailedTreatments: [...data.preferences.priorFailedTreatments, item]
      }
    });
    setNewFailedReason('');
  };

  const removePriorFailedTreatment = (id: string) => {
    onChange({
      preferences: {
        ...data.preferences,
        priorFailedTreatments: data.preferences.priorFailedTreatments.filter((p) => p.id !== id)
      }
    });
  };

  const filteredSymptoms =
    activeSymptomDomain === 'ALL'
      ? IMS_19_SYMPTOM_ITEMS
      : IMS_19_SYMPTOM_ITEMS.filter((item) => item.domainId === activeSymptomDomain);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* סרגל ניווט מהיר בין 9 פרקי שלב 1 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2.5 mb-5 shadow-sm flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
        <span className="text-slate-400 px-2">קפיצה מהירה:</span>
        {[
          { href: '#sec-demographics', label: '1. מדדים ואורח חיים' },
          { href: '#sec-straw-contra', label: '2. מחזור ואמצעי מניעה' },
          { href: '#sec-symptoms', label: `3. סימפטומים (${symSummary.activeSymptomCount}/19)` },
          { href: '#sec-comorbidities', label: '4. מחלות רקע (היררכי)' },
          { href: '#sec-medications', label: '5. תרופות (היררכי)' },
          { href: '#sec-family', label: '6. משפחה וגנטיקה' },
          { href: '#sec-prevent', label: '7. מחשבון PREVENT וסיכונים' },
          { href: '#sec-preferences', label: '8. העדפות וטיפולי עבר' },
          { href: '#sec-screening', label: '9. בדיקות סקר ומעבדה' }
        ].map((nav) => (
          <a
            key={nav.href}
            href={nav.href}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 transition"
          >
            {nav.label}
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* עמודה ראשית: 9 פרקי איסוף הנתונים (8 עמודות) */}
        <div className="lg:col-span-8 space-y-6">
          {/* ================================================================= */}
          {/* סעיף 1: דמוגרפיה, מדדים ואורח חיים */}
          {/* ================================================================= */}
          <section id="sec-demographics" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-800">1. דמוגרפיה, מדדים חיוניים ואורח חיים</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ת.ז / מזהה</label>
                <input
                  type="text"
                  value={data.patientId}
                  onChange={(e) => onChange({ patientId: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">שם המטופלת</label>
                <input
                  type="text"
                  value={data.fullName}
                  onChange={(e) => onChange({ fullName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">גיל (שנים) *</label>
                <input
                  type="number"
                  min={18}
                  max={100}
                  value={data.age || ''}
                  onChange={(e) => onChange({ age: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">מוצא (לסקר BRCA בסל)</label>
                <select
                  value={data.ethnicity}
                  onChange={(e) => onChange({ ethnicity: e.target.value as Stage1Data['ethnicity'] })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="ASHKENAZI">אשכנזי מלא</option>
                  <option value="MIXED_ASHKENAZI">אשכנזי חלקי / משולב</option>
                  <option value="SEPHARDIC_MIZRAHI">ספרדי / מזרחי</option>
                  <option value="ETHIOPIAN">יוצאת אתיופיה</option>
                  <option value="ARAB">ערבי</option>
                  <option value="OTHER">אחר</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">משקל (ק"ג)</label>
                <input
                  type="number"
                  value={data.weightKg || ''}
                  onChange={(e) => handleWeightHeightChange(Number(e.target.value), data.heightCm)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">גובה (ס"מ)</label>
                <input
                  type="number"
                  value={data.heightCm || ''}
                  onChange={(e) => handleWeightHeightChange(data.weightKg, Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">BMI (מחושב)</label>
                <div
                  className={`p-2 rounded-lg border font-bold text-center ${
                    data.bmi >= 30
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {data.bmi ? data.bmi.toFixed(1) : '-'}
                  {data.bmi >= 30 && <span className="mr-1 text-[10px]">(מחייב עורי)</span>}
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">עיסוק</label>
                <input
                  type="text"
                  value={data.occupation}
                  onChange={(e) => onChange({ occupation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ל"ד סיסטולי (mmHg)</label>
                <input
                  type="number"
                  value={data.bpSystolic || ''}
                  onChange={(e) => onChange({ bpSystolic: Number(e.target.value) })}
                  className={`w-full p-2 border rounded-lg font-semibold ${
                    data.bpSystolic >= 140 ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ל"ד דיאסטולי (mmHg)</label>
                <input
                  type="number"
                  value={data.bpDiastolic || ''}
                  onChange={(e) => onChange({ bpDiastolic: Number(e.target.value) })}
                  className={`w-full p-2 border rounded-lg font-semibold ${
                    data.bpDiastolic >= 90 ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">מנות אלכוהול/שבוע</label>
                <input
                  type="number"
                  min={0}
                  value={data.alcoholUnitsPerWeek}
                  onChange={(e) => onChange({ alcoholUnitsPerWeek: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex flex-col justify-end gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.isSmoker}
                    onChange={(e) => onChange({ isSmoker: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span className="font-semibold text-slate-700">מעשנת פעילה</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.exerciseRegular}
                    onChange={(e) => onChange({ exerciseRegular: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span className="text-slate-700">פעילות גופנית סדירה</span>
                </label>
              </div>
            </div>

            <FreeTextPhysicianBox
              label="הערות דמוגרפיה, אורח חיים והרגלים"
              value={data.demographicsLifestyleNotes}
              placeholder="למשל: עבודה במשמרות לילה, תזונה טבעונית, הפסקת עישון לפני שנתיים..."
              onChange={(val) => onChange({ demographicsLifestyleNotes: val })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 2: היסטוריה גינקולוגית, שלב STRAW+10 ואמצעי מניעה נוכחיים */}
          {/* ================================================================= */}
          <section id="sec-straw-contra" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-800">
                  2. מאפייני מחזור, שלב STRAW+10 ואמצעי מניעה נוכחיים
                </h2>
              </div>
              <span className="text-[11px] bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
                {straw.code}
              </span>
            </div>

            {/* סטטוס רחם ושחלות */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={data.hadHysterectomy}
                  onChange={(e) => onChange({ hadHysterectomy: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>עברה כריתת רחם (Hysterectomy)</span>
              </label>

              {data.hadHysterectomy && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(data.cervixConserved)}
                    onChange={(e) => onChange({ cervixConserved: e.target.checked })}
                    className="rounded text-teal-600"
                  />
                  <span>צוואר הרחם נשמר (Sub-total)</span>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={data.hadBsoOrRrso}
                  onChange={(e) => onChange({ hadBsoOrRrso: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>כריתת שחלות דו-צדדית (BSO / RRSO)</span>
              </label>

              {data.hadBsoOrRrso && (
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">גיל בעת כריתת השחלות:</label>
                  <input
                    type="number"
                    value={data.rrsoAge || ''}
                    onChange={(e) => onChange({ rrsoAge: Number(e.target.value) || undefined })}
                    className="w-24 p-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              )}
            </div>

            {!data.hadHysterectomy && !data.hadBsoOrRrso && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">דפוס מחזורים נוכחי (STRAW+10)</label>
                  <select
                    value={data.cyclePattern}
                    onChange={(e) => onChange({ cyclePattern: e.target.value as CyclePattern })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="REGULAR">מחזור סדיר (ייתכן שלב -3a עם תסמינים)</option>
                    <option value="VARIATION_OVER_7_DAYS">שינוי עקבי של ≥7 ימים באורך המחזור (-2)</option>
                    <option value="SKIPPED_OVER_60_DAYS">דילוג וסתות / אל-ווסת ≥60 יום (-1)</option>
                    <option value="AMENORRHEA_OVER_12_MONTHS">היעדר וסת מעל 12 חודשים רצופים (+1/+2)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">חודשים מווסת אחרונה</label>
                  <input
                    type="number"
                    min={0}
                    value={data.monthsSinceLastPeriod}
                    onChange={(e) => onChange({ monthsSinceLastPeriod: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">עוצמת דימום ווסתי</label>
                  <select
                    value={data.bleedingIntensity}
                    onChange={(e) =>
                      onChange({ bleedingIntensity: e.target.value as Stage1Data['bleedingIntensity'] })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="NONE">ללא וסת</option>
                    <option value="LIGHT">קל</option>
                    <option value="NORMAL">תקין / רגיל</option>
                    <option value="HEAVY">כבד / מוגבר (HMB)</option>
                  </select>
                </div>
              </div>
            )}

            {/* בלוק אמצעי מניעה נוכחיים ובקרת מירנה 5 שנים */}
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 text-xs space-y-3">
              <div className="font-bold text-teal-950 flex items-center justify-between">
                <span>אמצעי מניעה נוכחיים והגנה על רירית הרחם</span>
                <span className="text-[11px] font-semibold text-teal-700">
                  {contraEval.needsContraception ? 'נדרש אמצעי מניעה פעיל!' : 'ללא צורך במניעת הריון'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">אמצעי מניעה נוכחי</label>
                  <select
                    value={data.contraception.currentMethod}
                    onChange={(e) =>
                      onChange({
                        contraception: {
                          ...data.contraception,
                          currentMethod: e.target.value as ContraceptionMethod
                        }
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="NONE">ללא אמצעי מניעה</option>
                    <option value="MIRENA_52MG">התקן מירנה 52 מ"ג (Mirena)</option>
                    <option value="LOW_DOSE_IUS_KYLEENA">התקן מינון נמוך (Kyleena / Jaydess)</option>
                    <option value="COPPER_IUD">התקן נחושת לא-הורמונלי</option>
                    <option value="POP_SLYND_CERAZETTE">גלולות פרוגסטין בלבד (Slynd / Cerazette)</option>
                    <option value="CHC_PILL_PATCH_RING">אמצעי משולב CHC (גלולה / מדבקה / טבעת)</option>
                    <option value="BARRIER_OR_STERILIZATION">קונדום / חוצץ / קשירת חצוצרות / וזקטומיה</option>
                  </select>
                </div>

                {data.contraception.currentMethod === 'MIRENA_52MG' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      תאריך התקנת מירנה (בקרת 5 שנים ב-MHT!)
                    </label>
                    <input
                      type="date"
                      value={data.contraception.mirenaInsertionDate}
                      onChange={(e) =>
                        onChange({
                          contraception: {
                            ...data.contraception,
                            mirenaInsertionDate: e.target.value
                          }
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer pb-1">
                  <input
                    type="checkbox"
                    checked={data.contraception.sexuallyActiveWithPregnancyRisk}
                    onChange={(e) =>
                      onChange({
                        contraception: {
                          ...data.contraception,
                          sexuallyActiveWithPregnancyRisk: e.target.checked
                        }
                      })
                    }
                    className="rounded text-teal-600"
                  />
                  <span className="text-slate-700">פעילה מינית עם פוטנציאל הריון</span>
                </label>
              </div>

              <div className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-lg border border-teal-100 space-y-1">
                <p>
                  <strong>הנחיית מניעת הריון:</strong> {contraEval.contraceptionRuleHebrew}
                </p>
                {contraEval.mirenaExpiredForMhtWarning && (
                  <p className="text-rose-700 font-bold">{contraEval.mirenaExpiredForMhtWarning}</p>
                )}
                {contraEval.nonProtectiveProgestogenWarning && (
                  <p className="text-amber-800 font-bold">{contraEval.nonProtectiveProgestogenWarning}</p>
                )}
                {contraEval.chcOver50SwitchWarning && (
                  <p className="text-rose-700 font-bold">{contraEval.chcOver50SwitchWarning}</p>
                )}
              </div>
            </div>

            <FreeTextPhysicianBox
              label="הערות מחזור, גינקולוגיה ואמצעי מניעה"
              value={data.menstrualStageNotes}
              placeholder="למשל: G3P3, מועד התקנת התקן משוער, דימומים סביב ביוץ שנבדקו אצל רופא נשים..."
              onChange={(val) => onChange({ menstrualStageNotes: val })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 3: איסוף סימפטומים מובנה – שאלון האגודה הישראלית לגיל המעבר (19 פריטים) */}
          {/* ================================================================= */}
          <section id="sec-symptoms" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    3. איסוף סימפטומים ודרגת חשיבות (שאלון האגודה הישראלית לגיל המעבר – IMS)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    19 פריטים ב-6 תחומים: דרגו עוצמה (0–4) ודרגת חשיבות למטופלת (0–4) לתיעדוף הטיפול ומעקב שלב 3
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg">
                  ציון חומרה: {symSummary.totalSeverityScore}/76
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ symptoms: createEmptySymptomsMap() })}
                  className="text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 rounded border border-slate-200"
                >
                  אפס שאלון
                </button>
              </div>
            </div>

            {/* סינון מהיר לפי תחום */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                type="button"
                onClick={() => setActiveSymptomDomain('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  activeSymptomDomain === 'ALL'
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                כל 19 הפריטים
              </button>
              {IMS_SYMPTOM_DOMAINS.map((dom) => (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => setActiveSymptomDomain(dom.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    activeSymptomDomain === dom.id
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {dom.titleHebrew}
                </button>
              ))}
            </div>

            {/* טבלת 19 הפריטים */}
            <div className="space-y-2 max-h-[540px] overflow-y-auto pl-1">
              {filteredSymptoms.map((item) => {
                const entry = getSymptomEntry(data.symptoms, item.id);
                const isActive = entry.severity > 0 || entry.importance > 0;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs transition ${
                      isActive
                        ? 'bg-teal-50/40 border-teal-300'
                        : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {item.number}
                          </span>
                          <span className="font-bold text-slate-800">{item.shortTitleHebrew}</span>
                          <span className="text-[10px] text-slate-400">({item.domainHebrew})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 mr-6">{item.fullDescriptionHebrew}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        {/* עוצמה 0-4 */}
                        <div>
                          <span className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            עוצמה: {SCORE_LABELS_SEVERITY[entry.severity]}
                          </span>
                          <div className="flex gap-1">
                            {([0, 1, 2, 3, 4] as Score0To4[]).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => updateSymptomScore(item.id, 'severity', n)}
                                className={`w-6 h-6 rounded font-bold text-[11px] border transition ${
                                  entry.severity === n
                                    ? n === 0
                                      ? 'bg-slate-700 text-white border-slate-700'
                                      : 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* תדירות 0-4 עבור פריטים 1-2 */}
                        {item.hasFrequency && (
                          <div>
                            <span className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              תדירות: {SCORE_LABELS_FREQUENCY[entry.frequency || 0]}
                            </span>
                            <div className="flex gap-1">
                              {([0, 1, 2, 3, 4] as Score0To4[]).map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => updateSymptomScore(item.id, 'frequency', n)}
                                  className={`w-6 h-6 rounded font-bold text-[11px] border transition ${
                                    (entry.frequency || 0) === n
                                      ? n === 0
                                        ? 'bg-slate-700 text-white border-slate-700'
                                        : 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* דרגת חשיבות למטופלת 0-4 */}
                        <div>
                          <span className="block text-[10px] font-semibold text-rose-700 mb-0.5">
                            חשיבות: {SCORE_LABELS_IMPORTANCE[entry.importance]}
                          </span>
                          <div className="flex gap-1">
                            {([0, 1, 2, 3, 4] as Score0To4[]).map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => updateSymptomScore(item.id, 'importance', n)}
                                className={`w-6 h-6 rounded font-bold text-[11px] border transition ${
                                  entry.importance === n
                                    ? n === 0
                                      ? 'bg-slate-700 text-white border-slate-700'
                                      : 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <FreeTextPhysicianBox
              label="פירוט סימפטומים נוספים ותלונה עיקרית במילות המטופלת"
              value={data.symptomsFreeTextNotes}
              placeholder="למשל: מתעוררת 4 פעמים בלילה שטופת זיעה, שכחה מילים בישיבות הנהלה..."
              onChange={(val) => onChange({ symptomsFreeTextNotes: val })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 4: מחלות רקע רלוונטיות לקבלת החלטה – מבנה היררכי (8 קטגוריות-אב) */}
          {/* ================================================================= */}
          <section id="sec-comorbidities" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  4. מחלות רקע רלוונטיות לקבלת החלטה (בחירה היררכית)
                </h2>
                <p className="text-[11px] text-slate-500">
                  סמן/י תחילה את קטגוריית-האב הרלוונטית כדי לפתוח את תתי-האבחנות המדויקות (ולפתוח מחשבוני סיכון אוטומטית)
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* 4.1 ממאירויות ושד */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasMalignancyOrBreastHistory}
                      onChange={(e) => updateMedical({ hasMalignancyOrBreastHistory: e.target.checked })}
                      className="rounded text-rose-600 w-4 h-4"
                    />
                    <span>4.1 היסטוריה של ממאירות או נגעי שד בסיכון (סרטן שד / רחם / שחלה / DCIS)</span>
                  </div>
                  {data.medicalHistory.hasMalignancyOrBreastHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasMalignancyOrBreastHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-800">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.breastCancerHistory}
                          onChange={(e) => updateMedical({ breastCancerHistory: e.target.checked })}
                        />
                        <span>סרטן שד בעבר או בהווה (חוסם MHT סיסטמי)</span>
                      </label>
                      {data.medicalHistory.breastCancerHistory && (
                        <select
                          value={data.medicalHistory.breastCancerReceptor}
                          onChange={(e) =>
                            updateMedical({
                              breastCancerReceptor: e.target.value as MedicalHistoryHierarchical['breastCancerReceptor']
                            })
                          }
                          className="p-1.5 border rounded bg-white"
                        >
                          <option value="HR_POSITIVE">חיובי לקולטני הורמונים (ER+/PR+)</option>
                          <option value="HR_NEGATIVE">שלילי לקולטנים (Triple Negative / ER-)</option>
                          <option value="UNKNOWN">סטטוס קולטנים לא ידוע</option>
                        </select>
                      )}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.dcisOrAtypicalHyperplasia}
                          onChange={(e) => updateMedical({ dcisOrAtypicalHyperplasia: e.target.checked })}
                        />
                        <span>DCIS או Atypical Ductal/Lobular Hyperplasia (ADH/ALH)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.benignBreastBiopsyNoAtypia}
                          onChange={(e) => updateMedical({ benignBreastBiopsyNoAtypia: e.target.checked })}
                        />
                        <span>ממצא שד שפיר / ציסטות / פיברואדנומה ללא אטיפיה (אינו מונע MHT)</span>
                      </label>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">סרטן רירית הרחם / סרקומה:</label>
                        <select
                          value={data.medicalHistory.endometrialCancerHistory}
                          onChange={(e) =>
                            updateMedical({
                              endometrialCancerHistory:
                                e.target.value as MedicalHistoryHierarchical['endometrialCancerHistory']
                            })
                          }
                          className="w-full p-1.5 border rounded bg-white"
                        >
                          <option value="NONE">ללא</option>
                          <option value="EARLY_STAGE_TREATED">שלב I מוקדם Low-grade שטופל</option>
                          <option value="ADVANCED_OR_SARCOMA">שלב מתקדם או סרקומה רחמית (אסור MHT)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">סרטן שחלה בעבר:</label>
                        <select
                          value={data.medicalHistory.ovarianCancerHistory}
                          onChange={(e) =>
                            updateMedical({
                              ovarianCancerHistory:
                                e.target.value as MedicalHistoryHierarchical['ovarianCancerHistory']
                            })
                          }
                          className="w-full p-1.5 border rounded bg-white"
                        >
                          <option value="NONE">ללא</option>
                          <option value="HORMONE_SENSITIVE_SEROUS_ENDOMETRIOID">
                            רגיש להורמונים (Low-grade Serous / Endometrioid / Granulosa)
                          </option>
                          <option value="GERM_CELL_OR_MUCINOUS">שאינו תלוי-הורמונים (Mucinous / Germ Cell)</option>
                        </select>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="הערות אונקולוגיות / שנת אבחנה וטיפולים..."
                      value={data.medicalHistory.malignancyNotes}
                      onChange={(e) => updateMedical({ malignancyNotes: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* 4.2 דימום גניטלי חריג, גינקולוגיה וסיבוכי הריון */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasGynecologicalOrObstetricHistory}
                      onChange={(e) => updateMedical({ hasGynecologicalOrObstetricHistory: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>
                      4.2 דימום גניטלי חריג, מחלות גינקולוגיות וסיבוכי הריון בעבר (מעצימי סיכון CV)
                    </span>
                  </div>
                  {data.medicalHistory.hasGynecologicalOrObstetricHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasGynecologicalOrObstetricHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.uninvestigatedAbnormalBleeding}
                          onChange={(e) => updateMedical({ uninvestigatedAbnormalBleeding: e.target.checked })}
                        />
                        <span>
                          דימום פוסט-מנופאוזלי (PMB) / בין-ווסתי / לאחר מגע (PCB) שטרם בורר! (חוסם עד בירור TVS)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.hadEndometriosis}
                          onChange={(e) => updateMedical({ hadEndometriosis: e.target.checked })}
                        />
                        <span>אנדומטריוזיס (מחייב שקילת פרוגסטוגן משולב גם לאחר כריתת רחם!)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.hasFibroidsOrAdenomyosis}
                          onChange={(e) => updateMedical({ hasFibroidsOrAdenomyosis: e.target.checked })}
                        />
                        <span>שרירנים (מיומות) או אדנומיוזיס</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.hasPcosOrChronicAnovulation}
                          onChange={(e) => updateMedical({ hasPcosOrChronicAnovulation: e.target.checked })}
                        />
                        <span>שחלות פוליציסטיות (PCOS) / אל-ביוץ כרוני</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.hasPmsPmddOrPostpartumDepression}
                          onChange={(e) => updateMedical({ hasPmsPmddOrPostpartumDepression: e.target.checked })}
                        />
                        <span>רגישות הורמונלית: PMS / PMDD / דיכאון אחרי לידה</span>
                      </label>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">היפרפלזיה של רירית הרחם:</label>
                        <select
                          value={data.medicalHistory.endometrialHyperplasiaHistory}
                          onChange={(e) =>
                            updateMedical({
                              endometrialHyperplasiaHistory:
                                e.target.value as MedicalHistoryHierarchical['endometrialHyperplasiaHistory']
                            })
                          }
                          className="w-full p-1.5 border rounded bg-white"
                        >
                          <option value="NONE">ללא</option>
                          <option value="TREATED_WITHOUT_ATYPIA">היפרפלזיה ללא אטיפיה שטופלה ונסוגה</option>
                          <option value="ATYPICAL_OR_UNRESOLVED">היפרפלזיה אטיפית (EIN) או בלתי פתורה (גורם מז׳ורי!)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                        <span className="block font-bold text-slate-700 mb-1.5">
                          סיבוכי הריון בעבר (מעצימי סיכון קרדיו-וסקולריים נשיים – פותחים PREVENT אוטומטית):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.medicalHistory.hadPreeclampsia}
                              onChange={(e) => updateMedical({ hadPreeclampsia: e.target.checked })}
                            />
                            <span>רעלת הריון</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.medicalHistory.hadGestationalHtn}
                              onChange={(e) => updateMedical({ hadGestationalHtn: e.target.checked })}
                            />
                            <span>יל"ד הריוני</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.medicalHistory.hadGestationalDiabetes}
                              onChange={(e) => updateMedical({ hadGestationalDiabetes: e.target.checked })}
                            />
                            <span>סוכרת הריונית</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.medicalHistory.hadPretermDelivery}
                              onChange={(e) => updateMedical({ hadPretermDelivery: e.target.checked })}
                            />
                            <span>לידה מוקדמת</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4.3 הפרעות קרישה ו-VTE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasCoagulationOrVteHistory}
                      onChange={(e) => updateMedical({ hasCoagulationOrVteHistory: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>4.3 הפרעות קרישה, טרומבופיליה ופקקת ורידית (DVT / PE)</span>
                  </div>
                  {data.medicalHistory.hasCoagulationOrVteHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasCoagulationOrVteHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.activeAcuteVte}
                          onChange={(e) => updateMedical({ activeAcuteVte: e.target.checked })}
                        />
                        <span>פקקת ורידים / תסחיף ריאתי פעיל כעת (Active DVT/PE – חוסם MHT)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.pastUnprovokedVte}
                          onChange={(e) => updateMedical({ pastUnprovokedVte: e.target.checked })}
                        />
                        <span>אירוע VTE ספונטני (Unprovoked) בעבר (עורי בלבד + המטולוג)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.pastProvokedVte}
                          onChange={(e) => updateMedical({ pastProvokedVte: e.target.checked })}
                        />
                        <span>אירוע VTE בעבר סביב טריגר חולף (ניתוח/הריון/גלולות – עורי בלבד)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.knownThrombophilia}
                          onChange={(e) => updateMedical({ knownThrombophilia: e.target.checked })}
                        />
                        <span>טרומבופיליה ידועה (Factor V Leiden / Prothrombin / Prot C,S / AT)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.superficialThrombophlebitisOrVaricose}
                          onChange={(e) =>
                            updateMedical({ superficialThrombophlebitisOrVaricose: e.target.checked })
                          }
                        />
                        <span>טרומבופלביטיס שטחית בעבר או דליות ורידים בולטות</span>
                      </label>
                    </div>
                    {data.medicalHistory.knownThrombophilia && (
                      <input
                        type="text"
                        placeholder="פרט/י סוג הטרומבופיליה (הטרוזיגוט / הומוזיגוט)..."
                        value={data.medicalHistory.thrombophiliaDetails}
                        onChange={(e) => updateMedical({ thrombophiliaDetails: e.target.value })}
                        className="w-full p-2 border border-slate-200 rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* 4.4 לב, כלי דם ומטבוליזם */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasCardiovascularOrMetabolicHistory}
                      onChange={(e) => updateMedical({ hasCardiovascularOrMetabolicHistory: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>4.4 מחלות לב, כלי דם, יתר לחץ דם, סוכרת ושומנים בדם (פותח מחשבון PREVENT)</span>
                  </div>
                  {data.medicalHistory.hasCardiovascularOrMetabolicHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasCardiovascularOrMetabolicHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.activeOrRecentArterialEvent}
                          onChange={(e) => updateMedical({ activeOrRecentArterialEvent: e.target.checked })}
                        />
                        <span>אירוע עורקי חריף/לא יציב (MI / תעוקת חזה / CVA / TIA – חוסם MHT)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.stabilizedRemotePostMi}
                          onChange={(e) => updateMedical({ stabilizedRemotePostMi: e.target.checked })}
                        />
                        <span>מצב יציב ומאוזן לאחר אוטם לב בעבר (BMS 2024 – עורי נמוך בתיאום קרדיולוגי)</span>
                      </label>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">סטטוס יתר לחץ דם:</label>
                        <select
                          value={data.medicalHistory.hypertensionStatus}
                          onChange={(e) =>
                            updateMedical({
                              hypertensionStatus: e.target.value as MedicalHistoryHierarchical['hypertensionStatus']
                            })
                          }
                          className="w-full p-1.5 border rounded bg-white"
                        >
                          <option value="NONE">ללא יתר לחץ דם</option>
                          <option value="CONTROLLED">יתר ל"ד מאוזן</option>
                          <option value="UNCONTROLLED">יתר ל"ד לא מאוזן (140–179/90–109)</option>
                          <option value="SEVERE_OVER_180_110">משבר יל"ד חמור ≥180/110 (חוסם עד ייצוב!)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">סוכרת / טרום-סוכרת:</label>
                        <select
                          value={data.medicalHistory.diabetesStatus}
                          onChange={(e) =>
                            updateMedical({
                              diabetesStatus: e.target.value as MedicalHistoryHierarchical['diabetesStatus']
                            })
                          }
                          className="w-full p-1.5 border rounded bg-white"
                        >
                          <option value="NONE">ללא</option>
                          <option value="PREDIABETES">טרום-סוכרת / תנגודת לאינסולין</option>
                          <option value="DIABETES">סוכרת מסוג 1 או 2 (מתן עורי מועדף)</option>
                        </select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.dyslipidemia}
                          onChange={(e) => updateMedical({ dyslipidemia: e.target.checked })}
                        />
                        <span>היפרכולסטרולמיה / דיסליפידמיה</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-800">
                        <input
                          type="checkbox"
                          checked={data.medicalHistory.hypertriglyceridemiaOver200}
                          onChange={(e) => updateMedical({ hypertriglyceridemiaOver200: e.target.checked })}
                        />
                        <span>היפרטריגליצרידמיה (TG ≥ 200 mg/dL – מחייב אסטרוגן עורי בלבד!)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* 4.5 כבד, מרה, כליות ומערכת העיכול */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasHepaticRenalGiHistory}
                      onChange={(e) => updateMedical({ hasHepaticRenalGiHistory: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>4.5 מחלות כבד, כיס מרה, כליות ומערכת העיכול / ניתוח בריאטרי</span>
                  </div>
                  {data.medicalHistory.hasHepaticRenalGiHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasHepaticRenalGiHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.activeLiverDiseaseOrPorphyria}
                        onChange={(e) => updateMedical({ activeLiverDiseaseOrPorphyria: e.target.checked })}
                      />
                      <span>מחלת כבד פעילה עם אנזימים מוגברים או פורפיריה (חוסם MHT וויוזה)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.fattyLiverOrGallstones}
                        onChange={(e) => updateMedical({ fattyLiverOrGallstones: e.target.checked })}
                      />
                      <span>כבד שומני (MASLD) או אבני מרה (מחייב אסטרדיול עורי)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.chronicKidneyDiseaseOrSolitaryKidney}
                        onChange={(e) =>
                          updateMedical({ chronicKidneyDiseaseOrSolitaryKidney: e.target.checked })
                        }
                      />
                      <span>אי-ספיקת כליות כרונית (CKD) או כליה בודדת (חוסם Angeliq + פותח PREVENT)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.malabsorptionOrBariatricSurgery}
                        onChange={(e) => updateMedical({ malabsorptionOrBariatricSurgery: e.target.checked })}
                      />
                      <span>ניתוח בריאטרי או תת-ספיגה במעי (מחייב עורי + מירנה/מדבקה)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 4.6 נוירולוגיה ומיגרנה */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasNeurologicalHistory}
                      onChange={(e) => updateMedical({ hasNeurologicalHistory: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>4.6 נוירולוגיה ומיגרנה (אאורה, אפילפסיה, מנינגיומה)</span>
                  </div>
                  {data.medicalHistory.hasNeurologicalHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasNeurologicalHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.migraineWithAura}
                        onChange={(e) => updateMedical({ migraineWithAura: e.target.checked })}
                      />
                      <span>מיגרנה עם אאורה (אסור אסטרוגן פומי! מתן עורי יציב מותר)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.migraineWithoutAura}
                        onChange={(e) => updateMedical({ migraineWithoutAura: e.target.checked })}
                      />
                      <span>מיגרנה ללא אאורה (מתן עורי מועדף למניעת תנודות)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.epilepsy}
                        onChange={(e) => updateMedical({ epilepsy: e.target.checked })}
                      />
                      <span>אפילפסיה (לבדוק למוטריג׳ין / משרני אנזימים בסעיף 5!)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.meningiomaHistory}
                        onChange={(e) => updateMedical({ meningiomaHistory: e.target.checked })}
                      />
                      <span>מנינגיומה (להימנע מפרוגסטוגנים סיסטמיים!)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 4.7 אנדוקרינולוגיה, עצם ואוטואימוניות */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasEndocrineBoneAutoimmuneHistory}
                      onChange={(e) => updateMedical({ hasEndocrineBoneAutoimmuneHistory: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>4.7 בלוטת התריס, צפיפות עצם ומחלות אוטואימוניות (RA / IBD / לופוס)</span>
                  </div>
                  {data.medicalHistory.hasEndocrineBoneAutoimmuneHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasEndocrineBoneAutoimmuneHistory && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">הפרעה בבלוטת התריס:</label>
                      <select
                        value={data.medicalHistory.thyroidDisorder}
                        onChange={(e) =>
                          updateMedical({
                            thyroidDisorder: e.target.value as MedicalHistoryHierarchical['thyroidDisorder']
                          })
                        }
                        className="w-full p-1.5 border rounded bg-white"
                      >
                        <option value="NONE">ללא</option>
                        <option value="HYPOTHYROID">תת-פעילות בלוטת התריס (Hypothyroidism)</option>
                        <option value="HYPERTHYROID">יתר פעילות בלוטת התריס (עשוי לחקות גלי חום!)</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.osteoporosisOrFragilityFracture}
                        onChange={(e) => updateMedical({ osteoporosisOrFragilityFracture: e.target.checked })}
                      />
                      <span>אוסטיאופורוזיס או שבר פריכות בעבר</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.autoimmuneDiseaseRaIbdSle}
                        onChange={(e) => updateMedical({ autoimmuneDiseaseRaIbdSle: e.target.checked })}
                      />
                      <span>מחלה דלקתית/אוטואימונית (RA / קרוהן / קוליטיס – מעצים סיכון CV ועצם)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.sleActiveOrAplaPositive}
                        onChange={(e) => updateMedical({ sleActiveOrAplaPositive: e.target.checked })}
                      />
                      <span>לופוס (SLE) פעיל או נוגדני APLA חיוביים (חוסם MHT סיסטמי)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 4.8 אלרגיות ורגישויות (בוטנים/סויה ומדבקות) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medicalHistory.hasAllergiesOrSensitivities}
                      onChange={(e) => updateMedical({ hasAllergiesOrSensitivities: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>4.8 רגישויות ואלרגיות (בוטנים / סויה / דבק מדבקות / תרופות)</span>
                  </div>
                  {data.medicalHistory.hasAllergiesOrSensitivities ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medicalHistory.hasAllergiesOrSensitivities && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.peanutOrSoyAllergy}
                        onChange={(e) => updateMedical({ peanutOrSoyAllergy: e.target.checked })}
                      />
                      <span>אלרגיה לבוטנים או סויה (התווית נגד מוחלטת לאוטרוגסטן! מעבר אוטומטי לדופסטון/מירנה)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medicalHistory.patchAdhesiveSensitivity}
                        onChange={(e) => updateMedical({ patchAdhesiveSensitivity: e.target.checked })}
                      />
                      <span>רגישות עורית לדבק מדבקות (תיעדוף ג׳ל אסטרוג׳ל/סנדרנה)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="אלרגיות לתרופות אחרות..."
                      value={data.medicalHistory.otherDrugAllergies}
                      onChange={(e) => updateMedical({ otherDrugAllergies: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <FreeTextPhysicianBox
              label="מחלות רקע אחרות וניתוחים בעבר (שאינם ברשימה לעיל)"
              value={data.medicalHistory.otherBackgroundConditionsFreeText}
              placeholder="למשל: אסתמה קלה, פיברומיאלגיה, תסמונת המעי הרגיז, ניתוח בקע..."
              onChange={(val) => updateMedical({ otherBackgroundConditionsFreeText: val })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 5: תרופות קבועות ואינטראקציות – מבנה היררכי (6 קטגוריות-אב) */}
          {/* ================================================================= */}
          <section id="sec-medications" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <Pill className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  5. תרופות קבועות ואינטראקציות רלוונטיות (בחירה היררכית)
                </h2>
                <p className="text-[11px] text-slate-500">
                  סמן/י קבוצת תרופות לפתיחת התרופות הספציפיות המשפיעות על ספיגה, מינון ובטיחות
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* 5.1 GLP-1 וסוכרת */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medications.hasGlp1OrMetabolicMeds}
                      onChange={(e) => updateMedications({ hasGlp1OrMetabolicMeds: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>5.1 זריקות GLP-1 / GIP (אוזמפיק / וויגובי / מונג׳רו) ותרופות לסוכרת</span>
                  </div>
                  {data.medications.hasGlp1OrMetabolicMeds ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medications.hasGlp1OrMetabolicMeds && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={data.medications.takingGlp1}
                        onChange={(e) => updateMedications({ takingGlp1: e.target.checked })}
                      />
                      <span>מטופלת ב-GLP-1 / GIP (פוגע בספיגת פרוגסטוגן פומי – להעדיף מירנה / מדבקה!)</span>
                    </label>
                    {data.medications.takingGlp1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="שם התכשיר והמינון (למשל Mounjaro 7.5mg)..."
                          value={data.medications.glp1DrugDetails}
                          onChange={(e) => updateMedications({ glp1DrugDetails: e.target.value })}
                          className="p-2 border rounded-lg"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={data.medications.glp1RecentInitOrDoseEscalation}
                            onChange={(e) =>
                              updateMedications({ glp1RecentInitOrDoseEscalation: e.target.checked })
                            }
                          />
                          <span>התחלה / עליית מינון ב-4 השבועות האחרונים</span>
                        </label>
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingMetforminOrInsulinOrSglt2}
                        onChange={(e) => updateMedications({ takingMetforminOrInsulinOrSglt2: e.target.checked })}
                      />
                      <span>מטפורמין / SGLT2 / אינסולין</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 5.2 נוירולוגיה ואנטי-אפילפטיות */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medications.hasNeuroAntiepilepticMeds}
                      onChange={(e) => updateMedications({ hasNeuroAntiepilepticMeds: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>5.2 למוטריג׳ין (Lamictal) ומשרני אנזימי כבד (אנטי-אפילפטיות / היפריקום)</span>
                  </div>
                  {data.medications.hasNeuroAntiepilepticMeds ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medications.hasNeuroAntiepilepticMeds && (
                  <div className="p-3.5 bg-white border-t border-slate-200 space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medications.takingLamotrigine}
                        onChange={(e) => updateMedications({ takingLamotrigine: e.target.checked })}
                      />
                      <span>למוטריג׳ין (Lamotrigine): אסטרוגן פומי מוריד רמה בעד 50%! חובה מתן עורי בלבד!</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingEnzymeInducers}
                        onChange={(e) => updateMedications({ takingEnzymeInducers: e.target.checked })}
                      />
                      <span>משרני CYP3A4 (Carbamazepine / Phenytoin / Topiramate / Rifampicin / St John's Wort)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 5.3 אונקולוגיה / אנדוקריני */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medications.hasOncologicEndocrineMeds}
                      onChange={(e) => updateMedications({ hasOncologicEndocrineMeds: e.target.checked })}
                      className="rounded text-rose-600 w-4 h-4"
                    />
                    <span>5.3 טיפול אנדוקריני אונקולוגי (טמוקסיפן / מעכבי ארומטאז / דיכוי שחלתי)</span>
                  </div>
                  {data.medications.hasOncologicEndocrineMeds ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medications.hasOncologicEndocrineMeds && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medications.takingTamoxifen}
                        onChange={(e) => updateMedications({ takingTamoxifen: e.target.checked })}
                      />
                      <span>טמוקסיפן (Tamoxifen – אוסר גם Paroxetine/Fluoxetine!)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                      <input
                        type="checkbox"
                        checked={data.medications.takingAromataseInhibitors}
                        onChange={(e) => updateMedications({ takingAromataseInhibitors: e.target.checked })}
                      />
                      <span>מעכבי ארומטאז (Letrozole / Anastrozole / Exemestane)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 5.4 בלוטת התריס וסטרואידים */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medications.hasThyroidOrSteroidMeds}
                      onChange={(e) => updateMedications({ hasThyroidOrSteroidMeds: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>5.4 אלטרוקסין / יותירוקס וקורטיקוסטרואידים סיסטמיים</span>
                  </div>
                  {data.medications.hasThyroidOrSteroidMeds ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medications.hasThyroidOrSteroidMeds && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingLevothyroxine}
                        onChange={(e) => updateMedications({ takingLevothyroxine: e.target.checked })}
                      />
                      <span>נוטלת Levothyroxine</span>
                    </label>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        ערך TSH אחרון (mIU/L):
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        placeholder="למשל 1.8 (אם <0.4 מחקה גלי חום!)"
                        value={data.medications.recentTshLevel ?? ''}
                        onChange={(e) =>
                          updateMedications({
                            recentTshLevel: e.target.value !== '' ? Number(e.target.value) : undefined
                          })
                        }
                        className="w-full p-1.5 border rounded"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingSystemicCorticosteroids}
                        onChange={(e) => updateMedications({ takingSystemicCorticosteroids: e.target.checked })}
                      />
                      <span>סטרואידים סיסטמיים קבועים (סיכון עצם)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 5.5 לב, ל"ד, סטטינים ונוגדי קרישה */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medications.hasCardioRenalAnticoagMeds}
                      onChange={(e) => updateMedications({ hasCardioRenalAnticoagMeds: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>5.5 תרופות ללחץ דם (ACEi/ARB), סטטינים ונוגדי קרישה (קלט גם למחשבון PREVENT)</span>
                  </div>
                  {data.medications.hasCardioRenalAnticoagMeds ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medications.hasCardioRenalAnticoagMeds && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingAntihypertensives}
                        onChange={(e) => updateMedications({ takingAntihypertensives: e.target.checked })}
                      />
                      <span>נוטלת טיפול תרופתי ליתר לחץ דם (משתנה במחשבון PREVENT)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingAceArbOrPotassiumSparing}
                        onChange={(e) => updateMedications({ takingAceArbOrPotassiumSparing: e.target.checked })}
                      />
                      <span>ACEi / ARB / ספירונולקטון (זהירות היפרקלמיה עם Angeliq)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingStatins}
                        onChange={(e) => updateMedications({ takingStatins: e.target.checked })}
                      />
                      <span>נוטלת סטטין (משתנה במחשבון PREVENT)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingTherapeuticAnticoagulants}
                        onChange={(e) => updateMedications({ takingTherapeuticAnticoagulants: e.target.checked })}
                      />
                      <span>נוגדי קרישה (Eliquis / Xarelto / קומדין – עורי בלבד)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 5.6 פסיכיאטריה, שינה וכאב */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <label className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer hover:bg-slate-100">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={data.medications.hasPsychSleepPainMeds}
                      onChange={(e) => updateMedications({ hasPsychSleepPainMeds: e.target.checked })}
                      className="rounded text-teal-600 w-4 h-4"
                    />
                    <span>5.6 נוגדי דיכאון/חרדה (SSRI/SNRI), גאבאפנטין ותרופות שינה</span>
                  </div>
                  {data.medications.hasPsychSleepPainMeds ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </label>
                {data.medications.hasPsychSleepPainMeds && (
                  <div className="p-3.5 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingSsriOrSnri}
                        onChange={(e) => updateMedications({ takingSsriOrSnri: e.target.checked })}
                      />
                      <span>נוטלת SSRI / SNRI (ציפרלקס / ונלפקסין / סרטרלין וכו׳)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-rose-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={data.medications.takingCyp2d6InhibitorParoxetineFluoxetine}
                        onChange={(e) =>
                          updateMedications({ takingCyp2d6InhibitorParoxetineFluoxetine: e.target.checked })
                        }
                      />
                      <span>נוטלת Paroxetine (פאקסט) או Fluoxetine (פרוזק) – חוסם CYP2D6!</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingGabapentinOrPregabalin}
                        onChange={(e) => updateMedications({ takingGabapentinOrPregabalin: e.target.checked })}
                      />
                      <span>גאבאפנטין / פרגאבלין</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.medications.takingSleepMedsOrBenzos}
                        onChange={(e) => updateMedications({ takingSleepMedsOrBenzos: e.target.checked })}
                      />
                      <span>כדורי שינה / בנזודיאזפינים</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <FreeTextPhysicianBox
              label="תרופות קבועות אחרות, ויטמינים וצמחי מרפא (כגון קוהוש שחור / פיטואסטרוגנים)"
              value={data.medications.otherMedicationsAndSupplementsFreeText}
              placeholder="למשל: ויטמין D 1000 יחב״ל, מגנזיום בערב, אומגה 3..."
              onChange={(val) => updateMedications({ otherMedicationsAndSupplementsFreeText: val })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 6: מחלות במשפחה וגנטיקה */}
          {/* ================================================================= */}
          <section id="sec-family" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Users className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-800">6. היסטוריה משפחתית וגנטיקה</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.familyHistory.familyBreastOrOvarianCancer}
                  onChange={(e) =>
                    onChange({
                      familyHistory: { ...data.familyHistory, familyBreastOrOvarianCancer: e.target.checked }
                    })
                  }
                />
                <span>סרטן שד או שחלה במשפחה (אינו התווית נגד ל-MHT! מחייב התאמת סקר שד)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.familyHistory.familyCancerFirstDegreeUnder50OrMultiple}
                  onChange={(e) =>
                    onChange({
                      familyHistory: {
                        ...data.familyHistory,
                        familyCancerFirstDegreeUnder50OrMultiple: e.target.checked
                      }
                    })
                  }
                />
                <span>קרבה ראשונה מתחת לגיל 50 או ריבוי מקרים במשפחה (ממוגרפיה מגיל 40 + ייעוץ גנטי)</span>
              </label>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">סטטוס נשאות BRCA1 / BRCA2:</label>
                <select
                  value={data.familyHistory.brcaStatus}
                  onChange={(e) =>
                    onChange({
                      familyHistory: {
                        ...data.familyHistory,
                        brcaStatus: e.target.value as Stage1Data['familyHistory']['brcaStatus']
                      }
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NOT_TESTED">טרם נבדקה</option>
                  <option value="NEGATIVE">שלילית (תקינה)</option>
                  <option value="BRCA1">נשאית BRCA1 (MHT מותר ומומלץ לאחר RRSO ללא סרטן שד עד גיל 51!)</option>
                  <option value="BRCA2">נשאית BRCA2 (MHT מותר לאחר RRSO ללא סרטן שד עד גיל 51!)</option>
                  <option value="UNKNOWN">לא ידוע</option>
                </select>
              </div>

              <div className="flex flex-col justify-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.familyHistory.lynchSyndrome}
                    onChange={(e) =>
                      onChange({ familyHistory: { ...data.familyHistory, lynchSyndrome: e.target.checked } })
                    }
                  />
                  <span className="font-semibold text-amber-900">תסמונת לינץ׳ (Lynch Syndrome – סיכון מז׳ורי לרירית)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.familyHistory.familyEndometrialOrColorectalCancer}
                    onChange={(e) =>
                      onChange({
                        familyHistory: {
                          ...data.familyHistory,
                          familyEndometrialOrColorectalCancer: e.target.checked
                        }
                      })
                    }
                  />
                  <span>סרטן רירית הרחם או המעי הגס במשפחה</span>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.familyHistory.familyPrematureCvd}
                  onChange={(e) =>
                    onChange({ familyHistory: { ...data.familyHistory, familyPrematureCvd: e.target.checked } })
                  }
                />
                <span>מחלת לב/שבץ מוקדמת בקרבה ראשונה (גבר &lt;55, אישה &lt;65 – מעצים סיכון CV)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.familyHistory.familyVteOrThrombophilia}
                  onChange={(e) =>
                    onChange({
                      familyHistory: { ...data.familyHistory, familyVteOrThrombophilia: e.target.checked }
                    })
                  }
                />
                <span>סיפור משפחתי של VTE / קרישיות יתר בקרבה ראשונה (מחייב מתן עורי)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.familyHistory.familyOsteoporosisOrHipFracture}
                  onChange={(e) =>
                    onChange({
                      familyHistory: {
                        ...data.familyHistory,
                        familyOsteoporosisOrHipFracture: e.target.checked
                      }
                    })
                  }
                />
                <span>אוסטיאופורוזיס או שבר צוואר הירך אצל אם/אב</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.familyHistory.familyDiabetes}
                    onChange={(e) =>
                      onChange({ familyHistory: { ...data.familyHistory, familyDiabetes: e.target.checked } })
                    }
                  />
                  <span>סוכרת במשפחה</span>
                </label>
                <div className="flex items-center gap-1.5 mr-auto">
                  <span className="text-slate-600">גיל מנופאוזה של האם:</span>
                  <input
                    type="number"
                    value={data.familyHistory.familyMenopauseAge || ''}
                    onChange={(e) =>
                      onChange({
                        familyHistory: {
                          ...data.familyHistory,
                          familyMenopauseAge: Number(e.target.value) || undefined
                        }
                      })
                    }
                    className="w-16 p-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>
            </div>

            <FreeTextPhysicianBox
              label="פירוט היסטוריה משפחתית וייעוץ גנטי"
              value={data.familyHistory.notes}
              placeholder="למשל: דודה מצד האב חלתה בסרטן שד בגיל 62, בוצע בירור גנטי באיכילוב ב-2024..."
              onChange={(val) => onChange({ familyHistory: { ...data.familyHistory, notes: val } })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 7: מחשבון AHA PREVENT™ מוטמע (נפתח אוטומטית בגורמי סיכון!) */}
          {/* ================================================================= */}
          <section
            id="sec-prevent"
            className={`rounded-2xl border shadow-sm p-5 transition ${
              prevent.shouldAutoOpen
                ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    7. הערכת סיכון קרדיו-וסקולרי מוטמעת – מחשבון AHA PREVENT™ (MDCalc #10491)
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {prevent.autoOpenReasons.length > 0
                      ? `נפתח אוטומטית בשל: ${prevent.autoOpenReasons.join(' • ')}`
                      : 'ניתן לפתוח ידנית לחישוב סיכון ל-10 ול-30 שנה ל-Total CVD, ASCVD ואי-ספיקת לב'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    preventInputs: {
                      ...data.preventInputs,
                      isManuallyExpanded: !data.preventInputs.isManuallyExpanded
                    }
                  })
                }
                className="text-xs font-bold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 self-start"
              >
                {prevent.shouldAutoOpen ? 'מחשבון פעיל' : 'פתח מחשבון PREVENT'}
              </button>
            </div>

            {prevent.shouldAutoOpen && (
              <div className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white p-3.5 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Total Chol (mg/dL) *</label>
                    <input
                      type="number"
                      placeholder="130–320"
                      value={data.preventInputs.totalCholesterolMgDl ?? ''}
                      onChange={(e) =>
                        onChange({
                          preventInputs: {
                            ...data.preventInputs,
                            totalCholesterolMgDl: e.target.value ? Number(e.target.value) : undefined
                          }
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">HDL-C (mg/dL) *</label>
                    <input
                      type="number"
                      placeholder="20–100"
                      value={data.preventInputs.hdlCholesterolMgDl ?? ''}
                      onChange={(e) =>
                        onChange({
                          preventInputs: {
                            ...data.preventInputs,
                            hdlCholesterolMgDl: e.target.value ? Number(e.target.value) : undefined
                          }
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">eGFR (mL/min) *</label>
                    <input
                      type="number"
                      placeholder="או הזן קריאטינין ->"
                      value={data.preventInputs.egfrMlMin ?? ''}
                      onChange={(e) =>
                        onChange({
                          preventInputs: {
                            ...data.preventInputs,
                            egfrMlMin: e.target.value ? Number(e.target.value) : undefined
                          }
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">קריאטינין (mg/dL)</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="חישוב CKD-EPI"
                      value={data.preventInputs.serumCreatinineMgDl ?? ''}
                      onChange={(e) =>
                        onChange({
                          preventInputs: {
                            ...data.preventInputs,
                            serumCreatinineMgDl: e.target.value ? Number(e.target.value) : undefined
                          }
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">HbA1c % (אופציונלי)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="למשל 5.7"
                      value={data.preventInputs.hba1cPercent ?? ''}
                      onChange={(e) =>
                        onChange({
                          preventInputs: {
                            ...data.preventInputs,
                            hba1cPercent: e.target.value ? Number(e.target.value) : undefined
                          }
                        })
                      }
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* פלט מחשבון PREVENT */}
                {prevent.hasCompleteLabInputs ? (
                  <div className="bg-white rounded-xl border border-indigo-200 p-4 space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                        <div className="text-[10px] text-slate-600">10y Total CVD</div>
                        <div className="text-base font-extrabold text-indigo-900">
                          {prevent.risk10YearTotalCvd}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                        <div className="text-[10px] text-slate-600">10y ASCVD</div>
                        <div className="text-base font-extrabold text-indigo-900">
                          {prevent.risk10YearAscvd}%
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200">
                        <div className="text-[10px] text-slate-600">10y Heart Failure</div>
                        <div className="text-base font-extrabold text-indigo-900">
                          {prevent.risk10YearHeartFailure}%
                        </div>
                      </div>
                      {prevent.risk30YearTotalCvd !== undefined && (
                        <>
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                            <div className="text-[10px] text-slate-600">30y Total CVD</div>
                            <div className="text-base font-extrabold text-amber-900">
                              {prevent.risk30YearTotalCvd}%
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                            <div className="text-[10px] text-slate-600">30y ASCVD</div>
                            <div className="text-base font-extrabold text-amber-900">
                              {prevent.risk30YearAscvd}%
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                            <div className="text-[10px] text-slate-600">30y Heart Failure</div>
                            <div className="text-base font-extrabold text-amber-900">
                              {prevent.risk30YearHeartFailure}%
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-3 rounded-lg border font-medium ${
                        prevent.mhtTrafficLight === 'RED'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : prevent.mhtTrafficLight === 'YELLOW'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      }`}
                    >
                      <p className="font-bold mb-1">משמעות להחלטת MHT:</p>
                      <p>{prevent.mhtGuidanceHebrew}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong>יעד ל"ד (ACC/AHA 2025):</strong> {prevent.bp2025GuidanceHebrew}
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <strong>סטטינים (ACC/AHA 2026):</strong> {prevent.statin2026GuidanceHebrew}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl">
                    {prevent.inapplicableReason ||
                      `לחישוב מדויק של אחוזי הסיכון השלימו: ${prevent.missingInputsHebrew.join(', ')}.`}
                  </div>
                )}

                {boneRisk.fraxRecommended && (
                  <div className="bg-white p-3 rounded-xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="text-teal-900">הערכת סיכון שברים (DXA / FRAX ישראל):</strong>{' '}
                      <span className="text-slate-700">{boneRisk.guidanceHebrew}</span>
                    </div>
                    <a
                      href="https://frax.shef.ac.uk/FRAX/tool.aspx?country=51"
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px]"
                    >
                      פתח FRAX ישראל ↗
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* סעיף 8: העדפות המטופלת וטיפולי עבר שנכשלו / הופסקו */}
          {/* ================================================================= */}
          <section id="sec-preferences" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Sliders className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  8. העדפות המטופלת וטיפולי עבר שנוסו ונכשלו / הופסקו
                </h2>
                <p className="text-[11px] text-slate-500">
                  משפיע ישירות על הדירוג והתיעדוף של אופציות הטיפול בשלב 2!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">גישת המטופלת לטיפול הורמונלי</label>
                <select
                  value={data.preferences.hormoneAttitude}
                  onChange={(e) =>
                    onChange({
                      preferences: {
                        ...data.preferences,
                        hormoneAttitude: e.target.value as Stage1Data['preferences']['hormoneAttitude']
                      }
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="OPEN_TO_MHT">פתוחה לטיפול הורמונלי (MHT)</option>
                  <option value="PREFERS_BODY_IDENTICAL">מעדיפה הורמונים זהים-ביולוגית (Body-Identical)</option>
                  <option value="PREFERS_NON_HORMONAL">מעדיפה להימנע מהורמונים (תיעדוף לא-הורמונלי!)</option>
                  <option value="UNDECIDED">מתלבטת – מעוניינת להשוות אפשרויות</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">צורת מתן מועדפת על המטופלת</label>
                <select
                  value={data.preferences.preferredRoute}
                  onChange={(e) =>
                    onChange({
                      preferences: {
                        ...data.preferences,
                        preferredRoute: e.target.value as Stage1Data['preferences']['preferredRoute']
                      }
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NO_PREFERENCE">ללא העדפה מוקדמת</option>
                  <option value="TRANSDERMAL_GEL">ג׳ל עורי יומי</option>
                  <option value="TRANSDERMAL_PATCH">מדבקה דו-שבועית</option>
                  <option value="MIRENA_BASED">מבוסס התקן מירנה + אסטרוגן</option>
                  <option value="ORAL_TABLET">טבליה פומית יומית</option>
                  <option value="LOCAL_VAGINAL_ONLY">טיפול נרתיקי מקומי בלבד</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">העדפה לגבי דמם ווסתי/גמילה</label>
                <select
                  value={data.preferences.bleedingPreference}
                  onChange={(e) =>
                    onChange({
                      preferences: {
                        ...data.preferences,
                        bleedingPreference: e.target.value as Stage1Data['preferences']['bleedingPreference']
                      }
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NO_PREFERENCE">ללא העדפה</option>
                  <option value="PREFER_BLEED_FREE">מעדיפה להימנע מדימום ככל שניתן</option>
                  <option value="CYCLIC_ACCEPTABLE">מקבלת דמם גמילה חודשי צפוי</option>
                </select>
              </div>
            </div>

            {/* טיפולי עבר שנכשלו / הופסקו */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2.5">
              <div className="font-bold text-slate-800">טיפולי עבר לגיל המעבר שנוסו והופסקו / נכשלו:</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newFailedKey}
                  onChange={(e) => setNewFailedKey(e.target.value as PriorFailedTreatment['treatmentKey'])}
                  className="p-2 border border-slate-300 rounded-lg bg-white sm:w-64"
                >
                  {Object.entries(PRIOR_TREATMENT_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="סיבת הפסקה / כישלון (למשל: גרד מהמדבקה, דימומים, חוסר השפעה)..."
                  value={newFailedReason}
                  onChange={(e) => setNewFailedReason(e.target.value)}
                  className="flex-1 p-2 border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={addPriorFailedTreatment}
                  className="flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-lg shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>הוסף</span>
                </button>
              </div>

              {data.preferences.priorFailedTreatments.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {data.preferences.priorFailedTreatments.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rose-200"
                    >
                      <div>
                        <span className="font-bold text-rose-900">{item.customName}: </span>
                        <span className="text-slate-700">{item.reasonStopped}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePriorFailedTreatment(item.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FreeTextPhysicianBox
              label="הערות על חששות המטופלת, ציפיות והעדפות נוספות"
              value={data.preferences.notes}
              placeholder="למשל: חוששת מסרטן שד בעקבות כתבה שקראה, מבקשת להתחיל במינון נמוך..."
              onChange={(val) => onChange({ preferences: { ...data.preferences, notes: val } })}
            />
          </section>

          {/* ================================================================= */}
          {/* סעיף 9: בדיקות סקר (לפי גיל וסל הבריאות) ומעבדה */}
          {/* ================================================================= */}
          <section id="sec-screening" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-800">
                9. בדיקות סקר (לפי גיל וסל הבריאות בישראל) ובדיקות מעבדה
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ממוגרפיה (בסל: דו-שנתית 50–74 / 40+ בסיכון)
                </label>
                <select
                  value={data.mammographyStatus}
                  onChange={(e) => onChange({ mammographyStatus: e.target.value as ScreeningStatus })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="UP_TO_DATE_NORMAL">בתוקף ותקינה (BI-RADS 1/2)</option>
                  <option value="NOT_REQUIRED_BY_AGE">טרם בגיל הסקר (&lt;50 בסיכון רגיל)</option>
                  <option value="OVERDUE">פג תוקף / מעל שנתיים</option>
                  <option value="NOT_PERFORMED">לא בוצעה</option>
                  <option value="ABNORMAL_SUSPECTED">ממצא חשוד בבירור (חוסם!)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">משטח צוואר הרחם / hrHPV (25–65)</label>
                <select
                  value={data.papHpvStatus}
                  onChange={(e) => onChange({ papHpvStatus: e.target.value as ScreeningStatus })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="UP_TO_DATE_NORMAL">בתוקף ותקין</option>
                  <option value="NOT_REQUIRED_BY_AGE">לא נדרש (גיל &gt;65 תקין / כריתת רחם מלאה)</option>
                  <option value="OVERDUE">פג תוקף</option>
                  <option value="NOT_PERFORMED">לא בוצע</option>
                  <option value="ABNORMAL_SUSPECTED">ממצא חריג בבירור (חוסם!)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">דם סמוי בצואה FIT / קולונוסקופיה (50–74)</label>
                <select
                  value={data.fitColorectalStatus}
                  onChange={(e) => onChange({ fitColorectalStatus: e.target.value as ScreeningStatus })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="UP_TO_DATE_NORMAL">בתוקף ותקין</option>
                  <option value="NOT_REQUIRED_BY_AGE">מתחת לגיל 50 בסיכון רגיל</option>
                  <option value="OVERDUE">פג תוקף</option>
                  <option value="NOT_PERFORMED">לא בוצע</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ספירת דם ופריטין (CBC / Ferritin)</label>
                <div className="flex gap-1.5">
                  <select
                    value={data.cbcStatus}
                    onChange={(e) => onChange({ cbcStatus: e.target.value as Stage1Data['cbcStatus'] })}
                    className="flex-1 p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="NORMAL">תקין</option>
                    <option value="ANEMIA">אנמיה / חסר ברזל</option>
                    <option value="NOT_TESTED">לא נבדק</option>
                  </select>
                  <input
                    type="number"
                    placeholder="פריטין"
                    value={data.ferritinValue ?? ''}
                    onChange={(e) =>
                      onChange({ ferritinValue: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-20 p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">תפקודי כבד (ALT / AST / Bilirubin)</label>
                <select
                  value={data.lftStatus}
                  onChange={(e) => onChange({ lftStatus: e.target.value as Stage1Data['lftStatus'] })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NORMAL">תקינים (נדרש גם טרם ויוזה)</option>
                  <option value="ABNORMAL">מוגברים / חריגים</option>
                  <option value="NOT_TESTED">לא נבדקו לאחרונה</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">צפיפות עצם (DXA)</label>
                <select
                  value={data.dxaStatus}
                  onChange={(e) => onChange({ dxaStatus: e.target.value as Stage1Data['dxaStatus'] })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NOT_PERFORMED">לא בוצעה</option>
                  <option value="NORMAL">תקינה (T-score ≥ -1.0)</option>
                  <option value="OSTEOPENIA">אוסטיאופניה (-1.0 עד -2.5)</option>
                  <option value="OSTEOPOROSIS">אוסטיאופורוזיס (≤ -2.5)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  FSH (IU/L – רלוונטי מתחת לגיל 45 / POP)
                </label>
                <input
                  type="number"
                  placeholder="לא נדרש בגיל ≥45"
                  value={data.fshLevel ?? ''}
                  onChange={(e) => onChange({ fshLevel: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estradiol בסרום (pmol/L – לבקרת ספיגה)
                </label>
                <input
                  type="number"
                  placeholder="אופציונלי"
                  value={data.estradiolSerumLevel ?? ''}
                  onChange={(e) =>
                    onChange({ estradiolSerumLevel: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <FreeTextPhysicianBox
              label="הערות מעבדה, הדמיות ובדיקות עזר נוספות"
              value={data.screeningLabsNotes}
              placeholder="למשל: ויטמין D 18 ng/mL, US אגן מ-01/2026 רירית 3 מ״מ ושרירן אינטרמורלי 2 ס״מ..."
              onChange={(val) => onChange({ screeningLabsNotes: val })}
            />
          </section>
        </div>

        {/* ================================================================= */}
        {/* סרגל החלטה חי ושער שלמות דביק (4 עמודות משמאל) */}
        {/* ================================================================= */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
          {/* כרטיס סיכום פרופיל מטופלת חי */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>תמונת מצב קלינית חיה</span>
              </h3>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                גיל {data.age || '-'} | BMI {data.bmi || '-'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-200">
              <div className="font-bold text-teal-900">{straw.hebrewName}</div>
              <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">{straw.clinicalDescription}</p>
              <p className="text-[10px] text-teal-800 mt-1 font-semibold">{straw.fshNote}</p>
            </div>

            {/* תסמינים בעדיפות עליונה למטופלת */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-800 mb-1">
                תסמינים מובילים לפי חשיבות ({symSummary.totalSeverityScore}/76):
              </div>
              {symSummary.topPriorityItems.length > 0 ? (
                <ul className="space-y-1 text-[11px] text-slate-700">
                  {symSummary.topPriorityItems.map((t) => (
                    <li key={t.item.id} className="flex items-center justify-between">
                      <span>• {t.item.shortTitleHebrew}</span>
                      <span className="font-semibold text-rose-700">
                        עוצמה {t.entry.severity} | חשיבות {t.entry.importance}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500">טרם סומנו סימפטומים בסעיף 3.</p>
              )}
            </div>

            {/* תגיות סיכון מחושבות */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div
                className={`p-2 rounded-lg border ${
                  vte.mandatoryTransdermal
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="font-bold">סיכון VTE / ציר:</div>
                <div>{vte.mandatoryTransdermal ? 'חובה מתן עורי!' : 'סיכון בסיסי נמוך'}</div>
              </div>
              <div
                className={`p-2 rounded-lg border ${
                  endoRisk.riskTier === 'HIGH'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold">סיכון רירית (BMS):</div>
                <div>{endoRisk.riskTier === 'HIGH' ? 'מוגבר (סף TVS נמוך)' : 'רגיל'}</div>
              </div>
            </div>

            {/* התראות אינטראקציה פעילות */}
            {interactions.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-bold text-rose-800 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>אינטראקציות ורגישויות פעילות ({interactions.length}):</span>
                </div>
                {interactions.map((al) => (
                  <div
                    key={al.id}
                    className={`p-2 rounded-lg border text-[11px] ${
                      al.severity === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    <strong>{al.drugName}:</strong> {al.clinicalAction}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* כרטיס שער שלמות (Completeness Gate) והתקדמות לשלב 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              {gate.isPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-600" />
              )}
              <span>שער בטיחות והשלמות לקראת שלב 2</span>
            </h3>

            {gate.blockingReasons.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1">
                <div className="font-bold">בירור חובה לפני החלטה טיפולית:</div>
                {gate.blockingReasons.map((r, i) => (
                  <p key={i} className="text-[11px]">
                    • {r}
                  </p>
                ))}
              </div>
            )}

            {gate.contraindicationNotices.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
                <div className="font-bold">התווית נגד ל-MHT סיסטמי – מופעל מסלול לא-הורמונלי:</div>
                {gate.contraindicationNotices.map((c, i) => (
                  <p key={i} className="text-[11px]">
                    • {c}
                  </p>
                ))}
              </div>
            )}

            {gate.warnings.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-700">
                <div className="font-bold text-slate-800">דגשים קליניים למעקב:</div>
                {gate.warnings.map((w, i) => (
                  <p key={i}>• {w}</p>
                ))}
              </div>
            )}

            {gate.basketRecommendations.length > 0 && (
              <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 space-y-1 text-[11px] text-teal-950">
                <div className="font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-teal-700" />
                  <span>המלצות סל הבריאות בישראל לפי גיל ומוצא:</span>
                </div>
                {gate.basketRecommendations.map((b, i) => (
                  <p key={i}>• {b}</p>
                ))}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={!gate.isPassed}
                onClick={onProceedToStage2}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition ${
                  gate.isPassed
                    ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {gate.systemicMhtContraindicated
                    ? 'המשך לשלב 2: אפשרויות לא-הורמונליות ומקומיות'
                    : 'המשך לשלב 2: דירוג אפשרויות הטיפול'}
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {gate.patientInstructions.length > 0 && (
                <button
                  type="button"
                  onClick={onPrintPatientInstructions}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>הדפס דף השלמת בדיקות למטופלת</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
