# מפרט בדיקות מערכת קליניות (System Test Specification)

> **מטרת המסמך:** הגדרת מערך בדיקות מערכתיות מקצה לקצה (Stage 1 ⬅️ Stage 2 ⬅️ Stage 3 ⬅️ פלטי מטופלת ואיפוס תיק) לוידוא תקינות, דיוק ובטיחות מערכת תומכת ההחלטה הקלינית לניהול גיל המעבר.
>
> **קישוריות דו-כיוונית (Bidirectional Traceability):**
> * כל תרחיש במסמך זה מקשר ישירות לפונקציית הבדיקה האוטומטית המממשת אותו בקובץ [`tests/systemScenarios.test.ts`](../tests/systemScenarios.test.ts) וכן למקורות הידע הקליניים ב-[`knowledge/`](../knowledge/summaries/INDEX.md).
> * כל בדיקה ב-[`tests/systemScenarios.test.ts`](../tests/systemScenarios.test.ts) מכילה הפניה מובנית חזרה לעוגן הסעיף המתאים במסמך זה (`docs/TEST_SPECIFICATION.md#tc-sys-XX`), והריצה האוטומטית (`npm test`) מוודאת גם את תקינות הקישוריות הדו-כיוונית בין הקוד למפרט.

---

## טבלת עקיבות ראשית (Traceability Matrix – 10 תרחישי מערכת)

