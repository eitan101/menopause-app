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
    sexuallyActiveWithPregnancyRisk: true,
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
    hormoneAttitude: 'OPEN_TO_MHT',
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

export function createBlankStage1Data(): Stage1Data {
  return {
    patientId: '',
    fullName: '',
    age: 50,
    occupation: '',
    ethnicity: 'OTHER',
    weightKg: 68,
    heightCm: 164,
    bmi: 25.3,
    bpSystolic: 122,
    bpDiastolic: 78,
    isSmoker: false,
    alcoholUnitsPerWeek: 0,
    nutritionQuality: 'HEALTHY',
    exerciseRegular: false,
    demographicsLifestyleNotes: '',

    gravida: 2,
    para: 2,
    abortions: 0,
    menarcheAge: 13,
    hadHysterectomy: false,
    cervixConserved: false,
    hadBsoOrRrso: false,
    rrsoAge: undefined,
    lastPeriodDate: '',
    cyclePattern: 'SKIPPED_OVER_60_DAYS',
    bleedingIntensity: 'NORMAL',
    monthsSinceLastPeriod: 4,
    yearsOnSequentialHrt: 0,
    contraception: createEmptyContraception(),
    menstrualStageNotes: '',

    symptoms: createEmptySymptomsMap(),
    symptomsFreeTextNotes: '',

    medicalHistory: createEmptyMedicalHistory(),
    medications: createEmptyMedicationHistory(),
    familyHistory: createEmptyFamilyHistory(),
    preventInputs: createEmptyPreventInputs(),
    preferences: createEmptyPreferences(),

    mammographyStatus: 'UP_TO_DATE_NORMAL',
    lastMammographyDate: '',
    papHpvStatus: 'UP_TO_DATE_NORMAL',
    lastPapDate: '',
    cbcStatus: 'NORMAL',
    hemoglobinValue: undefined,
    ferritinValue: undefined,
    glucoseLipidsStatus: 'NORMAL',
    lftStatus: 'NORMAL',
    dxaStatus: 'NOT_PERFORMED',
    fitColorectalStatus: 'UP_TO_DATE_NORMAL',
    fshLevel: undefined,
    estradiolSerumLevel: undefined,
    screeningLabsNotes: ''
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
    exerciseRegular: true,
    gravida: 3,
    para: 3,
    lastPeriodDate: '2026-06-15',
    cyclePattern: 'SKIPPED_OVER_60_DAYS',
    monthsSinceLastPeriod: 5,
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
    dxaStatus: 'OSTEOPENIA'
  };
}

export function createInitialRecord(blank = false): PatientRecord {
  return {
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    activeStage: 1,
    stage1: blank ? createBlankStage1Data() : createDefaultDemoStage1Data(),
    stage2Notes: [],
    stage3Visits: []
  };
}

