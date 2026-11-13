import { Stage1Data } from './types';

export interface DrugInteractionAlert {
  drugClassHebrew: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  clinicalMechanismHebrew: string;
  actionableGuidanceHebrew: string;
}

export function detectDrugInteractions(data: Stage1Data): DrugInteractionAlert[] {
  const alerts: DrugInteractionAlert[] = [];

  // 1. אנלוגים ל-GLP-1 / GIP (סמגלוטייד / אוזמפיק / וויגובי / טירזפטייד / מונג'רו)
  if (data.takingGlp1) {
    alerts.push({
      drugClassHebrew: 'טיפול באינקרטינים (GLP-1 / GIP - אוזמפיק, וויגובי, מונג\'רו)',
      severity: 'WARNING',
      clinicalMechanismHebrew:
        'עיכוב ניכר בריקון הקיבה (Delayed Gastric Emptying) עלול לפגוע באופן משמעותי בספיגת פרוגסטרון פומי. ירידה ברמות הפרוגסטרון בדם חושפת את רירית הרחם לשגשוג (Hyperplasia) ומעלה סיכון לדימומים לא סדירים ולממאירות רירית הרחם.',
      actionableGuidanceHebrew:
        'הנחיית BMS 2025: האפשרות המועדפת היא שילוב אסטרוגן עורי עם פרוגסטוגן שאינו פומי – בדגש על התקן מירנה (52mg LNG-IUS) או מדבקה משולבת (אוורל קונטי). אם המטופלת נוטלת פרוגסטרון פומי: יש להעלות את מינון הפרוגסטרון למשך 4 שבועות עם התחלת ה-GLP-1 ולמשך 4 שבועות נוספים לאחר כל העלאת מינון, עד להתייצבות.'
    });
  }

  // 2. משרני אנזימים בכבד (Hepatic Enzyme Inducers)
  if (data.takingEnzymeInducers) {
    alerts.push({
      drugClassHebrew: 'משרני אנזימים כבדיים (קרבמזפין, פניטואין, ריפמפיצין, היפריקום / St. John\'s Wort)',
      severity: 'WARNING',
      clinicalMechanismHebrew:
        'השריית אנזימי CYP3A4 מאיצה את פירוק האסטרוגן והפרוגסטוגן בכבד, מה שמוביל לתת-רמות בדם, כישלון טיפולי ודימומי פריצה.',
      actionableGuidanceHebrew:
        'מומלץ להעדיף מתן עורי של אסטרוגן ולהשתמש בהתקן מירנה (52mg IUS) או להעלות את מינון הפרוגסטוגן הפומי/הסדרתי להבטחת הגנה מלאה על רירית הרחם.'
    });
  }

  // 3. טמוקסיפן ומעכבי ארומטאז (Tamoxifen / Aromatase Inhibitors)
  if (data.takingTamoxifenOrAIs) {
    alerts.push({
      drugClassHebrew: 'טמוקסיפן או מעכבי ארומטאז (לטרוזול / אנסטרוזול)',
      severity: 'CRITICAL',
      clinicalMechanismHebrew:
        'מטופלות אלו נמצאות בסיכון גבוה במיוחד לחזרת סרטן שד תלוי הורמונים. מתן טיפול הורמונלי סיסטמי (MHT/HRT) הינו התווית נגד מוחלטת.',
      actionableGuidanceHebrew:
        'איסור על מתן HRT סיסטמי. יש להפנות לטיפולים לא-הורמונליים מאושרים: Veoza (Fezolinetant), ונלפקסין (Venlafaxine 37.5–75mg - בטוח עם טמוקסיפן, אין להשתמש בפרוקסטין המעכב CYP2D6!), גבפנטין או CBT לגלי חום.'
    });
  }

  // 4. אלטרוקסין (Levothyroxine)
  if (data.takingLevothyroxine) {
    alerts.push({
      drugClassHebrew: 'אלטרוקסין / יוטירוקס (Levothyroxine)',
      severity: 'INFO',
      clinicalMechanismHebrew:
        'אסטרוגן פומי (בשל מעבר כבדי ראשון) מעלה את רמות החלבון הקושר TBG (Thyroxine-Binding Globulin), מה שעלול להוריד את רמות התירוקסין החופשי ולדרוש העלאת מינון אלטרוקסין.',
      actionableGuidanceHebrew:
        'מתן עורי (ג\'ל / מדבקות) אינו משפיע כמעט על TBG ולכן עדיף. אם נבחר מתן פומי, יש לבדוק רמות TSH כ-6–8 שבועות לאחר התחלת האסטרוגן ולבצע התאמת מינון במידת הצורך.'
    });
  }

  return alerts;
}