| מזהה תרחיש | שם התרחיש הקליני | מקורות ידע מרכזיים (`knowledge/`) | פונקציית בדיקה ממומשת (`tests/systemScenarios.test.ts`) |
| :--- | :--- | :--- | :--- |
| **[`TC-SYS-01`](#tc-sys-01)** | תת-איזון תחת כדור פומי (`Activelle`) בגיל 51, סינון תרופה שנכשלה, שילוב מרובה ב-`GSM` והפרדת טסטוסטרון | [`מקרה 1 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`סיכום 08 – GSM ו-HSDD`](../knowledge/summaries/08-gsm-sexual-health-and-non-hormonal-therapies.md) | [`testTcSys01_SuboptimalActivelleMultiGsmAndTestosterone`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-02`](#tc-sys-02)** | מנופאוזה מוקדמת (`FXPOI`) בגיל 41 עם כישלון `Femoston` ופריחה מ-`Evorel` – מינון גבוה והכפלת פרוגסטוגן | [`מקרה 2 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`ASRM/ESHRE POI 2024`](../knowledge/summaries/07-poi-early-menopause-and-contraception.md), [`סיכום 04 – פרוגסטוגן פרופורציונלי`](../knowledge/summaries/04-progestogen-selection-and-endometrial-protection.md) | [`testTcSys02_EarlyMenopauseProportionalDoseAndStopGuard`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-03`](#tc-sys-03)** | בת 49 עם חשש מסרטן שד (אם בגיל 70 + ביופסיה שפירה ללא אטיפיה) וסקר `BRCA` בסל הבריאות | [`מקרה 3 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`סיכום 02 – סל הבריאות`](../knowledge/summaries/02-initial-assessment-screening-and-completeness-gate.md), [`סיכום 06 – שד ו-BRCA`](../knowledge/summaries/06-cancer-risks-osteoporosis-and-brca-carriers.md) | [`testTcSys03_BenignBreastBiopsyMaternalCancer70AndAshkenaziBrca`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-04`](#tc-sys-04)** | פרופיל קרדיו-מטבולי (`BMI 34.3`, יל"ד, טרום-סוכרת) + דימום בשלב 3 הפותח מחשבון `BMS` לסיכון סרטן הרחם | [`מקרה 4 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`סיכום 09 – אלגוריתם דימומים BMS 2024`](../knowledge/summaries/09-unscheduled-bleeding-side-effects-interactions-and-stopping.md) | [`testTcSys04_CardiometabolicObesityAndStage3BmsBleedingCalculator`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-05`](#tc-sys-05)** | בת 53 תחת גלולות `CHC` (`Meliane`), `TSH 0.05` תחת אלטרוקסין המחקה גלי חום ורקע משפחתי של `VTE` | [`מקרים 5 ו-6 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`סיכום 07 – אמצעי מניעה`](../knowledge/summaries/07-poi-early-menopause-and-contraception.md) | [`testTcSys05_ChcOver50SuppressedTshMimicAndFamilyVte`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-06`](#tc-sys-06)** | פנייה ראשונה בגיל 62 (11 שנים מווסת) עם עישון, יל"ד ודיסליפידמיה – חישוב `AHA PREVENT™` ומעקב כבד בויוזה | [`מקרה 7 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`מחשבון MDCalc #10491 PREVENT`](../knowledge/markdown/magid-course/mdcalc-10491-aha-prevent-calculator.md), [`סיכום 05 – סיכון CV`](../knowledge/summaries/05-cardiovascular-vte-and-metabolic-risk.md) | [`testTcSys06_LatePostmenopauseAge62PreventAndVeozaMonitoring`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-07`](#tc-sys-07)** | בת 53 תורמת כליה (כליה בודדת) עם התקן מירנה פג-תוקף (8 שנים) ודימומים לא סדירים | [`מקרה 9 – קורס מגיד`](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`סיכום 10 – פורמולריום ומקרים`](../knowledge/summaries/10-israeli-formulary-clinical-cases-and-design-alignment.md) | [`testTcSys07_SolitaryKidneyExpiredMirena8Years`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-08`](#tc-sys-08)** | מחלימת סרטן שד תחת `Tamoxifen` ו-`Paroxetine` במקביל + `GSM` קשה – חסימת הורמונים, `CYP2D6` והפרדת לחות | [`Red Whale #14 – אינטראקציות`](../knowledge/markdown/red-whale/14-drug-interactions-with-hrt.md), [`NICE 2024`](../knowledge/markdown/red-whale/02-nice-guideline-menopause-2024.md), [`סיכום 08`](../knowledge/summaries/08-gsm-sexual-health-and-non-hormonal-therapies.md) | [`testTcSys08_BreastCancerTamoxifenParoxetineBlockAndGsmSeparation`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-09`](#tc-sys-09)** | אלרגיית בוטנים/סויה + `Lamotrigine` + התחלת זריקת `GLP-1` בשלב 3 המעבירה להמלצת `Mirena` | [`Red Whale #14`](../knowledge/markdown/red-whale/14-drug-interactions-with-hrt.md), [`BMS 2025 GLP-1`](../knowledge/summaries/09-unscheduled-bleeding-side-effects-interactions-and-stopping.md) | [`testTcSys09_PeanutAllergyLamotrigineAndStage3Glp1Switch`](../tests/systemScenarios.test.ts) |
| **[`TC-SYS-10`](#tc-sys-10)** | חסימת בטיחות בדימום פוסט-מנופאוזלי שטרם בורר (`PMB`) + אימות ניקוי 100% מהשדות באיפוס תיק מטופלת חדשה | [`סיכום 02 – שער שלמות`](../knowledge/summaries/02-initial-assessment-screening-and-completeness-gate.md), [`BMS Bleeding`](../knowledge/summaries/09-unscheduled-bleeding-side-effects-interactions-and-stopping.md) | [`testTcSys10_UninvestigatedPmbHardBlockAndCompleteResetClean`](../tests/systemScenarios.test.ts) |

---

## פירוט 10 תרחישי הבדיקה והתוצאות הצפויות

<a id="tc-sys-01"></a>
### TC-SYS-01: תת-איזון תחת כדור פומי (`Activelle`) בגיל 51, סינון תרופה שנכשלה, שילוב מרובה ב-`GSM` והפרדת טסטוסטרון
* **רפרנס לקוד הבדיקה:** [`testTcSys01_SuboptimalActivelleMultiGsmAndTestosterone`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרה 1)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md) ו-[`08-gsm-sexual-health-and-non-hormonal-therapies.md`](../knowledge/summaries/08-gsm-sexual-health-and-non-hormonal-therapies.md).
* **נתוני קלט:** בת 51, אל-ווסת 12 חודשים (`EARLY_POSTMENOPAUSE`), `BMI 26.5`, ל"ד `110/73`, לאב מחלת לב איסכמית מוקדמת (`familyPrematureCvd = true`), `TC 220`, `HDL 55`, `eGFR 92`. בשאלון `IMS`: גלי חום (`3`), יקיצות שינה ב-03:00 (`3`, חשיבות `4`), יובש נרתיקי (`2`), ירידה בחשק המיני (`3`, חשיבות `4`). בטיפולי עבר: `ORAL_COMBINED_NETA` (`Activelle`) הופסק בשל העדר שליטה מספקת בגלי חום ושינה.
* **תוצאה צפויה:**
  1. מחשבון `AHA PREVENT™` נפתח אוטומטית בשל סיפור משפחתי לבבי מוקדם ומחשב סיכון ל-10 ול-30 שנה.
  2. תכשיר `Activelle` (`activelle_eviana_novofem`) **מסונן ואינו מופיע** בטבלת התכשירים המותאמים למטופלת, ומשטר ג׳ל אסטרדיול עורי + `Utrogestan` בערב מדורג במקום הראשון.
  3. בטיפולי `GSM` המקומיים מופיעים בנפרד לחלוטין: `gsm_moisturizers_lubricants` (תכשירי לחות), `gsm_vaginal_estrogen` (אסטרוגן נרתיקי) ו-`gsm_intrarosa_prasterone` (אינטררוזה), וניתן לשלב **כמה מהם במקביל** (`selectedGsmOptionIds = ['gsm_vaginal_estrogen', 'gsm_moisturizers_lubricants']`).
  4. אפשרות הטסטוסטרון ל-`HSDD` (`testosteroneOption`) מופרדת לחלוטין ממערך `localGsmOptions` ומסומנת כמומלצת.
  5. פלט ההנחיות למטופלת בשלב 2 כולל את אופן נטילת הג׳ל והאוטרוגסטן, את שני התכשירים המקומיים שנבחרו, את הנחיות הטסטוסטרון ואת המלל החופשי של הרופאה.

---

<a id="tc-sys-02"></a>
### TC-SYS-02: מנופאוזה מוקדמת (`FXPOI`) בגיל 41 עם כישלון `Femoston` ופריחה מ-`Evorel` – מינון גבוה והכפלת פרוגסטוגן
* **רפרנס לקוד הבדיקה:** [`testTcSys02_EarlyMenopauseProportionalDoseAndStopGuard`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרה 2)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md), [`07-poi-early-menopause-and-contraception.md`](../knowledge/summaries/07-poi-early-menopause-and-contraception.md) ו-[`04-progestogen-selection-and-endometrial-protection.md`](../knowledge/summaries/04-progestogen-selection-and-endometrial-protection.md).
* **נתוני קלט:** בת 41 (`EARLY_MENOPAUSE`), אל-ווסת 12 חודשים, `BMI 22`, רגישות לדבק מדבקות (`patchAdhesiveSensitivity = true`), ניסיון עבר כושל הן ב-`ORAL_FEMOSTON` (דימומים וכאבי ראש) והן ב-`EVOREL_PATCH` (פריחה מגרדת), `dxaStatus = 'NOT_PERFORMED'`.
* **תוצאה צפויה:**
  1. שלב `STRAW+10` מזוהה כ-`EARLY_MENOPAUSE`, ומדרגת המינון נקבעת ל-`MODERATE_HIGH_PHYSIOLOGIC`.
  2. כרטיס המדבקות (`opt_transdermal_patch_regimen`) ותכשירי `Femoston` **מסוננים לחלוטין ואינם מוצגים** למטופלת!
  3. באופציית הג׳ל העורי (`opt_transdermal_gel_body_identical`) מינון הפרוגסטרון **מוכפל אוטומטית באופן פרופורציונלי** ל-`Utrogestan 200 מ"ג כל ערב ברצף` (במקום 100 מ"ג), ולצידה מוצעת `Mirena 52mg + Estrogel`.
  4. פלט ההנחיות למטופלת בשלב 1 כולל הפניה לבדיקת צפיפות עצם (`DXA`) וויטמין D.
  5. במעקב שלב 3 (בגיל 41), כרטיס גמילה/הפסקת טיפול (`fu_taper_gradual_stop`) **מסונן ואינו מוצע**, עם תיעוד מפורש שאין להפסיק טיפול הורמונלי לפני גיל ~51.

---

<a id="tc-sys-03"></a>
### TC-SYS-03: בת 49 עם חשש מסרטן שד (אם בגיל 70 + ביופסיה שפירה ללא אטיפיה) וסקר `BRCA` בסל הבריאות
* **רפרנס לקוד הבדיקה:** [`testTcSys03_BenignBreastBiopsyMaternalCancer70AndAshkenaziBrca`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרה 3)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md) ו-[`02-initial-assessment-screening-and-completeness-gate.md`](../knowledge/summaries/02-initial-assessment-screening-and-completeness-gate.md).
* **נתוני קלט:** בת 49, מוצא אשכנזי משולב (`MIXED_ASHKENAZI`), `brcaStatus = 'NOT_TESTED'`, אם חלתה בסרטן שד בגיל 70 (`familyBreastOrOvarianCancer = true`, אך `familyCancerFirstDegreeUnder50OrMultiple = false`), עברה ביופסיית שד שפירה ללא אטיפיה (`benignBreastBiopsyNoAtypia = true`), `mammographyStatus = 'NOT_PERFORMED'`, אל-ווסת 14 חודשים, גלי חום יומיומיים קשים.
* **תוצאה צפויה:**
  1. שער השלמות קובע `isPassed = true` ו-**`systemicMhtContraindicated = false`** (סיפור משפחתי בגיל מבוגר וביופסיה שפירה ללא אטיפיה אינם פוסלים `MHT`, והיעדר ממוגרפיה בגיל 49 בסיכון רגיל אינו חוסם!).
  2. המלצות סל הבריאות ופלט שלב 1 למטופלת כוללים יידוע על זכאות חינם לבדיקת דם לנשאות `BRCA1/2` בקופה (מוצא אשכנזי מלא/חלקי מגיל 25).
  3. בשלב 2 מוצגות אפשרויות הורמונליות ולא-הורמונליות מלאות לבחירה משותפת.

