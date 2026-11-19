import { evaluateCompletenessGate } from '../completenessGate';
import { checkDrugInteractions } from '../drugInteractions';
import { calculateAhaPreventRisk, calculateVteRisk } from '../riskCalculators';
import { Stage1Data } from '../types';

export interface IsraeliDrugItem {
  id: string;
  brandName: string;
  hebrewName: string;
  category:
    | 'ESTROGEN_TRANSDERMAL'
    | 'ESTROGEN_ORAL'
    | 'PROGESTOGEN'
    | 'COMBINED_TRANSDERMAL'
    | 'COMBINED_ORAL'
    | 'TSEC_TIBOLONE'
    | 'LOCAL_GSM_NON_HORMONAL'
    | 'LOCAL_GSM_HORMONAL'
    | 'TESTOSTERONE_HSDD'
    | 'NON_HORMONAL_VMS';
  activeIngredients: string;
  route: 'TRANSDERMAL_GEL' | 'TRANSDERMAL_PATCH' | 'ORAL' | 'INTRAUTERINE' | 'VAGINAL' | 'BEHAVIORAL';
  dosingSchedule: string;
  proportionalTierNote?: string;
  clinicalAdvantages: string;
  cautionsAndContraindications: string;
}

export const ISRAELI_DRUG_ARSENAL: IsraeliDrugItem[] = [
  // --- אסטרוגן עורי (ג'ל ומדבקות) ---
  {
    id: 'estrogel',
    brandName: 'Estrogel 0.06% Pump',
    hebrewName: 'אסטרוג׳ל (ג׳ל אסטרדיול במשאבה)',
    category: 'ESTROGEN_TRANSDERMAL',
    activeIngredients: '17β-Estradiol (0.75 מ"ג אסטרדיול בכל לחיצה מדודה של 1.25 גרם ג׳ל)',
    route: 'TRANSDERMAL_GEL',
    dosingSchedule:
      'מריחה יומית על עור נקי ויבש (זרועות חיצוניות מכתף עד שורש כף יד או ירכיים פנימיות – לעולם לא על השדיים!): 1 לחיצה (0.75 מ"ג – נמוך), 2 לחיצות (1.5 מ"ג – תקני), 3–4 לחיצות (2.25–3.0 מ"ג – בינוני-גבוה ב-POI/RRSO).',
    proportionalTierNote:
      'לחיצה 1–2: Utrogestan 100 מ"ג רציף / 200 מ"ג ציקלי; ב-3–4 לחיצות: חובה להעלות פרוגסטוגן ל-Utrogestan 200 מ"ג רציף / 300 מ"ג ציקלי או מירנה!',
    clinicalAdvantages:
      'זהב בטיחותי: עוקף מעבר ראשון בכבד – ללא עליית סיכון ל-VTE או שבץ; גמישות טיטרציה מצוינת וללא גירוי מדבק מדבקה.',
    cautionsAndContraindications:
      'להמתין 5 דקות לייבוש ו-60 דקות ממגע עור-בעור או רחצה; ברחם שמור חובה לשלב פרוגסטוגן מותאם מינון.'
  },
  {
    id: 'sandrena',
    brandName: 'Sandrena 0.5mg / 1mg Sachets',
    hebrewName: 'סנדרנה (שקיקי ג׳ל אסטרדיול חד-יומיים)',
    category: 'ESTROGEN_TRANSDERMAL',
    activeIngredients: '17β-Estradiol hemihydrate 0.5mg / 1.0mg',
    route: 'TRANSDERMAL_GEL',
    dosingSchedule:
      'שקיק יומי אחד על עור הבטן התחתונה או הירך (שטח בגודל 1–2 כפות ידיים): 0.5 מ"ג (נמוך), 1.0 מ"ג (תקני), 1.5–2.0 מ"ג (גבוה).',
    proportionalTierNote: 'במינון >1.5 מ"ג ליום יש להכפיל מינון פרוגסטרון מיקרוני (200 מ"ג רציף / 300 מ"ג ציקלי) או מירנה.',
    clinicalAdvantages: 'מנה ארוזה ומדויקת לנסיעות, ספיגה עורית נקייה ללא השפעה על קרישה, TG או TBG.',
    cautionsAndContraindications: 'אין למרוח על השדיים או הריריות; ברחם שמור חובה פרוגסטוגן.'
  },
  {
    id: 'evorel_patch',
    brandName: 'Evorel 25 / 50 / 75 / 100 (Estro)',
    hebrewName: 'מדבקות אוורל (25 / 50 / 75 / 100 מק"ג/יממה)',
    category: 'ESTROGEN_TRANSDERMAL',
    activeIngredients: '17β-Estradiol transdermal matrix patch',
    route: 'TRANSDERMAL_PATCH',
    dosingSchedule:
      'הדבקה מתחת לקו המותניים (ישבן/ירך עליונה) והחלפה פעמיים בשבוע בימים קבועים: 25 מק"ג (נמוך), 50 מק"ג (תקני), 75–100 מק"ג (בינוני-גבוה ל-POI/מנופאוזה מוקדמת).',
    proportionalTierNote:
      'ב-Evorel 75–100 חובה להעלות פרוגסטוגן באופן יחסי (Utrogestan 200 מ"ג רציף / 300 מ"ג ל-12 יום או מירנה 52 מ"ג)!',
    clinicalAdvantages: 'רמות אסטרדיול יציבות לאורך היממה (יתרון מצוין במיגרנה ובשינויי מצב רוח) וללא סיכון VTE.',
    cautionsAndContraindications: 'יתכן גירוי מקומי מהדבק; עלולה להתרופף בהזעה מרובה/ג׳קוזי.'
  },

  // --- אסטרוגן פומי ---
  {
    id: 'estrofem',
    brandName: 'Estrofem 1mg / 2mg',
    hebrewName: 'אסטרופם (טבליות אסטרדיול פומי)',
    category: 'ESTROGEN_ORAL',
    activeIngredients: '17β-Estradiol 1mg / 2mg',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום ברצף (1 מ"ג מינון רגיל-נמוך, 2 מ"ג מינון תקני-גבוה).',
    proportionalTierNote: 'ב-Estrofem 2mg ברחם שמור יש לתת פרוגסטוגן במינון מוגבר (Utrogestan 200 מ"ג רציף / 300 מ"ג ציקלי) או מירנה.',
    clinicalAdvantages: 'נוחות נטילה יומית פומית ושיפור פרופיל LDL/HDL באישה צעירה ובריאה ללא גורמי סיכון פקקתיים.',
    cautionsAndContraindications:
      'עובר מעבר ראשון בכבד: אסור בסיכון VTE, השמנה משמעותית, מיגרנה עם אאורה, היפרטריגליצרידמיה, למוטריג׳ין (מוריד רמה ב-50%!) ומעלה TBG תחת אלטרוקסין.'
  },
  {
    id: 'progynova',
    brandName: 'Progynova 2mg',
    hebrewName: 'פרוגינובה (אסטרדיול ולראט 2 מ"ג)',
    category: 'ESTROGEN_ORAL',
    activeIngredients: 'Estradiol Valerate 2mg (שקול ל-~1.5 מ"ג 17β-Estradiol)',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום (ברחם כרות, או בשילוב פרוגסטוגן מתאים ברחם שמור).',
    clinicalAdvantages: 'חלופה פומית זמינה בישראל של אסטרדיול ולראט.',
    cautionsAndContraindications: 'זהות לאסטרופם (מעבר ראשון בכבד – להימנע בסיכון VTE/כבד/למוטריג׳ין).'
  },

  // --- פרוגסטוגנים להגנה על רירית הרחם ---
  {
    id: 'utrogestan',
    brandName: 'Utrogestan 100mg / 200mg',
    hebrewName: 'אוטרוגסטן (פרוגסטרון מיקרוני זהה-ביולוגית)',
    category: 'PROGESTOGEN',
    activeIngredients: 'Micronized Progesterone (Body-Identical)',
    route: 'ORAL',
    dosingSchedule:
      'נטילה לפני השינה על קיבה ריקה: במשטר רציף (ccHRT) 100 מ"ג כל ערב (או 200 מ"ג במינון E2 גבוה); במשטר ציקלי (sHRT) 200 מ"ג ל-12–14 יום בחודש (או 300 מ"ג במינון E2 גבוה).',
    clinicalAdvantages:
      'פרוגסטוגן הבחירה (Gold Standard): הפרופיל הבטוח ביותר לשד (ב-5 השנים הראשונות), ניטרלי לחלוטין לקרישה ולליפידים, ובעל אפקט מרגיע ומשפר שינה (GABA-A)!',
    cautionsAndContraindications:
      'התווית נגד מוחלטת באלרגיה לבוטנים או סויה (לציטין סויה בכמוסה)! עלול לגרום ישנוניות/סחרחורת בבוקר; ספיגה פומית נפגעת תחת GLP-1.'
  },
  {
    id: 'duphaston',
    brandName: 'Duphaston 10mg',
    hebrewName: 'דופסטון (דידרוגסטרון 10 מ"ג)',
    category: 'PROGESTOGEN',
    activeIngredients: 'Dydrogesterone 10mg',
    route: 'ORAL',
    dosingSchedule: '10 מ"ג ליום במשטר רציף או 10–20 מ"ג ל-14 יום בחודש במשטר ציקלי (או כחלק מ-Femoston).',
    clinicalAdvantages:
      'פרוגסטוגן רטרו-סטרואידי בעל פרופיל בטיחות מצוין לשד ולקרישה (קרוב לפרוגסטרון מיקרוני), אינו מרדים ובטוח לחלוטין באלרגיה לבוטנים/סויה!',
    cautionsAndContraindications: 'ספיגה פומית עלולה להיפגע תחת זריקות GLP-1.'
  },
  {
    id: 'mirena',
    brandName: 'Mirena 52mg IUS',
    hebrewName: 'התקן תוך-רחמי מירנה (52 מ"ג לבונורגסטרל)',
    category: 'PROGESTOGEN',
    activeIngredients: 'Levonorgestrel 52mg Intrauterine System',
    route: 'INTRAUTERINE',
    dosingSchedule:
      'תוקף להגנה על רירית הרחם כחלק מ-MHT: 5 שנים בדיוק! (גם אם למניעת הריון לבד מאושר עד 8 שנים – ב-MHT חובה להחליף כעבור 5 שנים).',
    clinicalAdvantages:
      'פתרון אידיאלי בפרי-מנופאוזה: מספק בו-זמנית אמצעי מניעה יעיל, שליטה בדימומים כבדים (HMB), והגנת רירית מעולה שאינה תלויה בהיענות יומית, ב-GLP-1 או באנזימי כבד!',
    cautionsAndContraindications:
      'לפי Red Whale קיימת ספיגה סיסטמית קלה עם עלייה קטנה בסיכון לסרטן שד בדומה לפרוגסטינים פומיים. Kyleena/Jaydess אינם מאושרים להגנת רירית ב-MHT!'
  },

  // --- תכשירים משולבים קבועים (מדבקות וטבליות) ---
  {
    id: 'evorel_conti_sequi',
    brandName: 'Evorel Conti / Evorel Sequi',
    hebrewName: 'אוורל קונטי (רציף) / אוורל סקווי (ציקלי)',
    category: 'COMBINED_TRANSDERMAL',
    activeIngredients: 'Estradiol 50mcg + Norethisterone Acetate (NETA) 170mcg',
    route: 'TRANSDERMAL_PATCH',
    dosingSchedule: 'החלפת מדבקה פעמיים בשבוע מתחת לקו המותניים (Sequi בפרי-מנופאוזה, Conti בפוסט-מנופאוזה >12 חודשים).',
    clinicalAdvantages:
      'מדבקה אחת משולבת (עוקפת כבד ו-GLP-1!), ללא צורך בנטילת כדור פרוגסטרון יומי וללא רכיב סויה/בוטנים.',
    cautionsAndContraindications: 'מכילה פרוגסטין סינתטי (NETA); מינון קבוע שאינו מתאים למי שזקוקה לטיטרציית E2 נפרדת.'
  },
  {
    id: 'femoston_family',
    brandName: 'Femoston 1/10, 2/10 & Femoston Conti 1/5, 0.5/2.5',
    hebrewName: 'משפחת פמוסטון / פמוסטון קונטי',
    category: 'COMBINED_ORAL',
    activeIngredients: '17β-Estradiol + Dydrogesterone',
    route: 'ORAL',
    dosingSchedule:
      'טבליה אחת ביום ללא הפסקה: Femoston 1/10 או 2/10 (ציקלי לפרי-מנופאוזה/POI); Femoston Conti 1/5 או 0.5/2.5 (רציף לפוסט-מנופאוזה).',
    clinicalAdvantages:
      'התכשיר הפומי המשולב המועדף בזכות דידרוגסטרון (פרופיל מטבולי ושד נוח יותר מ-NETA, ללא אלרגיית בוטנים/סויה, כולל מינון Ultra-Low 0.5/2.5).',
    cautionsAndContraindications: 'אסטרוגן פומי – להימנע בסיכון VTE גבוה, BMI ≥30, מיגרנה עם אאורה או למוטריג׳ין.'
  },
  {
    id: 'activelle_eviana_novofem',
    brandName: 'Activelle (1/0.5) / Eviana (0.5/0.1) / Novofem (1/1)',
    hebrewName: 'אקטיבל / אוויאנה (רציף) / נובופם (ציקלי)',
    category: 'COMBINED_ORAL',
    activeIngredients: '17β-Estradiol + Norethisterone Acetate (NETA)',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום (Eviana מינון אולטרה-נמוך 0.5 מ"ג; Activelle 1 מ"ג רציף; Novofem ציקלי).',
    clinicalAdvantages: 'שליטה מצוינת בדימומים בפוסט-מנופאוזה (NETA מייצב היטב את הרירית); Eviana מאפשרת מינון פומי אולטרה-נמוך.',
    cautionsAndContraindications: 'מתן פומי + פרוגסטין סינתטי (NETA) – אינו קו ראשון בסיכון VTE/קרדיו-וסקולרי.'
  },
  {
    id: 'angeliq',
    brandName: 'Angeliq (1mg / 2mg)',
    hebrewName: 'אנג׳ליק (אסטרדיול 1 מ"ג + דרוספירנון 2 מ"ג)',
    category: 'COMBINED_ORAL',
    activeIngredients: '17β-Estradiol 1mg + Drospirenone 2mg',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום במשטר רציף (פוסט-מנופאוזה).',
    clinicalAdvantages: 'פעילות אנטי-מינרלוקורטיקואידית ואנטי-אנדרוגנית המפחיתה אגירת נוזלים/נפיחות ותורמת לירידה קלה בל"ד.',
    cautionsAndContraindications:
      'אסור באי-ספיקת כליות / כליה בודדת / אי-ספיקת אדרנל! זהירות ומעקב אשלגן וקריאטינין בשילוב ACEi / ARB / ספירונולקטון.'
  },
  {
    id: 'duavive',
    brandName: 'Duavive (TSEC)',
    hebrewName: 'דואביב (ללא פרוגסטוגן – TSEC)',
    category: 'TSEC_TIBOLONE',
    activeIngredients: 'Conjugated Estrogens 0.45mg + Bazedoxifene 20mg',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום בפוסט-מנופאוזה (>12 חודשים מהווסת האחרונה).',
    clinicalAdvantages:
      'פתרון ייחודי לאישה עם רחם שמור ואי-סבילות קשה לכל הפרוגסטוגנים או רגישות שד – בזדוקסיפן מגן על הרירית והשד!',
    cautionsAndContraindications: 'מתן פומי (SERM + אסטרוגן) – אסור בסיכון VTE מוגבר.'
  },
  {
    id: 'livial',
    brandName: 'Livial (Tibolone 2.5mg)',
    hebrewName: 'ליביאל (טיבולון 2.5 מ"ג)',
    category: 'TSEC_TIBOLONE',
    activeIngredients: 'Tibolone 2.5mg (STEAR)',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום בפוסט-מנופאוזה (>12 חודשים מהווסת האחרונה).',
    clinicalAdvantages: 'משפר גלי חום, צפיפות עצם וחשק מיני הודות לפעילות אנדרוגנית קלה ללא דימום.',
    cautionsAndContraindications:
      'אין להתחיל מעל גיל 60 (עלייה בסיכון לשבץ מוחי), אסור בסיכון VTE ואסור לאחר סרטן שד!'
  },

  // --- טיפולים לא-הורמונליים סיסטמיים ---
  {
    id: 'veoza',
    brandName: 'Veoza 45mg (Fezolinetant)',
    hebrewName: 'ויוזה 45 מ"ג (פזולינטנט – חוסם קולטן NK3)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Fezolinetant 45mg (Selective Neurokinin-3 Receptor Antagonist)',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת של 45 מ"ג פעם ביום בשעה קבועה (עם או בלי אוכל).',
    clinicalAdvantages:
      'תרופה לא-הורמונלית ייעודית הפועלת ישירות על מרכז ויסות החום בהיפותלמוס (נוירוני KNDy) עם הפחתה מהירה ומרשימה בגלי חום כבר מהשבוע הראשון!',
    cautionsAndContraindications:
      'אזהרת כבד מעודכנת (EMA / משרד הבריאות 2025): חובה בדיקת ALT, AST ובילירובין לפני התחלה (אין להתחיל אם ALT/AST ≥ 2x ULN או בילירובין מוגבר!), ומעקב בחודשים 1, 2, 3, 6 ו-9!'
  },
  {
    id: 'lynkuet',
    brandName: 'Lynkuet 120mg (Elinzanetant)',
    hebrewName: 'לינקואט 120 מ"ג (אלינזנטנט – חוסם כפול NK1/NK3)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Elinzanetant 120mg (2 x 60mg soft capsules – Dual NK1/NK3 Antagonist)',
    route: 'ORAL',
    dosingSchedule: '2 כמוסות של 60 מ"ג (120 מ"ג) פעם ביום לפני השינה (אושר גם תחת טיפול אנדוקריני בסרטן שד – OASIS-4).',
    clinicalAdvantages:
      'חסימה כפולה של NK3 (גלי חום) ו-NK1 (שינה): מפחית משמעותית גלי חום ומשפר איכות שינה ללא פעילות הורמונלית.',
    cautionsAndContraindications:
      'בדיקת תפקודי כבד בביקור הבסיס וכעבור 3 חודשים; אינטראקציות CYP3A4.'
  },
  {
    id: 'venlafaxine_escitalopram',
    brandName: 'Venlafaxine XR (37.5–75mg) / Escitalopram (10–20mg)',
    hebrewName: 'ונלפקסין (SNRI) / אציטלופרם – ציפרלקס (SSRI)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Venlafaxine XR 37.5–75mg OR Escitalopram 10–20mg / Citalopram 10–20mg',
    route: 'ORAL',
    dosingSchedule: 'פעם ביום במינון נמוך (השפעה על VMS תוך 2–4 שבועות).',
    clinicalAdvantages:
      'קו ראשון מוכח ובטוח במטופלות סרטן שד הנוטלות טמוקסיפן (אינם מעכבים CYP2D6!), ומשפרים במקביל חרדה ותנודות מצב רוח.',
    cautionsAndContraindications:
      'תחת טמוקסיפן חל איסור מוחלט לרשום Paroxetine או Fluoxetine! בוונלפקסין לעקוב אחר ל"ד.'
  },
  {
    id: 'gabapentin_oxybutynin',
    brandName: 'Gabapentin (300–900mg) / Oxybutynin (2.5–5mg)',
    hebrewName: 'גאבאפנטין (לילה) / אוקסיבוטינין (נוביטרופן)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Gabapentin 300–900mg nocte OR Oxybutynin 2.5–5mg',
    route: 'ORAL',
    dosingSchedule: 'גאבאפנטין לפני השינה בטיטרציה הדרגתית; אוקסיבוטינין 2.5–5 מ"ג.',
    clinicalAdvantages:
      'גאבאפנטין מצוין להזעות לילה קשות והפרעות שינה (בטוח בטמוקסיפן); אוקסיבוטינין יעיל להזעת יתר ולדחיפות במתן שתן.',
    cautionsAndContraindications:
      'גאבאפנטין: סחרחורת/נמנום; אוקסיבוטינין: יובש בפה ולהימנע מעל גיל 65 (עומס אנטי-כולינרגי).'
  },
  {
    id: 'cbt_hypnosis',
    brandName: 'CBT (MENOS Protocol) & Clinical Hypnosis',
    hebrewName: 'טיפול קוגניטיבי-התנהגותי ייעודי (CBT-MENOS) והיפנוזה קלינית',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'פרוטוקול מובנה בן 4–6 מפגשים + התאמות אורח חיים',
    route: 'BEHAVIORAL',
    dosingSchedule: 'תוכנית בת 4–6 שבועות (פרונטלית או עצמית מודרכת).',
    clinicalAdvantages: 'מפחית ב-50% את מידת ההפרעה התפקודית של גלי החום ומשפר שינה – אפס תופעות לוואי.',
    cautionsAndContraindications: 'ללא התוויות נגד; ניתן לשלב עם כל טיפול תרופתי.'
  },

  // --- תכשירים מקומיים מופרדים ל-GSM (לחות בנפרד מאינטררוזה, אסטרוגן נרתיקי ואוספמיפן) ---
  {
    id: 'vaginal_moisturizers',
    brandName: 'Replens / Gynomunal / Hyaluronic Acid + Lubricants',
    hebrewName: 'תכשירי לחות נרתיקיים וחומצה היאלורונית + חומרי סיכה',
    category: 'LOCAL_GSM_NON_HORMONAL',
    activeIngredients: 'Polycarbophil / Hyaluronic Acid vaginal moisturizers + Water/Silicone/Oil lubricants',
    route: 'VAGINAL',
    dosingSchedule: 'תכשיר לחות 2–3 פעמים בשבוע בקביעות + חומר סיכה בכל מגע מיני.',
    clinicalAdvantages:
      '100% לא-הורמונלי, בטוח לחלוטין בכל מצב (לרבות סרטן שד ומעכבי ארומטאז), וניתן לשילוב חופשי עם אסטרוגן נרתיקי או אינטררוזה!',
    cautionsAndContraindications: 'להעדיף מוצרים איזואוסמולריים ב-pH נרתיקי חומצי ללא פראבנים/גליצרין מגרה.'
  },
  {
    id: 'vagifem_ovestin_imvaggis',
    brandName: 'Vagifem 10mcg / Ovestin / Imvaggis 0.03mg',
    hebrewName: 'אסטרוגן נרתיקי מקומי (וגיפם / אובסטין / אימווגיס)',
    category: 'LOCAL_GSM_HORMONAL',
    activeIngredients: 'Estradiol 10mcg (Vagifem) | Estriol 0.5–1mg (Ovestin) | Ultra-low Estriol 0.03mg (Imvaggis)',
    route: 'VAGINAL',
    dosingSchedule: 'פעם ביום לשבועיים (העמסה), ולאחר מכן פעמיים בשבוע בקביעות לאורך שנים.',
    clinicalAdvantages:
      'יעילות מקומית מצוינת ליובש, דיספראוניה ומניעת דלקות שתן חוזרות; ספיגה סיסטמית זניחה וללא צורך בפרוגסטוגן!',
    cautionsAndContraindications:
      'תחת מעכבי ארומטאז בסרטן שד – קו ראשון לחות לא-הורמונלית, ואם נכשל נדרש תיאום מתועד עם האונקולוג/ית.'
  },
  {
    id: 'intrarosa',
    brandName: 'Intrarosa 6.5mg (Prasterone / DHEA)',
    hebrewName: 'אינטררוזה (פראסטרון / DHEA נרתיקי 6.5 מ"ג)',
    category: 'LOCAL_GSM_HORMONAL',
    activeIngredients: 'Prasterone (DHEA) 6.5mg vaginal pessary',
    route: 'VAGINAL',
    dosingSchedule: 'פתילה נרתיקית אחת פעם ביום לפני השינה (בפוסט-מנופאוזה).',
    clinicalAdvantages:
      'מומר תוך-תאית (Intracrinology) לאסטרוגן ואנדרוגן ברקמת הנרתיק בלבד ללא עלייה ברמות ההורמונים בדם – משפר יובש וכאב ביחסים.',
    cautionsAndContraindications: 'אינו מיועד לנשים עם היסטוריה של סרטן שד; מיועד לפוסט-מנופאוזה.'
  },
  {
    id: 'ospemifene',
    brandName: 'Senshio (Ospemifene 60mg)',
    hebrewName: 'אוספמיפן פומי ל-GSM (סנשיו 60 מ"ג)',
    category: 'LOCAL_GSM_HORMONAL',
    activeIngredients: 'Ospemifene 60mg oral tablet (SERM)',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת של 60 מ"ג פעם ביום עם האוכל (בפוסט-מנופאוזה).',
    clinicalAdvantages: 'אפשרות פומית ייעודית ל-GSM לנשים המתקשות או אינן מעוניינות במתן נרתיקי מקומי.',
    cautionsAndContraindications: 'SERM פומי – אסור בסיכון VTE מוגבר ואסור בסרטן שד פעיל/חשוד.'
  },

  // --- טיפול נפרד ב-HSDD (טסטוסטרון עורי נשי – שלב שני במעקב לאחר מיצוי E2 + GSM) ---
  {
    id: 'testosterone_hsdd',
    brandName: 'Transdermal Testosterone (Female Dose – Stage 3 Follow-Up)',
    hebrewName: 'טסטוסטרון עורי במינון נשי פיזיולוגי (ל-HSDD עמיד במעקב)',
    category: 'TESTOSTERONE_HSDD',
    activeIngredients: 'Testosterone Gel 1% (~5 מ"ג/יום – כ-1/10 ממנת גבר)',
    route: 'TRANSDERMAL_GEL',
    dosingSchedule:
      'טיפה בגודל אפונה על הירך החיצונית/שוק תחתונה (שקית 50 מ"ג מספיקה ל-8–10 ימים) – ניתן כניסיון של 3–6 חודשים במעקב (שלב 3) רק אם HSDD נמשך למרות איזון אסטרוגן עורי וטיפול ב-GSM!',
    clinicalAdvantages:
      'ההתוויה המבוססת היחידה (NICE 2024 / BMS / IMS): הפרעת חשק מיני ירוד הגורמת מצוקה (HSDD) שלא חלפה לאחר מיצוי אסטרוגן סיסטמי וטיפול מקומי ב-GSM.',
    cautionsAndContraindications:
      'אין להתחיל כקו ראשון לפני מיצוי אסטרוגן + GSM; מחייב בדיקת Total Testosterone ו-SHBG בבסיס, כעבור 3–6 שבועות וכל 6–12 חודשים.'
  }
];

