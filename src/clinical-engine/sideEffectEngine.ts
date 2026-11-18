import { FollowUpMedicationAction, Stage1Data, TreatmentOptionCard } from './types';

export interface RegimenSideEffectItem {
  id: string;
  labelHebrew: string;
  category: 'ESTROGENIC' | 'PROGESTOGENIC' | 'ROUTE_LOCAL' | 'NON_HORMONAL_DRUG' | 'ANDROGENIC';
  managementAdviceHebrew: string;
}

const HORMONAL_SIDE_EFFECTS: RegimenSideEffectItem[] = [
  {
    id: 'breast_tenderness',
    labelHebrew: 'רגישות או גודש בשדיים (Mastalgia)',
    category: 'ESTROGENIC',
    managementAdviceHebrew:
      'תופעת לוואי אסטרוגנית שכיחה החולפת לרוב תוך 8–12 שבועות: ניתן להפחית מעט מינון אסטרוגן (למשל ירידה בלחיצת Estrogel או ל-Evorel 25), להפחית קפאין או לשלב שמן נר הלילה.'
  },
  {
    id: 'bloating_fluid',
    labelHebrew: 'נפיחות בטנית / אגירת נוזלים / כאב ראש קל',
    category: 'ESTROGENIC',
    managementAdviceHebrew:
      'אם על אסטרוגן פומי – מומלץ לעבור לאסטרדיול עורי או לשקול הפחתת מינון; אם נובע מהפרוגסטוגן – להעדיף אוטרוגסטן, דופסטון, מירנה או אנג׳ליק (אם תפקוד כלייתי תקין).'
  },
  {
    id: 'pms_mood_fatigue',
    labelHebrew: 'עצבנות, דכדוך דמוי-PMS או ישנוניות בבוקר מהפרוגסטוגן',
    category: 'PROGESTOGENIC',
    managementAdviceHebrew:
      'אי-סבילות לפרוגסטוגן: ליטול Utrogestan סמוך לשינה על קיבה ריקה; אם ממשיך – לעבור לדופסטון (Duphaston), להתקין מירנה 52 מ"ג, לשקול מתן אוטרוגסטן נרתיקי (Off-label באותו מינון יומי!), או בפוסט-מנופאוזה לעבור ל-Duavive (ללא פרוגסטוגן!).'
  },
  {
    id: 'patch_skin_irritation',
    labelHebrew: 'גרד / אודם באתר הדבקת המדבקה או קושי בספיגת הג׳ל',
    category: 'ROUTE_LOCAL',
    managementAdviceHebrew:
      'בדרמטיטיס ממדבקה: לאוורר את המדבקה 10 שניות לפני הדבקה, להחליף אזור, או לעבור לג׳ל אסטרדיול (Estrogel / Sandrena). אם תסמינים ממשיכים תחת ג׳ל – לבדוק רמת Estradiol בדם לשלילת תת-ספיגה עורית!'
  }
];

const VEOZA_LYNKUET_SIDE_EFFECTS: RegimenSideEffectItem[] = [
  {
    id: 'nk3_gi_abdominal',
    labelHebrew: 'כאבי בטן, בחילה או שלשול (ויוזה / לינקואט)',
    category: 'NON_HORMONAL_DRUG',
    managementAdviceHebrew: 'ליטול בשעה קבועה עם ארוחה קלה; לשלול סימני פגיעה כבדית נלווים.'
  },
  {
    id: 'nk3_liver_symptoms',
    labelHebrew: 'עייפות חריגה, בחילה מתמשכת, גרד, שתן כהה או צהבת (דגל אדום כבדי!)',
    category: 'NON_HORMONAL_DRUG',
    managementAdviceHebrew:
      'להפסיק ויוזה / לינקואט באופן מיידי ולבצע בדיקת דם דחופה ל-ALT, AST, ALP ובילירובין (הנחיית בטיחות משרד הבריאות / EMA 2025)!'
  },
  {
    id: 'nk3_insomnia_or_somnolence',
    labelHebrew: 'קושי בשינה (תחת ויוזה) או ישנוניות (תחת לינקואט)',
    category: 'NON_HORMONAL_DRUG',
    managementAdviceHebrew: 'בויוזה להעביר נטילה לבוקר; בלינקואט להקפיד על נטילה לפני השינה בלבד.'
  }
];

