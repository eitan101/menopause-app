import { EndometrialRiskAssessment, PreventRiskResult, Stage1Data } from './types';

export interface VteRiskAssessment {
  score: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CONTRAINDICATED_ACTIVE';
  mandatoryTransdermal: boolean;
  factors: string[];
  recommendationHebrew: string;
}

export interface BoneRiskAssessment {
  dxaIndicated: boolean;
  fraxRecommended: boolean;
  riskTier: 'LOW' | 'MODERATE' | 'HIGH';
  triggers: string[];
  guidanceHebrew: string;
}

// חישוב eGFR לפי משוואת 2021 CKD-EPI Race-Free לנשים כאשר מוזן קריאטינין (mg/dL)
export function computeFemaleCkdEpi2021Egfr(serumCreatinineMgDl: number, age: number): number {
  const scr = Math.max(0.2, serumCreatinineMgDl);
  const ratio = scr / 0.7;
  const egfr =
    142 *
    Math.pow(Math.min(ratio, 1), -0.241) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, age) *
    1.012;
  return Math.round(Math.min(140, Math.max(15, egfr)));
}

function logisticPct(x: number): number {
  const p = (Math.exp(x) / (1 + Math.exp(x))) * 100;
  return Number(Math.min(99.9, Math.max(0.1, p)).toFixed(1));
}

