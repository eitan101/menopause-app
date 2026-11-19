import { calculateBoneRisk } from './riskCalculators';
import { CompletenessGateResult, Stage1Data } from './types';

export function evaluateCompletenessGate(data: Stage1Data): CompletenessGateResult {
  const blockingReasons: string[] = [];
  const contraindicationNotices: string[] = [];
  const warnings: string[] = [];
  const basketRecommendations: string[] = [];
  const patientInstructions: string[] = [];

  const { age, medicalHistory, medications, familyHistory } = data;

  // 1. בדיקות חובה בסיסיות ובטיחות קלינית מיידית (חוסמות מעבר לשלב 2)
  if (!age || age < 18 || age > 105) {
    blockingReasons.push('יש להזין גיל מטופלת תקין (18–105).');
  }

  // דימום גניטלי חריג שטרם בורר (PMB / IMB / PCB) – קו אדום מוחלט לפני התחלת טיפול סיסטמי!
  if (medicalHistory.uninvestigatedAbnormalBleeding) {
    blockingReasons.push(
      'דימום גניטלי חריג שטרם בורר (PMB / IMB / PCB): חובה להשלים בירור גינקולוגי (TVS לעובי רירית ± פיפל / קולפוסקופיה) לפני התחלת טיפול הורמונלי!'
    );
    patientInstructions.push(
      'פנייה דחופה לרופא/ת נשים לביצוע אולטרסאונד נרתיקי (TVS) ובירור מקור הדימום טרם התחלת טיפול.'
    );
  }

  // משבר יתר לחץ דם חמור (>= 180/110)
  if (
    medicalHistory.hypertensionStatus === 'SEVERE_OVER_180_110' ||
    data.bpSystolic >= 180 ||
    data.bpDiastolic >= 110
  ) {
    blockingReasons.push(
      `לחץ דם בערכי משבר (${data.bpSystolic}/${data.bpDiastolic} ממ"כ, ≥180/110): יש לייצב ולאזן את לחץ הדם באופן מיידי לפני מתן טיפול הורמונלי.`
    );
    patientInstructions.push('איזון מיידי של לחץ הדם ומעקב מדידות ביתיות לפני התחלת הטיפול.');
  }

  // ממצא חשוד בממוגרפיה או ב-Pap/HPV שטרם בורר
  if (data.mammographyStatus === 'ABNORMAL_SUSPECTED') {
    blockingReasons.push('ממצא חשוד בממוגרפיה (BI-RADS 4/5 או בירור פתוח): חובה להשלים בירור שד מלא לפני החלטה טיפולית.');
    patientInstructions.push('השלמת בירור הדמיית שד / כירורג שד בהתאם לתשובת הממוגרפיה.');
  }
  if (data.papHpvStatus === 'ABNORMAL_SUSPECTED' && (!data.hadHysterectomy || data.cervixConserved)) {
    blockingReasons.push('תוצאת משטח צוואר הרחם / HPV חריגה שטרם בוררה: יש להשלים קולפוסקופיה/בירור.');
    patientInstructions.push('השלמת בירור צוואר הרחם (קולפוסקופיה) לפי הנחיית רופא/ת נשים.');
  }

  // 2. זיהוי התוויות נגד ל-MHT סיסטמי (אינן נועלות את שלב 2! מאפשרות מעבר מובנה למסלול הלא-הורמונלי והמקומי בשלב 2!)
  if (medicalHistory.breastCancerHistory) {
    contraindicationNotices.push(
      `היסטוריה אישית של סרטן שד (${medicalHistory.breastCancerReceptor}): MHT סיסטמי אסור – שלב 2 ידרג עבור המטופלת אפשרויות לא-הורמונליות מותאמות ותכשירים מקומיים ל-GSM.`
    );
  }
  if (medicalHistory.endometrialCancerHistory === 'ADVANCED_OR_SARCOMA') {
    contraindicationNotices.push(
      'סרטן רירית רחם מתקדם או סרקומה רחמית (ESS / LMS): התווית נגד ל-MHT סיסטמי – מופעל מסלול לא-הורמונלי.'
    );
  } else if (medicalHistory.endometrialCancerHistory === 'EARLY_STAGE_TREATED') {
    warnings.push(
      'סרטן אנדומטריואידי מוקדם בשלב I בדרגה נמוכה שטופל: כל החלטה על אסטרוגן מחייבת אישור גינקו-אונקולוגי מתועד; חלופות לא-הורמונליות זמינות בשלב 2.'
    );
  }
  if (medicalHistory.ovarianCancerHistory === 'HORMONE_SENSITIVE_SEROUS_ENDOMETRIOID') {
    contraindicationNotices.push(
      'סרטן שחלה רגיש להורמונים (Low-Grade Serous / Endometrioid / Granulosa): הימנעות מאסטרוגן סיסטמי ללא אישור גינקו-אונקולוגי.'
    );
  }
  if (medicalHistory.activeAcuteVte) {
    contraindicationNotices.push('אירוע פקקת ורידים / תסחיף ריאתי פעיל (Active DVT/PE): MHT סיסטמי אסור בשלב החריף.');
  }
  if (medicalHistory.activeOrRecentArterialEvent) {
    contraindicationNotices.push('אירוע עורקי חריף/לא יציב (MI / אנגינה לא יציבה / CVA / TIA): MHT סיסטמי אסור.');
  }
  if (medicalHistory.activeLiverDiseaseOrPorphyria) {
    contraindicationNotices.push(
      'מחלת כבד פעילה עם הפרעה בתפקודי כבד או פורפיריה: התווית נגד ל-MHT סיסטמי (וגם לויוזה בהפרעה כבדית בינונית-קשה).'
    );
  }
  if (medicalHistory.sleActiveOrAplaPositive) {
    contraindicationNotices.push(
      'לופוס (SLE) פעיל או נוגדנים אנטי-פוספוליפידיים (APLA) חיוביים: סיכון פקקתי/עורקי גבוה – הימנעות מ-MHT סיסטמי.'
    );
  }
  if (medicalHistory.meningiomaHistory) {
    warnings.push(
      'היסטוריה של מנינגיומה: פרוגסטוגנים סינתטיים ופרוגסטרון עלולים להאיץ גדילת מנינגיומות (קולטני PR) – נדרש ייעוץ נוירוכירורגי והעדפת טיפול לא-הורמונלי אם קיים רחם.'
    );
  }
  if (medications.takingTamoxifen || medications.takingAromataseInhibitors) {
    contraindicationNotices.push(
      'טיפול אנדוקריני אונקולוגי פעיל (טמוקסיפן / מעכב ארומטאז): MHT סיסטמי חסום – שלב 2 יציג חלופות לא-הורמונליות בטוחות ללא אינטראקציית CYP2D6.'
    );
  }

  const systemicMhtContraindicated = contraindicationNotices.length > 0;

  // 3. בדיקות סקר מותאמות גיל לפי סל הבריאות בישראל (IMA / משרד הבריאות)
  const highBreastFamilyRisk =
    familyHistory.brcaStatus === 'BRCA1' ||
    familyHistory.brcaStatus === 'BRCA2' ||
    familyHistory.familyCancerFirstDegreeUnder50OrMultiple ||
    medicalHistory.dcisOrAtypicalHyperplasia;

  const mammographyRequiredByBasket =
    (age >= 50 && age <= 74) || (age >= 40 && highBreastFamilyRisk);

  if (mammographyRequiredByBasket) {
    if (data.mammographyStatus === 'OVERDUE' || data.mammographyStatus === 'NOT_PERFORMED') {
      warnings.push(
        highBreastFamilyRisk && age < 50
          ? `סיכון משפחתי/שד מוגבר בגיל ${age}: מומלץ להשלים ממוגרפיה שנתית/מעקב מרפאת שד בסל הבריאות במקביל לתכנון הטיפול.`
          : `גיל ${age} (טווח סל הבריאות 50–74): ממוגרפיה דו-שנתית אינה בתוקף – מומלץ להפנות להשלמת ממוגרפיה (ב-Red Whale ניתן להתחיל טיפול במקביל להפניה באישה א-תסמינית ללא ממצא בשד).`
      );
      basketRecommendations.push('הפניה לממוגרפיה דו-שנתית בסל הבריאות (גילאי 50–74, או מגיל 40 בסיכון משפחתי מוגבר).');
      patientInstructions.push('ביצוע בדיקת ממוגרפיה שגרתית במכון השד של הקופה.');
    }
  } else if (age < 50 && !highBreastFamilyRisk && data.mammographyStatus === 'NOT_PERFORMED') {
    basketRecommendations.push(
      `גיל ${age} בסיכון רגיל: לפי הנחיות סל הבריאות בישראל אין צורך בממוגרפיה שגרתית לפני גיל 50 כתנאי ל-MHT.`
    );
  }

  // משטח צוואר הרחם / hrHPV (גילאי 25–65 אם קיים צוואר רחם)
  const hasCervix = !data.hadHysterectomy || Boolean(data.cervixConserved);
  if (hasCervix && age >= 25 && age <= 65) {
    if (data.papHpvStatus === 'OVERDUE' || data.papHpvStatus === 'NOT_PERFORMED') {
      warnings.push('בדיקת סקר צוואר הרחם (משטח hrHPV בגילאי 25–65) אינה מעודכנת – מומלץ להשלים.');
      basketRecommendations.push('הפניה לבדיקת סקר צוואר הרחם (hrHPV אחת ל-3–5 שנים בסל הבריאות עד גיל 65).');
      patientInstructions.push('תיאום בדיקת משטח צוואר הרחם (HPV/Pap) אצל רופא/ת נשים.');
    }
  }

  // בדיקת סקר גנטי לנשאות BRCA1/2 במוצא אשכנזי (מלא או חלקי) מגיל 25 בסל הבריאות בישראל!
  if (
    age >= 25 &&
    (data.ethnicity === 'ASHKENAZI' || data.ethnicity === 'MIXED_ASHKENAZI') &&
    (familyHistory.brcaStatus === 'NOT_TESTED' || familyHistory.brcaStatus === 'UNKNOWN')
  ) {
    basketRecommendations.push(
      'זכאות סל הבריאות (מ-2020): בדיקת דם למוטציות המייסד ב-BRCA1/BRCA2 ללא צורך בייעוץ גנטי מקדים לנשים מגיל 25 ממוצא אשכנזי מלא או חלקי.'
    );
    patientInstructions.push(
      'יידוע על זכאות לבדיקת סקר גנטית חינם ל-BRCA1/2 בקופת החולים (למוצא אשכנזי מלא/חלקי).'
    );
  }

  // סקר סרטן המעי הגס (דם סמוי בצואה FIT בגילאי 50–74 או קולונוסקופיה בסיכון משפחתי/לינץ')
  if (familyHistory.lynchSyndrome || familyHistory.familyEndometrialOrColorectalCancer) {
    basketRecommendations.push('רקע משפחתי של ממאירות מעי גס/רירית הרחם או תסמונת לינץ׳: לוודא מעקב קולונוסקופיה תקופתי.');
    patientInstructions.push('תיאום מעקב קולונוסקופיה תקופתי בשל הרקע המשפחתי.');
  } else if (age >= 50 && age <= 74 && (data.fitColorectalStatus === 'OVERDUE' || data.fitColorectalStatus === 'NOT_PERFORMED')) {
    basketRecommendations.push('הפניה לבדיקת דם סמוי בצואה (FIT) שנתית בסל הבריאות (גילאי 50–74).');
    patientInstructions.push('ביצוע בדיקת דם סמוי בצואה (FIT) שנתית במעבדת הקופה.');
  }

  // צפיפות עצם (DXA) ו-FRAX
  const boneRisk = calculateBoneRisk(data);
  if (boneRisk.dxaIndicated) {
    basketRecommendations.push(
      `התוויה לבדיקת צפיפות עצם (DXA) וחישוב FRAX ישראל בשל: ${boneRisk.triggers.join(', ')}.`
    );
    patientInstructions.push('ביצוע בדיקת צפיפות עצם (DXA) ובדיקת רמת ויטמין D בדם.');
  }

  // ספירת דם ופריטין בדימום ווסתי מוגבר בפרי-מנופאוזה + פרופיל מטבולי וכבד
  if (data.bleedingIntensity === 'HEAVY' && (data.cbcStatus === 'NOT_TESTED' || !data.ferritinValue)) {
    warnings.push('דימום ווסתי כבד בפרי-מנופאוזה: מומלץ לבדוק ספירת דם ופריטין לשלילת חסר ברזל התורם לעייפות, דפיקות לב וערפול מוחי.');
    patientInstructions.push('בדיקת דם לספירת דם (CBC), פריטין, ברזל ו-TSH.');
  } else if (data.cbcStatus === 'ANEMIA' || (data.ferritinValue !== undefined && data.ferritinValue < 30)) {
    warnings.push('מתועדת אנמיה או פריטין נמוך (<30 ng/mL): יש לטפל בתוסף ברזל ולהתייחס לדימום הווסתי (למשל יתרון בולט להתקן מירנה!).');
  }

  if (data.glucoseLipidsStatus === 'NOT_TESTED') {
    basketRecommendations.push('מומלץ להשלים פרופיל שומנים בצום, גלוקוז/HbA1c וקריאטינין/eGFR לצורך הערכת סיכון PREVENT.');
    patientInstructions.push('השלמת בדיקות דם שגרתיות: סוכר, HbA1c, פרופיל שומנים ותפקודי כליה וכבד.');
  }

  if (data.lftStatus === 'ABNORMAL') {
    warnings.push('תפקודי כבד חריגים: יש לברר AST/ALT/בילירובין; אם נשקלת ויוזה (Fezolinetant) חובה לוודא ALT/AST < 2x ULN ובילירובין תקין טרם התחלה!');
  }

  if (medicalHistory.hypertensionStatus === 'UNCONTROLLED' || (data.bpSystolic >= 140 && data.bpSystolic < 180)) {
    warnings.push(
      `יתר לחץ דם בלתי מאוזן (${data.bpSystolic}/${data.bpDiastolic}): יש לאזן ל"ד במקביל ולהעדיף מתן אסטרדיול עורי בלבד (להימנע מאסטרוגן פומי).`
    );
  }

  return {
    isPassed: blockingReasons.length === 0,
    systemicMhtContraindicated,
    blockingReasons,
    contraindicationNotices,
    warnings,
    basketRecommendations,
    patientInstructions
  };
}
