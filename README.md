# 🌸 Menopause Care – Clinical Decision Support & Longitudinal Management Web App
### מערכת קלינית מבוססת אלגוריתם לניהול וטיפול במטופלות בגיל המעבר למרפאת רופאת המשפחה

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Architecture: Zero-Server](https://img.shields.io/badge/Architecture-Zero--Server%20%28Client--Side%29-emerald.svg)](#zero-server-longitudinal-persistence)
[![Deployment: GitHub Pages](https://img.shields.io/badge/Deployment-GitHub%20Pages-blueviolet.svg)](#deployment-on-github-pages)
[![Clinical Guidelines](https://img.shields.io/badge/Guidelines-NICE%202024%20%7C%20BMS%20%7C%20ACOG%20%7C%20STRAW%2B10-red.svg)](#clinical-knowledge-base)

---

## 📋 תוכן עניינים | Table of Contents
1. [סקירה כללית | Overview](#overview)
2. [עקרון הארכיטקטורה: אפס שרת ופרטיות רפואית | Zero-Server Privacy](#zero-server-longitudinal-persistence)
3. [מבנה זרימת העבודה הקלינית (3 השלבים) | 3-Stage Clinical Workflow](#clinical-workflow)
   - [שלב 1: מפגש ראשון ושער שלמות הנתונים](#stage-1-initial-assessment--completeness-gate)
   - [שלב 2: מפגש הגדרת טיפול והמלצות](#stage-2-treatment-formulation)
   - [שלב 3: מעקב רב-מפגשי ופתרון בעיות](#stage-3-longitudinal-follow-up--troubleshooting)
   - [מודול H: דף עזר מהיר לרופא/ה](#module-h-physician-reference-guide)
4. [בסיס הידע הקליני במאגר | Clinical Knowledge Base](#clinical-knowledge-base)
5. [הצעת יישום טכנולוגי ל-GitHub Pages | Implementation Architecture](#implementation-architecture)
6. [מבנה הפרויקט המוצע | Proposed Repository Structure](#repository-structure)
7. [מדריך פריסה והפעלה | Setup & Deployment Guide](#setup--deployment-guide)

---

## 🌟 סקירה כללית | Overview

פרויקט זה נועד לפתח כלי תומך החלטה קלינית (Clinical Decision Support System - CDSS) ייעודי ומתקדם עבור **רופאות ורופאי משפחה**, המנהלים מטופלות הנמצאות בשלבי גיל המעבר (פרי-מנופאוזה, מנופאוזה ופוסט-מנופאוזה).

המערכת פועלת במודל של **זרימת עבודה קלינית אורכית (Longitudinal Clinical Workflow)**, ומלווה את הרופאה מאיסוף הנתונים הראשוני, דרך שער שלמות נתונים (Completeness Gate), התאמת טיפול הורמונלי (MHT/HRT) או לא-הורמונלי מותאם אישית, ועד למפגשי מעקב חוזרים ופתרון בעיות קליניות מורכבות (דימומים לא סדירים, תופעות לוואי, אינטראקציות תרופתיות).

---

## 🏛️ עקרון הארכיטקטורה: אפס שרת ופרטיות רפואית | Zero-Server Longitudinal Persistence

רפואת הקהילה דורשת הגנה מחמירה על סודיות רפואית (HIPAA, GDPR, חוק הגנת הפרטיות). כדי לאפשר מעקב רב-מפגשי **ללא אגירת מידע רפואי (PHI) בשרת חיצוני כלשהו**:

```
 ┌─────────────────────────────────────────────────────────────┐
 │                דפדפן הרופאה (Client-Side Only)             │
 │                                                             │
 │   ┌─────────────────┐    ייצוא מוצפן    ┌─────────────────┐ │
 │   │  ביקור נוכחי    │ ───────────────> │ Patient_Record  │ │
 │   │  (טופס/אלגוריתם)│                  │ .json (מוצפן)   │ │
 │   └─────────────────┘                  └─────────────────┘ │
 │           │                                      │          │
 │           ▼ סריקה/שחזור                          ▼ הדפסה    │
 │   ┌─────────────────┐                  ┌─────────────────┐ │
 │   │ קוד QR דחוס      │                  │ סיכום מודפס     │ │
 │   │ ומאובטח לסריקה  │                  │ עם QR לסריקה    │ │
 │   └─────────────────┘                  └─────────────────┘ │
 └─────────────────────────────────────────────────────────────┘
```

1. **קובץ נתונים מוצפן (`Patient_Record_[ID].json`)**:
   - בסיום כל מפגש, המערכת מפיקה קובץ מוצפן מקומית (AES-GCM 256-bit באמצעות Web Crypto API).
   - בביקור המעקב הבא, הרופאה מעלה את הקובץ (או גוררת אותו לחלון), וכל ההיסטוריה הטיפולית, המדדים וההחלטות משוחזרים ברגע.
2. **קוד QR דחוס**:
   - דחיסת נתוני המטופלת וההיסטוריה באמצעות אלגוריתם דחיסה (`lz-string` / `pako`) למחרוזת מוצפנת קצרה.
   - הקוד מודפס בתחתית סיכום הביקור וניתן לסריקה מהירה באמצעות מצלמת המחשב/טאבלט בביקור הבא.
3. **אחסון זמני בדפדפן (`LocalStorage` / `IndexedDB`)**:
   - שמירה אוטומטית של טיוטה פעילה במהלך יום העבודה במרפאה, למניעת אובדן נתונים במקרה של סגירת לשונית מקרית.
   - מחיקה אוטומטית עם סיום הטיפול או בלחיצה על "מטופלת חדשה".

---

## 🔄 מבנה זרימת העבודה הקלינית | Clinical Workflow

> **מקורות קליניים ישירים:** כל כללי ההחלטה, הספים הקליניים ושדות הקלט שלהלן נגזרים ישירות מקובצי המקור בתיקיית [`knowledge/sources/`](knowledge/sources/) (ומגובים בגרסאות ה-Markdown ב-[`knowledge/markdown/`](knowledge/markdown/) ובסיכומי הנושאים ב-[`knowledge/summaries/`](knowledge/summaries/INDEX.md)).

### שלב 1: מפגש ראשון ושער שלמות הנתונים (Initial Assessment & Completeness Gate)
* **קלט נתונים מובנה** (*מקורות: [`אנמנזה מנפאוזה.docx`](knowledge/sources/magid-course/אנמנזה%20מנפאוזה.docx), [`4 HRT: starting, troubleshooting & stopping`](knowledge/sources/red-whale/4%20HRT_%20a%20guide%20to%20starting,%20troubleshooting%20and%20stopping.docx)*):
  * דמוגרפיה ואורח חיים: גיל, עיסוק, BMI, לחץ דם, עישון, אלכוהול, תזונה ופעילות גופנית.
  * אנמנזה גינקולוגית ומיילדותית: נוסחה מיילדותית (G/P/Ab), סיבוכי הריון (GDM, רעלת, HTN, לידה מוקדמת – *[`CV Risk Stratification – Cho 2023`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2021.20.49.jpeg)*), גיל מנרכה, תסמיני PMS/PMDD, היסטוריית אמצעי מניעה (*[`מנופאוזה אמצעי מניעה`](knowledge/sources/red-whale/מנופאוזה%20אמצעי%20מני.docx)*).
  * דפוס דימומים: FMP/LMP, סדירות ב-12 החודשים האחרונים ועוצמת דימום.
  * רקע משפחתי וגנטי: גיל מנופאוזה במשפחה, CVD, סוכרת, VTE, אוסטאופורוזיס, בירור סקר מוטציות BRCA1/2 ו-Lynch (*[`טיפול הורמונלי לנשאיות BRCA – דר' סרבניק`](knowledge/sources/magid-course/טיפול%20הורמונלי%20לנשאיות%20BRCA-%20דר%20נעמה%20סרבניק.pdf), [`HRT & Gynaecological Cancers 12`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20gynaecological%20and%20other%20cancers%2012.docx)*).
  * **סיווג STRAW+10 אוטומטי** (*מקורות: [`אבחון שלבי גיל המעבר – דר' סיגל שקלאי`](knowledge/sources/magid-course/אבחון%20שלבי%20גיל%20המעבר-%20דר_%20סיגל%20שקלאי.pdf), [`1 Approaching and diagnosing menopause`](knowledge/sources/red-whale/1%20Approaching%20and%20diagnosing%20menopause.docx), [`אבחון – Red Whale`](knowledge/sources/red-whale/אבחון-%20RED%20WHALE.docx)*):
    - Late Reproductive (-3b, -3a)
    - Early Transition (-2)
    - Late Transition (-1)
    - Early Postmenopause (+1a, +1b, +1c)
    - Late Postmenopause (+2)
    - מצבים מיוחדים: POI (<40 – *[`ASRM/ESHRE/IMS POI 2024`](knowledge/sources/magid-course/1-s20-S0015028224023859%20%281%29_261026_194559.pdf), [`NEJM POI 2023`](knowledge/sources/magid-course/NEJMcp2116488_261026_192416.pdf)*), מנופאוזה מוקדמת (40-44), כריתת רחם/שחלות (RRSO).
  * סריקת תסמינים מפורטת ודרגת חשיבות למטופלת (*[`שאלון סימפטומים – האגודה הישראלית לגיל המעבר`](knowledge/sources/magid-course/symptoms-quiz.pdf), [`ACOG CPG No. 13 (2026)`](knowledge/sources/magid-course/ACOG.pdf), [`2 NICE Guideline 2024`](knowledge/sources/red-whale/2%20NICE%20guideline%20on%20menopause%202024_%20practice-changing%20points.docx)*): דירוג עוצמה, תדירות ודרגת חשיבות (`0–4`) ב-6 תחומים – VMS, פסיכולוגי/קוגניטיבי ("Brain Fog", חרדה, מצב רוח), סומטי (שינה, פלפיטציות, מפרקים, גרד/פורמיקציה), אורו-גניטלי ומיניות (GSM), מטבולי ותפקוד תעסוקתי/משפחתי.
  * מחשבוני סיכון: **AHA PREVENT™** / SCORE / ASCVD (*[`MDCalc #10491 AHA PREVENT`](knowledge/sources/magid-course/MDCalc-10491-AHA-PREVENT-Calculator.html), [`AHA PREVENT Slide`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2021.21.19.jpeg), [`O'Kelly 2022 CV Slide`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2021.20.54.jpeg)*), סיכון ל-VTE (*[`HRT and risk of VTE 8`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20VTE%208.docx)*), וסיכון לפתולוגיה ברירית הרחם (*[`Problematic bleeding on HRT 11`](knowledge/sources/red-whale/Approaching%20and%20managing%20problematic%20bleeding%20on%20HRT%2011.docx), [`דימומים תחת MHT – דר' פרייברג`](knowledge/sources/magid-course/דימומים%20תחת%20MHT%20-%20דר%20מרב%20פרייברג.pptx)*).
  * מנוע אינטראקציות תרופתיות (*[`Drug interactions with HRT 14`](knowledge/sources/red-whale/Drug%20interactions%20with%20HRT%2014.docx)*): זיהוי GLP-1 (עיכוב ריקון קיבה ופגיעה בספיגת פרוגסטרון פומי), משרני אנזימים/למוטריג'ין, טמוקסיפן, אלטירוקסין.
  * בדיקות מעקב ובריאות האישה (*[`הנחיות הרפואה המונעת – הר"י`](knowledge/sources/magid-course/clinical_118_HealthPromotionPreventiveMedicine.pdf), [`HRT and osteoporosis 10`](knowledge/sources/red-whale/HRT%20and%20osteoporosis%2010.docx)*): ממוגרפיה, Pap/hrHPV, בדיקות מעבדה (כימיה, שומנים, TSH, ספירת דם), DXA/FRAX.
* **שער שלמות הנתונים (Gate Logic)** (*[`אנמנזה מנפאוזה.docx`](knowledge/sources/magid-course/אנמנזה%20מנפאוזה.docx), [`הנחיות הרפואה המונעת – הר"י`](knowledge/sources/magid-course/clinical_118_HealthPromotionPreventiveMedicine.pdf), [`GEMS Overview`](knowledge/sources/red-whale/GEMS%20טייפול.pdf)*):
  * 🛑 **אם חסרים נתונים קריטיים**: המערכת עוצרת, מפיקה **דף הנחיות להשלמת בדיקות** למטופלת, ומאפשרת שמירת טיוטה.
  * ✅ **אם הנתונים שלמים ותקינים**: נפתח המעבר לשלב 2.

---

### שלב 2: מפגש הגדרת טיפול והמלצות (Treatment Formulation & Recommendations)
* **אלגוריתם קבלת החלטות טיפוליות**:
  * **סטטוס הרחם ומשטר הטיפול** (*[`5 HRT regimens and progestogen doses`](knowledge/sources/red-whale/5%20HRT%20regimens%20and%20progestogen%20doses.docx), [`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx), [`HRT ופרוגסטרון`](knowledge/sources/red-whale/HRT%20ופרוגסטרון.docx)*):
    - ללא רחם ⬅️ אסטרוגן בלבד (ET) (אלא אם קיימת היסטוריה של אנדומטריוזיס).
    - עם רחם בפרי-מנופאוזה ⬅️ טיפול משולב סדרתי/מחזורי (sHRT) עם ≥12–14 ימי פרוגסטוגן בחודש.
    - עם רחם במנופאוזה (מעל 12 חודשי אל-ווסת / מעל גיל 54 / מעל 5 שנים על טיפול סדרתי) ⬅️ טיפול משולב רציף (ccHRT).
  * **בחירת ציר המתן של אסטרוגן ומקבילות מינון (עורי מול פומי)** (*[`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx), [`3 Different types of HRT`](knowledge/sources/red-whale/3%20Different%20types%20of%20HRT_%20bioidentical,%20conjugated%20and%20synthetic.docx), [`HRT and risk of VTE 8`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20VTE%208.docx), [`Davis 2023 Estrogen Equivalence Slide`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2019.36.48.jpeg)*):
    - העדפה מובהקת למתן עורי (מדבקות / ג'ל) בנשים עם BMI ≥ 30, גיל > 60, עישון, יל"ד, מיגרנות, נטילת GLP-1, או ירידה בליבידו (שמירה על רמות SHBG).
  * **התאמת סוג ומינון הפרוגסטוגן** (*[`סוג הפרוגסטרון בטיפול ההורמונלי – דר' נעמה סרבניק`](knowledge/sources/magid-course/סוג%20הפרוגסטרון%20בטיפול%20ההורמונלי-%20דר%20נעמה%20סרבניק.pdf), [`Davis 2023 Progestogen Dose Slide`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2019.36.4.jpeg), [`HRT and breast cancer risk 7`](knowledge/sources/red-whale/HRT%20and%20breast%20cancer%20risk%207.docx), [`ACOG Israeli Options Slide`](knowledge/sources/magid-course/222.jpeg)*):
    - פרוגסטרון מיקרוניזדי טבעי (Utrogestan) – בטוח ביותר לשד ול-VTE.
    - דידרוגסטרון (Duphaston, Femoston) – בטוח ונסבל היטב.
    - התקן תוך-רחמי שחרור לבונורגסטרל 52 מ"ג (Mirena, עד 5 שנים להגנת רירית) – פתרון זהב לדימומים כבדים, אמצעי מניעה ולמטופלות GLP-1.
    - דרוספרינון (Angeliq, Slynd) – אנטי-אנדרוגני ומפחית אגירת נוזלים.
    - NETA (Evorel Conti, Activelle, Eviana) – הגנה ובניית עצם מעולה, אך בעל השפעה אנדרוגנית.
    - TSEC (Duavive) – אסטרוגן מצומד + בזדוקסיפן לנשים עם אי-סבילות לפרוגסטרון.
  * **אוכלוסיות מיוחדות**:
    - נשאיות BRCA1/2 לאחר RRSO – טיפול במינונים הולמים עד גיל 51–52 לפחות בהיעדר היסטוריה אישית של סרטן שד (*[`טיפול הורמונלי לנשאיות BRCA – דר' סרבניק`](knowledge/sources/magid-course/טיפול%20הורמונלי%20לנשאיות%20BRCA-%20דר%20נעמה%20סרבניק.pdf)*).
    - מטופלות לאחר אוטם שריר הלב (Post-MI) – הערכת רב-תחומית וטיפול עורי במינון נמוך עם פרוגסטרון מיקרוניזדי במידת הצורך (*[`BMS HRT after MI (2024)`](knowledge/sources/magid-course/21-BMS-TfC-HRT-after-myocardial-infarction-MARCH2024-A.pdf)*).
    - אי-ספיקה שחלתית מוקדמת (POI) – מינון אסטרוגן פיזיולוגי מוגבר להגנה על העצם והלב עד גיל המנופאוזה הממוצע (*[`ASRM/ESHRE/IMS POI 2024`](knowledge/sources/magid-course/1-s20-S0015028224023859%20%281%29_261026_194559.pdf), [`HRT primary prevention 13`](knowledge/sources/red-whale/HRT%20for%20primary%20prevention%20of%20chronic%20disease%2013.docx)*).
  * **טיפולים מקומיים ומשלימים** (*[`2 NICE Guideline 2024`](knowledge/sources/red-whale/2%20NICE%20guideline%20on%20menopause%202024_%20practice-changing%20points.docx), [`ACOG CPG No. 13 (2026)`](knowledge/sources/magid-course/ACOG.pdf), [`BMS Non-Hormonal Consensus (2026)`](knowledge/sources/magid-course/04-BMS-ConsensusStatement-Non-hormonal-based-treatments-for-menopausal-symptoms-JULY2026-D.pdf)*):
    - אסטרוגן מקומי נרתיקי (Vagifem, Ovestin), פראסטרון (Intrarosa), אוספמיפן.
    - טסטוסטרון עורי להפרעת תשוקה מינית (HSDD).
    - חלופות לא-הורמונליות (Fezolinetant / Veoza עם ניטור תפקודי כבד, Elinzanetant, SSRI/SNRI, Gabapentin, CBT).
* **פלט שלב 2** (*[`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx), [`מנופאוזה טיפול`](knowledge/sources/red-whale/מנופאוזה%20טיפול.docx), [`מקרים לדיון – מפגש 5`](knowledge/sources/magid-course/מקרים%20לדיון-%20מפגש%205%20קורס%20מנופאוזה%20פרקטית.pdf)*):
  * המלצה מפורטת הכוללת שמות מסחריים בישראל, מינונים ואופן נטילה.
  * דף תיאום ציפיות למטופלת (הסבר על 3–6 החודשים הראשונים והרגעת הכתמות צפויות).
  * תזמון מעקב ראשוני לאחר 3 חודשים ובהמשך שנתי.
  * תבנית מותאמת להעתקה לתיק הרפואי הממוחשב (EMR Copy-Paste).

---

### שלב 3: מעקב רב-מפגשי ופתרון בעיות (Longitudinal Follow-Up & Troubleshooting)
* **ציר זמן רב-מפגשי מצטבר (Timestamped Longitudinal Care Record)**.
* **קלט ביקור מעקב (3 חודשים, 6 חודשים ושנתי)** (*[`שאלון סימפטומים אורכי – האגודה הישראלית לגיל המעבר`](knowledge/sources/magid-course/symptoms-quiz.pdf), [`4 HRT: starting, troubleshooting & stopping`](knowledge/sources/red-whale/4%20HRT_%20a%20guide%20to%20starting,%20troubleshooting%20and%20stopping.docx)*): השוואת דירוגי תסמינים (`לפני טיפול` ⬅️ `3 חודשים` ⬅️ `6 חודשים`), הופעת תופעות לוואי, דפוס דימומים חדש, מדדים מעודכנים ותרופות חדשות.
* **מנועי פתרון בעיות (Troubleshooting)**:
  * **אלגוריתם ניהול דימומים לא סדירים (דר' מרב פרייברג & BMS 2024)** (*[`דימומים תחת MHT – דר' מרב פרייברג`](knowledge/sources/magid-course/דימומים%20תחת%20MHT%20-%20דר%20מרב%20פרייברג.pptx), [`Problematic bleeding on HRT 11`](knowledge/sources/red-whale/Approaching%20and%20managing%20problematic%20bleeding%20on%20HRT%2011.docx)*):
    - סיווג סיכון לפתולוגיה ברירית: גורם מג'ורי (BMI ≥ 40, Lynch, משטר לא מותאם) או ≥3 מינוריים (BMI 30–39, PCOS/אנובולציה, סוכרת).
    - אינטרבל הדימום: הופעה ב-6 חודשים ראשונים להתחלת טיפול (או 3 חודשים משינוי מינון) בהיעדר גורמי סיכון ⬅️ ניהול שמרני והתאמת מינון/סוג פרוגסטוגן.
    - קריטריונים להפניה דחופה לאולטרסאונד נרתיקי (Urgent TVS תוך 6 שבועות): דימום לאחר 6 חודשים, דימום כבד וממושך, או קיום גורמי סיכון לסרטן רירית הרחם.
    - ספי עובי רירית תקינים: ≤4 מ"מ בטיפול רציף (ccHRT) או ≤7 מ"מ בטיפול סדרתי (sHRT).
  * **פתרון תופעות לוואי והחלפת תכשירים** (*[`דימומים תחת MHT – דר' מרב פרייברג`](knowledge/sources/magid-course/דימומים%20תחת%20MHT%20-%20דר%20מרב%20פרייברג.pptx), [`6 HRT availability, switching & off-licence`](knowledge/sources/red-whale/HRT_%20availability,%20switching%20and%20off-licence%20prescribing%206.docx), [`GEM בעיות`](knowledge/sources/red-whale/GEM.pdf%20בעיות.pdf)*):
    - גודש בחזה ⬅️ הפחתת מינון אסטרוגן או מעבר לפרוגסטרון מיקרוניזדי.
    - נמנום ועייפות ⬅️ העברת פרוגסטרון מיקרוניזדי לשעת השינה בלילה (אפקט GABA-A).
    - תנודות במצב רוח ואקנה ⬅️ מעבר מ-NETA לדידרוגסטרון או לפרוגסטרון מיקרוניזדי.
  * **תרחיש הפסקת טיפול (Treatment Cessation)** (*[`4 HRT: starting, troubleshooting & stopping`](knowledge/sources/red-whale/4%20HRT_%20a%20guide%20to%20starting,%20troubleshooting%20and%20stopping.docx)*):
    - החלטה משותפת ללא מגבלת גיל שרירותית (או התוויות רפואיות חדשות להפסקה).
    - פרוטוקול הפחתה הדרגתית (Tapering protocol) מול הפסקה מיידית ומעקב אחר הישנות תסמינים וצפיפות עצם.

---

### מודול H: דף עזר מהיר לרופא/ה (Physician Quick-Reference Guide)
כרטיסיית עזר קלינית זמינה בכל רגע באפליקציה (*מבוססת על [`GEMS טייפול`](knowledge/sources/red-whale/GEMS%20טייפול.pdf), [`GEM בעיות`](knowledge/sources/red-whale/GEM.pdf%20בעיות.pdf), [`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx) ו-[`סוג הפרוגסטרון – דר' סרבניק`](knowledge/sources/magid-course/סוג%20הפרוגסטרון%20בטיפול%20ההורמונלי-%20דר%20נעמה%20סרבניק.pdf)*):
* שיקולי בחירת ציר המתן (עורי מול פומי) ומקבילות מינוני אסטרוגן.
* טבלת השוואת פרוגסטוגנים מפורטת (פרופיל בטיחות שד, VTE, עצם ואנדרוגניות) והתאמת מינון פרוגסטוגן למינון האסטרוגן.
* טבלת אינטראקציות תרופתיות קריטיות (GLP-1, משרני אנזימים/למוטריג'ין, טמוקסיפן, תירוקסין – *[`Drug interactions 14`](knowledge/sources/red-whale/Drug%20interactions%20with%20HRT%2014.docx)*).
* תמצית הנחיות BRCA1/2 ונשאיות לאחר RRSO (*[`נשאיות BRCA – דר' סרבניק`](knowledge/sources/magid-course/טיפול%20הורמונלי%20לנשאיות%20BRCA-%20דר%20נעמה%20סרבניק.pdf)*).
* תמצית ניהול דימומים וספי עובי רירית ב-TVS (*[`דימומים תחת MHT – דר' פרייברג`](knowledge/sources/magid-course/דימומים%20תחת%20MHT%20-%20דר%20מרב%20פרייברג.pptx), [`Problematic bleeding 11`](knowledge/sources/red-whale/Approaching%20and%20managing%20problematic%20bleeding%20on%20HRT%2011.docx)*).

---

## 📚 בסיס הידע הקליני במאגר | Clinical Knowledge Base

כל ספרות הידע הקלינית במאגר מאורגנת במבנה תלת-שכבתי עקבי תחת תיקיית [`knowledge/`](knowledge/), עם שלוש תיקיות משנה בלבד, כאשר כל שכבה מקשרת במדויק לשכבה שקדמה לה (`Layer 3` ⬅️ סעיפים מדויקים ב-`Layer 2` ⬅️ קובצי המקור ב-`Layer 1`):

### 1. שכבה 3 – סיכומי נושאים ואינדקס מרכזי: [`knowledge/summaries/`](knowledge/summaries/INDEX.md)
נקודת הכניסה המרכזית לפיתוח ולהרחבת האלגוריתם הקליני:
* [`INDEX.md`](knowledge/summaries/INDEX.md) – אינדקס ראשי, מפת עקיבות מלאה (40 מתוך 40 מקורות) ומיפוי למודולי האפליקציה.
* [`01-diagnosis-staging-and-straw10.md`](knowledge/summaries/01-diagnosis-staging-and-straw10.md) – פיזיולוגיה, מחזורי LOOP, שלבי `STRAW+10` ומתי לבדוק `FSH`.
* [`02-initial-assessment-screening-and-completeness-gate.md`](knowledge/summaries/02-initial-assessment-screening-and-completeness-gate.md) – אנמנזה מובנית, שאלון תסמינים אורכי (IMS), בדיקות סקר בסל הבריאות הישראלי (הר"י) ושער שלמות הנתונים.
* [`03-systemic-mht-regimens-routes-and-dosing.md`](knowledge/summaries/03-systemic-mht-regimens-routes-and-dosing.md) – משטרי `ET` / `sHRT` / `ccHRT`, מתן עורי מול פומי ומקבילות מינוני אסטרוגן.
* [`04-progestogen-selection-and-endometrial-protection.md`](knowledge/summaries/04-progestogen-selection-and-endometrial-protection.md) – השוואת פרוגסטוגנים והתאמת מינון פרוגסטוגן למינון האסטרוגן להגנה על רירית הרחם.
* [`05-cardiovascular-vte-and-metabolic-risk.md`](knowledge/summaries/05-cardiovascular-vte-and-metabolic-risk.md) – ריבוד סיכון קרדיווסקולרי (`ASCVD` / `AHA PREVENT™` / `SCORE`), `VTE` וטיפול לאחר אוטם שריר הלב (`Post-MI`).
* [`06-cancer-risks-osteoporosis-and-brca-carriers.md`](knowledge/summaries/06-cancer-risks-osteoporosis-and-brca-carriers.md) – סרטן שד וממאירויות גינקולוגיות, אוסטאופורוזיס ופרוטוקול נשאיות `BRCA1/2` לאחר `RRBSO`.
* [`07-poi-early-menopause-and-contraception.md`](knowledge/summaries/07-poi-early-menopause-and-contraception.md) – אי-ספיקה שחלתית מוקדמת (`POI` – הנחיות `ASRM/ESHRE 2024`), מנופאוזה מוקדמת ואמצעי מניעה בפרי-מנופאוזה.
* [`08-gsm-sexual-health-and-non-hormonal-therapies.md`](knowledge/summaries/08-gsm-sexual-health-and-non-hormonal-therapies.md) – `GSM`, טסטוסטרון ל-`HSDD` וחלופות לא-הורמונליות (`Fezolinetant`, `Elinzanetant`, `SSRI/SNRI`, `CBT`).
* [`09-unscheduled-bleeding-side-effects-interactions-and-stopping.md`](knowledge/summaries/09-unscheduled-bleeding-side-effects-interactions-and-stopping.md) – ניהול דימומים לא סדירים (`BMS 2024` / דר' פרייברג), תופעות לוואי, אינטראקציות (`GLP-1`, `Lamotrigine` ועוד) והפסקת טיפול.
* [`10-israeli-formulary-clinical-cases-and-design-alignment.md`](knowledge/summaries/10-israeli-formulary-clinical-cases-and-design-alignment.md) – פורמולריום התכשירים בישראל, 9 מקרים קליניים מקורס מגיד ושדרוגים מבוססי-ראיות למנוע ההחלטות.

### 2. שכבה 2 – גרסאות Markdown מלאות ונאמנות למקור: [`knowledge/markdown/`](knowledge/markdown/)
40 קובצי Markdown (יחס 1:1 מול קובצי הקלט ב-`knowledge/sources/`, כולל תמלול מלא של טבלאות, תרשימי זרימה ושקופיות סרוקות):
* [`knowledge/markdown/red-whale/`](knowledge/markdown/red-whale/) – **19** מדריכי **Red Whale / NICE 2024 / GEMS** וסיכומי עזר בעברית.
* [`knowledge/markdown/magid-course/`](knowledge/markdown/magid-course/) – **21** מקורות **קורס מנופאוזה פרקטית (מגיד)** (דר' סיגל שקלאי, דר' מרב פרייברג, דר' נעמה סרבניק, דר' רננה תאומים, צ'ק-ליסט אנמנזה, שאלון סימפטומים של האגודה הישראלית לגיל המעבר ו-9 מקרים לדיון), מחשבון **MDCalc #10491 AHA PREVENT™**, הנחיות **ACOG CPG No. 13 (2026)**, **ASRM/ESHRE/IMS POI (2024)**, **NEJM**, **BMS (2024–2026)** והנחיות הרפואה המונעת של הר"י.

### 3. שכבה 1 – קובצי המקור הגולמיים: [`knowledge/sources/`](knowledge/sources/)
40 קובצי הקלט המקוריים (`.docx`, `.pdf`, `.pptx`, `.jpeg`, `.html`) ללא שינוי, בשתי תיקיות מקור:
* [`knowledge/sources/red-whale/`](knowledge/sources/red-whale/) (19 קבצים): סדרת Red Whale פרקים 1–8 ו-10–14, תרשימי GEMS ([`GEMS טייפול.pdf`](knowledge/sources/red-whale/GEMS%20טייפול.pdf), [`GEM.pdf בעיות.pdf`](knowledge/sources/red-whale/GEM.pdf%20בעיות.pdf)) וסיכומי Red Whale בעברית.
* [`knowledge/sources/magid-course/`](knowledge/sources/magid-course/) (21 קבצים): הרצאות הקורס, צ'ק-ליסט [`אנמנזה מנפאוזה.docx`](knowledge/sources/magid-course/אנמנזה%20מנפאוזה.docx), [`symptoms-quiz.pdf`](knowledge/sources/magid-course/symptoms-quiz.pdf), [`MDCalc-10491-AHA-PREVENT-Calculator.html`](knowledge/sources/magid-course/MDCalc-10491-AHA-PREVENT-Calculator.html), [`ACOG.pdf`](knowledge/sources/magid-course/ACOG.pdf), [`clinical_118_HealthPromotionPreventiveMedicine.pdf`](knowledge/sources/magid-course/clinical_118_HealthPromotionPreventiveMedicine.pdf), מאמרי `ASRM/ESHRE/IMS POI`, `NEJM`, `BMS` ושקופיות העזר הקליניות.

---

## 💻 הצעת יישום טכנולוגי ל-GitHub Pages | Implementation Architecture

GitHub Pages מארח אתרים סטטיים (HTML/JS/CSS) במהירות, באמינות גבוהה ובחינם. מאחר שהאפליקציה פועלת במודל **Zero-Server (Client-Side Only)**, מדובר בהתאמה מושלמת!

### אפשרויות פיתוח מומלצות:

| גישה | טכנולוגיות | יתרונות | מומלץ עבור |
|---|---|---|---|
| **Option A (מומלץ ביותר)** | **React 18 + Vite + TypeScript + Tailwind CSS (RTL)** | מודולריות מלאה, Type-Safety לכללי האלגוריתם הרפואי, רכיבי UI מתקדמים (shadcn/ui), תמיכה ב-PWA (שימוש Offline במרפאה). נבנה אוטומטית באמצעות GitHub Actions. | **פיתוח יישום מלא, עשיר ומודרני** |
| **Option B (אפס התקנות)** | **Single-Page Vanilla JS / Alpine.js + Tailwind CDN** | קובץ `index.html` אחד שרץ ישירות בלחיצה כפולה בכל מחשב, אפס צורך ב-Node.js מקומי או כלי בנייה. נפרס מיידית ל-GitHub Pages. | **גרסת אבטיפוס מיידית ומהירה לבדיקה** |
| **Option C** | **Vue 3 / Svelte 5 + Vite** | קל משקל, ביצועים מהירים ותחביר פשוט. | חלופה ל-React בהתאם להעדפת המפתחת |

### רכיבים טכנולוגיים מומלצים לאפליקציה:
1. **הצפנה מקומית**: Web Crypto API תקני (`crypto.subtle.encrypt` ב-AES-GCM עם גזירת מפתח PBKDF2) – ללא צורך בספריות חיצוניות כבדות.
2. **דחיסה ויצירת QR**: ספריות `lz-string` (לכיווץ מחרוזת הנתונים) ו-`qrcode` / `html5-qrcode` (להצגה וסריקה במצלמה).
3. **עיצוב מותאם רפואה (Clinical UI)**:
   - כיווניות עברית מלאה (`dir="rtl"`).
   - עיצוב נקי וברור בצבעי בריאות (טורקיז/ורד עדין/כחול רפואי).
   - כפתורי בחירה מהירה (Quick Chips / Toggle Groups) למילוי טופס בתוך 2-3 דקות.
   - התראות בולטות בצבעי אזהרה (אדום/צהוב/ירוק) לשערי החלטה ודימומים חשודים.
4. **ייצוא והדפסה (Print & EMR CSS)**:
   - כפתור "העתק סיכום לתיק" שמעצב את המסקנות לפסקה מסודרת המותאמת להדבקה במערכות קליקס, עותם, צבעים, מזור וכד'.
   - סגנון הדפסה נקי (`@media print`) המפיק דף הנחיות מסודר למטופלת ללא תפריטי האפליקציה.
5. **תמיכת Offline (PWA)**: הוספת Service Worker ומניפסט המאפשרים לרופאה להתקין את האפליקציה כאייקון על שולחן העבודה ולפתוח אותה גם בעת נפילת רשת במרפאה.

---

## 📁 מבנה הפרויקט המוצע | Proposed Repository Structure

```
menopause-app/
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # פריסה אוטומטית ל-GitHub Pages בכל Push
│
├── src/                          # קוד המקור (React / Vite)
│   ├── assets/                   # תמונות, אייקונים וסמלים
│   ├── clinical-engine/          # מנוע קבלת ההחלטות הקליני (טהור, מבודד מ-UI)
│   │   ├── straw10.ts            # סיווג שלבי STRAW+10
│   │   ├── riskCalculators.ts    # מחשבוני סיכון (VTE, CVD, Endometrial)
│   │   ├── completenessGate.ts   # שער שלמות נתונים והנחיות השלמה
│   │   ├── treatmentEngine.ts    # אלגוריתם בחירת MHT וצורת מתן
│   │   ├── bleedingAlgorithm.ts  # אלגוריתם ניהול דימומים (דר' פרייברג / BMS)
│   │   └── drugInteractions.ts   # זיהוי אינטראקציות תרופתיות (GLP-1 וכו')
│   │
│   ├── components/               # רכיבי הממשק
│   │   ├── layout/               # Header, Footer, Stepper, מודול H
│   │   ├── stage1/               # טפסי אנמנזה, תסמינים ובדיקות
│   │   ├── stage2/               # המלצות טיפוליות, ארסנל תרופות
│   │   ├── stage3/               # ציר זמן אורכי, מעקב ופתרון בעיות
│   │   └── common/               # QR Scanner, כפתורי הדפסה, מודאלים
│   │
│   ├── services/                 # שירותי תשתית
│   │   ├── cryptoService.ts      # הצפנה ופענוח נתונים מקומי
│   │   ├── qrService.ts          # דחיסה ופריקת קוד QR
│   │   └── emrExportService.ts   # פורמט העתקה לתיק הרפואי
│   │
│   ├── data/                     # מאגרי נתונים סטטיים
│   │   ├── drugArsenal.json      # שמות מסחריים בישראל, מינונים והתוויות
│   │   └── referenceGuide.json   # תוכן מודול H לרופא/ה
│   │
│   ├── App.tsx                   # רכיב ראשי וניהול מעבר בין שלבים
│   └── main.tsx
│
├── knowledge/                    # בסיס הידע הקליני (3 שכבות מקושרות)
│   ├── sources/                  # שכבה 1: קובצי הקלט המקוריים (red-whale, magid-course)
│   ├── markdown/                 # שכבה 2: גרסאות Markdown מלאות ונאמנות למקור (1:1 מול sources)
│   └── summaries/                # שכבה 3: אינדקס ראשי (INDEX.md) ו-10 סיכומי נושאים קליניים
│
├── .gitignore
├── package.json
└── README.md                     # מסמך זה
```

---

## 🚀 מדריך פריסה והפעלה ב-GitHub Pages

כאשר קוד האפליקציה ייבנה, תהליך הפריסה ל-GitHub Pages מתבצע ישירות מתוך המאגר:
1. במאגר ב-GitHub: כניסה ל-**Settings** ⬅️ **Pages**.
2. תחת **Build and deployment** ⬅️ **Source**: בחירה ב-**GitHub Actions**.
3. כל `git push` לענף הראשי (`main`) יפעיל את תהליך ה-Build והאפליקציה תעלה אוטומטית לכתובת:
   `https://rachel400-git.github.io/menopause-app/`