// נרמול ושדרוג אוטומטי מתיקים ישנים ב-localStorage או קובצי JSON/QR מ-v1.0
export function normalizePatientRecord(raw: any): PatientRecord {
  if (!raw || typeof raw !== 'object') {
    return createInitialRecord(false);
  }

  const blankS1 = createBlankStage1Data();
  const s1Raw = raw.stage1 || {};

  // שדרוג תסמינים אם הגיעו מפורמט v1.0 ישן
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
  } else {
    if (s1Raw.vmsSeverity === 'SEVERE') {
      mergedSymptoms['1'] = { severity: 4, frequency: 4, importance: 4 };
    } else if (s1Raw.vmsSeverity === 'MODERATE') {
      mergedSymptoms['1'] = { severity: 2, frequency: 2, importance: 3 };
    } else if (s1Raw.vmsSeverity === 'MILD') {
      mergedSymptoms['1'] = { severity: 1, frequency: 1, importance: 2 };
    }
    if (s1Raw.sleepDisruption && s1Raw.sleepDisruption !== 'NONE') {
      mergedSymptoms['7'] = { severity: 3, importance: 3 };
    }
    if (s1Raw.hasVaginalDryness || s1Raw.hasDyspareunia) {
      mergedSymptoms['15'] = { severity: 2, importance: 3 };
    }
    if (s1Raw.hasBrainFog) {
      mergedSymptoms['6'] = { severity: 2, importance: 3 };
    }
  }

  const medicalHistory: MedicalHistoryHierarchical = {
    ...blankS1.medicalHistory,
    ...(s1Raw.medicalHistory || {})
  };
  // תאימות לאחור משדות שטוחים של v1.0
  if (s1Raw.historyOfBreastCancer) {
    medicalHistory.hasMalignancyOrBreastHistory = true;
    medicalHistory.breastCancerHistory = true;
  }
  if (s1Raw.uninvestigatedBleeding) {
    medicalHistory.hasGynecologicalOrObstetricHistory = true;
    medicalHistory.uninvestigatedAbnormalBleeding = true;
  }
  if (s1Raw.activeVteOrThrombophilia) {
    medicalHistory.hasCoagulationOrVteHistory = true;
    medicalHistory.knownThrombophilia = true;
  }
  if (s1Raw.activeLiverDisease) {
    medicalHistory.hasHepaticRenalGiHistory = true;
    medicalHistory.activeLiverDiseaseOrPorphyria = true;
  }
  if (s1Raw.recentArterialEvent) {
    medicalHistory.hasCardiovascularOrMetabolicHistory = true;
    medicalHistory.activeOrRecentArterialEvent = true;
  }

  const medications: MedicationHistoryHierarchical = {
    ...blankS1.medications,
    ...(s1Raw.medications || {})
  };
  if (s1Raw.takingGlp1) {
    medications.hasGlp1OrMetabolicMeds = true;
    medications.takingGlp1 = true;
  }
  if (s1Raw.takingEnzymeInducers) {
    medications.hasNeuroAntiepilepticMeds = true;
    medications.takingEnzymeInducers = true;
  }
  if (s1Raw.takingTamoxifenOrAIs) {
    medications.hasOncologicEndocrineMeds = true;
    medications.takingTamoxifen = true;
  }
  if (s1Raw.takingLevothyroxine) {
    medications.hasThyroidOrSteroidMeds = true;
    medications.takingLevothyroxine = true;
  }

  const familyHistory: FamilyHistoryData = {
    ...blankS1.familyHistory,
    ...(s1Raw.familyHistory || {}),
    ...(s1Raw.brcaStatus && !s1Raw.familyHistory ? { brcaStatus: s1Raw.brcaStatus } : {}),
    ...(s1Raw.lynchSyndrome && !s1Raw.familyHistory ? { lynchSyndrome: true } : {}),
    ...(s1Raw.familyVte && !s1Raw.familyHistory ? { familyVteOrThrombophilia: true } : {}),
    ...(s1Raw.familyCvd && !s1Raw.familyHistory ? { familyPrematureCvd: true } : {}),
    ...(s1Raw.familyOsteoporosis && !s1Raw.familyHistory ? { familyOsteoporosisOrHipFracture: true } : {})
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
    }
  };

  return {
    version: '2.0.0',
    lastUpdated: raw.lastUpdated || new Date().toISOString(),
    activeStage: raw.activeStage === 2 || raw.activeStage === 3 ? raw.activeStage : 1,
    stage1,
    stage2: raw.stage2?.rankedOptions ? raw.stage2 : undefined,
    selectedPlan: raw.selectedPlan,
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
          urgentTvsIndicated: Boolean(v.urgentTvsIndicated),
          biopsyIndicated: v.biopsyIndicated,
          tvsReason: v.tvsReason,
          sideEffectActionPlan: Array.isArray(v.sideEffectActionPlan) ? v.sideEffectActionPlan : [],
          medicationAction: v.medicationAction || 'CONTINUE_SAME',
          switchedToOptionId: v.switchedToOptionId,
          updatedRegimenText: v.updatedRegimenText || '',
          cessationPlan: v.cessationPlan,
          timestampedNotes: Array.isArray(v.timestampedNotes)
            ? v.timestampedNotes
            : v.physicianNotes
            ? [
                {
                  id: `legacy_${Date.now()}`,
                  createdAtIso: v.visitDate || new Date().toISOString(),
                  stage: 3,
                  text: String(v.physicianNotes)
                }
              ]
            : []
        }))
      : []
  };
}
