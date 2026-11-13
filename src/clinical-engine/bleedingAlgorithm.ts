export interface BleedingEvaluationInput {
  hasBleeding: boolean;
  monthsOnTreatment: number;
  hasRecentDoseChangeIn3Months: boolean;
  isHeavyOrProlonged: boolean;
  regimenType: 'CONTINUOUS_COMBINED' | 'SEQUENTIAL_COMBINED' | 'ESTROGEN_ONLY';
  isHighEndometrialRisk: boolean;
  tvsThicknessMm?: number;
}

export interface BleedingDecisionOutput {
  triageCategory: 'BENIGN_EARLY' | 'NEEDS_OPTIMIZATION' | 'URGENT_TVS_INDICATED' | 'BIOPSY_REQUIRED';
  categoryTitleHebrew: string;
  urgentTvsRequired: boolean;
  biopsyRequired: boolean;
  urgencyTimelineHebrew?: string;
  clinicalExplanationHebrew: string;
  regimenAdjustmentRecommendations: string[];
}

export function evaluateBleeding(input: BleedingEvaluationInput): BleedingDecisionOutput {
  if (!input.hasBleeding) {
    return {
      triageCategory: 'BENIGN_EARLY',
      categoryTitleHebrew: 'ללא דימומים חריגים',
      urgentTvsRequired: false,
      biopsyRequired: false,
      clinicalExplanationHebrew: 'אין דיווח על דימומים חריגים או הכתמות תחת הטיפול.',
      regimenAdjustmentRecommendations: ['המשך מעקב תקופתי שגרתי כסדרו.']
    };
  }

  // בדיקת עובי רירית אם בוצע TVS
  if (input.tvsThicknessMm !== undefined && input.tvsThicknessMm > 0) {
    const isCc = input.regimenType === 'CONTINUOUS_COMBINED';
    const cutoffMm = isCc ? 4 : 7;
    const isThickened = input.tvsThicknessMm > cutoffMm;

    if (isThickened) {
      return {
        triageCategory: 'BIOPSY_REQUIRED',
        categoryTitleHebrew: `רירית רחם מעובה ב-TVS (${input.tvsThicknessMm} מ"מ - סף עליון: ${cutoffMm} מ"מ)`,
        urgentTvsRequired: false,
        biopsyRequired: true,
        urgencyTimelineHebrew: 'הפניה מיידית לדגימת רירית (פיפל / היסטרוסקופיה)',
        clinicalExplanationHebrew: `בטיפול ${isCc ? 'משולב רציף (ccHRT)' : 'סדרתי (sHRT)'}, עובי רירית מעל ${cutoffMm} מ"מ בנוכחות דימום חריג מחייב שלילת היפרפלזיה או ממאירות באמצעות דגימה היסטולוגית (הנחיות דר' מרב פרייברג ו-BMS 2024).`,
        regimenAdjustmentRecommendations: [
          'הפניה דחופה לגינקולוג/ית לביצוע דגימת פיפל (Pipelle) או היסטרוסקופיה אבחנתית עם ביופסיה.',
          'בדיקת ספירת דם (CBC) ומאגרי ברזל (פריטין) לשלילת אנמיה.',
          'לאחר שלילת ממצא פתולוגי: שקילת התקנת התקן מירנה (52mg LNG-IUS) לדיכוי יעיל של הרירית.'
        ]
      };
    }
  }

  const isWithinFirst6Months = input.monthsOnTreatment <= 6;
  const isAfterRecentDoseChange = input.hasRecentDoseChangeIn3Months;

  // 1. קריטריונים ל-Urgent TVS תוך 6 שבועות:
  // - דימום לאחר 6 חודשים
  // - או דימום כבד וממושך
  // - או סיכון גבוה לרירית הרחם
  if (!isWithinFirst6Months && !isAfterRecentDoseChange) {
    return {
      triageCategory: 'URGENT_TVS_INDICATED',
      categoryTitleHebrew: 'דימום מעבר ל-6 חודשי טיפול (Persistent Unscheduled Bleeding)',
      urgentTvsRequired: true,
      biopsyRequired: false,
      urgencyTimelineHebrew: 'ביצוע TVS תוך 6 שבועות (Urgent TVS pathway)',
      clinicalExplanationHebrew:
        'דימום המופיע או נמשך מעבר ל-6 חודשים מתחילת הטיפול (או מעבר ל-3 חודשים משינוי מינון) מחייב בירור הדמייתי של רירית הרחם באמצעות אולטרסאונד אגן וגינלי (TVS) לשלילת פוליפים, שרירנים, היפרפלזיה או ממאירות.',
      regimenAdjustmentRecommendations: [
        'הפניה ל-TVS תוך 6 שבועות עם מדידה מדויקת של עובי הרירית.',
        input.regimenType === 'SEQUENTIAL_COMBINED'
          ? 'בטיפול סדרתי: העלאת מינון הפרוגסטוגן (אוטרוגסטן ל-300 מ"ג ליום או הארכת ימי הנטילה ל-14-21 יום), או מעבר לטיפול רציף מעל גיל 45-54.'
          : 'בטיפול רציף: העלאת מינון אוטרוגסטן ל-200 מ"ג ליום, או שקילת מעבר להתקן מירנה (52mg IUS) כפתרון הזהב לדימומים.'
      ]
    };
  }

  if (input.isHighEndometrialRisk || input.isHeavyOrProlonged) {
    return {
      triageCategory: 'URGENT_TVS_INDICATED',
      categoryTitleHebrew: 'דימום תחת סיכון אנדומטריאלי מוגבר או דימום כבד וממושך',
      urgentTvsRequired: true,
      biopsyRequired: false,
      urgencyTimelineHebrew: 'הפניה ל-TVS תוך 6 שבועות',
      clinicalExplanationHebrew:
        'נוכחות גורמי סיכון מג\'וריים לרירית (כגון BMI ≥40, תסמונת לינץ\') או דימום כבד עם סיכון לאנמיה מורידים את סף הבירור ומחייבים TVS גם בתוך 6 החודשים הראשונים.',
      regimenAdjustmentRecommendations: [
        'ביצוע TVS לבדיקת עובי ומבנה הרירית.',
        'התקן מירנה (52mg LNG-IUS) מהווה את טיפול הבחירה המומלץ ביותר במצבים אלו.',
        'בדיקת CBC ופריטין להערכת מאגרי הברזל.'
      ]
    };
  }

  // 2. דימום ב-6 חודשים ראשונים בסיכון נמוך -> שפיר וצפוי, ניהול שמרני והתאמת טיפול
  return {
    triageCategory: 'BENIGN_EARLY',
    categoryTitleHebrew: 'דימום/הכתמות ב-6 החודשים הראשונים (Early Erratic Bleeding)',
    urgentTvsRequired: false,
    biopsyRequired: false,
    clinicalExplanationHebrew:
      'הכתמות או דימומים בלתי סדירים מופיעים אצל כ-40% מהנשים ב-6 החודשים הראשונים מתחילת HRT או ב-3 החודשים שלאחר שינוי מינון. מדובר בתופעה שפירה וצפויה הנובעת מהסתגלות הרירית לגירוי ההורמונלי.',
    regimenAdjustmentRecommendations: [
      'הרגעה מובנית של המטופלת והסבר כי התופעה תחלוף לרוב מעצמה.',
      'וידוא היענות ונטילה עקבית ומדויקת של הפרוגסטוגן בכל יום הנדרש.',
      input.regimenType === 'SEQUENTIAL_COMBINED'
        ? 'אם הדימום מציק: ניתן להאריך את ימי הפרוגסטוגן מ-12 ל-14 ימים בחודש, או להעלות מינון אוטרוגסטן ל-300 מ"ג.'
        : 'בטיפול רציף: ניתן להעלות מינון אוטרוגסטן ל-200 מ"ג ליום, או לשקול מעבר זמני לטיפול סדרתי אם המטופלת נכנסה למנופאוזה רק לאחרונה.',
      'אם הדימום יימשך מעבר ל-6 חודשים – יבוצע TVS.'
    ]
  };
}
