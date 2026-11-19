import { evaluateCompletenessGate } from './completenessGate';
import { summarizeSymptoms } from './imsSymptoms';
import { calculateBoneRisk } from './riskCalculators';
import {
  ComplementaryTherapyOption,
  HerbalBotanicalGuidanceItem,
  HolisticCareSuite,
  Stage1Data,
  TailoredLifestyleRecommendation
} from './types';

/**
 * מנוע המלצות אורח חיים, טיפולים משלימים מוכחים וצמחי מרפא – מותאם אישית למטופלת
 * ומבוסס אך ורק על המקורות בתיקיית knowledge/:
 * - ACOG Clinical Practice Guideline No. 13 (Nov 2026): knowledge/markdown/magid-course/acog-cpg-13-vasomotor-sleep-mood-2026.md
 * - BMS Consensus Statement: Non-Hormonal-Based Treatments (July 2026): knowledge/markdown/magid-course/bms-consensus-non-hormonal-treatments-2026.md
 * - NICE NG23 Menopause Guideline (Dec 2024): knowledge/markdown/red-whale/02-nice-guideline-menopause-2024.md
 * - IMA Israeli Preventive Medicine Task Force (Oct 2022): knowledge/markdown/magid-course/ima-preventive-medicine-guidelines-2022.md
 * - Red Whale #07 (Breast Cancer Risk), #10 (Osteoporosis), #14 (Drug Interactions): knowledge/markdown/red-whale/
 */
