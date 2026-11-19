import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Calculator,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  Flame,
  MessageSquarePlus,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  ThumbsDown,
  ThumbsUp,
  TrendingDown
} from 'lucide-react';
import { evaluateFollowUpDecisionSuite } from '../../clinical-engine/followUpDecisionEngine';
import {
  SCORE_LABELS_SEVERITY,
  compareLongitudinalSymptoms,
  getSymptomEntry
} from '../../clinical-engine/imsSymptoms';
import { buildStage3PatientInstructions } from '../../clinical-engine/patientInstructionsBuilder';
import {
  getSideEffectChecklistForOption,
  resolveSideEffectActions
} from '../../clinical-engine/sideEffectEngine';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import {
  BmsEndometrialCalculatorOverrides,
  FollowUpMedicationAction,
  LongitudinalVisit,
  PatientRecord,
  Score0To4,
  SelectedTreatmentPlan,
  Stage1Data,
  Stage2Recommendations,
  TimestampedNote,
  TreatmentOptionCard
} from '../../clinical-engine/types';
import { generateEmrSummary } from '../../services/emrExportService';
import { PatientOutputCard } from '../common/PatientOutputCard';

interface Stage3ViewProps {
  record: PatientRecord;
  stage1Data: Stage1Data;
  stage2Recs?: Stage2Recommendations;
  selectedPlan?: SelectedTreatmentPlan;
  visits: LongitudinalVisit[];
  onAddVisit: (visit: LongitudinalVisit, switchedPlan?: SelectedTreatmentPlan) => void;
  onPrintFollowUpSummary?: () => void;
}

const FOLLOW_UP_RATIONALE_CHIPS = [
  'איזון תסמינים מצוין וללא תופעות לוואי – המשך באותו משטר',
  'טיטרציית מינון בשל תסמינים שאריים בעדיפות גבוהה למטופלת',
  'החלפת ציר/תכשיר בשל תופעות לוואי או גירוי עורי',
  'מעבר למירנה / מדבקה משולבת לייצוב דימום או בשל זריקת GLP-1',
  'הפחתת מינון להקלת גודש בשדיים / נפיחות',
  'מעבר לחלופה לא-הורמונלית בשל שינוי ברקע הרפואי / העדפת המטופלת'
];