---

<a id="tc-sys-04"></a>
### TC-SYS-04: פרופיל קרדיו-מטבולי (`BMI 34.3`, יל"ד, טרום-סוכרת) + דימום בשלב 3 הפותח מחשבון `BMS` לסיכון סרטן הרחם
* **רפרנס לקוד הבדיקה:** [`testTcSys04_CardiometabolicObesityAndStage3BmsBleedingCalculator`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרה 4)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md) ו-[`09-unscheduled-bleeding-side-effects-interactions-and-stopping.md`](../knowledge/summaries/09-unscheduled-bleeding-side-effects-interactions-and-stopping.md).
* **נתוני קלט:** בת 56, אל-ווסת 48 חודשים, משקל 91 ק"ג / גובה 163 ס"מ (`BMI 34.3`), יל"ד מאוזן ב-`Valsartan` (`takingAntihypertensives = true`, `takingAceArbOrPotassiumSparing = true`), טרום-סוכרת (`PREDIABETES`), היפותירואידיזם תחת `Levothyroxine`. בשלב 3 (חודש 4 לטיפול): מדווחת על שלשולים/אי-סבילות תחת אוטרוגסטן ודימום חדש תחת הטיפול (`hasNewBleeding = true`).
* **תוצאה צפויה:**
  1. בשלב 1 נפתח אוטומטית מחשבון `AHA PREVENT™`. בשלב 2 `routePreference === 'TRANSDERMAL_MANDATORY'`: כל הכדורים ההורמונליים הפומיים וכן `Angeliq` **מסוננים לחלוטין**!
  2. בשלב 3, סימון הדימום פותח אוטומטית את מחשבון `BMS 2024` (`shouldAutoOpenBmsBleedingCalculator === true`), המזהה 2 גורמים מינוריים (`BMI 30–39.9` + טרום-סוכרת) ומסווג **`riskTier === 'HIGH'`**, עם דרישה ל-`TVS` דחוף (`tvsIndicated === true`, סף תקין ברציף `≤ 4 מ"מ`; וכאשר מוזן `tvsThicknessMm = 5.5` דורש דגימת פיפל והיסטרוסקופיה!).
  3. מנוע ההחלטות של שלב 3 מסנן אוטרוגסטן ומדרג בראש מעבר להתקן `Mirena 52mg` + אסטרדיול עורי, ופלט ההנחיות למטופלת בשלב 3 מנחה לתאם `TVS` בהקדם.

