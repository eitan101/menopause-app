import { createEmptySymptomsMap } from './imsSymptoms';
import {
  ContraceptionData,
  FamilyHistoryData,
  MedicalHistoryHierarchical,
  MedicationHistoryHierarchical,
  PatientPreferencesData,
  PatientRecord,
  PreventCalculatorInputs,
  Stage1Data
} from './types';

export function createEmptyMedicalHistory(): MedicalHistoryHierarchical {
  return {
    hasMalignancyOrBreastHistory: false,
    breastCancerHistory: false,
    breastCancerReceptor: 'UNKNOWN',
    dcisOrAtypicalHyperplasia: false,
    benignBreastBiopsyNoAtypia: false,
    endometrialCancerHistory: 'NONE',
    ovarianCancerHistory: 'NONE',
    cervicalOrColorectalCancer: false,
    malignancyNotes: '',

    hasGynecologicalOrObstetricHistory: false,
    uninvestigatedAbnormalBleeding: false,
    hadEndometriosis: false,
    hasFibroidsOrAdenomyosis: false,
    endometrialHyperplasiaHistory: 'NONE',
    hasPcosOrChronicAnovulation: false,
    hasPmsPmddOrPostpartumDepression: false,
    hadPreeclampsia: false,
    hadGestationalHtn: false,
    hadGestationalDiabetes: false,
    hadPretermDelivery: false,
    gynecologicalNotes: '',

    hasCoagulationOrVteHistory: false,
    activeAcuteVte: false,
    pastUnprovokedVte: false,
    pastProvokedVte: false,
    knownThrombophilia: false,
    thrombophiliaDetails: '',
    superficialThrombophlebitisOrVaricose: false,
    coagulationNotes: '',

    hasCardiovascularOrMetabolicHistory: false,
    activeOrRecentArterialEvent: false,
    stabilizedRemotePostMi: false,
    hypertensionStatus: 'NONE',
    diabetesStatus: 'NONE',
    dyslipidemia: false,
    hypertriglyceridemiaOver200: false,
    cardiovascularNotes: '',

    hasHepaticRenalGiHistory: false,
    activeLiverDiseaseOrPorphyria: false,
    fattyLiverOrGallstones: false,
    chronicKidneyDiseaseOrSolitaryKidney: false,
    malabsorptionOrBariatricSurgery: false,
    hepaticRenalGiNotes: '',

    hasNeurologicalHistory: false,
    migraineWithAura: false,
    migraineWithoutAura: false,
    epilepsy: false,
    meningiomaHistory: false,
    neurologicalNotes: '',

    hasEndocrineBoneAutoimmuneHistory: false,
    thyroidDisorder: 'NONE',
    osteoporosisOrFragilityFracture: false,
    osteopenia: false,
    autoimmuneDiseaseRaIbdSle: false,
    sleActiveOrAplaPositive: false,
    endocrineBoneNotes: '',

    hasAllergiesOrSensitivities: false,
    peanutOrSoyAllergy: false,
    patchAdhesiveSensitivity: false,
    otherDrugAllergies: '',

    otherBackgroundConditionsFreeText: ''
  };
}

export function createEmptyMedicationHistory(): MedicationHistoryHierarchical {
  return {
    hasGlp1OrMetabolicMeds: false,
    takingGlp1: false,
    glp1DrugDetails: '',
    glp1RecentInitOrDoseEscalation: false,
    takingMetforminOrInsulinOrSglt2: false,

    hasNeuroAntiepilepticMeds: false,
    takingLamotrigine: false,
    takingEnzymeInducers: false,
    enzymeInducerDetails: '',

    hasOncologicEndocrineMeds: false,
    takingTamoxifen: false,
    takingAromataseInhibitors: false,
    takingGnrhAgonists: false,

    hasThyroidOrSteroidMeds: false,
    takingLevothyroxine: false,
    recentTshLevel: undefined,
    takingSystemicCorticosteroids: false,

    hasCardioRenalAnticoagMeds: false,
    takingAntihypertensives: false,
    takingAceArbOrPotassiumSparing: false,
    takingStatins: false,
    takingTherapeuticAnticoagulants: false,
    takingAntiplatelets: false,

    hasPsychSleepPainMeds: false,
    takingSsriOrSnri: false,
    takingCyp2d6InhibitorParoxetineFluoxetine: false,
    takingGabapentinOrPregabalin: false,
    takingSleepMedsOrBenzos: false,

    otherMedicationsAndSupplementsFreeText: ''
  };
}