// סינון קשיח של פורמולריום התרופות כך שיוצגו אך ורק תכשירים מתאימים שלא נפסלו רפואית עבור המטופלת!
export function getEligibleArsenalForPatient(
  data: Stage1Data,
  options?: { includeStage3FollowUpDrugs?: boolean }
): IsraeliDrugItem[] {
  const gate = evaluateCompletenessGate(data);
  const vte = calculateVteRisk(data);
  const prevent = calculateAhaPreventRisk(data);
  const interactions = checkDrugInteractions(data);

  const mhtBlocked = gate.systemicMhtContraindicated || prevent.mhtTrafficLight === 'RED';
  const mandatoryTransdermal =
    vte.mandatoryTransdermal ||
    data.bmi >= 30 ||
    data.medicalHistory.migraineWithAura ||
    data.medicalHistory.hypertriglyceridemiaOver200 ||
    data.medicalHistory.fattyLiverOrGallstones ||
    data.medicalHistory.malabsorptionOrBariatricSurgery ||
    interactions.some((i) => i.forcesTransdermalEstrogen) ||
    data.age >= 60 ||
    prevent.mhtTrafficLight === 'POST_EVENT' ||
    data.medicalHistory.diabetesStatus === 'DIABETES' ||
    data.medicalHistory.hypertensionStatus === 'UNCONTROLLED';

  const liverBlocked = data.medicalHistory.activeLiverDiseaseOrPorphyria || data.lftStatus === 'ABNORMAL';
  const ckdOrAceArb =
    data.medicalHistory.chronicKidneyDiseaseOrSolitaryKidney ||
    data.medications.takingAceArbOrPotassiumSparing;

  // פסילה קשיחה חלה רק על תכשירים שהופסקו בשל תופעות לוואי / אי-סבילות / אלרגיה (ולא בשל תגובה חלקית בלבד במינון קבוע!)
  const hardDisqualifiedKeys = new Set(
    data.preferences.priorFailedTreatments
      .filter((f) => f.stopReasonCategory !== 'SUBOPTIMAL_EFFICACY')
      .map((f) => f.treatmentKey)
  );

  return ISRAELI_DRUG_ARSENAL.filter((item) => {
    // 1. אם MHT סיסטמי אסור – סנן את כל התכשירים ההורמונליים הסיסטמיים
    if (
      mhtBlocked &&
      ['ESTROGEN_TRANSDERMAL', 'ESTROGEN_ORAL', 'PROGESTOGEN', 'COMBINED_TRANSDERMAL', 'COMBINED_ORAL', 'TSEC_TIBOLONE'].includes(
        item.category
      )
    ) {
      return false;
    }

    // 2. אם חובה מתן עורי – סנן כל אסטרוגן פומי ותכשירים משולבים פומיים/טיבולון/אוספמיפן
    if (mandatoryTransdermal && ['ESTROGEN_ORAL', 'COMBINED_ORAL', 'TSEC_TIBOLONE'].includes(item.category)) {
      return false;
    }

    // 3. אם כריתת רחם ללא אנדומטריוזיס – אין צורך להציג פרוגסטוגנים או משולבים עם פרוגסטין
    const needsProg = !data.hadHysterectomy || data.medicalHistory.hadEndometriosis || Boolean(data.cervixConserved);
    if (!needsProg && ['PROGESTOGEN', 'COMBINED_TRANSDERMAL', 'COMBINED_ORAL'].includes(item.category)) {
      return false;
    }

    // 4. אלרגיה לבוטנים/סויה או אי-סבילות לאוטרוגסטן -> סנן אוטרוגסטן
    if (
      item.id === 'utrogestan' &&
      (data.medicalHistory.peanutOrSoyAllergy || hardDisqualifiedKeys.has('UTROGESTAN_ORAL'))
    ) {
      return false;
    }

    // 5. רגישות לדבק מדבקות או פריחה ממדבקות -> סנן מדבקות
    if (
      item.route === 'TRANSDERMAL_PATCH' &&
      (data.medicalHistory.patchAdhesiveSensitivity || hardDisqualifiedKeys.has('EVOREL_PATCH'))
    ) {
      return false;
    }

    // 6. כליה בודדת / CKD / ACEi-ARB -> סנן Angeliq
    if (item.id === 'angeliq' && ckdOrAceArb) {
      return false;
    }

    // 7. ליביאל מעל גיל 60 או פחות משנה מהווסת
    if (item.id === 'livial' && (data.age >= 60 || data.monthsSinceLastPeriod < 12)) {
      return false;
    }

    // 8. מחלת כבד או תפקודי כבד חריגים -> סנן ויוזה / לינקואט
    if (
      (item.id === 'veoza' || item.id === 'lynkuet') &&
      (liverBlocked || hardDisqualifiedKeys.has('VEOZA_NK3'))
    ) {
      return false;
    }

    // 9. סרטן שד / מעכבי ארומטאז / טמוקסיפן -> סנן Intrarosa, Ospemifene וטסטוסטרון
    if (
      (data.medicalHistory.breastCancerHistory ||
        data.medications.takingTamoxifen ||
        data.medications.takingAromataseInhibitors) &&
      (item.id === 'intrarosa' || item.id === 'ospemifene' || item.id === 'testosterone_hsdd')
    ) {
      return false;
    }
    if (data.medications.takingAromataseInhibitors && item.id === 'vagifem_ovestin_imvaggis') {
      return false;
    }
    if ((vte.mandatoryTransdermal || data.monthsSinceLastPeriod < 12 || data.bmi >= 30) && item.id === 'ospemifene') {
      return false;
    }

    // 10. טסטוסטרון עורי מיועד לשלב המעקב (שלב 3) לאחר מיצוי אסטרוגן + GSM, ולא כקו ראשון בשלב 2!
    if (item.id === 'testosterone_hsdd') {
      if (liverBlocked || !options?.includeStage3FollowUpDrugs) {
        return false;
      }
    }

    // 11. סינון תכשירים שנפסלו בשל אי-סבילות / תופעות לוואי קשות בעבר
    if (item.id === 'femoston_family' && hardDisqualifiedKeys.has('ORAL_FEMOSTON')) return false;
    if (item.id === 'activelle_eviana_novofem' && hardDisqualifiedKeys.has('ORAL_COMBINED_NETA')) return false;
    if (item.id === 'mirena' && hardDisqualifiedKeys.has('MIRENA_IUS')) return false;
    if ((item.id === 'estrogel' || item.id === 'sandrena') && hardDisqualifiedKeys.has('ESTROGEL_SANDRENA')) {
      return false;
    }
    if (item.id === 'venlafaxine_escitalopram' && hardDisqualifiedKeys.has('SSRI_SNRI')) return false;

    return true;
  });
}
