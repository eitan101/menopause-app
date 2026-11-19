import { BleedingTriageResult, evaluateUnscheduledBleeding } from './bleedingAlgorithm';
import { compareLongitudinalSymptoms } from './imsSymptoms';
import { generateCessationProtocol } from './sideEffectEngine';
import {
  BoneRiskAssessment,
  VteRiskAssessment,
  calculateAhaPreventRisk,
  calculateBoneRisk,
  calculateVteRisk
} from './riskCalculators';
import { formulateTreatment } from './treatmentEngine';
import {
  BmsEndometrialCalculatorOverrides,
  LocalGsmOption,
  LongitudinalVisit,
  PreventRiskResult,
  PriorFailedTreatment,
  SelectedTreatmentPlan,
  Stage1Data,
  SymptomAssessmentMap,
  TestosteroneHsddOption,
  TreatmentOptionCard
} from './types';

export interface FollowUpEvaluationInput {
  stage1Data: Stage1Data;
  selectedPlan?: SelectedTreatmentPlan;
  monthsSinceStart: number;
  followUpSymptoms: SymptomAssessmentMap;
  previousVisitSymptoms?: SymptomAssessmentMap;
  updatedBpSystolic?: number;
  updatedBpDiastolic?: number;
  updatedWeightKg?: number;
  newlyStartedGlp1: boolean;
  newlyStartedInteractingMed: string;
  newContraindicationEmerged: boolean;
  veozaAltAstNormal: NonNullable<LongitudinalVisit['veozaAltAstNormal']>;
  reportedSideEffectIds: string[];
  hasNewBleeding: boolean;
  isBleedingHeavyOrProlonged: boolean;
  hasRecentDoseChangeIn3Months: boolean;
  tvsThicknessMm?: number;
  stoppedHrt4WeeksAgoAndResolved?: boolean;
  bmsOverrides?: BmsEndometrialCalculatorOverrides;
}

export interface FollowUpDecisionSuite {
  effectiveStage1: Stage1Data;
  updatedPrevent: PreventRiskResult;
  updatedVte: VteRiskAssessment;
  updatedBone: BoneRiskAssessment;
  bleedingTriage?: BleedingTriageResult;
  shouldAutoOpenPreventInFollowUp: boolean;
  shouldAutoOpenBmsBleedingCalculator: boolean;
  rankedFollowUpOptions: TreatmentOptionCard[];
  localGsmOptions: LocalGsmOption[];
  testosteroneOption?: TestosteroneHsddOption;
  excludedReasonsAudit: string[];
}

