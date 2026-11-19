import { evaluateContraceptionAndMirena } from './strawStaging';
import {
  BmsEndometrialCalculatorOverrides,
  EndometrialRiskAssessment,
  RegimenType,
  Stage1Data
} from './types';

export interface BmsInteractiveEndometrialResult extends EndometrialRiskAssessment {
  effectiveFlags: Required<BmsEndometrialCalculatorOverrides>;
}

// מחשבון BMS 2024 אינטראקטיבי לגורמי סיכון לסרטן/היפרפלזיה של רירית הרחם (נפתח אוטומטית בבירור דימומים בשלב 3!)
export function evaluateInteractiveBmsEndometrialRisk(
  stage1Data: Stage1Data,
  overrides?: BmsEndometrialCalculatorOverrides,
  updatedBmi?: number,
  newlyStartedGlp1?: boolean
): BmsInteractiveEndometrialResult {
  const effectiveBmi = updatedBmi && updatedBmi > 0 ? updatedBmi : stage1Data.bmi;
  const contraEval = evaluateContraceptionAndMirena(stage1Data);

  const autoUnopposedOrInsufficient =
    Boolean(contraEval.mirenaExpiredForMhtWarning) ||
    stage1Data.contraception.currentMethod === 'LOW_DOSE_IUS_KYLEENA' ||
    stage1Data.contraception.currentMethod === 'POP_SLYND_CERAZETTE' ||
    Boolean(newlyStartedGlp1);

  const effectiveFlags: Required<BmsEndometrialCalculatorOverrides> = {
    bmiOver40: overrides?.bmiOver40 ?? effectiveBmi >= 40,
    lynchOrCowdenSyndrome: overrides?.lynchOrCowdenSyndrome ?? stage1Data.familyHistory.lynchSyndrome,
    unopposedOrInsufficientProgestogen:
      overrides?.unopposedOrInsufficientProgestogen ?? autoUnopposedOrInsufficient,
    sequentialHrtOver5YearsAgeOver45:
      overrides?.sequentialHrtOver5YearsAgeOver45 ??
      ((stage1Data.yearsOnSequentialHrt || 0) > 5 && stage1Data.age > 45),
    atypicalHyperplasiaHistory:
      overrides?.atypicalHyperplasiaHistory ??
      stage1Data.medicalHistory.endometrialHyperplasiaHistory === 'ATYPICAL_OR_UNRESOLVED',
    tamoxifenUse: overrides?.tamoxifenUse ?? stage1Data.medications.takingTamoxifen,
    bmi30To39: overrides?.bmi30To39 ?? (effectiveBmi >= 30 && effectiveBmi < 40),
    diabetesOrInsulinResistance:
      overrides?.diabetesOrInsulinResistance ?? stage1Data.medicalHistory.diabetesStatus !== 'NONE',
    pcosOrChronicAnovulation:
      overrides?.pcosOrChronicAnovulation ?? stage1Data.medicalHistory.hasPcosOrChronicAnovulation
  };

  if (stage1Data.hadHysterectomy) {
    return {
      riskTier: 'LOW',
      majorFactors: [],
      minorFactors: [],
      rationale: 'המטופלת עברה כריתת רחם.',
      effectiveFlags
    };
  }

  const majorFactors: string[] = [];
  const minorFactors: string[] = [];

  if (effectiveFlags.bmiOver40) majorFactors.push(`BMI ≥ 40 (${effectiveBmi.toFixed(1)})`);
  if (effectiveFlags.lynchOrCowdenSyndrome) majorFactors.push('תסמונת לינץ׳ / Cowden גנטית');
  if (effectiveFlags.unopposedOrInsufficientProgestogen) {
    majorFactors.push('חשיפה לאסטרוגן ללא הגנת פרוגסטוגן מספקת (מירנה >5 שנים / שכחה / תת-ספיגה תחת GLP-1 / Kyleena-POP)');
  }
  if (effectiveFlags.sequentialHrtOver5YearsAgeOver45) {
    majorFactors.push('משטר HRT סדרתי/ציקלי מעל 5 שנים באישה מעל גיל 45');
  }
  if (effectiveFlags.atypicalHyperplasiaHistory) {
    majorFactors.push('היסטוריה של היפרפלזיה אטיפית של רירית הרחם');
  }
  if (effectiveFlags.tamoxifenUse) {
    majorFactors.push('טיפול בטמוקסיפן');
  }

  if (effectiveFlags.bmi30To39 && !effectiveFlags.bmiOver40) {
    minorFactors.push(`BMI 30–39.9 (${effectiveBmi.toFixed(1)})`);
  }
  if (effectiveFlags.diabetesOrInsulinResistance) {
    minorFactors.push('סוכרת / טרום-סוכרת / תנגודת לאינסולין');
  }
  if (effectiveFlags.pcosOrChronicAnovulation) {
    minorFactors.push('שחלות פוליציסטיות (PCOS) / אל-ביוץ כרוני');
  }
  if (stage1Data.familyHistory.familyEndometrialOrColorectalCancer && !effectiveFlags.lynchOrCowdenSyndrome) {
    minorFactors.push('סיפור משפחתי של סרטן רירית הרחם/המעי הגס');
  }

  const isHighRisk = majorFactors.length >= 1 || minorFactors.length >= 2;

  return {
    riskTier: isHighRisk ? 'HIGH' : 'LOW',
    majorFactors,
    minorFactors,
    rationale: isHighRisk
      ? `סיכון אנדומטריאלי מוגבר לפי מחשבון BMS 2024 (${majorFactors.length} גורמים מז׳וריים, ${minorFactors.length} גורמים מינוריים – סף ≥1 מז׳ורי או ≥2 מינוריים): חובה לבצע TVS בהקדם ללא המתנת 6 חודשים ולשקול דגימת פיפל!`
      : `סיכון אנדומטריאלי בסיסי נמוך לפי מחשבון BMS 2024 (0 מז׳וריים, ${minorFactors.length} מינוריים מתוך סף של ≥2).`,
    effectiveFlags
  };
}

