// Complete Clinical Data Models & Types grounded in knowledge/summaries/01–10 and knowledge/sources/

export type STRAWStage =
  | 'LATE_REPRODUCTIVE'              // שלב רפרודוקטיבי מאוחר (-3b / -3a)
  | 'EARLY_TRANSITION'               // פרי-מנופאוזה מוקדמת (-2)
  | 'LATE_TRANSITION'                // פרי-מנופאוזה מאוחרת (-1)
  | 'EARLY_POSTMENOPAUSE'            // פוסט-מנופאוזה מוקדמת (+1a, +1b, +1c - עד 6 שנים)
  | 'LATE_POSTMENOPAUSE'             // פוסט-מנופאוזה מאוחרת (+2 - מעל 6 שנים)
  | 'POI'                            // אי-ספיקה שחלתית מוקדמת (מתחת לגיל 40)
  | 'EARLY_MENOPAUSE'                // מנופאוזה מוקדמת (גיל 40-44)
  | 'HYSTERECTOMY_OVARIES_CONSERVED' // כריתת רחם עם שימור שחלות
  | 'SURGICAL_MENOPAUSE';            // מנופאוזה כירורגית / כריתת שחלות דו-צדדית (BSO / RRSO)

export type CyclePattern =
  | 'REGULAR'                        // סדיר (ייתכנו תסמיני -3a)
  | 'VARIATION_OVER_7_DAYS'          // שוני מתמיד של 7 ימים ומעלה (-2)
  | 'SKIPPED_OVER_60_DAYS'           // אל-ווסת של 60 יום ומעלה (-1)
  | 'AMENORRHEA_OVER_12_MONTHS';     // היעדר ווסת מעל 12 חודשים רצופים (+1 / +2)

export type BleedingIntensity = 'NONE' | 'LIGHT' | 'NORMAL' | 'HEAVY';

export type BrcaStatus = 'NEGATIVE' | 'BRCA1' | 'BRCA2' | 'NOT_TESTED' | 'UNKNOWN';
export type ScreeningStatus =
  | 'UP_TO_DATE_NORMAL'
  | 'OVERDUE'
  | 'ABNORMAL_SUSPECTED'
  | 'NOT_PERFORMED'
  | 'NOT_REQUIRED_BY_AGE';

export type Score0To4 = 0 | 1 | 2 | 3 | 4;

export interface SymptomScoreEntry {
  severity: Score0To4;     // עוצמה (0-4)
  importance: Score0To4;   // דרגת חשיבות למטופלת (0-4)
  frequency?: Score0To4;   // תדירות (0-4 עבור פריטים 1-2 הווזומוטוריים/נוירו-וסקולריים)
}

export type SymptomAssessmentMap = Record<string, SymptomScoreEntry>;

export type ContraceptionMethod =
  | 'NONE'
  | 'MIRENA_52MG'
  | 'LOW_DOSE_IUS_KYLEENA'
  | 'COPPER_IUD'
  | 'POP_SLYND_CERAZETTE'
  | 'CHC_PILL_PATCH_RING'
  | 'BARRIER_OR_STERILIZATION';

export interface ContraceptionData {
  currentMethod: ContraceptionMethod;
  mirenaInsertionDate: string; // YYYY-MM-DD לבקרת 5 שנים להגנת רירית ב-MHT
  needsContraceptionCounseling: boolean;
  sexuallyActiveWithPregnancyRisk: boolean;
  notes: string;
}

// 8 קטגוריות-אב היררכיות למחלות רקע
export interface MedicalHistoryHierarchical {
  // 1. ממאירויות ונגעי שד/גינקולוגיה
  hasMalignancyOrBreastHistory: boolean;
  breastCancerHistory: boolean;
  breastCancerReceptor: 'HR_POSITIVE' | 'HR_NEGATIVE' | 'UNKNOWN';
  dcisOrAtypicalHyperplasia: boolean;
  benignBreastBiopsyNoAtypia: boolean;
  endometrialCancerHistory: 'NONE' | 'EARLY_STAGE_TREATED' | 'ADVANCED_OR_SARCOMA';
  ovarianCancerHistory: 'NONE' | 'HORMONE_SENSITIVE_SEROUS_ENDOMETRIOID' | 'GERM_CELL_OR_MUCINOUS';
  cervicalOrColorectalCancer: boolean;
  malignancyNotes: string;