---

<a id="tc-sys-05"></a>
### TC-SYS-05: בת 53 תחת גלולות `CHC` (`Meliane`), `TSH 0.05` תחת אלטרוקסין המחקה גלי חום ורקע משפחתי של `VTE`
* **רפרנס לקוד הבדיקה:** [`testTcSys05_ChcOver50SuppressedTshMimicAndFamilyVte`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרים 5 ו-6)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md) ו-[`07-poi-early-menopause-and-contraception.md`](../knowledge/summaries/07-poi-early-menopause-and-contraception.md).
* **נתוני קלט:** בת 53, נוטלת גלולות משולבות (`CHC_PILL_PATCH_RING`), נוטלת `Levothyroxine` עם `recentTshLevel = 0.05`, לאב היסטוריה של קרישיות/פקקת (`familyVteOrThrombophilia = true`), מיגרנה ללא אאורה.
* **תוצאה צפויה:**
  1. מודול אמצעי המניעה מתריע על חובת הפסקת `CHC` בגיל ≥ 50 (`chcOver50SwitchWarning` פעיל).
  2. מודול האינטראקציות מזהה `tsh_suppressed` (`TSH 0.05 < 0.4`) כגורם המחקה גלי חום, זעם ונדודי שינה.
  3. בשל `VTE` בקרבה ראשונה, מתן פומי נפסל לחלוטין (`TRANSDERMAL_MANDATORY`), ואופציות פומיות מסוננות משלב 2.
  4. פלט ההנחיות למטופלת בשלב 1 כולל בדיקת תפקודי תריס חוזרת והתאמת אלטרוקסין לצד החלפת הגלולות המשולבות.

