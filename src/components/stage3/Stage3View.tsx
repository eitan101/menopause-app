import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageSquarePlus,
  Pill,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  TrendingDown
} from 'lucide-react';
import { evaluateUnscheduledBleeding } from '../../clinical-engine/bleedingAlgorithm';
import {
  IMS_19_SYMPTOM_ITEMS,
  SCORE_LABELS_SEVERITY,
  compareLongitudinalSymptoms,
  getSymptomEntry
} from '../../clinical-engine/imsSymptoms';
import {
  getSideEffectChecklistForOption,
  resolveSideEffectActions,
  suggestMedicationModificationText
} from '../../clinical-engine/sideEffectEngine';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import {
  FollowUpMedicationAction,
  LongitudinalVisit,
  PatientRecord,
  Score0To4,
  SelectedTreatmentPlan,
  Stage1Data,
  Stage2Recommendations,
  TimestampedNote
} from '../../clinical-engine/types';
import { generateEmrSummary } from '../../services/emrExportService';

interface Stage3ViewProps {
  record: PatientRecord;
  stage1Data: Stage1Data;
  stage2Recs?: Stage2Recommendations;
  selectedPlan?: SelectedTreatmentPlan;
  visits: LongitudinalVisit[];
  onAddVisit: (visit: LongitudinalVisit, switchedPlan?: SelectedTreatmentPlan) => void;
}