  // 2. דימום גניטלי חריג, גינקולוגיה וסיבוכי הריון (מעצימי סיכון CV)
  hasGynecologicalOrObstetricHistory: boolean;
  uninvestigatedAbnormalBleeding: boolean; // PMB / IMB / PCB שטרם בורר
  hadEndometriosis: boolean;
  hasFibroidsOrAdenomyosis: boolean;
  endometrialHyperplasiaHistory: 'NONE' | 'TREATED_WITHOUT_ATYPIA' | 'ATYPICAL_OR_UNRESOLVED';
  hasPcosOrChronicAnovulation: boolean;
  hasPmsPmddOrPostpartumDepression: boolean;
  hadPreeclampsia: boolean;
  hadGestationalHtn: boolean;
  hadGestationalDiabetes: boolean;
  hadPretermDelivery: boolean;
  gynecologicalNotes: string;

  // 3. הפרעות קרישה ופקקת ורידית (VTE)
  hasCoagulationOrVteHistory: boolean;
  activeAcuteVte: boolean;           // DVT / PE פעיל כעת
  pastUnprovokedVte: boolean;        // VTE ספונטני בעבר
  pastProvokedVte: boolean;          // VTE בעבר עם גורם מעורר חולף
  knownThrombophilia: boolean;       // Factor V Leiden, Prothrombin, Prot C/S, AT, APLA
  thrombophiliaDetails: string;
  superficialThrombophlebitisOrVaricose: boolean;
  coagulationNotes: string;

  // 4. לב, כלי דם ומטבוליזם
  hasCardiovascularOrMetabolicHistory: boolean;
  activeOrRecentArterialEvent: boolean; // MI חריף / אנגינה לא יציבה / CVA / TIA פעיל
  stabilizedRemotePostMi: boolean;      // מצב יציב לאחר אוטם בעבר (BMS 2024)
  hypertensionStatus: 'NONE' | 'CONTROLLED' | 'UNCONTROLLED' | 'SEVERE_OVER_180_110';
  diabetesStatus: 'NONE' | 'PREDIABETES' | 'DIABETES';
  dyslipidemia: boolean;
  hypertriglyceridemiaOver200: boolean; // TG >= 200-500 mg/dL -> עורי בלבד!
  cardiovascularNotes: string;

  // 5. כבד, מרה, כליות ומערכת העיכול
  hasHepaticRenalGiHistory: boolean;
  activeLiverDiseaseOrPorphyria: boolean;
  fattyLiverOrGallstones: boolean;
  chronicKidneyDiseaseOrSolitaryKidney: boolean; // CKD / כליה בודדת (חוסם Angeliq + קלט PREVENT)
  malabsorptionOrBariatricSurgery: boolean;
  hepaticRenalGiNotes: string;

  // 6. נוירולוגיה ומיגרנה
  hasNeurologicalHistory: boolean;
  migraineWithAura: boolean;
  migraineWithoutAura: boolean;
  epilepsy: boolean;
  meningiomaHistory: boolean;
  neurologicalNotes: string;

  // 7. אנדוקרינולוגיה, עצם ומחלות אוטואימוניות
  hasEndocrineBoneAutoimmuneHistory: boolean;
  thyroidDisorder: 'NONE' | 'HYPOTHYROID' | 'HYPERTHYROID';
  osteoporosisOrFragilityFracture: boolean;
  osteopenia: boolean;
  autoimmuneDiseaseRaIbdSle: boolean;
  sleActiveOrAplaPositive: boolean;
  endocrineBoneNotes: string;

  // 8. רגישויות ואלרגיות
  hasAllergiesOrSensitivities: boolean;
  peanutOrSoyAllergy: boolean;      // התווית נגד לאוטרוגסטן!
  patchAdhesiveSensitivity: boolean; // גירוי עורי ממדבקות
  otherDrugAllergies: string;

  // שדה כללי למחלות רקע אחרות במלל חופשי לידיעת הרופא/ה
  otherBackgroundConditionsFreeText: string;
}

