import { Stage1Data, Stage2Recommendations, RegimenType, RoutePreference, TreatmentProduct } from './types';
import { calculateStrawStage } from './strawStaging';

export function formulateTreatment(data: Stage1Data): Stage2Recommendations {
  const straw = calculateStrawStage(data);
  const routeRationale: string[] = [];
  const patientExpectationPoints: string[] = [];
  const nonHormonalAlternatives: string[] = [
    'Veoza (Fezolinetant 45mg) – מעכב קולטני NK3, טיפול לא-הורמונלי מוכח וממוקד לגלי חום והזעות לילה.',
    'ונלפקסין (Venlafaxine 37.5–75mg) – להקלה על תסמינים וזומוטוריים, חרדה ושיפור מצב רוח.',
    'גבפנטין (Gabapentin 100–300mg בלילה) – מסייע להפחתת גלי חום ושיפור איכות השינה.',
    'טיפול קוגניטיבי-התנהגותי (CBT ממוקד מנופאוזה) – מומלץ על פי הנחיות NICE להתמודדות עם גלי חום ונדודי שינה.'
  ];

  // 1. קביעת דרך המתן (Route of Administration)
  let routePreference: RoutePreference = 'ORAL_ACCEPTABLE';

  if (data.activeVteOrThrombophilia || data.recentArterialEvent) {
    routePreference = 'TRANSDERMAL_MANDATORY';
    routeRationale.push('מתן עורי בלבד הוא חובה רפואית: עוקף מעבר כבדי ראשוני ואינו מעלה רמות גורמי קרישה (הנחיות BMS).');
  } else {
    if (data.bmi >= 30) {
      routePreference = 'TRANSDERMAL_PREFERRED';
      routeRationale.push(`השמנת יתר (BMI = ${data.bmi.toFixed(1)}): מתן עורי מונע עלייה עודפת בסיכון ל-VTE המוגבר ב-BMI גבוה.`);
    }
    if (data.age >= 60) {
      routePreference = 'TRANSDERMAL_PREFERRED';
      routeRationale.push('גיל מעל 60: מתן עורי בטוח משמעותית בהיבטי שבץ מוחי (CVA) וקרישיות דם.');
    }
    if (data.isSmoker) {
      routePreference = 'TRANSDERMAL_PREFERRED';
      routeRationale.push('עישון פעיל: מתן עורי מפחית את השפעת העישון על המטבוליזם הכבדי של אסטרוגן.');
    }
    if (data.bpSystolic >= 140 || data.bpDiastolic >= 90 || data.hadGestationalHtn) {
      routePreference = 'TRANSDERMAL_PREFERRED';
      routeRationale.push('יתר לחץ דם: אסטרוגן עורי אינו מגרה ייצור אנגיוטנסינוגן בכבד ואינו מעלה לחץ דם.');
    }
    if (data.takingGlp1) {
      routePreference = 'TRANSDERMAL_PREFERRED';
      routeRationale.push('טיפול ב-GLP-1 (אוזמפיק/מונג\'רו): מתן עורי עוקף את האטת ריקון הקיבה ומבטיח ספיגה הורמונלית יציבה.');
    }
    if (data.libidoChange === 'DECREASED' || data.libidoChange === 'ABSENT') {
      routePreference = 'TRANSDERMAL_PREFERRED';
      routeRationale.push('ירידה בליבידו: מתן עורי אינו מעלה את החלבון SHBG בכבד, ובכך משמר רמות גבוהות יותר של טסטוסטרון חופשי בדם.');
    }
  }

  // 2. קביעת משטר הטיפול (Regimen Type)
  let regimenType: RegimenType = 'CONTINUOUS_COMBINED';
  let regimenHebrewTitle = '';
  let estrogenOption: TreatmentProduct | undefined;
  let progestogenOption: TreatmentProduct | undefined;

  // מקרה של סרטן שד בעבר או התווית נגד מוחלטת
  if (data.historyOfBreastCancer || data.takingTamoxifenOrAIs) {
    regimenType = 'NON_HORMONAL_ONLY';
    regimenHebrewTitle = 'מסלול חלופות לא-הורמונליות בלבד (התווית נגד ל-HRT)';
    patientExpectationPoints.push('בשל רקע של סרטן שד / טיפול אונקולוגי, טיפול הורמונלי סיסטמי אינו מאושר.');
    patientExpectationPoints.push('הטיפול יתמקד ב-Veoza (פזולינטנט) ו/או תכשירים מקומיים ו-CBT.');
  }
  // ללא רחם (כריתת רחם)
  else if (data.hadHysterectomy) {
    if (data.hadEndometriosis) {
      regimenType = 'CONTINUOUS_COMBINED';
      regimenHebrewTitle = 'טיפול משולב רציף (בשל היסטוריה של אנדומטריוזיס בכריתת רחם)';
      routeRationale.push('הנחיית NICE/BMS: בנשים עם עבר של אנדומטריוזיס שעברו כריתת רחם, חובה לתת פרוגסטוגן רציף לצד האסטרוגן למניעת הישנות או התמרה ממארת של נגעים אנדומטריוטיים שאריים.');
    } else {
      regimenType = 'ESTROGEN_ONLY';
      regimenHebrewTitle = 'אסטרוגן בלבד (Estrogen Therapy - ET) – ללא רחם';
    }
  }
  // עם רחם - פרי-מנופאוזה
  else if (
    straw.stage === 'LATE_TRANSITION' ||
    straw.stage === 'EARLY_TRANSITION' ||
    straw.stage === 'LATE_REPRODUCTIVE' ||
    (data.monthsSinceLastPeriod < 12 && data.age < 54)
  ) {
    regimenType = 'SEQUENTIAL_COMBINED';
    regimenHebrewTitle = 'טיפול משולב סדרתי / מחזורי (Sequential Combined HRT - sHRT)';
  }
  // עם רחם - פוסט-מנופאוזה
  else {
    regimenType = 'CONTINUOUS_COMBINED';
    regimenHebrewTitle = 'טיפול משולב רציף (Continuous Combined HRT - ccHRT)';
  }

  // 3. בחירת מוצרים ותכשירים מסחריים בישראל
  if (regimenType !== 'NON_HORMONAL_ONLY') {
    // בחירת אסטרוגן
    if (routePreference === 'ORAL_ACCEPTABLE') {
      estrogenOption = {
        brandName: 'אסטרופם (Estrofem)',
        genericName: 'Estradiol 1-2mg',
        dosage: data.age >= 60 ? '1 מ"ג' : '1-2 מ"ג',
        schedule: 'טבליה אחת פומית ביום בשעה קבועה',
        route: 'ORAL',
        notes: 'מינון התחלתי נמוך (1 מ"ג), עם שקילת העלאה ל-2 מ"ג לאחר 2-3 חודשים לפי תגובה קלינית.'
      };
    } else {
      estrogenOption = {
        brandName: 'אסטרוג\'ל (Estrogel 0.06%) או סנדרנה (Sandrena)',
        genericName: '17β-Estradiol Transdermal Gel',
        dosage: data.age >= 60 ? '1 לחיצה ביום (0.75 מ"ג)' : '2 לחיצות ביום (1.5 מ"ג - מינון סטנדרטי)',
        schedule: 'מריחה יומית בבוקר על עור יבש (זרועות / ירכיים), ללא שטיפה בשעה הראשונה',
        route: 'TRANSDERMAL',
        notes: 'עוקף כבד ראשוני, אינו מעלה סיכון ל-VTE ולשבץ מוחי, בטוח למטופלות עם עודף משקל או GLP-1.'
      };
    }

    // בחירת פרוגסטוגן (בנשים עם רחם או אנדומטריוזיס)
    if (regimenType === 'SEQUENTIAL_COMBINED') {
      if (data.bleedingIntensity === 'HEAVY' || data.takingGlp1) {
        progestogenOption = {
          brandName: 'מירנה (Mirena 52mg LNG-IUS)',
          genericName: 'Levonorgestrel 52mg Intrauterine System',
          dosage: 'התקן אחד ל-5 שנים',
          schedule: 'התקנה תוך-רחמית קבועה',
          route: 'INTRAUTERINE',
          notes: 'פתרון הזהב: מדכא דימומים כבדים, עוקף לחלוטין את בעיית הספיגה במטופלות GLP-1, ומספק אמצעי מניעה מעולה.'
        };
      } else {
        progestogenOption = {
          brandName: 'אוטרוגסטן (Utrogestan 200mg) או דופסטון (Duphaston 10mg)',
          genericName: 'Micronised Progesterone (Bioidentical) / Dydrogesterone',
          dosage: '200 מ"ג אוטרוגסטן (או 10 מ"ג דופסטון)',
          schedule: 'טבליה אחת בכל לילה במשך 12-14 ימים רצופים בכל חודש (ימים 15-28 של המחזור)',
          route: 'ORAL',
          notes: 'הפרוגסטרון הבטוח ביותר לשד ול-VTE. מומלץ ליטול בלילה לפני השינה (משפר שינה).'
        };
      }
    } else if (regimenType === 'CONTINUOUS_COMBINED') {
      if (data.takingGlp1 || data.bleedingIntensity === 'HEAVY') {
        progestogenOption = {
          brandName: 'מירנה (Mirena 52mg LNG-IUS)',
          genericName: 'Levonorgestrel 52mg IUS',
          dosage: 'התקן אחד ל-5 שנים',
          schedule: 'התקנה תוך-רחמית קבועה',
          route: 'INTRAUTERINE',
          notes: 'מומלץ במיוחד למטופלות GLP-1 (בשל עיכוב ריקון קיבה ופגיעה בספיגה פומית).'
        };
      } else {
        progestogenOption = {
          brandName: 'אוטרוגסטן (Utrogestan 100mg) או פמוסטון קונטי',
          genericName: 'Micronised Progesterone 100mg / Femoston Conti',
          dosage: '100 מ"ג אוטרוגסטן',
          schedule: 'כמוסה אחת בכל לילה לפני השינה ברציפות ללא הפסקות',
          route: 'ORAL',
          notes: 'פרופיל בטיחות שד וקרישיות מירבי. שומר על רירית הרחם במצב אטרופי ומונע דימומים.'
        };
      }
    }
  }

  // 4. טיפול מקומי ב-GSM (אטרופיה נרתיקית)
  let localGsmOption: TreatmentProduct | undefined;
  if (data.hasVaginalDryness || data.hasDyspareunia || data.hasRecurrentUtis) {
    localGsmOption = {
      brandName: 'וגיפם (Vagifem 10mcg) או אובסטין קרם (Ovestin)',
      genericName: 'Estradiol 10mcg / Estriol Cream',
      dosage: 'טבליה אחת של 10 מק"ג',
      schedule: 'טבליה נרתיקית בכל לילה בשבועיים הראשונים, ולאחר מכן פעמיים בשבוע באופן קבוע',
      route: 'VAGINAL',
      notes: 'טיפול מקומי בטוח במיוחד ללא ספיגה סיסטמית משמעותית. אינו דורש פרוגסטוגן נוסף.'
    };
  }

  // 5. טיפול בטסטוסטרון (ל-HSDD)
  let testosteroneOption: TreatmentProduct | undefined;
  if (data.libidoChange === 'DECREASED' || data.libidoChange === 'ABSENT') {
    testosteroneOption = {
      brandName: 'טסטוג\'ל (Testogel 1% - שימוש Off-label לנשים לפי הנחיות BMS/ISSWSH)',
      genericName: 'Testosterone Transdermal Gel',
      dosage: 'מנה זעירה של כ-5 מ"ג ליום (שקית אחת מספיקה לכ-8–10 ימים)',
      schedule: 'מריחה על העור בבוקר (יש לבדוק רמות טסטוסטרון ו-SHBG לפני ובמהלך הטיפול)',
      route: 'TRANSDERMAL',
      notes: 'שקילת תוספת רק לאחר 3-6 חודשי אופטימיזציה של אסטרוגן אם הירידה בחשק המיני עדיין נמשכת ומלווה במצוקה.'
    };
  }

  // נקודות לתיאום ציפיות עם המטופלת (Patient Expectation Counseling Leaflet)
  patientExpectationPoints.push('6 החודשים הראשונים לטיפול: הכתמות או דימומים קלים בלתי סדירים הם תופעה נפוצה וצפויה הפוקדת עד 40% מהנשים עם התחלת טיפול. אין סיבה להיבהל – הדבר אינו מעיד על פתולוגיה.');
  patientExpectationPoints.push('אם מופיע גודש או רגישות בחזה: מדובר בתגובה חולפת לאסטרוגן שלרוב נרגעת תוך מספר שבועות. במידת הצורך נוכל להפחית מינון קלות.');
  patientExpectationPoints.push('נטילת הפרוגסטרון (אוטרוגסטן) בשעת השינה: מומלצת מאוד מכיוון שהיא מסייעת בהרדמות ומעמיקה את איכות השינה.');
  patientExpectationPoints.push('ביקורת ומעקב: נקבע פגישת מעקב בעוד 3 חודשים להערכת שיפור התסמינים, מדידת לחץ דם והתאמת מינונים במידת הצורך.');

  // תבנית העתקה לתיק הרפואי (EMR Copy-Paste)
  const emrSummaryText = `סיכום ביקור גיל המעבר – שלב 2 (הגדרת טיפול):
מטופלת בת ${data.age}, BMI: ${data.bmi.toFixed(1)}, ל"ד: ${data.bpSystolic}/${data.bpDiastolic}.
שלב STRAW+10: ${straw.titleHebrew} (${straw.stageCode}).
תסמינים עיקריים: VMS חומרה ${data.vmsSeverity}, GSM: ${data.hasVaginalDryness ? 'קיים' : 'ללא'}, שינה/קוגניציה: ${data.hasBrainFog ? 'ערפול מוחי' : 'תקין'}.
הערכת סיכון: VTE: ${routePreference}, רירית הרחם: תקין/מעקב.
אינטראקציות: ${data.takingGlp1 ? 'נטילת GLP-1 (ספיגת פרוגסטרון פומי מופחתת)' : 'אין אינטראקציה קריטית'}.
המלצה טיפולית:
1. משטר: ${regimenHebrewTitle}.
2. אסטרוגן: ${estrogenOption ? `${estrogenOption.brandName} - ${estrogenOption.dosage} (${estrogenOption.schedule})` : 'ללא'}.
3. פרוגסטוגן: ${progestogenOption ? `${progestogenOption.brandName} - ${progestogenOption.dosage} (${progestogenOption.schedule})` : 'ללא'}.
${localGsmOption ? `4. טיפול מקומי ב-GSM: ${localGsmOption.brandName} (${localGsmOption.schedule})\n` : ''}בוצע תיאום ציפיות מלא לגבי דימומים קלים ב-6 החודשים הראשונים.
נקבע ביקור מעקב ל-3-6 חודשים.`;

  return {
    regimenType,
    regimenHebrewTitle,
    routePreference,
    routeRationale,
    estrogenOption,
    progestogenOption,
    localGsmOption,
    testosteroneOption,
    nonHormonalAlternatives,
    patientExpectationPoints,
    followUpIntervalMonths: 3,
    emrSummaryText
  };
}