// מחשבון AHA PREVENT™ הרשמי לנשים (Khan SS et al., Circulation 2024;149:430-449 / MDCalc #10491)
export function calculateAhaPreventRisk(data: Stage1Data): PreventRiskResult {
  const { age, bmi, bpSystolic, isSmoker, medicalHistory, medications, familyHistory, preventInputs } = data;

  // בדיקת מעצימי סיכון ספציפיים לנשים (Female Risk Enhancers - שקלאי / NAMS / ACC)
  const femaleEnhancersPresent: string[] = [];
  if (medicalHistory.hadPreeclampsia) femaleEnhancersPresent.push('רעלת הריון בעבר (Preeclampsia)');
  if (medicalHistory.hadGestationalHtn) femaleEnhancersPresent.push('יתר לחץ דם הריוני בעבר');
  if (medicalHistory.hadGestationalDiabetes) femaleEnhancersPresent.push('סוכרת הריונית בעבר (GDM)');
  if (medicalHistory.hadPretermDelivery) femaleEnhancersPresent.push('לידה מוקדמת בעבר');
  if (medicalHistory.hasPcosOrChronicAnovulation) femaleEnhancersPresent.push('תסמונת שחלות פוליציסטיות (PCOS)');
  if (medicalHistory.autoimmuneDiseaseRaIbdSle) femaleEnhancersPresent.push('מחלה דלקתית/אוטואימונית (RA / IBD / לופוס)');
  if (data.hadBsoOrRrso && (data.rrsoAge || age) < 45) femaleEnhancersPresent.push('מנופאוזה כירורגית מוקדמת (<45)');
  else if (age < 45 && data.monthsSinceLastPeriod >= 12) femaleEnhancersPresent.push('מנופאוזה מוקדמת / POI (<45)');
  if (familyHistory.familyPrematureCvd) femaleEnhancersPresent.push('סיפור משפחתי של מחלת לב מוקדמת בקרבה ראשונה');

  // בדיקה מתי נדרש לפתוח אוטומטית את מחשבון PREVENT
  const autoOpenReasons: string[] = [];
  if (
    medicalHistory.hypertensionStatus !== 'NONE' ||
    medications.takingAntihypertensives ||
    bpSystolic >= 130 ||
    data.bpDiastolic >= 80
  ) {
    autoOpenReasons.push('יתר לחץ דם / ל"ד ≥130/80');
  }
  if (medicalHistory.diabetesStatus !== 'NONE' || medications.takingMetforminOrInsulinOrSglt2) {
    autoOpenReasons.push(medicalHistory.diabetesStatus === 'PREDIABETES' ? 'טרום-סוכרת' : 'סוכרת');
  }
  if (
    medicalHistory.dyslipidemia ||
    medicalHistory.hypertriglyceridemiaOver200 ||
    medications.takingStatins ||
    data.glucoseLipidsStatus === 'ABNORMAL'
  ) {
    autoOpenReasons.push('דיסליפידמיה / טיפול בסטטין');
  }
  if (isSmoker) autoOpenReasons.push('עישון פעיל');
  if (bmi >= 30) autoOpenReasons.push(`השמנה (BMI ${bmi})`);
  if (medicalHistory.chronicKidneyDiseaseOrSolitaryKidney) autoOpenReasons.push('מחלת כליות כרונית (CKD)');
  if (femaleEnhancersPresent.length > 0) autoOpenReasons.push('מעצימי סיכון קרדיו-וסקולריים נשיים');
  if (age >= 60) autoOpenReasons.push('גיל ≥60 בבחינת טיפול הורמונלי');

  const shouldAutoOpen = autoOpenReasons.length > 0 || preventInputs.isManuallyExpanded;

  // אם יש אירוע עורקי ידוע – המטופלת במניעה שניונית (PREVENT מיועד למניעה ראשונית)
  if (medicalHistory.activeOrRecentArterialEvent || medicalHistory.stabilizedRemotePostMi) {
    return {
      isApplicable: false,
      inapplicableReason: medicalHistory.activeOrRecentArterialEvent
        ? 'אירוע עורקי חריף/פעיל (MI / אנגינה לא יציבה / CVA / TIA) – מניעה שניונית (מחשבון PREVENT מיועד למניעה ראשונית).'
        : 'מחלת לב כלילית ידועה ויציבה בעבר (Post-MI) – מניעה שניונית.',
      shouldAutoOpen: true,
      autoOpenReasons: ['מחלה קרדיו-וסקולרית עורקית קיימת'],
      hasCompleteLabInputs: false,
      missingInputsHebrew: [],
      modelUsed: 'BASE',
      mhtTrafficLight: medicalHistory.activeOrRecentArterialEvent ? 'RED' : 'POST_EVENT',
      mhtGuidanceHebrew: medicalHistory.activeOrRecentArterialEvent
        ? 'אירוע עורקי חריף/לא יציב או CVA/TIA: התווית נגד ל-MHT סיסטמי! יש להעדיף חלופות לא-הורמונליות (ויוזה / ונלפקסין / CBT) ואסטרוגן נרתיקי ל-GSM.'
        : 'מצב יציב ומאוזן לאחר אוטם שריר הלב בעבר: לפי עדכון BMS 2024 אינו מהווה התווית נגד מוחלטת – ניתן לשקול בתיאום קרדיולוגי אסטרדיול עורי במינון נמוך + פרוגסטרון מיקרוני בלבד.',
      bp2025GuidanceHebrew: 'יעד איזון קפדני למניעה שניונית (<130/80 ממ"כ).',
      statin2026GuidanceHebrew: 'התוויה לטיפול אינטנסיבי בסטטינים למניעה שניונית.',
      femaleEnhancersPresent
    };
  }

  if (age < 30 || age > 79) {
    return {
      isApplicable: false,
      inapplicableReason: 'מחשבון AHA PREVENT מתוקף לגילאי 30–79.',
      shouldAutoOpen,
      autoOpenReasons,
      hasCompleteLabInputs: false,
      missingInputsHebrew: [],
      modelUsed: 'BASE',
      mhtTrafficLight: 'GREEN',
      mhtGuidanceHebrew: 'מחוץ לטווח גילאי PREVENT (30–79) – הערכת סיכון קלינית פרטנית.',
      bp2025GuidanceHebrew: '',
      statin2026GuidanceHebrew: '',
      femaleEnhancersPresent
    };
  }

  // בדיקת השלמת קלטים מספריים לחישוב PREVENT
  const missingInputsHebrew: string[] = [];
  const tc = preventInputs.totalCholesterolMgDl;
  const hdl = preventInputs.hdlCholesterolMgDl;
  let egfr = preventInputs.egfrMlMin;
  if ((!egfr || egfr <= 0) && preventInputs.serumCreatinineMgDl && preventInputs.serumCreatinineMgDl > 0) {
    egfr = computeFemaleCkdEpi2021Egfr(preventInputs.serumCreatinineMgDl, age);
  }

  if (!tc || tc < 100 || tc > 400) missingInputsHebrew.push('כולסטרול כללי (Total Cholesterol, 130–320 mg/dL)');
  if (!hdl || hdl < 15 || hdl > 130) missingInputsHebrew.push('כולסטרול HDL (20–100 mg/dL)');
  if (!egfr || egfr < 15 || egfr > 140) missingInputsHebrew.push('קצב סינון גלומרולרי eGFR (או קריאטינין בדם)');
  if (!bpSystolic || bpSystolic < 80 || bpSystolic > 240) missingInputsHebrew.push('לחץ דם סיסטולי (SBP)');

  if (missingInputsHebrew.length > 0 || !tc || !hdl || !egfr) {
    return {
      isApplicable: true,
      shouldAutoOpen,
      autoOpenReasons,
      hasCompleteLabInputs: false,
      missingInputsHebrew,
      computedEgfr: egfr,
      modelUsed: 'BASE',
      mhtTrafficLight: autoOpenReasons.length > 0 ? 'YELLOW' : 'GREEN',
      mhtGuidanceHebrew:
        'הזן/י כולסטרול כללי, HDL ו-eGFR (או קריאטינין) לחישוב מדויק של סיכון AHA PREVENT ל-10 ול-30 שנה. בנוכחות גורמי סיכון קרדיו-מטבוליים יש להעדיף מתן אסטרדיול עורי.',
      bp2025GuidanceHebrew: '',
      statin2026GuidanceHebrew: '',
      femaleEnhancersPresent
    };
  }

  // קלאמפינג לטווחי הולידציה של AHA PREVENT להבטחת יציבות מתמטית
  const clampedTc = Math.min(320, Math.max(130, tc));
  const clampedHdl = Math.min(100, Math.max(20, hdl));
  const clampedSbp = Math.min(200, Math.max(90, bpSystolic));
  const clampedEgfr = Math.min(140, Math.max(15, egfr));
  const clampedBmi = Math.min(39.9, Math.max(18.5, bmi || 25));

  const tcMmol = clampedTc / 38.67;
  const hdlMmol = clampedHdl / 38.67;

  const cage = (age - 55) / 10;
  const cageSq = cage * cage;
  const cnhdl = tcMmol - hdlMmol - 3.5;
  const chdl = (hdlMmol - 1.3) / 0.3;
  const csbp = (Math.min(clampedSbp, 110) - 110) / 20;
  const csbp2 = (Math.max(clampedSbp, 110) - 130) / 20;
  const cegfr = (Math.min(clampedEgfr, 60) - 60) / -15;
  const cegfr2 = (Math.max(clampedEgfr, 60) - 90) / -15;
  const cbmi = (Math.min(clampedBmi, 30) - 25) / 5;
  const cbmi2 = (Math.max(clampedBmi, 30) - 30) / 5;

  const dm = medicalHistory.diabetesStatus === 'DIABETES' ? 1 : 0;
  const smk = isSmoker ? 1 : 0;
  const antihtn =
    medications.takingAntihypertensives || medicalHistory.hypertensionStatus === 'CONTROLLED' ? 1 : 0;
  const statin = medications.takingStatins ? 1 : 0;

  // 10-Year Total CVD (Base vs Enhanced Add-on)
  let modelUsed: PreventRiskResult['modelUsed'] = 'BASE';
  let xTotal10: number;

  if (preventInputs.uacrMgG !== undefined && preventInputs.uacrMgG >= 0.1) {
    modelUsed = 'UACR_ENHANCED';
    const lnAcr = Math.log(Math.max(0.1, preventInputs.uacrMgG));
    xTotal10 =
      -3.738341 +
      0.7969249 * cage +
      0.0256635 * cnhdl -
      0.1588107 * chdl -
      0.2255701 * csbp +
      0.3396649 * csbp2 +
      0.8047515 * dm +
      0.5285338 * smk +
      0.4803511 * cegfr +
      0.0434472 * cegfr2 +
      0.2985207 * antihtn -
      0.1497787 * statin -
      0.0742889 * antihtn * csbp2 +
      0.106756 * statin * cnhdl -
      0.0778126 * cage * cnhdl +
      0.0306768 * cage * chdl -
      0.0907168 * cage * csbp2 -
      0.2705122 * cage * dm -
      0.0830564 * cage * smk -
      0.1389249 * cage * cegfr +
      0.1793037 * lnAcr;
  } else if (preventInputs.hba1cPercent !== undefined && preventInputs.hba1cPercent >= 4.0) {
    modelUsed = 'HBA1C_ENHANCED';
    const cA1c = preventInputs.hba1cPercent - 5.3;
    xTotal10 =
      -3.306162 +
      0.7858178 * cage +
      0.0194438 * cnhdl -
      0.1521964 * chdl -
      0.2296681 * csbp +
      0.3465777 * csbp2 +
      0.5366241 * dm +
      0.5411682 * smk +
      0.5931898 * cegfr +
      0.0472458 * cegfr2 +
      0.3158567 * antihtn -
      0.1535174 * statin -
      0.0687752 * antihtn * csbp2 +
      0.1054746 * statin * cnhdl -
      0.0761119 * cage * cnhdl +
      0.0307469 * cage * chdl -
      0.0905966 * cage * csbp2 -
      0.2241857 * cage * dm -
      0.080186 * cage * smk -
      0.1667286 * cage * cegfr +
      (dm ? 0.1338348 : 0.1622409) * cA1c;
  } else {
    xTotal10 =
      -3.307728 +
      0.7939329 * cage +
      0.0305239 * cnhdl -
      0.1606857 * chdl -
      0.2394003 * csbp +
      0.3600781 * csbp2 +
      0.8667604 * dm +
      0.5360739 * smk +
      0.6045917 * cegfr +
      0.0433769 * cegfr2 +
      0.3151672 * antihtn -
      0.1477655 * statin -
      0.0663612 * antihtn * csbp2 +
      0.1197879 * statin * cnhdl -
      0.0819715 * cage * cnhdl +
      0.0306769 * cage * chdl -
      0.0946348 * cage * csbp2 -
      0.27057 * cage * dm -
      0.078715 * cage * smk -
      0.1637806 * cage * cegfr;
  }

  const xAscvd10 =
    -3.819975 +
    0.719883 * cage +
    0.1176967 * cnhdl -
    0.151185 * chdl -
    0.0835358 * csbp +
    0.3592852 * csbp2 +
    0.8348585 * dm +
    0.4831078 * smk +
    0.4864619 * cegfr +
    0.0397779 * cegfr2 +
    0.2265309 * antihtn -
    0.0592374 * statin -
    0.0395762 * antihtn * csbp2 +
    0.0844423 * statin * cnhdl -
    0.0567839 * cage * cnhdl +
    0.0325692 * cage * chdl -
    0.1035985 * cage * csbp2 -
    0.2417542 * cage * dm -
    0.0791142 * cage * smk -
    0.1671492 * cage * cegfr;

  const xHf10 =
    -4.310409 +
    0.8998235 * cage -
    0.4559771 * csbp +
    0.3576505 * csbp2 +
    1.038346 * dm +
    0.583916 * smk -
    0.0072294 * cbmi +
    0.2997706 * cbmi2 +
    0.7451638 * cegfr +
    0.0557087 * cegfr2 +
    0.3534442 * antihtn -
    0.0981511 * antihtn * csbp2 -
    0.0946663 * cage * csbp2 -
    0.3581041 * cage * dm -
    0.1159453 * cage * smk -
    0.003878 * cage * cbmi2 -
    0.1884289 * cage * cegfr;

  const risk10YearTotalCvd = logisticPct(xTotal10);
  const risk10YearAscvd = logisticPct(xAscvd10);
  const risk10YearHeartFailure = logisticPct(xHf10);

  // חישוב 30 שנה (תקף לגילאי 30–59 – קריטי להחלטות MHT בנשים צעירות עם סיכון נמוך ל-10 שנים!)
  let risk30YearTotalCvd: number | undefined;
  let risk30YearAscvd: number | undefined;
  let risk30YearHeartFailure: number | undefined;

  if (age >= 30 && age <= 59) {
    const xTotal30 =
      -1.318827 +
      0.5503079 * cage -
      0.0928369 * cageSq +
      0.0409794 * cnhdl -
      0.1663306 * chdl -
      0.1628654 * csbp +
      0.3299505 * csbp2 +
      0.6793894 * dm +
      0.3196112 * smk +
      0.1857101 * cegfr +
      0.0553528 * cegfr2 +
      0.2894 * antihtn -
      0.075688 * statin -
      0.056367 * antihtn * csbp2 +
      0.1071019 * statin * cnhdl -
      0.0751438 * cage * cnhdl +
      0.0301786 * cage * chdl -
      0.0998776 * cage * csbp2 -
      0.3206166 * cage * dm -
      0.1607862 * cage * smk -
      0.1450788 * cage * cegfr;

    const xAscvd30 =
      -1.974074 +
      0.4669202 * cage -
      0.0893118 * cageSq +
      0.1256901 * cnhdl -
      0.1542255 * chdl -
      0.0018093 * csbp +
      0.322949 * csbp2 +
      0.6296707 * dm +
      0.268292 * smk +
      0.100106 * cegfr +
      0.0499663 * cegfr2 +
      0.1875292 * antihtn +
      0.0152476 * statin -
      0.0276123 * antihtn * csbp2 +
      0.0736147 * statin * cnhdl -
      0.0521962 * cage * cnhdl +
      0.0316918 * cage * chdl -
      0.1046101 * cage * csbp2 -
      0.2727793 * cage * dm -
      0.1530907 * cage * smk -
      0.1299149 * cage * cegfr;

    const xHf30 =
      -2.205379 +
      0.6254374 * cage -
      0.0983038 * cageSq -
      0.3919241 * csbp +
      0.3142295 * csbp2 +
      0.8330787 * dm +
      0.3438651 * smk +
      0.0594874 * cbmi +
      0.2525536 * cbmi2 +
      0.2981642 * cegfr +
      0.0667159 * cegfr2 +
      0.333921 * antihtn -
      0.0893177 * antihtn * csbp2 -
      0.0974299 * cage * csbp2 -
      0.404855 * cage * dm -
      0.1982991 * cage * smk -
      0.0035619 * cage * cbmi2 -
      0.1564215 * cage * cegfr;

    risk30YearTotalCvd = logisticPct(xTotal30);
    risk30YearAscvd = logisticPct(xAscvd30);
    risk30YearHeartFailure = logisticPct(xHf30);
  }

  // רמזור החלטת MHT לפי שקלאי / NAMS / AHA PREVENT
  let mhtTrafficLight: PreventRiskResult['mhtTrafficLight'] = 'GREEN';
  let mhtGuidanceHebrew = '';

  if (risk10YearTotalCvd >= 20 || risk10YearAscvd >= 15) {
    mhtTrafficLight = 'RED';
    mhtGuidanceHebrew = `סיכון קרדיו-וסקולרי גבוה ל-10 שנים (Total CVD ${risk10YearTotalCvd}%, ASCVD ${risk10YearAscvd}%): יש להימנע ממתן פומי, לבצע איזון קרדיו-מטבולי הדוק ולהעדיף טיפול לא-הורמונלי (ויוזה / SSRI-SNRI / CBT) כקו ראשון; אם נשקל MHT – רק אסטרדיול עורי במינון נמוך בתיאום רב-תחומי.`;
  } else if (
    risk10YearTotalCvd >= 5 ||
    risk10YearAscvd >= 5 ||
    (risk30YearTotalCvd !== undefined && risk30YearTotalCvd >= 20) ||
    femaleEnhancersPresent.length > 0
  ) {
    mhtTrafficLight = 'YELLOW';
    mhtGuidanceHebrew = `סיכון קרדיו-וסקולרי בינוני / נוכחות מעצימי סיכון נשיים (10y Total CVD ${risk10YearTotalCvd}%): MHT אפשרי בתוך חלון ההזדמנויות אך יש להעדיף חד-משמעית מתן עורי (ג'ל / מדבקה) + פרוגסטרון מיקרוני (Utrogestan) או דידרוגסטרון ולהימנע מאסטרוגן פומי ופרוגסטינים אנדרוגניים.`;
  } else {
    mhtTrafficLight = 'GREEN';
    mhtGuidanceHebrew = `סיכון קרדיו-וסקולרי נמוך ל-10 שנים (Total CVD ${risk10YearTotalCvd}%, ASCVD ${risk10YearAscvd}%): פרופיל בטיחות ווסקולרי מצוין ל-MHT (עורי או פומי בהתאם להעדפת המטופלת ולגורמי קרישה).`;
  }

  // הנחיות ACC/AHA 2025 ליתר לחץ דם לפי PREVENT Total CVD >= 7.5%
  let bp2025GuidanceHebrew = 'ל"ד תקין (<130/80 ממ"כ).';
  if (bpSystolic >= 140 || data.bpDiastolic >= 90) {
    bp2025GuidanceHebrew = 'יתר לחץ דם שלב 2 (≥140/90): מומלץ איזון תרופתי ואורחות חיים ליעד <130/80 ממ"כ.';
  } else if (bpSystolic >= 130 || data.bpDiastolic >= 80) {
    bp2025GuidanceHebrew =
      risk10YearTotalCvd >= 7.5
        ? `יתר ל"ד שלב 1 (130–139/80–89) עם PREVENT Total CVD ≥7.5% (${risk10YearTotalCvd}%): לפי הנחיות ACC/AHA 2025 מומלץ להתחיל טיפול תרופתי להורדת ל"ד בנוסף לאורחות חיים.`
        : `יתר ל"ד שלב 1 עם PREVENT Total CVD <7.5% (${risk10YearTotalCvd}%): מומלץ שינוי אורחות חיים ומעקב (טיפול תרופתי אם אינו מתאזן אחרי 3–6 חודשים).`;
  }

  // הנחיות ACC/AHA 2026 לדיסליפידמיה וסטטינים לפי PREVENT 10y ASCVD
  let statin2026GuidanceHebrew = '';
  if (risk10YearAscvd >= 10) {
    statin2026GuidanceHebrew = `סיכון ASCVD גבוה ל-10 שנים (${risk10YearAscvd}% ≥10%): התוויה לסטטין בעצימות גבוהה (ירידת LDL ≥50%).`;
  } else if (risk10YearAscvd >= 5) {
    statin2026GuidanceHebrew = `סיכון ASCVD בינוני ל-10 שנים (${risk10YearAscvd}%, טווח 5%–9.9%): מומלץ דיון משותף להתחלת סטטין בעצימות בינונית (ובמיוחד בנוכחות מעצימי סיכון נשיים / CAC).`;
  } else if (risk10YearAscvd >= 3) {
    statin2026GuidanceHebrew = `סיכון ASCVD גבולי ל-10 שנים (${risk10YearAscvd}%, טווח 3%–4.9%): מיקוד באורחות חיים; לשקול סטטין אם קיימים מעצימי סיכון נשיים או סיפור משפחתי.`;
  } else {
    statin2026GuidanceHebrew = `סיכון ASCVD נמוך ל-10 שנים (${risk10YearAscvd}% <3%): שמירה על אורח חיים בריא.`;
  }

  return {
    isApplicable: true,
    shouldAutoOpen,
    autoOpenReasons,
    hasCompleteLabInputs: true,
    missingInputsHebrew: [],
    computedEgfr: clampedEgfr,
    modelUsed,
    risk10YearTotalCvd,
    risk10YearAscvd,
    risk10YearHeartFailure,
    risk30YearTotalCvd,
    risk30YearAscvd,
    risk30YearHeartFailure,
    mhtTrafficLight,
    mhtGuidanceHebrew,
    bp2025GuidanceHebrew,
    statin2026GuidanceHebrew,
    femaleEnhancersPresent
  };
}

