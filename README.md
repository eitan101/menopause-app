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

### שלב 1: מפגש ראשון – איסוף נתונים מקיף, הערכת סיכונים ושער שלמות (Initial Assessment & Completeness Gate)
> בכל אחת מקטגוריות האיסוף בשלב 1 משולב **שדה הערות במלל חופשי לידיעת הרופא/ה** (לתיעוד מחלות רקע אחרות, תרופות/תוספים נוספים ודגשים קליניים בתיק המטופלת ובסיכום ה-EMR, גם כאשר אינם משנים ישירות את עץ ההחלטה האלגוריתמי).

* **1. דמוגרפיה, מדדים ואורח חיים** (*מקורות: [`אנמנזה מנפאוזה.docx`](knowledge/sources/magid-course/אנמנזה%20מנפאוזה.docx), [`4 HRT: starting, troubleshooting & stopping`](knowledge/sources/red-whale/4%20HRT_%20a%20guide%20to%20starting,%20troubleshooting%20and%20stopping.docx)*):
  * גיל, עיסוק, מוצא אתני (זיהוי זכאות סל לבדיקת `BRCA1/2` במוצא אשכנזי מלא/חלקי מגיל 25), חישוב `BMI` אוטומטי, לחץ דם במרפאה, עישון, אלכוהול, תזונה/סידן ופעילות גופנית.
* **2. דפוס דימומים, סיווג `STRAW+10` ואמצעי מניעה נוכחיים** (*מקורות: [`אבחון שלבי גיל המעבר – דר' סיגל שקלאי`](knowledge/sources/magid-course/אבחון%20שלבי%20גיל%20המעבר-%20דר_%20סיגל%20שקלאי.pdf), [`1 Approaching and diagnosing menopause`](knowledge/sources/red-whale/1%20Approaching%20and%20diagnosing%20menopause.docx), [`אבחון – Red Whale`](knowledge/sources/red-whale/אבחון-%20RED%20WHALE.docx), [`מנופאוזה אמצעי מניעה`](knowledge/sources/red-whale/מנופאוזה%20אמצעי%20מני.docx)*):
  * סיווג `STRAW+10` אוטומטי (`-3b/-3a` כולל זיהוי תסמינים ב-`-3a`, `-2`, `-1`, `+1a/+1b/+1c`, `+2`), הבחנה בין **כריתת רחם עם שימור שחלות** לבין **כריתת שחלות דו-צדדית (`BSO/RRSO`)**, וזיהוי **אי-ספיקה שחלתית מוקדמת (`POI <40` – אימות ב-`FSH > 25 IU/L` בבדיקה בודדת לפי [`ASRM/ESHRE/IMS POI 2024`](knowledge/sources/magid-course/1-s20-S0015028224023859%20%281%29_261026_194559.pdf) ו-[`NEJM POI 2023`](knowledge/sources/magid-course/NEJMcp2116488_261026_192416.pdf))** ומנופאוזה מוקדמת (`40–44`).
  * **אמצעי מניעה נוכחיים וצורך במניעת הריון:** תיעוד השיטה הנוכחית (`Mirena 52mg` **כולל תאריך התקנה לבקרת תוקף 5 שנים להגנת רירית ב-MHT**, התקן נחושת/`Kyleena`, גלולות פרוגסטוגן בלבד `POP`/`Slynd` שאינן מגינות על הרירית ב-MHT, גלולות משולבות `CHC` עם התראת החלפה בגיל `≥50`, או חציצה) וחישוב משך הצורך במניעת הריון (`2 שנים` מתחת לגיל 50, `שנה אחת` מגיל 50, או כלל `FSH > 30 IU/L`).
* **3. איסוף סימפטומים מובנה ודרגת חשיבות למטופלת (`IMS 19-Item Matrix`)** (*מקורות: [`שאלון סימפטומים – האגודה הישראלית לגיל המעבר`](knowledge/sources/magid-course/symptoms-quiz.pdf), [`ACOG CPG No. 13 (2026)`](knowledge/sources/magid-course/ACOG.pdf), [`2 NICE Guideline 2024`](knowledge/sources/red-whale/2%20NICE%20guideline%20on%20menopause%202024_%20practice-changing%20points.docx)*):
  * דירוג מובנה של **עוצמה (`0–4`)**, **תדירות (`0–4` לתסמינים וזומוטוריים/נוירו-וסקולריים)** ו**דרגת חשיבות למטופלת (`0–4`)** ב-19 תסמינים על פני 6 תחומים: וזומוטורי, פסיכולוגי/קוגניטיבי (`Brain Fog`, חרדה, מצב רוח), סומטי (שינה, פלפיטציות, מפרקים, פורמיקציה), אורו-גניטלי ומיניות (`GSM`/`HSDD`), מטבולי ותפקוד תעסוקתי/משפחתי.
