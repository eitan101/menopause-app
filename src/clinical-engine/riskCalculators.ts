import { Stage1Data, EndometrialRiskAssessment } from './types';

export function calculateEndometrialRisk(data: Stage1Data): EndometrialRiskAssessment {
  const majorFactors: string[] = [];
  const minorFactors: string[] = [];

  // גורמים מג'וריים (BMS & Dr. Merav Freiberg)
  if (data.bmi >= 40) {
    majorFactors.push('השמנת יתר חמורה דרגה 3 (BMI ≥ 40)');
  }
  if (data.lynchSyndrome) {
    majorFactors.push('תסמונת גנטית עם נטייה לממאירויות גינקולוגיות (Lynch / Cowden)');
  }

  // גורמים מינוריים
  if (data.bmi >= 30 && data.bmi < 40) {
    minorFactors.push('השמנה דרגה 1-2 (BMI 30–39)');
  }
  if (data.familyDiabetes) {
    minorFactors.push('סוכרת ידועה או היסטוריה משפחתית מובהקת');
  }
  if (data.hadGestationalDiabetes) {
    minorFactors.push('עבר של סוכרת הריונית (אינדיקציה לעמידות לאינסולין ואנובולציה בעבר)');
  }

  // סיווג הסיכון: גורם מג'ורי אחד או 3 גורמים מינוריים ומעלה
  const isHighRisk = majorFactors.length >= 1 || minorFactors.length >= 3;

  return {
    riskTier: isHighRisk ? 'HIGH' : 'LOW',
    majorFactors,
    minorFactors,
    rationale: isHighRisk
      ? 'סיכון מוגבר לפתולוגיה ברירית הרחם (נוכחות גורם מג\'ורי או ≥3 גורמים מינוריים). מחייב סף נמוך במיוחד לבירור דימומים, עדיפות להתקן מירנה (52mg IUS) וביצוע TVS דחוף בכל דימום חריג.'
      : 'פרופיל סיכון רגיל לרירית הרחם. במקרה של דימומים ב-6 החודשים הראשונים לטיפול – ניהול שמרני והתאמת מינון פרוגסטוגן.'
  };
}

export interface VteRiskAssessment {
  tier: 'LOW' | 'MODERATE' | 'HIGH';
  isTransdermalMandatory: boolean;
  riskFactorsHebrew: string[];
  rationaleHebrew: string;
}

export function calculateVteRisk(data: Stage1Data): VteRiskAssessment {
  const riskFactors: string[] = [];

  if (data.activeVteOrThrombophilia) {
    riskFactors.push('היסטוריה אישית של פקקת ורידית (VTE) או קרישיות יתר ידועה (Factor V Leiden, Prot C/S, Antithrombin)');
  }
  if (data.familyVte) {
    riskFactors.push('סיפור משפחתי של פקקת ורידים עמוקה או תסחיף ריאתי בקרוב דרגה ראשונה');
  }
  if (data.bmi >= 30) {
    riskFactors.push(`השמנת יתר (BMI = ${data.bmi.toFixed(1)})`);
  }
  if (data.isSmoker) {
    riskFactors.push('עישון פעיל');
  }
  if (data.age >= 60) {
    riskFactors.push('גיל מעל 60 שנה');
  }

  if (data.activeVteOrThrombophilia) {
    return {
      tier: 'HIGH',
      isTransdermalMandatory: true,
      riskFactorsHebrew: riskFactors,
      rationaleHebrew: 'איסור מוחלט על אסטרוגן פומי (מעלה פקקתיות דרך מעבר כבדי ראשוני). במקרה של VTE קודם יש להיוועץ בהמטולוג לפני התחלת HRT; אם מאושר – מתן עורי בלבד במינון הנמוך ביותר.'
    };
  }

  if (riskFactors.length >= 2 || data.bmi >= 30 || data.isSmoker || data.age >= 60) {
    return {
      tier: 'MODERATE',
      isTransdermalMandatory: true,
      riskFactorsHebrew: riskFactors,
      rationaleHebrew: 'הנחיות BMS ו-NICE קובעות כי מתן עורי (Transdermal) של אסטרוגן אינו מעלה את הסיכון ל-VTE ולשבץ מוחי ולכן הוא קו ראשון מובהק למטופלת זו.'
    };
  }

  return {
    tier: 'LOW',
    isTransdermalMandatory: false,
    riskFactorsHebrew: riskFactors,
    rationaleHebrew: 'סיכון טרומבואמבולי נמוך. ניתן לשקול מתן עורי או פומי בהתאם להעדפת המטופלת.'
  };
}

export interface CvdRiskAssessment {
  riskHighlightsHebrew: string[];
  recommendationHebrew: string;
}

export function calculateCvdRisk(data: Stage1Data): CvdRiskAssessment {
  const highlights: string[] = [];

  if (data.recentArterialEvent) {
    highlights.push('אירוע קרדיווסקולרי פעיל או לאחרונה (Post-MI / CVA)');
  }
  if (data.bpSystolic >= 140 || data.bpDiastolic >= 90) {
    highlights.push(`לחץ דם שאינו מאוזן מיטבית (${data.bpSystolic}/${data.bpDiastolic} mmHg)`);
  }
  if (data.hadGestationalHtn || data.hadPreeclampsia) {
    highlights.push('עבר של יתר לחץ דם בהריון או רעלת הריון (גורם סיכון וסקולרי מוכר)');
  }
  if (data.isSmoker) {
    highlights.push('עישון פעיל');
  }
  if (data.familyCvd) {
    highlights.push('סיפור משפחתי של מחלות לב מוקדמות');
  }

  let rec = 'פרופיל קרדיווסקולרי תקין.';
  if (data.recentArterialEvent) {
    rec = 'לפי הצהרת הקונצנזוס של BMS למטופלות לאחר אוטם שריר הלב (Post-MI): אסטרוגן עורי בלבד במינון נמוך (מדבקת 25 מק"ג או חצי לחיצת ג\'ל) בשילוב פרוגסטרון מיקרוניזדי או מירנה, באישור הקרדיולוג המטפל.';
  } else if (highlights.length > 0) {
    rec = 'איזון מיטבי של לחץ הדם וגורמי הסיכון. העדפה ברורה למתן אסטרוגן עורי (שאינו מעלה לחץ דם ואינו משפיע על גורמי קרישה בכבד).';
  }

  return {
    riskHighlightsHebrew: highlights,
    recommendationHebrew: rec
  };
}
