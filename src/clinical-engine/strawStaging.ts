import { Stage1Data, STRAWStage } from './types';

export interface STRAWDiagnosisResult {
  stage: STRAWStage;
  titleHebrew: string;
  stageCode: string;
  descriptionHebrew: string;
  clinicalImplicationsHebrew: string;
}

export function calculateStrawStage(data: Stage1Data): STRAWDiagnosisResult {
  // 1. מצבים מיוחדים ראשוניים
  if (data.hadRrso) {
    return {
      stage: 'SURGICAL_RRSO',
      titleHebrew: 'מנופאוזה כירורגית לאחר כריתת שחלות (RRSO)',
      stageCode: 'Surgical',
      descriptionHebrew: 'נפילה חדה ומיידית ברמות אסטרדיול וטסטוסטרון עקב כריתת שחלות.',
      clinicalImplicationsHebrew: 'התוויה ברורה לטיפול במינונים הולמים עד גיל 51-52 לפחות (במיוחד בנשאיות מוטציות BRCA1/2 ללא סרטן שד) למניעת אוסטאופורוזיס ומחלות לב וכלי דם.'
    };
  }

  if (data.hadHysterectomy) {
    return {
      stage: 'SURGICAL_RRSO',
      titleHebrew: 'לאחר כריתת רחם (Hysterectomy)',
      stageCode: 'Hysterectomy',
      descriptionHebrew: 'היעדר דימום ווסתי עקב כריתת רחם (עם שימור או ללא שימור שחלות).',
      clinicalImplicationsHebrew: 'הטיפול ההורמונלי מבוסס על אסטרוגן בלבד (למעט מקרים עם עבר של אנדומטריוזיס המחייבים שילוב פרוגסטוגן למניעת הפעלת נגעים שאריים).'
    };
  }

  // אי ספיקה שחלתית מוקדמת (POI)
  if (data.age < 40 && (data.monthsSinceLastPeriod >= 4 || data.cyclePattern !== 'REGULAR')) {
    return {
      stage: 'POI',
      titleHebrew: 'אי-ספיקה שחלתית מוקדמת (Premature Ovarian Insufficiency - POI)',
      stageCode: 'POI (<40y)',
      descriptionHebrew: 'הפסקת פעילות שחלתית מתחת לגיל 40.',
      clinicalImplicationsHebrew: 'חובה לבצע אימות FSH (>25-30 IU/L בשתי בדיקות בהפרש של 4-6 שבועות). טיפול HRT במינון מלא נדרש לפחות עד גיל 51 למניעת תחלואה קרדיווסקולרית ואובדן מסת עצם.'
    };
  }

  // מנופאוזה מוקדמת (Early Menopause 40-44)
  if (data.age >= 40 && data.age < 45 && (data.monthsSinceLastPeriod >= 12 || data.cyclePattern === 'AMENORRHEA_OVER_12_MONTHS')) {
    return {
      stage: 'EARLY_MENOPAUSE',
      titleHebrew: 'מנופאוזה מוקדמת (Early Menopause בגילאי 40-44)',
      stageCode: 'Early Menopause (40-44y)',
      descriptionHebrew: 'אל-ווסת מעל 12 חודשים לפני גיל 45.',
      clinicalImplicationsHebrew: 'התוויה ברורה לטיפול הורמונלי לפחות עד גיל המנופאוזה הטבעי הממוצע (51) לשמירה על העצם ומערכת הלב.'
    };
  }

  // 2. פוסט-מנופאוזה (Postmenopause) - אל-ווסת מעל 12 חודשים
  if (data.cyclePattern === 'AMENORRHEA_OVER_12_MONTHS' || data.monthsSinceLastPeriod >= 12) {
    if (data.monthsSinceLastPeriod <= 72) { // עד 6 שנים
      return {
        stage: 'EARLY_POSTMENOPAUSE',
        titleHebrew: 'פוסט-מנופאוזה מוקדמת (Early Postmenopause)',
        stageCode: '+1a / +1b / +1c',
        descriptionHebrew: 'עד 6 שנים ממועד הווסת האחרונה (FMP). שלב של אובדן עצם מואץ ותסמינים וזומוטוריים פעילים.',
        clinicalImplicationsHebrew: 'חלון ההזדמנויות המיטבי (Window of Opportunity) להתחלת HRT. אם יש רחם: טיפול משולב רציף (ccHRT) למניעת דימומים והגנה מירבית על הרירית.'
      };
    } else {
      return {
        stage: 'LATE_POSTMENOPAUSE',
        titleHebrew: 'פוסט-מנופאוזה מאוחרת (Late Postmenopause)',
        stageCode: '+2',
        descriptionHebrew: 'מעל 6 שנים ממועד הווסת האחרונה. שכיחות מוגברת של תסמיני GSM (אטרופיה נרתיקית ושלפוחיתית).',
        clinicalImplicationsHebrew: 'התחלת HRT סיסטמי מעל גיל 60 או מעל 10 שנים מה-FMP דורשת שקילת סיכוני CVD ו-VTE (מתן עורי במינון נמוך מועדף). דגש רב על טיפול מקומי ב-GSM (וגיפם / אובסטין / אינטרארוסה).'
      };
    }
  }

  // 3. פרי-מנופאוזה מאוחרת (Late Transition) - דילוג של 60 ימים ומעלה
  if (data.cyclePattern === 'SKIPPED_OVER_60_DAYS' || data.monthsSinceLastPeriod >= 2) {
    return {
      stage: 'LATE_TRANSITION',
      titleHebrew: 'מעבר פרי-מנופאוזלי מאוחר (Late Menopausal Transition)',
      stageCode: '-1',
      descriptionHebrew: 'אל-ווסת של ≥60 ימים (דילוג על 2 מחזורים לפחות), תנודתיות חדה באסטרדיול ועלייה ב-FSH.',
      clinicalImplicationsHebrew: 'אם יש רחם: מתן טיפול משולב סדרתי (sHRT) או התקן מירנה (52mg LNG-IUS). חשוב לשלול הריון ולספק אמצעי מניעה במידת הצורך עד גיל 50-55.'
    };
  }

  // 4. פרי-מנופאוזה מוקדמת (Early Transition) - שוני של 7 ימים ומעלה
  if (data.cyclePattern === 'VARIATION_OVER_7_DAYS') {
    return {
      stage: 'EARLY_TRANSITION',
      titleHebrew: 'מעבר פרי-מנופאוזלי מוקדם (Early Menopausal Transition)',
      stageCode: '-2',
      descriptionHebrew: 'שוני מתמיד של 7 ימים ומעלה באורך המחזורים החודשיים. הופעת תסמינים ראשונים.',
      clinicalImplicationsHebrew: 'תנודות הורמונליות ודימומים כבדים נפוצים. התקן מירנה (52mg IUS) מהווה קו טיפול מעולה המשלב אמצעי מניעה והפחתת דימומים.'
    };
  }

  // 5. שלב רפרודוקטיבי מאוחר (Late Reproductive)
  return {
    stage: 'LATE_REPRODUCTIVE',
    titleHebrew: 'שלב רפרודוקטיבי מאוחר (Late Reproductive Stage)',
    stageCode: '-3b / -3a',
    descriptionHebrew: 'מחזורים סדירים עדיין, ייתכנו תסמינים קלים עקב גלי אסטרדיול בלתי סדירים (מחזורי LOOP) וירידה בפוריות.',
    clinicalImplicationsHebrew: 'מעקב שמרני, אמצעי מניעה לפי צורך (גלולות משולבות עד גיל 50 בהיעדר גורמי סיכון או התקן תוך רחמי).'
  };
}
