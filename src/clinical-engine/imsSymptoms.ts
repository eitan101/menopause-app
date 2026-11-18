import { Score0To4, SymptomAssessmentMap, SymptomScoreEntry } from './types';

export type ImsSymptomDomainId =
  | 'VASOMOTOR'
  | 'PSYCH_COGNITIVE'
  | 'SOMATIC'
  | 'UROGENITAL_SEXUAL'
  | 'METABOLIC'
  | 'SOCIAL_OCCUPATIONAL';

export interface ImsSymptomDefinition {
  id: string; // '1' .. '19'
  number: number;
  domainId: ImsSymptomDomainId;
  domainHebrew: string;
  shortTitleHebrew: string;
  fullDescriptionHebrew: string;
  hasFrequency: boolean;
}

export const IMS_SYMPTOM_DOMAINS: { id: ImsSymptomDomainId; titleHebrew: string; subtitleHebrew: string }[] = [
  {
    id: 'VASOMOTOR',
    titleHebrew: '1. תסמינים וזומוטוריים ונוירו-וסקולריים',
    subtitleHebrew: 'גלי חום, הזעות, מיגרנות, סחרחורת וטנטון (עוצמה, תדירות וחשיבות)'
  },
  {
    id: 'PSYCH_COGNITIVE',
    titleHebrew: '2. תסמינים פסיכולוגיים וקוגניטיביים',
    subtitleHebrew: 'מצב רוח, נרגנות, חרדה, תשישות וערפול מוחי (Brain Fog)'
  },
  {
    id: 'SOMATIC',
    titleHebrew: '3. תסמינים גופניים (סומטיים)',
    subtitleHebrew: 'הפרעות שינה, דפיקות לב, מפרקים ושרירים, פורמיקציה ועור/שיער'
  },
  {
    id: 'UROGENITAL_SEXUAL',
    titleHebrew: '4. אורו-גניטלי ומיניות (GSM & HSDD)',
    subtitleHebrew: 'תשוקה ותפקוד מיני, מערכת השתן ויובש/כאב נרתיקי'
  },
  {
    id: 'METABOLIC',
    titleHebrew: '5. מטבולי',
    subtitleHebrew: 'עלייה במשקל או השמנה בטנית'
  },
  {
    id: 'SOCIAL_OCCUPATIONAL',
    titleHebrew: '6. שינויים חברתיים, תעסוקתיים ומשפחתיים',
    subtitleHebrew: 'תפקוד ותפוקה בעבודה, היקף משרה ויחסים במשפחה'
  }
];

