/**
 * מערך בדיקות מערכת מקצה לקצה (10 System Test Scenarios)
 * קובץ מפרט הבדיקות המקושר דו-כיוונית: ../docs/TEST_SPECIFICATION.md
 */
import { evaluateCompletenessGate } from '../src/clinical-engine/completenessGate';
import { getEligibleArsenalForPatient } from '../src/clinical-engine/data/drugArsenal';
import {
  createBlankStage1Data,
  createDefaultDemoStage1Data,
  createInitialRecord
} from '../src/clinical-engine/defaults';
import { checkDrugInteractions } from '../src/clinical-engine/drugInteractions';
import { evaluateFollowUpDecisionSuite } from '../src/clinical-engine/followUpDecisionEngine';
import { IMS_19_SYMPTOM_ITEMS } from '../src/clinical-engine/imsSymptoms';
import {
  buildStage1PatientInstructions,
  buildStage2PatientInstructions,
  buildStage3PatientInstructions
} from '../src/clinical-engine/patientInstructionsBuilder';
import { calculateAhaPreventRisk } from '../src/clinical-engine/riskCalculators';
import { evaluateContraceptionAndMirena, evaluateSTRAWStage } from '../src/clinical-engine/strawStaging';
import { formulateTreatment } from '../src/clinical-engine/treatmentEngine';
import { SelectedTreatmentPlan } from '../src/clinical-engine/types';

