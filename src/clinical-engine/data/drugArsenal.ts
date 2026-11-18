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
    | 'LOCAL_GSM'
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
      'לפי Red Whale / מחקרי תצפית קיימת ספיגה סיסטמית קלה עם עלייה קטנה בסיכון לסרטן שד בדומה לפרוגסטינים פומיים. Kyleena/Jaydess אינם מאושרים להגנת רירית ב-MHT!'
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
    id: 'progyluton',
    brandName: 'Progyluton',
    hebrewName: 'פרוגילוטון (ציקלי דו-שלבי 21 טבליות)',
    category: 'COMBINED_ORAL',
    activeIngredients: 'Estradiol Valerate 2mg + Norgestrel 0.5mg',
    route: 'ORAL',
    dosingSchedule: '21 טבליות (11 לבנות + 10 חומות) ו-7 ימי הפסקה עם דמם גמילה סדיר (אינו אמצעי מניעה!).',
    clinicalAdvantages: 'הסדרת מחזור צפויה בנשים צעירות עם POI או אוליגומנוריאה המעוניינות בווסת חודשית סדירה.',
    cautionsAndContraindications: 'אינו מונע הריון! ב-7 ימי ההפסקה יתכנו גלי חום חוזרים.'
  },
  {
    id: 'duavive_livial',
    brandName: 'Duavive (TSEC) / Livial (Tibolone 2.5mg)',
    hebrewName: 'דואביב (ללא פרוגסטוגן!) / ליביאל (טיבולון)',
    category: 'TSEC_TIBOLONE',
    activeIngredients: 'Duavive: CE 0.45mg + Bazedoxifene 20mg | Livial: Tibolone 2.5mg',
    route: 'ORAL',
    dosingSchedule: 'טבליה אחת ביום בפוסט-מנופאוזה (>12 חודשים מהווסת האחרונה).',
    clinicalAdvantages:
      'Duavive: פתרון ייחודי לאישה עם רחם שמור ואי-סבילות קשה לכל הפרוגסטוגנים (בזדוקסיפן מגן על הרירית והשד!). Livial: משפר גלי חום, צפיפות עצם וחשק מיני (פעילות אנדרוגנית קלה).',
    cautionsAndContraindications:
      'מתן פומי: להימנע בסיכון VTE. ב-Livial אין להתחיל מעל גיל 60 (עלייה בסיכון לשבץ מוחי) ואסור לאחר סרטן שד.'
  },

  // --- טיפולים לא-הורמונליים סיסטמיים לגלי חום והפרעות שינה ---
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
      'אזהרת כבד מעודכנת (EMA / משרד הבריאות 2025): חובה בדיקת ALT, AST ובילירובין לפני התחלה (אין להתחיל אם ALT/AST ≥ 2x ULN או בילירובין מוגבר!), ולאחר מכן מעקב חודשי ב-3 החודשים הראשונים (חודש 1, 2, 3) ובהמשך בחודשים 6 ו-9! להפסיק מיד בצהבת/שתן כהה/עלייה >3x ULN. אסור עם מעכבי CYP1A2 חזקים (כגון Fluvoxamine).'
  },
  {
    id: 'lynkuet',
    brandName: 'Lynkuet 120mg (Elinzanetant)',
    hebrewName: 'לינקואט 120 מ"ג (אלינזנטנט – חוסם כפול NK1/NK3)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Elinzanetant 120mg (2 x 60mg soft capsules – Dual NK1/NK3 Antagonist)',
    route: 'ORAL',
    dosingSchedule: '2 כמוסות של 60 מ"ג (120 מ"ג) פעם ביום לפני השינה (אושר FDA אוקטובר 2025 – מחקרי OASIS).',
    clinicalAdvantages:
      'חסימה כפולה של NK3 (גלי חום) ו-NK1 (שינה): מפחית משמעותית גלי חום ומשפר איכות שינה ללא כל פעילות הורמונלית.',
    cautionsAndContraindications:
      'בדיקת תפקודי כבד בביקור הבסיס וכעבור 3 חודשים; עלול לגרום לישנוניות קלה (לכן ניטל בערב); אינטראקציות CYP3A4 (להימנע מאשכוליות וממעכבי/משרני CYP3A4 חזקים).'
  },
  {
    id: 'venlafaxine_escitalopram',
    brandName: 'Venlafaxine XR (37.5–75mg) / Escitalopram (10–20mg)',
    hebrewName: 'ונלפקסין (SNRI) / אציטלופרם – ציפרלקס (SSRI)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Venlafaxine XR 37.5–75mg OR Escitalopram 10–20mg / Citalopram 10–20mg',
    route: 'ORAL',
    dosingSchedule: 'פעם ביום במינון נמוך (נמוך ממינון נוגד דיכאון מלא; השפעה על VMS תוך 2–4 שבועות).',
    clinicalAdvantages:
      'קו ראשון מוכח ובטוח במטופלות סרטן שד הנוטלות טמוקסיפן (אינם מעכבים CYP2D6!), ומשפרים במקביל חרדה ותנודות מצב רוח.',
    cautionsAndContraindications:
      'אזהרה קריטית: תחת טמוקסיפן חל איסור מוחלט לרשום Paroxetine (פאקסט) או Fluoxetine (פרוזק)! בוונלפקסין יש לעקוב אחר ל"ד ולהפסיק בהדרגה.'
  },
  {
    id: 'gabapentin_oxybutynin',
    brandName: 'Gabapentin (300–900mg) / Oxybutynin (2.5–5mg)',
    hebrewName: 'גאבאפנטין (לילה) / אוקסיבוטינין (נוביטרופן)',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'Gabapentin 300–900mg nocte OR Oxybutynin 2.5–5mg',
    route: 'ORAL',
    dosingSchedule: 'גאבאפנטין לפני השינה בטיטרציה הדרגתית; אוקסיבוטינין 2.5–5 מ"ג פעמיים ביום או XR.',
    clinicalAdvantages:
      'גאבאפנטין מצוין להזעות לילה קשות, הפרעות שינה וכאב נוירופתי (בטוח בטמוקסיפן); אוקסיבוטינין יעיל מאוד להזעת יתר ולדחיפות במתן שתן (OAB).',
    cautionsAndContraindications:
      'גאבאפנטין: סחרחורת/נמנום ובצקות; אוקסיבוטינין: יובש בפה, עצירות ולהימנע בגיל מבוגר עקב עומס אנטי-כולינרגי קוגניטיבי.'
  },
  {
    id: 'cbt_hypnosis',
    brandName: 'CBT (MENOS Protocol) & Clinical Hypnosis',
    hebrewName: 'טיפול קוגניטיבי-התנהגותי ייעודי (CBT-MENOS) והיפנוזה קלינית',
    category: 'NON_HORMONAL_VMS',
    activeIngredients: 'פרוטוקול מובנה בן 4–6 מפגשים + התאמות אורח חיים (קירור שכבות, הפחתת אלכוהול/קפאין, אימוני התנגדות)',
    route: 'BEHAVIORAL',
    dosingSchedule: 'תוכנית בת 4–6 שבועות (פרונטלית או עצמית מודרכת).',
    clinicalAdvantages:
      'מומלץ בדרגת הוכחה גבוהה (NAMS / BMS) להפחתת מידת ההפרעה התפקודית של גלי החום, שיפור שינה וחרדה – אפס תופעות לוואי תרופתיות.',
    cautionsAndContraindications: 'ללא התוויות נגד; ניתן לשלב עם כל טיפול תרופתי או לבד.'
  },

  // --- תכשירים מקומיים לתסמונת אורו-גניטלית (GSM) ומיניות (HSDD) ---
  {
    id: 'vagifem_ovestin_imvaggis',
    brandName: 'Vagifem 10mcg / Ovestin / Imvaggis 0.03mg',
    hebrewName: 'אסטרוגן נרתיקי מקומי (וגיפם / אובסטין / אימווגיס)',
    category: 'LOCAL_GSM',
    activeIngredients: 'Estradiol 10mcg (Vagifem) OR Estriol 0.5mg–1mg (Ovestin) OR Ultra-low Estriol 0.03mg (Imvaggis)',
    route: 'VAGINAL',
    dosingSchedule: 'מנת העמסה יומית למשך שבועיים, ולאחר מכן פעמיים בשבוע בקביעות לאורך שנים (בהפסקת הטיפול התסמינים חוזרים!).',
    clinicalAdvantages:
      'יעילות מקומית גבוהה מאוד ליובש, דיספראוניה ודלקות שתן חוזרות (מונע UTIs!), ספיגה סיסטמית זניחה וללא צורך בשום פרוגסטוגן או מעקב רירית! Imvaggis 0.03mg במינון אולטרה-נמוך מועדף כשנדרשת חשיפה מינימלית.',
    cautionsAndContraindications:
      'בטוח בכל גיל וגם בסיכון VTE/קרדיו-וסקולרי; תחת מעכבי ארומטאז בסרטן שד – להעדיף תכשירי לחות תחילה ולהיוועץ באונקולוג.'
  },
  {
    id: 'intrarosa_ospemifene_moisturizers',
    brandName: 'Intrarosa (Prasterone 6.5mg) / Ospemifene / Moisturizers',
    hebrewName: 'אינטררוזה (DHEA נרתיקי) / אוספמיפן / תכשירי לחות נרתיקיים',
    category: 'LOCAL_GSM',
    activeIngredients: 'Prasterone 6.5mg pessary nightly | Ospemifene 60mg PO | Hyaluronic acid / Polycarbophil moisturizers',
    route: 'VAGINAL',
    dosingSchedule:
      'אינטררוזה: פתילה נרתיקית אחת כל לילה; תכשירי לחות (Replens / Gynomunal): 2–3 פעמים בשבוע + חומר סיכה בעת מגע מיני.',
    clinicalAdvantages:
      'אינטררוזה מומרת תוך-תאית (Intracrinology) לאסטרוגן ואנדרוגן מקומיים ומשפרת כאב ביחסים וחשק מקומי ללא עלייה ברמות הדם; תכשירי לחות בטוחים ב-100% גם בסרטן שד פעיל.',
    cautionsAndContraindications: 'אוספמיפן (SERM פומי) אסור בפעילות פקקתית חריפה.'
  },
  {
    id: 'testosterone_hsdd',
    brandName: 'Transdermal Testosterone (Female Dose)',
    hebrewName: 'טסטוסטרון עורי במינון נשי פיזיולוגי (ל-HSDD)',
    category: 'TESTOSTERONE_HSDD',
    activeIngredients: 'Testosterone Gel 1% (למשל AndroGel במינון נשי Off-label – כ-1/10 ממנת גבר = ~5 מ"ג/יום)',
    route: 'TRANSDERMAL_GEL',
    dosingSchedule:
      'טיפה בגודל אפונה על הירך החיצונית/שוק תחתונה (שקית 50 מ"ג מספיקה לכ-8–10 ימים!), לרוב רק לאחר תיקון אסטרוגן סיסטמי/נרתיקי.',
    clinicalAdvantages:
      'ההתוויה המבוססת היחידה (Global Consensus / BMS): הפרעת חשק מיני ירוד הגורמת מצוקה (HSDD) בפוסט-מנופאוזה או לאחר BSO/RRSO.',
    cautionsAndContraindications:
      'חובה לבדוק Total Testosterone (ו-SHBG/FAI) לפני ההתחלה, כעבור 3–6 שבועות וכעבור 6–12 חודשים כדי לוודא שהרמה נשארת בטווח הפיזיולוגי הנשי ולמנוע אקנה/שיעור יתר/העמקת קול. ניסיון טיפולי ל-3–6 חודשים.'
  }
];