// 6 קטגוריות-אב היררכיות לתרופות קבועות
export interface MedicationHistoryHierarchical {
  // 1. אינקרטינים (GLP-1 / GIP) וסוכרת
  hasGlp1OrMetabolicMeds: boolean;
  takingGlp1: boolean;
  glp1DrugDetails: string;
  glp1RecentInitOrDoseEscalation: boolean;
  takingMetforminOrInsulinOrSglt2: boolean;

  // 2. נוירולוגיה ואנטי-אפילפטיות
  hasNeuroAntiepilepticMeds: boolean;
  takingLamotrigine: boolean;        // אסטרוגן פומי מוריד רמות למוטריג'ין בעד 50%!
  takingEnzymeInducers: boolean;     // Carbamazepine, Phenytoin, Topiramate, Rifampicin, St John's Wort
  enzymeInducerDetails: string;

  // 3. טיפול אנדוקריני / אונקולוגי
  hasOncologicEndocrineMeds: boolean;
  takingTamoxifen: boolean;          // חוסם MHT + חוסם Paroxetine/Fluoxetine (CYP2D6)!
  takingAromataseInhibitors: boolean; // Letrozole, Anastrozole, Exemestane
  takingGnrhAgonists: boolean;

  // 4. בלוטת התריס וסטרואידים
  hasThyroidOrSteroidMeds: boolean;
  takingLevothyroxine: boolean;
  recentTshLevel?: number;           // זיהוי TSH מדוכא (<0.4) המחקה תסמיני מנופאוזה!
  takingSystemicCorticosteroids: boolean;

  // 5. לב, ל"ד, שומנים וקרישה
  hasCardioRenalAnticoagMeds: boolean;
  takingAntihypertensives: boolean;
  takingAceArbOrPotassiumSparing: boolean; // זהירות היפרקלמיה עם Angeliq
  takingStatins: boolean;
  takingTherapeuticAnticoagulants: boolean;
  takingAntiplatelets: boolean;

  // 6. פסיכיאטריה, שינה וכאב
  hasPsychSleepPainMeds: boolean;
  takingSsriOrSnri: boolean;
  takingCyp2d6InhibitorParoxetineFluoxetine: boolean;
  takingGabapentinOrPregabalin: boolean;
  takingSleepMedsOrBenzos: boolean;

  // מלל חופשי לתרופות ותוספי תזונה נוספים לידיעת הרופא/ה
  otherMedicationsAndSupplementsFreeText: string;
}

export interface FamilyHistoryData {
  familyBreastOrOvarianCancer: boolean;
  familyCancerFirstDegreeUnder50OrMultiple: boolean;
  familyCancerDetails: string;
  familyEndometrialOrColorectalCancer: boolean;
  brcaStatus: BrcaStatus;
  lynchSyndrome: boolean;
  familyPrematureCvd: boolean;        // גבר <55, אישה <65 בקרבה ראשונה
  familyVteOrThrombophilia: boolean;  // מחייב מתן עורי
  familyOsteoporosisOrHipFracture: boolean;
  familyDiabetes: boolean;
  familyMenopauseAge?: number;
  notes: string;
}

export type PriorStopCategory = 'INTOLERANCE_OR_ALLERGY' | 'SUBOPTIMAL_EFFICACY';

export interface PriorFailedTreatment {
  id: string;
  treatmentKey:
    | 'ORAL_COMBINED_NETA'     // אקטיבל / אוויאנה / נובופם / אנג'ליק
    | 'ORAL_FEMOSTON'          // פמוסטון / פמוסטון קונטי
    | 'EVOREL_PATCH'           // מדבקות אוורל / אוורל קונטי / סקווי
    | 'ESTROGEL_SANDRENA'      // ג'ל אסטרוג'ל / סנדרנה
    | 'UTROGESTAN_ORAL'        // אוטרוגסטן פומי
    | 'MIRENA_IUS'             // מירנה
    | 'VEOZA_NK3'              // ויוזה / לינקואט
    | 'SSRI_SNRI'              // ונלפקסין / SSRI
    | 'OTHER';
  customName: string;
  reasonStopped: string;
  /**
   * הבחנה קלינית:
   * - INTOLERANCE_OR_ALLERGY (ברירת מחדל): תופעת לוואי פוסלת / אלרגיה / אי-סבילות -> התכשיר מסונן מרשימת התרופות המתאימות.
   * - SUBOPTIMAL_EFFICACY: תגובה חלקית בלבד במינון קבוע (למשל מקרה 1 תחת Activelle) -> אינו התווית נגד רפואית, אלא מוביל לדירוג גבוה יותר למשטר עורי ניתן לטיטרציה.
   */
  stopReasonCategory?: PriorStopCategory;
}