export interface BleedingTriageInput {
  stage1Data: Stage1Data;
  regimenType: RegimenType;
  monthsOnCurrentRegimen: number;
  hasRecentDoseChangeIn3Months: boolean;
  isHeavyOrProlonged: boolean;
  tvsEndometrialThicknessMm?: number;
  stoppedHrt4WeeksAgoAndResolved?: boolean;
  newlyStartedGlp1?: boolean;
  updatedBmi?: number;
  bmsOverrides?: BmsEndometrialCalculatorOverrides;
}

export interface BleedingTriageResult {
  urgency: 'URGENT_2_WEEKS' | 'ROUTINE_TVS_WITHIN_6_WEEKS' | 'ADJUST_AND_OBSERVE';
  tvsIndicated: boolean;
  endometrialBiopsyIndicated: boolean;
  hysteroscopyIndicated: boolean;
  cutoffReferenceHebrew: string;
  headline: string;
  actionSteps: string[];
  bmsCalculator: BmsInteractiveEndometrialResult;
}

// אלגוריתם ניהול דימום בלתי צפוי תחת HRT לפי BMS 2024 וד"ר מרב פרייברג
export function evaluateUnscheduledBleeding(input: BleedingTriageInput): BleedingTriageResult {
  const {
    stage1Data,
    regimenType,
    monthsOnCurrentRegimen,
    hasRecentDoseChangeIn3Months,
    isHeavyOrProlonged,
    tvsEndometrialThicknessMm,
    stoppedHrt4WeeksAgoAndResolved,
    newlyStartedGlp1,
    updatedBmi,
    bmsOverrides
  } = input;

  const bmsCalculator = evaluateInteractiveBmsEndometrialRisk(
    stage1Data,
    bmsOverrides,
    updatedBmi,
    newlyStartedGlp1
  );
  const contraEval = evaluateContraceptionAndMirena(stage1Data);
  const isContinuous = regimenType === 'CONTINUOUS_COMBINED' || regimenType === 'TSEC_OR_TIBOLONE';
  const cutoffMm = isContinuous ? 4 : 7;
  const cutoffReferenceHebrew = isContinuous
    ? 'סף תקין לעובי רירית ב-TVS תחת משטר רציף (ccHRT): ≤ 4 מ"מ (BMS 2024)'
    : 'סף תקין לעובי רירית ב-TVS תחת משטר סדרתי/ציקלי (sHRT, מיד לאחר סיום דמם הגמילה): ≤ 7 מ"מ (BMS 2024)';

  const adherenceAndSecondaryChecks = [
    'לוודא היענות מלאה למרכיב הפרוגסטוגני, מינון פרופורציונלי לגובה האסטרוגן והדבקה/מריחה סדירה.',
    'לשלול אינטראקציות תרופתיות חדשות (זריקות GLP-1 המעכבות ספיגת פרוגסטרון פומי, משרני אנזימים), שכחת מנות ופתולוגיה צווארית בבדיקת ספקולום (משטח HPV בתוקף).'
  ];

  if (contraEval.mirenaExpiredForMhtWarning) {
    adherenceAndSecondaryChecks.unshift(contraEval.mirenaExpiredForMhtWarning);
  }
  if (newlyStartedGlp1 || stage1Data.medications.takingGlp1) {
    adherenceAndSecondaryChecks.unshift(
      'נטילת GLP-1 פעילה: הפחתת ספיגת פרוגסטוגן פומי עלולה לגרום לדימום ולתת-הגנה על הרירית – מומלץ מעבר למירנה 52 מ"ג או מדבקה משולבת עורית.'
    );
  }

  // 1. אם כבר בוצע TVS ויש מדידת עובי רירית – נפעל לפי הספים המדויקים (4 מ"מ ב-ccHRT / 7 מ"מ ב-sHRT)
  if (tvsEndometrialThicknessMm !== undefined && tvsEndometrialThicknessMm > 0) {
    if (tvsEndometrialThicknessMm > cutoffMm) {
      return {
        urgency: 'URGENT_2_WEEKS',
        tvsIndicated: true,
        endometrialBiopsyIndicated: true,
        hysteroscopyIndicated: true,
        cutoffReferenceHebrew,
        headline: `רירית מעובה (${tvsEndometrialThicknessMm} מ"מ > סף ${cutoffMm} מ"מ): נדרשת דגימת רירית (פיפל) והיסטרוסקופיה אבחנתית!`,
        actionSteps: [
          `עובי הרירית (${tvsEndometrialThicknessMm} מ"מ) חורג מהסף התקין (${cutoffMm} מ"מ) עבור המשטר הנוכחי.`,
          'הפניה דחופה לגינקולוג/ית לביצוע ביופסיית רירית הרחם (Pipelle) והיסטרוסקופיה לשלילת פוליפ/היפרפלזיה/ממאירות.',
          ...adherenceAndSecondaryChecks
        ],
        bmsCalculator
      };
    }

    return {
      urgency: isHeavyOrProlonged ? 'ROUTINE_TVS_WITHIN_6_WEEKS' : 'ADJUST_AND_OBSERVE',
      tvsIndicated: false,
      endometrialBiopsyIndicated: isHeavyOrProlonged && bmsCalculator.riskTier === 'HIGH',
      hysteroscopyIndicated: isHeavyOrProlonged,
      cutoffReferenceHebrew,
      headline: `עובי רירית תקין ב-TVS (${tvsEndometrialThicknessMm} מ"מ ≤ ${cutoffMm} מ"מ) – התאמת מינון פרוגסטוגן/מירנה או מבחן הפסקה ל-4 שבועות`,
      actionSteps: [
        'התאמת משטר לייצוב הרירית: להעלות יחס פרוגסטוגן (Utrogestan 200 מ"ג רציף, מעבר למירנה 52 מ"ג או מדבקה משולבת עם NETA).',
        stoppedHrt4WeeksAgoAndResolved === true
          ? 'הדימום פסק בתוך 4 שבועות מהפסקת HRT – מאשש דימום הורמונלי שפיר; ניתן לחדש במשטר מותאם עם הגנת רירית מתוגברת.'
          : 'מבחן אבחנתי לפי BMS 2024: בהפסקת HRT ל-4 שבועות, אם הדימום פוסק לחלוטין אין צורך בבירור פולשני נוסף; אם נמשך מעבר ל-4 שבועות מההפסקה – חובה היסטרוסקופיה ודגימת רירית!',
        ...adherenceAndSecondaryChecks
      ],
      bmsCalculator
    };
  }

  // 2. גורמי סיכון אנדומטריאליים מוגברים לפי מחשבון BMS (≥1 Major או ≥2 Minor) או דימום כבד/ממושך -> TVS דחוף!
  if (bmsCalculator.riskTier === 'HIGH' || isHeavyOrProlonged) {
    return {
      urgency: 'URGENT_2_WEEKS',
      tvsIndicated: true,
      endometrialBiopsyIndicated: bmsCalculator.majorFactors.length >= 1 || isHeavyOrProlonged,
      hysteroscopyIndicated: false,
      cutoffReferenceHebrew,
      headline: 'התוויה לבירור מהיר (BMS 2024): אולטרסאונד נרתיקי (TVS) דחוף ובדיקת ספקולום/פיפל!',
      actionSteps: [
        bmsCalculator.riskTier === 'HIGH'
          ? bmsCalculator.rationale
          : 'דימום כבד / ממושך או לאחר יחסים: להפנות ל-TVS ובדיקה גינקולוגית בהקדם.',
        ...adherenceAndSecondaryChecks
      ],
      bmsCalculator
    };
  }

  // 3. סיכון אנדומטריאלי נמוך בחלון ההסתגלות (6 חודשים מהתחלת HRT או 3 חודשים משינוי מינון)
  const inGraceWindow =
    monthsOnCurrentRegimen <= 6 || (hasRecentDoseChangeIn3Months && monthsOnCurrentRegimen > 0);

  if (inGraceWindow) {
    return {
      urgency: 'ADJUST_AND_OBSERVE',
      tvsIndicated: false,
      endometrialBiopsyIndicated: false,
      hysteroscopyIndicated: false,
      cutoffReferenceHebrew,
      headline:
        monthsOnCurrentRegimen <= 6
          ? `חלון הסתגלות בסיכון נמוך (חודש ${monthsOnCurrentRegimen} מתוך 6) – אופטימיזציית משטר ומעקב`
          : 'דימום תוך 3 חודשים משינוי מינון בסיכון אנדומטריאלי נמוך – אופטימיזציה ומעקב',
      actionSteps: [
        'לפי BMS 2024: בסיכון אנדומטריאלי נמוך עם הכתמות קלות ב-6 החודשים הראשונים להתחלה (או 3 חודשים משינוי מינון), לבדוק צוואר רחם בספקולום, לוודא היענות ולבצע התאמת מינון פרוגסטוגן/אסטרוגן.',
        'אם הדימום נמשך מעבר ל-6 חודשים מההתחלה (או מעבר ל-3 חודשים משינוי המינון) – להפנות ל-TVS תוך 6 שבועות!',
        ...adherenceAndSecondaryChecks
      ],
      bmsCalculator
    };
  }

  // 4. מעבר ל-6 חודשים ללא שינוי מינון -> TVS תוך 6 שבועות
  return {
    urgency: 'ROUTINE_TVS_WITHIN_6_WEEKS',
    tvsIndicated: true,
    endometrialBiopsyIndicated: false,
    hysteroscopyIndicated: false,
    cutoffReferenceHebrew,
    headline: 'דימום חדש או נמשך מעל 6 חודשים מתחילת HRT – נדרשת הפניה ל-TVS (תוך 6 שבועות)',
    actionSteps: [
      `לבצע אולטרסאונד נרתיקי (TVS) להערכת עובי הרירית (${cutoffReferenceHebrew}) ובדיקת ספקולום לצוואר הרחם.`,
      'אפשרות מקבילה לפי BMS 2024: ניסיון הפסקת HRT ל-4 שבועות – אם הדימום פוסק, ניתן לחדש במשטר מותאם; אם ממשיך לאחר 4 שבועות מההפסקה – בירור דחוף!',
      ...adherenceAndSecondaryChecks
    ],
    bmsCalculator
  };
}
