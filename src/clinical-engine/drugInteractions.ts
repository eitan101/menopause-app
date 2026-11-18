import { Stage1Data } from './types';

export interface DrugInteractionAlert {
  id: string;
  drugName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  mechanism: string;
  clinicalAction: string;
  forcesTransdermalEstrogen?: boolean;
  blocksUtrogestan?: boolean;
  blocksAngeliq?: boolean;
  blocksParoxetineFluoxetine?: boolean;
}

export function checkDrugInteractions(data: Stage1Data): DrugInteractionAlert[] {
  const alerts: DrugInteractionAlert[] = [];
  const { medications, medicalHistory } = data;

  // 1. אגוניסטים ל-GLP-1 / GIP (אוזמפיק, וויגובי, מונג'רו, סקסנדה)
  if (medications.takingGlp1) {
    alerts.push({
      id: 'glp1',
      drugName: `זריקות GLP-1 / GIP${medications.glp1DrugDetails ? ` (${medications.glp1DrugDetails})` : ' (Ozempic / Wegovy / Mounjaro)'}`,
      severity: 'HIGH',
      mechanism:
        'עיכוב ריקון הקיבה מפחית ומשבש את ספיגת ההורמונים הפומיים, ובמיוחד פרוגסטרון פומי – סיכון לתת-הגנה על רירית הרחם ולדימומים בלתי צפויים (BMS 2025).',
      clinicalAction: medications.glp1RecentInitOrDoseEscalation
        ? 'התחלה או העלאת מינון לאחרונה! מומלץ להעדיף התקן מירנה או מדבקה משולבת (Evorel Conti / Sequidot), או לחלופין להעלות זמנית את מינון הפרוגסטוגן הפומי למשך 4 שבועות מכל תחילת טיפול / עליית מינון ב-GLP-1.'
        : 'מומלץ להעדיף אסטרדיול עורי ולהבטיח הגנת רירית שאינה תלויה בספיגה גסטרואינטסטינלית (מירנה 52 מ"ג או מדבקה משולבת), או לתגבר פרוגסטוגן פומי ב-4 שבועות סביב כל עליית מינון ב-GLP-1.',
      forcesTransdermalEstrogen: true
    });
  }

  // 2. למוטריג'ין (Lamictal / Lamotrigine)
  if (medications.takingLamotrigine) {
    alerts.push({
      id: 'lamotrigine',
      drugName: 'למוטריג׳ין (Lamotrigine / Lamictal)',
      severity: 'CRITICAL',
      mechanism:
        'אסטרוגן פומי משרה גלוקורונידציה כבדית ומוריד את רמות הלמוטריג׳ין בדם בעד 50% – סכנה להתקפי פרכוס (Breakthrough Seizures) או יציאה מאיזון רגשי!',
      clinicalAction:
        'איסור על אסטרוגן פומי! יש לבחור אסטרדיול עורי בלבד (ג׳ל או מדבקה) ולנטר רמות למוטריג׳ין בדם בתיאום נוירולוג/פסיכיאטר לאחר התחלה או הפסקה.',
      forcesTransdermalEstrogen: true
    });
  }

  // 3. משרני אנזימי כבד (CYP3A4 Inducers)
  if (medications.takingEnzymeInducers) {
    alerts.push({
      id: 'enzyme_inducers',
      drugName: `משרני אנזימי כבד CYP3A4${medications.enzymeInducerDetails ? ` (${medications.enzymeInducerDetails})` : ' (Carbamazepine / Phenytoin / Topiramate / Rifampicin / היפריקום)'}`,
      severity: 'HIGH',
      mechanism:
        'האצת פירוק כבדי של אסטרוגן ופרוגסטוגן (במיוחד במתן פומי אך במידה מסוימת גם עורי) – סכנה לחוסר יעילות ולדימום/היפרפלזיה.',
      clinicalAction:
        'מומלץ בחום התקן מירנה 52 מ"ג להגנה מקומית ישירה על רירית הרחם (אינו מושפע מאנזימי כבד!), בשילוב אסטרדיול עורי בטיטרציה לפי תגובה קלינית.',
      forcesTransdermalEstrogen: true
    });
  }

  // 4. טמוקסיפן (Tamoxifen) + חסימת CYP2D6!
  if (medications.takingTamoxifen) {
    alerts.push({
      id: 'tamoxifen',
      drugName: 'טמוקסיפן (Tamoxifen)',
      severity: 'CRITICAL',
      mechanism:
        'טיפול אנדוקריני פעיל בסרטן שד: MHT סיסטמי אסור. בנוסף, מעכבי CYP2D6 חזקים (Paroxetine / Paxxet ו-Fluoxetine / Prozac) חוסמים את הפיכת הטמוקסיפן למטבוליט הפעיל Endoxifen ועלולים לפגוע ביעילות האונקולוגית!',
      clinicalAction:
        medications.takingCyp2d6InhibitorParoxetineFluoxetine
          ? 'אזהרה קריטית פעילה: המטופלת נוטלת Paroxetine/Fluoxetine במקביל לטמוקסיפן! יש להחליף מיד לונלפקסין (Venlafaxine), אציטלופרם (Cipralex) או ציטלופרם בתיאום, או לשקול גאבאפנטין/CBT (ויוזה נחקרת – לבדוק התוויות יצרן ותפקודי כבד).'
          : 'לגלי חום תחת טמוקסיפן: אין לרשום פרוקסטין או פלואוקסטין! קו הבחירה התרופתי הוא Venlafaxine (37.5–75 מ"ג) או Escitalopram (10–20 מ"ג), Gabapentin או Oxybutynin, ול-GSM לחות נרתיקית תחילה.',
      blocksParoxetineFluoxetine: true
    });
  }

  // 5. מעכבי ארומטאז (Letrozole, Anastrozole, Exemestane)
  if (medications.takingAromataseInhibitors) {
    alerts.push({
      id: 'aromatase_inhibitors',
      drugName: 'מעכבי ארומטאז (Letrozole / Anastrozole / Exemestane)',
      severity: 'CRITICAL',
      mechanism:
        'מעכבי ארומטאז פועלים לדיכוי מוחלט של סינתזת אסטרוגן היקפית; MHT סיסטמי אסור, ואף ספיגה מערכתית מזערית מאסטרוגן נרתיקי מחייבת אישור אונקולוגי.',
      clinicalAction:
        'ל-VMS: טיפול לא-הורמונלי (ונלפקסין, אציטלופרם, גאבאפנטין, אוקסיבוטינין, CBT) + מעקב צפיפות עצם (DXA). ל-GSM: תכשירי לחות וחומצה היאלורונית תחילה; במקרים עמידים וקשים – דיון מתועד עם האונקולוג/ית (לעיתים אסטריול אולטרה-נמוך / Imvaggis או מעבר לטמוקסיפן).'
    });
  }

  // 6. אלטרוקסין / יותירוקס ודיכוי TSH המחקה גיל מעבר
  if (medications.takingLevothyroxine || (medications.recentTshLevel !== undefined && medications.recentTshLevel < 0.4)) {
    if (medications.recentTshLevel !== undefined && medications.recentTshLevel < 0.4) {
      alerts.push({
        id: 'tsh_suppressed',
        drugName: `ערכי TSH מדוכאים (${medications.recentTshLevel} mIU/L < 0.4)`,
        severity: 'HIGH',
        mechanism:
          'יתר פעילות בלוטת התריס (ספונטנית או ממינון-יתר של Levothyroxine) מחקה במדויק גלי חום, הזעות, דפיקות לב, חרדה, נדודי שינה ואיבוד עצם (מקרה קליני קלאסי – ד"ר סרבניק)!',
        clinicalAction:
          'יש לאזן תחילה את מינון ה-Levothyroxine / בירור התריס לפני ייחוס כל התסמינים למנופאוזה. אם ניתן אסטרוגן – להעדיף מתן עורי שאינו משנה רמות TBG.'
      });
    } else if (medications.takingLevothyroxine) {
      alerts.push({
        id: 'levothyroxine',
        drugName: 'לבותירוקסין (Eltroxin / Euthyrox / Synthroid)',
        severity: 'MODERATE',
        mechanism:
          'אסטרוגן פומי מעלה ייצור כבדי של חלבון קושר תירוקסין (TBG), מקטין T4 חופשי ועשוי לדרוש העלאת מינון לבותירוקסין.',
        clinicalAction:
          'מומלץ להעדיף אסטרדיול עורי (אינו מעלה TBG!). אם נבחר אסטרוגן פומי – חובה לבדוק TSH חוזר כעבור 6–12 שבועות מתחילת הטיפול או משינוי מינון.',
        forcesTransdermalEstrogen: false
      });
    }
  }

  // 7. מעכבי ACE / ARB / משתנים משמרי אשלגן או מחלת כליות כרונית / כליה בודדת -> חסימת אנג'ליק (Drospirenone)
  if (medications.takingAceArbOrPotassiumSparing || medicalHistory.chronicKidneyDiseaseOrSolitaryKidney) {
    alerts.push({
      id: 'angeliq_hyperkalemia',
      drugName: medicalHistory.chronicKidneyDiseaseOrSolitaryKidney
        ? 'אי-ספיקת כליות (CKD) / כליה בודדת'
        : 'מעכבי ACE / ARB / ספירונולקטון / משמרי אשלגן',
      severity: medicalHistory.chronicKidneyDiseaseOrSolitaryKidney ? 'HIGH' : 'MODERATE',
      mechanism:
        'דרוספירנון (המרכיב הפרוגסטוגני ב-Angeliq) הוא אנלוג של ספירונולקטון בעל פעילות אנטי-מינרלוקורטיקואידית ועלול לגרום להיפרקלמיה.',
      clinicalAction: medicalHistory.chronicKidneyDiseaseOrSolitaryKidney
        ? 'יש להימנע מתכשיר Angeliq באי-ספיקת כליות / כליה בודדת! להשתמש באסטרדיול עורי + אוטרוגסטן / מירנה / דופסטון.'
        : 'מומלץ להימנע מ-Angeliq או לבדוק אשלגן וקריאטינין בדם כעבור 2–4 שבועות אם נבחר.',
      blocksAngeliq: medicalHistory.chronicKidneyDiseaseOrSolitaryKidney
    });
  }

  // 8. נוגדי קרישה טיפוליים (DOACs / קומדין)
  if (medications.takingTherapeuticAnticoagulants) {
    alerts.push({
      id: 'anticoagulants',
      drugName: 'נוגדי קרישה טיפוליים (Apixaban / Rivaroxaban / Warfarin / Clexane)',
      severity: 'HIGH',
      mechanism: 'רקע פקקתי/קרדיאלי פעיל או כרוני; אסטרוגן פומי מעלה פקטורי קרישה כבדיים.',
      clinicalAction:
        'איסור על אסטרוגן פומי. בהיעדר VTE חריף פעיל ניתן לשקול בתיאום המטולוגי אסטרדיול עורי (מדבקה/ג׳ל) + פרוגסטרון מיקרוני/מירנה (שיכולה גם להפחית דימום ווסתי כבד תחת נוגדי קרישה!).',
      forcesTransdermalEstrogen: true
    });
  }

  // 9. אלרגיה לבוטנים או סויה -> התווית נגד לאוטרוגסטן!
  if (medicalHistory.peanutOrSoyAllergy) {
    alerts.push({
      id: 'peanut_soy_utrogestan',
      drugName: 'אלרגיה לבוטנים / סויה (התווית נגד ל-Utrogestan!)',
      severity: 'CRITICAL',
      mechanism:
        'כמוסות אוטרוגסטן (Utrogestan 100/200 מ"ג) מכילות לציטין סויה עם תגובתיות צולבת לבוטנים – אסורות לחלוטין ברגישות לבוטנים או סויה!',
      clinicalAction:
        'אין לרשום אוטרוגסטן (לא פומי ולא נרתיקי)! חלופות בטוחות להגנת הרירית: דופסטון (Duphaston / Dydrogesterone), התקן מירנה 52 מ"ג, או מדבקות משולבות עם NETA (Evorel Conti / Evorel Sequi).',
      blocksUtrogestan: true
    });
  }

  // 10. רגישות עורית לדבק מדבקות
  if (medicalHistory.patchAdhesiveSensitivity) {
    alerts.push({
      id: 'patch_allergy',
      drugName: 'רגישות עורית לדבק מדבקות (Contact Dermatitis)',
      severity: 'MODERATE',
      mechanism: 'דרמטיטיס מקומית מדבק מטריצת המדבקה העלולה לפגוע בהיענות ובספיגה.',
      clinicalAction:
        'במתן עורי יש להעדיף ג׳ל אסטרדיול יומי (Estrogel או Sandrena) על פני מדבקות Evorel / Estro.'
    });
  }

  // 11. בריאטריה / תת-ספיגה במערכת העיכול
  if (medicalHistory.malabsorptionOrBariatricSurgery) {
    alerts.push({
      id: 'malabsorption_bariatric',
      drugName: 'ניתוח בריאטרי / תת-ספיגה במעי (צליאק פעיל / IBD)',
      severity: 'HIGH',
      mechanism: 'ספיגה פומית בלתי צפויה של אסטרוגן ופרוגסטוגן דרך מערכת העיכול.',
      clinicalAction:
        'חובה להעדיף מתן עורי של אסטרוגן (ג׳ל / מדבקה) והגנת רירית באמצעות התקן מירנה או מדבקה משולבת עורית.',
      forcesTransdermalEstrogen: true
    });
  }

  return alerts;
}