// כל 19 הפריטים של שאלון הסימפטומים של האגודה הישראלית לגיל המעבר (IMS)
export const IMS_19_SYMPTOM_ITEMS: ImsSymptomDefinition[] = [
  {
    id: '1',
    number: 1,
    domainId: 'VASOMOTOR',
    domainHebrew: 'וזומוטוריים',
    shortTitleHebrew: 'גלי חום והזעות',
    fullDescriptionHebrew: 'גלי חום, הזעות, אפיזודות של הזעות (לרבות הזעות לילה)',
    hasFrequency: true
  },
  {
    id: '2',
    number: 2,
    domainId: 'VASOMOTOR',
    domainHebrew: 'וזומוטוריים',
    shortTitleHebrew: 'מיגרנות, סחרחורת, ורטיגו או טנטון',
    fullDescriptionHebrew: 'מיגרנות, סחרחורות, ורטיגו או טנטון',
    hasFrequency: true
  },
  {
    id: '3',
    number: 3,
    domainId: 'PSYCH_COGNITIVE',
    domainHebrew: 'פסיכולוגיים וקוגניטיביים',
    shortTitleHebrew: 'מצב רוח ירוד ועצבות',
    fullDescriptionHebrew: 'מצב רוח ירוד: הרגשה "ירודה", עצבות, על סף בכי, אבדן מוטיבציה, שינויים תכופים במצב הרוח',
    hasFrequency: false
  },
  {
    id: '4',
    number: 4,
    domainId: 'PSYCH_COGNITIVE',
    domainHebrew: 'פסיכולוגיים וקוגניטיביים',
    shortTitleHebrew: 'נרגנות, עצבנות ומתח פנימי',
    fullDescriptionHebrew: 'נרגנות (Irritability), עצבנות, מתח פנימי, פתיל קצר או אגרסיביות',
    hasFrequency: false
  },
  {
    id: '5',
    number: 5,
    domainId: 'PSYCH_COGNITIVE',
    domainHebrew: 'פסיכולוגיים וקוגניטיביים',
    shortTitleHebrew: 'חרדה, חוסר שקט או פניקה',
    fullDescriptionHebrew: 'חרדה, חוסר שקט פנימי, תחושת פניקה או אימה פתאומית עם תסמינים גופניים',
    hasFrequency: false
  },
  {
    id: '6',
    number: 6,
    domainId: 'PSYCH_COGNITIVE',
    domainHebrew: 'פסיכולוגיים וקוגניטיביים',
    shortTitleHebrew: 'תשישות וערפול מוחי (Brain Fog)',
    fullDescriptionHebrew: 'תשישות נפשית/גופנית, ירידה בביצועים, הפרעות בזיכרון, Brain Fog, ירידה בריכוז ושכחנות',
    hasFrequency: false
  },
  {
    id: '7',
    number: 7,
    domainId: 'SOMATIC',
    domainHebrew: 'גופני (סומטי)',
    shortTitleHebrew: 'הפרעות שינה ויקיצות ליליות',
    fullDescriptionHebrew: 'הפרעות שינה: קושי בהירדמות, קושי בשינה רצופה לאורך הלילה, יקיצות מוקדמות',
    hasFrequency: false
  },
  {
    id: '8',
    number: 8,
    domainId: 'SOMATIC',
    domainHebrew: 'גופני (סומטי)',
    shortTitleHebrew: 'אי-נוחות לבבית / פלפיטציות',
    fullDescriptionHebrew: 'אי-נוחות לבבית: מודעות לא רגילה לדופק, דילוג על פעימה, דופק מהיר',
    hasFrequency: false
  },
  {
    id: '9',
    number: 9,
    domainId: 'SOMATIC',
    domainHebrew: 'גופני (סומטי)',
    shortTitleHebrew: 'אי-סדירות או הפסקת וסת',
    fullDescriptionHebrew: 'וסת חודשית לא סדירה או הפסקת הווסת החודשית בשנה האחרונה',
    hasFrequency: false
  },
  {
    id: '10',
    number: 10,
    domainId: 'SOMATIC',
    domainHebrew: 'גופני (סומטי)',
    shortTitleHebrew: 'כאבי מפרקים ושרירים',
    fullDescriptionHebrew: 'אי-נוחות במפרקים ובשרירים, כאבי פרקים או תלונות ראומטיות',
    hasFrequency: false
  },
  {
    id: '11',
    number: 11,
    domainId: 'SOMATIC',
    domainHebrew: 'גופני (סומטי)',
    shortTitleHebrew: 'גרד ופורמיקציה ("נמלים מתחת לעור")',
    fullDescriptionHebrew: 'גרד בעור, תחושת נימול או נמלים מתחת לעור (Formication)',
    hasFrequency: false
  },
  {
    id: '12',
    number: 12,
    domainId: 'SOMATIC',
    domainHebrew: 'גופני (סומטי)',
    shortTitleHebrew: 'שינויים בעור, שיער או ציפורניים',
    fullDescriptionHebrew: 'יובש בעור, הידלדלות/נשירת שיער או שבירות ציפורניים',
    hasFrequency: false
  },
  {
    id: '13',
    number: 13,
    domainId: 'UROGENITAL_SEXUAL',
    domainHebrew: 'אורו-גניטלי ומיניות',
    shortTitleHebrew: 'ירידה בתשוקה ותפקוד מיני (HSDD)',
    fullDescriptionHebrew: 'בעיות בתפקוד מיני, ירידה בתשוקה (Desire), בפעילות המינית או בשביעות הרצון',
    hasFrequency: false
  },
  {
    id: '14',
    number: 14,
    domainId: 'UROGENITAL_SEXUAL',
    domainHebrew: 'אורו-גניטלי ומיניות',
    shortTitleHebrew: 'תכיפות/דחיפות/דליפת שתן או דלקות חוזרות',
    fullDescriptionHebrew: 'בעיות בהטלת שתן: תכיפות, דחיפות, דליפת שתן במאמץ או דלקות שתן חוזרות',
    hasFrequency: false
  },
  {
    id: '15',
    number: 15,
    domainId: 'UROGENITAL_SEXUAL',
    domainHebrew: 'אורו-גניטלי ומיניות',
    shortTitleHebrew: 'יובש נרתיקי, צריבה וכאב ביחסים (GSM)',
    fullDescriptionHebrew: 'יובש נרתיקי, הרגשת צריבה/גירוי, קשיים וכאבים ביחסי מין (Dyspareunia)',
    hasFrequency: false
  },
  {
    id: '16',
    number: 16,
    domainId: 'METABOLIC',
    domainHebrew: 'מטבולי',
    shortTitleHebrew: 'עלייה במשקל או השמנה בטנית',
    fullDescriptionHebrew: 'עלייה במשקל או פיזור שומן בטני חדש בגיל המעבר',
    hasFrequency: false
  },
  {
    id: '17',
    number: 17,
    domainId: 'SOCIAL_OCCUPATIONAL',
    domainHebrew: 'שינויים חברתיים ותפקודיים',
    shortTitleHebrew: 'ירידה בתפקוד או בתפוקה בעבודה',
    fullDescriptionHebrew: 'ירידה בתפקוד בעבודה, במוטיבציה התעסוקתית או בתפוקה היומיומית',
    hasFrequency: false
  },
  {
    id: '18',
    number: 18,
    domainId: 'SOCIAL_OCCUPATIONAL',
    domainHebrew: 'שינויים חברתיים ותפקודיים',
    shortTitleHebrew: 'ירידה בהיקף משרה / שינוי תפקיד',
    fullDescriptionHebrew: 'צמצום היקף משרה, שינוי תפקיד או הפסקת עבודה עקב התסמינים',
    hasFrequency: false
  },
  {
    id: '19',
    number: 19,
    domainId: 'SOCIAL_OCCUPATIONAL',
    domainHebrew: 'שינויים חברתיים ותפקודיים',
    shortTitleHebrew: 'קשיים ביחסים עם בני משפחה קרובה',
    fullDescriptionHebrew: 'מתח או קשיים ביחסים עם בן/בת זוג ובני משפחה קרובה',
    hasFrequency: false
  }
];