export interface PatientPreferencesData {
  hormoneAttitude: 'OPEN_TO_MHT' | 'PREFERS_BODY_IDENTICAL' | 'PREFERS_NON_HORMONAL' | 'UNDECIDED';
  preferredRoute:
    | 'NO_PREFERENCE'
    | 'TRANSDERMAL_GEL'
    | 'TRANSDERMAL_PATCH'
    | 'ORAL_TABLET'
    | 'MIRENA_BASED'
    | 'LOCAL_VAGINAL_ONLY';
  bleedingPreference: 'PREFER_BLEED_FREE' | 'CYCLIC_ACCEPTABLE' | 'NO_PREFERENCE';
  priorFailedTreatments: PriorFailedTreatment[];
  notes: string;
}

export interface PreventCalculatorInputs {
  isManuallyExpanded: boolean;
  totalCholesterolMgDl?: number;
  hdlCholesterolMgDl?: number;
  ldlCholesterolMgDl?: number;
  triglyceridesMgDl?: number;
  egfrMlMin?: number;
  serumCreatinineMgDl?: number;
  hba1cPercent?: number;
  uacrMgG?: number;
}

export interface TimestampedNote {
  id: string;
  createdAtIso: string;
  stage: 1 | 2 | 3;
  text: string;
}

export interface Stage1Data {
  // 1. דמוגרפיה, מדדים ואורח חיים
  patientId: string;
  fullName: string;
  age: number;
  occupation: string;
  ethnicity: 'ASHKENAZI' | 'SEPHARDIC_MIZRAHI' | 'ETHIOPIAN' | 'ARAB' | 'MIXED_ASHKENAZI' | 'OTHER';
  weightKg: number;
  heightCm: number;
  bmi: number;
  bpSystolic: number;
  bpDiastolic: number;
  isSmoker: boolean;
  alcoholUnitsPerWeek: number;
  nutritionQuality: 'HEALTHY' | 'AVERAGE' | 'POOR';
  exerciseRegular: boolean;
  demographicsLifestyleNotes: string;

  // 2. היסטוריה גינקולוגית/מיילדותית, STRAW+10 ואמצעי מניעה נוכחיים
  gravida: number;
  para: number;
  abortions: number;
  menarcheAge: number;
  hadHysterectomy: boolean;          // כריתת רחם
  cervixConserved?: boolean;
  hadBsoOrRrso: boolean;             // כריתת שחלות דו-צדדית / מניעתית (BSO / RRSO)
  rrsoAge?: number;
  lastPeriodDate: string;
  cyclePattern: CyclePattern;
  bleedingIntensity: BleedingIntensity;
  monthsSinceLastPeriod: number;
  yearsOnSequentialHrt?: number;
  contraception: ContraceptionData;
  menstrualStageNotes: string;

  // 3. איסוף סימפטומים מובנה (שאלון האגודה הישראלית לגיל המעבר - 19 פריטים)
  symptoms: SymptomAssessmentMap;
  symptomsFreeTextNotes: string;

  // 4. מחלות רקע היררכיות + מלל חופשי
  medicalHistory: MedicalHistoryHierarchical;

  // 5. תרופות קבועות היררכיות + מלל חופשי
  medications: MedicationHistoryHierarchical;

  // 6. מחלות במשפחה וגנטיקה + מלל חופשי
  familyHistory: FamilyHistoryData;

  // 7. נתוני מעבדה למחשבון AHA PREVENT™
  preventInputs: PreventCalculatorInputs;

  // 8. העדפות המטופלת וטיפולי עבר + מלל חופשי
  preferences: PatientPreferencesData;