---

<a id="tc-sys-06"></a>
### TC-SYS-06: פנייה ראשונה בגיל 62 (11 שנים מווסת) עם עישון, יל"ד ודיסליפידמיה – חישוב `AHA PREVENT™` ומעקב כבד בויוזה
* **רפרנס לקוד הבדיקה:** [`testTcSys06_LatePostmenopauseAge62PreventAndVeozaMonitoring`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרה 7)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md) ו-[`mdcalc-10491-aha-prevent-calculator.md`](../knowledge/markdown/magid-course/mdcalc-10491-aha-prevent-calculator.md).
* **נתוני קלט:** בת 62 (`LATE_POSTMENOPAUSE`, 132 חודשים מווסת אחרונה), מעשנת פעילה, יל"ד תחת טיפול (`SBP 138`), `BMI 28`, `TC 230`, `HDL 45`, `eGFR 72`, גלי חום בינוניים-קשים. בשלב 3 תחת `Veoza` מתקבלת עליית אנזימי כבד חמורה (`veozaAltAstNormal = 'CRITICAL_OVER_3X'`).
* **תוצאה צפויה:**
  1. מחשבון `AHA PREVENT™` נפתח אוטומטית ומחשב סיכון ל-10 שנים (`Total CVD`, `ASCVD`, `Heart Failure`; ללא חישוב 30 שנה המוגבל לגיל 30–59), ומפיק המלצת סטטינים ואיזון ל"ד.
  2. תכשירים פומיים וטיבולון (`Livial`) **מסוננים לחלוטין**, ואפשרויות לא-הורמונליות (`Veoza 45mg`, `Venlafaxine/Escitalopram`) מדורגות בראש שלב 2, כשפלט ההנחיות למטופלת מפרט בדיקות כבד בבסיס ובחודשים 1, 2, 3, 6 ו-9.
  3. בשלב 3, כאשר מוזן `CRITICAL_OVER_3X`, כרטיס `Veoza` **נפסל ומסונן מיידית** מרשימת ההמשך, מוצעות חלופות לא-הורמונליות בטוחות לכבד (`SNRI/SSRI` ו-`Gabapentin + CBT`), ופלט שלב 3 למטופלת מורה על הפסקה מיידית של ויוזה!

---