export const SCORE_LABELS_SEVERITY: Record<Score0To4, string> = {
  0: '0 - אין',
  1: '1 - מעט',
  2: '2 - בינוני',
  3: '3 - קשה',
  4: '4 - קשה מאוד'
};

export const SCORE_LABELS_IMPORTANCE: Record<Score0To4, string> = {
  0: '0 - לא חשוב',
  1: '1 - מעט חשוב',
  2: '2 - חשוב',
  3: '3 - חשוב מאוד',
  4: '4 - הכי חשוב'
};

export const SCORE_LABELS_FREQUENCY: Record<Score0To4, string> = {
  0: '0 - נדיר/אין',
  1: '1 - פעם ביום',
  2: '2 - פעמיים',
  3: '3 - שלוש פעמים',
  4: '4 - 4+ פעמים'
};

export function createEmptySymptomsMap(): SymptomAssessmentMap {
  const map: SymptomAssessmentMap = {};
  for (const item of IMS_19_SYMPTOM_ITEMS) {
    map[item.id] = {
      severity: 0,
      importance: 0,
      ...(item.hasFrequency ? { frequency: 0 } : {})
    };
  }
  return map;
}

export function getSymptomEntry(map: SymptomAssessmentMap | undefined, id: string): SymptomScoreEntry {
  const item = IMS_19_SYMPTOM_ITEMS.find((i) => i.id === id);
  const existing = map?.[id];
  if (existing) {
    return existing;
  }
  return {
    severity: 0,
    importance: 0,
    ...(item?.hasFrequency ? { frequency: 0 } : {})
  };
}

export interface SymptomSummaryMetrics {
  totalSeverityScore: number; // מתוך 76 (19 * 4)
  activeSymptomCount: number;
  topPriorityItems: {
    item: ImsSymptomDefinition;
    entry: SymptomScoreEntry;
    compositeWeight: number;
  }[];
  hasModerateSevereVms: boolean;
  hasSignificantSleepIssue: boolean;
  hasSignificantMoodOrFog: boolean;
  hasSignificantGsm: boolean;
  hasSignificantHsdd: boolean;
  hasOccupationalImpact: boolean;
}