  // 9. בדיקות סקר ומעבדה (מותאמות גיל לפי סל הבריאות)
  mammographyStatus: ScreeningStatus;
  lastMammographyDate: string;
  papHpvStatus: ScreeningStatus;
  lastPapDate: string;
  cbcStatus: 'NORMAL' | 'ANEMIA' | 'NOT_TESTED';
  hemoglobinValue?: number;
  ferritinValue?: number;
  glucoseLipidsStatus: 'NORMAL' | 'ABNORMAL' | 'NOT_TESTED';
  lftStatus: 'NORMAL' | 'ABNORMAL' | 'NOT_TESTED';
  dxaStatus: 'NORMAL' | 'OSTEOPENIA' | 'OSTEOPOROSIS' | 'NOT_PERFORMED';
  fitColorectalStatus: ScreeningStatus;
  fshLevel?: number;
  estradiolSerumLevel?: number;
  screeningLabsNotes: string;

  // פלט שלב 1 למטופלת – מלל חופשי מהרופא/ה בנוסף לבדיקות להשלמה
  stage1PatientInstructionsFreeText: string;
}

export interface EndometrialRiskAssessment {
  riskTier: 'LOW' | 'HIGH';
  majorFactors: string[];
  minorFactors: string[];
  rationale: string;
}

export interface PreventRiskResult {
  isApplicable: boolean;
  inapplicableReason?: string;
  shouldAutoOpen: boolean;
  autoOpenReasons: string[];
  hasCompleteLabInputs: boolean;
  missingInputsHebrew: string[];
  computedEgfr?: number;
  modelUsed: 'BASE' | 'HBA1C_ENHANCED' | 'UACR_ENHANCED';
  risk10YearTotalCvd?: number;
  risk10YearAscvd?: number;
  risk10YearHeartFailure?: number;
  risk30YearTotalCvd?: number;
  risk30YearAscvd?: number;
  risk30YearHeartFailure?: number;
  mhtTrafficLight: 'GREEN' | 'YELLOW' | 'RED' | 'POST_EVENT';
  mhtGuidanceHebrew: string;
  bp2025GuidanceHebrew: string;
  statin2026GuidanceHebrew: string;
  femaleEnhancersPresent: string[];
}

export interface CompletenessGateResult {
  isPassed: boolean;
  systemicMhtContraindicated: boolean;
  blockingReasons: string[];
  contraindicationNotices: string[];
  warnings: string[];
  basketRecommendations: string[];
  patientInstructions: string[];
}

export type RegimenType =
  | 'ESTROGEN_ONLY'
  | 'SEQUENTIAL_COMBINED'
  | 'CONTINUOUS_COMBINED'
  | 'NON_HORMONAL_PRIMARY'
  | 'TSEC_OR_TIBOLONE';

export type RoutePreference =
  | 'TRANSDERMAL_MANDATORY'
  | 'TRANSDERMAL_PREFERRED'
  | 'ORAL_OR_TRANSDERMAL'
  | 'NON_HORMONAL_ONLY';

export type EstrogenDoseTier = 'ULTRA_LOW' | 'LOW' | 'STANDARD' | 'MODERATE_HIGH_PHYSIOLOGIC';

export type FollowUpMedicationAction =
  | 'CONTINUE_SAME'
  | 'ESCALATE_DOSE'
  | 'REDUCE_DOSE'
  | 'SWITCH_DRUG_OR_ROUTE'
  | 'ADD_LOCAL_TREATMENT'
  | 'TAPER_OR_STOP';

export interface TreatmentOptionCard {
  id: string;
  category: 'HORMONAL_SYSTEMIC' | 'NON_HORMONAL_SYSTEMIC';
  rankScore: number; // 0-100 לדירוג מותאם אישית (מוצגות אך ורק אפשרויות מתאימות שלא נפסלו!)
  suitabilityBadge: 'RECOMMENDED_TOP' | 'GOOD_ALTERNATIVE' | 'CONDITIONAL';
  followUpActionType?: FollowUpMedicationAction;
  titleHebrew: string;
  subtitleHebrew: string;
  routeLabelHebrew: string;
  regimenLabelHebrew: string;
  israeliProductsSummary: {
    primaryAgent: string;
    secondaryProgestogenOrMonitor?: string;
    scheduleHebrew: string;
  };
  prosHebrew: string[];
  consHebrew: string[];
  tailoredMatchReasons: string[];
  patientHowToTakeHebrew: string[];
  monitoringNotesHebrew?: string;
}

