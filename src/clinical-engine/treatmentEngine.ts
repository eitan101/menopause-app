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
  LocalGsmOption,
  PriorFailedTreatment,
  RegimenType,
  RoutePreference,
  Stage1Data,
  Stage2Recommendations,
  TestosteroneHsddOption,
  TreatmentOptionCard
} from './types';

function findPriorFailure(
  list: PriorFailedTreatment[],
  keys: PriorFailedTreatment['treatmentKey'][]
): PriorFailedTreatment | undefined {
  return list.find((item) => keys.includes(item.treatmentKey));
}

function clampScore(n: number): number {
  return Math.max(10, Math.min(99, Math.round(n)));
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

  const excludedReasonsAudit: string[] = [];

  // 1. קביעת מדרגת מינון האסטרוגן ומינון הפרוגסטוגן הפרופורציונלי (BMS 2024 / Red Whale / Dr. Shaklai)
  let estrogenDoseTier: EstrogenDoseTier = 'STANDARD';
  let estrogenDoseTierReasonHebrew =
    'גיל מעבר טיפוסי (45–59): התחלה במינון תקני-נמוך וטיטרציה לפי תגובה קלינית לאחר 8–12 שבועות.';

  if (
    straw.stage === 'POI' ||
    straw.stage === 'EARLY_MENOPAUSE' ||
    (straw.stage === 'SURGICAL_MENOPAUSE' && data.age > 0 && data.age < 45)
  ) {
    estrogenDoseTier = 'MODERATE_HIGH_PHYSIOLOGIC';
    estrogenDoseTierReasonHebrew =
      'POI / מנופאוזה מוקדמת או כירורגית מתחת לגיל 45: נדרש מינון אסטרדיול פיזיולוגי גבוה יותר (למשל Estrogel 2–4 לחיצות או Evorel 75–100) להגנה על העצם, העורקים והמוח – עם הכפלה פרופורציונלית של הפרוגסטוגן ברחם שמור!';
  } else if (data.age >= 60 || data.monthsSinceLastPeriod >= 120) {
    estrogenDoseTier = 'LOW';
    estrogenDoseTierReasonHebrew =
      'גיל ≥60 או מעל 10 שנים מהווסת האחרונה: העדפה לקו ראשון לא-הורמונלי או אסטרדיול עורי במינון נמוך/אולטרה-נמוך בלבד בהחלטה משותפת.';
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

  // 2. קביעת סוג המשטר הרחמי
  const needsEndometrialProtection =
    !data.hadHysterectomy || data.medicalHistory.hadEndometriosis || Boolean(data.cervixConserved);
  const isPostmenopausalOver1Year =
    data.cyclePattern === 'AMENORRHEA_OVER_12_MONTHS' || data.monthsSinceLastPeriod >= 12 || data.hadBsoOrRrso;

  let regimenType: RegimenType = 'CONTINUOUS_COMBINED';
  let regimenHebrewTitle = '';

  if (gate.systemicMhtContraindicated || prevent.mhtTrafficLight === 'RED') {
    regimenType = 'NON_HORMONAL_PRIMARY';
    regimenHebrewTitle =
      gate.systemicMhtContraindicated
        ? 'מסלול לא-הורמונלי מותאם אישית + טיפול מקומי ל-GSM (תכשירים הורמונליים סיסטמיים סוננו בשל התווית נגד)'
        : 'מסלול לא-הורמונלי מועדף + איזון קרדיו-מטבולי (תכשירים הורמונליים סוננו בשל סיכון PREVENT גבוה)';
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

  // 3. קביעת ציר המתן וסינון צירים פסולים
  const routeRationale: string[] = [];
  let mandatoryTransdermal = false;
  let preferTransdermal = false;

  if (vte.mandatoryTransdermal) {
    mandatoryTransdermal = true;
    routeRationale.push(`סיכון קרישתי/VTE (${vte.factors.join(', ')}) – מתן פומי נפסל, מוצג מתן עורי בלבד.`);
  }
  if (data.bmi >= 30) {
    mandatoryTransdermal = true;
    routeRationale.push(`BMI ≥ 30 (${data.bmi}) – מתן פומי נפסל למניעת הכפלת סיכון פקקתי.`);
  }
  if (data.medicalHistory.migraineWithAura) {
    mandatoryTransdermal = true;
    routeRationale.push('מיגרנה עם אאורה – אסטרוגן פומי נפסל; מוצגים תכשירים עוריים יציבים בלבד.');
  } else if (data.medicalHistory.migraineWithoutAura) {
    preferTransdermal = true;
    routeRationale.push('מיגרנה ללא אאורה – מתן עורי מועדף לשמירה על רמות אסטרדיול יציבות.');
  }
  if (data.medicalHistory.hypertriglyceridemiaOver200) {
    mandatoryTransdermal = true;
    routeRationale.push('היפרטריגליצרידמיה (TG ≥ 200 mg/dL) – מתן פומי נפסל (סכנת פנקראטיטיס); עורי בלבד.');
  }
  if (data.medicalHistory.fattyLiverOrGallstones) {
    mandatoryTransdermal = true;
    routeRationale.push('כבד שומני (MASLD) או אבני מרה – אסטרוגן פומי נפסל; מתן עורי בלבד.');
  }
  if (data.medicalHistory.malabsorptionOrBariatricSurgery) {
    mandatoryTransdermal = true;
    routeRationale.push('ניתוח בריאטרי / תת-ספיגה – מתן פומי נפסל; מתן עורי בלבד.');
  }
  if (interactions.some((i) => i.forcesTransdermalEstrogen)) {
    mandatoryTransdermal = true;
    routeRationale.push(
      `אינטראקציה תרופתית (${interactions
        .filter((i) => i.forcesTransdermalEstrogen)
        .map((i) => i.drugName)
        .join(', ')}) הפוסלת אסטרוגן פומי.`
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
    if (
      data.age >= 60 ||
      prevent.mhtTrafficLight === 'POST_EVENT' ||
      data.medicalHistory.diabetesStatus === 'DIABETES' ||
      data.medicalHistory.hypertensionStatus === 'UNCONTROLLED'
    ) {
      mandatoryTransdermal = true;
    }
    preferTransdermal = true;
    routeRationale.push(
      'פרופיל קרדיו-מטבולי / גיל / עישון / PREVENT: העדפה חד-משמעית למתן עורי של 17β-Estradiol.'
    );
  }
  if (data.medications.takingLevothyroxine) {
    preferTransdermal = true;
    routeRationale.push('נטילת לבותירוקסין: מתן עורי מועדף כי אינו מעלה TBG.');
  }
  if (sym.hasSignificantHsdd) {
    preferTransdermal = true;
    routeRationale.push('ירידה בחשק המיני (HSDD): אסטרוגן עורי אינו מעלה SHBG ואינו מפחית טסטוסטרון חופשי.');
  }

  let routePreference: RoutePreference = 'ORAL_OR_TRANSDERMAL';
  if (gate.systemicMhtContraindicated || prevent.mhtTrafficLight === 'RED') {
    routePreference = 'NON_HORMONAL_ONLY';
    excludedReasonsAudit.push('כלל התכשירים ההורמונליים הסיסטמיים סוננו עקב התווית נגד או סיכון PREVENT גבוה.');
  } else if (mandatoryTransdermal) {
    routePreference = 'TRANSDERMAL_MANDATORY';
    excludedReasonsAudit.push('תכשירי אסטרוגן פומיים סוננו אוטומטית עקב חובת מתן עורי בפרופיל המטופלת.');
  } else if (preferTransdermal) {
    routePreference = 'TRANSDERMAL_PREFERRED';
  } else {
    routeRationale.push(
      'אישה מתחת לגיל 60 ללא גורמי סיכון פקקתיים, מטבוליים או אינטראקציות – ניתן לבחור מתן עורי או פומי.'
    );
  }

  const utrogestanFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['UTROGESTAN_ORAL']);
  const blocksUtrogestan = data.medicalHistory.peanutOrSoyAllergy || Boolean(utrogestanFailed);
  if (blocksUtrogestan) {
    excludedReasonsAudit.push(
      data.medicalHistory.peanutOrSoyAllergy
        ? 'Utrogestan סונן עקב אלרגיה לבוטנים/סויה – הוחלף אוטומטית ב-Duphaston / מירנה.'
        : `Utrogestan סונן עקב אי-סבילות בטיפול עבר (${utrogestanFailed?.reasonStopped}) – הוחלף ב-Duphaston / מירנה.`
    );
  }

  const patchDisqualified =
    data.medicalHistory.patchAdhesiveSensitivity ||
    Boolean(findPriorFailure(data.preferences.priorFailedTreatments, ['EVOREL_PATCH']));
  if (patchDisqualified) {
    excludedReasonsAudit.push('מדבקות עוריות (Evorel) סוננו עקב רגישות לדבק מדבקות או כישלון טיפול קודם.');
  }

  const gelFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['ESTROGEL_SANDRENA']);
  const mirenaFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['MIRENA_IUS']);
  const oralFemostonFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['ORAL_FEMOSTON']);
  const oralNetaFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['ORAL_COMBINED_NETA']);
  const veozaFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['VEOZA_NK3']);
  const ssriFailed = findPriorFailure(data.preferences.priorFailedTreatments, ['SSRI_SNRI']);

  const prefersNonHormonal = data.preferences.hormoneAttitude === 'PREFERS_NON_HORMONAL';
  const prefersBodyIdentical = data.preferences.hormoneAttitude === 'PREFERS_BODY_IDENTICAL';
  const mhtBlocked = gate.systemicMhtContraindicated || prevent.mhtTrafficLight === 'RED';
  const meningiomaBlocksProgestogen = data.medicalHistory.meningiomaHistory && needsEndometrialProtection;

  const options: TreatmentOptionCard[] = [];

  // =========================================================================
  // בניית אופציות הורמונליות סיסטמיות מתאימות בלבד (ללא הצגת תרופות שנפסלו!)
  // =========================================================================
  if (!mhtBlocked && !meningiomaBlocksProgestogen) {
    // --- אופציה הורמונלית 1: ג'ל אסטרדיול עורי (Estrogel / Sandrena) ---
    if (!gelFailed) {
      let score = data.age >= 60 ? 74 : 93;
      const matchReasons: string[] = [];
      const pros: string[] = [
        'פרופיל הבטיחות הגבוה ביותר: עוקף מעבר ראשון בכבד ולכן ללא עלייה בסיכון ל-VTE או שבץ.',
        'גמישות קלה ומדויקת בטיטרציית מינון יומית וללא גירוי עורי מדבק מדבקות.'
      ];
      const cons: string[] = [
        'דורש מריחה יומית והמתנה של 5 דקות לייבוש (ו-60 דקות ממגע עור-בעור באזור המריחה).'
      ];

      let progestogenText: string | undefined;
      const patientSteps: string[] = [
        `מרחי ${estrogelDoseText} של ג׳ל אסטרוג׳ל על עור נקי ויבש בזרוע החיצונית או בירך הפנימית (אין למרוח על השדיים!), והמתיני 5 דקות לייבוש לפני לבוש.`
      ];

      if (needsEndometrialProtection) {
        if (blocksUtrogestan) {
          progestogenText =
            regimenType === 'CONTINUOUS_COMBINED'
              ? 'Duphaston (דידרוגסטרון) 10 מ"ג טבליה ביום ברצף'
              : 'Duphaston 10 מ"ג טבליה ביום למשך 14 ימים בכל חודש';
          matchReasons.push('הותאם עם דופסטון (ללא אוטרוגסטן שנפסל עבור המטופלת).');
          patientSteps.push(`הגנה על רירית הרחם: טלי ${progestogenText} בקביעות (אין להפסיק את הכדור כל עוד נמרח הג׳ל!).`);
        } else if (data.medications.takingGlp1) {
          // תחת GLP-1 פרוגסטוגן פומי פחות אמין – נוריד ניקוד מול מירנה/מדבקה ונוסיף הוראת 4 שבועות מפורשת
          score -= 16;
          progestogenText =
            regimenType === 'CONTINUOUS_COMBINED' ? utrogestanContinuousDose : utrogestanSequentialDose;
          cons.push('תחת זריקות GLP-1 ספיגת כדור פרוגסטרון פומי עלולה להיפגע – מומלץ להעדיף התקן מירנה או מדבקה משולבת!');
          patientSteps.push(
            `הגנת רירית הרחם: טלי ${progestogenText} לפני השינה על קיבה ריקה (בכל עליית מינון ב-GLP-1 יש לעדכן רופא/ה לצורך תגבור הגנה ל-4 שבועות).`
          );
        } else {
          progestogenText =
            regimenType === 'CONTINUOUS_COMBINED' ? utrogestanContinuousDose : utrogestanSequentialDose;
          pros.push('אוטרוגסטן בנטילת ערב משפר הירדמות ושינה רציפה ובעל הפרופיל הבטוח ביותר לשד.');
          cons.push('שני תכשירים נפרדים – חובה להקפיד על נטילת הפרוגסטרון להגנת רירית הרחם.');
          patientSteps.push(`הגנה על רירית הרחם ושינה: טלי ${progestogenText} על קיבה ריקה סמוך לשינה.`);
        }
      } else {
        pros.push('לאחר כריתת רחם: אסטרוגן בלבד ללא צורך בפרוגסטוגן וללא עלייה בסיכון לסרטן שד.');
      }

      if (sym.hasSignificantSleepIssue && !blocksUtrogestan && needsEndometrialProtection) {
        score += 4;
        matchReasons.push('נותן מענה ישיר להפרעות השינה שדורגו בחשיבות גבוהה.');
      }
      if (patchDisqualified) {
        score += 5;
        matchReasons.push('פתרון עורי אידיאלי ללא חשיפה לדבק מדבקות.');
      }
      if (prefersBodyIdentical) {
        score += 4;
        matchReasons.push('תואם העדפת המטופלת להורמונים זהים-ביולוגית.');
      }
      if (data.preferences.preferredRoute === 'TRANSDERMAL_GEL') {
        score += 8;
        matchReasons.push('תואם העדפת המטופלת למריחת ג׳ל.');
      }
      if (prefersNonHormonal) score -= 26;

      options.push({
        id: 'opt_transdermal_gel_body_identical',
        category: 'HORMONAL_SYSTEMIC',
        rankScore: clampScore(score),
        suitabilityBadge: prefersNonHormonal ? 'CONDITIONAL' : score >= 85 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
        titleHebrew: needsEndometrialProtection
          ? blocksUtrogestan
            ? 'ג׳ל אסטרדיול עורי (Estrogel / Sandrena) + דופסטון פומי'
            : 'ג׳ל אסטרדיול עורי (Estrogel / Sandrena) + אוטרוגסטן מיקרוני'
          : 'ג׳ל אסטרדיול עורי בלבד (Estrogel / Sandrena)',
        subtitleHebrew: 'בטיחות ווסקולרית ומטבולית מרבית עם גמישות במינון',
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
        consHebrew: cons,
        tailoredMatchReasons: matchReasons,
        patientHowToTakeHebrew: patientSteps,
        monitoringNotesHebrew:
          'מעקב קליני בעוד 3 חודשים; בתת-תגובה תחת ג׳ל יש לבדוק טכניקת מריחה ורמת Estradiol בדם.'
      });
    } else {
      excludedReasonsAudit.push(`ג׳ל אסטרדיול (Estrogel/Sandrena) סונן עקב ניסיון עבר שהופסק (${gelFailed.reasonStopped}).`);
    }

    // --- אופציה הורמונלית 2: התקן מירנה 52 מ"ג + אסטרדיול עורי ---
    if (needsEndometrialProtection && !mirenaFailed) {
      let score = data.age >= 60 ? 70 : 88;
      const matchReasons: string[] = [];
      const pros: string[] = [
        'הגנה מקומית ישירה ואמינה ביותר על רירית הרחם ל-5 שנים ללא תלות בספיגה במעי, ב-GLP-1 או באנזימי כבד!',
        'משמש בו-זמנית כאמצעי מניעה יעיל ומפחית ב-90% דימומים ווסתיים כבדים (HMB) ואנמיה.',
        'מכסה כל מדרגת מינון של אסטרדיול עורי (כולל מינונים גבוהים ב-POI/מנופאוזה מוקדמת).'
      ];
      const cons: string[] = [
        'דורש פעולת התקנה/החלפה אצל גינקולוג/ית; יתכנו הכתמות בחודשים הראשונים להתקנה.',
        'תוקף להגנת הרירית ב-MHT הוא 5 שנים בלבד ממועד ההתקנה.'
      ];

      const primaryTransdermalForMirena = !gelFailed
        ? `Estrogel (${estrogelDoseText})`
        : !patchDisqualified
        ? evorelDoseText
        : 'אסטרדיול עורי מותאם';

      const patientSteps: string[] = [];
      if (data.contraception.currentMethod === 'MIRENA_52MG' && contraceptionEval.mirenaValidForMhtEndometrium) {
        score += 11;
        matchReasons.push('למטופלת כבר קיים התקן מירנה תקף (≤5 שנים) – ניתן להוסיף אסטרדיול עורי מיד!');
        patientSteps.push('התקן המירנה הקיים שלך בתוקף ומספק הגנה מלאה לרירית הרחם (יש להחליפו בתום 5 שנים ממועד ההתקנה).');
      } else if (data.contraception.currentMethod === 'MIRENA_52MG' && !contraceptionEval.mirenaValidForMhtEndometrium) {
        score += 9;
        matchReasons.push('החלפת המירנה שפגה תוקף (>5 שנים) תשיב מיד שליטה בדימומים והגנת רירית מלאה!');
        patientSteps.push('יש לתאם החלפת התקן המירנה הקיים (שחלפו מעל 5 שנים מהתקנתו) אצל רופא/ת נשים טרם/במקביל לאסטרדיול.');
      } else {
        patientSteps.push('יש לתאם התקנת התקן תוך-רחמי מירנה 52 מ"ג אצל רופא/ת נשים (בתוקף ל-5 שנים עבור הטיפול ההורמונלי).');
      }
      patientSteps.push(`שילוב אסטרוגן עורי יומי/דו-שבועי: ${primaryTransdermalForMirena}.`);

      if (contraceptionEval.needsContraception) {
        score += 8;
        matchReasons.push('נותן מענה מלא גם לצורך הפעיל במניעת הריון בפרי-מנופאוזה.');
      }
      if (data.bleedingIntensity === 'HEAVY' || data.cbcStatus === 'ANEMIA' || data.medicalHistory.hasFibroidsOrAdenomyosis) {
        score += 8;
        matchReasons.push('בחירת הזהב לדימום ווסתי כבד / שרירנים / אנמיה.');
      }
      if (data.medications.takingGlp1 || data.medications.takingEnzymeInducers || data.medicalHistory.malabsorptionOrBariatricSurgery) {
        score += 10;
        matchReasons.push('עוקף לחלוטין בעיית ספיגה של פרוגסטוגן פומי תחת GLP-1 / משרני אנזימים / בריאטריה!');
      }
      if (endoRisk.riskTier === 'HIGH') {
        score += 6;
        matchReasons.push('הגנה מרבית בסיכון אנדומטריאלי מוגבר (BMI גבוה / PCOS / סוכרת).');
      }
      if (data.preferences.preferredRoute === 'MIRENA_BASED') {
        score += 9;
        matchReasons.push('תואם את העדפת המטופלת למשטר מבוסס מירנה.');
      }
      if (prefersNonHormonal) score -= 26;

      options.push({
        id: 'opt_mirena_plus_transdermal_e2',
        category: 'HORMONAL_SYSTEMIC',
        rankScore: clampScore(score),
        suitabilityBadge: prefersNonHormonal ? 'CONDITIONAL' : score >= 88 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
        titleHebrew:
          data.contraception.currentMethod === 'MIRENA_52MG' && !contraceptionEval.mirenaValidForMhtEndometrium
            ? 'החלפת מירנה פגת-תוקף למירנה 52 מ"ג חדשה + אסטרדיול עורי'
            : 'התקן מירנה 52 מ"ג + אסטרדיול עורי (Estrogel / Evorel)',
        subtitleHebrew: 'הגנת רירית מקומית מלאה ל-5 שנים + מניעת הריון + אסטרדיול עורי בטוח',
        routeLabelHebrew: 'תוך-רחמי + עורי',
        regimenLabelHebrew: 'משולב רציף (ללא דמם גמילה)',
        israeliProductsSummary: {
          primaryAgent: primaryTransdermalForMirena,
          secondaryProgestogenOrMonitor: 'Mirena 52mg IUS (בתוקף ל-5 שנים עבור MHT)',
          scheduleHebrew: 'מירנה ברחם (החלפה כל 5 שנים) + אסטרדיול עורי רציף'
        },
        prosHebrew: pros,
        consHebrew: cons,
        tailoredMatchReasons: matchReasons,
        patientHowToTakeHebrew: patientSteps,
        monitoringNotesHebrew: 'לתעד בתיק תאריך התקנת המירנה ומועד החלפה בעוד 5 שנים.'
      });
    } else if (mirenaFailed) {
      excludedReasonsAudit.push(`התקן מירנה סונן עקב ניסיון עבר שהופסק (${mirenaFailed.reasonStopped}).`);
    }

    // --- אופציה הורמונלית 3: מדבקות אסטרדיול עוריות (רק אם אין רגישות לדבק ולא נכשלו בעבר!) ---
    if (!patchDisqualified) {
      let score = data.age >= 60 ? 72 : 89;
      const matchReasons: string[] = [];
      const useCombinedPatch =
        needsEndometrialProtection &&
        (blocksUtrogestan || data.medications.takingGlp1) &&
        estrogenDoseTier === 'STANDARD';

      const pros: string[] = [
        'החלפה פעמיים בשבוע בלבד (נוחות גבוהה ללא צורך במריחה יומית).',
        'שחרור אסטרדיול אחיד ויציב לאורך היממה – מפחית תנודות הורמונליות ומיגרנות, ללא סיכון VTE.'
      ];
      if (useCombinedPatch) {
        pros.push('מדבקה משולבת (Evorel Conti / Sequi) מספקת גם פרוגסטין דרך העור – עוקפת בעיית ספיגה תחת GLP-1 וללא סויה/בוטנים!');
      }
      const cons: string[] = ['יש להדביק על עור יבש מתחת לקו המותניים ולהחליף צד בכל החלפה למניעת גירוי עורי.'];

      if (data.medicalHistory.migraineWithAura || data.medicalHistory.migraineWithoutAura) {
        score += 5;
        matchReasons.push('רמת אסטרדיול יציבה במדבקה מפחיתה טריגרים הורמונליים למיגרנה.');
      }
      if (data.preferences.preferredRoute === 'TRANSDERMAL_PATCH') {
        score += 9;
        matchReasons.push('תואם את העדפת המטופלת למדבקה דו-שבועית.');
      }
      if (prefersNonHormonal) score -= 26;

      const secondaryPatchProg = !needsEndometrialProtection
        ? undefined
        : useCombinedPatch
        ? isPostmenopausalOver1Year
          ? 'כלול במדבקת Evorel Conti (NETA 170 מק"ג)'
          : 'כלול בערכת Evorel Sequi'
        : blocksUtrogestan
        ? isPostmenopausalOver1Year
          ? 'Duphaston 10 מ"ג טבליה ביום ברצף'
          : 'Duphaston 10 מ"ג ליום למשך 14 ימים בחודש'
        : regimenType === 'CONTINUOUS_COMBINED'
        ? utrogestanContinuousDose
        : utrogestanSequentialDose;

      const patchSteps: string[] = [
        `הדביקי מדבקה אחת מתחת לקו המותניים (ישבן או ירך עליונה – לעולם לא על או ליד השדיים!) על עור נקי, יבש וללא קרם גוף, והחליפי פעמיים בשבוע בימים קבועים (למשל ראשון ורביעי).`
      ];
      if (secondaryPatchProg && !useCombinedPatch) {
        patchSteps.push(`הגנת רירית הרחם: טלי במקביל ${secondaryPatchProg}.`);
      }

      options.push({
        id: 'opt_transdermal_patch_regimen',
        category: 'HORMONAL_SYSTEMIC',
        rankScore: clampScore(score),
        suitabilityBadge: prefersNonHormonal ? 'CONDITIONAL' : score >= 86 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
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
        consHebrew: cons,
        tailoredMatchReasons: matchReasons,
        patientHowToTakeHebrew: patchSteps
      });
    }

    // --- אופציה הורמונלית 4: טבליות פומיות (מוצגת אך ורק אם מתן פומי מותר ולא נפסל!) ---
    const allOralFailed = Boolean(oralFemostonFailed && oralNetaFailed && needsEndometrialProtection);
    if (routePreference !== 'TRANSDERMAL_MANDATORY' && !allOralFailed) {
      let score = routePreference === 'TRANSDERMAL_PREFERRED' ? 66 : 82;
      const matchReasons: string[] = [];
      const pros: string[] = [
        'טבליה יומית פשוטה ונוחה באריזה אחת – מונעת שכחה של מרכיב הפרוגסטוגן.'
      ];
      const cons: string[] = [
        'מעבר ראשון בכבד: עלייה קלה בסיכון VTE וברמות SHBG/TBG בהשוואה למתן עורי.'
      ];

      let oralAgent = '';
      if (!needsEndometrialProtection) {
        oralAgent = estrogenDoseTier === 'LOW' ? 'Estrofem 1mg טבליה ביום' : 'Estrofem 1–2mg או Progynova 2mg טבליה ביום';
      } else if (!oralFemostonFailed) {
        pros.push('Femoston מכיל דידרוגסטרון (פרופיל בטיחות טוב לשד ולמטבוליזם וללא אלרגיית בוטנים/סויה).');
        oralAgent = isPostmenopausalOver1Year
          ? estrogenDoseTier === 'LOW'
            ? 'Femoston Conti 0.5/2.5 טבליה ביום'
            : 'Femoston Conti 1/5 (או Duavive באי-סבילות לפרוגסטוגנים)'
          : isHighEstrogenTier
          ? 'Femoston 2/10 טבליה ביום ברצף'
          : 'Femoston 1/10 טבליה ביום ברצף';
      } else if (!oralNetaFailed) {
        excludedReasonsAudit.push(`Femoston סונן עקב ניסיון עבר שהופסק (${oralFemostonFailed?.reasonStopped}).`);
        oralAgent = isPostmenopausalOver1Year
          ? 'Activelle 1/0.5 או Eviana 0.5/0.1 (או Duavive ללא פרוגסטוגן)'
          : 'Novofem טבליה ביום';
      }

      if (oralNetaFailed && !oralFemostonFailed) {
        excludedReasonsAudit.push(`Activelle/NETA סונן עקב ניסיון עבר שהופסק (${oralNetaFailed.reasonStopped}).`);
      }

      if (data.preferences.preferredRoute === 'ORAL_TABLET') {
        score += 10;
        matchReasons.push('תואם העדפת המטופלת לכדור פומי יומי (נמצא בטוח עבורה).');
      }
      if (prefersNonHormonal) score -= 26;

      options.push({
        id: 'opt_oral_mht_regimen',
        category: 'HORMONAL_SYSTEMIC',
        rankScore: clampScore(score),
        suitabilityBadge:
          routePreference === 'TRANSDERMAL_PREFERRED' || prefersNonHormonal ? 'CONDITIONAL' : 'GOOD_ALTERNATIVE',
        titleHebrew: !needsEndometrialProtection
          ? 'אסטרדיול פומי בלבד (Estrofem / Progynova)'
          : isPostmenopausalOver1Year
          ? 'טבליה משולבת רציפה פומית (Femoston Conti / Duavive)'
          : 'טבליה משולבת ציקלית פומית (Femoston 1/10 או 2/10)',
        subtitleHebrew: 'נטילה פומית בכדור יומי אחד לנשים בסיכון קרישתי ומטבולי נמוך',
        routeLabelHebrew: 'פומי (כדור אחד ביום)',
        regimenLabelHebrew: !needsEndometrialProtection
          ? 'אסטרוגן בלבד'
          : isPostmenopausalOver1Year
          ? 'משולב רציף'
          : 'משולב ציקלי',
        israeliProductsSummary: {
          primaryAgent: oralAgent,
          scheduleHebrew: 'טבליה אחת ביום בשעה קבועה ברצף בין חפיסות'
        },
        prosHebrew: pros,
        consHebrew: cons,
        tailoredMatchReasons: matchReasons,
        patientHowToTakeHebrew: [
          `טלי טבליה אחת של ${oralAgent} מדי יום בשעה קבועה, ברצף ללא הפסקה בין חפיסות.`,
          ...(data.medications.takingLevothyroxine
            ? ['מאחר שאת נוטלת אלטרוקסין, יש לבצע בדיקת דם ל-TSH כעבור 6–12 שבועות מתחילת הטיפול הפומי.']
            : [])
        ],
        monitoringNotesHebrew: data.medications.takingLevothyroxine
          ? 'לבדוק TSH כעבור 6–12 שבועות מתחילת אסטרוגן פומי.'
          : undefined
      });
    }
  } else if (meningiomaBlocksProgestogen && !mhtBlocked && isPostmenopausalOver1Year && routePreference !== 'TRANSDERMAL_MANDATORY') {
    // במנינגיומה עם רחם שמור בפוסט-מנופאוזה וללא סיכון VTE: Duavive (ללא פרוגסטוגן!) הוא הפתרון ההורמונלי היחיד המותר
    excludedReasonsAudit.push('משטרים המכילים פרוגסטוגן סוננו עקב היסטוריה של מנינגיומה.');
    options.push({
      id: 'opt_duavive_progestogen_free',
      category: 'HORMONAL_SYSTEMIC',
      rankScore: prefersNonHormonal ? 65 : 84,
      suitabilityBadge: 'GOOD_ALTERNATIVE',
      titleHebrew: 'דואביב (Duavive – קומפלקס TSEC ללא פרוגסטוגן!)',
      subtitleHebrew: 'מגן על רירית הרחם באמצעות Bazedoxifene ללא חשיפה לפרוגסטוגנים',
      routeLabelHebrew: 'פומי יומי (ללא פרוגסטוגן)',
      regimenLabelHebrew: 'TSEC רציף ללא דימום',
      israeliProductsSummary: {
        primaryAgent: 'Duavive (CE 0.45mg + Bazedoxifene 20mg) טבליה ביום',
        scheduleHebrew: 'טבליה שלמה אחת ביום עם או בלי אוכל'
      },
      prosHebrew: ['ללא כל מרכיב פרוגסטוגני – מתאים באי-סבילות קשה לפרוגסטוגנים או מנינגיומה.'],
      consHebrew: ['מתן פומי – אין לרשום בסיכון VTE מוגבר.'],
      tailoredMatchReasons: ['נבחר כפתרון נטול-פרוגסטוגן עקב היסטוריה של מנינגיומה.'],
      patientHowToTakeHebrew: ['טלי טבליה שלמה אחת של דואביב פעם ביום בשעה קבועה (אין לחצות או לרסק).']
    });
  }

  // =========================================================================
  // אופציות לא-הורמונליות מתאימות בלבד (מסננות תרופות שנפסלו בכבד / ניסיון עבר!)
  // =========================================================================
  const liverBlocked = data.medicalHistory.activeLiverDiseaseOrPorphyria || data.lftStatus === 'ABNORMAL';

  // --- לא-הורמונלי 1: Veoza 45mg / Lynkuet 120mg (מוצג רק אם אין מחלת כבד ולא נכשל בעבר!) ---
  if (!liverBlocked && !veozaFailed) {
    let score = mhtBlocked || data.age >= 60 ? 94 : prefersNonHormonal ? 92 : 73;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'מנגנון לא-הורמונלי ייעודי (חסימת NK3 במרכז ויסות החום בהיפותלמוס) – אפס סיכון VTE או דימום רחמי.',
      'הקלה מהירה מאוד בגלי חום והזעות לילה כבר מהשבוע הראשון לטיפול!',
      'Lynkuet 120mg (אלינזנטנט) מוסיף שיפור מובהק בשינה ואושר גם תחת טיפול אנדוקריני בסרטן שד (OASIS-4).'
    ];
    const cons: string[] = [
      'מחייב בדיקת תפקודי כבד (ALT, AST, בילירובין) לפני התחלה ובחודשים 1, 2, 3, 6 ו-9.',
      'אינו מונע איבוד עצם ואינו מטפל ביובש נרתיקי (ניתן לשלב תכשיר מקומי מהרשימה למטה).'
    ];

    if (mhtBlocked) matchReasons.push('בחירה לא-הורמונלית יעילה וממוקדת עבור מטופלת שבה MHT סיסטמי נפסל.');
    if (prefersNonHormonal) matchReasons.push('מדורג בעדיפות עליונה בהתאם להעדפת המטופלת להימנע מהורמונים.');
    if (data.age >= 60) matchReasons.push('מועדף בגיל ≥60 וסיכון קרדיו-וסקולרי מוגבר ללא סיכון פקקתי.');
    if (sym.hasModerateSevereVms) score += 3;

    options.push({
      id: 'opt_nonhormonal_nk3_veoza_lynkuet',
      category: 'NON_HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: score >= 86 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
      titleHebrew: 'חוסם קולטן NK3 לא-הורמונלי: ויוזה (Veoza 45mg) / לינקואט (Lynkuet 120mg)',
      subtitleHebrew: 'טיפול ייעודי לא-הורמונלי במרכז ויסות החום בהיפותלמוס',
      routeLabelHebrew: 'פומי לא-הורמונלי',
      regimenLabelHebrew: 'לא-הורמונלי יומי',
      israeliProductsSummary: {
        primaryAgent: sym.hasSignificantSleepIssue
          ? 'Veoza 45mg פעם ביום (או Lynkuet 120mg בערב לגלי חום ושינה)'
          : 'Veoza (Fezolinetant) 45mg טבליה אחת ביום בשעה קבועה',
        secondaryProgestogenOrMonitor: 'ניטור LFTs בדם (ALT/AST/Bilirubin): בסיס, חודש 1, 2, 3, 6 ו-9',
        scheduleHebrew: 'טבליה אחת ביום בשעה קבועה'
      },
      prosHebrew: pros,
      consHebrew: cons,
      tailoredMatchReasons: matchReasons,
      patientHowToTakeHebrew: [
        'טלי טבליה אחת של ויוזה 45 מ"ג פעם ביום בשעה קבועה עם מים (עם או בלי אוכל).',
        'חשוב לבצע בדיקות דם לתפקודי כבד (ALT, AST ובילירובין) לפני התחלת הכדור, ולאחר מכן בחודש 1, חודש 2, חודש 3, חודש 6 וחודש 9.',
        'במקרה של עייפות חריגה, בחילה ממושכת, גרד, שתן כהה או הצהבת עור/עיניים – הפסיקי מיד ופני לרופא/ה.'
      ],
      monitoringNotesHebrew: 'לוודא ALT/AST < 2x ULN ובילירובין תקין טרם מרשם ראשון, ולתזמן מעקב חודשים 1, 2, 3, 6, 9.'
    });
  } else {
    excludedReasonsAudit.push(
      liverBlocked
        ? 'ויוזה / לינקואט (חוסמי NK3) סוננו עקב מחלת כבד או תפקודי כבד חריגים.'
        : `ויוזה סוננה עקב ניסיון עבר שהופסק (${veozaFailed?.reasonStopped}).`
    );
  }

  // --- לא-הורמונלי 2: ונלפקסין / אציטלופרם (רק אם לא נכשלו בעבר; מותאם אוטומטית לטמוקסיפן ול"ד!) ---
  if (!ssriFailed) {
    const uncontrolledBp = data.medicalHistory.hypertensionStatus === 'UNCONTROLLED';
    let score = mhtBlocked || data.age >= 60 ? 90 : prefersNonHormonal ? 86 : 65;
    const matchReasons: string[] = [];
    const pros: string[] = [
      'מפחית גלי חום ב-50%–60% תוך 2–4 שבועות ומשפר במקביל חרדה ותנודות מצב רוח.',
      'בטוח לחלוטין תחת טמוקסיפן (אינו מעכב CYP2D6 – בניגוד לפאקסט/פרוזק שאסורים!).',
      'זמין בסל הבריאות וללא צורך בניטור כבדי חודשי.'
    ];
    const cons: string[] = [
      'יתכנו בחילה חולפת בשבוע הראשון או ירידה בחשק המיני; אין להפסיק בפתאומיות.'
    ];

    if (data.medications.takingTamoxifen || data.medications.takingAromataseInhibitors || data.medicalHistory.breastCancerHistory) {
      score += 6;
      matchReasons.push('בחירה בטוחה ומוכחת במטופלות סרטן שד ונוטלות טמוקסיפן.');
    }
    if (sym.hasSignificantMoodOrFog) {
      score += 4;
      matchReasons.push('נותן מענה משולב לגלי החום ולתסמיני מצב הרוח/החרדה.');
    }

    const agentText = uncontrolledBp
      ? 'Escitalopram (Cipralex) 10mg פעם ביום בבוקר (נבחר על פני ונלפקסין בשל ל"ד לא מאוזן)'
      : 'Venlafaxine XR 37.5mg ליום לשבוע ראשון ואז 75mg (או Escitalopram 10mg)';

    options.push({
      id: 'opt_nonhormonal_snri_ssri',
      category: 'NON_HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: score >= 85 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
      titleHebrew: uncontrolledBp
        ? 'אציטלופרם (Cipralex 10–20mg) – SSRI לא-הורמונלי'
        : 'ונלפקסין XR (37.5–75 מ"ג) או אציטלופרם (10–20 מ"ג)',
      subtitleHebrew: 'טיפול לא-הורמונלי מוכח לגלי חום וחרדה/מצב רוח (בטוח עם טמוקסיפן)',
      routeLabelHebrew: 'פומי לא-הורמונלי',
      regimenLabelHebrew: 'לא-הורמונלי יומי',
      israeliProductsSummary: {
        primaryAgent: agentText,
        secondaryProgestogenOrMonitor: data.medications.takingTamoxifen
          ? 'אזהרה: אין להחליף לעולם ל-Paroxetine או Fluoxetine תחת טמוקסיפן!'
          : undefined,
        scheduleHebrew: 'נטילה יומית קבועה עם אוכל'
      },
      prosHebrew: pros,
      consHebrew: cons,
      tailoredMatchReasons: matchReasons,
      patientHowToTakeHebrew: [
        `טלי ${agentText} מדי בוקר עם האוכל (השפעה מיטבית על גלי החום מורגשת תוך 2–4 שבועות; אין להפסיק את הכדור בבת אחת ללא ייעוץ).`
      ]
    });
  } else {
    excludedReasonsAudit.push(`SSRI/SNRI סוננו עקב ניסיון עבר שהופסק (${ssriFailed.reasonStopped}).`);
  }

  // --- לא-הורמונלי 3: גאבאפנטין לילי + CBT-MENOS (תמיד זמין כחלופה בטוחה; אוקסיבוטינין רק מתחת לגיל 65) ---
  {
    let score = mhtBlocked ? 84 : prefersNonHormonal ? 81 : 58;
    const matchReasons: string[] = [];
    if (sym.hasSignificantSleepIssue) {
      score += 6;
      matchReasons.push('גאבאפנטין בנטילת ערב יעיל במיוחד להזעות לילה ויקיצות מרובות.');
    }
    const allowOxy = data.age < 65 && (data.symptoms['14']?.severity || 0) >= 2;
    if (allowOxy) {
      score += 4;
      matchReasons.push('אוקסיבוטינין מספק מענה משולב להזעת יתר ולדחיפות במתן שתן.');
    }

    options.push({
      id: 'opt_nonhormonal_gabapentin_oxy_cbt',
      category: 'NON_HORMONAL_SYSTEMIC',
      rankScore: clampScore(score),
      suitabilityBadge: score >= 84 ? 'RECOMMENDED_TOP' : 'GOOD_ALTERNATIVE',
      titleHebrew: allowOxy
        ? 'גאבאפנטין לילי (300–900 מ"ג) / אוקסיבוטינין + פרוטוקול CBT-MENOS'
        : 'גאבאפנטין לילי (300–900 מ"ג) + פרוטוקול CBT-MENOS והיפנוזה קלינית',
      subtitleHebrew: 'טיפול לא-הורמונלי להזעות לילה, שינה וויסות קוגניטיבי-התנהגותי',
      routeLabelHebrew: 'פומי לא-הורמונלי + התנהגותי',
      regimenLabelHebrew: 'מותאם תסמין מוביל',
      israeliProductsSummary: {
        primaryAgent: allowOxy
          ? 'Gabapentin 300mg לפני השינה (או Oxybutynin 2.5–5mg) + CBT-MENOS'
          : 'Gabapentin 300mg לפני השינה (טיטרציה עד 600–900mg) + תוכנית CBT-MENOS',
        scheduleHebrew: 'נטילת ערב לפני השינה + 4–6 מפגשי CBT ממוקד גיל המעבר'
      },
      prosHebrew: [
        'בטוח בסרטן שד (ללא אינטראקציות עם טמוקסיפן), בסיכון פקקתי ובמחלת כבד קלה.',
        'גאבאפנטין משפר שינה רציפה; CBT-MENOS מפחית ב-50% את מצוקת גלי החום.'
      ],
      consHebrew: ['גאבאפנטין עלול לגרום לנמנום בוקר בימים הראשונים – להתחיל במינון 300 מ"ג בערב.'],
      tailoredMatchReasons: matchReasons,
      patientHowToTakeHebrew: [
        'טלי כמוסת גאבאפנטין 300 מ"ג שעה לפני השינה (ניתן להעלות בהדרגה לפי הנחיית הרופא/ה), בשילוב תרגול פרוטוקול CBT לגיל המעבר והלבשה בשכבות.'
      ]
    });
  }

  options.sort((a, b) => b.rankScore - a.rankScore);

  // =========================================================================
  // טיפולים מקומיים ל-GSM – מופרדים לחלוטין (תכשירי לחות ≠ אינטררוזה ≠ אסטרוגן נרתיקי ≠ אוספמיפן) ובחירה מרובה!
  // =========================================================================
  const localGsmOptions: LocalGsmOption[] = [];
  const hasBreastCaOrEndocrineTx =
    data.medicalHistory.breastCancerHistory ||
    data.medications.takingTamoxifen ||
    data.medications.takingAromataseInhibitors;

  // 1. תכשירי לחות נרתיקיים וחומרי סיכה (לא-הורמונלי – מופרד מאינטררוזה, מתאים ל-100% מהמטופלות!)
  localGsmOptions.push({
    id: 'gsm_moisturizers_lubricants',
    recommended: sym.hasSignificantGsm,
    isHormonal: false,
    titleHebrew: 'תכשירי לחות נרתיקיים וחומצה היאלורונית + חומרי סיכה (לא-הורמונלי)',
    brandAndDoseHebrew: 'תכשיר לחות קבוע (Replens / Gynomunal / חומצה היאלורונית) + מסכך על בסיס מים או סיליקון ביחסים',
    scheduleHebrew: 'תכשיר לחות 2–3 פעמים בשבוע בקביעות + חומר סיכה בכל מגע מיני (ניתן לשילוב עם כל תכשיר אחר!)',
    prosHebrew: [
      '100% נטול הורמונים ובטוח לחלוטין בכל מצב רפואי (כולל סרטן שד ומעכבי ארומטאז).',
      'משלים ומשפר נוחות יומיומית גם לצד אסטרוגן נרתיקי או אינטררוזה.'
    ],
    cautionsHebrew: ['להקפיד על תכשיר איזואוסמולרי ב-pH חומצי מותאם לנרתיק.'],
    patientInstructionsHebrew:
      'שימוש בתכשיר לחות נרתיקי (כגון Replens / חומצה היאלורונית) 2–3 פעמים בשבוע בקביעות לשיקום הלחות, ובנוסף חומר סיכה (מים/סיליקון) בעת קיום יחסי מין.'
  });

  // 2. אסטרוגן נרתיקי מקומי (מוסתר תחת מעכבי ארומטאז פעילים ללא אישור אונקולוגי; מותר בטמוקסיפן עם הערת תיאום לפי NICE 2024)
  if (!data.medications.takingAromataseInhibitors) {
    localGsmOptions.push({
      id: 'gsm_vaginal_estrogen',
      recommended: sym.hasSignificantGsm && !data.medicalHistory.breastCancerHistory,
      isHormonal: true,
      titleHebrew: 'אסטרוגן נרתיקי מקומי (Vagifem 10mcg / Ovestin / Imvaggis 0.03mg)',
      brandAndDoseHebrew: data.medicalHistory.breastCancerHistory
        ? 'Imvaggis 0.03mg אסטריול אולטרה-נמוך / Vagifem 10mcg (בתיאום אונקולוגי לאחר מיצוי לחות)'
        : 'טבליות וגיפם 10 מק"ג / קרם או פתילות אובסטין / אימווגיס 0.03 מ"ג',
      scheduleHebrew: 'פעם ביום לשבועיים (העמסה), ולאחר מכן פעמיים בשבוע בקביעות לטווח ארוך',
      prosHebrew: [
        'הטיפול היעיל ביותר ליובש נרתיקי, כאבים ביחסים, דחיפות במתן שתן ומניעת דלקות שתן חוזרות.',
        'ספיגה סיסטמית זניחה – בטוח בכל גיל ובסיכון VTE ואינו דורש תוספת פרוגסטוגן!'
      ],
      cautionsHebrew: data.medicalHistory.breastCancerHistory
        ? ['בהיסטוריה של סרטן שד יש למצות לחות נרתיקית תחילה ולתאם עם האונקולוג/ית (לפי NICE 2024 אפשרי בייחוד תחת טמוקסיפן או ב-ER שלילי).']
        : ['טיפול אחזקה מתמשך – בהפסקתו היובש צפוי לחזור.'],
      patientInstructionsHebrew:
        'החדירי לנרתיק טבליית וגיפם 10 מק"ג / מריחת אובסטין / פתילת אימווגיס פעם ביום לפני השינה למשך שבועיים ראשונים, ולאחר מכן פעמיים בשבוע בקביעות.'
    });
  } else {
    excludedReasonsAudit.push('אסטרוגן נרתיקי מקומי לא הוצג כבחירה אוטומטית בשל נטילת מעכב ארומטאז פעיל (קו ראשון לחות לא-הורמונלית; דורש אישור אונקולוגי פרטני).');
  }

  // 3. אינטררוזה – פראסטרון נרתיקי (מופרד לחלוטין מתכשירי הלחות! מוצג רק אם אין סרטן שד ובפוסט-מנופאוזה)
  if (!hasBreastCaOrEndocrineTx && isPostmenopausalOver1Year) {
    localGsmOptions.push({
      id: 'gsm_intrarosa_prasterone',
      recommended: sym.hasSignificantGsm && sym.hasSignificantHsdd,
      isHormonal: true,
      titleHebrew: 'אינטררוזה – פראסטרון / DHEA נרתיקי (Intrarosa 6.5mg)',
      brandAndDoseHebrew: 'פתילות נרתיקיות Intrarosa 6.5mg (Prasterone)',
      scheduleHebrew: 'פתילה נרתיקית אחת מדי לילה לפני השינה',
      prosHebrew: [
        'מומר תוך-תאית ברקמת הנרתיק לאסטרוגן ולאנדרוגן מקומיים ללא עלייה ברמות בדם.',
        'משפר יובש נרתיקי, דיספראוניה (כאב ביחסים) ותחושה/עוררות מקומית.'
      ],
      cautionsHebrew: ['אין לשלב בו-זמנית באותו לילה עם טבליית אסטרוגן נרתיקי תוך-נרתיקי (לבחור אחד מהם + לחות לפי צורך).'],
      patientInstructionsHebrew:
        'החדירי פתילה אחת של אינטררוזה 6.5 מ"ג לנרתיק מדי ערב לפני השינה.'
    });
  }

  // 4. אוספמיפן פומי (מוצג רק בפוסט-מנופאוזה ללא סרטן שד וללא סיכון VTE)
  if (!hasBreastCaOrEndocrineTx && isPostmenopausalOver1Year && !vte.mandatoryTransdermal && data.bmi < 30) {
    localGsmOptions.push({
      id: 'gsm_ospemifene_oral',
      recommended: false,
      isHormonal: true,
      titleHebrew: 'אוספמיפן פומי ל-GSM (Senshio 60mg)',
      brandAndDoseHebrew: 'טבליות Senshio (Ospemifene) 60 מ"ג בנטילה פומית',
      scheduleHebrew: 'טבליה אחת ביום עם האוכל',
      prosHebrew: ['פתרון בכדור פומי לנשים עם GSM שאינן מעוניינות במריחה/החדרה נרתיקית.'],
      cautionsHebrew: ['SERM פומי – עלול להחמיר זמנית גלי חום אצל חלק מהנשים.'],
      patientInstructionsHebrew: 'טלי טבליה אחת של סנשיו 60 מ"ג פעם ביום עם האוכל.'
    });
  }

  // =========================================================================
  // מקטע נפרד לחלוטין: טסטוסטרון עורי נשי ל-HSDD (מוצג רק כאשר מותר רפואית למטופלת!)
  // =========================================================================
  let testosteroneOption: TestosteroneHsddOption | undefined;
  if (!hasBreastCaOrEndocrineTx && !liverBlocked) {
    testosteroneOption = {
      id: 'hsdd_transdermal_testosterone',
      recommended: sym.hasSignificantHsdd,
      titleHebrew: 'טסטוסטרון עורי במינון נשי פיזיולוגי (עבור HSDD – ירידה בתשוקה המינית הגורמת מצוקה)',
      brandAndDoseHebrew: 'ג׳ל טסטוסטרון 1% (כגון AndroGel במינון נשי Off-label: ~5 מ"ג ליום = טיפה בגודל אפונה; שקית 50 מ"ג מספיקה ל-8–10 ימים)',
      scheduleHebrew: 'מריחה יומית על עור נקי ויבש בירך החיצונית או השוק התחתונה',
      prerequisitesHebrew: [
        'להקפיד שהאסטרוגן הסיסטמי ניתן דרך העור (ג׳ל/מדבקה) ולא פומית – אסטרוגן פומי מעלה SHBG ומנטרל טסטוסטרון חופשי!',
        'לוודא שקודם/במקביל ניתן מענה מלא ליובש או כאב נרתיקי (GSM).'
      ],
      prosHebrew: [
        'הטיפול התרופתי המבוסס היחיד לשיפור חשק מיני, עוררות ושביעות רצון מינית בפוסט-מנופאוזה ולאחר כריתת שחלות (BSO/RRSO).'
      ],
      monitoringProtocolHebrew: [
        'בדיקת דם ל-Total Testosterone (ו-SHBG) לפני תחילת הטיפול (בסיס).',
        'בדיקת דם חוזרת כעבור 3–6 שבועות ובהמשך כל 6–12 חודשים לוודא שהרמה בטווח הפיזיולוגי של אישה צעירה.',
        'ניסיון טיפולי של 3–6 חודשים (להפסיק אם אין שיפור קליני או אם מופיעים אקנה/שיעור יתר).'
      ],
      patientInstructionsHebrew:
        'מרחי טיפה קטנה בגודל אפונה של ג׳ל טסטוסטרון (שקית אחת של 50 מ"ג מספיקה ל-8 עד 10 ימים!) על עור נקי בירך החיצונית/שוק מדי יום, שטפי ידיים במים וסבון מיד לאחר המריחה, ובצעי בדיקת דם לרמת טסטוסטרון בעוד 4–6 שבועות.'
    };
  }

  // נקודות תיאום ציפיות כלליות
  const patientExpectationPoints: string[] = [
    'ציר זמן לשיפור: הקלה ראשונית בגלי חום ושינה מתחילה תוך 2–4 שבועות, והשפעה מלאה מוערכת בביקור מעקב כעבור 3 חודשים.',
    needsEndometrialProtection && !mhtBlocked
      ? 'דימומים תחת טיפול הורמונלי: הכתמות קלות שכיחות ב-3–6 החודשים הראשונים; יש לדווח אם מופיע דימום כבד, ממושך או חדש לאחר חצי שנה.'
      : 'ניטור בטיחות: יש להקפיד על בדיקות המעקב והסקר שהוגדרו עבורך.',
    contraceptionEval.needsContraception
      ? `מניעת הריון: טיפול הורמונלי לגיל המעבר (HRT) אינו מונע הריון! ${contraceptionEval.contraceptionRuleHebrew}`
      : 'אורח חיים תומך: אימוני כוח/התנגדות פעמיים-שלוש בשבוע, תזונה ים-תיכונית עשירה בסידן וחלבון ותוסף ויטמין D שומרים על העצם, השריר והלב.',
    boneRisk.riskTier !== 'LOW' ? boneRisk.guidanceHebrew : ''
  ].filter(Boolean);

  const topOption = options[0];
  const emrSummaryText = [
    `סיכום ייעוץ גיל המעבר – ${data.fullName || 'מטופלת'} (גיל ${data.age})`,
    `שלב STRAW+10: ${straw.hebrewName} (${straw.code})`,
    `ציון חומרה IMS: ${sym.totalSeverityScore}/76 (${sym.activeSymptomCount} תסמינים פעילים)`,
    prevent.hasCompleteLabInputs
      ? `סיכון קרדיו-וסקולרי AHA PREVENT: 10y Total CVD ${prevent.risk10YearTotalCvd}% | ASCVD ${prevent.risk10YearAscvd}%`
      : '',
    `משטר מומלץ: ${regimenHebrewTitle} | אופציה מדורגת #1: ${topOption?.titleHebrew || ''}`
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
    excludedReasonsAudit,
    localGsmOptions,
    testosteroneOption,
    patientExpectationPoints,
    followUpIntervalMonths: 3,
    emrSummaryText
  };
}