// הערכת סיכון לפקקת ורידית (VTE) וצורך במתן עורי
export function calculateVteRisk(data: Stage1Data): VteRiskAssessment {
  const { age, bmi, isSmoker, medicalHistory, familyHistory } = data;
  const factors: string[] = [];
  let score = 0;

  if (medicalHistory.activeAcuteVte) {
    return {
      score: 10,
      riskLevel: 'CONTRAINDICATED_ACTIVE',
      mandatoryTransdermal: true,
      factors: ['פקקת ורידים עמוקה / תסחיף ריאתי פעיל (Active DVT/PE)'],
      recommendationHebrew:
        'התווית נגד ל-MHT סיסטמי בעת אירוע VTE פעיל! יש לטפל בתסמינים בגישה לא-הורמונלית ובאסטרוגן נרתיקי ל-GSM.'
    };
  }

  if (medicalHistory.pastUnprovokedVte) {
    score += 4;
    factors.push('אירוע VTE ספונטני (Unprovoked) בעבר');
  }
  if (medicalHistory.pastProvokedVte) {
    score += 3;
    factors.push('אירוע VTE בעבר סביב גורם מעורר חולף');
  }
  if (medicalHistory.knownThrombophilia) {
    score += 4;
    factors.push(
      `טרומבופיליה ידועה${medicalHistory.thrombophiliaDetails ? ` (${medicalHistory.thrombophiliaDetails})` : ''}`
    );
  }
  if (medicalHistory.sleActiveOrAplaPositive) {
    score += 4;
    factors.push('לופוס פעיל או נוגדני APLA חיוביים');
  }
  if (familyHistory.familyVteOrThrombophilia) {
    score += 2;
    factors.push('סיפור משפחתי של VTE / טרומבופיליה בקרבה ראשונה');
  }
  if (bmi >= 30) {
    score += 2;
    factors.push(`BMI ≥ 30 (${bmi}) – מעלה סיכון VTE פי 2–3 תחת אסטרוגן פומי`);
  } else if (bmi >= 27) {
    score += 1;
    factors.push(`עודף משקל (BMI ${bmi})`);
  }
  if (isSmoker) {
    score += 1;
    factors.push('עישון פעיל');
  }
  if (age >= 60) {
    score += 2;
    factors.push(`גיל ≥ 60 (${age})`);
  }
  if (medicalHistory.superficialThrombophlebitisOrVaricose) {
    score += 1;
    factors.push('דליות בולטות / טרומבופלביטיס שטחית בעבר');
  }

  if (score >= 3) {
    return {
      score,
      riskLevel: 'HIGH',
      mandatoryTransdermal: true,
      factors,
      recommendationHebrew:
        'סיכון VTE מוגבר: איסור על אסטרוגן פומי! אסטרדיול עורי (ג\'ל / מדבקה) עוקף מעבר ראשון בכבד ואינו מעלה סיכון ל-VTE במחקרי תצפית (בשילוב אוטרוגסטן / דידרוגסטרון / מירנה; בטרומבופיליה/VTE בעבר מומלץ תיאום המטולוגי).'
    };
  }
  if (score >= 1) {
    return {
      score,
      riskLevel: 'MODERATE',
      mandatoryTransdermal: score >= 2,
      factors,
      recommendationHebrew:
        'קיימים גורמי סיכון מתונים לקרישה – מומלץ להעדיף מתן אסטרדיול עורי על פני מתן פומי.'
    };
  }

  return {
    score: 0,
    riskLevel: 'LOW',
    mandatoryTransdermal: false,
    factors: [],
    recommendationHebrew: 'סיכון VTE בסיסי נמוך.'
  };
}