export function createEmptyContraception(): ContraceptionData {
  return {
    currentMethod: 'NONE',
    mirenaInsertionDate: '',
    needsContraceptionCounseling: false,
    sexuallyActiveWithPregnancyRisk: false,
    notes: ''
  };
}

export function createEmptyFamilyHistory(): FamilyHistoryData {
  return {
    familyBreastOrOvarianCancer: false,
    familyCancerFirstDegreeUnder50OrMultiple: false,
    familyCancerDetails: '',
    familyEndometrialOrColorectalCancer: false,
    brcaStatus: 'NOT_TESTED',
    lynchSyndrome: false,
    familyPrematureCvd: false,
    familyVteOrThrombophilia: false,
    familyOsteoporosisOrHipFracture: false,
    familyDiabetes: false,
    familyMenopauseAge: undefined,
    notes: ''
  };
}

export function createEmptyPreferences(): PatientPreferencesData {
  return {
    hormoneAttitude: 'UNDECIDED',
    preferredRoute: 'NO_PREFERENCE',
    bleedingPreference: 'NO_PREFERENCE',
    priorFailedTreatments: [],
    notes: ''
  };
}

export function createEmptyPreventInputs(): PreventCalculatorInputs {
  return {
    isManuallyExpanded: false,
    totalCholesterolMgDl: undefined,
    hdlCholesterolMgDl: undefined,
    ldlCholesterolMgDl: undefined,
    triglyceridesMgDl: undefined,
    egfrMlMin: undefined,
    serumCreatinineMgDl: undefined,
    hba1cPercent: undefined,
    uacrMgG: undefined
  };
}

// תיק ריק לחלוטין ללא שום שדה ממולא מראש – מופעל בעת לחיצה על "חדשה" (איפוס תיק מטופלת)
export function createBlankStage1Data(): Stage1Data {
  return {
    patientId: '',
    fullName: '',
    age: 0,
    occupation: '',
    ethnicity: 'OTHER',
    weightKg: 0,
    heightCm: 0,
    bmi: 0,
    bpSystolic: 0,
    bpDiastolic: 0,
    isSmoker: false,
    alcoholUnitsPerWeek: 0,
    nutritionQuality: 'AVERAGE',
    exerciseRegular: false,
    demographicsLifestyleNotes: '',

    gravida: 0,
    para: 0,
    abortions: 0,
    menarcheAge: 0,
    hadHysterectomy: false,
    cervixConserved: false,
    hadBsoOrRrso: false,
    rrsoAge: undefined,
    lastPeriodDate: '',
    cyclePattern: 'REGULAR',
    bleedingIntensity: 'NONE',
    monthsSinceLastPeriod: 0,
    yearsOnSequentialHrt: undefined,
    contraception: createEmptyContraception(),
    menstrualStageNotes: '',

    symptoms: createEmptySymptomsMap(),
    symptomsFreeTextNotes: '',

    medicalHistory: createEmptyMedicalHistory(),
    medications: createEmptyMedicationHistory(),
    familyHistory: createEmptyFamilyHistory(),
    preventInputs: createEmptyPreventInputs(),
    preferences: createEmptyPreferences(),

    mammographyStatus: 'NOT_PERFORMED',
    lastMammographyDate: '',
    papHpvStatus: 'NOT_PERFORMED',
    lastPapDate: '',
    cbcStatus: 'NOT_TESTED',
    hemoglobinValue: undefined,
    ferritinValue: undefined,
    glucoseLipidsStatus: 'NOT_TESTED',
    lftStatus: 'NOT_TESTED',
    dxaStatus: 'NOT_PERFORMED',
    fitColorectalStatus: 'NOT_PERFORMED',
    fshLevel: undefined,
    estradiolSerumLevel: undefined,
    screeningLabsNotes: '',

    stage1PatientInstructionsFreeText: ''
  };
}