// מנוע קבלת החלטות עשיר לשלב 3 – משלב מחשבונים דינמיים ומציע אופציות טיפול מלאות ומדורגות בהתאם לממצאי המעקב!
export function evaluateFollowUpDecisionSuite(input: FollowUpEvaluationInput): FollowUpDecisionSuite {
  const {
    stage1Data,
    selectedPlan,
    monthsSinceStart,
    followUpSymptoms,
    previousVisitSymptoms,
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
  } = input;

  // 1. מיזוג הנתונים המעודכנים שנאספו במעקב לפרופיל קליני אפקטיבי
  const heightM = stage1Data.heightCm > 0 ? stage1Data.heightCm / 100 : 1.64;
  const effectiveWeight = updatedWeightKg && updatedWeightKg > 0 ? updatedWeightKg : stage1Data.weightKg;
  const effectiveBmi =
    effectiveWeight > 0 && stage1Data.heightCm > 0
      ? Number((effectiveWeight / (heightM * heightM)).toFixed(1))
      : stage1Data.bmi;

  const effectiveSbp = updatedBpSystolic && updatedBpSystolic > 0 ? updatedBpSystolic : stage1Data.bpSystolic;
  const effectiveDbp = updatedBpDiastolic && updatedBpDiastolic > 0 ? updatedBpDiastolic : stage1Data.bpDiastolic;

  const extraFailed: PriorFailedTreatment[] = [...stage1Data.preferences.priorFailedTreatments];
  const medLower = (newlyStartedInteractingMed || '').toLowerCase();

  const patchRashNow = reportedSideEffectIds.includes('patch_skin_irritation');
  const progestogenIntoleranceNow = reportedSideEffectIds.includes('pms_mood_fatigue');
  const breastOrBloatingNow =
    reportedSideEffectIds.includes('breast_tenderness') || reportedSideEffectIds.includes('bloating_fluid');
  const nk3LiverRedFlagNow =
    veozaAltAstNormal === 'CRITICAL_OVER_3X' || reportedSideEffectIds.includes('nk3_liver_symptoms');

  if (nk3LiverRedFlagNow) {
    extraFailed.push({
      id: 'fu_veoza_liver',
      treatmentKey: 'VEOZA_NK3',
      customName: 'ויוזה / לינקואט',
      reasonStopped: 'הופסק במעקב עקב עליית אנזימי כבד / תסמינים כבדיים'
    });
  }
  if (reportedSideEffectIds.includes('snri_nausea_sweating_bp')) {
    extraFailed.push({
      id: 'fu_snri_se',
      treatmentKey: 'SSRI_SNRI',
      customName: 'SNRI / SSRI',
      reasonStopped: 'תופעות לוואי בביקור המעקב'
    });
  }
  if (progestogenIntoleranceNow) {
    extraFailed.push({
      id: 'fu_utro_intol',
      treatmentKey: 'UTROGESTAN_ORAL',
      customName: 'אוטרוגסטן פומי',
      reasonStopped: 'אי-סבילות פרוגסטוגנית / עייפות / דכדוך במעקב'
    });
  }

  const effectiveStage1: Stage1Data = {
    ...stage1Data,
    weightKg: effectiveWeight,
    bmi: effectiveBmi,
    bpSystolic: effectiveSbp,
    bpDiastolic: effectiveDbp,
    symptoms: followUpSymptoms,
    lftStatus: nk3LiverRedFlagNow ? 'ABNORMAL' : stage1Data.lftStatus,
    medicalHistory: {
      ...stage1Data.medicalHistory,
      patchAdhesiveSensitivity: stage1Data.medicalHistory.patchAdhesiveSensitivity || patchRashNow,
      breastCancerHistory: stage1Data.medicalHistory.breastCancerHistory || newContraindicationEmerged,
      hypertensionStatus:
        effectiveSbp >= 180 || effectiveDbp >= 110
          ? 'SEVERE_OVER_180_110'
          : effectiveSbp >= 140 || effectiveDbp >= 90
          ? 'UNCONTROLLED'
          : stage1Data.medicalHistory.hypertensionStatus
    },
    medications: {
      ...stage1Data.medications,
      takingGlp1: stage1Data.medications.takingGlp1 || newlyStartedGlp1,
      glp1RecentInitOrDoseEscalation:
        stage1Data.medications.glp1RecentInitOrDoseEscalation || newlyStartedGlp1,
      takingLamotrigine:
        stage1Data.medications.takingLamotrigine ||
        medLower.includes('lamotrigine') ||
        medLower.includes('lamictal') ||
        medLower.includes('למוטריג'),
      takingTherapeuticAnticoagulants:
        stage1Data.medications.takingTherapeuticAnticoagulants ||
        medLower.includes('eliquis') ||
        medLower.includes('xarelto') ||
        medLower.includes('אליקוויס') ||
        medLower.includes('קסרלטו')
    },
    preferences: {
      ...stage1Data.preferences,
      priorFailedTreatments: extraFailed
    }
  };

  // 2. הפעלת מחשבוני המעקב (PREVENT, VTE, עצם, ומחשבון BMS לדימומים ולסרטן הרחם)
  const updatedPrevent = calculateAhaPreventRisk(effectiveStage1);
  const updatedVte = calculateVteRisk(effectiveStage1);
  const updatedBone = calculateBoneRisk(effectiveStage1);

  const baseRecsForRegimen = formulateTreatment(effectiveStage1);
  const bleedingTriage = hasNewBleeding
    ? evaluateUnscheduledBleeding({
        stage1Data: effectiveStage1,
        regimenType: baseRecsForRegimen.regimenType,
        monthsOnCurrentRegimen: monthsSinceStart,
        hasRecentDoseChangeIn3Months,
        isHeavyOrProlonged: isBleedingHeavyOrProlonged,
        tvsEndometrialThicknessMm: tvsThicknessMm,
        stoppedHrt4WeeksAgoAndResolved,
        newlyStartedGlp1,
        updatedBmi: effectiveBmi,
        bmsOverrides
      })
    : undefined;

  const shouldAutoOpenBmsBleedingCalculator = hasNewBleeding && !stage1Data.hadHysterectomy;
  const bpElevatedNow = effectiveSbp >= 135 || effectiveDbp >= 85;
  const bmiCrossed30 = effectiveBmi >= 30 && stage1Data.bmi < 30;
  const shouldAutoOpenPreventInFollowUp =
    bpElevatedNow || bmiCrossed30 || (updatedPrevent.shouldAutoOpen && effectiveStage1.age >= 55);

  // 3. ניתוח שינוי בסימפטומים לצורך בניית כרטיסי החלטה טיפולית למעקב
  const delta = compareLongitudinalSymptoms(
    stage1Data.symptoms,
    followUpSymptoms,
    previousVisitSymptoms
  );
  const residualVms = (followUpSymptoms['1']?.severity || 0) >= 2;
  const suboptimalControl = delta.unresolvedHighPriorityCount > 0 || residualVms;

  const currentOptId = selectedPlan?.selectedPrimaryOptionId;
  const stillEligibleCurrent = baseRecsForRegimen.rankedOptions.find((o) => o.id === currentOptId);
  const hasUterus = !effectiveStage1.hadHysterectomy || effectiveStage1.medicalHistory.hadEndometriosis;

  const followUpCards: TreatmentOptionCard[] = [];

  // א. אם הטיפול הנוכחי עדיין בטוח ומתאים (לא נפסל עקב פריחה/כבד/התווית נגד חדשה/GLP-1 עם דימום):
  if (stillEligibleCurrent && !(newlyStartedGlp1 && hasNewBleeding && stillEligibleCurrent.id === 'opt_transdermal_gel_body_identical')) {
    const goodResponse = !suboptimalControl && !breastOrBloatingNow && !hasNewBleeding;
    followUpCards.push({
      ...stillEligibleCurrent,
      id: `fu_continue_${stillEligibleCurrent.id}`,
      followUpActionType: 'CONTINUE_SAME',
      rankScore: goodResponse ? 96 : 74,
      suitabilityBadge: goodResponse ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
      titleHebrew: `המשך הטיפול הנוכחי ללא שינוי: ${stillEligibleCurrent.titleHebrew}`,
      subtitleHebrew: goodResponse
        ? 'איזון תסמינים מצוין ופרופיל בטיחות תקין בביקור המעקב'
        : 'המשך באותו משטר תוך מעקב והשלמת בירור נקודתי',
      tailoredMatchReasons: goodResponse
        ? [
            `נרשם שיפור קליני משמעותי בשאלון IMS (${delta.percentImprovement}% שיפור) ללא דגלים אדומים.`,
            ...stillEligibleCurrent.tailoredMatchReasons
          ]
        : ['אפשרות לשמירה על המשטר הקיים אם המטופלת מעדיפה להמתין למיצוי השפעה.']
    });
  }

  // ב. אם נותרו תסמינים משמעותיים תחת טיפול הורמונלי וניתן לעלות מדרגת מינון (עם התאמת פרוגסטוגן פרופורציונלית!)
  if (
    suboptimalControl &&
    !newContraindicationEmerged &&
    baseRecsForRegimen.routePreference !== 'NON_HORMONAL_ONLY'
  ) {
    const gelBase = baseRecsForRegimen.rankedOptions.find(
      (o) => o.id === 'opt_transdermal_gel_body_identical'
    );
    if (gelBase) {
      const blocksUtro = effectiveStage1.medicalHistory.peanutOrSoyAllergy || progestogenIntoleranceNow;
      const escalatedProg = !hasUterus
        ? undefined
        : blocksUtro
        ? 'Duphaston 10–20 מ"ג או התקן מירנה 52 מ"ג (מותאם למינון E2 מוגבר)'
        : baseRecsForRegimen.regimenType === 'CONTINUOUS_COMBINED'
        ? 'Utrogestan 200 מ"ג כל ערב (הכפלה פרופורציונלית חובה למינון E2 בינוני-גבוה!)'
        : 'Utrogestan 300 מ"ג ל-12 יום בחודש (התאמה פרופורציונלית למינון E2 גבוה!)';

      followUpCards.push({
        id: 'fu_escalate_transdermal_dose',
        category: 'HORMONAL_SYSTEMIC',
        followUpActionType: 'ESCALATE_DOSE',
        rankScore: 95,
        suitabilityBadge: 'RECOMMENDED_TOP',
        titleHebrew: 'עליית מדרגת מינון באסטרדיול העורי + התאמת פרוגסטוגן פרופורציונלית (BMS 2024)',
        subtitleHebrew: 'מענה לתת-איזון של גלי חום/שינה בביקור המעקב תוך שמירה מלאה על הגנת הרירית',
        routeLabelHebrew: 'עורי במינון מוגבר',
        regimenLabelHebrew: gelBase.regimenLabelHebrew,
        israeliProductsSummary: {
          primaryAgent: 'Estrogel 3 לחיצות ביום (2.25 מ"ג E2) או מדבקת Evorel 75–100 פעמיים בשבוע',
          secondaryProgestogenOrMonitor: escalatedProg,
          scheduleHebrew: escalatedProg
            ? `מריחה/הדבקה עורית מוגברת + ${escalatedProg}`
            : 'אסטרדיול עורי במינון מוגבר ללא צורך בפרוגסטוגן'
        },
        prosHebrew: [
          'נותן מענה ישיר לתסמינים שטרם חלפו במינון ההתחלתי ללא מעבר ראשון בכבד.',
          hasUterus
            ? 'כולל העלאה פרופורציונלית אוטומטית של הפרוגסטוגן למניעת היפרפלזיה של הרירית!'
            : 'ללא צורך בפרוגסטוגן לאחר כריתת רחם.'
        ],
        consHebrew: [
          'מומלץ לבדוק במקביל רמת Estradiol בדם כדי לוודא שאין תת-ספיגה עורית המצריכה החלפת ג׳ל ↔ מדבקה.'
        ],
        tailoredMatchReasons: [
          `זוהו ${delta.unresolvedHighPriorityCount || 1} תסמינים פעילים במעקב הדורשים טיטרציית מינון.`
        ],
        patientHowToTakeHebrew: [
          'העלי את מינון האסטרוגן העורי לפי המרשם המעודכן (על עור נקי ויבש בזרועות/ירכיים).',
          ...(escalatedProg ? [`חשוב מאוד להגנת רירית הרחם: עדכני במקביל את הפרוגסטוגן אל ${escalatedProg}.`] : []),
          'בצעי בדיקת דם לרמת Estradiol להערכת איכות הספיגה העורית.'
        ],
        monitoringNotesHebrew: 'לבדוק Serum Estradiol ולבצע ביקורת חוזרת בעוד 3 חודשים.'
      });
    }
  }

  // ג. אם דווחו רגישות בשדיים או נפיחות – הצעת הפחתת מינון מובנית
  if (breastOrBloatingNow && !newContraindicationEmerged && stillEligibleCurrent?.category === 'HORMONAL_SYSTEMIC') {
    followUpCards.push({
      id: 'fu_reduce_estrogen_dose',
      category: 'HORMONAL_SYSTEMIC',
      followUpActionType: 'REDUCE_DOSE',
      rankScore: 91,
      suitabilityBadge: 'RECOMMENDED_TOP',
      titleHebrew: 'הפחתת מדרגת מינון האסטרדיול העורי להקלת גודש בשדיים / נפיחות',
      subtitleHebrew: 'התאמה עדינה של המינון כלפי מטה תוך שמירה על הקלת התסמינים',
      routeLabelHebrew: 'עורי במינון נמוך',
      regimenLabelHebrew: stillEligibleCurrent.regimenLabelHebrew,
      israeliProductsSummary: {
        primaryAgent: 'Estrogel לחיצה אחת ביום (0.75 מ"ג) או מדבקת Evorel 25 פעמיים בשבוע',
        secondaryProgestogenOrMonitor: stillEligibleCurrent.israeliProductsSummary.secondaryProgestogenOrMonitor,
        scheduleHebrew: 'הפחתת מנת האסטרוגן תוך המשך הגנת הרירית הסדירה'
      },
      prosHebrew: ['מפחית במהירות רגישות/מלאות בשדיים ואגירת נוזלים מבלי לוותר על יתרונות הטיפול.'],
      consHebrew: ['במידה שגלי החום ישובו ניתן לחזור למינון הביניים בהדרגה.'],
      tailoredMatchReasons: ['מותאם ישירות לתלונת רגישות בשדיים / נפיחות שדווחה בביקור המעקב.'],
      patientHowToTakeHebrew: [
        'הפחיתי את מינון האסטרוגן העורי ללחיצה אחת של אסטרוג׳ל ביום (או מדבקת Evorel 25 פעמיים בשבוע) והמשיכי את הגנת הרירית כרגיל.'
      ]
    });
  }

  // ד. הוספת כל האופציות המתאימות האחרות להחלפת תרופה / ציר מתן (למשל מעבר למירנה תחת GLP-1 או דימום, מעבר לג'ל בפריחה ממדבקה, מעבר ללא-הורמונלי בהתווית נגד חדשה!)
  for (const candidate of baseRecsForRegimen.rankedOptions) {
    if (candidate.id === currentOptId) continue;

    let adjustedScore = candidate.rankScore;
    const extraReasons = [...candidate.tailoredMatchReasons];

    if (
      (newlyStartedGlp1 || hasNewBleeding || progestogenIntoleranceNow) &&
      candidate.id === 'opt_mirena_plus_transdermal_e2'
    ) {
      adjustedScore = 96;
      extraReasons.unshift(
        newlyStartedGlp1
          ? 'מומלץ #1 בעקבות התחלת GLP-1 במעקב – מגן על רירית הרחם ישירות ללא תלות בריקון הקיבה!'
          : hasNewBleeding
          ? 'מומלץ #1 לייצוב דימומים בלתי צפויים תחת MHT (לאחר השלמת TVS תקין לפי ספי BMS)!'
          : 'מומלץ #1 לעקיפת אי-סבילות לכדורי פרוגסטרון פומיים!'
      );
    }

    if (patchRashNow && candidate.id === 'opt_transdermal_gel_body_identical') {
      adjustedScore = 95;
      extraReasons.unshift('מומלץ #1 להחלפה בעקבות גירוי עורי ממדבקות (מדבקות סוננו אוטומטית).');
    }

    if (nk3LiverRedFlagNow && candidate.category === 'NON_HORMONAL_SYSTEMIC') {
      adjustedScore = Math.max(adjustedScore, 93);
      extraReasons.unshift('חלופה לא-הורמונלית בטוחה לכבד לאחר הפסקת חוסם NK3.');
    }

    if (newContraindicationEmerged && candidate.category === 'NON_HORMONAL_SYSTEMIC') {
      adjustedScore = Math.max(adjustedScore, 94);
      extraReasons.unshift('מעבר בטוח למסלול לא-הורמונלי עקב הופעת התווית נגד ל-MHT בביקור המעקב.');
    }

    followUpCards.push({
      ...candidate,
      followUpActionType: 'SWITCH_DRUG_OR_ROUTE',
      rankScore: Math.min(98, adjustedScore),
      suitabilityBadge: adjustedScore >= 88 ? 'RECOMMENDED_TOP' : candidate.suitabilityBadge,
      titleHebrew: `החלפת טיפול אל: ${candidate.titleHebrew}`,
      tailoredMatchReasons: extraReasons
    });
  }

  // ה. אפשרות גמילה מדורגת / הפסקת טיפול (מסוננת או מלווה באזהרה ברורה ב-POI < 45!)
  const isYoungPoiOrEarly = effectiveStage1.age > 0 && effectiveStage1.age < 45;
  if (!isYoungPoiOrEarly) {
    const taperProtocol = generateCessationProtocol(false);
    followUpCards.push({
      id: 'fu_taper_gradual_stop',
      category: 'NON_HORMONAL_SYSTEMIC',
      followUpActionType: 'TAPER_OR_STOP',
      rankScore: 52,
      suitabilityBadge: 'CONDITIONAL',
      titleHebrew: 'פרוטוקול הפחתה הדרגתית והפסקת טיפול סיסטמי (Tapering)',
      subtitleHebrew: 'ירידה מדורגת של 25%–50% כל 4–8 שבועות לצמצום חזרת גלי חום',
      routeLabelHebrew: 'גמילה מדורגת',
      regimenLabelHebrew: 'הפסקה מבוקרת',
      israeliProductsSummary: {
        primaryAgent: 'הפחתה הדרגתית של מינון האסטרוגן על פני 2–3 חודשים (תוך שמירת הפרוגסטוגן עד הסיום)',
        scheduleHebrew: 'ירידת מדרגה כל 4–8 שבועות + המשך טיפול נרתיקי מקומי ל-GSM לפי צורך'
      },
      prosHebrew: ['מפחית זעזוע הורמונלי בבת אחת ומאפשר לבחון אם גלי החום חלפו באופן טבעי.'],
      consHebrew: ['כ-50% סיכוי לחזרת תסמינים וזומוטוריים; הפסקת ההגנה הסיסטמית על צפיפות העצם.'],
      tailoredMatchReasons: ['לבחירה כאשר המטופלת מאוזנת לאורך זמן ומבקשת לנסות הפסקת טיפול.'],
      patientHowToTakeHebrew: [taperProtocol]
    });
  } else {
    baseRecsForRegimen.excludedReasonsAudit.push(
      'הפסקת טיפול הורמונלי אינה מוצעת בגיל מתחת ל-45 (POI / מנופאוזה מוקדמת) – חובה להמשיך הגנה הורמונלית עד גיל ~51 להגנה על הלב, העצם והמוח (מקרה 2 בקורס מגיד)!'
    );
  }

  followUpCards.sort((a, b) => b.rankScore - a.rankScore);

  return {
    effectiveStage1,
    updatedPrevent,
    updatedVte,
    updatedBone,
    bleedingTriage,
    shouldAutoOpenPreventInFollowUp,
    shouldAutoOpenBmsBleedingCalculator,
    rankedFollowUpOptions: followUpCards,
    localGsmOptions: baseRecsForRegimen.localGsmOptions,
    testosteroneOption: baseRecsForRegimen.testosteroneOption,
    excludedReasonsAudit: baseRecsForRegimen.excludedReasonsAudit
  };
}