* **4. מחלות רקע רלוונטיות לקבלת החלטה – עץ היררכי מתקפל** (*מקורות: [`4 HRT: starting, troubleshooting & stopping`](knowledge/sources/red-whale/4%20HRT_%20a%20guide%20to%20starting,%20troubleshooting%20and%20stopping.docx), [`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx), [`HRT & Gynaecological Cancers 12`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20gynaecological%20and%20other%20cancers%2012.docx), [`HRT and risk of VTE 8`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20VTE%208.docx)*):
  * סימון קטגוריית-אב פותח תתי-אפשרויות ממוקדות: (א) **ממאירויות ונגעי שד** (סרטן שד `HR+`/`HR-`, `DCIS`/אטיפיה, ביופסיה שפירה ללא אטיפיה, סרטן רירית/שחלה/צוואר/מעי); (ב) **דימום חריג, גינקולוגיה וסיבוכי הריון** (דימום לא מוסבר, אנדומטריוזיס, שרירנים, היפרפלזיה, `PCOS`, `PMS/PMDD`, רעלת הריון/יל"ד הריוני/`GDM`/לידה מוקדמת – *[`CV Risk Stratification – Cho 2023`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2021.20.49.jpeg)*); (ג) **הפרעות קרישה ו-`VTE`** (`DVT/PE` פעיל לעומת `VTE` בעבר עם/ללא גורם מעורר, תרומבופיליה ידועה, דליות/פקקת שטחית); (ד) **לב, כלי דם ומטבוליזם** (אירוע עורקי חריף לעומת `Post-MI` יציב – *[`BMS HRT after MI (2024)`](knowledge/sources/magid-course/21-BMS-TfC-HRT-after-myocardial-infarction-MARCH2024-A.pdf)*, יל"ד, סוכרת, דיסליפידמיה והיפרטריגליצרידמיה); (ה) **כבד, מרה, כליות ומעי** (מחלת כבד פעילה/פורפיריה לעומת כבד שומני/אבני מרה, `CKD`/כליה בודדת, תת-ספיגה/ניתוח בריאטרי); (ו) **נוירולוגיה** (מיגרנה עם/ללא אאורה, אפילפסיה, מנינגיומה); (ז) **אנדוקרינולוגיה, עצם ואוטואימוני** (בלוטת התריס, אוסטאופורוזיס/שבר, `SLE`/`RA`/`IBD`); (ח) **אלרגיות ורגישויות** (אלרגיה לבוטנים/סויה החוסמת `Utrogestan`, רגישות לדבק מדבקות) + שדה מחלות רקע אחרות במלל חופשי.
* **5. תרופות קבועות ואינטראקציות – עץ היררכי** (*מקור: [`Drug interactions with HRT 14`](knowledge/sources/red-whale/Drug%20interactions%20with%20HRT%2014.docx)*):
  * (א) `GLP-1 / GIP` (`Ozempic`, `Wegovy`, `Mounjaro`) ותרופות סוכרת; (ב) נוירולוגיה ואפילפסיה (**`Lamotrigine`** עם ירידת רמות תחת אסטרוגן פומי, ומשרני אנזימי `CYP3A4`); (ג) טיפול אנדוקריני אונקולוגי (`Tamoxifen` החוסם גם `Paroxetine`/`Fluoxetine`, מעכבי ארומטאז); (ד) בלוטת התריס (`Levothyroxine` + זיהוי `TSH` מדוכא המחקה גלי חום) וסטרואידים; (ה) תרופות ל"ד (`ACEi`/`ARB`/אוגרי אשלגן מול `Angeliq`), סטטינים ונוגדי קרישה; (ו) `SSRI/SNRI`, גבפנטין ושינה + תרופות ותוספים במלל חופשי.
* **6. מחלות במשפחה ורקע גנטי** (*מקורות: [`טיפול הורמונלי לנשאיות BRCA – דר' סרבניק`](knowledge/sources/magid-course/טיפול%20הורמונלי%20לנשאיות%20BRCA-%20דר%20נעמה%20סרבניק.pdf), [`HRT & Gynaecological Cancers 12`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20gynaecological%20and%20other%20cancers%2012.docx)*):
  * סרטן שד/שחלה במשפחה וגיל אבחנה, סרטן רירית/מעי ותסמונת `Lynch`, סטטוס `BRCA1/2`, מחלת לב מוקדמת בקרוב מדרגה ראשונה, `VTE`/תרומבופיליה במשפחה, אוסטאופורוזיס/שבר ירך בהורים, סוכרת וגיל מנופאוזה של האם.
* **7. פתיחה דינמית של מחשבוני סיכון רלוונטיים**:
  * בנוכחות מחלת רקע קרדיו-מטבולית/כלייתית, עישון, השמנה, מעצימי סיכון נשיים או גיל רלוונטי נפתח אוטומטית **מחשבון `AHA PREVENT™` מובנה** (*[`MDCalc #10491 AHA PREVENT`](knowledge/sources/magid-course/MDCalc-10491-AHA-PREVENT-Calculator.html), [`AHA PREVENT Slide`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2021.21.19.jpeg), [`O'Kelly 2022 CV Slide`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2021.20.54.jpeg)*) המחשב סיכון ל-10 ול-30 שנה ל-`Total CVD`, `ASCVD` ואי-ספיקת לב (כולל חישוב `eGFR` ממשוואת `CKD-EPI 2021`), לצד מחשבוני סיכון ל-`VTE` (*[`HRT and risk of VTE 8`](knowledge/sources/red-whale/HRT%20and%20risk%20of%20VTE%208.docx)*), פתולוגיית רירית הרחם (*[`Problematic bleeding on HRT 11`](knowledge/sources/red-whale/Approaching%20and%20managing%20problematic%20bleeding%20on%20HRT%2011.docx)*) ואוסטאופורוזיס (`DXA`/`FRAX`).
* **8. העדפות המטופלת וטיפולי עבר שנכשלו**:
  * עמדת המטופלת לגבי הורמונים (לרבות העדפה להימנע מהורמונים), העדפת צורת מתן (ג'ל / מדבקה / פומי / התקן), העדפת העדר דימום ופירוט **טיפולי עבר שנוסו והופסקו** (וסיבת ההפסקה) – נתונים אלו משנים בזמן אמת את דירוג אופציות הטיפול בשלב 2.
* **9. בדיקות סקר ומעבדה לפי גיל וסל הבריאות ושער שלמות הנתונים** (*[`הנחיות הרפואה המונעת – הר"י`](knowledge/sources/magid-course/clinical_118_HealthPromotionPreventiveMedicine.pdf), [`HRT and osteoporosis 10`](knowledge/sources/red-whale/HRT%20and%20osteoporosis%2010.docx), [`GEMS Overview`](knowledge/sources/red-whale/GEMS%20טייפול.pdf)*):
  * ספי סל מותאמי גיל (ממוגרפיה דו-שנתית בגילאי `50–74` או מגיל `40` בסיכון מוגבר, `hrHPV/Pap` בגילאי `25–65`, סקר `BRCA` אשכנזי `≥25`, `DXA`, `FIT`, `CBC`/פריטין, שומנים/סוכר, תפקודי כבד/כליה ו-`TSH`).
  * 🛑 **אם קיימת חסימת בטיחות לבירור מיידי** (כגון דימום לא מוסבר, ממצא חשוד בשד, ל"ד `≥180/110` או בדיקת סקר חיונית חסרה לגיל): הפקת דף הנחיות להשלמת בירור. התווית נגד ל-MHT (כגון סרטן שד) פותחת מעבר ישיר לשלב 2 ב**מסלול טיפולים לא-הורמונליים וטיפול מקומי מותאם**.

---

### שלב 2: מפגש הגדרת טיפול – השוואת חלופות מדורגות, טיפול לא-הורמונלי ותיעוד הבחירה (Treatment Formulation & Selection)
* **הצגת מספר אופציות טיפול מדורגות עם יתרונות וחסרונות**:
  * המנוע מפיק ומדרג מספר חלופות קונקרטיות המותאמות למטופלת (*[`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx), [`5 HRT regimens and progestogen doses`](knowledge/sources/red-whale/5%20HRT%20regimens%20and%20progestogen%20doses.docx), [`3 Different types of HRT`](knowledge/sources/red-whale/3%20Different%20types%20of%20HRT_%20bioidentical,%20conjugated%20and%20synthetic.docx), [`סוג הפרוגסטרון – דר' סרבניק`](knowledge/sources/magid-course/סוג%20הפרוגסטרון%20בטיפול%20ההורמונלי-%20דר%20נעמה%20סרבניק.pdf), [`HRT ופרוגסטרון`](knowledge/sources/red-whale/HRT%20ופרוגסטרון.docx), [`HRT and breast cancer risk 7`](knowledge/sources/red-whale/HRT%20and%20breast%20cancer%20risk%207.docx), [`HRT primary prevention 13`](knowledge/sources/red-whale/HRT%20for%20primary%20prevention%20of%20chronic%20disease%2013.docx)*):
    - חלופות עוריות (ג'ל `Estrogel` / `Sandrena`, מדבקות `Evorel` / `Evorel Conti`), חלופה מבוססת התקן `Mirena 52mg`, חלופות פומיות (`Femoston`, `Estrofem` + `Utrogestan`/`Duphaston`, `Angeliq`, `Activelle`) וחלופות ללא פרוגסטוגן (`Duavive` / `Livial`).
    - **התאמה פרופורציונלית אוטומטית של מינון הפרוגסטוגן למינון האסטרוגן** (*[`Davis 2023 Estrogen Equivalence`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2019.36.48.jpeg), [`Davis 2023 Progestogen Dose`](knowledge/sources/magid-course/WhatsApp%20Image%202026-11-09%20at%2019.36.4.jpeg), [`ACOG Israeli Options Slide`](knowledge/sources/magid-course/222.jpeg)*) והתאמת מינון פיזיולוגי מוגבר ב-`POI` ובנשאיות `BRCA` צעירות לאחר `RRSO`.
    - לכל אופציה מוצגים **ציון התאמה, יתרונות (`Pros`), חסרונות ודגשים (`Cons`)**, שמות מסחריים בישראל ואופן נטילה.
* **אפשרויות לטיפול לא-הורמונלי וטיפולים מקומיים (`GSM` / `HSDD`)** (*[`ACOG CPG No. 13 (2026)`](knowledge/sources/magid-course/ACOG.pdf), [`BMS Non-Hormonal Consensus (2026)`](knowledge/sources/magid-course/04-BMS-ConsensusStatement-Non-hormonal-based-treatments-for-menopausal-symptoms-JULY2026-D.pdf), [`2 NICE Guideline 2024`](knowledge/sources/red-whale/2%20NICE%20guideline%20on%20menopause%202024_%20practice-changing%20points.docx)*):
  * הצגה ודירוג של חלופות לא-הורמונליות מבוססות-ראיות (המדורגות ראשונות בהתווית נגד ל-MHT או כשהמטופלת מעדיפה להימנע מהורמונים): **`Veoza` (`Fezolinetant 45mg` + לוח ניטור תפקודי כבד בחודשים `0, 1, 2, 3, 6, 9`)**, **`Lynkuet` (`Elinzanetant 120mg`)**, **`SSRI/SNRI`** (`Venlafaxine`, `Escitalopram` – עם חסימת `Paroxetine`/`Fluoxetine` תחת `Tamoxifen`), **`Gabapentin`**, **`Oxybutynin`**, **`CBT` ממוקד מנופאוזה (`MENOS`)** והיפנוזה קלינית.
  * שילוב טיפול מקומי ל-`GSM` (חומרי לחות/סיכה, `Vagifem`, `Ovestin`, `Intrarosa`, `Ospemifene` – כולל התאמה ל-`Tamoxifen` מול מעכבי ארומטאז) וטסטוסטרון עורי ל-`HSDD`.
* **תיעוד האופציה שנבחרה, נימוק הבחירה והערות מתוארכות** (*[`מנופאוזה טיפול`](knowledge/sources/red-whale/מנופאוזה%20טיפול.docx), [`מקרים לדיון – מפגש 5`](knowledge/sources/magid-course/מקרים%20לדיון-%20מפגש%205%20קורס%20מנופאוזה%20פרקטית.pdf)*):
  * בחירה מפורשת של הטיפול הפעיל, תיעוד **מדוע נבחרה האופציה** (תגיות מובנות + מלל חופשי), **שדה הערות במלל חופשי עם תיעוד תאריך ושעה אוטומטי**, דף תיאום ציפיות למטופלת וייצוא מסודר ל-EMR.

---

### שלב 3: מעקב רב-מפגשי, הערכת שינוי בתסמינים ושינוי תרופתי (Longitudinal Follow-Up & Troubleshooting)
* **1. מעבר חוזר ותיעוד השינוי בסימפטומים (`IMS Longitudinal Delta`)** (*[`שאלון סימפטומים אורכי – האגודה הישראלית לגיל המעבר`](knowledge/sources/magid-course/symptoms-quiz.pdf)*):
  * הערכה מחודשת של התסמינים בביקורי `3 חודשים`, `6 חודשים` ושנתי מול קו הבסיס והביקור הקודם, חישוב דלתא (`Δ`) אוטומטי בתסמינים בעלי החשיבות הגבוהה למטופלת, וזיהוי תת-תגובה (כולל בדיקת ספיגה עורית / `Serum Estradiol`).
* **2. וידוא שהרקע הרפואי והתרופתי לא השתנה**:
  * אימות מובנה של שינויים במחלות רקע, לחץ דם, `BMI`, תרופות חדשות (`GLP-1`, `Lamotrigine`, `Eltroxin`), בדיקות סקר (`ממוגרפיה`, `Pap`, תפקודי כבד תחת `Veoza`) ותוקף 5 שנים של התקן `Mirena`, עם הרצה חוזרת של התראות הבטיחות.
* **3. בירור תופעות לוואי מותאם לתרופה שניתנה ואלגוריתם דימומים** (*[`דימומים תחת MHT – דר' מרב פרייברג`](knowledge/sources/magid-course/דימומים%20תחת%20MHT%20-%20דר%20מרב%20פרייברג.pptx), [`Problematic bleeding on HRT 11`](knowledge/sources/red-whale/Approaching%20and%20managing%20problematic%20bleeding%20on%20HRT%2011.docx), [`6 HRT availability, switching & off-licence`](knowledge/sources/red-whale/HRT_%20availability,%20switching%20and%20off-licence%20prescribing%206.docx), [`GEM בעיות`](knowledge/sources/red-whale/GEM.pdf%20בעיות.pdf)*):
  * שאלון תופעות לוואי ממוקד לתכשיר הפעיל של המטופלת (אסטרוגניות, פרוגסטוגניות של `Utrogestan` מול `NETA`/`Duphaston`/`Angeliq`, תגובות עוריות במדבקה/ג'ל, תפקודי כבד ותסמיני GI תחת `Veoza`, או תופעות `SSRI/SNRI`/גבפנטין).
  * אלגוריתם `BMS 2024` ודר' פרייברג המלא לניהול דימומים לא סדירים (גורמים מג'וריים ומינוריים, חלון `6 חודשים` / `3 חודשים משינוי מינון`, ספי `TVS` של `≤4 מ"מ` ב-`ccHRT` ו-`≤7 מ"מ` ב-`sHRT`, ובדיקת חלוף דימום 4 שבועות מהפסקה).
* **4. אופציה מובנית לשינוי תרופתי והערות מתוארכות** (*[`4 HRT: starting, troubleshooting & stopping`](knowledge/sources/red-whale/4%20HRT_%20a%20guide%20to%20starting,%20troubleshooting%20and%20stopping.docx)*):
  * בחירה ותיעוד של: המשך טיפול זהה, **עליית מינון** (תוך התאמה אוטומטית של מינון הפרוגסטוגן!), **הפחתת מינון**, **החלפת תרופה או צורת מתן** (עדכון הטיפול הפעיל בתיק), הוספת טיפול מקומי או **פרוטוקול הפחתה הדרגתית/הפסקה (`Tapering`)**, ולצדם **יומן הערות במלל חופשי עם תיעוד תאריך ושעה מדויקים**.

---

### מודול H: כרטיסיית עזר דינמית לרופא/ה המותאמת לנתוני המטופלת (Patient-Tailored Dynamic Physician Reference)
מודול עזר חכם הזמין מכל שלב באפליקציה ו**מותאם בזמן אמת לפרופיל המטופלת הפעילה** (*מבוסס על [`GEMS טייפול`](knowledge/sources/red-whale/GEMS%20טייפול.pdf), [`GEM בעיות`](knowledge/sources/red-whale/GEM.pdf%20בעיות.pdf), [`טיפול – דר' רננה תאומים`](knowledge/sources/magid-course/טיפול%20-%20רננה.pptx), [`סוג הפרוגסטרון – דר' סרבניק`](knowledge/sources/magid-course/סוג%20הפרוגסטרון%20בטיפול%20ההורמונלי-%20דר%20נעמה%20סרבניק.pdf), [`Drug interactions 14`](knowledge/sources/red-whale/Drug%20interactions%20with%20HRT%2014.docx), [`נשאיות BRCA – דר' סרבניק`](knowledge/sources/magid-course/טיפול%20הורמונלי%20לנשאיות%20BRCA-%20דר%20נעמה%20סרבניק.pdf) ו-[`דימומים תחת MHT – דר' פרייברג`](knowledge/sources/magid-course/דימומים%20תחת%20MHT%20-%20דר%20מרב%20פרייברג.pptx)*):
* **תקציר קליני מותאם אישית למטופלת הנוכחית:** מציג בראש המודול את הדגשים הקליניים הנגזרים ישירות מנתוניה – נימוקי ציר המתן עבורה, תוצאת `AHA PREVENT™` ומשמעותה, מדרגת המינון המותאמת (כולל יחס אסטרוגן:פרוגסטוגן עבורה), אינטראקציות פעילות בתרופותיה, בדיקות סקר בסל הנדרשות לגילה/מוצאה, ודגשי מעקב לתכשיר שנבחר לה.
* **לשוניות עזר מלאות עם הדגשת השורות הרלוונטיות למטופלת:** מקבילות אסטרוגן ומינוני פרוגסטוגן, השוואת פרוגסטוגנים ו-`TSEC`, חלופות לא-הורמונליות ו-`GSM`, אינטראקציות ואוכלוסיות מיוחדות (`BRCA`, `POI`, `Post-MI`, אמצעי מניעה) ועץ ניהול דימומים וספי `TVS`.

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
* [`knowledge/sources/magid-course/`](knowledge/sources/magid-course/) (21 קבצים): הרצאות הקורס, צ'ק-ליסט [`אנמנזה מנפאוזה.docx`](knowledge/sources/magid-course/אנמנזה%20מנפאוזה.docx), [`symptoms-quiz.pdf`](knowledge/sources/magid-course/symptoms-quiz.pdf) (הורד במקור מ-[אתר האגודה הישראלית לגיל המעבר](https://www.menopause.org.il/news-updates/%d7%a9%d7%90%d7%9c%d7%95%d7%9f-%d7%a1%d7%99%d7%9e%d7%a4%d7%98%d7%95%d7%9e%d7%99%d7%9d/)), [`MDCalc-10491-AHA-PREVENT-Calculator.html`](knowledge/sources/magid-course/MDCalc-10491-AHA-PREVENT-Calculator.html), [`ACOG.pdf`](knowledge/sources/magid-course/ACOG.pdf), [`clinical_118_HealthPromotionPreventiveMedicine.pdf`](knowledge/sources/magid-course/clinical_118_HealthPromotionPreventiveMedicine.pdf), מאמרי `ASRM/ESHRE/IMS POI`, `NEJM`, `BMS` ושקופיות העזר הקליניות.

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

## 📁 מבנה הפרויקט | Repository Structure

```
menopause-app/
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # פריסה אוטומטית ל-GitHub Pages בכל Push
│
├── scripts/
│   └── build-standalone.mjs      # הידור אוטומטי של standalone.html מתוך קוד המקור (אפס פערים)
│
├── src/                          # קוד המקור המאוחד (React 18 + TypeScript + Tailwind RTL)
│   ├── clinical-engine/          # מנוע קבלת ההחלטות הקליני (טהור, מבודד מ-UI)
│   │   ├── types.ts              # מודלי הנתונים ההיררכיים, העדפות ומעקב אורכי
│   │   ├── defaults.ts           # ערכי ברירת מחדל ונרמול/שדרוג תיקים לאחור
│   │   ├── imsSymptoms.ts        # שאלון 19 הסימפטומים של האגודה הישראלית לגיל המעבר (IMS)
│   │   ├── strawStaging.ts       # סיווג STRAW+10, POI (FSH>25) ובקרת מירנה/אמצעי מניעה
│   │   ├── riskCalculators.ts    # מחשבון AHA PREVENT™ (10y/30y), VTE, רירית (BMS) ועצם
│   │   ├── completenessGate.ts   # שער שלמות ובדיקות סקר לפי סל הבריאות בישראל
│   │   ├── drugInteractions.ts   # אינטראקציות ורגישויות (GLP-1, למוטריג'ין, טמוקסיפן, בוטנים/סויה)
│   │   ├── treatmentEngine.ts    # דירוג חלופות הורמונליות ולא-הורמונליות עם יתרונות וחסרונות
│   │   ├── bleedingAlgorithm.ts  # אלגוריתם ניהול דימומים וספי TVS (BMS 2024 / דר' פרייברג)
│   │   ├── sideEffectEngine.ts   # תופעות לוואי ספציפיות לתרופה ושינוי/טיטרציית מינונים
│   │   └── data/
│   │       └── drugArsenal.ts    # פורמולריום התכשירים בישראל (MHT, לא-הורמונלי, GSM וטסטוסטרון)
│   │
│   ├── components/               # רכיבי הממשק
│   │   ├── layout/               # Header, Stepper
│   │   ├── stage1/               # Stage1View – 9 פרקי אנמנזה היררכיים, IMS ו-PREVENT
│   │   ├── stage2/               # Stage2View – דירוג חלופות, בחירה ונימוק והערות מתוארכות
│   │   ├── stage3/               # Stage3View – דלתא סימפטומים, אימות רקע, תופעות לוואי ושינוי תרופה
│   │   └── modals/               # ModuleHModal (דינמי למטופלת!), PrintModal, QrModal
│   │
│   ├── services/                 # שירותי תשתית מקומיים (Zero-Server)
│   │   ├── cryptoService.ts      # הצפנה ופענוח AES-GCM 256-bit בדפדפן
│   │   ├── qrPersistence.ts      # דחיסה ופריקת קוד QR מלא
│   │   └── emrExportService.ts   # הפקת סיכום מובנה לרשומה הרפואית (EMR)
│   │
│   ├── App.tsx                   # ניהול זרימת 3 השלבים והמודאלים
│   └── main.tsx
│
├── knowledge/                    # בסיס הידע הקליני (3 שכבות מקושרות)
│   ├── sources/                  # שכבה 1: קובצי הקלט המקוריים (red-whale, magid-course)
│   ├── markdown/                 # שכבה 2: גרסאות Markdown מלאות ונאמנות למקור (1:1 מול sources)
│   └── summaries/                # שכבה 3: אינדקס ראשי (INDEX.md) ו-10 סיכומי נושאים קליניים
│
├── index.html                    # נקודת הכניסה הראשית (Vite + ניתוב אוטומטי ל-standalone בפתיחה מקומית)
├── standalone.html               # קובץ יחיד מהודר אוטומטית מ-src/ להרצה מיידית ללא שרת
├── package.json
└── README.md                     # מסמך זה
```

---

## 🚀 מדריך פריסה והפעלה ב-GitHub Pages או מקומית

תהליך הפריסה ל-GitHub Pages מוגדר אוטומטית ב-[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
1. במאגר ב-GitHub: כניסה ל-**Settings** ⬅️ **Pages**.
2. תחת **Build and deployment** ⬅️ **Source**: בחירה ב-**GitHub Actions**.
3. כל `git push` לענף הראשי (`main`) יפעיל את `npm run build` והאפליקציה תיפרס אוטומטית לכתובת:
   `https://eitan101.github.io/menopause-app/`
4. **הרצה מקומית במרפאה ללא התקנות:** ניתן לפתוח ישירות את [`standalone.html`](standalone.html) (או [`index.html`](index.html)) בכל דפדפן, או להריץ שרת פיתוח מקומי באמצעות `npm install && npm run dev`.