export function createDefaultDemoStage1Data(): Stage1Data {
  const base = createBlankStage1Data();
  const symptoms = createEmptySymptomsMap();
  symptoms['1'] = { severity: 3, frequency: 3, importance: 4 }; // גלי חום והזעות
  symptoms['6'] = { severity: 2, importance: 3 };               // Brain Fog
  symptoms['7'] = { severity: 3, importance: 4 };               // הפרעות שינה
  symptoms['15'] = { severity: 2, importance: 3 };              // יובש נרתיקי GSM
  symptoms['17'] = { severity: 2, importance: 3 };              // תפוקה בעבודה

  return {
    ...base,
    patientId: '12345678',
    fullName: 'שרה כהן (תיק הדגמה)',
    age: 52,
    occupation: 'הוראה',
    ethnicity: 'ASHKENAZI',
    weightKg: 74,
    heightCm: 164,
    bmi: 27.5,
    bpSystolic: 128,
    bpDiastolic: 82,
    nutritionQuality: 'HEALTHY',
    exerciseRegular: true,
    gravida: 3,
    para: 3,
    menarcheAge: 13,
    lastPeriodDate: '2026-06-15',
    cyclePattern: 'SKIPPED_OVER_60_DAYS',
    bleedingIntensity: 'NORMAL',
    monthsSinceLastPeriod: 5,
    contraception: {
      ...base.contraception,
      sexuallyActiveWithPregnancyRisk: true
    },
    symptoms,
    medicalHistory: {
      ...base.medicalHistory,
      hasGynecologicalOrObstetricHistory: true,
      hasPmsPmddOrPostpartumDepression: true
    },
    familyHistory: {
      ...base.familyHistory,
      brcaStatus: 'NEGATIVE',
      familyOsteoporosisOrHipFracture: true,
      familyMenopauseAge: 51
    },
    preventInputs: {
      ...base.preventInputs,
      totalCholesterolMgDl: 205,
      hdlCholesterolMgDl: 54,
      egfrMlMin: 92
    },
    preferences: {
      ...base.preferences,
      hormoneAttitude: 'PREFERS_BODY_IDENTICAL',
      preferredRoute: 'NO_PREFERENCE'
    },
    mammographyStatus: 'UP_TO_DATE_NORMAL',
    lastMammographyDate: '2026-03-10',
    papHpvStatus: 'UP_TO_DATE_NORMAL',
    lastPapDate: '2025-05-12',
    cbcStatus: 'NORMAL',
    glucoseLipidsStatus: 'NORMAL',
    lftStatus: 'NORMAL',
    fitColorectalStatus: 'UP_TO_DATE_NORMAL',
    dxaStatus: 'OSTEOPENIA'
  };
}

export function createInitialRecord(blank = false): PatientRecord {
  return {
    version: '2.1.0',
    recordSessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lastUpdated: new Date().toISOString(),
    activeStage: 1,
    stage1: blank ? createBlankStage1Data() : createDefaultDemoStage1Data(),
    stage2: undefined,
    selectedPlan: undefined,
    stage2Notes: [],
    stage3Visits: []
  };
}