export const Stage3View: React.FC<Stage3ViewProps> = ({
  record,
  stage1Data,
  stage2Recs,
  selectedPlan,
  visits,
  onAddVisit,
  onPrintFollowUpSummary
}) => {
  const computedRecs = useMemo(() => stage2Recs || formulateTreatment(stage1Data), [stage1Data, stage2Recs]);
  const activeOption =
    computedRecs.rankedOptions.find((o) => o.id === selectedPlan?.selectedPrimaryOptionId) ||
    computedRecs.rankedOptions[0];

  const previousVisit = visits.length > 0 ? visits[visits.length - 1] : undefined;

  // 1. מועד הביקור וסימפטומים חוזרים
  const [visitDate, setVisitDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [timepointLabel, setTimepointLabel] = useState<LongitudinalVisit['timepointLabel']>('3_MONTHS');
  const [monthsSinceStart, setMonthsSinceStart] = useState<number>(3);
  const [followUpSymptoms, setFollowUpSymptoms] = useState(() => ({
    ...(previousVisit ? previousVisit.followUpSymptoms : stage1Data.symptoms)
  }));
  const [showOnlyActiveBaselineSymptoms, setShowOnlyActiveBaselineSymptoms] = useState(true);

  // 2. אימות שינוי ברקע רפואי ומדדים (פותח מחשבון PREVENT אוטומטית אם השתנו!)
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
  const [manualOpenPreventS3, setManualOpenPreventS3] = useState(false);

  // 3. תופעות לוואי + דימומים + מחשבון BMS 2024 לגורמי סיכון לסרטן הרחם
  const [reportedSideEffectIds, setReportedSideEffectIds] = useState<string[]>([]);
  const [sideEffectsFreeText, setSideEffectsFreeText] = useState('');
  const [hasNewBleeding, setHasNewBleeding] = useState(false);
  const [isBleedingHeavyOrProlonged, setIsBleedingHeavyOrProlonged] = useState(false);
  const [hasRecentDoseChangeIn3Months, setHasRecentDoseChangeIn3Months] = useState(false);
  const [tvsThicknessMm, setTvsThicknessMm] = useState<number | undefined>(undefined);
  const [stoppedHrt4WeeksAgoAndResolved, setStoppedHrt4WeeksAgoAndResolved] = useState(false);
  const [bmsOverrides, setBmsOverrides] = useState<BmsEndometrialCalculatorOverrides>({});
  const [manualOpenBmsCalc, setManualOpenBmsCalc] = useState(false);

  // 4. בחירה מפורטת מתוך אופציות הטיפול המוצעות למעקב (באותה רמת פירוט של שלב 2!)
  const [selectedFollowUpOptionId, setSelectedFollowUpOptionId] = useState<string>('');
  const [selectedGsmIds, setSelectedGsmIds] = useState<string[]>(
    () => selectedPlan?.selectedGsmOptionIds || []
  );
  const [selectedComplementaryIds, setSelectedComplementaryIds] = useState<string[]>(
    () => selectedPlan?.selectedComplementaryIds || []
  );
  const [includeTestosterone, setIncludeTestosterone] = useState<boolean>(
    () => Boolean(selectedPlan?.includeTestosterone)
  );
  const [rationaleTags, setRationaleTags] = useState<string[]>([]);
  const [rationaleFreeText, setRationaleFreeText] = useState('');
  const [customUpdatedRegimenText, setCustomUpdatedRegimenText] = useState('');

  // 5. מלל חופשי מהרופאה להנחיות המטופלת + יומן הערות מתוארך
  const [patientFollowUpFreeText, setPatientFollowUpFreeText] = useState('');
  const [draftNotes, setDraftNotes] = useState<TimestampedNote[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [copiedEmr, setCopiedEmr] = useState(false);

  // הפעלת מנוע ההחלטות והמחשבונים של שלב 3 בזמן אמת!
  const decisionSuite = useMemo(
    () =>
      evaluateFollowUpDecisionSuite({
        stage1Data,
        selectedPlan,
        monthsSinceStart,
        followUpSymptoms,
        previousVisitSymptoms: previousVisit?.followUpSymptoms,
        updatedBpSystolic,
        updatedBpDiastolic,
        updatedWeightKg,
        newlyStartedGlp1,
        newlyStartedInteractingMed,
        newContraindicationEmerged,
        veozaAltAstNormal,
        reportedSideEffectIds,
        hasNewBleeding,
        isBleedingHeavyOrProlonged,
        hasRecentDoseChangeIn3Months,
        tvsThicknessMm,
        stoppedHrt4WeeksAgoAndResolved,
        bmsOverrides
      }),
    [
      stage1Data,
      selectedPlan,
      monthsSinceStart,
      followUpSymptoms,
      previousVisit,
      updatedBpSystolic,
      updatedBpDiastolic,
      updatedWeightKg,
      newlyStartedGlp1,
      newlyStartedInteractingMed,
      newContraindicationEmerged,
      veozaAltAstNormal,
      reportedSideEffectIds,
      hasNewBleeding,
      isBleedingHeavyOrProlonged,
      hasRecentDoseChangeIn3Months,
      tvsThicknessMm,
      stoppedHrt4WeeksAgoAndResolved,
      bmsOverrides
    ]
  );

  // שמירה על אופציה נבחרת תקפה מתוך האופציות המדורגות למעקב
  useEffect(() => {
    const valid = decisionSuite.rankedFollowUpOptions.some((o) => o.id === selectedFollowUpOptionId);
    if (!valid && decisionSuite.rankedFollowUpOptions.length > 0) {
      setSelectedFollowUpOptionId(decisionSuite.rankedFollowUpOptions[0].id);
    }
  }, [decisionSuite.rankedFollowUpOptions, selectedFollowUpOptionId]);

  const chosenFollowUpOption: TreatmentOptionCard | undefined =
    decisionSuite.rankedFollowUpOptions.find((o) => o.id === selectedFollowUpOptionId) ||
    decisionSuite.rankedFollowUpOptions[0];

  const derivedAction: FollowUpMedicationAction =
    chosenFollowUpOption?.followUpActionType || 'CONTINUE_SAME';

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
    () => getSideEffectChecklistForOption(activeOption, includeTestosterone),
    [activeOption, includeTestosterone]
  );

  const sideEffectPlans = useMemo(
    () => resolveSideEffectActions(reportedSideEffectIds, includeTestosterone),
    [reportedSideEffectIds, includeTestosterone]
  );

  const defaultUpdatedRegimenSummary = chosenFollowUpOption
    ? `${chosenFollowUpOption.titleHebrew} — ${chosenFollowUpOption.israeliProductsSummary.primaryAgent}${
        chosenFollowUpOption.israeliProductsSummary.secondaryProgestogenOrMonitor
          ? ` + ${chosenFollowUpOption.israeliProductsSummary.secondaryProgestogenOrMonitor}`
          : ''
      }`
    : '';

  const effectiveUpdatedRegimenText = customUpdatedRegimenText.trim() || defaultUpdatedRegimenSummary;

  const chosenGsmObjects = decisionSuite.localGsmOptions.filter((g) => selectedGsmIds.includes(g.id));

  // פלט הנחיות למטופלת בשלב 3
  const stage3PatientOutput = useMemo(
    () =>
      buildStage3PatientInstructions(stage1Data, {
        updatedRegimenText: effectiveUpdatedRegimenText,
        selectedOption: chosenFollowUpOption,
        selectedGsmOptions: chosenGsmObjects,
        selectedComplementaryIds,
        includeTestosterone: includeTestosterone && Boolean(decisionSuite.testosteroneOption),
        testosteroneOption: decisionSuite.testosteroneOption,
        urgentTvsIndicated: Boolean(decisionSuite.bleedingTriage?.tvsIndicated),
        biopsyIndicated: decisionSuite.bleedingTriage?.endometrialBiopsyIndicated,
        veozaAltAstNormal,
        unresolvedHighPrioritySymptoms: deltaComparison.unresolvedHighPriorityCount > 0,
        medicationAction: derivedAction,
        patientFollowUpInstructionsFreeText: patientFollowUpFreeText
      }),
    [
      stage1Data,
      effectiveUpdatedRegimenText,
      chosenFollowUpOption,
      chosenGsmObjects,
      selectedComplementaryIds,
      includeTestosterone,
      decisionSuite.testosteroneOption,
      decisionSuite.bleedingTriage,
      veozaAltAstNormal,
      deltaComparison.unresolvedHighPriorityCount,
      derivedAction,
      patientFollowUpFreeText
    ]
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

  const toggleGsmId = (id: string) => {
    setSelectedGsmIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleComplementaryId = (id: string) => {
    setSelectedComplementaryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleRationaleChip = (chip: string) => {
    setRationaleTags((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
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
      updatedBmi: decisionSuite.effectiveStage1.bmi,
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
      bmsEndometrialOverrides: bmsOverrides,
      urgentTvsIndicated: Boolean(decisionSuite.bleedingTriage?.tvsIndicated),
      biopsyIndicated: decisionSuite.bleedingTriage?.endometrialBiopsyIndicated,
      tvsReason: decisionSuite.bleedingTriage?.headline,
      sideEffectActionPlan: sideEffectPlans,
      medicationAction: derivedAction,
      selectedFollowUpOptionId: chosenFollowUpOption?.id,
      switchedToOptionId:
        derivedAction === 'SWITCH_DRUG_OR_ROUTE' ? chosenFollowUpOption?.id : undefined,
      selectedGsmOptionIds: selectedGsmIds,
      selectedComplementaryIds,
      includeTestosterone: includeTestosterone && Boolean(decisionSuite.testosteroneOption),
      selectionRationaleTags: rationaleTags,
      selectionRationaleFreeText: rationaleFreeText,
      updatedRegimenText: effectiveUpdatedRegimenText,
      cessationPlan: derivedAction === 'TAPER_OR_STOP' ? effectiveUpdatedRegimenText : undefined,
      patientFollowUpInstructions: stage3PatientOutput.structuredBullets,
      patientFollowUpInstructionsFreeText: patientFollowUpFreeText,
      timestampedNotes: allVisitNotes
    };

    // עדכון תוכנית הטיפול הפעילה להמשך המעקב
    const mappedPrimaryId =
      chosenFollowUpOption?.id.startsWith('fu_continue_')
        ? chosenFollowUpOption.id.replace('fu_continue_', '')
        : chosenFollowUpOption?.id === 'fu_escalate_transdermal_dose' ||
          chosenFollowUpOption?.id === 'fu_reduce_estrogen_dose'
        ? 'opt_transdermal_gel_body_identical'
        : chosenFollowUpOption?.id || selectedPlan?.selectedPrimaryOptionId || '';

    const updatedPlan: SelectedTreatmentPlan = {
      selectedPrimaryOptionId: mappedPrimaryId,
      selectedGsmOptionIds: selectedGsmIds,
      selectedComplementaryIds,
      includeTestosterone: includeTestosterone && Boolean(decisionSuite.testosteroneOption),
      selectionRationaleTags: rationaleTags,
      selectionRationaleFreeText: rationaleFreeText,
      stage2PatientInstructionsFreeText: patientFollowUpFreeText,
      selectedAtIso: new Date().toISOString()
    };

    onAddVisit(visit, updatedPlan);
    setNoteInput('');
    setDraftNotes([]);
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
  const showPreventCalcS3 = decisionSuite.shouldAutoOpenPreventInFollowUp || manualOpenPreventS3;
  const showBmsCalcS3 =
    (decisionSuite.shouldAutoOpenBmsBleedingCalculator || manualOpenBmsCalc) && !stage1Data.hadHysterectomy;

  const actionBadgeLabels: Record<FollowUpMedicationAction, string> = {
    CONTINUE_SAME: 'המשך משטר נוכחי',
    ESCALATE_DOSE: 'עליית מינון + פרוגסטוגן פרופורציונלי',
    REDUCE_DOSE: 'הפחתת מינון מבוקרת',
    SWITCH_DRUG_OR_ROUTE: 'החלפת תכשיר / ציר מתן',
    ADD_LOCAL_TREATMENT: 'תוספת מקומית',
    TAPER_OR_STOP: 'גמילה מדורגת'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* כותרת שלב 3 והטיפול הפעיל הנוכחי */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            <CalendarClock className="w-4 h-4" />
            <span>שלב 3: מעקב אורכי, מחשבוני סיכון דינמיים ובחירת טיפול מותאמת לממצאי המעקב</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            הטיפול הפעיל בכניסה לביקור: {activeOption?.titleHebrew || computedRecs.regimenHebrewTitle}
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
      {/* 3.1 מעבר חוזר ותיעוד השינוי בסימפטומים */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">
                1. הערכה חוזרת ותיעוד השינוי בסימפטומים (מול ביקור הבסיס)
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">
                    {row.item.number}. {row.item.shortTitleHebrew}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                    חשיבות: {row.baselineImportance}/4
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

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-600 ml-1">
                    עוצמה ({SCORE_LABELS_SEVERITY[row.currentSeverity]}):
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
      {/* 3.2 וידוא רקע רפואי ומדדים + פתיחה אוטומטית של מחשבון AHA PREVENT במעקב */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-800">
              2. אימות רקע רפואי, מדדים ותרופות + מחשבון סיכון קרדיו-וסקולרי עדכני (PREVENT)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setManualOpenPreventS3(!manualOpenPreventS3)}
            className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg self-start"
          >
            {showPreventCalcS3 ? 'הסתר מחשבון PREVENT' : 'פתח מחשבון PREVENT במעקב'}
          </button>
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
            <span>אומת – לא חל שינוי ברקע הרפואי או בתרופות הקבועות</span>
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
              value={updatedBpSystolic || ''}
              onChange={(e) => setUpdatedBpSystolic(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">ל"ד דיאסטולי עדכני</label>
            <input
              type="number"
              value={updatedBpDiastolic || ''}
              onChange={(e) => setUpdatedBpDiastolic(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              משקל עדכני (ק"ג) – BMI {decisionSuite.effectiveStage1.bmi || '-'}
            </label>
            <input
              type="number"
              value={updatedWeightKg || ''}
              onChange={(e) => setUpdatedWeightKg(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          {(isOnNk3 || veozaAltAstNormal !== 'NOT_APPLICABLE') && (
            <div>
              <label className="block font-bold text-indigo-800 mb-1">מעקב כבד ויוזה (1/2/3/6/9m):</label>
              <select
                value={veozaAltAstNormal}
                onChange={(e) =>
                  setVeozaAltAstNormal(e.target.value as NonNullable<LongitudinalVisit['veozaAltAstNormal']>)
                }
                className="w-full p-2 border border-indigo-300 rounded-lg bg-white"
              >
                <option value="NOT_APPLICABLE">טרם נבדק / לא רלוונטי</option>
                <option value="NORMAL">תקין (ALT/AST ובילירובין תקינים)</option>
                <option value="ELEVATED_UNDER_3X">עלייה קלה &lt;3x ULN ללא תסמינים</option>
                <option value="CRITICAL_OVER_3X">ALT/AST &gt;3x ULN או בילירובין גבוה (הפסקה מיידית!)</option>
              </select>
            </div>
          )}
        </div>

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
              placeholder="תרופה חדשה שנוספה (למשל למוטריג׳ין / אלטרוקסין / אליקוויס)..."
              value={newlyStartedInteractingMed}
              onChange={(e) => setNewlyStartedInteractingMed(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg bg-white"
            />
            <textarea
              rows={2}
              placeholder="פרט/י את השינוי ברקע הרפואי או בבדיקות הסקר..."
              value={backgroundChangeDetails}
              onChange={(e) => setBackgroundChangeDetails(e.target.value)}
              className="w-full p-2 border border-amber-300 rounded-lg bg-white"
            />
          </div>
        )}

        {/* מחשבון AHA PREVENT מחושב מחדש על פי המדדים העדכניים של ביקור המעקב */}
        {showPreventCalcS3 && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
            <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-indigo-700" />
              <span>חישוב מחדש של סיכון קרדיו-וסקולרי (AHA PREVENT™) לפי מדדי ביקור המעקב:</span>
            </div>
            {decisionSuite.updatedPrevent.hasCompleteLabInputs ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-white border border-indigo-200">
                  <strong>10y Total CVD:</strong> {decisionSuite.updatedPrevent.risk10YearTotalCvd}% |{' '}
                  <strong>ASCVD:</strong> {decisionSuite.updatedPrevent.risk10YearAscvd}%
                </div>
                {decisionSuite.updatedPrevent.risk30YearTotalCvd !== undefined && (
                  <div className="p-2.5 rounded-xl bg-white border border-indigo-200">
                    <strong>30y Total CVD:</strong> {decisionSuite.updatedPrevent.risk30YearTotalCvd}%
                  </div>
                )}
                <div className="p-2.5 rounded-xl bg-white border border-indigo-200">
                  <strong>הנחיית ל"ד:</strong> {decisionSuite.updatedPrevent.bp2025GuidanceHebrew}
                </div>
              </div>
            ) : (
              <p className="text-slate-700">{decisionSuite.updatedPrevent.mhtGuidanceHebrew}</p>
            )}
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* 3.3 תופעות לוואי + דימומים + פתיחה אוטומטית של מחשבון BMS לגורמי סיכון לסרטן הרחם! */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-800">
                3. בירור תופעות לוואי של הטיפול שניתן וטריאז׳ דימומים (BMS 2024)
              </h3>
              <p className="text-[11px] text-slate-500">
                סימון דימום פותח אוטומטית את מחשבון BMS להערכת גורמי סיכון לסרטן/היפרפלזיה של רירית הרחם
              </p>
            </div>
          </div>
          {!stage1Data.hadHysterectomy && (
            <button
              type="button"
              onClick={() => setManualOpenBmsCalc(!manualOpenBmsCalc)}
              className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg self-start"
            >
              {showBmsCalcS3 ? 'הסתר מחשבון BMS לרירית' : 'פתח מחשבון BMS לגורמי סיכון לרירית'}
            </button>
          )}
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
          placeholder="תיאור חופשי של תופעות לוואי נוספות..."
          value={sideEffectsFreeText}
          onChange={(e) => setSideEffectsFreeText(e.target.value)}
          className="w-full p-2.5 border border-slate-300 rounded-xl"
        />

        {/* בירור דימומים ומחשבון BMS 2024 לגורמי סיכון לסרטן הרחם */}
        {!stage1Data.hadHysterectomy && (
          <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-900">
              <input
                type="checkbox"
                checked={hasNewBleeding}
                onChange={(e) => setHasNewBleeding(e.target.checked)}
                className="rounded text-rose-600 w-4 h-4"
              />
              <span>
                מופיע דימום נרתיקי בלתי צפוי / הכתמות תחת הטיפול (פותח אוטומטית מחשבון סיכון סרטן הרחם לפי BMS!)
              </span>
            </label>

            {showBmsCalcS3 && (
              <div className="bg-white rounded-2xl border border-rose-300 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <div className="font-extrabold text-rose-950 flex items-center gap-1.5 text-sm">
                    <Calculator className="w-4 h-4 text-rose-600" />
                    <span>מחשבון BMS 2024 לגורמי סיכון לסרטן/היפרפלזיה של רירית הרחם</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900">
                    סיכון גבוה אם ≥1 מז׳ורי או ≥2 מינוריים
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* גורמים מז'וריים */}
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                    <div className="font-bold text-rose-950">גורמי סיכון מז׳וריים (Major – מספיק ≥1 ל-TVS דחוף):</div>
                    {[
                      {
                        key: 'bmiOver40',
                        label: 'BMI ≥ 40',
                        defaultVal: decisionSuite.effectiveStage1.bmi >= 40
                      },
                      {
                        key: 'lynchOrCowdenSyndrome',
                        label: 'תסמונת לינץ׳ / Cowden גנטית',
                        defaultVal: stage1Data.familyHistory.lynchSyndrome
                      },
                      {
                        key: 'unopposedOrInsufficientProgestogen',
                        label: 'אסטרוגן ללא הגנת פרוגסטוגן מספקת (מירנה >5 שנים / שכחה / GLP-1 / Kyleena-POP)',
                        defaultVal: newlyStartedGlp1
                      },
                      {
                        key: 'sequentialHrtOver5YearsAgeOver45',
                        label: 'משטר HRT ציקלי/סדרתי מעל 5 שנים באישה מעל גיל 45',
                        defaultVal: (stage1Data.yearsOnSequentialHrt || 0) > 5 && stage1Data.age > 45
                      },
                      {
                        key: 'atypicalHyperplasiaHistory',
                        label: 'היסטוריה של היפרפלזיה אטיפית ברירית הרחם',
                        defaultVal:
                          stage1Data.medicalHistory.endometrialHyperplasiaHistory === 'ATYPICAL_OR_UNRESOLVED'
                      }
                    ].map((item) => {
                      const val =
                        (bmsOverrides as any)[item.key] !== undefined
                          ? (bmsOverrides as any)[item.key]
                          : item.defaultVal;
                      return (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(val)}
                            onChange={(e) =>
                              setBmsOverrides((prev) => ({ ...prev, [item.key]: e.target.checked }))
                            }
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* גורמים מינוריים + מאפייני הדימום ו-TVS */}
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                      <div className="font-bold text-amber-950">גורמי סיכון מינוריים (Minor – מצטברים ≥2):</div>
                      {[
                        {
                          key: 'bmi30To39',
                          label: 'BMI 30–39.9',
                          defaultVal:
                            decisionSuite.effectiveStage1.bmi >= 30 && decisionSuite.effectiveStage1.bmi < 40
                        },
                        {
                          key: 'diabetesOrInsulinResistance',
                          label: 'סוכרת / טרום-סוכרת / תנגודת לאינסולין',
                          defaultVal: stage1Data.medicalHistory.diabetesStatus !== 'NONE'
                        },
                        {
                          key: 'pcosOrChronicAnovulation',
                          label: 'PCOS / אל-ביוץ כרוני',
                          defaultVal: stage1Data.medicalHistory.hasPcosOrChronicAnovulation
                        }
                      ].map((item) => {
                        const val =
                          (bmsOverrides as any)[item.key] !== undefined
                            ? (bmsOverrides as any)[item.key]
                            : item.defaultVal;
                        return (
                          <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) =>
                                setBmsOverrides((prev) => ({ ...prev, [item.key]: e.target.checked }))
                              }
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    {hasNewBleeding && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-800">
                          <input
                            type="checkbox"
                            checked={isBleedingHeavyOrProlonged}
                            onChange={(e) => setIsBleedingHeavyOrProlonged(e.target.checked)}
                          />
                          <span>דימום כבד / ממושך / PCB</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasRecentDoseChangeIn3Months}
                            onChange={(e) => setHasRecentDoseChangeIn3Months(e.target.checked)}
                          />
                          <span>שינוי מינון ב-3 חודשים אחרונים</span>
                        </label>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                            עובי רירית ב-TVS (מ"מ):
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            placeholder="רציף ≤4 / ציקלי ≤7"
                            value={tvsThicknessMm ?? ''}
                            onChange={(e) =>
                              setTvsThicknessMm(e.target.value ? Number(e.target.value) : undefined)
                            }
                            className="w-full p-1.5 border rounded bg-white"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={stoppedHrt4WeeksAgoAndResolved}
                            onChange={(e) => setStoppedHrt4WeeksAgoAndResolved(e.target.checked)}
                          />
                          <span>הופסק HRT ל-4 שב׳ והדימום פסק</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {decisionSuite.bleedingTriage && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      decisionSuite.bleedingTriage.urgency === 'URGENT_2_WEEKS'
                        ? 'bg-rose-100/80 border-rose-400 text-rose-950'
                        : decisionSuite.bleedingTriage.urgency === 'ROUTINE_TVS_WITHIN_6_WEEKS'
                        ? 'bg-amber-100/80 border-amber-400 text-amber-950'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    <div className="font-extrabold flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>{decisionSuite.bleedingTriage.headline}</span>
                    </div>
                    <div className="text-[11px] font-semibold">
                      {decisionSuite.bleedingTriage.cutoffReferenceHebrew}
                    </div>
                    <ul className="space-y-1 pt-1 text-[11px]">
                      {decisionSuite.bleedingTriage.actionSteps.map((st, idx) => (
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
      {/* 3.4 בחירת טיפול מפורטת ומדורגת למעקב (באותה רמת פירוט של שלב 2!) */}
      {/* ===================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-700" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              4. אופציות טיפול מותאמות ומדורגות להחלטה בביקור המעקב (תרופות מתאימות בלבד)
            </h3>
            <p className="text-xs text-slate-500">
              האופציות שלהלן חושבו ודורגו מחדש לפי השינוי בסימפטומים, המדדים, תופעות הלוואי והדימומים שדווחו בביקור זה
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisionSuite.rankedFollowUpOptions.map((opt, idx) => {
            const isSelected = chosenFollowUpOption?.id === opt.id;
            const actionLabel = opt.followUpActionType
              ? actionBadgeLabels[opt.followUpActionType]
              : 'אפשרות טיפולית';

            return (
              <div
                key={opt.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition bg-white ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/40 shadow-md'
                    : 'border-slate-200 hover:border-teal-300 shadow-sm'
                }`}
              >
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-extrabold">
                      אופציה #{idx + 1} ({opt.rankScore}%)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 font-bold border border-teal-300">
                      {actionLabel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      {opt.routeLabelHebrew}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{opt.titleHebrew}</h4>
                    <p className="text-slate-500 mt-0.5">{opt.subtitleHebrew}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div>
                      <strong>תכשיר ומינון: </strong>
                      <span>{opt.israeliProductsSummary.primaryAgent}</span>
                    </div>
                    {opt.israeliProductsSummary.secondaryProgestogenOrMonitor && (
                      <div>
                        <strong>הגנת רירית / מעקב: </strong>
                        <span className="text-teal-900 font-semibold">
                          {opt.israeliProductsSummary.secondaryProgestogenOrMonitor}
                        </span>
                      </div>
                    )}
                  </div>

                  {opt.tailoredMatchReasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 text-[11px] text-teal-950 space-y-1">
                      <div className="font-bold">מדוע מוצע כעת במעקב:</div>
                      {opt.tailoredMatchReasons.map((m, i) => (
                        <p key={i}>✓ {m}</p>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>יתרונות:</span>
                      </div>
                      {opt.prosHebrew.map((p, i) => (
                        <p key={i}>• {p}</p>
                      ))}
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-200 space-y-1">
                      <div className="font-bold text-rose-900 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>דגשים:</span>
                      </div>
                      {opt.consHebrew.map((c, i) => (
                        <p key={i}>• {c}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedFollowUpOptionId(opt.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-teal-50 text-slate-800 border border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSelected ? 'נבחר להמשך הטיפול ✓' : 'בחר באופציה זו למעקב'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* בחירה מרובה של תוספות מקומיות (GSM) במעקב – לחות מופרדת מאינטררוזה */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>שילוב טיפולים מקומיים ל-GSM במעקב (ניתן לבחור מספר תוספות במקביל):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {decisionSuite.localGsmOptions.map((loc) => {
              const active = selectedGsmIds.includes(loc.id);
              return (
                <div
                  key={loc.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    active ? 'bg-teal-50/60 border-teal-500' : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900">{loc.titleHebrew}</div>
                    <p className="text-[11px] text-teal-900 font-semibold mt-0.5">{loc.brandAndDoseHebrew}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleGsmId(loc.id)}
                    className={`mt-2.5 py-1.5 px-3 rounded-lg font-bold border transition ${
                      active
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {active ? 'משולב במעקב ✓' : '+ שלב טיפול מקומי זה'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* סקשן נפרד לטסטוסטרון עורי נשי ל-HSDD עמיד בשלב המעקב (נפתח רק אם ירידת החשק נמשכת במעקב!) */}
        {decisionSuite.testosteroneOption && (
          <div
            className={`rounded-2xl border p-5 space-y-3 text-xs transition ${
              includeTestosterone
                ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-400 shadow-sm'
                : 'bg-white border-rose-200 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {decisionSuite.testosteroneOption.titleHebrew}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    נפתח בשלב המעקב בעקבות המשך תלונת ירידה בחשק המיני (HSDD) למרות הטיפול הראשוני (NICE 2024 / BMS / IMS)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIncludeTestosterone(!includeTestosterone)}
                className={`py-2 px-4 rounded-xl font-bold border shrink-0 transition ${
                  includeTestosterone
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-50'
                }`}
              >
                {includeTestosterone ? 'טסטוסטרון עורי משולב במעקב ✓' : '+ הוסף ניסיון 3–6 חודשים בטסטוסטרון ל-HSDD'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="font-semibold text-rose-900">{decisionSuite.testosteroneOption.brandAndDoseHebrew}</p>
                <p className="text-slate-700">{decisionSuite.testosteroneOption.scheduleHebrew}</p>
                {decisionSuite.testosteroneOption.prerequisitesHebrew.map((pr, idx) => (
                  <p key={idx} className="text-[11px] text-slate-600">
                    • {pr}
                  </p>
                ))}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-800">ניטור מעבדה מחייב (Total Testosterone + SHBG):</strong>
                {decisionSuite.testosteroneOption.monitoringProtocolHebrew.map((m, idx) => (
                  <p key={idx} className="text-[11px] text-slate-700">
                    • {m}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* שילוב טיפולים משלימים מוכחים (CBT, היפנוזה קלינית, מיינדפולנס, דיקור) במעקב */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2.5 text-xs">
          <div className="font-bold text-slate-800">
            שילוב טיפולים משלימים שהוכחו כיעילים (ACOG 2026 / BMS 2026 / NICE 2024):
          </div>
          <div className="flex flex-wrap gap-2">
            {decisionSuite.holisticCare.complementaryTherapies.map((comp) => {
              const active = selectedComplementaryIds.includes(comp.id);
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => toggleComplementaryId(comp.id)}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] transition ${
                    active
                      ? 'bg-indigo-700 text-white border-indigo-700'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active ? `✓ ${comp.titleHebrew}` : `+ ${comp.titleHebrew}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* תיעוד נימוק ההחלטה במעקב + יומן הערות מתוארך */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-teal-300 shadow-sm p-5 space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-teal-700" />
              <span>תיעוד ההחלטה הטיפולית במעקב ומדוע נבחרה:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FOLLOW_UP_RATIONALE_CHIPS.map((chip) => {
                const active = rationaleTags.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleRationaleChip(chip)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                      active ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {active ? `✓ ${chip}` : chip}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={2}
              value={rationaleFreeText}
              onChange={(e) => setRationaleFreeText(e.target.value)}
              placeholder="נימוק קליני חופשי להחלטת המעקב..."
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
            <input
              type="text"
              value={customUpdatedRegimenText}
              onChange={(e) => setCustomUpdatedRegimenText(e.target.value)}
              placeholder="התאמת ניסוח מדויק של שורת המרשם המעודכן (אופציונלי)..."
              className="w-full p-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquarePlus className="w-4 h-4 text-teal-600" />
              <span>הערות פנימיות לרופא/ה במלל חופשי (כולל תאריך):</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="הוסף הערה מתוארכת..."
                className="flex-1 p-2 border border-slate-300 rounded-xl"
              />
              <button
                type="button"
                onClick={handleAddDraftNote}
                className="bg-slate-800 text-white font-bold px-3 py-2 rounded-xl"
              >
                הוסף
              </button>
            </div>
            {draftNotes.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {draftNotes.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                    <span className="text-[10px] font-bold text-teal-800">
                      [{new Date(n.createdAtIso).toLocaleString('he-IL')}]
                    </span>
                    <span>{n.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3.5 פלט הנחיות למטופלת בשלב 3: הנחיות למעקב + מלל חופשי מהרופאה */}
      {/* ===================================================================== */}
      <PatientOutputCard
        output={stage3PatientOutput}
        freeTextValue={patientFollowUpFreeText}
        onFreeTextChange={setPatientFollowUpFreeText}
        onPrint={onPrintFollowUpSummary}
        freeTextPlaceholder="כתבי כאן הנחיות אישיות למעקב עבור המטופלת (למשל: לבצע בדיקת דם ל-Estradiol בבוקר לפני מריחת הג׳ל, לתאם US אגן בעוד חודש)..."
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveFollowUpVisit}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-sm flex items-center gap-2 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>שמור ביקור מעקב והנחיות בתיק המטופלת</span>
        </button>
      </div>

      {/* ציר הזמן האורכי של ביקורי המעקב שנשמרו */}
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
                    {actionBadgeLabels[v.medicationAction] || v.medicationAction}
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>שינוי בסימפטומים:</strong> {v.symptomSummaryDeltaText}
                </p>
                <p className="text-teal-950 font-semibold">
                  <strong>החלטה תרופתית במעקב:</strong> {v.updatedRegimenText}
                </p>
                {v.patientFollowUpInstructionsFreeText && (
                  <p className="text-slate-700">
                    <strong>דגש אישי למטופלת:</strong> {v.patientFollowUpInstructionsFreeText}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