// הערכת סיכון לרירית הרחם (BMS 2024 Management of Unscheduled Bleeding on HRT)
export function calculateEndometrialRisk(data: Stage1Data): EndometrialRiskAssessment {
  if (data.hadHysterectomy) {
    return {
      riskTier: 'LOW',
      majorFactors: [],
      minorFactors: [],
      rationale: 'המטופלת עברה כריתת רחם.'
    };
  }

  const majorFactors: string[] = [];
  const minorFactors: string[] = [];

  // Major Risk Factors (BMS 2024)
  if (data.bmi >= 40) {
    majorFactors.push(`BMI ≥ 40 (${data.bmi})`);
  }
  if (data.familyHistory.lynchSyndrome) {
    majorFactors.push('תסמונת לינץ׳ (Lynch Syndrome / HNPCC)');
  }
  if (data.medicalHistory.endometrialHyperplasiaHistory === 'ATYPICAL_OR_UNRESOLVED') {
    majorFactors.push('היפרפלזיה אטיפית או בלתי פתורה של רירית הרחם');
  }
  if ((data.yearsOnSequentialHrt || 0) > 5 && data.age > 45) {
    majorFactors.push('שימוש במשטר HRT סדרתי/ציקלי מעל 5 שנים באישה מעל גיל 45');
  }
  if (
    data.contraception.currentMethod === 'LOW_DOSE_IUS_KYLEENA' ||
    data.contraception.currentMethod === 'POP_SLYND_CERAZETTE'
  ) {
    majorFactors.push('פרוגסטוגן למניעת הריון (Kyleena / POP) שאינו מגן על הרירית אם שולב עם אסטרוגן');
  }
  if (data.medications.takingTamoxifen) {
    majorFactors.push('נטילת טמוקסיפן (מעלה סיכון לפוליפים/היפרפלזיה ברירית)');
  }

  // Minor Risk Factors (BMS 2024)
  if (data.bmi >= 30 && data.bmi < 40) {
    minorFactors.push(`BMI 30–39.9 (${data.bmi})`);
  }
  if (data.medicalHistory.diabetesStatus !== 'NONE') {
    minorFactors.push(data.medicalHistory.diabetesStatus === 'DIABETES' ? 'סוכרת' : 'טרום-סוכרת / תנגודת לאינסולין');
  }
  if (data.medicalHistory.hasPcosOrChronicAnovulation) {
    minorFactors.push('PCOS / אל-ביוץ כרוני');
  }
  if (data.medicalHistory.endometrialHyperplasiaHistory === 'TREATED_WITHOUT_ATYPIA') {
    minorFactors.push('היסטוריה של היפרפלזיה ללא אטיפיה שטופלה');
  }
  if (data.familyHistory.familyEndometrialOrColorectalCancer && !data.familyHistory.lynchSyndrome) {
    minorFactors.push('סיפור משפחתי של סרטן רירית הרחם או המעי הגס');
  }

  const isHighRisk = majorFactors.length >= 1 || minorFactors.length >= 2;

  return {
    riskTier: isHighRisk ? 'HIGH' : 'LOW',
    majorFactors,
    minorFactors,
    rationale: isHighRisk
      ? 'סיכון מוגבר להיפרפלזיה/ממאירות רירית הרחם (≥1 גורם מז׳ורי או ≥2 גורמים מינוריים לפי BMS 2024): סף נמוך ל-TVS וביופסיית פיפל בכל דימום חריג, והקפדה על מינון פרוגסטוגן מלא/מירנה בתוקף.'
      : 'סיכון בסיסי נמוך לרירית הרחם.'
  };
}