export interface LocalGsmOption {
  id:
    | 'gsm_moisturizers_lubricants'
    | 'gsm_vaginal_estrogen'
    | 'gsm_intrarosa_prasterone'
    | 'gsm_ospemifene_oral';
  recommended: boolean;
  isHormonal: boolean;
  titleHebrew: string;
  brandAndDoseHebrew: string;
  scheduleHebrew: string;
  prosHebrew: string[];
  cautionsHebrew: string[];
  patientInstructionsHebrew: string;
}

export interface TestosteroneHsddOption {
  id: 'hsdd_transdermal_testosterone';
  recommended: boolean;
  titleHebrew: string;
  brandAndDoseHebrew: string;
  scheduleHebrew: string;
  prerequisitesHebrew: string[];
  prosHebrew: string[];
  monitoringProtocolHebrew: string[];
  patientInstructionsHebrew: string;
}

export interface TailoredLifestyleRecommendation {
  id: string;
  domainHebrew: string;
  priority: 'HIGH' | 'ROUTINE';
  recommendationHebrew: string;
  patientInstructionHebrew: string;
  sourceCitation: string;
}

export interface ComplementaryTherapyOption {
  id:
    | 'comp_cbt_menos'
    | 'comp_clinical_hypnosis'
    | 'comp_mindfulness_mbi'
    | 'comp_acupuncture';
  recommended: boolean;
  titleHebrew: string;
  evidenceLevelHebrew: string;
  targetSymptomsHebrew: string;
  protocolHebrew: string;
  clinicalNotesHebrew: string;
  patientInstructionsHebrew: string;
  sourceCitation: string;
}

export interface HerbalBotanicalGuidanceItem {
  id: 'herb_black_cohosh' | 'herb_isoflavones_red_clover' | 'herb_st_johns_wort';
  safetyStatus: 'CAUTIOUS_OPTION' | 'AVOID_INTERACTIONS' | 'CONTRAINDICATED_FOR_PATIENT';
  titleHebrew: string;
  evidenceSummaryHebrew: string;
  safetyAndInteractionsHebrew: string;
  sourceCitation: string;
}

export interface HolisticCareSuite {
  lifestyleItems: TailoredLifestyleRecommendation[];
  complementaryTherapies: ComplementaryTherapyOption[];
  herbalOverviewNoteHebrew: string;
  herbalItems: HerbalBotanicalGuidanceItem[];
}

export interface SelectedTreatmentPlan {
  selectedPrimaryOptionId: string;
  selectedGsmOptionIds: string[];          // בחירה מרובה של תוספות מקומיות (למשל וגיפם + תכשירי לחות!)
  selectedComplementaryIds?: string[];     // טיפולים משלימים מוכחים שנבחרו (CBT, היפנוזה קלינית, מיינדפולנס, דיקור)
  includeTestosterone: boolean;            // מופרד לחלוטין מטיפול מקומי ל-GSM (ומיועד לשלב המעקב לאחר מיצוי E2+GSM)
  selectionRationaleTags: string[];
  selectionRationaleFreeText: string;
  stage2PatientInstructionsFreeText: string;
  selectedAtIso: string;
  customRegimenOverrideText?: string;
}

export interface Stage2Recommendations {
  regimenType: RegimenType;
  regimenHebrewTitle: string;
  estrogenDoseTier: EstrogenDoseTier;
  estrogenDoseTierReasonHebrew: string;
  routePreference: RoutePreference;
  routeRationale: string[];
  rankedOptions: TreatmentOptionCard[];         // אך ורק אפשרויות מתאימות ובטוחות למטופלת!
  excludedReasonsAudit: string[];               // תיעוד שקיפות מנוע למה סוננו תרופות שנפסלו
  localGsmOptions: LocalGsmOption[];            // תכשירי לחות מופרדים מאינטררוזה, אוספמיפן ואסטרוגן נרתיקי
  /**
   * לפי NICE 2024 / BMS / IMS / ACOG 2026 / Srebnik:
   * בשלב 2 (התחלת טיפול ראשונית) טסטוסטרון סיסטמי אינו ניתן כקו ראשון, אלא קודם מאזנים אסטרוגן עורי (שלא מעלה SHBG) + GSM;
   * רק בשלב 3 (מעקב), אם HSDD ממשיך להטריד למרות טיפול מיטבי – נפתחת אפשרות הטסטוסטרון (testosteroneOption בשלב 3).
   */
  testosteroneOption?: TestosteroneHsddOption;
  hsddStepwiseNoteHebrew?: string;
  holisticCare: HolisticCareSuite;
  patientExpectationPoints: string[];
  followUpIntervalMonths: number;
  emrSummaryText: string;
}