const SNRI_GABAPENTIN_SIDE_EFFECTS: RegimenSideEffectItem[] = [
  {
    id: 'snri_nausea_sweating_bp',
    labelHebrew: 'בחילה, יובש בפה, עליית ל"ד או פגיעה בחשק/אורגזמה (SNRI/SSRI)',
    category: 'NON_HORMONAL_DRUG',
    managementAdviceHebrew:
      'לנטר לחץ דם תחת ונלפקסין; אם קיימת פגיעה מינית או עליית ל"ד – לשקול מעבר לויוזה (Veoza), גאבאפנטין או אציטלופרם במינון נמוך (אין להפסיק ונלפקסין בפתאומיות!).'
  },
  {
    id: 'gaba_dizziness_edema',
    labelHebrew: 'סחרחורת, טשטוש בבוקר, בצקות או יובש בפה חמור (גאבאפנטין / אוקסיבוטינין)',
    category: 'NON_HORMONAL_DRUG',
    managementAdviceHebrew:
      'להפחית מינון ערב של גאבאפנטין או להמיר לויוזה / ונלפקסין; באוקסיבוטינין להפחית ל-2.5 מ"ג או להפסיק אם מופיע עומס אנטי-כולינרגי.'
  }
];

const TESTOSTERONE_SIDE_EFFECTS: RegimenSideEffectItem[] = [
  {
    id: 'androgen_acne_hair',
    labelHebrew: 'אקנה, שמנוניות עור, שיעור יתר באזור המריחה או העמקת קול (טסטוסטרון)',
    category: 'ANDROGENIC',
    managementAdviceHebrew:
      'לבדוק מיד רמת Total Testosterone בדם, להחליף אזורי מריחה ולהפחית מינון (או להפסיק אם מופיעה צרידות/וירליזציה!).'
  }
];

export function getSideEffectChecklistForOption(
  evaluatedOption?: TreatmentOptionCard,
  includeTestosterone?: boolean
): RegimenSideEffectItem[] {
  const list: RegimenSideEffectItem[] = [];
  if (!evaluatedOption || evaluatedOption.category === 'HORMONAL_SYSTEMIC') {
    list.push(...HORMONAL_SIDE_EFFECTS);
  } else if (evaluatedOption.id.includes('nk3')) {
    list.push(...VEOZA_LYNKUET_SIDE_EFFECTS);
  } else {
    list.push(...SNRI_GABAPENTIN_SIDE_EFFECTS);
  }

  if (includeTestosterone) {
    list.push(...TESTOSTERONE_SIDE_EFFECTS);
  }
  return list;
}

export function resolveSideEffectActions(selectedIds: string[], includeTestosterone?: boolean): string[] {
  const all = [
    ...HORMONAL_SIDE_EFFECTS,
    ...VEOZA_LYNKUET_SIDE_EFFECTS,
    ...SNRI_GABAPENTIN_SIDE_EFFECTS,
    ...(includeTestosterone ? TESTOSTERONE_SIDE_EFFECTS : [])
  ];
  return selectedIds
    .map((id) => all.find((item) => item.id === id))
    .filter((item): item is RegimenSideEffectItem => Boolean(item))
    .map((item) => `${item.labelHebrew}: ${item.managementAdviceHebrew}`);
}