// הערכת סיכון לעצם והתוויה לבדיקת צפיפות עצם (DXA) ומחשבון FRAX
export function calculateBoneRisk(data: Stage1Data): BoneRiskAssessment {
  const triggers: string[] = [];

  if (data.medicalHistory.osteoporosisOrFragilityFracture || data.dxaStatus === 'OSTEOPOROSIS') {
    triggers.push('אוסטיאופורוזיס ידועה או שבר פריכות בעבר');
  }
  if (data.medicalHistory.osteopenia || data.dxaStatus === 'OSTEOPENIA') {
    triggers.push('אוסטיאופניה ידועה');
  }
  if (data.age >= 60) {
    triggers.push(`גיל ≥ 60 (${data.age}; בסל הבריאות מגיל 65 ללא תנאי ומגיל 50 עם גורמי סיכון)`);
  }
  if (data.hadBsoOrRrso && (data.rrsoAge || data.age) < 45) {
    triggers.push('מנופאוזה כירורגית מוקדמת (<45)');
  } else if (data.age < 45 && data.monthsSinceLastPeriod >= 4) {
    triggers.push('אי-ספיקה שחלתית מוקדמת / מנופאוזה מוקדמת (<45)');
  }
  if (data.familyHistory.familyOsteoporosisOrHipFracture) {
    triggers.push('סיפור משפחתי של אוסטיאופורוזיס / שבר צוואר הירך בהורה');
  }
  if (data.medications.takingSystemicCorticosteroids) {
    triggers.push('נטילת קורטיקוסטרואידים סיסטמיים');
  }
  if (data.medications.takingAromataseInhibitors) {
    triggers.push('טיפול במעכבי ארומטאז (מאיץ איבוד מסת עצם)');
  }
  if (data.bmi > 0 && data.bmi < 20) {
    triggers.push(`משקל גוף נמוך (BMI ${data.bmi} < 20)`);
  }
  if (data.isSmoker) {
    triggers.push('עישון פעיל');
  }
  if (data.alcoholUnitsPerWeek >= 14) {
    triggers.push(`צריכת אלכוהול מוגברת (${data.alcoholUnitsPerWeek} מנות/שבוע)`);
  }
  if (data.medicalHistory.autoimmuneDiseaseRaIbdSle || data.medicalHistory.malabsorptionOrBariatricSurgery) {
    triggers.push('מחלה דלקתית כרונית (RA/IBD) או תת-ספיגה/ניתוח בריאטרי');
  }

  const dxaIndicated = triggers.length > 0 && data.dxaStatus === 'NOT_PERFORMED';
  const fraxRecommended = data.age >= 40 && triggers.length > 0;
  const riskTier: BoneRiskAssessment['riskTier'] =
    data.medicalHistory.osteoporosisOrFragilityFracture ||
    data.dxaStatus === 'OSTEOPOROSIS' ||
    triggers.length >= 3
      ? 'HIGH'
      : triggers.length >= 1
      ? 'MODERATE'
      : 'LOW';

  const mhtContraindicatedForBone =
    data.medicalHistory.breastCancerHistory ||
    data.medications.takingTamoxifen ||
    data.medications.takingAromataseInhibitors ||
    data.medicalHistory.endometrialCancerHistory === 'ADVANCED_OR_SARCOMA' ||
    data.medicalHistory.ovarianCancerHistory === 'HORMONE_SENSITIVE_SEROUS_ENDOMETRIOID' ||
    data.medicalHistory.activeAcuteVte ||
    data.medicalHistory.activeOrRecentArterialEvent ||
    data.medicalHistory.activeLiverDiseaseOrPorphyria ||
    data.medicalHistory.sleActiveOrAplaPositive;

  const dxaActionPhrase =
    data.dxaStatus === 'NOT_PERFORMED'
      ? 'להשלים בדיקת צפיפות עצם (DXA) וחישוב FRAX ישראל'
      : 'להמשיך מעקב צפיפות עצם (DXA) תקופתי וחישוב FRAX';

  let guidanceHebrew =
    'סיכון בסיסי תקין לעצם; להקפיד על פעילות גופנית נושאת משקל/התנגדות, סידן 1,000–1,200 מ"ג/יום וויטמין D 800–1,000 יחב"ל/יום.';

  if (mhtContraindicatedForBone) {
    if (data.medications.takingAromataseInhibitors) {
      guidanceHebrew = `סיכון מואץ לאיבוד עצם תחת מעכבי ארומטאז (1%–3% בשנה): מומלץ ${dxaActionPhrase}, להקפיד על סידן (1,000–1,200 מ"ג/יום), ויטמין D (800–1,000 יחב"ל/יום) ואימוני התנגדות, ולשקול טיפול מגן-עצם לא-הורמונלי (ביספוספונטים או דנוסומאב – לפי NICE NG101 כבר מ-T-score ≤ -1.5!).`;
    } else if (riskTier !== 'LOW') {
      guidanceHebrew = `שמירה על בריאות העצם (ללא MHT בשל התווית נגד): מומלץ ${dxaActionPhrase}, להבטיח סידן (1,000–1,200 מ"ג/יום), ויטמין D (800–1,000 יחב"ל/יום) ואימוני התנגדות, ובמידת הצורך טיפול תרופתי ייעודי לעצם (ביספוספונטים / דנוסומאב).`;
    }
  } else if (riskTier === 'HIGH') {
    guidanceHebrew = `סיכון גבוה לאיבוד מסת עצם/שברים: מומלץ ${dxaActionPhrase}, להבטיח ויטמין D וסידן; מתחת לגיל 60 MHT במינון תקני/פיזיולוגי מפחית שברים בכ-30% (ומעל גיל 60 או בסיכון שבר גבוה לשקול ביספוספונטים לפי NOGG/IMA).`;
  } else if (riskTier === 'MODERATE') {
    guidanceHebrew = `קיימים גורמי סיכון לירידה בצפיפות העצם: מומלץ ${dxaActionPhrase} ולשלב אימוני התנגדות, סידן וויטמין D (ל-MHT יתרון מוכח בשימור צפיפות העצם).`;
  }

  return {
    dxaIndicated,
    fraxRecommended,
    riskTier,
    triggers,
    guidanceHebrew
  };
}
