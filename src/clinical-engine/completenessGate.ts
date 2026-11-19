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

  // 3. בדיקות סקר ומעקב מותאמות אישית לפרופיל האישה (IMA 2022 / סל הבריאות / NICE / NCCN)

  // 3א. הדמיית שד ומעקב שד – מותאם אישית (מחלימת סרטן שד / DCIS ≠ נשאית BRCA ≠ סיכון משפחתי ≠ סיכון ממוצע!)
  const isBrcaCarrier = familyHistory.brcaStatus === 'BRCA1' || familyHistory.brcaStatus === 'BRCA2';
  const hasPersonalBreastNeoplasm =
    medicalHistory.breastCancerHistory || medicalHistory.dcisOrAtypicalHyperplasia;
  const hasHighFamilyBreastRisk = familyHistory.familyCancerFirstDegreeUnder50OrMultiple;

  if (hasPersonalBreastNeoplasm) {
    // אישה עם היסטוריה אישית של סרטן שד / DCIS / אטיפיה – לעולם לא ממוגרפיית סקר דו-שנתית רגילה!
    if (data.mammographyStatus === 'OVERDUE' || data.mammographyStatus === 'NOT_PERFORMED') {
      warnings.push(
        'היסטוריה אישית של סרטן שד / DCIS / אטיפיה בשד: נדרש מעקב שד אונקולוגי/כירורגי שנתי מותאם אישית (ממוגרפיה שנתית ± US/MRI שד לפי פרוטוקול המרפאה האונקולוגית – ולא תוכנית הסקר הדו-שנתית הרגילה!).'
      );
      basketRecommendations.push(
        'מעקב שד אונקולוגי מותאם אישית: ממוגרפיה שנתית ± US/MRI שד ובדיקת כירורג/ית שד או אונקולוג/ית (לא סקר דו-שנתי שגרתי).'
      );
      patientInstructions.push(
        'הקפדה על מעקב הדמיית שד שנתי מותאם אישית (ממוגרפיה שנתית ± אולטרסאונד/MRI שד) במרפאת השד / האונקולוגיה המטפלת.'
      );
    } else if (data.mammographyStatus === 'UP_TO_DATE_NORMAL') {
      basketRecommendations.push(
        'המשך מעקב שד אונקולוגי/מרפאת שד שנתי קבוע (אחת לשנה לפי הנחיית האונקולוג/ית וכירורג/ית השד).'
      );
    }
  } else if (isBrcaCarrier) {
    // נשאית BRCA1/2 ידועה – פרוטוקול מרפאת נשאיות בסיכון גבוה (MRI שנתי + ממוגרפיה שנתית לסירוגין כל 6 חודשים) + דיון RRBSO
    if (data.mammographyStatus === 'OVERDUE' || data.mammographyStatus === 'NOT_PERFORMED') {
      warnings.push(
        `נשאית ${familyHistory.brcaStatus}: נדרש מעקב מרפאת נשאיות בסיכון גבוה בסל הבריאות (MRI שד שנתי מגיל 25 וממוגרפיה שנתית מגיל 30 לסירוגין כל 6 חודשים + כירורג/ית שד – ולא ממוגרפיה דו-שנתית רגילה!).`
      );
      basketRecommendations.push(
        `פרוטוקול נשאיות ${familyHistory.brcaStatus} בסל הבריאות: MRI שד שנתי + ממוגרפיה שנתית (לסירוגין כל חצי שנה) במרפאת נשאיות.`
      );
      patientInstructions.push(
        `תיאום מעקב מרפאת נשאיות (${familyHistory.brcaStatus}): MRI שד שנתי וממוגרפיה שנתית לסירוגין כל 6 חודשים.`
      );
    } else {
      basketRecommendations.push(
        `נשאית ${familyHistory.brcaStatus}: המשך מעקב חצי-שנתי לסירוגין (MRI שד שנתי + ממוגרפיה שנתית) במרפאת נשאיות.`
      );
    }

    // אם השחלות עדיין שמורות בנשאית BRCA בגיל המומלץ ל-RRBSO (35–40 ב-BRCA1, 40–45 ב-BRCA2)
    const rrbsoTargetAge = familyHistory.brcaStatus === 'BRCA1' ? 35 : 40;
    if (!data.hadBsoOrRrso && age >= rrbsoTargetAge) {
      warnings.push(
        `נשאית ${familyHistory.brcaStatus} בגיל ${age} עם שחלות שמורות: מומלץ לוודא ייעוץ גינקו-אונקולוגי לגבי כריתת טפולות מפחיתת סיכון (RRBSO – מומלץ בגילאי ${
          familyHistory.brcaStatus === 'BRCA1' ? '35–40' : '40–45'
        }).`
      );
      basketRecommendations.push(
        `ייעוץ גינקו-אונקולוגי בנושא כריתת טפולות מפחיתת סיכון (RRBSO) לנשאית ${familyHistory.brcaStatus}.`
      );
    }
  } else if (hasHighFamilyBreastRisk) {
    // סיפור משפחתי מוגבר (קרובה מדרגה ראשונה <50 או ריבוי מקרים) – ממוגרפיה שנתית מגיל 40!
    if (age >= 40 && (data.mammographyStatus === 'OVERDUE' || data.mammographyStatus === 'NOT_PERFORMED')) {
      warnings.push(
        `סיכון משפחתי מוגבר לסרטן שד בגיל ${age}: מומלץ להשלים ממוגרפיה שנתית (אחת לשנה מגיל 40 בסל הבריאות, ולא דו-שנתית) ובדיקת מרפאת שד.`
      );
      basketRecommendations.push(
        'הפניה לממוגרפיה שנתית בסל הבריאות (אחת לשנה מגיל 40 בשל סיפור משפחתי מוגבר מדרגה ראשונה).'
      );
      patientInstructions.push(
        'ביצוע בדיקת ממוגרפיה שנתית (אחת לשנה בשל הסיפור המשפחתי) ומעקב מרפאת שד.'
      );
    }
  } else {
    // אישה בסיכון ממוצע (ללא סרטן שד אישי, ללא נשאות BRCA וללא סיפור משפחתי מוקדם/מרובה)
    if (age >= 50 && age <= 74) {
      if (data.mammographyStatus === 'OVERDUE' || data.mammographyStatus === 'NOT_PERFORMED') {
        warnings.push(
          `גיל ${age} בסיכון ממוצע (טווח סל הבריאות 50–74): ממוגרפיה דו-שנתית אינה בתוקף – מומלץ להפנות להשלמת ממוגרפיה (ב-Red Whale ניתן להתחיל טיפול במקביל להפניה באישה א-תסמינית ללא ממצא בשד).`
        );
        basketRecommendations.push('הפניה לממוגרפיה דו-שנתית בתוכנית הלאומית בסל הבריאות (גילאי 50–74 בסיכון רגיל).');
        patientInstructions.push('ביצוע בדיקת ממוגרפיה דו-שנתית שגרתית במכון השד של הקופה.');
      }
    } else if (age < 50 && data.mammographyStatus === 'NOT_PERFORMED') {
      basketRecommendations.push(
        `גיל ${age} בסיכון ממוצע: לפי הנחיות משרד הבריאות והר"י (IMA 2022) אין צורך בממוגרפיית סקר שגרתית לפני גיל 50 כתנאי ל-MHT.`
      );
    } else if (age > 74 && (data.mammographyStatus === 'OVERDUE' || data.mammographyStatus === 'NOT_PERFORMED')) {
      basketRecommendations.push(
        `גיל ${age} (>74): המשך ממוגרפיה ייקבע בהחלטה משותפת פרטנית לפי מצב בריאותי כללי ותוחלת חיים (IMA 2022).`
      );
    }
  }

  // 3ב. בירור גנטי מותאם אישית: פאנל אונקוגנטי מלא בסיפור אישי/משפחתי מוגבר לעומת סקר מוטציות המייסד באשכנזיות בריאות!
  const needsFullOncogeneticPanel =
    medicalHistory.breastCancerHistory ||
    medicalHistory.ovarianCancerHistory !== 'NONE' ||
    familyHistory.familyCancerFirstDegreeUnder50OrMultiple;

  if (
    needsFullOncogeneticPanel &&
    (familyHistory.brcaStatus === 'NOT_TESTED' || familyHistory.brcaStatus === 'UNKNOWN')
  ) {
    basketRecommendations.push(
      'הפניה לייעוץ גנטי אונקולוגי מלא (בדיקת פאנל גנים רחב בסל הבריאות בשל היסטוריה אישית/משפחתית של סרטן שד/שחלה – ולא בדיקת סקר אוכלוסייה מצומצמת בלבד).'
    );
    patientInstructions.push(
      'תיאום תור למכון גנטי בקופת החולים/בית החולים להשלמת ייעוץ גנטי ובדיקת פאנל גנים מותאמת אישית.'
    );
  } else if (
    age >= 25 &&
    !needsFullOncogeneticPanel &&
    (data.ethnicity === 'ASHKENAZI' || data.ethnicity === 'MIXED_ASHKENAZI') &&
    (familyHistory.brcaStatus === 'NOT_TESTED' || familyHistory.brcaStatus === 'UNKNOWN')
  ) {
    basketRecommendations.push(
      'זכאות סל הבריאות (מ-2020): בדיקת דם חינם למוטציות המייסד ב-BRCA1/BRCA2 ללא צורך בייעוץ גנטי מקדים לנשים מגיל 25 ממוצא אשכנזי מלא או חלקי.'
    );
    patientInstructions.push(
      'יידוע על זכאות לבדיקת סקר גנטית חינם ל-BRCA1/2 בקופת החולים (למוצא אשכנזי מלא/חלקי).'
    );
  }

  // 3ג. משטח צוואר הרחם / hrHPV – מותאם להימצאות צוואר רחם ולהיסטוריה גינקו-אונקולוגית
  const hasCervix = !data.hadHysterectomy || Boolean(data.cervixConserved);
  if (!hasCervix) {
    if (medicalHistory.cervicalOrColorectalCancer) {
      basketRecommendations.push(
        'לאחר כריתת רחם עם רקע של ממאירות צוואר הרחם/מעי: לוודא המשך מעקב משטח כיפת נרתיק (Vault) לפי הנחיית גינקו-אונקולוגיה.'
      );
    }
  } else if (age >= 25 && age <= 65) {
    if (data.papHpvStatus === 'OVERDUE' || data.papHpvStatus === 'NOT_PERFORMED') {
      warnings.push('בדיקת סקר צוואר הרחם (משטח hrHPV בגילאי 25–65) אינה מעודכנת – מומלץ להשלים.');
      basketRecommendations.push('הפניה לבדיקת סקר צוואר הרחם (hrHPV אחת ל-3–5 שנים בסל הבריאות עד גיל 65).');
      patientInstructions.push('תיאום בדיקת משטח צוואר הרחם (HPV/Pap) אצל רופא/ת נשים.');
    }
  }

  // 3ד. סקר סרטן המעי הגס – קולונוסקופיה בסיכון אישי/משפחתי/לינץ׳/IBD לעומת FIT שנתי בסיכון ממוצע (50–74)
  if (
    medicalHistory.cervicalOrColorectalCancer ||
    familyHistory.lynchSyndrome ||
    familyHistory.familyEndometrialOrColorectalCancer
  ) {
    if (data.fitColorectalStatus !== 'UP_TO_DATE_NORMAL') {
      basketRecommendations.push(
        'רקע אישי/משפחתי של ממאירות מעי גס/רירית הרחם או תסמונת לינץ׳: מעקב קולונוסקופיה תקופתי מותאם אישית (ולא בדיקת דם סמוי בצואה רגילה!).'
      );
      patientInstructions.push(
        'תיאום מעקב קולונוסקופיה תקופתי מותאם אישית במכון גסטרואנטרולוגיה (בהתאם לרקע המשפחתי/אישי).'
      );
    }
  } else if (
    age >= 50 &&
    age <= 74 &&
    (data.fitColorectalStatus === 'OVERDUE' || data.fitColorectalStatus === 'NOT_PERFORMED')
  ) {
    basketRecommendations.push('הפניה לבדיקת דם סמוי בצואה (FIT) שנתית בסל הבריאות (גילאי 50–74 בסיכון ממוצע).');
    patientInstructions.push('ביצוע בדיקת דם סמוי בצואה (FIT) שנתית במעבדת הקופה.');
  }

  // 3ה. צפיפות עצם (DXA) ו-FRAX – מותאם לסטטוס ה-DXA הקיים ולמעכבי ארומטאז
  const boneRisk = calculateBoneRisk(data);
  if (boneRisk.dxaIndicated) {
    basketRecommendations.push(
      `התוויה לבדיקת צפיפות עצם (DXA) וחישוב FRAX ישראל בשל: ${boneRisk.triggers.join(', ')}.`
    );
    patientInstructions.push(
      medications.takingAromataseInhibitors
        ? 'ביצוע בדיקת צפיפות עצם (DXA) בסיסית ובדיקת רמת ויטמין D וסידן בשל הטיפול במעכב ארומטאז.'
        : 'ביצוע בדיקת צפיפות עצם (DXA) ובדיקת רמת ויטמין D בדם.'
    );
  } else if (data.dxaStatus === 'OSTEOPOROSIS' || data.dxaStatus === 'OSTEOPENIA') {
    basketRecommendations.push(
      `מתועדת ${data.dxaStatus === 'OSTEOPOROSIS' ? 'אוסטיאופורוזיס' : 'אוסטיאופניה'} בבדיקת DXA: לוודא ויטמין D (800–1000 יחב"ל/יום), סידן (1000–1200 מ"ג/יום), אימוני התנגדות והערכת צורך בטיפול תרופתי ייעודי לעצם ומעקב DXA תקופתי.`
    );
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