// בניית המלצת שינוי תרופתי מובנית לשלב 3 (כולל התאמת פרוגסטוגן פרופורציונלית אוטומטית בעליית מינון!)
export function suggestMedicationModificationText(
  action: FollowUpMedicationAction,
  stage1: Stage1Data,
  currentOption?: TreatmentOptionCard,
  switchedToOption?: TreatmentOptionCard
): string {
  const hasUterus = !stage1.hadHysterectomy || stage1.medicalHistory.hadEndometriosis;

  switch (action) {
    case 'CONTINUE_SAME':
      return `המשך המשטר הנוכחי ללא שינוי (${currentOption?.titleHebrew || 'הטיפול הנוכחי'}); ביקורת שנתית והמשך בדיקות סקר תקופתיות.`;

    case 'ESCALATE_DOSE':
      if (!currentOption || currentOption.category === 'HORMONAL_SYSTEMIC') {
        return hasUterus
          ? 'עליית מדרגה במינון האסטרדיול העורי (למשל מ-1 ל-2 לחיצות Estrogel, או מ-2 ל-3–4 לחיצות / Evorel 75–100 לאחר שלילת תת-ספיגה עורית בבדיקת Serum Estradiol). שים/י לב לחוק הפרופורציונליות (BMS 2024): בעלייה למינון E2 בינוני-גבוה (3–4 לחיצות Estrogel או Evorel 75–100) חובה להעלות פרוגסטוגן ל-Utrogestan 200 מ"ג רציף / 300 מ"ג ציקלי ל-12 יום או מירנה 52 מ"ג!'
          : 'עליית מדרגה במינון האסטרדיול (למשל הוספת לחיצת Estrogel או מעבר מ-Evorel 50 ל-75/100; אם עדיין אין תגובה – לבדוק רמת Estradiol בדם לשלילת תת-ספיגה עורית ולהחליף בין ג׳ל למדבקה).';
      }
      return 'עליית מינון הדרגתית בטיפול הלא-הורמונלי (למשל ונלפקסין מ-37.5 ל-75 מ"ג או גאבאפנטין מ-300 ל-600 מ"ג בערב; לויוזה מינון קבוע של 45 מ"ג – אין להכפיל מינון!).';

    case 'REDUCE_DOSE':
      return 'הפחתת מדרגת מינון (למשל ירידה מ-2 לחיצות Estrogel ללחיצה אחת או מ-Evorel 50 ל-Evorel 25) בשל רגישות בשדיים/גודש או איזון מלא ממושך, ומעקב תסמינים כעבור 8–12 שבועות.';

    case 'SWITCH_DRUG_OR_ROUTE':
      return switchedToOption
        ? `החלפת טיפול אל: ${switchedToOption.titleHebrew} (${switchedToOption.israeliProductsSummary.primaryAgent}${
            switchedToOption.israeliProductsSummary.secondaryProgestogenOrMonitor
              ? ` + ${switchedToOption.israeliProductsSummary.secondaryProgestogenOrMonitor}`
              : ''
          }). ביקורת חוזרת בעוד 3 חודשים.`
        : 'החלפת תכשיר / ציר מתן (למשל מפומי לעורי, או ממדבקה לג׳ל, או מעבר לחלופה לא-הורמונלית) וביקורת חוזרת בעוד 3 חודשים.';

    case 'ADD_LOCAL_TREATMENT':
      return 'המשך הטיפול הסיסטמי הקיים + הוספת טיפול נרתיקי מקומי ממוקד ל-GSM (Vagifem 10mcg / Ovestin / Imvaggis / Intrarosa) פעמיים בשבוע לאחר שבועיים העמסה.';

    case 'TAPER_OR_STOP':
      return generateCessationProtocol(stage1.age < 45);
  }
}

export function generateCessationProtocol(isPoiOrEarlyMenopause: boolean): string {
  if (isPoiOrEarlyMenopause) {
    return 'אזהרה קלינית: במטופלת עם POI / מנופאוזה מוקדמת או כירורגית מתחת לגיל 45 אין להפסיק טיפול הורמונלי לפני גיל המנופאוזה הטבעי (~51) בהיעדר התווית נגד חדשה, בשל הגנה חיונית על העצם, הלב והמוח!';
  }
  return 'פרוטוקול גמילה מדורגת (Tapering): לפי BMS/NAMS אין מגבלת זמן שרירותית להפסקת MHT כל עוד התועלת עולה על הסיכון. במידה שהמטופלת בוחרת להפסיק, מומלץ להוריד 25%–50% ממינון האסטרוגן כל 4–8 שבועות (עם שמירת הגנה פרוגסטוגנית עד להפסקה המלאה) כדי למזער גלי חום חוזרים (Rebound VMS ~50%), ולהמשיך אסטרוגן נרתיקי מקומי ל-GSM לצמיתות.';
}