<a id="tc-sys-07"></a>
### TC-SYS-07: בת 53 תורמת כליה (כליה בודדת) עם התקן מירנה פג-תוקף (8 שנים) ודימומים לא סדירים
* **רפרנס לקוד הבדיקה:** [`testTcSys07_SolitaryKidneyExpiredMirena8Years`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`practical-menopause-course-session5-cases.md` (מקרה 9)](../knowledge/markdown/magid-course/practical-menopause-course-session5-cases.md) ו-[`10-israeli-formulary-clinical-cases-and-design-alignment.md`](../knowledge/summaries/10-israeli-formulary-clinical-cases-and-design-alignment.md).
* **נתוני קלט:** בת 53, תורמת כליה (`chronicKidneyDiseaseOrSolitaryKidney = true`), התקן `MIRENA_52MG` שהותקן לפני 8 שנים (`2018-05-01`), מחזורים לא סדירים (`VARIATION_OVER_7_DAYS`), `BMI 29.5`, ל"ד `130/80`, `mammographyStatus = 'NOT_PERFORMED'`, `fitColorectalStatus = 'NOT_PERFORMED'`.
* **תוצאה צפויה:**
  1. המערכת מזהה שהמירנה **אינה תקפה להגנת רירית הרחם תחת MHT** (`mirenaValidForMhtEndometrium === false`, מעל 5 שנים!).
  2. תכשיר `Angeliq` **מסונן לחלוטין** מפורמולריום התכשירים בשל כליה בודדת (`blocksAngeliq === true`).
  3. פלט ההנחיות למטופלת בשלב 1 כולל: (א) החלפת התקן המירנה אצל גינקולוג/ית, (ב) ממוגרפיה דו-שנתית בסל (50–74), (ג) דם סמוי בצואה (`FIT`).
  4. בשלב 2 מדורגת בעדיפות גבוהה אופציית החלפת המירנה למירנה חדשה + אסטרדיול עורי.

---

<a id="tc-sys-08"></a>
### TC-SYS-08: מחלימת סרטן שד תחת `Tamoxifen` ו-`Paroxetine` במקביל + `GSM` קשה – חסימת הורמונים, `CYP2D6` והפרדת לחות
* **רפרנס לקוד הבדיקה:** [`testTcSys08_BreastCancerTamoxifenParoxetineBlockAndGsmSeparation`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`14-drug-interactions-with-hrt.md`](../knowledge/markdown/red-whale/14-drug-interactions-with-hrt.md), [`02-nice-guideline-menopause-2024.md`](../knowledge/markdown/red-whale/02-nice-guideline-menopause-2024.md) ו-[`08-gsm-sexual-health-and-non-hormonal-therapies.md`](../knowledge/summaries/08-gsm-sexual-health-and-non-hormonal-therapies.md).
* **נתוני קלט:** בת 48, היסטוריה אישית של סרטן שד `HR_POSITIVE`, נוטלת `Tamoxifen` ונוטלת במקביל `Paroxetine` (`takingCyp2d6InhibitorParoxetineFluoxetine = true`), גלי חום קשים (`4`) ויובש נרתיקי קשה (`4`).
* **תוצאה צפויה:**
  1. שער השלמות מסמן `systemicMhtContraindicated = true` ומאפשר מעבר לשלב 2 (`isPassed = true`).
  2. בשלב 2 **אפס תכשירים הורמונליים סיסטמיים מוצגים** (`rankedOptions.every(o => o.category === 'NON_HORMONAL_SYSTEMIC')`), וגם `Intrarosa`, `Ospemifene` וטסטוסטרון (`testosteroneOption === undefined`) **מסוננים לחלוטין**!
  3. מוצגת התרעת אינטראקציה קריטית (`CRITICAL`) להחלפת `Paroxetine` (עיכוב `CYP2D6`) ב-`Venlafaxine` או `Escitalopram`, ופלט שלב 1 למטופלת כולל תיאום החלפת התרופה.
  4. במקטע ה-`GSM` מופיע כרטיס נפרד ועצמאי לתכשירי לחות נרתיקיים לא-הורמונליים (`gsm_moisturizers_lubricants`, `recommended === true`).

---

