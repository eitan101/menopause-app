// Clinical Data Models & Types grounded in knowledge/summaries/INDEX.md and original clinical sources in knowledge/sources/

export type STRAWStage =
  | 'LATE_REPRODUCTIVE'      // שלב רפרודוקטיבי מאוחר (-3b / -3a)
  | 'EARLY_TRANSITION'       // פרי-מנופאוזה מוקדמת (-2)
  | 'LATE_TRANSITION'        // פרי-מנופאוזה מאוחרת (-1)
  | 'EARLY_POSTMENOPAUSE'    // פוסט-מנופאוזה מוקדמת (+1a, +1b, +1c - עד 6 שנים)
  | 'LATE_POSTMENOPAUSE'     // פוסט-מנופאוזה מאוחרת (+2 - מעל 6 שנים)
  | 'POI'                    // אי-ספיקה שחלתית מוקדמת (מתחת לגיל 40)
  | 'EARLY_MENOPAUSE'        // מנופאוזה מוקדמת (גיל 40-44)
  | 'SURGICAL_RRSO';         // מנופאוזה כירורגית / לאחר כריתת שחלות

export type CyclePattern =
  | 'REGULAR'                       // סדיר
  | 'VARIATION_OVER_7_DAYS'          // שוני מתמיד של 7 ימים ומעלה
  | 'SKIPPED_OVER_60_DAYS'           // אל-ווסת של 60 יום ומעלה (2 מחזורים שדולגו)
  | 'AMENORRHEA_OVER_12_MONTHS';     // היעדר ווסת מעל 12 חודשים רצופים

export type BleedingIntensity = 'LIGHT' | 'NORMAL' | 'HEAVY';

export type BrcaStatus = 'NEGATIVE' | 'BRCA1' | 'BRCA2' | 'UNKNOWN' | 'NOT_TESTED';
export type ScreeningStatus = 'UP_TO_DATE_NORMAL' | 'OVERDUE' | 'ABNORMAL_SUSPECTED' | 'NOT_PERFORMED';
export type LabStatus = 'NORMAL' | 'ANEMIA' | 'NOT_TESTED';

export interface Stage1Data {
  // דמוגרפיה ואורח חיים
  patientId: string;
  fullName: string;
  age: number;
  occupation: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bpSystolic: number;
  bpDiastolic: number;
  isSmoker: boolean;
  alcoholUnitsPerWeek: number;
  nutritionQuality: 'HEALTHY' | 'AVERAGE' | 'POOR';
  exerciseRegular: boolean;

  // אנמנזה גינקולוגית ומיילדותית
  gravida: number;
  para: number;
  abortions: number;
  hadGestationalDiabetes: boolean;
  hadGestationalHtn: boolean;
  hadPreeclampsia: boolean;
  hadPretermDelivery: boolean;
  menarcheAge: number;
  hasPmsPmdd: boolean;
  priorContraception: string;
  hadEndometriosis: boolean;
  hadHysterectomy: boolean;
  hadRrso: boolean;
  rrsoAge?: number;

  // דפוס דימומים נוכחי
  lastPeriodDate: string;
  cyclePattern: CyclePattern;
  bleedingIntensity: BleedingIntensity;
  monthsSinceLastPeriod: number;

  // רקע משפחתי וגנטי
  familyMenopauseAge: number;
  familyCvd: boolean;
  familyDiabetes: boolean;
  familyVte: boolean;
  familyOsteoporosis: boolean;
  ethnicity: string;
  brcaStatus: BrcaStatus;
  lynchSyndrome: boolean;

  // סריקת תסמינים מפורטת
  vmsSeverity: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
  hasNightSweats: boolean;
  hasPalpitations: boolean;
  sleepDisruption: 'NONE' | 'MILD' | 'FREQUENT_WAKING';

  hasVaginalDryness: boolean;
  hasDyspareunia: boolean;
  hasRecurrentUtis: boolean;
  libidoChange: 'NORMAL' | 'DECREASED' | 'ABSENT';

  hasBrainFog: boolean;
  hasWordFindingDifficulty: boolean;
  hasRageOrShortFuse: boolean;
  hasMoodSwingsOrAnxiety: boolean;
  hasJointMusculoskeletalPain: boolean;

  // בדיקות שגרה ומעקבים
  mammographyStatus: ScreeningStatus;
  lastMammographyDate: string;
  papHpvStatus: ScreeningStatus;
  lastPapDate: string;
  cbcStatus: LabStatus;
  glucoseLipidsStatus: 'NORMAL' | 'ABNORMAL' | 'NOT_TESTED';
  dxaStatus: 'NORMAL' | 'OSTEOPENIA' | 'OSTEOPOROSIS' | 'NOT_PERFORMED';
  fshLevel?: number;