export function buildHolisticCareSuite(data: Stage1Data): HolisticCareSuite {
  const sym = summarizeSymptoms(data.symptoms);
  const bone = calculateBoneRisk(data);
  const gate = evaluateCompletenessGate(data);

  const hasBreastCaOrOncologicMeds =
    data.medicalHistory.breastCancerHistory ||
    data.medicalHistory.dcisOrAtypicalHyperplasia ||
    data.medications.takingTamoxifen ||
    data.medications.takingAromataseInhibitors;

  const hasLiverIssue =
    data.medicalHistory.activeLiverDiseaseOrPorphyria || data.lftStatus === 'ABNORMAL';

  const hasSignificantAnxietyOrMood =
    (data.symptoms['8']?.severity || 0) >= 2 ||
    (data.symptoms['9']?.severity || 0) >= 2 ||
    (data.symptoms['10']?.severity || 0) >= 2 ||
    (data.symptoms['11']?.severity || 0) >= 2;

  const lifestyleItems: TailoredLifestyleRecommendation[] = [];

  // 1. פעילות גופנית מותאמת למטופלת (אירובי + התנגדות/כוח + שיווי משקל/יוגה)
  lifestyleItems.push({
    id: 'life_physical_activity',
    domainHebrew: 'פעילות גופנית (אירובי, אימוני התנגדות ושיווי משקל)',
    priority: !data.exerciseRegular || bone.riskTier !== 'LOW' || sym.hasSignificantSleepIssue ? 'HIGH' : 'ROUTINE',
    recommendationHebrew: data.exerciseRegular
      ? 'המטופלת מבצעת פעילות גופנית סדירה – יש לחזק ולהתמיד ב-150–300 דקות/שבוע פעילות אירובית מתונה בשילוב 2–3 אימוני כוח/התנגדות שבועיים לקבוצות שרירים גדולות ותרגול שיווי משקל/יוגה. לפי ACOG 2026 פעילות גופנית משפרת מובהקות שינה, דיכאון וחרדה בגיל המעבר (אינה מפחיתה ישירות תדירות גלי חום לפי BMS 2026, אך מגינה על העצם, השריר, הלב והורדת סיכון לסרטן השד).'
      : 'התחלה הדרגתית של פעילות גופנית מובנית: יעד של 150–300 דקות/שבוע פעילות אירובית בעצימות בינונית (הליכה מהירה, שחייה, אופניים) + 2–3 אימוני כוח/התנגדות נושאי-משקל בשבוע (8–15 חזרות לקבוצות שרירים גדולות) וקימה מישיבה ממושכת כל 30 דקות. מוכחת לשיפור הפרעות שינה, מצב רוח וחרדה (ACOG 2026), שימור צפיפות העצם (NOGG/IMA) והפחתת תחלואה קרדיו-מטבולית.',
    patientInstructionHebrew: data.exerciseRegular
      ? 'המשיכי בשגרת הפעילות הגופנית המצוינת שלך: שלבי לפחות 150 דקות אירובי בשבוע עם 2–3 אימוני כוח/התנגדות לשמירה על מסת העצם, השריר, השינה ומצב הרוח.'
      : 'התחילי בהדרגה פעילות גופנית סדירה: שאפי לצבור 150 דקות בשבוע של הליכה נמרצת/שחייה/אופניים ולשלב 2–3 אימוני כוח/התנגדות בשבוע (כולל יוגה/פילאטיס לשיפור שינה, מצב רוח וצפיפות עצם).',
    sourceCitation:
      'ACOG CPG 13 (2026) pp. 16–17; IMA Preventive Medicine (2022) פרק 7 טבלה 5; Red Whale #10 (NOGG 2024)'
  });

  // 2. תזונה ים-תיכונית, סידן וויטמין D (מותאם לנתוני תזונה, שומנים, סוכר ועצם)
  const needsMetabolicNutritionFocus =
    data.nutritionQuality === 'POOR' ||
    data.medicalHistory.dyslipidemia ||
    data.medicalHistory.diabetesStatus !== 'NONE' ||
    data.medicalHistory.fattyLiverOrGallstones ||
    data.bmi >= 25;

  lifestyleItems.push({
    id: 'life_mediterranean_nutrition_bone',
    domainHebrew: 'תזונה ים-תיכונית, סידן וויטמין D',
    priority: needsMetabolicNutritionFocus || bone.riskTier !== 'LOW' ? 'HIGH' : 'ROUTINE',
    recommendationHebrew:
      'אימוץ דפוס התזונה הים-תיכונית המותאם לישראל (ירקות במגוון צבעים ≥5 מנות/יום, פירות, קטניות כולל סויה תזונתית, דגנים מלאים, שמן זית כמקור שומן עיקרי, אגוזים ודגים) והימנעות ממזון אולטרה-מעובד, משקאות ממותקים ועודף נתרן. להקפיד על צריכת סידן כוללת של 1,000–1,200 מ"ג/יום (עדיפות ממזון – מוצרי חלב מותססים/דלי-שומן, טחינה משומשום מלא, קטניות) וויטמין D במינון 800–1,000 יחב"ל/יום (במיוחד בסיכון לעצם או חסר מוכח).',
    patientInstructionHebrew:
      'תזונה ובריאות העצם: הקפידי על תזונה ים-תיכונית עשירה בירקות, קטניות, דגנים מלאים, שמן זית ודגים, צריכת סידן יומית (1,000–1,200 מ"ג מתזונה מגוונת) ותוסף ויטמין D (800–1,000 יחב"ל/יום לפי בדיקה/הנחיה).',
    sourceCitation:
      'IMA Preventive Medicine (2022) פרק 6 עמ׳ 84–89 ופרק 17 עמ׳ 192; Red Whale #10 (Osteoporosis)'
  });

  // 3. עישון – מוצג אך ורק אם המטופלת מעשנת פעילה!
  if (data.isSmoker) {
    lifestyleItems.push({
      id: 'life_smoking_cessation',
      domainHebrew: 'גמילה מעישון (עדיפות רפואית מיידית)',
      priority: 'HIGH',
      recommendationHebrew:
        'המטופלת מעשנת פעילה: עישון מקדים את גיל המנופאוזה ב-1–2 שנים, מחמיר תדירות וחומרת גלי חום (BMS 2026), מאיץ איבוד עצם ושברי צוואר ירך (NOGG 2024) ומעלה משמעותית סיכון קרדיו-וסקולרי ושבץ. יש להציע סדנת גמילה מעישון וטיפול תרופתי תומך בקופת החולים (מודל 5A’s).',
      patientInstructionHebrew:
        'הפסקת עישון: הפסקת עישון מפחיתה ישירות גלי חום והזעות לילה ומגינה על הלב, כלי הדם וצפיפות העצם – מומלץ להיעזר בסדנאות הגמילה והליווי התרופתי המסובסד בקופת החולים.',
      sourceCitation:
        'IMA Preventive Medicine (2022) פרק 10 עמ׳ 120–134; BMS Non-Hormonal Consensus (2026); Red Whale #10'
    });
  }

  // 4. אלכוהול, קפאין וניהול סביבתי של גלי חום והיגיינת שינה (מותאם אישית לצריכת אלכוהול ולתסמיני VMS/שינה)
  if (data.alcoholUnitsPerWeek > 0 || sym.hasModerateSevereVms || sym.hasSignificantSleepIssue) {
    const alcoholSpecific =
      data.alcoholUnitsPerWeek >= 7
        ? `המטופלת מדווחת על ${data.alcoholUnitsPerWeek} מנות אלכוהול בשבוע – יש להמליץ על הפחתה משמעותית: צריכת אלכוהול מעלה סיכון לסרטן השד (אין רף "בטוח" לסרטן, ומעל 14 מנות/שבוע גם סיכון לשברים) ומהווה טריגר ישיר לגלי חום ויקיצות ליליות. `
        : data.alcoholUnitsPerWeek > 0
        ? 'מומלץ לצמצם שתיית אלכוהול ככל הניתן (עלול לעורר גלי חום ולהפריע לרצף השינה, וקשור בעלייה בסיכון לסרטן שד). '
        : '';

    lifestyleItems.push({
      id: 'life_vms_sleep_triggers',
      domainHebrew: 'הפחתת טריגרים לגלי חום, אלכוהול/קפאין והיגיינת שינה',
      priority: data.alcoholUnitsPerWeek >= 7 || sym.hasModerateSevereVms || sym.hasSignificantSleepIssue ? 'HIGH' : 'ROUTINE',
      recommendationHebrew:
        `${alcoholSpecific}להקלת VMS והפרעות שינה (BMS 2026, IMA פרק 18): לבוש בשכבות קלות ונושמות, קירור חדר השינה ומאוורר ליד המיטה, הפחתת משקאות חמים/קפאין ומזון חריף בשעות הערב, ושמירה על שעות שינה קבועות ללא מסכים לפני השינה.`,
      patientInstructionHebrew:
        `${data.alcoholUnitsPerWeek > 0 ? 'הפחיתי שתיית אלכוהול ככל האפשר; ' : ''}להקלת גלי חום ושיפור השינה הקפידי על לבוש בשכבות, חדר שינה מאוורר וקריר, הימנעות מקפאין וארוחות כבדות/חריפות בערב ושעות שינה קבועות.`,
      sourceCitation:
        'BMS Non-Hormonal Consensus (2026) §Lifestyle; IMA Preventive Medicine (2022) עמ׳ 89 ופרק 18; Red Whale #07'
    });
  }

  // 5. איזון משקל מותאם אישית (רק אם BMI >= 25 או BMI < 18.5)
  if (data.bmi >= 25) {
    lifestyleItems.push({
      id: 'life_weight_management',
      domainHebrew: 'ניהול משקל והיקף מותניים',
      priority: data.bmi >= 30 ? 'HIGH' : 'ROUTINE',
      recommendationHebrew:
        `BMI נוכחי ${data.bmi}: ירידה מתונה ומבוקרת במשקל (בשילוב תזונה ים-תיכונית ואימוני התנגדות לשימור מסת שריר) מסייעת להפחתת תדירות וחומרת גלי חום (BMS 2026) ומפחיתה סיכון קרדיו-מטבולי, סיכון לרירית הרחם וסיכון לסרטן שד (השמנה בפוסט-מנופאוזה מעלה סיכון לסרטן שד בשיעור דומה או גבוה מ-MHT – Red Whale #07).`,
      patientInstructionHebrew:
        'שמירה על משקל בריא בשילוב תזונה מאוזנת וחיזוק שריר תורמת להפחתת גלי חום ולשמירה על בריאות הלב, המפרקים והשד.',
      sourceCitation:
        'BMS Non-Hormonal Consensus (2026); Red Whale #07 (HRT vs Lifestyle Breast Cancer Risk); IMA (2022) פרק 8'
    });
  } else if (data.bmi > 0 && data.bmi < 18.5) {
    lifestyleItems.push({
      id: 'life_underweight_bone',
      domainHebrew: 'תת-משקל והגנה על מסת העצם',
      priority: 'HIGH',
      recommendationHebrew:
        `BMI נמוך (${data.bmi} < 18.5) מהווה גורם סיכון מובהק לאוסטיאופורוזיס ושברי פריכות (NICE NG259 / Red Whale #10) – מומלץ ייעוץ תזונתי להעשרת קלוריות, חלבון וסידן וביצוע הערכת צפיפות עצם.`,
      patientInstructionHebrew:
        'בשל משקל גוף נמוך מומלץ ליווי תזונתי לחיזוק מסת העצם והשריר והקפדה על חלבון, סידן וויטמין D.',
      sourceCitation: 'Red Whale #10 (HRT and Osteoporosis – NICE NG259 2026)'
    });
  }

  // ===========================================================================
  // טיפולים משלימים (גוף-נפש) שהוכחו כיעילים במחקרים מבוקרים (ACOG 2026, BMS 2026, NICE 2024)
  // ===========================================================================
  const complementaryTherapies: ComplementaryTherapyOption[] = [
    {
      id: 'comp_cbt_menos',
      recommended:
        sym.hasModerateSevereVms ||
        sym.hasSignificantSleepIssue ||
        hasSignificantAnxietyOrMood ||
        gate.systemicMhtContraindicated,
      titleHebrew: 'טיפול קוגניטיבי-התנהגותי ייעודי לגיל המעבר (CBT-MENOS / CBT-I)',
      evidenceLevelHebrew: 'מומלץ בקווים המנחים (NICE 2024, BMS 2026, ACOG 2026 – מטה-אנליזות של RCTs)',
      targetSymptomsHebrew: 'מצוקת גלי חום והזעות לילה, נדודי שינה (אינסומניה), מצב רוח ירוד וחרדה',
      protocolHebrew: '4–12 מפגשים מובנים (פרונטלי, קבוצתי, טלפוני או תרגול עצמי מודרך מקוון – פרוטוקול MENOS)',
      clinicalNotesHebrew:
        'מפחית מובהקות את מידת ההפרעה של גלי החום (Hedges g 0.49), משפר איכות שינה (PSQI MD -4.2) ומפחית תסמיני דיכאון וחרדה – יעיל ובטוח לחלוטין גם במחלימות סרטן שד (מחקרי MENOS 1 & 2).',
      patientInstructionsHebrew:
        'טיפול קוגניטיבי-התנהגותי ממוקד גיל המעבר (CBT / CBT-I לשינה): 4–6 מפגשים מובנים או תוכנית מודרכת לשיפור ההתמודדות עם גלי חום, הרגעת מערכת העצבים ושיקום רצף השינה.',
      sourceCitation:
        'ACOG CPG 13 (Nov 2026) pp. 15–16; BMS Non-Hormonal Consensus (July 2026) §CBT; NICE NG23 (2024)'
    },
    {
      id: 'comp_clinical_hypnosis',
      recommended: sym.hasModerateSevereVms || gate.systemicMhtContraindicated,
      titleHebrew: 'היפנוזה קלינית (Clinical Hypnosis / היפנוזה עצמית מודרכת)',
      evidenceLevelHebrew: 'הוכחה כיעילה ב-RCTs ומומלצת ב-ACOG 2026, BMS 2026 ו-IMS/TMS',
      targetSymptomsHebrew: 'הפחתת תדירות ועוצמת גלי חום (כולל מדדים פיזיולוגיים), שיפור שינה והפחתת חרדה',
      protocolHebrew: '5 מפגשים שבועיים בני 45 דקות או תוכנית היפנוזה עצמית מודרכת בהקלטות שמע יומיות (20 דק׳/יום)',
      clinicalNotesHebrew:
        'ב-RCT מבוקר (N=187) הפחיתה תדירות גלי חום ב-74% ועוצמתם ב-80% (לעומת 17%/15% בביקורת), עם שיפור מובהק בשינה (PSQI) וחרדה; הראתה יעילות דומה לוונלפקסין/גאבאפנטין במחקרי חלוץ ויעילות מוכחת גם במחלימות סרטן שד.',
      patientInstructionsHebrew:
        'היפנוזה קלינית / היפנוזה עצמית מודרכת (אצל מטפל/ת מוסמכ/ת בהיפנוזה רפואית או בתרגול שמע יומי מודרך): הוכחה במחקרים מבוקרים להפחתה משמעותית בתדירות ובעוצמת גלי החום ולשיפור השינה.',
      sourceCitation:
        'ACOG CPG 13 (Nov 2026) pp. 17–18; BMS Non-Hormonal Consensus (July 2026) §Hypnosis'
    },
    {
      id: 'comp_mindfulness_mbi',
      recommended: sym.hasSignificantSleepIssue || hasSignificantAnxietyOrMood,
      titleHebrew: 'התערבויות מבוססות מיינדפולנס (MBIs – MBSR, תרגולי נשימה ויוגה)',
      evidenceLevelHebrew: 'מומלץ ב-ACOG 2026 ו-IMS (מטה-אנליזות של 13–19 RCTs)',
      targetSymptomsHebrew: 'הפרעות שינה בגיל המעבר, מתח (סטרס), חרדה ותסמיני דכדוך',
      protocolHebrew: 'תוכנית בת 8 שבועות (כגון MBSR, יוגה או מדיטציית קשב ותרגול נשימות יומי)',
      clinicalNotesHebrew:
        'מטה-אנליזות מדגימות שיפור מובהק באיכות השינה (SMD -0.91), הפחתת חרדה (SMD -1.03), הפחתת סטרס ושיפור מצב הרוח כטיפול משלים בטוח לצד טיפול תרופתי או לא-תרופתי.',
      patientInstructionsHebrew:
        'תרגול מיינדפולנס (MBSR), נשימות או יוגה סדירה (תוכנית של 8 שבועות): מוכח לשיפור איכות השינה ולהפחתת מתח, חרדה ותנודות מצב רוח בגיל המעבר.',
      sourceCitation: 'ACOG CPG 13 (Nov 2026) p. 16'
    },
    {
      id: 'comp_acupuncture',
      recommended: false,
      titleHebrew: 'דיקור סיני / אלקטרו-אקופונקטורה (Acupuncture / Electroacupuncture)',
      evidenceLevelHebrew: 'אפשרות משלימה מותנית (ACOG 2026, BMS 2026 – מטה-אנליזות עם הסתייגות מול דיקור-דמה)',
      targetSymptomsHebrew: 'סיוע משלים להפחתת חומרת גלי חום, נדודי שינה בפרי-מנופאוזה ומצב רוח',
      protocolHebrew: 'סדרת טיפולים אצל מטפל/ת מוסמכ/ת כטיפול משלים (Adjunctive) רב-תחומי',
      clinicalNotesHebrew:
        'במטה-אנליזות הודגמה הפחתה מתונה בחומרת VMS ושיפור בנדודי שינה ומדדי דיכאון בשילוב עם הטיפול הרפואי (אם כי ב-BMS ו-ACOG מצוין שבחלק מהניסויים מול דיקור-דמה [sham] ההבדל היה קטן). פרופיל בטיחות גבוה.',
      patientInstructionsHebrew:
        'דיקור סיני / אלקטרו-אקופונקטורה אצל מטפל/ת מוסמכ/ת: ניתן לשלב כאפשרות משלימה בטוחה להקלת גלי חום, שינה ומצב רוח.',
      sourceCitation:
        'ACOG CPG 13 (Nov 2026) pp. 18–19; BMS Non-Hormonal Consensus (July 2026) §Acupuncture'
    }
  ];

  // ===========================================================================
  // צמחי מרפא ופיטואסטרוגנים – סינון בטיחות מותאם אישית למטופלת לפי BMS 2026, NICE 2024 ו-ACOG 2026
  // ===========================================================================
  const herbalOverviewNoteHebrew =
    'עמדת הקווים המנחים (ACOG 2026, BMS July 2026, NICE 2024): בשל שונות גבוהה בהרכב התכשירים והעדר פיקוח תרופתי אחיד על תוספי תזונה, צמחי מרפא אינם מומלצים כקו טיפולי שגרתי מוביל. עם זאת, עבור מטופלת השואלת על צמחי מרפא שנחקרו להקלת גלי חום, להלן תמונת היעילות והבטיחות המותאמת אישית לתיק הרפואי שלה:';

  const interactsWithStJohnsWort =
    data.medications.takingTamoxifen ||
    data.medications.takingAromataseInhibitors ||
    data.medications.takingTherapeuticAnticoagulants ||
    data.medications.takingLamotrigine ||
    data.medications.takingEnzymeInducers ||
    data.medications.takingSsriOrSnri ||
    data.contraception.currentMethod === 'CHC_PILL_PATCH_RING' ||
    data.contraception.currentMethod === 'POP_SLYND_CERAZETTE';

  const herbalItems: HerbalBotanicalGuidanceItem[] = [
    {
      id: 'herb_black_cohosh',
      safetyStatus:
        hasBreastCaOrOncologicMeds || hasLiverIssue
          ? 'CONTRAINDICATED_FOR_PATIENT'
          : 'CAUTIOUS_OPTION',
      titleHebrew: 'קוהוש שחור (Black Cohosh – Cimicifuga / Actaea racemosa)',
      evidenceSummaryHebrew:
        'לפי BMS 2026 ו-NICE, חלק מהמחקרים הדגימו הקלה מסוימת בגלי חום בנשים ללא סרטן שד (בבחירת מיצוי מתוקנן ומפוקח בלבד; ב-ACOG 2026 מצוין כי כלל הראיות אינן אחידות).',
      safetyAndInteractionsHebrew: hasBreastCaOrOncologicMeds
        ? 'אסור למטופלת זו! לפי BMS 2026 אין להשתמש בקוהוש שחור בסרטן שד או תחת טמוקסיפן (עלול לשבש את פעילות הטמוקסיפן).'
        : hasLiverIssue
        ? 'אסור למטופלת זו! קוהוש שחור נקשר לדיווחים נדירים של פגיעה כבדית (Hepatotoxicity) ואין ליטול אותו במחלת כבד או הפרעה בתפקודי כבד.'
        : 'מותנה בבחירת תכשיר מתוקנן ומפוקח בלבד; תופעות לוואי אפשריות כוללות אי-נוחות במערכת העיכול, פריחה ודיווחים נדירים על פגיעה כבדית (להפסיק מיד בעייפות חריגה/צהבת/שתן כהה).',
      sourceCitation:
        'BMS Non-Hormonal Consensus (July 2026) §Herbal treatments; NICE NG23 (2024); ACOG CPG 13 (2026) p. 19'
    },
    {
      id: 'herb_isoflavones_red_clover',
      safetyStatus: hasBreastCaOrOncologicMeds ? 'CONTRAINDICATED_FOR_PATIENT' : 'CAUTIOUS_OPTION',
      titleHebrew: 'איזופלבונים מסויה ותלתן אדום (Soy Isoflavones & Red Clover – פיטואסטרוגנים)',
      evidenceSummaryHebrew:
        'לפי BMS 2026 ו-NICE, מחקרים בודדים הדגימו הפחתה מתונה בגלי חום עם מיצויי איזופלבונים או תלתן אדום, אך איכות המחקרים מוגבלת והתוצאות מעורבות (ACOG 2026). צריכת סויה רגילה במזון (טופו/אדממה/משקה סויה לא ממותק) בטוחה כחלק מתזונה בריאה.',
      safetyAndInteractionsHebrew: hasBreastCaOrOncologicMeds
        ? 'תוספים מרוכזים אסורים למטופלת זו! לפי BMS 2026 תוספי פיטואסטרוגנים / איזופלבונים מרוכזים ותלתן אדום אינם מומלצים לנשים עם היסטוריה של סרטן שד בשל פעילות אסטרוגנית (צריכת סויה רגילה במזון מותרת).'
        : 'תוספים מרוכזים אינם מפוקחים כתרופה והרכבם משתנה בין יצרנים; עדיף לשלב קטניות וסויה טבעית כחלק מהתזונה הים-תיכונית.',
      sourceCitation:
        'BMS Non-Hormonal Consensus (July 2026) §Isoflavones; ACOG CPG 13 (2026) p. 19; IMA (2022) עמ׳ 88'
    },
    {
      id: 'herb_st_johns_wort',
      safetyStatus:
        hasBreastCaOrOncologicMeds || interactsWithStJohnsWort
          ? 'CONTRAINDICATED_FOR_PATIENT'
          : 'AVOID_INTERACTIONS',
      titleHebrew: 'פרע מחורר / היפריקום (St John’s Wort – Hypericum perforatum)',
      evidenceSummaryHebrew:
        'במחקרים קטנים הודגמה הקלה מסוימת בגלי חום ובמצב רוח ירוד/חרדה (BMS 2026, NICE), אולם קיימת אי-ודאות לגבי המינון והתמדת ההשפעה.',
      safetyAndInteractionsHebrew:
        hasBreastCaOrOncologicMeds || data.medications.takingTamoxifen
          ? 'איסור מוחלט למטופלת זו! היפריקום הוא משרן חזק של CYP3A4 ו-P-gp, מזרז פירוק טמוקסיפן ומבטל את יעילותו האונקולוגית (BMS 2026, NICE 2024)!'
          : interactsWithStJohnsWort
          ? 'אסור לשילוב אצל מטופלת זו! היפריקום משרה בעוצמה אנזימי כבד (CYP3A4) ועלול לפגוע ביעילות התרופות הקבועות שלה (נוגדי קרישה / אנטי-אפילפטיים / אמצעי מניעה הורמונליים) או לגרום תסמונת סרוטונין עם SSRI/SNRI!'
          : 'BMS 2026 ו-Red Whale #14 מזהירים מפני שימוש במקביל ל-HRT פומי, גלולות, ויוזה/לינקואט, נוגדי קרישה או SSRI/SNRI עקב השראת CYP3A4 חזקה ואינטראקציות מסכנות.',
      sourceCitation:
        'BMS Non-Hormonal Consensus (July 2026) §St John’s Wort; Red Whale #14 (Drug Interactions); NICE NG23 (2024)'
    }
  ];

  return {
    lifestyleItems,
    complementaryTherapies,
    herbalOverviewNoteHebrew,
    herbalItems
  };
}
