import { summarizeSymptoms } from './imsSymptoms';
import { STRAWStage, Stage1Data } from './types';

export interface STRAWAssessment {
  stage: STRAWStage;
  code: string;
  hebrewName: string;
  clinicalDescription: string;
  fshRequired: boolean;
  fshNote: string;
  recommendedRegimenClass: 'ESTROGEN_ONLY' | 'SEQUENTIAL' | 'CONTINUOUS';
}

export interface ContraceptionAssessment {
  needsContraception: boolean;
  contraceptionRuleHebrew: string;
  mirenaYearsInSitu?: number;
  mirenaValidForMhtEndometrium: boolean;
  mirenaExpiredForMhtWarning?: string;
  nonProtectiveProgestogenWarning?: string;
  chcOver50SwitchWarning?: string;
  summaryPoints: string[];
}

export function evaluateContraceptionAndMirena(data: Stage1Data): ContraceptionAssessment {
  const { age, hadHysterectomy, hadBsoOrRrso, monthsSinceLastPeriod, cyclePattern, contraception, fshLevel } = data;
  const summaryPoints: string[] = [];

  // חישוב משך התקן מירנה ברחם (אם קיים תאריך התקנה)
  let mirenaYearsInSitu: number | undefined;
  let mirenaValidForMhtEndometrium = false;
  let mirenaExpiredForMhtWarning: string | undefined;

  if (contraception.currentMethod === 'MIRENA_52MG') {
    if (contraception.mirenaInsertionDate) {
      const inserted = new Date(contraception.mirenaInsertionDate);
      if (!isNaN(inserted.getTime())) {
        const diffYears = (Date.now() - inserted.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        mirenaYearsInSitu = Math.max(0, Number(diffYears.toFixed(1)));
        if (mirenaYearsInSitu <= 5.0) {
          mirenaValidForMhtEndometrium = true;
          summaryPoints.push(
            `התקן מירנה (52 מ"ג LNG) הותקן לפני ${mirenaYearsInSitu} שנים – בתוקף מלא (עד 5 שנים) להגנה על רירית הרחם תחת MHT וכן למניעת הריון.`
          );
        } else {
          mirenaValidForMhtEndometrium = false;
          mirenaExpiredForMhtWarning = `התקן מירנה הותקן לפני ${mirenaYearsInSitu} שנים (מעל 5 שנים!): לפי הנחיות BMS / FSRH תוקף המירנה כמרכיב פרוגסטוגני ב-MHT פג לאחר 5 שנים (גם אם למניעת הריון הורחב ל-8 שנים). חובה להחליף התקן או להוסיף פרוגסטוגן סיסטמי!`;
          summaryPoints.push(mirenaExpiredForMhtWarning);
        }
      }
    } else {
      // הוזן מירנה ללא תאריך מדויק – נתריע לרופא לוודא שבתוך 5 שנים
      mirenaValidForMhtEndometrium = true;
      summaryPoints.push(
        'דווח התקן מירנה 52 מ"ג ללא תאריך התקנה מדויק – יש לוודא שמועד ההתקנה קטן מ-5 שנים לצורך הגנת רירית תחת MHT.'
      );
    }
  }

  let nonProtectiveProgestogenWarning: string | undefined;
  if (contraception.currentMethod === 'LOW_DOSE_IUS_KYLEENA' && !hadHysterectomy) {
    nonProtectiveProgestogenWarning =
      'התקן הורמונלי במינון נמוך (Kyleena / Jaydess) יעיל למניעת הריון אך אינו מאושר להגנה על רירית הרחם תחת אסטרוגן סיסטמי (MHT)! נדרשת הוספת פרוגסטוגן סיסטמי או החלפה למירנה 52 מ"ג.';
    summaryPoints.push(nonProtectiveProgestogenWarning);
  } else if (contraception.currentMethod === 'POP_SLYND_CERAZETTE' && !hadHysterectomy) {
    nonProtectiveProgestogenWarning =
      'גלולות פרוגסטין בלבד למניעת הריון (Slynd / Cerazette / Microlut) אינן מספקות הגנה מוכחת על רירית הרחם כחלק ממשטר MHT! אין להסתמך עליהן מול אסטרוגן סיסטמי.';
    summaryPoints.push(nonProtectiveProgestogenWarning);
  }

  let chcOver50SwitchWarning: string | undefined;
  if (contraception.currentMethod === 'CHC_PILL_PATCH_RING' && age >= 50) {
    chcOver50SwitchWarning =
      'מטופלת בגיל 50 ומעלה הנוטלת אמצעי מניעה הורמונלי משולב (CHC): מומלץ להפסיק אתניל-אסטרדיול בגיל 50 עקב סיכון פקקתי/ווסקולרי ולהמיר ל-POP / התקן / חוצץ + MHT פיזיולוגי לפי הצורך.';
    summaryPoints.push(chcOver50SwitchWarning);
  }

  // כללי הפסקת אמצעי מניעה בגיל המעבר (FSRH / Red Whale / Dr. Shaklai)
  const effectiveMonthsAmenorrhea =
    cyclePattern === 'AMENORRHEA_OVER_12_MONTHS'
      ? Math.max(monthsSinceLastPeriod, 12)
      : monthsSinceLastPeriod;

  let needsContraception = false;
  let contraceptionRuleHebrew = 'אין צורך באמצעי מניעה.';

  if (hadHysterectomy || hadBsoOrRrso) {
    needsContraception = false;
    contraceptionRuleHebrew = hadBsoOrRrso
      ? 'לאחר כריתת שחלות דו-צדדית (BSO/RRSO) – אין צורך באמצעי מניעה.'
      : 'לאחר כריתת רחם – אין צורך באמצעי מניעה.';
  } else if (!contraception.sexuallyActiveWithPregnancyRisk && !contraception.needsContraceptionCounseling) {
    needsContraception = false;
    contraceptionRuleHebrew = 'לפי אנמנזה אין חשיפה לסיכון להריון כעת (אם יחול שינוי: HRT רגיל אינו מונע הריון!).';
  } else if (age < 50) {
    if (effectiveMonthsAmenorrhea < 24) {
      needsContraception = true;
      contraceptionRuleHebrew = `גיל מתחת ל-50 (${age}): נדרש אמצעי מניעה עד 24 חודשי אל-ווסת ספונטנית רצופים (כעת ${effectiveMonthsAmenorrhea} חודשים). HRT אינו אמצעי מניעה!`;
      summaryPoints.push(contraceptionRuleHebrew);
    } else {
      needsContraception = false;
      contraceptionRuleHebrew = 'חלפו 24 חודשי אל-ווסת ספונטניים מתחת לגיל 50 – ניתן להפסיק אמצעי מניעה.';
    }
  } else if (age < 55) {
    if (effectiveMonthsAmenorrhea < 12) {
      needsContraception = true;
      contraceptionRuleHebrew = `גיל 50–54 (${age}): נדרש אמצעי מניעה עד 12 חודשי אל-ווסת ספונטנית רצופים (כעת ${effectiveMonthsAmenorrhea} חודשים). HRT אינו מונע הריון!`;
      if (contraception.currentMethod === 'POP_SLYND_CERAZETTE') {
        if (fshLevel && fshLevel > 30) {
          contraceptionRuleHebrew += ` רמת FSH מתועדת (${fshLevel} IU/L > 30) – ניתן להמשיך POP שנה נוספת ואז להפסיק בבטחה.`;
        } else {
          contraceptionRuleHebrew +=
            ' תחת POP בגיל ≥50 עם אל-ווסת: ניתן לבדוק FSH (אם >30 IU/L – להמשיך POP שנה נוספת ולהפסיק, או עד גיל 55).';
        }
      }
      summaryPoints.push(contraceptionRuleHebrew);
    } else {
      needsContraception = false;
      contraceptionRuleHebrew = 'חלפו מעל 12 חודשי אל-ווסת בגיל ≥50 – אין צורך באמצעי מניעה.';
    }
  } else {
    needsContraception = false;
    contraceptionRuleHebrew = 'גיל 55 ומעלה – אובדן פוריות טבעי ניתן להנחה ואין צורך באמצעי מניעה.';
  }

  return {
    needsContraception,
    contraceptionRuleHebrew,
    mirenaYearsInSitu,
    mirenaValidForMhtEndometrium,
    mirenaExpiredForMhtWarning,
    nonProtectiveProgestogenWarning,
    chcOver50SwitchWarning,
    summaryPoints
  };
}

export function evaluateSTRAWStage(data: Stage1Data): STRAWAssessment {
  const { age, cyclePattern, monthsSinceLastPeriod, hadHysterectomy, hadBsoOrRrso, fshLevel } = data;
  const symSummary = summarizeSymptoms(data.symptoms);

  // 1. מנופאוזה כירורגית (כריתת שחלות דו-צדדית / מניעתית BSO / RRSO)
  if (hadBsoOrRrso) {
    return {
      stage: 'SURGICAL_MENOPAUSE',
      code: 'Surgical Menopause (BSO / RRSO)',
      hebrewName: 'מנופאוזה כירורגית (כריתת שחלות דו-צדדית / RRSO)',
      clinicalDescription:
        'צניחה אנדוקרינית חדה של אסטרדיול וטסטוסטרון. מתחת לגיל 45–50 קיימת התוויה רפואית להגנה קרדיו-וסקולרית, מוחית וגרמית במינון אסטרוגן פיזיולוגי מתאים לגיל (בהיעדר סרטן שד פעיל).',
      fshRequired: false,
      fshNote: 'אין צורך בבדיקת FSH לאחר כריתת שחלות דו-צדדית.',
      recommendedRegimenClass: hadHysterectomy ? 'ESTROGEN_ONLY' : 'CONTINUOUS'
    };
  }

  // 2. כריתת רחם עם שימור שחלות
  if (hadHysterectomy) {
    const needsFsh = age < 45;
    return {
      stage: 'HYSTERECTOMY_OVARIES_CONSERVED',
      code: 'Post-Hysterectomy (Ovaries Conserved)',
      hebrewName: 'לאחר כריתת רחם (עם שימור שחלות)',
      clinicalDescription:
        'בהיעדר וסת כסמן קליני, הערכת המעבר מתבססת על תסמינים וזומוטוריים/נוירו-קוגניטיביים. הטיפול הסיסטמי מבוסס על אסטרוגן בלבד (ללא פרוגסטוגן, למעט היסטוריה של אנדומטריוזיס נרחב).',
      fshRequired: needsFsh,
      fshNote: needsFsh
        ? 'מומלץ לבדוק FSH (ופרופיל שחלתי) מתחת לגיל 45 לזיהוי אי-ספיקה שחלתית מוקדמת בעקבות הניתוח.'
        : 'בגיל ≥45 האבחנה קלינית על סמך תסמינים ואין צורך בבדיקת FSH.',
      recommendedRegimenClass: 'ESTROGEN_ONLY'
    };
  }

  // 3. אי-ספיקה שחלתית מוקדמת (POI - מתחת לגיל 40) - עדכון ASRM/ESHRE 2024: FSH > 25 IU/L
  if (
    age > 0 &&
    age < 40 &&
    (cyclePattern === 'SKIPPED_OVER_60_DAYS' ||
      cyclePattern === 'AMENORRHEA_OVER_12_MONTHS' ||
      monthsSinceLastPeriod >= 4 ||
      (fshLevel !== undefined && fshLevel > 25))
  ) {
    return {
      stage: 'POI',
      code: 'POI (<40)',
      hebrewName: 'חשד/אבחנת אי-ספיקה שחלתית מוקדמת (POI < 40)',
      clinicalDescription:
        'הפרעת מחזור ≥4 חודשים מתחת לגיל 40. חובה טיפול הורמונלי תחליפי במינון פיזיולוגי גבוה יותר מהרגיל (למשל Evorel 75-100 / Estrogel 2-3 לחיצות / Femoston 2/10) להגנה על העצם, הלב והמוח לפחות עד גיל המנופאוזה הטבעי (~51).',
      fshRequired: fshLevel === undefined || fshLevel <= 25,
      fshNote:
        fshLevel && fshLevel > 25
          ? `תועד FSH מוגבר (${fshLevel} IU/L > 25) התומך באבחנת POI לפי קריטריוני ESHRE/ASRM 2024. מומלץ גם קריוטיפ, X שביר, נוגדני TPO ואדרנל.`
          : 'לפי עדכון ESHRE/ASRM 2024: נדרשת בדיקת FSH אחת > 25 IU/L (בנוכחות ≥4 חודשי אוליגו/אמנוריאה; בדיקה חוזרת אחרי 4–6 שבועות רק באי-ודאות), לצד שלילת הריון, פרולקטין ו-TSH.',
      recommendedRegimenClass: monthsSinceLastPeriod >= 12 ? 'CONTINUOUS' : 'SEQUENTIAL'
    };
  }

  // 4. מנופאוזה מוקדמת (גיל 40-44)
  if (
    age >= 40 &&
    age < 45 &&
    (cyclePattern === 'SKIPPED_OVER_60_DAYS' || cyclePattern === 'AMENORRHEA_OVER_12_MONTHS')
  ) {
    return {
      stage: 'EARLY_MENOPAUSE',
      code: 'Early Menopause (40–44)',
      hebrewName: 'מעבר / מנופאוזה מוקדמת (גיל 40–44)',
      clinicalDescription:
        'הפסקת תפקוד שחלתי בגיל 40–44 מעלה סיכון קרדיו-וסקולרי ואוסטיאופורוטי. מומלץ טיפול הורמונלי במינון מספק לפחות עד גיל 51 (בהיעדר התווית נגד).',
      fshRequired: fshLevel === undefined,
      fshNote: 'מומלץ לתעד FSH, TSH ופרולקטין בגילאי 40–44 לאישוש אבחנה ולשלילת אטיולוגיה משנית.',
      recommendedRegimenClass:
        cyclePattern === 'AMENORRHEA_OVER_12_MONTHS' || monthsSinceLastPeriod >= 12 ? 'CONTINUOUS' : 'SEQUENTIAL'
    };
  }

  // 5. פוסט-מנופאוזה (>12 חודשי אל-ווסת)
  if (cyclePattern === 'AMENORRHEA_OVER_12_MONTHS' || monthsSinceLastPeriod >= 12) {
    if (monthsSinceLastPeriod <= 72 && age < 60) {
      return {
        stage: 'EARLY_POSTMENOPAUSE',
        code: 'STRAW +1a / +1b / +1c',
        hebrewName: 'פוסט-מנופאוזה מוקדמת (1–6 שנים מהווסת האחרונה)',
        clinicalDescription:
          'בתוך "חלון ההזדמנויות" האופטימלי (מתחת לגיל 60 ופחות מ-10 שנים מהמנופאוזה): יחס תועלת-סיכון מיטבי ל-MHT סיסטמי בתסמינים ולהגנה על העצם והעורקים. מתאים למשטר רציף משולב (ccHRT) ללא דימום.',
        fshRequired: false,
        fshNote: 'בגיל ≥45 עם 12 חודשי אל-ווסת האבחנה קלינית לחלוטין ואין צורך בבדיקת FSH.',
        recommendedRegimenClass: 'CONTINUOUS'
      };
    }

    const overWindow = age >= 60 || monthsSinceLastPeriod >= 120;
    return {
      stage: 'LATE_POSTMENOPAUSE',
      code: 'STRAW +2',
      hebrewName: overWindow
        ? 'פוסט-מנופאוזה מאוחרת (גיל ≥60 או ≥10 שנים מווסת אחרונה)'
        : 'פוסט-מנופאוזה מאוחרת (>6 שנים מווסת אחרונה)',
      clinicalDescription: overWindow
        ? 'מחוץ לחלון ההזדמנויות הסטנדרטי להתחלת MHT חדשה: אם נדרשת התחלת טיפול בשל תסמינים משמעותיים, חובה להעריך סיכון קרדיו-וסקולרי (PREVENT) ולהעדיף מתן עורי במינון נמוך/אולטרה-נמוך בשילוב אסטרוגן נרתיקי ל-GSM.'
        : 'שלב פוסט-מנופאוזלי יציב; מתאים למשטר רציף משולב (ccHRT) במינון מותאם לתסמינים ולעצם.',
      fshRequired: false,
      fshNote: 'אין צורך בבדיקות הורמונליות בגיל זה.',
      recommendedRegimenClass: 'CONTINUOUS'
    };
  }

  // 6. פרי-מנופאוזה מאוחרת (-1): דילוג 60+ יום
  if (cyclePattern === 'SKIPPED_OVER_60_DAYS' || (monthsSinceLastPeriod >= 2 && monthsSinceLastPeriod < 12)) {
    return {
      stage: 'LATE_TRANSITION',
      code: 'STRAW -1',
      hebrewName: 'פרי-מנופאוזה מאוחרת (Late Menopausal Transition)',
      clinicalDescription:
        'דילוג וסתות של 60 יום ומעלה (1–3 שנים לפני הווסת האחרונה). שיא שכיחות גלי חום והפרעות שינה. פחות מ-12 חודשי אל-ווסת ולכן מחייב משטר משולב ציקלי/סדרתי (sHRT) או התקן מירנה למניעת דימומים בלתי צפויים!',
      fshRequired: false,
      fshNote: 'בגיל ≥45 אין לבצע בדיקת FSH – הרמות תנודתיות מאוד ואינן משנות החלטה קלינית.',
      recommendedRegimenClass: 'SEQUENTIAL'
    };
  }

  // 7. פרי-מנופאוזה מוקדמת (-2): שוני מתמיד >= 7 ימים
  if (cyclePattern === 'VARIATION_OVER_7_DAYS') {
    return {
      stage: 'EARLY_TRANSITION',
      code: 'STRAW -2',
      hebrewName: 'פרי-מנופאוזה מוקדמת (Early Menopausal Transition)',
      clinicalDescription:
        'שינוי עקבי של 7 ימים ומעלה באורך המחזור. תנודות אסטרדיול חדות וירידת פרוגסטרון הגורמות להפרעות שינה, רגישות רגשית (PMS מוחמר), ערפול מוחי וגלי חום. מתאים למשטר ציקלי/סדרתי (sHRT) או שילוב מירנה + אסטרוגן עורי.',
      fshRequired: false,
      fshNote: 'בגיל ≥45 האבחנה קלינית – FSH תקין בשלב זה אינו שולל פרי-מנופאוזה!',
      recommendedRegimenClass: 'SEQUENTIAL'
    };
  }

  // 8. שלב רפרודוקטיבי מאוחר (-3b / -3a): מחזורים סדירים (עם או בלי התקצרות קלה ותסמינים מוקדמים)
  const hasPerimenopausalSymptoms =
    symSummary.hasModerateSevereVms || symSummary.hasSignificantSleepIssue || symSummary.hasSignificantMoodOrFog;

  return {
    stage: 'LATE_REPRODUCTIVE',
    code: hasPerimenopausalSymptoms ? 'STRAW -3a (Symptomatic Late Reproductive)' : 'STRAW -3b / -3a',
    hebrewName: hasPerimenopausalSymptoms
      ? 'שלב רפרודוקטיבי מאוחר תסמיני (STRAW -3a – מחזור סדיר עם תסמינים)'
      : 'שלב רפרודוקטיבי מאוחר (מחזור סדיר)',
    clinicalDescription: hasPerimenopausalSymptoms
      ? 'מחזור עדיין סדיר (לעיתים מתקצר ב-2–3 ימים, שלב -3a), אך כבר מופיעים תסמינים וזומוטוריים, הפרעות שינה או שינויי מצב רוח לוטאליים עקב ירידה בנהורין/אינהיבין B. חשוב לשלול הפרעת תריס וחסר ברזל/פריטין; ניתן לטפל במשטר ציקלי או במירנה + E2 לפי חומרת הפגיעה בתפקוד.'
      : 'מחזורים סדירים. אם קיימות תלונות לא ספציפיות מומלץ לשלול חסר ברזל/פריטין והפרעה בבלוטת התריס.',
    fshRequired: false,
    fshNote: 'FSH ביום 2–5 עלול להיות תקין לחלוטין ואינו שולל תסמיני שלב -3a.',
    recommendedRegimenClass: 'SEQUENTIAL'
  };
}