// נרמול ושדרוג אוטומטי מתיקים ישנים ב-localStorage או קובצי JSON/QR
export function normalizePatientRecord(raw: any): PatientRecord {
  if (!raw || typeof raw !== 'object') {
    return createInitialRecord(false);
  }

  const blankS1 = createBlankStage1Data();
  const s1Raw = raw.stage1 || {};

  const mergedSymptoms = createEmptySymptomsMap();
  if (s1Raw.symptoms && typeof s1Raw.symptoms === 'object') {
    for (const key of Object.keys(mergedSymptoms)) {
      if (s1Raw.symptoms[key]) {
        mergedSymptoms[key] = {
          ...mergedSymptoms[key],
          ...s1Raw.symptoms[key]
        };
      }
    }
  }

  const medicalHistory: MedicalHistoryHierarchical = {
    ...blankS1.medicalHistory,
    ...(s1Raw.medicalHistory || {})
  };

  const medications: MedicationHistoryHierarchical = {
    ...blankS1.medications,
    ...(s1Raw.medications || {})
  };

  const familyHistory: FamilyHistoryData = {
    ...blankS1.familyHistory,
    ...(s1Raw.familyHistory || {})
  };

  const validEthnicities = ['ASHKENAZI', 'SEPHARDIC_MIZRAHI', 'ETHIOPIAN', 'ARAB', 'MIXED_ASHKENAZI', 'OTHER'];
  let ethnicity = s1Raw.ethnicity;
  if (!validEthnicities.includes(ethnicity)) {
    ethnicity = String(s1Raw.ethnicity || '').includes('אשכנז') ? 'ASHKENAZI' : 'OTHER';
  }

  const stage1: Stage1Data = {
    ...blankS1,
    ...s1Raw,
    ethnicity,
    hadBsoOrRrso: Boolean(s1Raw.hadBsoOrRrso ?? s1Raw.hadRrso ?? false),
    symptoms: mergedSymptoms,
    contraception: {
      ...blankS1.contraception,
      ...(s1Raw.contraception || {})
    },
    medicalHistory,
    medications,
    familyHistory,
    preventInputs: {
      ...blankS1.preventInputs,
      ...(s1Raw.preventInputs || {})
    },
    preferences: {
      ...blankS1.preferences,
      ...(s1Raw.preferences || {}),
      priorFailedTreatments: Array.isArray(s1Raw.preferences?.priorFailedTreatments)
        ? s1Raw.preferences.priorFailedTreatments
        : []
    },
    stage1PatientInstructionsFreeText: s1Raw.stage1PatientInstructionsFreeText || ''
  };

  let normalizedSelectedPlan = raw.selectedPlan;
  if (normalizedSelectedPlan && typeof normalizedSelectedPlan === 'object') {
    const gsmIds = Array.isArray(normalizedSelectedPlan.selectedGsmOptionIds)
      ? normalizedSelectedPlan.selectedGsmOptionIds
      : normalizedSelectedPlan.selectedGsmOptionId
      ? [normalizedSelectedPlan.selectedGsmOptionId]
      : [];
    normalizedSelectedPlan = {
      selectedPrimaryOptionId: normalizedSelectedPlan.selectedPrimaryOptionId || '',
      selectedGsmOptionIds: gsmIds,
      includeTestosterone: Boolean(normalizedSelectedPlan.includeTestosterone),
      selectionRationaleTags: Array.isArray(normalizedSelectedPlan.selectionRationaleTags)
        ? normalizedSelectedPlan.selectionRationaleTags
        : [],
      selectionRationaleFreeText: normalizedSelectedPlan.selectionRationaleFreeText || '',
      stage2PatientInstructionsFreeText: normalizedSelectedPlan.stage2PatientInstructionsFreeText || '',
      selectedAtIso: normalizedSelectedPlan.selectedAtIso || new Date().toISOString(),
      customRegimenOverrideText: normalizedSelectedPlan.customRegimenOverrideText
    };
  }

  return {
    version: '2.1.0',
    recordSessionId: raw.recordSessionId || `session_${Date.now()}`,
    lastUpdated: raw.lastUpdated || new Date().toISOString(),
    activeStage: raw.activeStage === 2 || raw.activeStage === 3 ? raw.activeStage : 1,
    stage1,
    stage2: raw.stage2?.localGsmOptions ? raw.stage2 : undefined,
    selectedPlan: normalizedSelectedPlan,
    stage2Notes: Array.isArray(raw.stage2Notes) ? raw.stage2Notes : [],
    stage3Visits: Array.isArray(raw.stage3Visits)
      ? raw.stage3Visits.map((v: any) => ({
          visitId: v.visitId || `visit_${Date.now()}`,
          visitDate: v.visitDate || new Date().toISOString().slice(0, 10),
          timepointLabel: v.timepointLabel || '3_MONTHS',
          monthsSinceStart: Number(v.monthsSinceStart ?? 3),
          evaluatedOptionId: v.evaluatedOptionId,
          currentRegimenSummary: v.currentRegimenSummary || '',
          followUpSymptoms: v.followUpSymptoms || createEmptySymptomsMap(),
          symptomSummaryDeltaText: v.symptomSummaryDeltaText || '',
          medicalBackgroundChecked: Boolean(v.medicalBackgroundChecked ?? true),
          medicalBackgroundChanged: Boolean(v.medicalBackgroundChanged ?? false),
          backgroundChangeDetails: v.backgroundChangeDetails || '',
          updatedBpSystolic: v.updatedBpSystolic,
          updatedBpDiastolic: v.updatedBpDiastolic,
          updatedWeightKg: v.updatedWeightKg,
          updatedBmi: v.updatedBmi,
          newlyStartedGlp1: Boolean(v.newlyStartedGlp1),
          newlyStartedInteractingMed: v.newlyStartedInteractingMed || '',
          newContraindicationEmerged: Boolean(v.newContraindicationEmerged),
          veozaAltAstNormal: v.veozaAltAstNormal || 'NOT_APPLICABLE',
          reportedSideEffectIds: Array.isArray(v.reportedSideEffectIds) ? v.reportedSideEffectIds : [],
          sideEffectsFreeText: v.sideEffectsFreeText || '',
          hasNewBleeding: Boolean(v.hasNewBleeding),
          isBleedingHeavyOrProlonged: Boolean(v.isBleedingHeavyOrProlonged),
          hasRecentDoseChangeIn3Months: Boolean(v.hasRecentDoseChangeIn3Months),
          tvsThicknessMm: v.tvsThicknessMm,
          stoppedHrt4WeeksAgoAndResolved: v.stoppedHrt4WeeksAgoAndResolved,
          bmsEndometrialOverrides: v.bmsEndometrialOverrides,
          urgentTvsIndicated: Boolean(v.urgentTvsIndicated),
          biopsyIndicated: v.biopsyIndicated,
          tvsReason: v.tvsReason,
          sideEffectActionPlan: Array.isArray(v.sideEffectActionPlan) ? v.sideEffectActionPlan : [],
          medicationAction: v.medicationAction || 'CONTINUE_SAME',
          selectedFollowUpOptionId: v.selectedFollowUpOptionId,
          switchedToOptionId: v.switchedToOptionId,
          selectedGsmOptionIds: Array.isArray(v.selectedGsmOptionIds) ? v.selectedGsmOptionIds : [],
          includeTestosterone: Boolean(v.includeTestosterone),
          selectionRationaleTags: Array.isArray(v.selectionRationaleTags) ? v.selectionRationaleTags : [],
          selectionRationaleFreeText: v.selectionRationaleFreeText || '',
          updatedRegimenText: v.updatedRegimenText || '',
          cessationPlan: v.cessationPlan,
          patientFollowUpInstructions: Array.isArray(v.patientFollowUpInstructions)
            ? v.patientFollowUpInstructions
            : [],
          patientFollowUpInstructionsFreeText: v.patientFollowUpInstructionsFreeText || '',
          timestampedNotes: Array.isArray(v.timestampedNotes) ? v.timestampedNotes : []
        }))
      : []
  };
}