export interface SystemScenarioDefinition {
  id: string;
  functionName: string;
  specAnchor: string; // הפניה דו-כיוונית אל docs/TEST_SPECIFICATION.md#<anchor>
  specFile: 'docs/TEST_SPECIFICATION.md';
  knowledgeSources: string[];
  titleHebrew: string;
  run: () => void;
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * @testId TC-SYS-01
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-01
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/red-whale/02-nice-guideline-menopause-2024.md, knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md, knowledge/markdown/magid-course/mht-in-brca-carriers-srebnik.md
 */
export function testTcSys01_SuboptimalActivelleMultiGsmAndTestosterone(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'יעל לוי – מקרה 1';
  s1.age = 51;
  s1.weightKg = 73;
  s1.heightCm = 166;
  s1.bmi = 26.5;
  s1.bpSystolic = 110;
  s1.bpDiastolic = 73;
  s1.isSmoker = false;
  s1.exerciseRegular = true;
  s1.cyclePattern = 'AMENORRHEA_OVER_12_MONTHS';
  s1.monthsSinceLastPeriod = 12;
  s1.familyHistory.familyPrematureCvd = true;
  s1.preventInputs = {
    isManuallyExpanded: false,
    totalCholesterolMgDl: 220,
    hdlCholesterolMgDl: 55,
    ldlCholesterolMgDl: 145,
    egfrMlMin: 92
  };
  s1.symptoms['1'] = { severity: 3, frequency: 3, importance: 4 };  // גלי חום
  s1.symptoms['7'] = { severity: 3, importance: 4 };               // יקיצות 03:00
  s1.symptoms['13'] = { severity: 3, importance: 4 };              // ליבידו ירוד (HSDD)
  s1.symptoms['15'] = { severity: 2, importance: 3 };              // יובש נרתיקי (GSM)
  s1.preferences.priorFailedTreatments = [
    {
      id: 'subopt_activelle',
      treatmentKey: 'ORAL_COMBINED_NETA',
      customName: 'אקטיבל',
      reasonStopped: 'הקלה חלקית בלבד בגלי חום ויקיצות ב-03:00 במינון קבוע של 1 מ"ג',
      stopReasonCategory: 'SUBOPTIMAL_EFFICACY'
    }
  ];

  // 1. אימות פתיחת מחשבון AHA PREVENT™ וחישוב 10 + 30 שנה
  const prevent = calculateAhaPreventRisk(s1);
  assertCondition(prevent.shouldAutoOpen === true, 'PREVENT must auto-open on premature family CVD');
  assertCondition(prevent.hasCompleteLabInputs === true, 'PREVENT must calculate 10y & 30y scores');
  assertCondition((prevent.risk30YearTotalCvd || 0) > (prevent.risk10YearTotalCvd || 0), '30y CVD > 10y CVD');

  // 2. אימות שאקטיבל אינו פסול רפואית (אין התווית נגד באישה בריאה בת 51!), אך ג׳ל אסטרדיול עורי + אוטרוגסטן מדורג #1!
  const eligibleArsenal = getEligibleArsenalForPatient(s1);
  assertCondition(
    eligibleArsenal.some((d) => d.id === 'activelle_eviana_novofem'),
    'Activelle has NO medical contraindication in a healthy 51yo when prior stop was SUBOPTIMAL_EFFICACY!'
  );

  const recs = formulateTreatment(s1);
  assertCondition(
    recs.rankedOptions[0].id === 'opt_transdermal_gel_body_identical',
    'Transdermal E2 gel + bedtime Utrogestan must rank #1 above oral MHT'
  );
  const oralCard = recs.rankedOptions.find((o) => o.id === 'opt_oral_mht_regimen');
  assertCondition(
    oralCard?.suitabilityBadge === 'CONDITIONAL',
    'Oral MHT should remain medically available as CONDITIONAL (lower ranked due to prior 1mg suboptimal control, sleep & SHBG)'
  );

  // 3. אימות הפרדת תכשירי לחות מאינטררוזה ובחירה מרובה של תוספות מקומיות ל-GSM
  const gsmIds = recs.localGsmOptions.map((g) => g.id);
  assertCondition(gsmIds.includes('gsm_moisturizers_lubricants'), 'Moisturizers must be a distinct GSM option');
  assertCondition(gsmIds.includes('gsm_intrarosa_prasterone'), 'Intrarosa must be separated from moisturizers');
  assertCondition(gsmIds.includes('gsm_vaginal_estrogen'), 'Vaginal estrogen must be available');

  // 4. אימות תזמון הטסטוסטרון לפי הקווים המנחים: בשלב 2 טסטוסטרון אינו מוצע כקו ראשון, אלא מוצגת הערת הניהול הדו-שלבי!
  assertCondition(
    recs.testosteroneOption === undefined,
    'Systemic Testosterone must NOT be offered as a first-line Stage 2 initiation before optimizing transdermal E2 + GSM!'
  );
  assertCondition(
    Boolean(recs.hsddStepwiseNoteHebrew?.includes('שלב 3')),
    'Stage 2 must explain the two-step HSDD rule (optimize transdermal E2 + GSM first, evaluate Testosterone in Stage 3 follow-up)'
  );

  // אימות התאמת אורח החיים למטופלת שאינה מעשנת ופעילה גופנית
  assertCondition(
    !recs.holisticCare.lifestyleItems.some((l) => l.id === 'life_smoking_cessation'),
    'Non-smoker must NOT receive smoking cessation recommendation'
  );
  assertCondition(
    recs.holisticCare.lifestyleItems.some((l) => l.id === 'life_physical_activity'),
    'Holistic care must include personalized exercise guidance'
  );

  const plan: SelectedTreatmentPlan = {
    selectedPrimaryOptionId: recs.rankedOptions[0].id,
    selectedGsmOptionIds: ['gsm_vaginal_estrogen', 'gsm_moisturizers_lubricants'],
    selectedComplementaryIds: ['comp_cbt_menos'],
    includeTestosterone: false,
    selectionRationaleTags: ['מענה משולב להפרעות שינה (נטילת ערב)'],
    selectionRationaleFreeText: 'מעבר מאקטיבל לג׳ל + אוטרוגסטן + שילוב מקומי כפול',
    stage2PatientInstructionsFreeText: 'למרוח את הג׳ל בבוקר וליטול אוטרוגסטן לפני השינה.',
    selectedAtIso: new Date().toISOString()
  };

  const s2Output = buildStage2PatientInstructions(s1, recs, plan);
  assertCondition(s2Output.formattedPlainText.includes('וגיפם'), 'Stage 2 output must include selected vaginal estrogen');
  assertCondition(s2Output.formattedPlainText.includes('Replens'), 'Stage 2 output must include co-selected moisturizer');
  assertCondition(
    s2Output.formattedPlainText.includes('למרוח את הג׳ל בבוקר'),
    'Stage 2 output must include physician free text'
  );

  // 5. שלב 3 (מעקב כעבור 3 חודשים): גלי החום והשינה התאזנו תחת E2 עורי + GSM, אך ירידת החשק המיני (HSDD) נמשכת -> טסטוסטרון נפתח ומומלץ!
  const followUpSym = {
    ...s1.symptoms,
    '1': { severity: 0 as const, frequency: 0 as const, importance: 4 as const },
    '7': { severity: 1 as const, importance: 4 as const },
    '15': { severity: 0 as const, importance: 3 as const },
    '13': { severity: 3 as const, importance: 4 as const } // HSDD ממשיך להטריד למרות איזון E2 + GSM!
  };

  const fuSuite = evaluateFollowUpDecisionSuite({
    stage1Data: s1,
    selectedPlan: plan,
    monthsSinceStart: 3,
    followUpSymptoms: followUpSym,
    newlyStartedGlp1: false,
    newlyStartedInteractingMed: '',
    newContraindicationEmerged: false,
    veozaAltAstNormal: 'NOT_APPLICABLE',
    reportedSideEffectIds: [],
    hasNewBleeding: false,
    isBleedingHeavyOrProlonged: false,
    hasRecentDoseChangeIn3Months: false
  });

  assertCondition(
    fuSuite.testosteroneOption !== undefined && fuSuite.testosteroneOption.recommended === true,
    'Stage 3 Follow-Up MUST unlock & recommend transdermal Testosterone when distressing HSDD persists despite transdermal E2 + GSM!'
  );

  const s3Out = buildStage3PatientInstructions(s1, {
    updatedRegimenText: fuSuite.rankedFollowUpOptions[0].titleHebrew,
    selectedOption: fuSuite.rankedFollowUpOptions[0],
    includeTestosterone: true,
    testosteroneOption: fuSuite.testosteroneOption,
    medicationAction: 'CONTINUE_SAME'
  });
  assertCondition(
    s3Out.formattedPlainText.includes('טסטוסטרון') && s3Out.formattedPlainText.includes('SHBG'),
    'Stage 3 patient output must include Testosterone dosing & SHBG/Testosterone blood monitoring'
  );
}

/**
 * @testId TC-SYS-02
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-02
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/magid-course/asrm-eshre-ims-poi-guideline-2024.md, knowledge/markdown/red-whale/05-hrt-regimens-and-progestogen-doses.md
 */
export function testTcSys02_EarlyMenopauseProportionalDoseAndStopGuard(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'דנה כץ – מקרה 2 (FXPOI)';
  s1.age = 41;
  s1.weightKg = 60;
  s1.heightCm = 165;
  s1.bmi = 22.0;
  s1.bpSystolic = 115;
  s1.bpDiastolic = 72;
  s1.cyclePattern = 'AMENORRHEA_OVER_12_MONTHS';
  s1.monthsSinceLastPeriod = 12;
  s1.dxaStatus = 'NOT_PERFORMED';
  s1.medicalHistory.hasAllergiesOrSensitivities = true;
  s1.medicalHistory.patchAdhesiveSensitivity = true;
  s1.preferences.priorFailedTreatments = [
    {
      id: 'f1',
      treatmentKey: 'ORAL_FEMOSTON',
      customName: 'פמוסטון קונטי',
      reasonStopped: 'דימומים מתמשכים וכאבי ראש',
      stopReasonCategory: 'INTOLERANCE_OR_ALLERGY'
    },
    {
      id: 'f2',
      treatmentKey: 'EVOREL_PATCH',
      customName: 'אוורל קונטי',
      reasonStopped: 'פריחה עורית מגרדת',
      stopReasonCategory: 'INTOLERANCE_OR_ALLERGY'
    }
  ];

  const straw = evaluateSTRAWStage(s1);
  assertCondition(straw.stage === 'EARLY_MENOPAUSE', 'Age 41 amenorrhea must stage as EARLY_MENOPAUSE');

  const s1Output = buildStage1PatientInstructions(s1);
  assertCondition(s1Output.formattedPlainText.includes('DXA'), 'Stage 1 output must instruct DXA bone scan for age <45');

  const recs = formulateTreatment(s1);
  assertCondition(
    recs.estrogenDoseTier === 'MODERATE_HIGH_PHYSIOLOGIC',
    'Early menopause (<45) must receive MODERATE_HIGH_PHYSIOLOGIC E2 tier'
  );
  assertCondition(
    !recs.rankedOptions.some((o) => o.id === 'opt_transdermal_patch_regimen'),
    'Patch option must be strictly excluded due to patch adhesive sensitivity & prior intolerance'
  );
  const eligibleDrugs = getEligibleArsenalForPatient(s1);
  assertCondition(!eligibleDrugs.some((d) => d.id === 'femoston_family'), 'Intolerated Femoston must be excluded');

  const gelCard = recs.rankedOptions.find((o) => o.id === 'opt_transdermal_gel_body_identical');
  assertCondition(Boolean(gelCard), 'Transdermal gel option must be available');
  assertCondition(
    Boolean(gelCard?.israeliProductsSummary.secondaryProgestogenOrMonitor?.includes('200 מ"ג')),
    'Proportional progestogen rule must double continuous Utrogestan to 200mg daily!'
  );

  // אימות הגנת שלב 3 מפני הפסקת טיפול הורמונלי בגיל 41
  const fuSuite = evaluateFollowUpDecisionSuite({
    stage1Data: s1,
    selectedPlan: {
      selectedPrimaryOptionId: 'opt_transdermal_gel_body_identical',
      selectedGsmOptionIds: [],
      includeTestosterone: false,
      selectionRationaleTags: [],
      selectionRationaleFreeText: '',
      stage2PatientInstructionsFreeText: '',
      selectedAtIso: new Date().toISOString()
    },
    monthsSinceStart: 3,
    followUpSymptoms: s1.symptoms,
    newlyStartedGlp1: false,
    newlyStartedInteractingMed: '',
    newContraindicationEmerged: false,
    veozaAltAstNormal: 'NOT_APPLICABLE',
    reportedSideEffectIds: [],
    hasNewBleeding: false,
    isBleedingHeavyOrProlonged: false,
    hasRecentDoseChangeIn3Months: false
  });
  assertCondition(
    !fuSuite.rankedFollowUpOptions.some((o) => o.id === 'fu_taper_gradual_stop'),
    'Stopping/tapering HRT must NOT be offered as an option in early menopause (<45)!'
  );
}

/**
 * @testId TC-SYS-03
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-03
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md, knowledge/markdown/red-whale/07-hrt-and-breast-cancer-risk.md
 */
export function testTcSys03_BenignBreastBiopsyMaternalCancer70AndAshkenaziBrca(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'רונית מזרחי-כהן – מקרה 3';
  s1.age = 49;
  s1.ethnicity = 'MIXED_ASHKENAZI';
  s1.weightKg = 68;
  s1.heightCm = 162;
  s1.bmi = 25.9;
  s1.bpSystolic = 118;
  s1.bpDiastolic = 76;
  s1.cyclePattern = 'AMENORRHEA_OVER_12_MONTHS';
  s1.monthsSinceLastPeriod = 14;
  s1.medicalHistory.hasMalignancyOrBreastHistory = true;
  s1.medicalHistory.benignBreastBiopsyNoAtypia = true;
  s1.familyHistory.familyBreastOrOvarianCancer = true;
  s1.familyHistory.familyCancerFirstDegreeUnder50OrMultiple = false; // אם חלתה בגיל 70
  s1.familyHistory.brcaStatus = 'NOT_TESTED';
  s1.mammographyStatus = 'NOT_PERFORMED';
  s1.papHpvStatus = 'UP_TO_DATE_NORMAL';
  s1.symptoms['1'] = { severity: 4, frequency: 4, importance: 4 };

  const gate = evaluateCompletenessGate(s1);
  assertCondition(gate.isPassed === true, 'Age 49 without high-risk family history must pass without mammogram block');
  assertCondition(
    gate.systemicMhtContraindicated === false,
    'Benign breast biopsy without atypia + maternal BC at 70 is NOT a contraindication to MHT!'
  );
  assertCondition(
    gate.basketRecommendations.some((b) => b.includes('BRCA')),
    'Must prompt Israeli Health Basket BRCA founder screening for mixed Ashkenazi age >=25'
  );

  const s1Out = buildStage1PatientInstructions(s1);
  assertCondition(s1Out.formattedPlainText.includes('BRCA'), 'Stage 1 patient instructions must mention BRCA basket test');

  const recs = formulateTreatment(s1);
  assertCondition(
    recs.rankedOptions.some((o) => o.category === 'HORMONAL_SYSTEMIC'),
    'Hormonal MHT options must be offered'
  );
}

/**
 * @testId TC-SYS-04
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-04
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/red-whale/11-problematic-bleeding-on-hrt.md, knowledge/markdown/magid-course/bleeding-and-side-effects-under-mht-freiberg.md
 */
export function testTcSys04_CardiometabolicObesityAndStage3BmsBleedingCalculator(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'מיכל אברהם – מקרה 4';
  s1.age = 56;
  s1.weightKg = 91;
  s1.heightCm = 163;
  s1.bmi = 34.3;
  s1.bpSystolic = 132;
  s1.bpDiastolic = 82;
  s1.cyclePattern = 'AMENORRHEA_OVER_12_MONTHS';
  s1.monthsSinceLastPeriod = 48;
  s1.medicalHistory.hasCardiovascularOrMetabolicHistory = true;
  s1.medicalHistory.hypertensionStatus = 'CONTROLLED';
  s1.medicalHistory.diabetesStatus = 'PREDIABETES';
  s1.medications.hasCardioRenalAnticoagMeds = true;
  s1.medications.takingAntihypertensives = true;
  s1.medications.takingAceArbOrPotassiumSparing = true;
  s1.medications.hasThyroidOrSteroidMeds = true;
  s1.medications.takingLevothyroxine = true;

  const recs = formulateTreatment(s1);
  assertCondition(recs.routePreference === 'TRANSDERMAL_MANDATORY', 'BMI 34.3 must enforce TRANSDERMAL_MANDATORY');
  assertCondition(
    !recs.rankedOptions.some((o) => o.id === 'opt_oral_mht_regimen'),
    'Oral MHT must be completely excluded when BMI >= 30'
  );
  const arsenal = getEligibleArsenalForPatient(s1);
  assertCondition(!arsenal.some((d) => d.id === 'angeliq'), 'Angeliq must be excluded on ACEi/ARB + mandatory transdermal');

  // שלב 3: הופעת דימום תחת הטיפול + אי-סבילות לאוטרוגסטן + בדיקת פתיחת מחשבון BMS וסף 4 מ"מ!
  const fu = evaluateFollowUpDecisionSuite({
    stage1Data: s1,
    selectedPlan: {
      selectedPrimaryOptionId: 'opt_transdermal_patch_regimen',
      selectedGsmOptionIds: [],
      includeTestosterone: false,
      selectionRationaleTags: [],
      selectionRationaleFreeText: '',
      stage2PatientInstructionsFreeText: '',
      selectedAtIso: new Date().toISOString()
    },
    monthsSinceStart: 4,
    followUpSymptoms: s1.symptoms,
    newlyStartedGlp1: false,
    newlyStartedInteractingMed: '',
    newContraindicationEmerged: false,
    veozaAltAstNormal: 'NOT_APPLICABLE',
    reportedSideEffectIds: ['pms_mood_fatigue'],
    hasNewBleeding: true,
    isBleedingHeavyOrProlonged: false,
    hasRecentDoseChangeIn3Months: true
  });

  assertCondition(fu.shouldAutoOpenBmsBleedingCalculator === true, 'BMS calculator must auto-open on Stage 3 bleeding');
  assertCondition(
    fu.bleedingTriage?.bmsCalculator.riskTier === 'HIGH',
    'BMI 34.3 (Minor #1) + Prediabetes (Minor #2) => >=2 Minor factors => BMS HIGH endometrial risk!'
  );
  assertCondition(fu.bleedingTriage?.tvsIndicated === true, 'High BMS risk requires urgent TVS even within 6 months');
  assertCondition(
    fu.rankedFollowUpOptions[0].id === 'opt_mirena_plus_transdermal_e2',
    'Mirena + Transdermal E2 must rank #1 in follow-up for bleeding stabilization & progestogen intolerance'
  );

  // בדיקת סף TVS של 5.5 מ"מ במשטר רציף (> 4 מ"מ -> מחייב פיפל והיסטרוסקופיה!)
  const fuThickTvs = evaluateFollowUpDecisionSuite({
    stage1Data: s1,
    monthsSinceStart: 4,
    followUpSymptoms: s1.symptoms,
    newlyStartedGlp1: false,
    newlyStartedInteractingMed: '',
    newContraindicationEmerged: false,
    veozaAltAstNormal: 'NOT_APPLICABLE',
    reportedSideEffectIds: [],
    hasNewBleeding: true,
    isBleedingHeavyOrProlonged: false,
    hasRecentDoseChangeIn3Months: false,
    tvsThicknessMm: 5.5
  });
  assertCondition(
    fuThickTvs.bleedingTriage?.endometrialBiopsyIndicated === true,
    'TVS 5.5mm on ccHRT (>4mm cutoff) must indicate endometrial biopsy (Pipelle) & hysteroscopy'
  );
}

/**
 * @testId TC-SYS-05
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-05
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/red-whale/hebrew-summary-perimenopause-contraception.md, knowledge/markdown/red-whale/08-hrt-and-risk-of-vte.md
 */
export function testTcSys05_ChcOver50SuppressedTshMimicAndFamilyVte(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'טלי שפירא – מקרים 5+6';
  s1.age = 53;
  s1.weightKg = 64;
  s1.heightCm = 165;
  s1.bmi = 23.5;
  s1.bpSystolic = 118;
  s1.bpDiastolic = 74;
  s1.contraception.currentMethod = 'CHC_PILL_PATCH_RING'; // Meliane בגיל 53
  s1.contraception.sexuallyActiveWithPregnancyRisk = true;
  s1.medications.hasThyroidOrSteroidMeds = true;
  s1.medications.takingLevothyroxine = true;
  s1.medications.recentTshLevel = 0.05; // דיכוי TSH חמור המחקה גלי חום וזעם!
  s1.familyHistory.familyVteOrThrombophilia = true;
  s1.medicalHistory.hasNeurologicalHistory = true;
  s1.medicalHistory.migraineWithoutAura = true;

  const contra = evaluateContraceptionAndMirena(s1);
  assertCondition(Boolean(contra.chcOver50SwitchWarning), 'Must warn to stop CHC (Meliane) at age >=50');

  const interactions = checkDrugInteractions(s1);
  assertCondition(
    interactions.some((i) => i.id === 'tsh_suppressed'),
    'Must flag suppressed TSH (0.05 < 0.4) mimicking vasomotor/mood symptoms!'
  );

  const recs = formulateTreatment(s1);
  assertCondition(
    recs.routePreference === 'TRANSDERMAL_MANDATORY',
    '1st-degree family VTE must enforce transdermal route'
  );
  assertCondition(
    !recs.rankedOptions.some((o) => o.id === 'opt_oral_mht_regimen'),
    'Oral MHT must be filtered out due to family VTE'
  );

  const s1Out = buildStage1PatientInstructions(s1);
  assertCondition(s1Out.formattedPlainText.includes('TSH'), 'Stage 1 output must instruct repeat TSH & Eltroxin adjustment');
  assertCondition(s1Out.formattedPlainText.includes('CHC'), 'Stage 1 output must instruct transitioning off CHC');
}

/**
 * @testId TC-SYS-06
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-06
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/magid-course/mdcalc-10491-aha-prevent-calculator.md, knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md
 */
export function testTcSys06_LatePostmenopauseAge62PreventAndVeozaMonitoring(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'רחל גולן – מקרה 7';
  s1.age = 62;
  s1.weightKg = 75;
  s1.heightCm = 164;
  s1.bmi = 27.9;
  s1.bpSystolic = 138;
  s1.bpDiastolic = 84;
  s1.isSmoker = true;
  s1.cyclePattern = 'AMENORRHEA_OVER_12_MONTHS';
  s1.monthsSinceLastPeriod = 132; // 11 שנים מווסת אחרונה
  s1.medicalHistory.hasCardiovascularOrMetabolicHistory = true;
  s1.medicalHistory.hypertensionStatus = 'CONTROLLED';
  s1.medications.hasCardioRenalAnticoagMeds = true;
  s1.medications.takingAntihypertensives = true;
  s1.lftStatus = 'NORMAL';
  s1.preventInputs = {
    isManuallyExpanded: false,
    totalCholesterolMgDl: 230,
    hdlCholesterolMgDl: 45,
    egfrMlMin: 72
  };
  s1.symptoms['1'] = { severity: 3, frequency: 3, importance: 4 };

  const prevent = calculateAhaPreventRisk(s1);
  assertCondition(prevent.shouldAutoOpen === true, 'PREVENT must auto-open for age 62 + smoker + HTN');
  assertCondition(prevent.hasCompleteLabInputs === true, 'PREVENT 10y must calculate');
  assertCondition(prevent.risk30YearTotalCvd === undefined, '30y PREVENT only applies to ages 30-59');

  const arsenal = getEligibleArsenalForPatient(s1);
  assertCondition(!arsenal.some((d) => d.id === 'livial'), 'Livial (Tibolone) must be excluded at age >=60');
  assertCondition(!arsenal.some((d) => d.category === 'COMBINED_ORAL'), 'Oral MHT must be excluded at age >=60');

  const recs = formulateTreatment(s1);
  assertCondition(
    recs.rankedOptions[0].id === 'opt_nonhormonal_nk3_veoza_lynkuet',
    'Non-hormonal Veoza should rank #1 for newly presenting 62yo 11y post-FMP with CV risk factors'
  );
  assertCondition(
    recs.holisticCare.lifestyleItems.some((l) => l.id === 'life_smoking_cessation' && l.priority === 'HIGH'),
    'Active smoker must receive high-priority smoking cessation lifestyle recommendation'
  );

  // בדיקת מעקב שלב 3: עליית ALT/AST מעל 3x ULN תחת ויוזה -> ויוזה נפסלת ומסוננת מיידית!
  const fu = evaluateFollowUpDecisionSuite({
    stage1Data: s1,
    selectedPlan: {
      selectedPrimaryOptionId: 'opt_nonhormonal_nk3_veoza_lynkuet',
      selectedGsmOptionIds: [],
      includeTestosterone: false,
      selectionRationaleTags: [],
      selectionRationaleFreeText: '',
      stage2PatientInstructionsFreeText: '',
      selectedAtIso: new Date().toISOString()
    },
    monthsSinceStart: 2,
    followUpSymptoms: s1.symptoms,
    newlyStartedGlp1: false,
    newlyStartedInteractingMed: '',
    newContraindicationEmerged: false,
    veozaAltAstNormal: 'CRITICAL_OVER_3X',
    reportedSideEffectIds: [],
    hasNewBleeding: false,
    isBleedingHeavyOrProlonged: false,
    hasRecentDoseChangeIn3Months: false
  });

  assertCondition(
    !fu.rankedFollowUpOptions.some((o) => o.id.includes('nk3')),
    'Veoza/Lynkuet must be immediately disqualified & removed when ALT/AST > 3x ULN!'
  );
  const s3Out = buildStage3PatientInstructions(s1, {
    updatedRegimenText: fu.rankedFollowUpOptions[0].titleHebrew,
    selectedOption: fu.rankedFollowUpOptions[0],
    veozaAltAstNormal: 'CRITICAL_OVER_3X',
    medicationAction: 'SWITCH_DRUG_OR_ROUTE'
  });
  assertCondition(
    s3Out.formattedPlainText.includes('להפסיק מיד'),
    'Stage 3 patient output must instruct immediate cessation of Veoza on LFT >3x ULN'
  );
}

/**
 * @testId TC-SYS-07
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-07
 * @sources knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md, knowledge/markdown/magid-course/progestogen-selection-in-mht-srebnik.md, knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md
 */
export function testTcSys07_SolitaryKidneyExpiredMirena8Years(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'נעה ברק – מקרה 9 (תורמת כליה)';
  s1.age = 53;
  s1.weightKg = 74;
  s1.heightCm = 158;
  s1.bmi = 29.5;
  s1.bpSystolic = 130;
  s1.bpDiastolic = 80;
  s1.cyclePattern = 'VARIATION_OVER_7_DAYS';
  s1.monthsSinceLastPeriod = 1;
  s1.medicalHistory.hasHepaticRenalGiHistory = true;
  s1.medicalHistory.chronicKidneyDiseaseOrSolitaryKidney = true; // תרומת כליה ב-2018
  s1.contraception.currentMethod = 'MIRENA_52MG';
  s1.contraception.mirenaInsertionDate = '2018-05-01'; // ~8 שנים ברחם!
  s1.mammographyStatus = 'NOT_PERFORMED';
  s1.fitColorectalStatus = 'NOT_PERFORMED';
  s1.symptoms['1'] = { severity: 3, frequency: 3, importance: 4 };
  s1.symptoms['6'] = { severity: 3, importance: 4 }; // Brain Fog

  const contra = evaluateContraceptionAndMirena(s1);
  assertCondition(
    contra.mirenaValidForMhtEndometrium === false,
    '8-year-old Mirena must be flagged EXPIRED (>5y) for MHT endometrial protection!'
  );
  assertCondition(Boolean(contra.mirenaExpiredForMhtWarning), 'Must emit explicit 5-year MHT expiry warning');

  const interactions = checkDrugInteractions(s1);
  assertCondition(
    interactions.some((i) => i.blocksAngeliq === true),
    'Solitary kidney / CKD must block Angeliq (Drospirenone)'
  );
  const arsenal = getEligibleArsenalForPatient(s1);
  assertCondition(!arsenal.some((d) => d.id === 'angeliq'), 'Angeliq must be filtered out of eligible arsenal');

  const s1Out = buildStage1PatientInstructions(s1);
  assertCondition(s1Out.formattedPlainText.includes('מירנה'), 'Stage 1 output must instruct Mirena replacement');
  assertCondition(
    s1Out.formattedPlainText.includes('ממוגרפיה דו-שנתית'),
    'Average-risk 53yo must receive biennial mammography recommendation'
  );
  assertCondition(s1Out.formattedPlainText.includes('FIT'), 'Stage 1 output must instruct colorectal FIT screening');
}

/**
 * @testId TC-SYS-08
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-08
 * @sources knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md, knowledge/markdown/magid-course/bms-consensus-non-hormonal-treatments-2026.md, knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md
 */
export function testTcSys08_BreastCancerTamoxifenParoxetineBlockAndGsmSeparation(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'אורלי דוד – סרטן שד וטמוקסיפן';
  s1.age = 52; // בטווח 50–74 – לבדיקת איסור המלצת ממוגרפיה דו-שנתית שגרתית למחלימת סרטן שד!
  s1.ethnicity = 'ASHKENAZI';
  s1.weightKg = 65;
  s1.heightCm = 165;
  s1.bmi = 23.9;
  s1.bpSystolic = 120;
  s1.bpDiastolic = 76;
  s1.mammographyStatus = 'NOT_PERFORMED';
  s1.familyHistory.brcaStatus = 'NOT_TESTED';
  s1.medicalHistory.hasMalignancyOrBreastHistory = true;
  s1.medicalHistory.breastCancerHistory = true;
  s1.medicalHistory.breastCancerReceptor = 'HR_POSITIVE';
  s1.medications.hasOncologicEndocrineMeds = true;
  s1.medications.takingTamoxifen = true;
  s1.medications.hasPsychSleepPainMeds = true;
  s1.medications.takingCyp2d6InhibitorParoxetineFluoxetine = true; // נוטלת פאקסט במקביל לטמוקסיפן!
  s1.lftStatus = 'NORMAL';
  s1.symptoms['1'] = { severity: 4, frequency: 4, importance: 4 };
  s1.symptoms['15'] = { severity: 4, importance: 4 }; // GSM קשה

  const gate = evaluateCompletenessGate(s1);
  assertCondition(gate.isPassed === true, 'Breast cancer patient must pass gate into Stage 2 non-hormonal pathway');
  assertCondition(gate.systemicMhtContraindicated === true, 'Systemic MHT must be marked contraindicated');

  // 1. אימות שמחלימת סרטן שד בת 52 אינה מקבלת לעולם המלצה ל"ממוגרפיה דו-שנתית", אלא מעקב אונקולוגי שנתי מותאם אישית + פאנל גנטי מלא!
  assertCondition(
    !gate.basketRecommendations.some((b) => b.includes('ממוגרפיה דו-שנתית')),
    'Breast cancer survivor must NEVER receive routine biennial (דו-שנתית) screening mammogram!'
  );
  assertCondition(
    gate.basketRecommendations.some((b) => b.includes('ממוגרפיה שנתית') && b.includes('אונקולוג')),
    'Breast cancer survivor must receive personalized annual oncology breast surveillance!'
  );
  assertCondition(
    gate.basketRecommendations.some((b) => b.includes('פאנל גנים')),
    'Breast cancer patient with untested genetics must be referred for full oncogenetic panel (not healthy carrier founder screen)'
  );

  const s1Out = buildStage1PatientInstructions(s1);
  assertCondition(
    !s1Out.formattedPlainText.includes('דו-שנתית') && s1Out.formattedPlainText.includes('ממוגרפיה שנתית'),
    'Stage 1 patient output for breast cancer survivor must specify annual oncology breast imaging, never biennial!'
  );

  // 2. אימות התרעת אינטראקציה קריטית Tamoxifen + Paroxetine (CYP2D6)
  const interactions = checkDrugInteractions(s1);
  const tamAlert = interactions.find((i) => i.id === 'tamoxifen');
  assertCondition(tamAlert?.severity === 'CRITICAL', 'Tamoxifen + Paroxetine must raise CRITICAL CYP2D6 alert');
  assertCondition(Boolean(tamAlert?.blocksParoxetineFluoxetine), 'Must explicitly block Paroxetine/Fluoxetine');

  // 3. אימות אפס הורמונים סיסטמיים, הפרדת לחות נרתיקית, המלצת היפנוזה קלינית ו-CBT, ופסילת צמחי מרפא אסורים!
  const recs = formulateTreatment(s1);
  assertCondition(
    recs.rankedOptions.every((o) => o.category === 'NON_HORMONAL_SYSTEMIC'),
    'ZERO hormonal systemic options may be displayed to a breast cancer patient!'
  );
  assertCondition(
    !recs.localGsmOptions.some((g) => g.id === 'gsm_intrarosa_prasterone' || g.id === 'gsm_ospemifene_oral'),
    'Intrarosa and Ospemifene must be excluded in breast cancer'
  );
  assertCondition(recs.testosteroneOption === undefined, 'Systemic Testosterone must be hidden in breast cancer');

  const moist = recs.localGsmOptions.find((g) => g.id === 'gsm_moisturizers_lubricants');
  assertCondition(Boolean(moist) && moist?.recommended === true, 'Non-hormonal vaginal moisturizers must be recommended #1');

  const hypnosis = recs.holisticCare.complementaryTherapies.find((c) => c.id === 'comp_clinical_hypnosis');
  const cbt = recs.holisticCare.complementaryTherapies.find((c) => c.id === 'comp_cbt_menos');
  assertCondition(
    Boolean(hypnosis?.recommended) && Boolean(cbt?.recommended),
    'Clinical Hypnosis and CBT-MENOS must be recommended for breast cancer VMS!'
  );
  assertCondition(
    recs.holisticCare.herbalItems.every((h) => h.safetyStatus === 'CONTRAINDICATED_FOR_PATIENT'),
    'Black Cohosh, Soy/Red Clover supplements, and St John’s Wort must ALL be marked CONTRAINDICATED_FOR_PATIENT in breast cancer + Tamoxifen!'
  );
  assertCondition(
    !recs.patientExpectationPoints.some((p) => p.includes('הכתמות קלות שכיחות')),
    'Non-hormonal pathway must NOT output HRT spotting expectations!'
  );

  const s2Out = buildStage2PatientInstructions(s1, recs, {
    selectedPrimaryOptionId: recs.rankedOptions[0].id,
    selectedGsmOptionIds: ['gsm_moisturizers_lubricants'],
    selectedComplementaryIds: ['comp_clinical_hypnosis', 'comp_cbt_menos'],
    includeTestosterone: false,
    selectionRationaleTags: [],
    selectionRationaleFreeText: '',
    stage2PatientInstructionsFreeText: '',
    selectedAtIso: new Date().toISOString()
  });
  assertCondition(
    s2Out.formattedPlainText.includes('היפנוזה קלינית') && s2Out.formattedPlainText.includes('תזונה ים-תיכונית'),
    'Stage 2 patient instructions must include selected Clinical Hypnosis and Mediterranean nutrition guidance'
  );
}

/**
 * @testId TC-SYS-09
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-09
 * @sources knowledge/markdown/red-whale/14-drug-interactions-with-hrt.md, knowledge/markdown/red-whale/03-different-types-of-hrt.md
 */
export function testTcSys09_PeanutAllergyLamotrigineAndStage3Glp1Switch(): void {
  const s1 = createBlankStage1Data();
  s1.fullName = 'שירה פרידמן – אלרגיית בוטנים + למוטריג׳ין + GLP-1';
  s1.age = 47;
  s1.weightKg = 76;
  s1.heightCm = 166;
  s1.bmi = 27.6;
  s1.bpSystolic = 120;
  s1.bpDiastolic = 78;
  s1.cyclePattern = 'SKIPPED_OVER_60_DAYS';
  s1.monthsSinceLastPeriod = 4;
  s1.medicalHistory.hasAllergiesOrSensitivities = true;
  s1.medicalHistory.peanutOrSoyAllergy = true;
  s1.medicalHistory.hasNeurologicalHistory = true;
  s1.medicalHistory.epilepsy = true;
  s1.medications.hasNeuroAntiepilepticMeds = true;
  s1.medications.takingLamotrigine = true;
  s1.symptoms['1'] = { severity: 3, frequency: 3, importance: 4 };

  const arsenal = getEligibleArsenalForPatient(s1);
  assertCondition(!arsenal.some((d) => d.id === 'utrogestan'), 'Utrogestan must be strictly excluded in peanut/soy allergy');
  assertCondition(
    !arsenal.some((d) => d.category === 'ESTROGEN_ORAL' || d.category === 'COMBINED_ORAL'),
    'Oral estrogens must be strictly excluded on Lamotrigine (50% level drop risk!)'
  );

  const recs = formulateTreatment(s1);
  const gelOpt = recs.rankedOptions.find((o) => o.id === 'opt_transdermal_gel_body_identical');
  assertCondition(
    Boolean(gelOpt?.israeliProductsSummary.secondaryProgestogenOrMonitor?.includes('Duphaston')),
    'Gel regimen must automatically pair with Duphaston instead of Utrogestan'
  );

  // בשלב 3: המטופלת התחילה Mounjaro (GLP-1) ומופיע דימום בלתי צפוי -> מעבר למירנה מדורג #1!
  const fu = evaluateFollowUpDecisionSuite({
    stage1Data: s1,
    selectedPlan: {
      selectedPrimaryOptionId: 'opt_transdermal_gel_body_identical',
      selectedGsmOptionIds: [],
      includeTestosterone: false,
      selectionRationaleTags: [],
      selectionRationaleFreeText: '',
      stage2PatientInstructionsFreeText: '',
      selectedAtIso: new Date().toISOString()
    },
    monthsSinceStart: 3,
    followUpSymptoms: s1.symptoms,
    newlyStartedGlp1: true,
    newlyStartedInteractingMed: 'Mounjaro 5mg',
    newContraindicationEmerged: false,
    veozaAltAstNormal: 'NOT_APPLICABLE',
    reportedSideEffectIds: [],
    hasNewBleeding: true,
    isBleedingHeavyOrProlonged: false,
    hasRecentDoseChangeIn3Months: false
  });

  assertCondition(
    fu.rankedFollowUpOptions[0].id === 'opt_mirena_plus_transdermal_e2',
    'Starting GLP-1 with bleeding on oral progestogen must rank Mirena 52mg + Transdermal E2 #1 in Stage 3!'
  );
}

/**
 * @testId TC-SYS-10
 * @spec docs/TEST_SPECIFICATION.md#tc-sys-10
 * @sources knowledge/markdown/red-whale/04-hrt-starting-troubleshooting-stopping.md, knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md
 */
export function testTcSys10_UninvestigatedPmbHardBlockAndCompleteResetClean(): void {
  // חלק א': חסימה מוחלטת בדימום פוסט-מנופאוזלי שטרם בורר (PMB)
  const pmb = createDefaultDemoStage1Data();
  pmb.age = 58;
  pmb.medicalHistory.hasGynecologicalOrObstetricHistory = true;
  pmb.medicalHistory.uninvestigatedAbnormalBleeding = true;
  pmb.stage1PatientInstructionsFreeText = 'לפנות עם ההפניה הדחופה למוקד נשים השבוע.';

  const gate = evaluateCompletenessGate(pmb);
  assertCondition(gate.isPassed === false, 'Uninvestigated PMB must hard-block Stage 2 progression!');
  const pmbOut = buildStage1PatientInstructions(pmb);
  assertCondition(pmbOut.formattedPlainText.includes('TVS'), 'Stage 1 output must require urgent TVS');
  assertCondition(
    pmbOut.formattedPlainText.includes('לפנות עם ההפניה הדחופה'),
    'Stage 1 output must include physician free text'
  );

  // חלק ב': התאמת הנחיות לאחר כריתת רחם שלמה שפירה (ללא המלצת Pap/HPV שגרתית וללא אזהרת הכתמות רחמיות!)
  const hyst = createBlankStage1Data();
  hyst.age = 54;
  hyst.weightKg = 64;
  hyst.heightCm = 164;
  hyst.bmi = 23.8;
  hyst.bpSystolic = 118;
  hyst.bpDiastolic = 75;
  hyst.hadHysterectomy = true;
  hyst.cervixConserved = false;
  hyst.papHpvStatus = 'NOT_PERFORMED';
  hyst.mammographyStatus = 'UP_TO_DATE_NORMAL';
  hyst.fitColorectalStatus = 'UP_TO_DATE_NORMAL';
  hyst.glucoseLipidsStatus = 'NORMAL';
  hyst.symptoms['1'] = { severity: 3, frequency: 3, importance: 4 };

  const hystGate = evaluateCompletenessGate(hyst);
  assertCondition(
    !hystGate.basketRecommendations.some((b) => b.includes('hrHPV')),
    'Total benign hysterectomy without cervix must NOT prompt routine cervical hrHPV screening'
  );
  const hystRecs = formulateTreatment(hyst);
  assertCondition(hystRecs.regimenType === 'ESTROGEN_ONLY', 'Post-hysterectomy without endometriosis must get ESTROGEN_ONLY');
  assertCondition(
    !hystRecs.patientExpectationPoints.some((p) => p.includes('הכתמות קלות שכיחות ב-3–6 החודשים')),
    'Hysterectomized woman must NOT be told to expect 3-6m HRT uterine spotting'
  );

  // חלק ג': בדיקת ניקוי 100% של כל השדות בפתיחת תיק מטופלת חדשה (איפוס)
  const dirtyRecord = createInitialRecord(false);
  dirtyRecord.activeStage = 3;
  dirtyRecord.stage2 = formulateTreatment(dirtyRecord.stage1);
  dirtyRecord.stage2Notes = [{ id: 'n1', createdAtIso: new Date().toISOString(), stage: 2, text: 'הערה' }];

  const resetRecord = createInitialRecord(true);
  assertCondition(resetRecord.recordSessionId !== dirtyRecord.recordSessionId, 'Reset must generate a fresh session ID');
  assertCondition(resetRecord.activeStage === 1, 'Reset must return to Stage 1');
  assertCondition(resetRecord.stage2 === undefined, 'Reset must clear Stage 2 recommendations');
  assertCondition(resetRecord.selectedPlan === undefined, 'Reset must clear selected treatment plan');
  assertCondition(resetRecord.stage2Notes.length === 0, 'Reset must clear Stage 2 notes');
  assertCondition(resetRecord.stage3Visits.length === 0, 'Reset must clear Stage 3 visits');

  const rs1 = resetRecord.stage1;
  assertCondition(rs1.patientId === '' && rs1.fullName === '' && rs1.occupation === '', 'Demographics strings must be empty');
  assertCondition(
    rs1.age === 0 &&
      rs1.weightKg === 0 &&
      rs1.heightCm === 0 &&
      rs1.bmi === 0 &&
      rs1.bpSystolic === 0 &&
      rs1.bpDiastolic === 0 &&
      rs1.monthsSinceLastPeriod === 0,
    'All numeric vitals and menstrual counters must reset to 0'
  );
  assertCondition(
    rs1.mammographyStatus === 'NOT_PERFORMED' &&
      rs1.papHpvStatus === 'NOT_PERFORMED' &&
      rs1.fitColorectalStatus === 'NOT_PERFORMED' &&
      rs1.dxaStatus === 'NOT_PERFORMED' &&
      rs1.cbcStatus === 'NOT_TESTED' &&
      rs1.glucoseLipidsStatus === 'NOT_TESTED' &&
      rs1.lftStatus === 'NOT_TESTED',
    'All screening and lab statuses must reset to NOT_PERFORMED / NOT_TESTED'
  );
  assertCondition(
    IMS_19_SYMPTOM_ITEMS.every(
      (item) =>
        rs1.symptoms[item.id].severity === 0 &&
        rs1.symptoms[item.id].importance === 0 &&
        (rs1.symptoms[item.id].frequency ?? 0) === 0
    ),
    'All 19 IMS symptom scores must reset to 0'
  );
  assertCondition(
    Object.values(rs1.medicalHistory).every((v) => v === false || v === '' || v === 'NONE' || v === 'UNKNOWN'),
    'All medicalHistory hierarchical flags & notes must be cleared'
  );
  assertCondition(
    Object.values(rs1.medications).every((v) => v === false || v === '' || v === undefined),
    'All medication hierarchical flags & notes must be cleared'
  );
  assertCondition(
    rs1.preferences.priorFailedTreatments.length === 0 && rs1.stage1PatientInstructionsFreeText === '',
    'Preferences & patient instruction free-text must be cleared'
  );
}

// רישום מרוכז של 10 תרחישי המערכת עם רפרנס דו-כיווני מלא אל docs/TEST_SPECIFICATION.md
export const SYSTEM_TEST_SCENARIOS: SystemScenarioDefinition[] = [
  {
    id: 'TC-SYS-01',
    functionName: 'testTcSys01_SuboptimalActivelleMultiGsmAndTestosterone',
    specAnchor: 'tc-sys-01',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/red-whale/02-nice-guideline-menopause-2024.md',
      'knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md',
      'knowledge/markdown/magid-course/mht-in-brca-carriers-srebnik.md'
    ],
    titleHebrew: 'הקלה חלקית תחת Activelle בגיל 51 (ללא פסילה רפואית), שילוב מרובה ב-GSM וטסטוסטרון רק בשלב 3',
    run: testTcSys01_SuboptimalActivelleMultiGsmAndTestosterone
  },
  {
    id: 'TC-SYS-02',
    functionName: 'testTcSys02_EarlyMenopauseProportionalDoseAndStopGuard',
    specAnchor: 'tc-sys-02',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/magid-course/asrm-eshre-ims-poi-guideline-2024.md',
      'knowledge/markdown/red-whale/05-hrt-regimens-and-progestogen-doses.md'
    ],
    titleHebrew: 'מנופאוזה מוקדמת בגיל 41 עם אי-סבילות ל-Femoston ופריחה מ-Evorel – הכפלת פרוגסטוגן והגנת הפסקה',
    run: testTcSys02_EarlyMenopauseProportionalDoseAndStopGuard
  },
  {
    id: 'TC-SYS-03',
    functionName: 'testTcSys03_BenignBreastBiopsyMaternalCancer70AndAshkenaziBrca',
    specAnchor: 'tc-sys-03',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md',
      'knowledge/markdown/red-whale/07-hrt-and-breast-cancer-risk.md'
    ],
    titleHebrew: 'בת 49 עם סרטן שד לאם בגיל 70 + ביופסיה שפירה ללא אטיפיה וסקר BRCA בסל',
    run: testTcSys03_BenignBreastBiopsyMaternalCancer70AndAshkenaziBrca
  },
  {
    id: 'TC-SYS-04',
    functionName: 'testTcSys04_CardiometabolicObesityAndStage3BmsBleedingCalculator',
    specAnchor: 'tc-sys-04',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/red-whale/11-problematic-bleeding-on-hrt.md',
      'knowledge/markdown/magid-course/bleeding-and-side-effects-under-mht-freiberg.md'
    ],
    titleHebrew: 'פרופיל קרדיו-מטבולי (BMI 34.3) + דימום בשלב 3 הפותח מחשבון BMS לסיכון סרטן הרחם',
    run: testTcSys04_CardiometabolicObesityAndStage3BmsBleedingCalculator
  },
  {
    id: 'TC-SYS-05',
    functionName: 'testTcSys05_ChcOver50SuppressedTshMimicAndFamilyVte',
    specAnchor: 'tc-sys-05',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/red-whale/hebrew-summary-perimenopause-contraception.md',
      'knowledge/markdown/red-whale/08-hrt-and-risk-of-vte.md'
    ],
    titleHebrew: 'בת 53 תחת CHC (Meliane), דיכוי TSH 0.05 המחקה גלי חום ו-VTE משפחתי',
    run: testTcSys05_ChcOver50SuppressedTshMimicAndFamilyVte
  },
  {
    id: 'TC-SYS-06',
    functionName: 'testTcSys06_LatePostmenopauseAge62PreventAndVeozaMonitoring',
    specAnchor: 'tc-sys-06',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/magid-course/mdcalc-10491-aha-prevent-calculator.md',
      'knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md'
    ],
    titleHebrew: 'פנייה ראשונה בגיל 62 (11 שנים מווסת) – חישוב PREVENT, גמילה מעישון והפסקת ויוזה בעליית אנזימי כבד',
    run: testTcSys06_LatePostmenopauseAge62PreventAndVeozaMonitoring
  },
  {
    id: 'TC-SYS-07',
    functionName: 'testTcSys07_SolitaryKidneyExpiredMirena8Years',
    specAnchor: 'tc-sys-07',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md',
      'knowledge/markdown/magid-course/progestogen-selection-in-mht-srebnik.md',
      'knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md'
    ],
    titleHebrew: 'בת 53 תורמת כליה עם התקן מירנה פג-תוקף (8 שנים) ודימומים לא סדירים',
    run: testTcSys07_SolitaryKidneyExpiredMirena8Years
  },
  {
    id: 'TC-SYS-08',
    functionName: 'testTcSys08_BreastCancerTamoxifenParoxetineBlockAndGsmSeparation',
    specAnchor: 'tc-sys-08',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md',
      'knowledge/markdown/magid-course/bms-consensus-non-hormonal-treatments-2026.md',
      'knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md'
    ],
    titleHebrew: 'מחלימת סרטן שד בת 52 תחת Tamoxifen + Paroxetine – מעקב אונקולוגי שנתי, היפנוזה/CBT ופסילת צמחי מרפא',
    run: testTcSys08_BreastCancerTamoxifenParoxetineBlockAndGsmSeparation
  },
  {
    id: 'TC-SYS-09',
    functionName: 'testTcSys09_PeanutAllergyLamotrigineAndStage3Glp1Switch',
    specAnchor: 'tc-sys-09',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/red-whale/14-drug-interactions-with-hrt.md',
      'knowledge/markdown/red-whale/03-different-types-of-hrt.md'
    ],
    titleHebrew: 'אלרגיית בוטנים/סויה + Lamotrigine + התחלת GLP-1 בשלב 3 המעבירה להמלצת מירנה',
    run: testTcSys09_PeanutAllergyLamotrigineAndStage3Glp1Switch
  },
  {
    id: 'TC-SYS-10',
    functionName: 'testTcSys10_UninvestigatedPmbHardBlockAndCompleteResetClean',
    specAnchor: 'tc-sys-10',
    specFile: 'docs/TEST_SPECIFICATION.md',
    knowledgeSources: [
      'knowledge/markdown/red-whale/04-hrt-starting-troubleshooting-stopping.md',
      'knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md'
    ],
    titleHebrew: 'חסימת בטיחות בדימום PMB שטרם בורר, התאמה לאחר כריתת רחם + ניקוי 100% באיפוס תיק',
    run: testTcSys10_UninvestigatedPmbHardBlockAndCompleteResetClean
  }
];