export function summarizeSymptoms(map: SymptomAssessmentMap | undefined): SymptomSummaryMetrics {
  let totalSeverityScore = 0;
  let activeSymptomCount = 0;

  const scored = IMS_19_SYMPTOM_ITEMS.map((item) => {
    const entry = getSymptomEntry(map, item.id);
    totalSeverityScore += entry.severity;
    if (entry.severity > 0) activeSymptomCount += 1;
    const compositeWeight = entry.importance * 2 + entry.severity + (entry.frequency || 0) * 0.5;
    return { item, entry, compositeWeight };
  });

  const topPriorityItems = scored
    .filter((s) => s.entry.severity > 0 || s.entry.importance >= 2)
    .sort((a, b) => b.compositeWeight - a.compositeWeight)
    .slice(0, 4);

  const vms = getSymptomEntry(map, '1');
  const sleep = getSymptomEntry(map, '7');
  const mood3 = getSymptomEntry(map, '3');
  const mood4 = getSymptomEntry(map, '4');
  const mood5 = getSymptomEntry(map, '5');
  const fog6 = getSymptomEntry(map, '6');
  const hsdd13 = getSymptomEntry(map, '13');
  const urinary14 = getSymptomEntry(map, '14');
  const gsm15 = getSymptomEntry(map, '15');
  const work17 = getSymptomEntry(map, '17');
  const work18 = getSymptomEntry(map, '18');

  return {
    totalSeverityScore,
    activeSymptomCount,
    topPriorityItems,
    hasModerateSevereVms: vms.severity >= 2 || (vms.frequency || 0) >= 2,
    hasSignificantSleepIssue: sleep.severity >= 2 || sleep.importance >= 3,
    hasSignificantMoodOrFog:
      Math.max(mood3.severity, mood4.severity, mood5.severity, fog6.severity) >= 2,
    hasSignificantGsm:
      gsm15.severity >= 1 || urinary14.severity >= 1 || gsm15.importance >= 2,
    hasSignificantHsdd: hsdd13.severity >= 2 || hsdd13.importance >= 3,
    hasOccupationalImpact: work17.severity >= 2 || work18.severity >= 1
  };
}

export interface SymptomDeltaRow {
  item: ImsSymptomDefinition;
  baselineSeverity: Score0To4;
  baselineImportance: Score0To4;
  previousSeverity?: Score0To4;
  currentSeverity: Score0To4;
  deltaFromBaseline: number; // שלילי = שיפור!
  statusHebrew: 'RESOLVED' | 'IMPROVED' | 'UNCHANGED' | 'WORSENED' | 'ASYMPTOMATIC';
}

export function compareLongitudinalSymptoms(
  baseline: SymptomAssessmentMap,
  current: SymptomAssessmentMap,
  previousVisit?: SymptomAssessmentMap
): {
  rows: SymptomDeltaRow[];
  baselineTotal: number;
  currentTotal: number;
  percentImprovement: number;
  unresolvedHighPriorityCount: number;
  summaryHebrew: string;
} {
  let baselineTotal = 0;
  let currentTotal = 0;
  let unresolvedHighPriorityCount = 0;

  const rows: SymptomDeltaRow[] = IMS_19_SYMPTOM_ITEMS.map((item) => {
    const b = getSymptomEntry(baseline, item.id);
    const c = getSymptomEntry(current, item.id);
    const p = previousVisit ? getSymptomEntry(previousVisit, item.id) : undefined;

    baselineTotal += b.severity;
    currentTotal += c.severity;

    const delta = c.severity - b.severity;
    let statusHebrew: SymptomDeltaRow['statusHebrew'] = 'ASYMPTOMATIC';
    if (b.severity === 0 && c.severity === 0) {
      statusHebrew = 'ASYMPTOMATIC';
    } else if (b.severity > 0 && c.severity === 0) {
      statusHebrew = 'RESOLVED';
    } else if (delta < 0) {
      statusHebrew = 'IMPROVED';
    } else if (delta === 0) {
      statusHebrew = 'UNCHANGED';
    } else {
      statusHebrew = 'WORSENED';
    }

    if (b.importance >= 3 && c.severity >= 2 && delta >= 0) {
      unresolvedHighPriorityCount += 1;
    }

    return {
      item,
      baselineSeverity: b.severity,
      baselineImportance: b.importance,
      previousSeverity: p?.severity,
      currentSeverity: c.severity,
      deltaFromBaseline: delta,
      statusHebrew
    };
  });

  const percentImprovement =
    baselineTotal > 0 ? Math.round(((baselineTotal - currentTotal) / baselineTotal) * 100) : 0;

  let summaryHebrew = `ציון חומרה כולל (IMS): ירד מ-${baselineTotal} ל-${currentTotal} (${percentImprovement >= 0 ? `שיפור של ${percentImprovement}%` : `עלייה של ${Math.abs(percentImprovement)}%`}).`;
  if (unresolvedHighPriorityCount > 0) {
    summaryHebrew += ` קיימים ${unresolvedHighPriorityCount} תסמינים בעדיפות גבוהה למטופלת שטרם הוטבו באופן מספק – מומלץ לשקול טיטרציית מינון, בדיקת ספיגה עורית (רמת Estradiol בדם) או החלפת תכשיר.`;
  }

  return {
    rows,
    baselineTotal,
    currentTotal,
    percentImprovement,
    unresolvedHighPriorityCount,
    summaryHebrew
  };
}
