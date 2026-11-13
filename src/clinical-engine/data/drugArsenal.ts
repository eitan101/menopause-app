// Israeli Pharmacopeia for Menopause Care strictly derived from project knowledge files

export interface DrugItem {
  id: string;
  brandNameHebrew: string;
  brandNameEnglish: string;
  genericName: string;
  category: 'ESTROGEN_TRANSDERMAL' | 'ESTROGEN_ORAL' | 'PROGESTOGEN_BIOIDENTICAL' | 'PROGESTOGEN_SYNTHETIC' | 'COMBINED_SEQUENTIAL' | 'COMBINED_CONTINUOUS' | 'IUS' | 'TSEC' | 'LOCAL_GSM' | 'NON_HORMONAL';
  availableDoses: string[];
  route: string;
  standardRegimenHebrew: string;
  clinicalHighlightsHebrew: string;
  breastSafety: 'HIGH' | 'MODERATE' | 'NEUTRAL';
  vteSafety: 'SAFE' | 'CAUTION';
  boneBenefit: 'EXCELLENT' | 'GOOD' | 'NEUTRAL';
  androgenicity: 'NONE' | 'ANTI_ANDROGENIC' | 'LOW' | 'ANDROGENIC';
}

export const ISRAELI_DRUG_ARSENAL: DrugItem[] = [
  // אסטרוגן עורי (Transdermal)
  {
    id: 'estrogel',
    brandNameHebrew: 'אסטרוג\'ל',
    brandNameEnglish: 'Estrogel',
    genericName: '17β-Estradiol 0.06% Gel',
    category: 'ESTROGEN_TRANSDERMAL',
    availableDoses: ['1 לחיצה (0.75 מ"ג)', '2 לחיצות (1.5 מ"ג - מינון סטנדרטי)', '3-4 לחיצות'],
    route: 'עורי (מריחה יומית על שטח עור נקי, זרועות/ירכיים)',
    standardRegimenHebrew: '1-2 לחיצות ביום, מריחה בבוקר על עור יבש ללא שטיפה בשעה הראשונה.',
    clinicalHighlightsHebrew: 'עוקף מעבר כבדי ראשוני. אינו מעלה סיכון ל-VTE, אינו מעלה לחץ דם, אינו מעלה SHBG (שומר על ליבידו). קו ראשון ב-BMI ≥30, גיל >60, מיגרנות ומטופלות GLP-1.',
    breastSafety: 'NEUTRAL',
    vteSafety: 'SAFE',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },
  {
    id: 'sandrena',
    brandNameHebrew: 'סנדרנה',
    brandNameEnglish: 'Sandrena',
    genericName: 'Estradiol Gel Sachets',
    category: 'ESTROGEN_TRANSDERMAL',
    availableDoses: ['0.5 מ"ג (שקית אחת)', '1.0 מ"ג (שקית אחת - סטנדרטי)', '1.5-2.0 מ"ג'],
    route: 'עורי (שקיות ג\'ל אישיות למריחה)',
    standardRegimenHebrew: 'שקית אחת ליום במריחה על שטח עור בגודל פי 1-2 מגודל כף היד.',
    clinicalHighlightsHebrew: 'מינון מדויק בשקיות מדודות. בטוח מבחינה טרומבואמבולית וכבדית.',
    breastSafety: 'NEUTRAL',
    vteSafety: 'SAFE',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },
  {
    id: 'evorel_patches',
    brandNameHebrew: 'אוורל מדבקות',
    brandNameEnglish: 'Evorel / Estradot Patches',
    genericName: 'Estradiol Transdermal Patch',
    category: 'ESTROGEN_TRANSDERMAL',
    availableDoses: ['25 מק"ג/יום (נמוך)', '50 מק"ג/יום (סטנדרטי)', '75 מק"ג/יום', '100 מק"ג/יום'],
    route: 'מדבקה עורית (החלפה פעמיים בשבוע)',
    standardRegimenHebrew: 'הדבקה על עור נקי ויבש באזור הבטן התחתונה או העכוז, החלפה כל 3-4 ימים.',
    clinicalHighlightsHebrew: 'שחרור רציף ואחיד של אסטרדיול. היענות מצוינת לנשים המתקשות לזכור נטילה יומיומית.',
    breastSafety: 'NEUTRAL',
    vteSafety: 'SAFE',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },

  // אסטרוגן פומי (Oral)
  {
    id: 'estrofem',
    brandNameHebrew: 'אסטרופם',
    brandNameEnglish: 'Estrofem / Progynova',
    genericName: 'Estradiol / Estradiol Valerate',
    category: 'ESTROGEN_ORAL',
    availableDoses: ['1 מ"ג (נמוך)', '2 מ"ג (סטנדרטי)'],
    route: 'פומי (טבליה יומית)',
    standardRegimenHebrew: 'טבליה אחת ביום בשעה קבועה.',
    clinicalHighlightsHebrew: 'מתאים לנשים מתחת לגיל 60, ללא עודף משקל (BMI <30), ללא גורמי סיכון ל-VTE וללא מיגרנות. מעלה מעט SHBG וטריגליצרידים במעבר כבדי ראשון.',
    breastSafety: 'NEUTRAL',
    vteSafety: 'CAUTION',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },

  // פרוגסטרון ביו-אידנטי מיקרוניזדי
  {
    id: 'utrogestan',
    brandNameHebrew: 'אוטרוגסטן / גפרטיקס',
    brandNameEnglish: 'Utrogestan / Gepretix',
    genericName: 'Micronised Progesterone (Bioidentical)',
    category: 'PROGESTOGEN_BIOIDENTICAL',
    availableDoses: ['100 מ"ג', '200 מ"ג'],
    route: 'פומי (או נרתיקי)',
    standardRegimenHebrew: 'בטיפול סדרתי: 200 מ"ג ללילה במשך 12-14 ימים בחודש. בטיפול רציף: 100 מ"ג כל לילה לפני השינה.',
    clinicalHighlightsHebrew: 'פרופיל הבטיחות הגבוה ביותר: אינו מעלה סיכון לסרטן שד ב-5 השנים הראשונות, בטוח לחלוטין ל-VTE, אינו אנדרוגני. מומלץ לקחת לפני השינה (משרה שינה עקב מטבוליט אלופרגננולון). שימוש נרתיקי אפשרי במקרה של תופעות לוואי עיכוליות.',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'GOOD',
    androgenicity: 'NONE'
  },

  // פרוגסטוגן סינתטי - דידרוגסטרון
  {
    id: 'duphaston',
    brandNameHebrew: 'דופסטון',
    brandNameEnglish: 'Duphaston',
    genericName: 'Dydrogesterone',
    category: 'PROGESTOGEN_SYNTHETIC',
    availableDoses: ['10 מ"ג'],
    route: 'פומי (טבליה יומית)',
    standardRegimenHebrew: 'בטיפול סדרתי: 10 מ"ג ליום במשך 14 ימים במחזור. בטיפול רציף: 5-10 מ"ג ליום.',
    clinicalHighlightsHebrew: 'איזומר סטריאו של פרוגסטרון. בעל סבילות מצוינת, בטיחות שד ו-VTE טובה בהרבה מ-MPA ו-NETA, ללא השפעות אנדרוגניות (אינו גורם לאקנה או שיעור).',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'GOOD',
    androgenicity: 'NONE'
  },

  // התקן תוך רחמי 52 מ"ג
  {
    id: 'mirena',
    brandNameHebrew: 'מירנה (התקן תוך-רחמי 52 מ"ג)',
    brandNameEnglish: 'Mirena (52mg LNG-IUS)',
    genericName: 'Levonorgestrel 52mg IUS',
    category: 'IUS',
    availableDoses: ['התקן אחד ל-5 שנים להגנה על הרירית (BMS 2024)'],
    route: 'תוך-רחמי',
    standardRegimenHebrew: 'התקנה חד-פעמית אצל רופא/ת נשים. מספק הגנה שלמה על רירית הרחם ל-5 שנים.',
    clinicalHighlightsHebrew: 'פתרון הזהב (Gold Standard) לנשים עם דימומים מוגברים בפרי-מנופאוזה, למטופלות GLP-1 (עוקף ספיגת מעי), ומשלב אמצעי מניעה אמין ביותר. רמות הורמון סיסטמיות מזעריות.',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'GOOD',
    androgenicity: 'LOW'
  },

  // תכשירים משולבים סדרתיים
  {
    id: 'femoston_seq',
    brandNameHebrew: 'פמוסטון סדרתי (1/10 או 2/10)',
    brandNameEnglish: 'Femoston 1/10 & 2/10',
    genericName: 'Estradiol + Dydrogesterone',
    category: 'COMBINED_SEQUENTIAL',
    availableDoses: ['פמוסטון 1/10 (1 מ"ג אסטרדיול + 10 מ"ג דידרוגסטרון ב-14 הימים האחרונים)', 'פמוסטון 2/10 (2 מ"ג אסטרדיול)'],
    route: 'פומי (חפיסה חודשית רציפה)',
    standardRegimenHebrew: 'טבליה אחת ביום ללא הפסקה: 14 ימים אסטרוגן בלבד, ולאחריהם 14 ימים אסטרוגן + דידרוגסטרון.',
    clinicalHighlightsHebrew: 'מתאים במיוחד לנשים בפרי-מנופאוזה עם רחם המעוניינות בווסת סדירה וצפויה בסיום שלב הפרוגסטוגן. פרופיל דידרוגסטרון בטוח ונוח.',
    breastSafety: 'HIGH',
    vteSafety: 'CAUTION',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },

  // תכשירים משולבים רציפים
  {
    id: 'femoston_conti',
    brandNameHebrew: 'פמוסטון קונטי',
    brandNameEnglish: 'Femoston Conti',
    genericName: 'Estradiol 1mg + Dydrogesterone 5mg',
    category: 'COMBINED_CONTINUOUS',
    availableDoses: ['1 מ"ג / 5 מ"ג'],
    route: 'פומי (טבליה יומית קבועה)',
    standardRegimenHebrew: 'טבליה אחת ביום באופן רציף ללא הפסקות, ללא דימום ווסתי מתוכנן.',
    clinicalHighlightsHebrew: 'טיפול הבחירה הפומי לנשים פוסט-מנופאוזליות עם רחם (>12 חודשי אל-ווסת או מעל גיל 54). דידרוגסטרון בטוח ובעל סבילות גבוהה.',
    breastSafety: 'HIGH',
    vteSafety: 'CAUTION',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },
  {
    id: 'evorel_conti',
    brandNameHebrew: 'אוורל קונטי מדבקות משולבות',
    brandNameEnglish: 'Evorel Conti',
    genericName: 'Estradiol 50mcg + NETA 170mcg Patch',
    category: 'COMBINED_CONTINUOUS',
    availableDoses: ['מדבקה משולבת להחלפה פעמיים בשבוע'],
    route: 'מדבקה עורית',
    standardRegimenHebrew: 'הדבקה רציפה פעמיים בשבוע (כל 3-4 ימים) ללא הפסקה.',
    clinicalHighlightsHebrew: 'פתרון עורי משולב רציף לנשים פוסט-מנופאוזליות עם רחם הזקוקות למתן עורי (BMI מוגבר, יל"ד, מיגרנה, GLP-1).',
    breastSafety: 'MODERATE',
    vteSafety: 'SAFE',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'ANDROGENIC'
  },
  {
    id: 'angeliq',
    brandNameHebrew: 'אנג\'ליק',
    brandNameEnglish: 'Angeliq',
    genericName: 'Estradiol 1mg + Drospirenone 2mg',
    category: 'COMBINED_CONTINUOUS',
    availableDoses: ['1 מ"ג / 2 מ"ג'],
    route: 'פומי',
    standardRegimenHebrew: 'טבליה אחת ליום באופן רציף.',
    clinicalHighlightsHebrew: 'דרוספרינון הוא פרוגסטוגן אנטי-אלדוסטרוני ואנטי-אנדרוגני. מסייע בהפחתת אגירת נוזלים, בצקות ויתר לחץ דם קל.',
    breastSafety: 'MODERATE',
    vteSafety: 'CAUTION',
    boneBenefit: 'GOOD',
    androgenicity: 'ANTI_ANDROGENIC'
  },

  // TSEC - אסטרוגן + בזדוקסיפן (ללא פרוגסטרון לנשים עם רחם)
  {
    id: 'duavive',
    brandNameHebrew: 'דואוויב (TSEC)',
    brandNameEnglish: 'Duavive',
    genericName: 'Conjugated Estrogens 0.45mg + Bazedoxifene 20mg',
    category: 'TSEC',
    availableDoses: ['0.45 מ"ג / 20 מ"ג'],
    route: 'פומי',
    standardRegimenHebrew: 'טבליה אחת ליום באופן רציף לנשים פוסט-מנופאוזליות עם רחם.',
    clinicalHighlightsHebrew: 'קומפלקס אסטרוגן עם SERM סלקטיבי. הבזדוקסיפן מגן על רירית הרחם במקום פרוגסטוגן. מתאים במיוחד לנשים עם רגישות ואי-סבילות קשה לפרוגסטרון או כאבי שד עזים.',
    breastSafety: 'HIGH',
    vteSafety: 'CAUTION',
    boneBenefit: 'EXCELLENT',
    androgenicity: 'NONE'
  },

  // טיפולים מקומיים ל-GSM
  {
    id: 'vagifem',
    brandNameHebrew: 'וגיפם',
    brandNameEnglish: 'Vagifem',
    genericName: 'Estradiol 10mcg Vaginal Tablet',
    category: 'LOCAL_GSM',
    availableDoses: ['10 מק"ג'],
    route: 'נרתיקי מקומי',
    standardRegimenHebrew: 'טבליה נרתיקית אחת בכל לילה במשך שבועיים ראשונים, ולאחר מכן טבליה אחת פעמיים בשבוע כמנת אחזקה קבועה.',
    clinicalHighlightsHebrew: 'טיפול מקומי בטוח במיוחד ל-GSM (יובש, כאבים, צריבה, דלקות שתן חוזרות). ספיגה סיסטמית מזערית, אינו דורש פרוגסטוגן ואינו מעלה סיכון לסרטן שד או VTE.',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'NEUTRAL',
    androgenicity: 'NONE'
  },
  {
    id: 'ovestin',
    brandNameHebrew: 'אובסטין קרם / פתילות',
    brandNameEnglish: 'Ovestin Cream / Ovules',
    genericName: 'Estriol 1mg/g Cream / 0.5mg Ovules',
    category: 'LOCAL_GSM',
    availableDoses: ['קרם עם מוליך / פתילות 0.5 מ"ג'],
    route: 'נרתיקי מקומי',
    standardRegimenHebrew: 'החדרה יומית בשבועיים הראשונים, ולאחר מכן פעמיים בשבוע.',
    clinicalHighlightsHebrew: 'אסטריול הוא אסטרוגן קצר-פעולה וחלש הפועל בעיקר על אפיתל הנרתיק והשלפוחית.',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'NEUTRAL',
    androgenicity: 'NONE'
  },
  {
    id: 'intrarosa',
    brandNameHebrew: 'אינטרארוסה',
    brandNameEnglish: 'Intrarosa',
    genericName: 'Prasterone (DHEA) 6.5mg Vaginal Insert',
    category: 'LOCAL_GSM',
    availableDoses: ['6.5 מ"ג'],
    route: 'נרתיקי מקומי',
    standardRegimenHebrew: 'פתילה נרתיקית אחת בכל לילה לפני השינה.',
    clinicalHighlightsHebrew: 'פרה-קורסור ההופך מקומית בתוך תאי הנרתיק לאסטרוגן ולאנדרוגנים (Intracrinology). מסייע גם באטרופיה נרתיקית וגם בשיפור רגישות וליבידו.',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'NEUTRAL',
    androgenicity: 'NONE'
  },

  // חלופות לא-הורמונליות (Non-Hormonal Alternatives)
  {
    id: 'fezolinetant',
    brandNameHebrew: 'ויוזה (פזולינטנט)',
    brandNameEnglish: 'Veoza (Fezolinetant)',
    genericName: 'Fezolinetant 45mg',
    category: 'NON_HORMONAL',
    availableDoses: ['45 מ"ג'],
    route: 'פומי',
    standardRegimenHebrew: 'טבליה אחת של 45 מ"ג פעם ביום עם או בלי אוכל.',
    clinicalHighlightsHebrew: 'מעכב קולטני נוירוקינין 3 (NK3 receptor antagonist) הפועל ישירות במרכז ויסות החום בהיפותלמוס. יעיל מאוד לגלי חום והזעות ללא השפעה הורמונלית. אידיאלי לנשים עם היסטוריה של סרטן שד או התוויות נגד מוחלטות לאסטרוגן (יש לבדוק אנזימי כבד ALT/AST לפני התחלה ובמהלך הטיפול).',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'NEUTRAL',
    androgenicity: 'NONE'
  },
  {
    id: 'ssri_snri',
    brandNameHebrew: 'ונלפקסין / אסציטלופרם',
    brandNameEnglish: 'Venlafaxine / Escitalopram',
    genericName: 'Venlafaxine 37.5-75mg / Escitalopram 10mg',
    category: 'NON_HORMONAL',
    availableDoses: ['ונלפקסין 37.5 - 75 מ"ג'],
    route: 'פומי',
    standardRegimenHebrew: 'מינון התחלתי נמוך 37.5 מ"ג ביום, עם עלייה ל-75 מ"ג לפי צורך.',
    clinicalHighlightsHebrew: 'מפחית תסמינים וזומוטוריים ומסייע במצבי חרדה ומצב רוח ירוד. שימו לב: אין לשלב פרוקסטין עם טמוקסיפן בשל עיכוב אנזים CYP2D6; ונלפקסין מותרת.',
    breastSafety: 'HIGH',
    vteSafety: 'SAFE',
    boneBenefit: 'NEUTRAL',
    androgenicity: 'NONE'
  }
];
