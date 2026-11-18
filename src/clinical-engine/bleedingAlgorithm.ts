import { calculateEndometrialRisk } from './riskCalculators';
import { evaluateContraceptionAndMirena } from './strawStaging';
import { RegimenType, Stage1Data } from './types';

export interface BleedingTriageInput {
  stage1Data: Stage1Data;
  regimenType: RegimenType;
  monthsOnCurrentRegimen: number;
  hasRecentDoseChangeIn3Months: boolean;
  isHeavyOrProlonged: boolean;
  tvsEndometrialThicknessMm?: number;
  stoppedHrt4WeeksAgoAndResolved?: boolean;
  newlyStartedGlp1?: boolean;
}

export interface BleedingTriageResult {
  urgency: 'URGENT_2_WEEKS' | 'ROUTINE_TVS_WITHIN_6_WEEKS' | 'ADJUST_AND_OBSERVE';
  tvsIndicated: boolean;
  endometrialBiopsyIndicated: boolean;
  hysteroscopyIndicated: boolean;
  cutoffReferenceHebrew: string;
  headline: string;
  actionSteps: string[];
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
    newlyStartedGlp1
  } = input;

  const endoRisk = calculateEndometrialRisk(stage1Data);
  const contraEval = evaluateContraceptionAndMirena(stage1Data);
  const isContinuous = regimenType === 'CONTINUOUS_COMBINED' || regimenType === 'TSEC_OR_TIBOLONE';
  const cutoffMm = isContinuous ? 4 : 7;
  const cutoffReferenceHebrew = isContinuous
    ? 'סף תקין לעובי רירית ב-TVS תחת משטר רציף (ccHRT): ≤ 4 מ"מ (BMS 2024)'
    : 'סף תקין לעובי רירית ב-TVS תחת משטר סדרתי/ציקלי (sHRT, מיד לאחר סיום דמם הגמילה): ≤ 7 מ"מ (BMS 2024)';

  const adherenceAndSecondaryChecks = [
    'לוודא היענות מלאה למרכיב הפרוגסטוגני, מינון פרופורציונלי לגובה האסטרוגן והדבקה/מריחה סדירה.',
    'לשלול אינטראקציות תרופתיות חדשות (זריקות GLP-1 המעכבות ספיגת פרוגסטרון פומי, משרני אנזימים), שכחת מנות, זיהום צווארי (Chlamydia/STI) ופתולוגיה צווארית בבדיקת ספקולום (משטח HPV בתוקף).'
  ];

  if (contraEval.mirenaExpiredForMhtWarning) {
    adherenceAndSecondaryChecks.unshift(contraEval.mirenaExpiredForMhtWarning);
  }
  if (newlyStartedGlp1 || stage1Data.medications.takingGlp1) {
    adherenceAndSecondaryChecks.unshift(
      'נטילת GLP-1 פעילה: הפחתת ספיגת פרוגסטוגן פומי עלולה לגרום לדימום ולתת-הגנה על הרירית – לשקול מעבר למירנה/מדבקה משולבת או תגבור פרוגסטוגן ל-4 שבועות סביב עליית מינון.'
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
        ]
      };
    }

    // עובי רירית תקין (<=4 מ"מ או <=7 מ"מ)
    return {
      urgency: isHeavyOrProlonged ? 'ROUTINE_TVS_WITHIN_6_WEEKS' : 'ADJUST_AND_OBSERVE',
      tvsIndicated: false,
      endometrialBiopsyIndicated: isHeavyOrProlonged && endoRisk.riskTier === 'HIGH',
      hysteroscopyIndicated: isHeavyOrProlonged,
      cutoffReferenceHebrew,
      headline: `עובי רירית תקין ב-TVS (${tvsEndometrialThicknessMm} מ"מ ≤ ${cutoffMm} מ"מ) – התאמת מינון פרוגסטוגן/אסטרוגן או ניסיון הפסקה ל-4 שבועות`,
      actionSteps: [
        'התאמת משטר לייצוב הרירית: להעלות יחס פרוגסטוגן (למשל Utrogestan מ-100 ל-200 מ"ג, הארכת שלב הפרוגסטוגן ב-sHRT מ-12 ל-14–21 יום, מעבר לתכשיר עם NETA או התקנת מירנה 52 מ"ג).',
        stoppedHrt4WeeksAgoAndResolved === true
          ? 'הדימום פסק בתוך 4 שבועות מהפסקת HRT – תומך בדימום הורמונלי שפיר; ניתן לחדש במשטר מותאם או להמשיך ללא HRT לפי רצון המטופלת.'
          : 'אפשרות אבחנתית לפי BMS 2024: הפסקה זמנית של ה-HRT ל-4 שבועות – אם הדימום פוסק לחלוטין אין צורך בבירור פולשני נוסף; אם הדימום נמשך 4 שבועות לאחר הפסקת ה-HRT או מתחדש בעוצמה מעל 6 חודשים – חובה היסטרוסקופיה ודגימת רירית!',
        ...adherenceAndSecondaryChecks
      ]
    };
  }

  // 2. גורמי סיכון אנדומטריאליים מוגברים (≥1 Major או ≥2 Minor) או דימום כבד/ממושך או המירנה פגה תוקף -> הפניה דחופה ל-TVS!
  if (endoRisk.riskTier === 'HIGH' || isHeavyOrProlonged || Boolean(contraEval.mirenaExpiredForMhtWarning)) {
    return {
      urgency: 'URGENT_2_WEEKS',
      tvsIndicated: true,
      endometrialBiopsyIndicated: endoRisk.majorFactors.length >= 1 || isHeavyOrProlonged,
      hysteroscopyIndicated: false,
      cutoffReferenceHebrew,
      headline: 'התוויה לבירור מהיר: אולטרסאונד נרתיקי (TVS) דחוף ובדיקת ספקולום/פיפל!',
      actionSteps: [
        endoRisk.riskTier === 'HIGH'
          ? `סיכון אנדומטריאלי מוגבר לפי BMS 2024 (${[...endoRisk.majorFactors, ...endoRisk.minorFactors].join(', ')}): אין להמתין 6 חודשים – להפנות ל-TVS דחוף ולשקול דגימת רירית (פיפל).`
          : 'דימום כבד / ממושך או תת-הגנה פרוגסטוגנית: להפנות ל-TVS בהקדם.',
        ...adherenceAndSecondaryChecks
      ]
    };
  }

  // 3. סיכון אנדומטריאלי נמוך: חלון ההסתגלות (6 חודשים מהתחלת HRT או 3 חודשים משינוי מינון/תכשיר)
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
          ? `חלון הסתגלות (חודש ${monthsOnCurrentRegimen} מתוך 6 החודשים הראשונים בסיכון נמוך) – אופטימיזציית משטר ומעקב`
          : 'דימום תוך 3 חודשים משינוי מינון/תכשיר בסיכון נמוך – אופטימיזציה ומעקב',
      actionSteps: [
        'לפי הנחיות BMS 2024: באישה בסיכון אנדומטריאלי נמוך עם הכתמות קלות ב-6 החודשים הראשונים להתחלת HRT (או 3 חודשים משינוי מינון), ניתן לבדוק צוואר רחם בספקולום, לוודא היענות ולבצע התאמת מינון פרוגסטוגן/אסטרוגן.',
        'אם הדימום נמשך מעבר ל-6 חודשים מההתחלה (או מעבר ל-3 חודשים משינוי המינון) – להפנות ל-TVS לא יאוחר מ-6 שבועות!',
        ...adherenceAndSecondaryChecks
      ]
    };
  }

  // 4. מעבר ל-6 חודשים (וללא שינוי מינון ב-3 החודשים האחרונים) גם בסיכון נמוך -> נדרש TVS תוך 6 שבועות!
  return {
    urgency: 'ROUTINE_TVS_WITHIN_6_WEEKS',
    tvsIndicated: true,
    endometrialBiopsyIndicated: false,
    hysteroscopyIndicated: false,
    cutoffReferenceHebrew,
    headline: 'דימום חדש או נמשך מעל 6 חודשים מתחילת HRT – נדרשת הפניה ל-TVS (תוך 6 שבועות)',
    actionSteps: [
      `לבצע אולטרסאונד נרתיקי (TVS) להערכת עובי הרירית (${cutoffReferenceHebrew}) ובדיקת ספקולום לצוואר הרחם.`,
      'אפשרות מקבילה לפי BMS 2024: לשקול ניסיון הפסקת HRT ל-4 שבועות אם המטופלת מעוניינת – אם הדימום נמשך לאחר 4 שבועות מההפסקה, לבצע בירור דחוף!',
      ...adherenceAndSecondaryChecks
    ]
  };
}