export const Stage3View: React.FC<Stage3ViewProps> = ({
  record,
  stage1Data,
  stage2Recs,
  selectedPlan,
  visits,
  onAddVisit
}) => {
  const computedRecs = useMemo(() => stage2Recs || formulateTreatment(stage1Data), [stage1Data, stage2Recs]);
  const activeOption =
    computedRecs.rankedOptions.find((o) => o.id === selectedPlan?.selectedPrimaryOptionId) ||
    computedRecs.rankedOptions[0];

  const previousVisit = visits.length > 0 ? visits[visits.length - 1] : undefined;

  // אתחול סימפטומים למעקב מתוך הביקור האחרון או מתוך שלב 1 כדי לאפשר עדכון מהיר של השינוי!
  const [visitDate, setVisitDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [timepointLabel, setTimepointLabel] = useState<LongitudinalVisit['timepointLabel']>('3_MONTHS');
  const [monthsSinceStart, setMonthsSinceStart] = useState<number>(3);
  const [followUpSymptoms, setFollowUpSymptoms] = useState(() => ({
    ...(previousVisit ? previousVisit.followUpSymptoms : stage1Data.symptoms)
  }));
  const [showOnlyActiveBaselineSymptoms, setShowOnlyActiveBaselineSymptoms] = useState(true);

  // 2. אימות רקע רפואי שלא השתנה
  const [medicalBackgroundChecked, setMedicalBackgroundChecked] = useState(true);
  const [medicalBackgroundChanged, setMedicalBackgroundChanged] = useState(false);
  const [backgroundChangeDetails, setBackgroundChangeDetails] = useState('');
  const [updatedBpSystolic, setUpdatedBpSystolic] = useState<number>(stage1Data.bpSystolic);
  const [updatedBpDiastolic, setUpdatedBpDiastolic] = useState<number>(stage1Data.bpDiastolic);
  const [updatedWeightKg, setUpdatedWeightKg] = useState<number>(stage1Data.weightKg);
  const [newlyStartedGlp1, setNewlyStartedGlp1] = useState(false);
  const [newlyStartedInteractingMed, setNewlyStartedInteractingMed] = useState('');
  const [newContraindicationEmerged, setNewContraindicationEmerged] = useState(false);
  const [veozaAltAstNormal, setVeozaAltAstNormal] =
    useState<NonNullable<LongitudinalVisit['veozaAltAstNormal']>>('NOT_APPLICABLE');

  // 3. תופעות לוואי ספציפיות לתרופה שניתנה + דימום
  const [reportedSideEffectIds, setReportedSideEffectIds] = useState<string[]>([]);
  const [sideEffectsFreeText, setSideEffectsFreeText] = useState('');
  const [hasNewBleeding, setHasNewBleeding] = useState(false);
  const [isBleedingHeavyOrProlonged, setIsBleedingHeavyOrProlonged] = useState(false);
  const [hasRecentDoseChangeIn3Months, setHasRecentDoseChangeIn3Months] = useState(false);
  const [tvsThicknessMm, setTvsThicknessMm] = useState<number | undefined>(undefined);
  const [stoppedHrt4WeeksAgoAndResolved, setStoppedHrt4WeeksAgoAndResolved] = useState(false);

  // 4. שינוי תרופתי
  const [medicationAction, setMedicationAction] = useState<FollowUpMedicationAction>('CONTINUE_SAME');
  const [switchedToOptionId, setSwitchedToOptionId] = useState<string>(
    computedRecs.rankedOptions[1]?.id || computedRecs.rankedOptions[0]?.id || ''
  );
  const [customUpdatedRegimenText, setCustomUpdatedRegimenText] = useState('');

  // 5. הערות מתוארכות במלל חופשי בשלב 3
  const [draftNotes, setDraftNotes] = useState<TimestampedNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [copiedEmr, setCopiedEmr] = useState(false);

  // חישובים חיים למעקב
  const deltaComparison = useMemo(
    () =>
      compareLongitudinalSymptoms(
        stage1Data.symptoms,
        followUpSymptoms,
        previousVisit?.followUpSymptoms
      ),
    [stage1Data.symptoms, followUpSymptoms, previousVisit]
  );

  const sideEffectChecklist = useMemo(
    () => getSideEffectChecklistForOption(activeOption, selectedPlan?.includeTestosterone),
    [activeOption, selectedPlan?.includeTestosterone]
  );

  const sideEffectPlans = useMemo(
    () => resolveSideEffectActions(reportedSideEffectIds, selectedPlan?.includeTestosterone),
    [reportedSideEffectIds, selectedPlan?.includeTestosterone]
  );

  const bleedingTriage = useMemo(() => {
    if (!hasNewBleeding) return undefined;
    return evaluateUnscheduledBleeding({
      stage1Data,
      regimenType: computedRecs.regimenType,
      monthsOnCurrentRegimen: monthsSinceStart,
      hasRecentDoseChangeIn3Months,
      isHeavyOrProlonged: isBleedingHeavyOrProlonged,
      tvsEndometrialThicknessMm: tvsThicknessMm,
      stoppedHrt4WeeksAgoAndResolved,
      newlyStartedGlp1
    });
  }, [
    hasNewBleeding,
    stage1Data,
    computedRecs.regimenType,
    monthsSinceStart,
    hasRecentDoseChangeIn3Months,
    isBleedingHeavyOrProlonged,
    tvsThicknessMm,
    stoppedHrt4WeeksAgoAndResolved,
    newlyStartedGlp1
  ]);

  const switchedOption = computedRecs.rankedOptions.find((o) => o.id === switchedToOptionId);
  const autoSuggestedPlanText = suggestMedicationModificationText(
    medicationAction,
    stage1Data,
    activeOption,
    switchedOption
  );

  const updateFollowUpSeverity = (id: string, sev: Score0To4) => {
    const existing = getSymptomEntry(followUpSymptoms, id);
    setFollowUpSymptoms((prev) => ({
      ...prev,
      [id]: {
        ...existing,
        severity: sev
      }
    }));
  };

  const toggleSideEffect = (id: string) => {
    setReportedSideEffectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddDraftNote = () => {
    if (!noteInput.trim()) return;
    setDraftNotes((prev) => [
      ...prev,
      {
        id: `s3note_${Date.now()}`,
        createdAtIso: new Date().toISOString(),
        stage: 3,
        text: noteInput.trim()
      }
    ]);
    setNoteInput('');
  };

  const handleSaveFollowUpVisit = () => {
    const heightM = stage1Data.heightCm > 0 ? stage1Data.heightCm / 100 : 1.64;
    const updatedBmi =
      updatedWeightKg > 0 ? Number((updatedWeightKg / (heightM * heightM)).toFixed(1)) : stage1Data.bmi;

    // אם נשאר טקסט בשדה ההערה שלא נלחץ עליו "הוסף", נשמור גם אותו עם חותמת זמן!
    const allVisitNotes = noteInput.trim()
      ? [
          ...draftNotes,
          {
            id: `s3note_${Date.now()}`,
            createdAtIso: new Date().toISOString(),
            stage: 3 as const,
            text: noteInput.trim()
          }
        ]
      : draftNotes;

    const visit: LongitudinalVisit = {
      visitId: `visit_${Date.now()}`,
      visitDate,
      timepointLabel,
      monthsSinceStart,
      evaluatedOptionId: activeOption?.id,
      currentRegimenSummary: activeOption?.titleHebrew || computedRecs.regimenHebrewTitle,
      followUpSymptoms,
      symptomSummaryDeltaText: deltaComparison.summaryHebrew,
      medicalBackgroundChecked,
      medicalBackgroundChanged,
      backgroundChangeDetails,
      updatedBpSystolic,
      updatedBpDiastolic,
      updatedWeightKg,
      updatedBmi,
      newlyStartedGlp1,
      newlyStartedInteractingMed,
      newContraindicationEmerged,
      veozaAltAstNormal,
      reportedSideEffectIds,
      sideEffectsFreeText,
      hasNewBleeding,
      isBleedingHeavyOrProlonged,
      hasRecentDoseChangeIn3Months,
      tvsThicknessMm,
      stoppedHrt4WeeksAgoAndResolved,
      urgentTvsIndicated: Boolean(bleedingTriage?.tvsIndicated),
      biopsyIndicated: bleedingTriage?.endometrialBiopsyIndicated,
      tvsReason: bleedingTriage?.headline,
      sideEffectActionPlan: sideEffectPlans,
      medicationAction,
      switchedToOptionId: medicationAction === 'SWITCH_DRUG_OR_ROUTE' ? switchedToOptionId : undefined,
      updatedRegimenText: customUpdatedRegimenText.trim() || autoSuggestedPlanText,
      cessationPlan: medicationAction === 'TAPER_OR_STOP' ? autoSuggestedPlanText : undefined,
      timestampedNotes: allVisitNotes
    };

    let updatedPlan: SelectedTreatmentPlan | undefined;
    if (medicationAction === 'SWITCH_DRUG_OR_ROUTE' && switchedToOptionId) {
      updatedPlan = {
        ...(selectedPlan || {
          selectedPrimaryOptionId: switchedToOptionId,
          selectionRationaleTags: [],
          selectionRationaleFreeText: '',
          selectedAtIso: new Date().toISOString()
        }),
        selectedPrimaryOptionId: switchedToOptionId,
        selectionRationaleFreeText: `הוחלף בביקור מעקב (${visitDate}): ${
          customUpdatedRegimenText.trim() || autoSuggestedPlanText
        }`,
        selectedAtIso: new Date().toISOString()
      };
    }

    onAddVisit(visit, updatedPlan);
    setNoteInput('');
    setDraftNotes([]);
    alert('ביקור המעקב נשמר בהצלחה בציר הזמן האורכי של המטופלת!');
  };

  const handleCopyEmr = () => {
    navigator.clipboard.writeText(generateEmrSummary(record));
    setCopiedEmr(true);
    setTimeout(() => setCopiedEmr(false), 2500);
  };

  const symptomRowsToDisplay = showOnlyActiveBaselineSymptoms
    ? deltaComparison.rows.filter(
        (r) => r.baselineSeverity > 0 || r.currentSeverity > 0 || r.baselineImportance >= 2
      )
    : deltaComparison.rows;

  const isOnNk3 = activeOption?.id.includes('nk3');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* כותרת שלב 3 והטיפול הפעיל הנוכחי */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            <CalendarClock className="w-4 h-4" />
            <span>שלב 3: מעקב אורכי (3 / 6 / 12 חודשים), בקרת בטיחות והתאמת מינונים</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            הטיפול הפעיל הנוכחי: {activeOption?.titleHebrew || computedRecs.regimenHebrewTitle}
          </h2>
          {activeOption && (
            <p className="text-xs text-slate-600">
              {activeOption.israeliProductsSummary.primaryAgent}
              {activeOption.israeliProductsSummary.secondaryProgestogenOrMonitor
                ? ` + ${activeOption.israeliProductsSummary.secondaryProgestogenOrMonitor}`
                : ''}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyEmr}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 self-start"
        >
          {copiedEmr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copiedEmr ? 'הועתק ל-EMR!' : 'העתק סיכום מעקב ל-EMR'}</span>
        </button>
      </div>

      {/* מועד הביקור */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">תאריך ביקור המעקב</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">נקודת זמן במעקב</label>
          <select
            value={timepointLabel}
            onChange={(e) => {
              const v = e.target.value as LongitudinalVisit['timepointLabel'];
              setTimepointLabel(v);
              if (v === '3_MONTHS') setMonthsSinceStart(3);
              else if (v === '6_MONTHS') setMonthsSinceStart(6);
              else if (v === '12_MONTHS') setMonthsSinceStart(12);
            }}
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="3_MONTHS">ביקור בקרה ראשון – 3 חודשים</option>
            <option value="6_MONTHS">מעקב 6 חודשים</option>
            <option value="12_MONTHS">מעקב שנתי – 12 חודשים</option>
            <option value="OTHER">מועד אחר / פנייה יזומה</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">חודשים מתחילת המשטר הנוכחי</label>
          <input
            type="number"
            min={0}
            value={monthsSinceStart}
            onChange={(e) => setMonthsSinceStart(Number(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3.1 מעבר חוזר ותיעוד השינוי בסימפטומים (IMS 19-item Longitudinal Delta) */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">
                1. הערכה חוזרת ותיעוד השינוי בסימפטומים (מול ביקור הבסיס בשלב 1)
              </h3>
              <p className="text-xs text-slate-500">{deltaComparison.summaryHebrew}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowOnlyActiveBaselineSymptoms(!showOnlyActiveBaselineSymptoms)}
            className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg self-start"
          >
            {showOnlyActiveBaselineSymptoms
              ? 'הצג את כל 19 פריטי השאלון (כולל תסמינים חדשים)'
              : 'הצג רק תסמינים פעילים'}
          </button>
        </div>

        {deltaComparison.unresolvedHighPriorityCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium">
            <strong>דגש קליני (תת-תגובה בתסמינים חשובים למטופלת):</strong> במידה שהמטופלת על ג׳ל או מדבקה עורית ועדיין
            סובלת מגלי חום/הפרעות שינה בעדיפות גבוהה – יש לוודא טכניקת מריחה נכונה ולבדוק רמת{' '}
            <strong>Estradiol בסרום</strong> (לשלילת תת-ספיגה עורית, הקיימת בעד 10%–15% מהנשים) לפני או במקביל להעלאת מינון!
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {symptomRowsToDisplay.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">
              לא סומנו תסמינים פעילים בבסיס – לחצו על "הצג את כל 19 פריטי השאלון" לעדכון תסמינים חדשים.
            </p>
          ) : (
            symptomRowsToDisplay.map((row) => (
              <div
                key={row.item.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {row.item.number}. {row.item.shortTitleHebrew}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                      חשיבות בסיס: {row.baselineImportance}/4
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        row.statusHebrew === 'RESOLVED' || row.statusHebrew === 'IMPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.statusHebrew === 'WORSENED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      בסיס: {row.baselineSeverity} ← כעת: {row.currentSeverity} (
                      {row.deltaFromBaseline < 0
                        ? `שיפור ${Math.abs(row.deltaFromBaseline)}-`
                        : row.deltaFromBaseline > 0
                        ? `החמרה +${row.deltaFromBaseline}`
                        : 'ללא שינוי'}
                      )
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-600 ml-1">
                    עוצמה נוכחית ({SCORE_LABELS_SEVERITY[row.currentSeverity]}):
                  </span>
                  {([0, 1, 2, 3, 4] as Score0To4[]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateFollowUpSeverity(row.item.id, n)}
                      className={`w-7 h-7 rounded-lg font-bold border transition ${
                        row.currentSeverity === n
                          ? n === 0
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3.2 וידוא שהרקע הרפואי, המדדים והתרופות לא השתנו */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-800">
            2. וידוא שהרקע הרפואי, לחץ הדם, התרופות ובדיקות הסקר לא השתנו
          </h3>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setMedicalBackgroundChecked(true);
              setMedicalBackgroundChanged(false);
            }}
            className={`px-4 py-2 rounded-xl font-bold border flex items-center gap-1.5 transition ${
              medicalBackgroundChecked && !medicalBackgroundChanged
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>אומת מול המטופלת – לא חל שינוי ברקע הרפואי או בתרופות הקבועות</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMedicalBackgroundChecked(true);
              setMedicalBackgroundChanged(true);
            }}
            className={`px-4 py-2 rounded-xl font-bold border flex items-center gap-1.5 transition ${
              medicalBackgroundChanged
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-slate-50 text-slate-700 border-slate-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>חל שינוי ברקע הרפואי / אבחנה חדשה / תרופה חדשה</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ל"ד סיסטולי עדכני</label>
            <input
              type="number"
              value={updatedBpSystolic}
              onChange={(e) => setUpdatedBpSystolic(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ל"ד דיאסטולי עדכני</label>
            <input
              type="number"
              value={updatedBpDiastolic}
              onChange={(e) => setUpdatedBpDiastolic(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">משקל עדכני (ק"ג)</label>
            <input
              type="number"
              value={updatedWeightKg}
              onChange={(e) => setUpdatedWeightKg(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          {(isOnNk3 || veozaAltAstNormal !== 'NOT_APPLICABLE') && (
            <div>
              <label className="block font-bold text-indigo-800 mb-1">
                מעקב כבד ויוזה (חודש 1/2/3/6/9):
              </label>
              <select
                value={veozaAltAstNormal}
                onChange={(e) =>
                  setVeozaAltAstNormal(e.target.value as NonNullable<LongitudinalVisit['veozaAltAstNormal']>)
                }
                className="w-full p-2 border border-indigo-300 rounded-lg bg-white"
              >
                <option value="NOT_APPLICABLE">טרם נבדק / לא רלוונטי</option>
                <option value="NORMAL">תקין (ALT/AST ובילירובין תקינים)</option>
                <option value="ELEVATED_UNDER_3X">עלייה קלה &lt;3x ULN ללא תסמינים (מעקב צמוד)</option>
                <option value="CRITICAL_OVER_3X">ALT/AST &gt;3x ULN או בילירובין גבוה (הפסקה מיידית!)</option>
              </select>
            </div>
          )}
        </div>

        {veozaAltAstNormal === 'CRITICAL_OVER_3X' && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-400 text-rose-900 font-bold">
            דגל אדום כבדי תחת ויוזה / לינקואט (ALT/AST &gt; 3x ULN או עליית בילירובין): חובה להפסיק את התרופה באופן מיידי ולעקוב אחר תפקודי כבד עד לנרמול מלא!
          </div>
        )}

        {medicalBackgroundChanged && (
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-300 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-950">
                <input
                  type="checkbox"
                  checked={newlyStartedGlp1}
                  onChange={(e) => setNewlyStartedGlp1(e.target.checked)}
                />
                <span>התחילה / העלתה מינון של זריקת GLP-1 (אוזמפיק / וויגובי / מונג׳רו)!</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800">
                <input
                  type="checkbox"
                  checked={newContraindicationEmerged}
                  onChange={(e) => setNewContraindicationEmerged(e.target.checked)}
                />
                <span>הופיעה התווית נגד חדשה ל-MHT (ממצא שד / VTE / אירוע איסכמי / מחלת כבד)!</span>
              </label>
            </div>
            <input
              type="text"
              placeholder="תרופה חדשה שנוספה (למשל למוטריג׳ין / אלטרוקסין / נוגד קרישה)..."
              value={newlyStartedInteractingMed}
              onChange={(e) => setNewlyStartedInteractingMed(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg bg-white"
            />
            <textarea
              rows={2}
              placeholder="פרט/י את השינוי שחל ברקע הרפואי או בבדיקות הסקר..."
              value={backgroundChangeDetails}
              onChange={(e) => setBackgroundChangeDetails(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg bg-white"
            />
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 3.3 בירור תופעות לוואי של הטיפול שניתן + אלגוריתם דימומים BMS 2024 */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Stethoscope className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="text-base font-bold text-slate-800">
              3. בירור תופעות לוואי ייעודיות לטיפול שניתן וטריאז׳ דימומים (BMS 2024)
            </h3>
            <p className="text-[11px] text-slate-500">
              רשימת תופעות הלוואי מותאמת אוטומטית לתכשיר שהמטופלת נוטלת כעת
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {sideEffectChecklist.map((se) => {
            const checked = reportedSideEffectIds.includes(se.id);
            return (
              <label
                key={se.id}
                className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2 transition ${
                  checked ? 'bg-amber-50 border-amber-400' : 'bg-slate-50/70 border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSideEffect(se.id)}
                  className="mt-0.5 rounded text-amber-600"
                />
                <div>
                  <div className="font-bold text-slate-800">{se.labelHebrew}</div>
                  {checked && <p className="text-[11px] text-amber-950 mt-1">{se.managementAdviceHebrew}</p>}
                </div>
              </label>
            );
          })}
        </div>

        <input
          type="text"
          placeholder="תיאור חופשי של תופעות לוואי נוספות שדווחו על ידי המטופלת..."
          value={sideEffectsFreeText}
          onChange={(e) => setSideEffectsFreeText(e.target.value)}
          className="w-full p-2.5 border border-slate-300 rounded-xl"
        />

        {/* בדיקת דימום בלתי צפוי (ברחם שמור) */}
        {!stage1Data.hadHysterectomy && (
          <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-900">
              <input
                type="checkbox"
                checked={hasNewBleeding}
                onChange={(e) => setHasNewBleeding(e.target.checked)}
                className="rounded text-rose-600 w-4 h-4"
              />
              <span>מופיע דימום נרתיקי בלתי צפוי / הכתמות (Unscheduled Bleeding on HRT)</span>
            </label>

            {hasNewBleeding && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-white p-3 rounded-xl border border-rose-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBleedingHeavyOrProlonged}
                      onChange={(e) => setIsBleedingHeavyOrProlonged(e.target.checked)}
                    />
                    <span className="font-semibold text-rose-800">דימום כבד / ממושך / לאחר יחסים</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasRecentDoseChangeIn3Months}
                      onChange={(e) => setHasRecentDoseChangeIn3Months(e.target.checked)}
                    />
                    <span>שינוי מינון/תכשיר ב-3 החודשים האחרונים</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      עובי רירית ב-TVS אם בוצע (מ"מ):
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="למשל 3.5 (cc≤4 / s≤7)"
                      value={tvsThicknessMm ?? ''}
                      onChange={(e) => setTvsThicknessMm(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-1.5 border rounded"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stoppedHrt4WeeksAgoAndResolved}
                      onChange={(e) => setStoppedHrt4WeeksAgoAndResolved(e.target.checked)}
                    />
                    <span>הופסק HRT ל-4 שבועות והדימום פסק</span>
                  </label>
                </div>

                {bleedingTriage && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      bleedingTriage.urgency === 'URGENT_2_WEEKS'
                        ? 'bg-rose-100/80 border-rose-400 text-rose-950'
                        : bleedingTriage.urgency === 'ROUTINE_TVS_WITHIN_6_WEEKS'
                        ? 'bg-amber-100/80 border-amber-400 text-amber-950'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    <div className="font-extrabold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>{bleedingTriage.headline}</span>
                    </div>
                    <div className="text-[11px] font-semibold opacity-90">
                      {bleedingTriage.cutoffReferenceHebrew}
                    </div>
                    <ul className="space-y-1 pt-1 text-[11px]">
                      {bleedingTriage.actionSteps.map((st, idx) => (
                        <li key={idx}>• {st}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 3.4 אופציה לשינוי תרופתי (עליית מינון / ירידת מינון / החלפת תרופה / הפסקה) */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-teal-300 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <RefreshCw className="w-5 h-5 text-teal-700" />
          <h3 className="text-base font-bold text-slate-900">
            4. החלטה טיפולית ואופציה לשינוי תרופתי בביקור המעקב
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(
            [
              { id: 'CONTINUE_SAME', label: 'המשך באותו טיפול' },
              { id: 'ESCALATE_DOSE', label: 'עליית מינון (טיטרציה)' },
              { id: 'REDUCE_DOSE', label: 'הפחתת מינון' },
              { id: 'SWITCH_DRUG_OR_ROUTE', label: 'החלפת תרופה / ציר' },
              { id: 'ADD_LOCAL_TREATMENT', label: 'הוספת טיפול מקומי (GSM)' },
              { id: 'TAPER_OR_STOP', label: 'גמילה מדורגת / הפסקה' }
            ] as { id: FollowUpMedicationAction; label: string }[]
          ).map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                setMedicationAction(btn.id);
                setCustomUpdatedRegimenText('');
              }}
              className={`p-2.5 rounded-xl font-bold border text-center transition ${
                medicationAction === btn.id
                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {medicationAction === 'SWITCH_DRUG_OR_ROUTE' && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
            <label className="block font-bold text-teal-950">
              בחר/י את התרופה / המשטר החדש שאליו מוחלפת המטופלת (יעדכן את הטיפול הפעיל בתיק!):
            </label>
            <select
              value={switchedToOptionId}
              onChange={(e) => setSwitchedToOptionId(e.target.value)}
              className="w-full p-2.5 border border-teal-300 rounded-xl bg-white font-semibold"
            >
              {computedRecs.rankedOptions.map((opt, idx) => (
                <option key={opt.id} value={opt.id}>
                  #{idx + 1} {opt.titleHebrew} ({opt.routeLabelHebrew})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="font-bold text-slate-800">הנחיה קלינית מומלצת לשינוי שנבחר (ניתן לערוך חופשית):</div>
          <p className="text-teal-900 font-medium leading-relaxed">{autoSuggestedPlanText}</p>
          <textarea
            rows={2}
            value={customUpdatedRegimenText}
            onChange={(e) => setCustomUpdatedRegimenText(e.target.value)}
            placeholder="עריכה חופשית או פירוט מדויק של המינון המעודכן (אם ריק – תישמר ההנחיה המובנית לעיל)..."
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
          />
        </div>

        {/* ================================================================= */}
        {/* 3.5 הערות במלל חופשי בשלב 3 כולל תיעוד תאריך */}
        {/* ================================================================= */}
        <div className="pt-2 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-800">
              5. הערות רופא/ה במלל חופשי לביקור המעקב (נשמרות אוטומטית עם תאריך ושעה):
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="הזן/י הערה קלינית לביקור זה..."
              className="flex-1 p-2.5 border border-slate-300 rounded-xl"
            />
            <button
              type="button"
              onClick={handleAddDraftNote}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-xl shrink-0"
            >
              הוסף הערה מתוארכת
            </button>
          </div>

          {draftNotes.length > 0 && (
            <div className="space-y-1.5">
              {draftNotes.map((n) => (
                <div key={n.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="text-[10px] font-bold text-teal-800">
                    [{new Date(n.createdAtIso).toLocaleString('he-IL')}]
                  </span>
                  <span>{n.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveFollowUpVisit}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-sm flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>שמור ביקור מעקב בתיק המטופלת</span>
          </button>
        </div>
      </section>

      {/* ציר הזמן האורכי של כל ביקורי המעקב שנשמרו */}
      {visits.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <span>היסטוריית ביקורי מעקב שמורים ({visits.length})</span>
          </h3>

          <div className="space-y-3">
            {[...visits].reverse().map((v) => (
              <div key={v.visitId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="font-extrabold text-slate-900">
                    תאריך ביקור: {v.visitDate} (חודש {v.monthsSinceStart} לטיפול – {v.currentRegimenSummary})
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold">
                    {v.medicationAction}
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>שינוי בסימפטומים:</strong> {v.symptomSummaryDeltaText}
                </p>
                <p className="text-slate-700">
                  <strong>אימות רקע רפואי:</strong>{' '}
                  {v.medicalBackgroundChanged
                    ? `חל שינוי (${v.backgroundChangeDetails || 'עודכן'})`
                    : `אומת ללא שינוי (ל"ד ${v.updatedBpSystolic}/${v.updatedBpDiastolic}, משקל ${v.updatedWeightKg} ק"ג)`}
                </p>
                {v.hasNewBleeding && (
                  <p className="text-rose-800 font-semibold">
                    <strong>דימום בביקור:</strong> {v.tvsReason}
                  </p>
                )}
                <p className="text-teal-950 font-semibold">
                  <strong>החלטה תרופתית:</strong> {v.updatedRegimenText}
                </p>
                {v.timestampedNotes.length > 0 && (
                  <div className="pt-1 space-y-1">
                    {v.timestampedNotes.map((n) => (
                      <div key={n.id} className="text-[11px] text-slate-600">
                        🕒 [{new Date(n.createdAtIso).toLocaleString('he-IL')}] {n.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