export interface BmsEndometrialCalculatorOverrides {
  unopposedOrInsufficientProgestogen?: boolean;
  sequentialHrtOver5YearsAgeOver45?: boolean;
  lynchOrCowdenSyndrome?: boolean;
  bmiOver40?: boolean;
  atypicalHyperplasiaHistory?: boolean;
  tamoxifenUse?: boolean;
  bmi30To39?: boolean;
  diabetesOrInsulinResistance?: boolean;
  pcosOrChronicAnovulation?: boolean;
}

export interface LongitudinalVisit {
  visitId: string;
  visitDate: string;
  timepointLabel: '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | 'OTHER';
  monthsSinceStart: number;

  // הטיפול שהמטופלת נטלה בכניסה לביקור
  evaluatedOptionId?: string;
  currentRegimenSummary: string;

  // 1. הערכת תסמינים חוזרת (IMS 19-item follow-up)
  followUpSymptoms: SymptomAssessmentMap;
  symptomSummaryDeltaText: string;

  // 2. אימות שינויים ברקע הרפואי, במדדים ובתרופות
  medicalBackgroundChecked: boolean;
  medicalBackgroundChanged: boolean;
  backgroundChangeDetails: string;
  updatedBpSystolic?: number;
  updatedBpDiastolic?: number;
  updatedWeightKg?: number;
  updatedBmi?: number;
  newlyStartedGlp1: boolean;
  newlyStartedInteractingMed: string;
  newContraindicationEmerged?: boolean;
  veozaAltAstNormal?: 'NOT_APPLICABLE' | 'NORMAL' | 'ELEVATED_UNDER_3X' | 'CRITICAL_OVER_3X';

  // 3. תופעות לוואי ספציפיות לטיפול שניתן + מחשבון BMS לדימומים ולסרטן הרחם
  reportedSideEffectIds: string[];
  sideEffectsFreeText: string;
  hasNewBleeding: boolean;
  isBleedingHeavyOrProlonged: boolean;
  hasRecentDoseChangeIn3Months: boolean;
  tvsThicknessMm?: number;
  stoppedHrt4WeeksAgoAndResolved?: boolean;
  bmsEndometrialOverrides?: BmsEndometrialCalculatorOverrides;

  // פלט טריאז' דימומים ותופעות לוואי
  urgentTvsIndicated: boolean;
  biopsyIndicated?: boolean;
  tvsReason?: string;
  sideEffectActionPlan: string[];

  // 4. החלטה טיפולית מפורטת במעקב (באותה רמת פירוט של שלב 2!)
  medicationAction: FollowUpMedicationAction;
  selectedFollowUpOptionId?: string;
  switchedToOptionId?: string;
  selectedGsmOptionIds?: string[];
  selectedComplementaryIds?: string[];
  includeTestosterone?: boolean;
  selectionRationaleTags?: string[];
  selectionRationaleFreeText?: string;
  updatedRegimenText: string;
  cessationPlan?: string;

  // 5. פלט הנחיות למטופלת למעקב + מלל חופשי מהרופא/ה
  patientFollowUpInstructions: string[];
  patientFollowUpInstructionsFreeText: string;

  // 6. הערות פנימיות לרופא/ה במלל חופשי כולל תאריך
  timestampedNotes: TimestampedNote[];
}

export interface PatientRecord {
  version: string;
  recordSessionId: string;
  lastUpdated: string;
  activeStage: 1 | 2 | 3;
  stage1: Stage1Data;
  stage2?: Stage2Recommendations;
  selectedPlan?: SelectedTreatmentPlan;
  stage2Notes: TimestampedNote[];
  stage3Visits: LongitudinalVisit[];
}
