import { evaluateCompletenessGate } from './completenessGate';
import { checkDrugInteractions } from './drugInteractions';
import { summarizeSymptoms } from './imsSymptoms';
import {
  calculateAhaPreventRisk,
  calculateBoneRisk,
  calculateEndometrialRisk,
  calculateVteRisk
} from './riskCalculators';
import { evaluateContraceptionAndMirena, evaluateSTRAWStage } from './strawStaging';
import {
  EstrogenDoseTier,
  LocalOrAdjunctOption,
  PriorFailedTreatment,
  RegimenType,
  RoutePreference,
  Stage1Data,
  Stage2Recommendations,
  TreatmentOptionCard
} from './types';

function findPriorFailure(
  list: PriorFailedTreatment[],
  keys: PriorFailedTreatment['treatmentKey'][]
): PriorFailedTreatment | undefined {
  return list.find((item) => keys.includes(item.treatmentKey));
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(99, Math.round(n)));
}

export function formulateTreatment(data: Stage1Data): Stage2Recommendations {
  const straw = evaluateSTRAWStage(data);
  const contraceptionEval = evaluateContraceptionAndMirena(data);
  const gate = evaluateCompletenessGate(data);
  const vte = calculateVteRisk(data);
  const prevent = calculateAhaPreventRisk(data);
  const endoRisk = calculateEndometrialRisk(data);
  const boneRisk = calculateBoneRisk(data);
  const interactions = checkDrugInteractions(data);
  const sym = summarizeSymptoms(data.symptoms);

  // 1. קביעת מדרגת מינון האסטרוגן ומינון הפרוגסטוגן הפרופורציונלי (BMS 2024 / Red Whale / Dr. Shaklai)
  let estrogenDoseTier: EstrogenDoseTier = 'STANDARD';
  let estrogenDoseTierReasonHebrew =
    'גיל מעבר טיפוסי (45–59): התחלה במינון תקני-נמוך וטיטרציה לפי תגובה קלינית לאחר 8–12 שבועות.';

  if (
    straw.stage === 'POI' ||
    straw.stage === 'EARLY_MENOPAUSE' ||
    (straw.stage === 'SURGICAL_MENOPAUSE' && data.age < 45)
  ) {
    estrogenDoseTier = 'MODERATE_HIGH_PHYSIOLOGIC';
    estrogenDoseTierReasonHebrew =
      'POI / מנופאוזה מוקדמת או כירורגית מתחת לגיל 45: נדרש מינון אסטרדיול פיזיולוגי גבוה יותר (למשל Estrogel 2–4 לחיצות או Evorel 75–100) להגנה על העצם, העורקים והמוח – עם הכפלה פרופורציונלית של הפרוגסטוגן ברחם שמור!';
  } else if (data.age >= 60 || data.monthsSinceLastPeriod >= 120) {
    estrogenDoseTier = 'LOW';
    estrogenDoseTierReasonHebrew =
      'גיל ≥60 או מעל 10 שנים מהווסת האחרונה: אם מותחל MHT יש לבחור מינון אסטרדיול נמוך/אולטרה-נמוך במתן עורי בלבד.';
  }

  // מינון פרוגסטוגן פרופורציונלי לפי BMS 2024
  const isHighEstrogenTier = estrogenDoseTier === 'MODERATE_HIGH_PHYSIOLOGIC';
  const utrogestanContinuousDose = isHighEstrogenTier
    ? 'Utrogestan 200 מ"ג כל ערב ברצף (מינון מוכפל בהתאמה למינון אסטרוגן בינוני-גבוה!)'
    : 'Utrogestan 100 מ"ג כל ערב לפני השינה ברצף';
  const utrogestanSequentialDose = isHighEstrogenTier
    ? 'Utrogestan 300 מ"ג לפני השינה למשך 12 ימים בכל חודש (מותאם למינון E2 גבוה!)'
    : 'Utrogestan 200 מ"ג לפני השינה למשך 12–14 ימים בכל חודש';

  const estrogelDoseText =
    estrogenDoseTier === 'MODERATE_HIGH_PHYSIOLOGIC'
      ? '2–3 לחיצות ביום (1.5–2.25 מ"ג E2; ניתן לעלות עד 4 לחיצות לפי תגובה ורמת E2 בדם)'
      : estrogenDoseTier === 'LOW'
      ? 'לחיצה אחת ביום (0.75 מ"ג E2)'
      : '1–2 לחיצות ביום (0.75–1.5 מ"ג E2)';

  const evorelDoseText =
    estrogenDoseTier === 'MODERATE_HIGH_PHYSIOLOGIC'
      ? 'מדבקת Evorel 75 או Evorel 100 פעמיים בשבוע'
      : estrogenDoseTier === 'LOW'
      ? 'מדבקת Evorel 25 (או חצי מדבקת 50) פעמיים בשבוע'
      : 'מדבקת Evorel 50 פעמיים בשבוע';

  // 2. קביעת סוג המשטר הרחמי (אסטרוגן בלבד / ציקלי / רציף / לא-הורמונלי ראשי)
  const needsEndometrialProtection =
    !data.hadHysterectomy || data.medicalHistory.hadEndometriosis || Boolean(data.cervixConserved);
  const isPostmenopausalOver1Year =
    data.cyclePattern === 'AMENORRHEA_OVER_12_MONTHS' || data.monthsSinceLastPeriod >= 12 || data.hadBsoOrRrso;

  let regimenType: RegimenType = 'CONTINUOUS_COMBINED';
  let regimenHebrewTitle = '';

  if (gate.systemicMhtContraindicated) {
    regimenType = 'NON_HORMONAL_PRIMARY';
    regimenHebrewTitle = 'מסלול לא-הורמונלי מותאם אישית + טיפול מקומי ל-GSM (עקב התווית נגד ל-MHT סיסטמי)';
  } else if (!needsEndometrialProtection) {
    regimenType = 'ESTROGEN_ONLY';
    regimenHebrewTitle = 'אסטרוגן סיסטמי בלבד (לאחר כריתת רחם ללא אנדומטריוזיס שיורי – ללא צורך בפרוגסטוגן)';
  } else if (isPostmenopausalOver1Year) {
    regimenType = 'CONTINUOUS_COMBINED';
    regimenHebrewTitle = 'משטר משולב רציף ללא דימום (Continuous Combined MHT – מעל 12 חודשי אל-ווסת)';
  } else {
    regimenType = 'SEQUENTIAL_COMBINED';
    regimenHebrewTitle = 'משטר משולב סדרתי/ציקלי או מירנה + E2 (פחות מ-12 חודשי אל-ווסת – מניעת דימומים בלתי צפויים)';
  }

  // 3. קביעת ציר המתן (עורי חובה / עורי מועדף / פומי או עורי / לא-הורמונלי)
  const routeRationale: string[] = [];
  let mandatoryTransdermal = false;
  let preferTransdermal = false;

  if (vte.mandatoryTransdermal) {
    mandatoryTransdermal = true;
    routeRationale.push(`סיכון קרישתי/VTE (${vte.factors.join(', ')}) – מתן עורי עוקף יצירת פקטורי קרישה בכבד.`);
  }
  if (data.bmi >= 30) {
    mandatoryTransdermal = true;
    routeRationale.push(`BMI ≥ 30 (${data.bmi}) – חובה אסטרדיול עורי למניעת הכפלת סיכון פקקתי.`);
  }
  if (data.medicalHistory.migraineWithAura) {
    mandatoryTransdermal = true;
    routeRationale.push('מיגרנה עם אאורה – אסטרוגן פומי אסור; מתן עורי במינון יציב ונמוך מותר ובטוח (Red Whale / BMS).');
  } else if (data.medicalHistory.migraineWithoutAura) {
    preferTransdermal = true;
    routeRationale.push('מיגרנה ללא אאורה – מתן עורי שומר על רמות אסטרדיול יציבות ומונע התקפי מיגרנה מתנודות.');
  }
  if (data.medicalHistory.hypertriglyceridemiaOver200) {
    mandatoryTransdermal = true;
    routeRationale.push('היפרטריגליצרידמיה (TG ≥ 200 mg/dL) – אסטרוגן פומי עלול להקפיץ TG ולגרום לפנקראטיטיס; מתן עורי בלבד!');
  }
  if (data.medicalHistory.fattyLiverOrGallstones) {
    mandatoryTransdermal = true;
    routeRationale.push('כבד שומני (MASLD) או אבני מרה – אסטרוגן פומי מעלה רוויון כולסטרול במרה; חובה מתן עורי.');
  }
  if (data.medicalHistory.malabsorptionOrBariatricSurgery) {
    mandatoryTransdermal = true;
    routeRationale.push('ניתוח בריאטרי / תת-ספיגה – מתן עורי מבטיח ספיגה יציבה שאינה תלויה במעי.');
  }
  if (interactions.some((i) => i.forcesTransdermalEstrogen)) {
    mandatoryTransdermal = true;
    routeRationale.push(
      `אינטראקציה תרופתית פעילה (${interactions
        .filter((i) => i.forcesTransdermalEstrogen)
        .map((i) => i.drugName)
        .join(', ')}) המחייבת מתן עורי.`
    );
  }
  if (
    prevent.mhtTrafficLight === 'YELLOW' ||
    prevent.mhtTrafficLight === 'POST_EVENT' ||
    data.medicalHistory.hypertensionStatus !== 'NONE' ||
    data.medicalHistory.diabetesStatus !== 'NONE' ||
    data.isSmoker ||
    data.age >= 60
  ) {
    mandatoryTransdermal =
      mandatoryTransdermal ||
      data.age >= 60 ||
      prevent.mhtTrafficLight === 'POST_EVENT' ||
      data.medicalHistory.diabetesStatus === 'DIABETES' ||
      data.medicalHistory.hypertensionStatus === 'UNCONTROLLED';
    preferTransdermal = true;
    routeRationale.push(
      'פרופיל קרדיו-מטבולי / גיל / עישון / PREVENT: מתן עורי של 17β-Estradiol מועדף חד-משמעית לבטיחות ווסקולרית.'
    );
  }
  if (data.medications.takingLevothyroxine) {
    preferTransdermal = true;
    routeRationale.push('נטילת לבותירוקסין: מתן עורי אינו מעלה TBG ומונע צורך בשינוי מינון אלטרוקסין.');
  }
  if (sym.hasSignificantHsdd) {
    preferTransdermal = true;
    routeRationale.push('ירידה בחשק המיני (HSDD): אסטרוגן עורי אינו מעלה SHBG ולכן אינו מוריד טסטוסטרון חופשי (בניגוד לפומי!).');
  }

  let routePreference: RoutePreference = 'ORAL_OR_TRANSDERMAL';
  if (gate.systemicMhtContraindicated || prevent.mhtTrafficLight === 'RED') {
    routePreference = 'NON_HORMONAL_ONLY';
    if (prevent.mhtTrafficLight === 'RED' && !gate.systemicMhtContraindicated) {
      routeRationale.push(
        `סיכון AHA PREVENT גבוה (${prevent.risk10YearTotalCvd}% ל-10 שנים): מומלץ קו ראשון לא-הורמונלי ואיזון גורמי סיכון.`
      );
    }
  } else if (mandatoryTransdermal) {
    routePreference = 'TRANSDERMAL_MANDATORY';
  } else if (preferTransdermal) {
    routePreference = 'TRANSDERMAL_PREFERRED';
  } else {
    routeRationale.push(
      'אישה מתחת לגיל 60 ללא גורמי סיכון פקקתיים, מטבוליים או אינטראקציות – ניתן לבחור מתן עורי (מועדף בטיחותית) או פומי לפי העדפתה.'
    );
  }

  const blocksUtrogestan = data.medicalHistory.peanutOrSoyAllergy;
  const patchSensitivity = data.medicalHistory.patchAdhesiveSensitivity;
  const prefersNonHormonal = data.preferences.hormoneAttitude === 'PREFERS_NON_HORMONAL';
  const prefersBodyIdentical = data.preferences.hormoneAttitude === 'PREFERS_BODY_IDENTICAL';
  const mhtBlocked = gate.systemicMhtContraindicated;
  const highCvRisk = prevent.mhtTrafficLight === 'RED';

  // בניית כרטיסי אופציות הטיפול (הורמונליות + לא-הורמונליות) עם דירוג מותאם אישית, יתרונות וחסרונות
  const options: TreatmentOptionCard[] = [];

  // --- אופציה הורמונלית 1: ג'ל אסטרדיול עורי + אוטרוגסטן / דופסטון (או ללא פרוגסטוגן בכריתת רחם) ---
  {
    const failed = findPriorFailure(data.preferences.priorFailedTreatments, ['ESTROGEL_SANDRENA', 'UTROGESTAN_ORAL']);
    let score = mhtBlocked ? 5 : highCvRisk ? 38 : 92;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'פרופיל הבטיחות הגבוה ביותר (Body-Identical): אפס עלייה בסיכון ל-VTE או שבץ מוחי בעקיפת הכבד.',
      'גמישות קלה בטיטרציית מינון יומית וללא גירוי עורי מדבק מדבקות.'
    ];
    const cons: string[] = [
      'דורש מריחה יומית והמתנה של 5 דקות לייבוש (ו-60 דקות ממגע עור-בעור באזור המריחה).'
    ];

    let progestogenText: string | undefined;
    if (needsEndometrialProtection) {
      if (blocksUtrogestan) {
        progestogenText =
          regimenType === 'CONTINUOUS_COMBINED'
            ? 'Duphaston (דידרוגסטרון) 10 מ"ג ביום ברצף (נבחר במקום אוטרוגסטן בשל אלרגיה לבוטנים/סויה!)'
            : 'Duphaston 10 מ"ג ליום למשך 14 ימים בחודש (בטוח באלרגיית בוטנים/סויה!)';
        matchReasons.push('הותאם אוטומטית עם דופסטון במקום אוטרוגסטן עקב אלרגיה לבוטנים/סויה!');
      } else {
        progestogenText =
          regimenType === 'CONTINUOUS_COMBINED' ? utrogestanContinuousDose : utrogestanSequentialDose;
        pros.push('אוטרוגסטן בנטילת ערב תורם להירדמות ולשיפור שינה (השפעה גאבארגית טבעית) והבטוח ביותר לשד.');
        cons.push('דורש נטילת שני תכשירים נפרדים (ג׳ל + כדור ערב – חשיבות להקפדה על הפרוגסטוגן להגנת הרירית!).');
        if (data.medications.takingGlp1) {
          score -= 14;
          cons.push('תחת GLP-1 ספיגת פרוגסטוגן פומי עלולה להיפגע – שקלי מירנה או מדבקה משולבת להגנת הרירית!');
        }
      }
    } else {
      pros.push('לאחר כריתת רחם: אסטרוגן בלבד (ללא פרוגסטוגן) אינו מעלה סיכון לסרטן השד ואף הדגים ירידה במחקר WHI.');
    }

    if (sym.hasSignificantSleepIssue && !blocksUtrogestan && needsEndometrialProtection) {
      score += 4;
      matchReasons.push('מתאים במיוחד להפרעות השינה שדורגו בחשיבות גבוהה (אוטרוגסטן לפני השינה).');
    }
    if (patchSensitivity) {
      score += 6;
      matchReasons.push('מועדף על פני מדבקות עקב רגישות עורית לדבק.');
    }
    if (prefersBodyIdentical) {
      score += 5;
      matchReasons.push('תואם את העדפת המטופלת להורמונים זהים-ביולוגית (Body-Identical).');
    }
    if (data.preferences.preferredRoute === 'TRANSDERMAL_GEL') {
      score += 10;
      matchReasons.push('תואם את העדפת המטופלת לג׳ל עורי.');
    }
    if (prefersNonHormonal) score -= 28;
    if (failed) {
      score -= 26;
      cons.push(`נוסה בעבר והופסק (${failed.reasonStopped || 'לפי דיווח המטופלת'}) – דורג נמוך יותר בהתאם.`);
    }

    options.push({
      id: 'opt_transdermal_gel_body_identical',
      category: 'HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: mhtBlocked
        ? 'CONTRAINDICATED_FOR_PATIENT'
        : highCvRisk || prefersNonHormonal
        ? 'CONDITIONAL'
        : score >= 85
        ? 'RECOMMENDED_TOP'
        : 'GOOD_ALTERNATIVE',
      titleHebrew: needsEndometrialProtection
        ? blocksUtrogestan
          ? 'ג׳ל אסטרדיול עורי (Estrogel / Sandrena) + דופסטון פומי'
          : 'ג׳ל אסטרדיול עורי (Estrogel / Sandrena) + אוטרוגסטן מיקרוני'
        : 'ג׳ל אסטרדיול עורי בלבד (Estrogel / Sandrena)',
      subtitleHebrew: 'משטר Body-Identical גמיש בבטיחות ווסקולרית ומטבולית מרבית',
      routeLabelHebrew: 'עורי (ג׳ל יומי)',
      regimenLabelHebrew: needsEndometrialProtection
        ? regimenType === 'CONTINUOUS_COMBINED'
          ? 'משולב רציף'
          : 'משולב ציקלי'
        : 'אסטרוגן בלבד',
      israeliProductsSummary: {
        primaryAgent: `Estrogel 0.06%: ${estrogelDoseText} (או Sandrena שקיק יומי שווה-ערך)`,
        secondaryProgestogenOrMonitor: progestogenText,
        scheduleHebrew: needsEndometrialProtection
          ? `מריחת ג׳ל יומית קבועה + ${progestogenText}`
          : 'מריחת ג׳ל יומית קבועה ללא צורך בפרוגסטוגן'
      },
      prosHebrew: pros,
      consHebrew: mhtBlocked ? [...gate.contraindicationNotices, ...cons] : cons,
      tailoredMatchReasons: matchReasons,
      monitoringNotesHebrew:
        'הערכת תגובה קלינית כעבור 3 חודשים; אם אין הטבה מספקת תחת ג׳ל – לבדוק טכניקת מריחה ורמת Estradiol בסרום לשלילת תת-ספיגה עורית.'
    });
  }

  // --- אופציה הורמונלית 2: התקן מירנה 52 מ"ג + אסטרדיול עורי (רלוונטי כשיש רחם) ---
  if (needsEndometrialProtection) {
    const failed = findPriorFailure(data.preferences.priorFailedTreatments, ['MIRENA_IUS']);
    let score = mhtBlocked ? 4 : highCvRisk ? 35 : 86;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'מגן באופן ישיר ואמין ביותר על רירית הרחם ל-5 שנים ללא תלות בספיגה במעי, ב-GLP-1 או באנזימי כבד!',
      'משמש בו-זמנית כאמצעי מניעה מצוין ומפחית ב-90% דימומים ווסתיים כבדים (HMB) ואנמיה.',
      'חוסך תופעות לוואי סיסטמיות של פרוגסטרון פומי ומשאיר חופש לטיטרציית אסטרדיול עורי (ג׳ל או מדבקה).'
    ];
    const cons: string[] = [
      'דורש פעולת התקנה גינקולוגית במרפאה; יתכנו הכתמות בחודשים הראשונים לאחר ההתקנה.',
      'תוקף להגנת רירית תחת MHT הוא 5 שנים בלבד (חובה לתעד מועד החלפה!).'
    ];

    if (data.contraception.currentMethod === 'MIRENA_52MG') {
      if (contraceptionEval.mirenaValidForMhtEndometrium) {
        score += 12;
        matchReasons.push('למטופלת כבר קיים התקן מירנה בתוקף (≤5 שנים) – ניתן להוסיף אסטרדיול עורי מיד!');
      } else {
        cons.push('שים/י לב: המירנה הנוכחית מעל 5 שנים – חובה להחליפה לפני הסתמכות עליה להגנת הרירית!');
      }
    }
    if (contraceptionEval.needsContraception) {
      score += 9;
      matchReasons.push('עונה במדויק על הצורך הפעיל של המטופלת באמצעי מניעה במקביל ל-MHT!');
    }
    if (data.bleedingIntensity === 'HEAVY' || data.cbcStatus === 'ANEMIA' || data.medicalHistory.hasFibroidsOrAdenomyosis) {
      score += 8;
      matchReasons.push('אידיאלי לדימום ווסתי כבד / אדנומיוזיס / אנמיה.');
    }
    if (data.medications.takingGlp1 || data.medications.takingEnzymeInducers || data.medicalHistory.malabsorptionOrBariatricSurgery) {
      score += 10;
      matchReasons.push('הפתרון הבטוח ביותר להגנת הרירית תחת GLP-1 / משרני אנזימים / תת-ספיגה!');
    }
    if (endoRisk.riskTier === 'HIGH') {
      score += 6;
      matchReasons.push('מועדף בסיכון אנדומטריאלי מוגבר (BMI גבוה / PCOS / סוכרת).');
    }
    if (data.preferences.preferredRoute === 'MIRENA_BASED') {
      score += 10;
      matchReasons.push('תואם את העדפת המטופלת למשטר מבוסס מירנה.');
    }
    if (prefersNonHormonal) score -= 28;
    if (failed) {
      score -= 30;
      cons.push(`מירנה נוסתה בעבר והופסקה (${failed.reasonStopped || 'אי-סבילות'}).`);
    }

    options.push({
      id: 'opt_mirena_plus_transdermal_e2',
      category: 'HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: mhtBlocked
        ? 'CONTRAINDICATED_FOR_PATIENT'
        : highCvRisk || prefersNonHormonal
        ? 'CONDITIONAL'
        : score >= 88
        ? 'RECOMMENDED_TOP'
        : 'GOOD_ALTERNATIVE',
      titleHebrew: 'התקן מירנה 52 מ"ג + אסטרדיול עורי (Estrogel / Evorel)',
      subtitleHebrew: 'הגנת רירית מקומית מלאה + מניעת הריון + אסטרדיול עורי בטוח',
      routeLabelHebrew: 'תוך-רחמי + עורי',
      regimenLabelHebrew: 'משולב רציף (ללא דמם גמילה)',
      israeliProductsSummary: {
        primaryAgent: `Estrogel (${estrogelDoseText}) או ${evorelDoseText}`,
        secondaryProgestogenOrMonitor: 'Mirena 52mg IUS (בתוקף עד 5 שנים ממועד ההתקנה עבור MHT)',
        scheduleHebrew: 'מירנה ברחם (עד 5 שנים) + אסטרדיול עורי רציף'
      },
      prosHebrew: pros,
      consHebrew: mhtBlocked ? [...gate.contraindicationNotices, ...cons] : cons,
      tailoredMatchReasons: matchReasons,
      monitoringNotesHebrew: 'לוודא רישום תאריך התקנת המירנה בתיק (החלפה בתום 5 שנים תחת MHT).'
    });
  }

  // --- אופציה הורמונלית 3: מדבקות אסטרדיול (Evorel + אוטרוגסטן/דופסטון או Evorel Conti/Sequi) ---
  {
    const failed = findPriorFailure(data.preferences.priorFailedTreatments, ['EVOREL_PATCH']);
    let score = mhtBlocked ? 4 : highCvRisk ? 36 : 87;
    const matchReasons: string[] = [];
    const useCombinedPatch =
      needsEndometrialProtection &&
      (blocksUtrogestan || data.medications.takingGlp1) &&
      estrogenDoseTier === 'STANDARD';

    const pros: string[] = [
      'החלפה פעמיים בשבוע בלבד (נוחות גבוהה לנשים ששוכחות מריחה יומית).',
      'שחרור אסטרדיול אחיד ויציב לאורך 24 שעות (יתרון במיגרנה ללא/עם אאורה ובתנודות מצב רוח), ללא סיכון VTE.'
    ];
    if (useCombinedPatch) {
      pros.push('מדבקה משולבת (Evorel Conti / Sequi) מספקת גם פרוגסטין דרך העור – עוקפת בעיית ספיגה של GLP-1 וללא סויה/בוטנים!');
    }
    const cons: string[] = [
      'יתכן גירוי עורי מקומי מדבק המדבקה או התקלפות בקיץ/שחייה.'
    ];

    if (patchSensitivity) {
      score -= 28;
      cons.push('למטופלת מתועדת רגישות לדבק מדבקות – עדיף ג׳ל אסטרוג׳ל/סנדרנה!');
    }
    if (data.medicalHistory.migraineWithAura || data.medicalHistory.migraineWithoutAura) {
      score += 5;
      matchReasons.push('רמה הורמונלית יציבה במדבקה מפחיתה טריגרים הורמונליים למיגרנה.');
    }
    if (data.preferences.preferredRoute === 'TRANSDERMAL_PATCH') {
      score += 10;
      matchReasons.push('תואם את העדפת המטופלת למדבקות עוריות.');
    }
    if (prefersNonHormonal) score -= 28;
    if (failed) {
      score -= 26;
      cons.push(`מדבקות נוסו בעבר והופסקו (${failed.reasonStopped || 'אי-סבילות'}).`);
    }

    const secondaryPatchProg = !needsEndometrialProtection
      ? undefined
      : useCombinedPatch
      ? isPostmenopausalOver1Year
        ? 'כלול במדבקת Evorel Conti (NETA 170 מק"ג)'
        : 'כלול בערכת Evorel Sequi'
      : blocksUtrogestan
      ? 'Duphaston 10 מ"ג פומי'
      : regimenType === 'CONTINUOUS_COMBINED'
      ? utrogestanContinuousDose
      : utrogestanSequentialDose;

    options.push({
      id: 'opt_transdermal_patch_regimen',
      category: 'HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: mhtBlocked
        ? 'CONTRAINDICATED_FOR_PATIENT'
        : patchSensitivity || highCvRisk || prefersNonHormonal
        ? 'CONDITIONAL'
        : score >= 86
        ? 'RECOMMENDED_TOP'
        : 'GOOD_ALTERNATIVE',
      titleHebrew: !needsEndometrialProtection
        ? `מדבקות אסטרדיול בלבד (${evorelDoseText})`
        : useCombinedPatch
        ? isPostmenopausalOver1Year
          ? 'מדבקה משולבת אוורל קונטי (Evorel Conti)'
          : 'מדבקה משולבת ציקלית אוורל סקווי (Evorel Sequi)'
        : `מדבקות אסטרדיול (${evorelDoseText}) + פרוגסטוגן מותאם`,
      subtitleHebrew: 'ספיגה עורית דו-שבועית יציבה ללא מעבר ראשון בכבד',
      routeLabelHebrew: 'עורי (מדבקה דו-שבועית)',
      regimenLabelHebrew: !needsEndometrialProtection
        ? 'אסטרוגן בלבד'
        : isPostmenopausalOver1Year
        ? 'משולב רציף'
        : 'משולב ציקלי',
      israeliProductsSummary: {
        primaryAgent: useCombinedPatch
          ? isPostmenopausalOver1Year
            ? 'Evorel Conti (E2 50mcg + NETA 170mcg)'
            : 'Evorel Sequi'
          : evorelDoseText,
        secondaryProgestogenOrMonitor: secondaryPatchProg,
        scheduleHebrew: 'הדבקה מתחת לקו המותניים והחלפה פעמיים בשבוע בימים קבועים'
      },
      prosHebrew: pros,
      consHebrew: mhtBlocked ? [...gate.contraindicationNotices, ...cons] : cons,
      tailoredMatchReasons: matchReasons
    });
  }

  // --- אופציה הורמונלית 4: טבליות פומיות (Femoston / Activelle / Eviana / Estrofem / Duavive) ---
  {
    const failed = findPriorFailure(data.preferences.priorFailedTreatments, ['ORAL_FEMOSTON', 'ORAL_COMBINED_NETA']);
    const oralContraindicated = mhtBlocked || routePreference === 'TRANSDERMAL_MANDATORY' || highCvRisk;
    let score = oralContraindicated ? 8 : routePreference === 'TRANSDERMAL_PREFERRED' ? 62 : 82;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'טבליה יומית פשוטה ומוכרת באריזה אחת (אפס סיכון לשכוח את מרכיב הפרוגסטוגן בכדור משולב!).',
      'דידרוגסטרון ב-Femoston בטוח באלרגיית בוטנים/סויה ובעל פרופיל מטבולי ושד נוח יותר מ-NETA.'
    ];
    const cons: string[] = [
      'מעבר ראשון בכבד: מעלה במעט סיכון ל-VTE, מעלה SHBG (עלול להפחית טסטוסטרון חופשי וחשק מיני) ומעלה TBG.'
    ];

    if (oralContraindicated && !mhtBlocked) {
      cons.unshift(
        `אסטרוגן פומי אינו מומלץ למטופלת זו בשל: ${routeRationale.join(' | ')}`
      );
    }
    if (data.preferences.preferredRoute === 'ORAL_TABLET' && !oralContraindicated) {
      score += 10;
      matchReasons.push('תואם את העדפת המטופלת לנטילה פומית יומית (בהיעדר התווית נגד לקרישה/כבד).');
    }
    if (prefersNonHormonal) score -= 28;
    if (failed) {
      score -= 25;
      cons.push(`כדור הורמונלי פומי נוסה בעבר והופסק (${failed.reasonStopped || 'תופעות לוואי'}).`);
    }

    const oralAgent = !needsEndometrialProtection
      ? estrogenDoseTier === 'LOW'
        ? 'Estrofem 1mg טבליה ביום'
        : 'Estrofem 1–2mg או Progynova 2mg טבליה ביום'
      : isPostmenopausalOver1Year
      ? estrogenDoseTier === 'LOW'
        ? 'Femoston Conti 0.5/2.5 (או Eviana 0.5/0.1)'
        : 'Femoston Conti 1/5 (או Activelle 1/0.5; או Duavive באי-סבילות לפרוגסטוגנים)'
      : isHighEstrogenTier
      ? 'Femoston 2/10 (טבליה ביום ברצף)'
      : 'Femoston 1/10 (או Novofem)';

    options.push({
      id: 'opt_oral_mht_regimen',
      category: 'HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: oralContraindicated
        ? 'CONTRAINDICATED_FOR_PATIENT'
        : routePreference === 'TRANSDERMAL_PREFERRED' || prefersNonHormonal
        ? 'CONDITIONAL'
        : 'GOOD_ALTERNATIVE',
      titleHebrew: !needsEndometrialProtection
        ? 'אסטרדיול פומי בלבד (Estrofem / Progynova)'
        : isPostmenopausalOver1Year
        ? 'טבליה משולבת רציפה פומית (Femoston Conti / Activelle / Duavive)'
        : 'טבליה משולבת ציקלית פומית (Femoston 1/10 או 2/10)',
      subtitleHebrew: oralContraindicated
        ? 'לא מומלץ למטופלת זו (נדרש מתן עורי או לא-הורמונלי)'
        : 'נוחות נטילה בכדור יומי אחד לנשים בסיכון קרישתי ומטבולי נמוך',
      routeLabelHebrew: 'פומי (כדור אחד ביום)',
      regimenLabelHebrew: !needsEndometrialProtection
        ? 'אסטרוגן בלבד'
        : isPostmenopausalOver1Year
        ? 'משולב רציף'
        : 'משולב ציקלי',
      israeliProductsSummary: {
        primaryAgent: oralAgent,
        scheduleHebrew: 'טבליה אחת ביום בשעה קבועה ללא הפסקה בין חפיסות'
      },
      prosHebrew: pros,
      consHebrew: mhtBlocked ? [...gate.contraindicationNotices, ...cons] : cons,
      tailoredMatchReasons: matchReasons,
      monitoringNotesHebrew: data.medications.takingLevothyroxine
        ? 'חובה לבדוק TSH כעבור 6–12 שבועות מתחילת אסטרוגן פומי!'
        : undefined
    });
  }

  // =========================================================================
  // אפשרויות טיפול לא-הורמונליות (תמיד מוצגות ומדורגות, ועולות למקום #1 בהתוויות נגד או בהעדפת המטופלת!)
  // =========================================================================

  // --- אופציה לא-הורמונלית 1: Veoza 45mg (Fezolinetant) ו/או Lynkuet 120mg (Elinzanetant) ---
  {
    const failed = findPriorFailure(data.preferences.priorFailedTreatments, ['VEOZA_NK3']);
    const liverBlocked = data.medicalHistory.activeLiverDiseaseOrPorphyria || data.lftStatus === 'ABNORMAL';
    let score = liverBlocked ? 10 : mhtBlocked || highCvRisk ? 94 : prefersNonHormonal ? 91 : 72;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'מנגנון נוירו-אנדוקריני ממוקד ומודרני (חסימת NK3 בהיפותלמוס) ללא כל חשיפה לאסטרוגן או פרוגסטוגן וללא סיכון VTE/דימום רחמי!',
      'תחילת השפעה מהירה מאוד (תוך שבוע אחד!) על תדירות ועוצמת גלי החום והזעות הלילה.',
      'Lynkuet 120mg (אלינזנטנט – חוסם כפול NK1/NK3) מוסיף שיפור מובהק באיכות השינה.'
    ];
    const cons: string[] = [
      'מחייב בדיקת תפקודי כבד (ALT, AST, בילירובין) לפני ההתחלה ומעקב בחודשים 1, 2, 3, 6 ו-9 (אזהרת EMA/משרד הבריאות 2025).',
      'אינו מטפל ביובש נרתיקי (GSM – יש לשלב תכשיר מקומי) ואינו מונע איבוד מסת עצם (ב-POI/אוסטיאופורוזיס נדרש מענה ייעודי לעצם).'
    ];

    if (mhtBlocked) {
      matchReasons.push('בחירה לא-הורמונלית ממוקדת ויעילה בהינתן התווית נגד ל-MHT סיסטמי.');
    }
    if (prefersNonHormonal) {
      matchReasons.push('מדורג בעדיפות עליונה בהתאם להעדפת המטופלת להימנע מהורמונים.');
    }
    if (sym.hasModerateSevereVms) {
      score += 3;
      matchReasons.push('מתאים במיוחד לגלי חום בינוניים-קשים שדווחו בשאלון הסימפטומים.');
    }
    if (data.medications.takingTamoxifen || data.medicalHistory.breastCancerHistory) {
      cons.push('במטופלות תחת טיפול אונקולוגי פעיל מומלץ תיאום אונקולוגי ובדיקת עלון היצרן העדכני.');
    }
    if (liverBlocked) {
      cons.unshift('תפקודי כבד חריגים / מחלת כבד פעילה: אין להתחיל ויוזה אם ALT/AST ≥ 2x ULN או בילירובין מוגבר!');
    }
    if (failed) {
      score -= 30;
      cons.push(`ויוזה נוסתה בעבר והופסקה (${failed.reasonStopped || 'חוסר סבילות'}).`);
    }

    options.push({
      id: 'opt_nonhormonal_nk3_veoza_lynkuet',
      category: 'NON_HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: liverBlocked
        ? 'CONTRAINDICATED_FOR_PATIENT'
        : score >= 85
        ? 'RECOMMENDED_TOP'
        : 'GOOD_ALTERNATIVE',
      titleHebrew: 'חוסם קולטן NK3 לא-הורמונלי: ויוזה (Veoza 45mg) / לינקואט (Lynkuet 120mg)',
      subtitleHebrew: 'טיפול ייעודי לא-הורמונלי במרכז ויסות החום בהיפותלמוס',
      routeLabelHebrew: 'פומי לא-הורמונלי',
      regimenLabelHebrew: 'לא-הורמונלי יומי',
      israeliProductsSummary: {
        primaryAgent: sym.hasSignificantSleepIssue
          ? 'Veoza 45mg פעם ביום (או Lynkuet 120mg בערב לשיפור כפול של גלי חום ושינה)'
          : 'Veoza (Fezolinetant) 45mg טבליה אחת ביום בשעה קבועה',
        secondaryProgestogenOrMonitor: 'ניטור LFTs (ALT/AST/Bilirubin): בסיס, חודש 1, 2, 3, 6 ו-9',
        scheduleHebrew: 'נטילה יומית קבועה ללא צורך בפרוגסטוגן'
      },
      prosHebrew: pros,
      consHebrew: cons,
      tailoredMatchReasons: matchReasons,
      monitoringNotesHebrew:
        'לבצע בדיקת ALT, AST ובילירובין בדם טרם מרשם ראשון ולוודא תקינות (<2x ULN), ולתזמן מעקב מעבדה בחודשים 1, 2, 3, 6 ו-9.'
    });
  }

  // --- אופציה לא-הורמונלית 2: SNRI / SSRI (ונלפקסין / אציטלופרם – בטוחים תחת טמוקסיפן!) ---
  {
    const failed = findPriorFailure(data.preferences.priorFailedTreatments, ['SSRI_SNRI']);
    let score = mhtBlocked || highCvRisk ? 90 : prefersNonHormonal ? 85 : 64;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'מפחית גלי חום ב-50%–60% בתוך 2–4 שבועות ומשפר במקביל חרדה, עצבנות ותנודות מצב רוח.',
      'ונלפקסין (Venlafaxine) ואציטלופרם (Cipralex) בטוחים לחלוטין בשילוב עם טמוקסיפן (אינם מעכבים CYP2D6!).',
      'זמינים בסל הבריאות בעלות נמוכה וללא צורך בניטור כבדי חודשי.'
    ];
    const cons: string[] = [
      'יתכנו בחילה קלה בשבוע הראשון, יובש בפה או פגיעה בחשק המיני/אורגזמה.',
      'בוונלפקסין יש לעקוב אחר לחץ דם ולהימנע מהפסקה פתאומית.'
    ];

    if (data.medications.takingTamoxifen || data.medications.takingAromataseInhibitors || data.medicalHistory.breastCancerHistory) {
      score += 6;
      matchReasons.push('קו ראשון מבוסס ובטוח אונקולוגית בסרטן שד ונטילת טמוקסיפן (איסור על Paroxetine/Fluoxetine!).');
    }
    if (sym.hasSignificantMoodOrFog) {
      score += 4;
      matchReasons.push('נותן מענה כפול לגלי החום ולתסמיני החרדה/מצב הרוח שדווחו.');
    }
    if (data.medicalHistory.hypertensionStatus === 'UNCONTROLLED') {
      cons.push('בל"ד לא מאוזן העדיפי אציטלופרם (Cipralex 10mg) על פני ונלפקסין.');
    }
    if (failed) {
      score -= 28;
      cons.push(`SSRI/SNRI נוסו בעבר והופסקו (${failed.reasonStopped || 'תופעות לוואי'}).`);
    }

    options.push({
      id: 'opt_nonhormonal_snri_ssri',
      category: 'NON_HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: score >= 85 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
      titleHebrew:
        data.medicalHistory.hypertensionStatus === 'UNCONTROLLED'
          ? 'אציטלופרם (Cipralex 10–20mg) – SSRI לא-הורמונלי'
          : 'ונלפקסין XR (37.5–75 מ"ג) או אציטלופרם (10–20 מ"ג)',
      subtitleHebrew: 'טיפול לא-הורמונלי מוכח לגלי חום ותסמיני מצב רוח/חרדה (בטוח עם טמוקסיפן)',
      routeLabelHebrew: 'פומי לא-הורמונלי',
      regimenLabelHebrew: 'לא-הורמונלי יומי',
      israeliProductsSummary: {
        primaryAgent:
          data.medicalHistory.hypertensionStatus === 'UNCONTROLLED'
            ? 'Escitalopram (Cipralex) 10mg בבוקר'
            : 'Venlafaxine XR 37.5mg ליום לשבוע ראשון ואז 75mg (או Escitalopram 10mg)',
        secondaryProgestogenOrMonitor: data.medications.takingTamoxifen
          ? 'אזהרה: לעולם לא להחליף ל-Paroxetine או Fluoxetine תחת טמוקסיפן!'
          : undefined,
        scheduleHebrew: 'נטילה יומית קבועה; השפעה על גלי חום מורגשת תוך 2–4 שבועות'
      },
      prosHebrew: pros,
      consHebrew: cons,
      tailoredMatchReasons: matchReasons
    });
  }

  // --- אופציה לא-הורמונלית 3: גאבאפנטין (לילה) / אוקסיבוטינין / CBT-MENOS ---
  {
    let score = mhtBlocked || highCvRisk ? 82 : prefersNonHormonal ? 80 : 58;
    const matchReasons: string[] = [];
    if (sym.hasSignificantSleepIssue) {
      score += 6;
      matchReasons.push('גאבאפנטין בנטילת לילה יעיל במיוחד להזעות לילה ויקיצות מרובות.');
    }
    const urinary14 = data.symptoms['14']?.severity || 0;
    if (urinary14 >= 2 && data.age < 65) {
      score += 4;
      matchReasons.push('אוקסיבוטינין נותן מענה משולב להזעות יתר ולדחיפות/תכיפות במתן שתן.');
    }

    options.push({
      id: 'opt_nonhormonal_gabapentin_oxy_cbt',
      category: 'NON_HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: score >= 84 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
      titleHebrew: 'גאבאפנטין לילי (300–900 מ"ג) / אוקסיבוטינין + פרוטוקול CBT-MENOS',
      subtitleHebrew: 'חלופות לא-הורמונליות להזעות לילה, שינה, הזעת יתר וויסות קוגניטיבי-התנהגותי',
      routeLabelHebrew: 'פומי לא-הורמונלי + התנהגותי',
      regimenLabelHebrew: 'מותאם תסמין מוביל',
      israeliProductsSummary: {
        primaryAgent:
          urinary14 >= 2 && data.age < 65
            ? 'Gabapentin 300mg לפני השינה (טיטרציה עד 900mg) או Oxybutynin 2.5–5mg + CBT-MENOS'
            : 'Gabapentin 300mg לפני השינה (טיטרציה עד 600–900mg) + פרוטוקול CBT-MENOS והיפנוזה קלינית',
        scheduleHebrew: 'נטילת ערב לפני השינה + 4–6 מפגשי CBT ממוקד גיל המעבר'
      },
      prosHebrew: [
        'בטוח לחלוטין במטופלות סרטן שד (ללא אינטראקציות CYP2D6 עם טמוקסיפן) ובסיכון פקקתי.',
        'גאבאפנטין משפר שינה רציפה וכאבים נוירופתיים/שריריים; CBT-MENOS מפחית ב-50% את מצוקת גלי החום ללא תופעות לוואי.'
      ],
      consHebrew: [
        'גאבאפנטין עלול לגרום לנמנום/סחרחורת בבוקר; באוקסיבוטינין יובש בפה ולהימנע בגיל המבוגר.'
      ],
      tailoredMatchReasons: matchReasons
    });
  }

  // מיון מהציון הגבוה לנמוך כך שהאופציות המתאימות ביותר למטופלת תופענה ראשונות!
  options.sort((a, b) => b.rankScore - a.rankScore);

  // =========================================================================
  // תוספות מקומיות וממוקדות: GSM (יובש/שתן) ו-HSDD (טסטוסטרון לחשק מיני)
  // =========================================================================
  const localAndAdjunctOptions: LocalOrAdjunctOption[] = [];

  const onAiOrBreastCa = data.medications.takingAromataseInhibitors || data.medicalHistory.breastCancerHistory;
  localAndAdjunctOptions.push({
    id: 'local_gsm_vaginal_estrogen',
    domain: 'GSM_VAGINAL',
    recommended: sym.hasSignificantGsm && !onAiOrBreastCa,
    titleHebrew: 'אסטרוגן נרתיקי מקומי (Vagifem 10mcg / Ovestin / Imvaggis 0.03mg)',
    brandAndDoseHebrew: 'טבליות וגיפם 10 מק"ג / קרם או פתילות אובסטין / פתילות אימווגיס 0.03 מ"ג (אולטרה-נמוך)',
    scheduleHebrew: 'פעם ביום למשך שבועיים (העמסה), ואז פעמיים בשבוע בקביעות לטווח ארוך (ניתן לשלב גם במקביל ל-MHT סיסטמי!)',
    prosHebrew: [
      'מטפל ביעילות גבוהה ביובש נרתיקי, כאבים ביחסים, דחיפות במתן שתן ומונע דלקות שתן חוזרות.',
      'ספיגה סיסטמית זניחה – אינו דורש תוספת פרוגסטוגן וניתן לשימוש בכל גיל (כולל מעל 60 ובסיכון VTE).'
    ],
    cautionsHebrew: onAiOrBreastCa
      ? [
          'בסרטן שד / מעכבי ארומטאז: יש להתחיל בתכשירי לחות לא-הורמונליים; אם כשלו – לשקול Imvaggis 0.03mg או וגיפם בתיאום מתועד עם האונקולוג/ית.'
        ]
      : ['יש להדריך שהפסקת הטיפול תוביל לחזרת היובש (זהו טיפול אחזקה מתמשך ובטוח).']
  });

  localAndAdjunctOptions.push({
    id: 'local_gsm_moisturizer_prasterone',
    domain: 'GSM_VAGINAL',
    recommended: sym.hasSignificantGsm && onAiOrBreastCa,
    titleHebrew: onAiOrBreastCa
      ? 'תכשירי לחות נרתיקיים לא-הורמונליים + חומצה היאלורונית וחומר סיכה'
      : 'אינטררוזה (Prasterone / DHEA 6.5mg) או תכשירי לחות נרתיקיים',
    brandAndDoseHebrew: onAiOrBreastCa
      ? 'Replens / Gynomunal (2–3 פעמים בשבוע) + מסכך על בסיס מים/סיליקון ביחסים'
      : 'Intrarosa 6.5mg פתילה נרתיקית לילית או תכשירי לחות לא-הורמונליים',
    scheduleHebrew: onAiOrBreastCa ? '2–3 פעמים בשבוע בקביעות + לפני מגע מיני' : 'פתילה כל ערב (Intrarosa) או 2–3 פעמים בשבוע (לחות)',
    prosHebrew: [
      onAiOrBreastCa
        ? 'נטול הורמונים ב-100% ובטוח לחלוטין תחת טמוקסיפן ומעכבי ארומטאז.'
        : 'אינטררוזה משפרת גם דיספראוניה וגם עוררות/תחושה מקומית הודות להמרה תוך-תאית מקומית ללא עלייה ברמות בדם.'
    ],
    cautionsHebrew: onAiOrBreastCa ? [] : ['אינטררוזה נמנעת כקו ראשון בסרטן שד פעיל ללא אישור אונקולוגי.']
  });

  localAndAdjunctOptions.push({
    id: 'adjunct_testosterone_hsdd',
    domain: 'HSDD_TESTOSTERONE',
    recommended: sym.hasSignificantHsdd && !mhtBlocked,
    titleHebrew: 'שקילת טסטוסטרון עורי במינון נשי (ל-HSDD – ירידה בתשוקה הגורמת מצוקה)',
    brandAndDoseHebrew: 'ג׳ל טסטוסטרון 1% (למשל AndroGel במינון נשי Off-label: ~5 מ"ג/יום = טיפה בגודל אפונה; שקית 50 מ"ג ל-8–10 ימים)',
    scheduleHebrew: 'מריחה יומית על הירך החיצונית/שוק לאחר איזון אסטרוגן (עורי!) וטיפול ביובש נרתיקי',
    prosHebrew: [
      'משפר תשוקה מינית, עוררות ושביעות רצון בפוסט-מנופאוזה או לאחר BSO/RRSO (הקונצנזוס הבינלאומי ו-BMS).'
    ],
    cautionsHebrew: [
      'חובה לבדוק Total Testosterone לפני ההתחלה, כעבור 3–6 שבועות וכל 6–12 חודשים לשמירה בטווח הנשי הפיזיולוגי (ניסיון של 3–6 חודשים).'
    ]
  });

  // דף תיאום ציפיות למטופלת
  const patientExpectationPoints: string[] = [
    'ציר זמן לשיפור: הקלה ראשונית בגלי חום ושינה מתחילה תוך 2–4 שבועות, והשפעה מלאה נבחנת בביקור מעקב כעבור 3 חודשים.',
    'התאמה אישית מדורגת: במידה שנותרים תסמינים חשובים או מופיעות תופעות לוואי (כגון רגישות בשדיים או נפיחות חולפת בחודשים הראשונים), ניתן לדייק מינון או להחליף תכשיר בביקור המעקב.',
    needsEndometrialProtection && !mhtBlocked
      ? 'דימומים תחת טיפול הורמונלי: הכתמות קלות שכיחות ב-3–6 החודשים הראשונים לטיפול רציף; יש לדווח בביקור המעקב או לפנות מוקדם יותר אם מופיע דימום כבד, ממושך או חדש לאחר חצי שנה.'
      : 'ניטור בטיחות: יש להקפיד על בדיקות המעקב שהומלצו (כגון ממוגרפיה לפי גיל, ל"ד, או תפקודי כבד תחת ויוזה בחודשים 1, 2, 3, 6 ו-9).',
    contraceptionEval.needsContraception
      ? `תזכורת חשובה: טיפול הורמונלי לגיל המעבר (HRT) אינו מונע הריון! ${contraceptionEval.contraceptionRuleHebrew}`
      : 'אורח חיים תומך: אימוני התנגדות ונושאי משקל פעמיים-שלוש בשבוע, תזונה ים-תיכונית עשירה בחלבון וסידן, ותוסף ויטמין D שומרים על העצם, השריר והלב.',
    boneRisk.riskTier !== 'LOW' ? boneRisk.guidanceHebrew : ''
  ].filter(Boolean);

  const topOption = options[0];
  const emrSummaryText = [
    `סיכום ייעוץ גיל המעבר – ${data.fullName || 'מטופלת'} (גיל ${data.age})`,
    `שלב STRAW+10: ${straw.hebrewName} (${straw.code})`,
    `ציון חומרה IMS: ${sym.totalSeverityScore}/76 (${sym.activeSymptomCount} תסמינים פעילים)`,
    prevent.hasCompleteLabInputs
      ? `סיכון קרדיו-וסקולרי AHA PREVENT: 10y Total CVD ${prevent.risk10YearTotalCvd}% | ASCVD ${prevent.risk10YearAscvd}%${
          prevent.risk30YearTotalCvd ? ` | 30y Total CVD ${prevent.risk30YearTotalCvd}%` : ''
        }`
      : '',
    `משטר וציר מומלצים: ${regimenHebrewTitle} | אופציה מדורגת #1: ${topOption?.titleHebrew || ''}`
  ]
    .filter(Boolean)
    .join('\n');

  return {
    regimenType,
    regimenHebrewTitle,
    estrogenDoseTier,
    estrogenDoseTierReasonHebrew,
    routePreference,
    routeRationale,
    rankedOptions: options,
    localAndAdjunctOptions,
    patientExpectationPoints,
    followUpIntervalMonths: 3,
    emrSummaryText
  };
}