<a id="tc-sys-09"></a>
### TC-SYS-09: אלרגיית בוטנים/סויה + `Lamotrigine` + התחלת זריקת `GLP-1` בשלב 3 המעבירה להמלצת `Mirena`
* **רפרנס לקוד הבדיקה:** [`testTcSys09_PeanutAllergyLamotrigineAndStage3Glp1Switch`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`14-drug-interactions-with-hrt.md`](../knowledge/markdown/red-whale/14-drug-interactions-with-hrt.md) ו-[`09-unscheduled-bleeding-side-effects-interactions-and-stopping.md` (BMS 2025 GLP-1)](../knowledge/summaries/09-unscheduled-bleeding-side-effects-interactions-and-stopping.md).
* **נתוני קלט:** בת 47 (`LATE_TRANSITION`, 4 חודשים מווסת אחרונה), אלרגיה לבוטנים/סויה (`peanutOrSoyAllergy = true`), אפילפסיה תחת `Lamotrigine`. בשלב 2 נבחר ג׳ל אסטרדיול + `Duphaston`. בביקור מעקב שלב 3 (חודש 3): התחילה זריקת `Mounjaro` (`newlyStartedGlp1 = true`) עם דימום בלתי צפוי (`hasNewBleeding = true`).
* **תוצאה צפויה:**
  1. בשלב 2: `Utrogestan` וכל תכשירי האסטרוגן הפומיים **מסוננים לחלוטין** (בגלל אלרגיית בוטנים/סויה ואינטראקציית `Lamotrigine`); הג׳ל העורי מותאם אוטומטית עם `Duphaston`.
  2. בשלב 3: בעקבות התחלת `GLP-1` והופעת דימום, נפתח אוטומטית מחשבון `BMS` המזהה חשיפה לתת-ספיגת פרוגסטוגן פומי, ומנוע ההחלטות למעקב מדרג במקום **#1** מעבר ל-**התקן `Mirena 52mg` + אסטרדיול עורי** (`opt_mirena_plus_transdermal_e2`) לעקיפת הקיבה והגנה מלאה על הרירית!

---

<a id="tc-sys-10"></a>
### TC-SYS-10: חסימת בטיחות בדימום פוסט-מנופאוזלי שטרם בורר (`PMB`) + אימות ניקוי 100% מהשדות באיפוס תיק מטופלת חדשה
* **רפרנס לקוד הבדיקה:** [`testTcSys10_UninvestigatedPmbHardBlockAndCompleteResetClean`](../tests/systemScenarios.test.ts)
* **מקור קליני:** [`02-initial-assessment-screening-and-completeness-gate.md`](../knowledge/summaries/02-initial-assessment-screening-and-completeness-gate.md) ודרישת חוויית המשתמש לניקוי מלא של תיק מטופלת חדשה.
* **נתוני קלט:**
  * **חלק א׳:** בת 58 עם דימום פוסט-מנופאוזלי חריג שטרם בורר (`uninvestigatedAbnormalBleeding = true`) + מלל חופשי מהרופאה למטופלת בשלב 1.
  * **חלק ב׳:** הפעלת `createInitialRecord(true)` (כפתור **"חדשה (איפוס)"**) לאחר תיק עשיר ומלא בנתוני שלבים 1, 2 ו-3.
* **תוצאה צפויה:**
  1. בחלק א׳: שער השלמות **חוסם את המעבר לשלב 2** (`isPassed === false`), ופלט ההנחיות למטופלת בשלב 1 כולל הן את ההפניה הדחופה ל-`TVS` והן את המלל החופשי שהזינה הרופאה.
  2. בחלק ב׳: לאחר הפעלת האיפוס (`createInitialRecord(true)`), `recordSessionId` מתחדש, `activeStage === 1`, `stage2 === undefined`, `selectedPlan === undefined`, `stage2Notes.length === 0`, `stage3Visits.length === 0`, ו**כל אחד משדות שלב 1** (`age === 0`, `weightKg === 0`, `heightCm === 0`, `bmi === 0`, `bpSystolic === 0`, `bpDiastolic === 0`, כל 19 הסימפטומים `=== 0`, כל מחלות הרקע והתרופות `false`, כל בדיקות הסקר `'NOT_PERFORMED'`/`'NOT_TESTED'`, וכל שדות המלל החופשי `=== ''`) מתאפס לניקיון מוחלט ב-100%!