  // תרופות קבועות ואינטראקציות
  takingGlp1: boolean;                // סמגלוטייד, טירזפטייד
  takingEnzymeInducers: boolean;       // קרבמזפין, פניטואין, ריפמפיצין
  takingTamoxifenOrAIs: boolean;       // טמוקסיפן, לטרוזול
  takingLevothyroxine: boolean;        // אלטרוקסין
  
  // התוויות נגד מוחלטות (Contraindications)
  historyOfBreastCancer: boolean;      // סרטן שד נוכחי או בעבר
  historyOfEndometrialCancer: boolean; // סרטן רירית הרחם
  uninvestigatedBleeding: boolean;     // דימום חריג שלא בורר
  activeVteOrThrombophilia: boolean;   // פקקת ורידית או הפרעת קרישה ידועה
  activeLiverDisease: boolean;         // מחלת כבד פעילה
  recentArterialEvent: boolean;        // אירוע קרדיווסקולרי פעיל או לאחרונה
}

export interface EndometrialRiskAssessment {
  riskTier: 'LOW' | 'HIGH';
  majorFactors: string[];
  minorFactors: string[];
  rationale: string;
}

export interface CompletenessGateResult {
  isPassed: boolean;
  blockingReasons: string[];
  warnings: string[];
  patientInstructions: string[];
}

export type RegimenType =
  | 'ESTROGEN_ONLY'            // אסטרוגן בלבד (ללא רחם)
  | 'SEQUENTIAL_COMBINED'      // משולב סדרתי / מחזורי (עם רחם בפרי-מנופאוזה)
  | 'CONTINUOUS_COMBINED'      // משולב רציף (עם רחם במנופאוזה)
  | 'NON_HORMONAL_ONLY'        // חלופות לא הורמונליות בלבד (התווית נגד ל-HRT)
  | 'TSEC';                    // Duavive - אסטרוגן + בזדוקסיפן

export type RoutePreference =
  | 'TRANSDERMAL_MANDATORY'    // מתן עורי חובה (בטיחות VTE / כבד)
  | 'TRANSDERMAL_PREFERRED'    // מתן עורי מועדף (BMI, גיל, יל"ד, GLP-1)
  | 'ORAL_ACCEPTABLE';         // מתן פומי אפשרי

export interface TreatmentProduct {
  brandName: string;
  genericName: string;
  dosage: string;
  schedule: string;
  route: 'TRANSDERMAL' | 'ORAL' | 'VAGINAL' | 'INTRAUTERINE';
  notes?: string;
}

export interface Stage2Recommendations {
  regimenType: RegimenType;
  regimenHebrewTitle: string;
  routePreference: RoutePreference;
  routeRationale: string[];
  estrogenOption?: TreatmentProduct;
  progestogenOption?: TreatmentProduct;
  localGsmOption?: TreatmentProduct;
  testosteroneOption?: TreatmentProduct;
  nonHormonalAlternatives: string[];
  patientExpectationPoints: string[];
  followUpIntervalMonths: number;
  emrSummaryText: string;
}

export interface LongitudinalVisit {
  visitId: string;
  visitDate: string;
  monthsSinceStart: number;
  currentRegimen: string;
  currentEstrogenDose: string;
  currentProgestogenDose: string;
  
  // שינוי בתסמינים
  symptomVmsChange: 'RESOLVED' | 'IMPROVED' | 'NO_CHANGE' | 'WORSENED';
  symptomGsmChange: 'RESOLVED' | 'IMPROVED' | 'NO_CHANGE' | 'WORSENED';
  symptomMoodChange: 'RESOLVED' | 'IMPROVED' | 'NO_CHANGE' | 'WORSENED';
  
  // תופעות לוואי
  sideEffectMastalgia: boolean;
  sideEffectDrowsiness: boolean;
  sideEffectMoodOrAcne: boolean;
  sideEffectNauseaOrBloat: boolean;

  // דימומים חדשים
  hasNewBleeding: boolean;
  bleedingOnsetDaysAgo?: number;
  isBleedingHeavyOrProlonged: boolean;
  isWithinFirst6Months: boolean;
  hasRecentDoseChangeIn3Months: boolean;

  // מדדים מעודכנים
  updatedBmi?: number;
  updatedBpSystolic?: number;
  updatedBpDiastolic?: number;
  newlyStartedGlp1: boolean;

  // תוצאות מנוע פתרון הבעיות
  urgentTvsIndicated: boolean;
  tvsReason?: string;
  recommendedAction: string;
  sideEffectPlan: string[];
  cessationRecommended: boolean;
  cessationPlan?: string;
  visitSummaryNotes: string;
}

export interface PatientRecord {
  version: string;
  lastUpdated: string;
  activeStage: 1 | 2 | 3;
  stage1: Stage1Data;
  stage2?: Stage2Recommendations;
  stage3Visits: LongitudinalVisit[];
}
