import { Stage1Data, CompletenessGateResult } from './types';

export function evaluateCompletenessGate(data: Stage1Data): CompletenessGateResult {
  const blockingReasons: string[] = [];
  const warnings: string[] = [];
  const patientInstructions: string[] = [];

  // 1. התוויות נגד מוחלטות (Absolute Contraindications)
  if (data.historyOfBreastCancer) {
    blockingReasons.push('היסטוריה אישית של סרטן שד (התווית נגד מוחלטת ל-HRT סיסטמי). המערכת תאפשר מעבר למסלול טיפולים לא-הורמונליים בלבד.');
  }

  if (data.historyOfEndometrialCancer) {
    blockingReasons.push('היסטוריה של סרטן רירית הרחם או היפרפלזיה מורכבת שטרם טופלה.');
  }

  if (data.uninvestigatedBleeding) {
    blockingReasons.push('דימום נרתיקי חריג או בלתי מוסבר שטרם בורר גינקולוגית (מחייב שלילת פתולוגיה ממארת לפני כל מתן הורמונלי).');
    patientInstructions.push('ביצוע בדיקה גינקולוגית מקיפה ואולטרסאונד אגן (TVS) לבירור מקור הדימום, כולל שקילת דגימת רירית (פיפל/היסטרוסקופיה).');
  }

  if (data.activeLiverDisease) {
    blockingReasons.push('מחלת כבד פעילה או תפקודי כבד פתולוגיים באופן מתמשך.');
    patientInstructions.push('בירור מעבדתי מלא של תפקודי כבד (ALT, AST, Alk Phos, Bilirubin, GGT) והערכת גסטרואנטרולוג/הפטולוג.');
  }

  // 2. בדיקות סקר ושלמות נתונים קריטיות (Completeness Gate)
  // ממוגרפיה
  if (data.mammographyStatus === 'NOT_PERFORMED' || data.mammographyStatus === 'OVERDUE') {
    blockingReasons.push('ממוגרפיה/סקר שד אינו מעודכן (מעל שנתיים מביצוע אחרון או מעולם לא בוצע).');
    patientInstructions.push('ביצוע בדיקת ממוגרפיה תקופתית לסקר סרטן שד (יש לקבוע תור במכון שד ולהציג פענוח תקין).');
  } else if (data.mammographyStatus === 'ABNORMAL_SUSPECTED') {
    blockingReasons.push('ממצא חשוד בממוגרפיה או US שד המחייב המשך בירור אצל כירורג שד.');
    patientInstructions.push('השלמת בירור ממצא שד (US מכוון / ביופסיה לפי הנחיית כירורג שד).');
  }

  // סקר צוואר הרחם (Pap / HPV)
  if (data.papHpvStatus === 'NOT_PERFORMED' || data.papHpvStatus === 'OVERDUE') {
    warnings.push('משטח צוואר הרחם (Pap/HPV) אינו מעודכן לפי הנחיות הסקר.');
    patientInstructions.push('ביצוע משטח צוואר הרחם (Pap/hrHPV) אצל רופא/ת הנשים.');
  } else if (data.papHpvStatus === 'ABNORMAL') {
    blockingReasons.push('תוצאת משטח צוואר הרחם אינה תקינה (מחייבת בירור קולפוסקופיה).');
    patientInstructions.push('הפניה לקולפוסקופיה לבירור משטח Pap לא תקין.');
  }

  // ספירת דם במקרה של דימומים כבדים
  if (data.bleedingIntensity === 'HEAVY' && data.cbcStatus === 'NOT_TESTED') {
    blockingReasons.push('מטופלת עם דימומים כבדים ללא ספירת דם מעודכנת (סכנת אנמיה וירידה במאגרי ברזל).');
    patientInstructions.push('ביצוע בדיקת ספירת דם (CBC) ומאגרי ברזל (Ferritin, Iron, Transferrin) להערכת אנמיה עקב הדימומים.');
  }

  // אימות POI בנשים מתחת לגיל 40
  if (data.age < 40 && (data.cyclePattern !== 'REGULAR' || data.monthsSinceLastPeriod >= 4)) {
    if (!data.fshLevel || data.fshLevel < 25) {
      warnings.push('חשד ל-POI מתחת לגיל 40: נדרש אימות מעבדתי של רמות FSH בשתי בדיקות נפרדות.');
      patientInstructions.push('ביצוע שתי בדיקות דם לרמות FSH ו-Estradiol בהפרש של 4-6 שבועות לאימות אבחנת אי-ספיקה שחלתית מוקדמת.');
    }
  }

  // מדדי לחץ דם ו-BMI
  if (data.bpSystolic <= 0 || data.bpDiastolic <= 0) {
    blockingReasons.push('חסרה מדידת לחץ דם עדכנית במרפאה.');
    patientInstructions.push('מדידת לחץ דם בישיבה במרפאה לפני קביעת אופן המתן.');
  }

  if (data.bmi <= 0) {
    blockingReasons.push('חסרים נתוני גובה ומשקל לחישוב מדד BMI.');
    patientInstructions.push('מדידת גובה ומשקל לצורך התאמת מינון ובחירת ציר מתן עורי.');
  }

  // פרופיל שומנים וגלוקוז בצום
  if (data.glucoseLipidsStatus === 'NOT_TESTED') {
    warnings.push('מומלץ פרופיל שומנים וגלוקוז עדכני להערכת סיכון מטבולי.');
    patientInstructions.push('ביצוע בדיקת דם לפרופיל שומנים מלא (Cholesterol, HDL, LDL, Triglycerides) וגלוקוז בצום.');
  }

  const isPassed = blockingReasons.length === 0;

  return {
    isPassed,
    blockingReasons,
    warnings,
    patientInstructions
  };
}
