import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Stepper } from './components/layout/Stepper';
import { Stage1View } from './components/stage1/Stage1View';
import { Stage2View } from './components/stage2/Stage2View';
import { Stage3View } from './components/stage3/Stage3View';
import { ModuleHModal } from './components/modals/ModuleHModal';
import { QrModal } from './components/modals/QrModal';
import { PrintModal } from './components/modals/PrintModal';
import { PatientRecord, Stage1Data, LongitudinalVisit } from './clinical-engine/types';
import { evaluateCompletenessGate } from './clinical-engine/completenessGate';
import { formulateTreatment } from './clinical-engine/treatmentEngine';
import { encryptData, decryptData } from './services/cryptoService';

const DEFAULT_STAGE1_DATA: Stage1Data = {
  patientId: '12345678',
  fullName: 'שרה כהן',
  age: 52,
  occupation: 'הוראה',
  weightKg: 72,
  heightCm: 164,
  bmi: 26.8,
  bpSystolic: 125,
  bpDiastolic: 80,
  isSmoker: false,
  alcoholUnitsPerWeek: 1,
  nutritionQuality: 'HEALTHY',
  exerciseRegular: true,

  gravida: 3,
  para: 3,
  abortions: 0,
  hadGestationalDiabetes: false,
  hadGestationalHtn: false,
  hadPreeclampsia: false,
  hadPretermDelivery: false,
  menarcheAge: 13,
  hasPmsPmdd: true,
  priorContraception: 'גלולות משולבות בעבר',
  hadEndometriosis: false,
  hadHysterectomy: false,
  hadRrso: false,

  lastPeriodDate: '2026-06-15',
  cyclePattern: 'SKIPPED_OVER_60_DAYS',
  bleedingIntensity: 'NORMAL',
  monthsSinceLastPeriod: 5,

  familyMenopauseAge: 51,
  familyCvd: false,
  familyDiabetes: false,
  familyVte: false,
  familyOsteoporosis: true,
  ethnicity: 'אשכנזי',
  brcaStatus: 'NEGATIVE',
  lynchSyndrome: false,

  vmsSeverity: 'MODERATE',
  hasNightSweats: true,
  hasPalpitations: false,
  sleepDisruption: 'FREQUENT_WAKING',

  hasVaginalDryness: true,
  hasDyspareunia: true,
  hasRecurrentUtis: false,
  libidoChange: 'DECREASED',

  hasBrainFog: true,
  hasWordFindingDifficulty: true,
  hasRageOrShortFuse: false,
  hasMoodSwingsOrAnxiety: true,
  hasJointMusculoskeletalPain: false,

  mammographyStatus: 'UP_TO_DATE_NORMAL',
  lastMammographyDate: '2026-03-10',
  papHpvStatus: 'UP_TO_DATE_NORMAL',
  lastPapDate: '2025-05-12',
  cbcStatus: 'NORMAL',
  glucoseLipidsStatus: 'NORMAL',
  dxaStatus: 'OSTEOPENIA',

  takingGlp1: false,
  takingEnzymeInducers: false,
  takingTamoxifenOrAIs: false,
  takingLevothyroxine: false,

  historyOfBreastCancer: false,
  historyOfEndometrialCancer: false,
  uninvestigatedBleeding: false,
  activeVteOrThrombophilia: false,
  activeLiverDisease: false,
  recentArterialEvent: false
};

const INITIAL_RECORD: PatientRecord = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  activeStage: 1,
  stage1: DEFAULT_STAGE1_DATA,
  stage3Visits: []
};

export const App: React.FC = () => {
  const [record, setRecord] = useState<PatientRecord>(() => {
    const saved = localStorage.getItem('menopause_active_draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse draft from localStorage', e);
      }
    }
    return INITIAL_RECORD;
  });

  const [isModuleHOpen, setIsModuleHOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [printModalConfig, setPrintModalConfig] = useState<{
    isOpen: boolean;
    type: 'PATIENT_INSTRUCTIONS' | 'PATIENT_LEAFLET' | 'EMR_SUMMARY';
  }>({
    isOpen: false,
    type: 'PATIENT_LEAFLET'
  });

  // שמירה אוטומטית כטיוטה ב-LocalStorage למניעת אובדן נתונים במרפאה
  useEffect(() => {
    localStorage.setItem('menopause_active_draft', JSON.stringify(record));
  }, [record]);

  // בדיקת שלמות שלב 1
  const gateResult = evaluateCompletenessGate(record.stage1);
  const isStage1Complete = gateResult.isPassed;

  // עדכון שדות שלב 1
  const handleStage1Change = (updated: Partial<Stage1Data>) => {
    setRecord((prev) => {
      const newStage1 = { ...prev.stage1, ...updated };
      return {
        ...prev,
        stage1: newStage1,
        lastUpdated: new Date().toISOString()
      };
    });
  };

  // מעבר לשלב 2
  const handleProceedToStage2 = () => {
    const recs = formulateTreatment(record.stage1);
    setRecord((prev) => ({
      ...prev,
      activeStage: 2,
      stage2: recs,
      lastUpdated: new Date().toISOString()
    }));
  };

  // מעבר לשלב 3
  const handleProceedToStage3 = () => {
    setRecord((prev) => ({
      ...prev,
      activeStage: 3,
      lastUpdated: new Date().toISOString()
    }));
  };

  // הוספת ביקור מעקב לשלב 3
  const handleAddLongitudinalVisit = (visit: LongitudinalVisit) => {
    setRecord((prev) => ({
      ...prev,
      stage3Visits: [...prev.stage3Visits, visit],
      lastUpdated: new Date().toISOString()
    }));
  };

  // ייצוא קובץ נתונים מוצפן מקומית (Zero-Server)
  const handleExportJson = async () => {
    try {
      const encryptedBase64 = await encryptData(record);
      const blob = new Blob([encryptedBase64], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Patient_Record_${record.stage1.patientId || 'menopause'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Encryption failed', err);
      alert('שגיאה בהצפנת קובץ המטופלת.');
    }
  };

  // טעינת קובץ נתונים מוצפן
  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const decrypted = await decryptData<PatientRecord>(text);
      setRecord(decrypted);
      alert(`תיק המטופלת (${decrypted.stage1.fullName || 'מטופלת'}) שוחזר בהצלחה!`);
    } catch (err) {
      console.error('Decryption failed', err);
      alert('שגיאה בפענוח הקובץ. אנא ודא שהקובץ תקין ומוצפן בהתאם.');
    }
  };

  // שחזור מקוד QR
  const handleRestoreFromCompressed = (data: any) => {
    setRecord((prev) => ({
      ...prev,
      activeStage: (data.st as any) || 1,
      stage1: {
        ...prev.stage1,
        patientId: data.id || prev.stage1.patientId,
        fullName: data.nm || prev.stage1.fullName,
        age: data.ag || prev.stage1.age,
        bmi: data.bm || prev.stage1.bmi
      }
    }));
  };

  // איפוס מטופלת
  const handleResetPatient = () => {
    if (confirm('האם לאפס את הנתונים ולפתוח תיק מטופלת חדשה?')) {
      localStorage.removeItem('menopause_active_draft');
      setRecord({
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        activeStage: 1,
        stage1: {
          ...DEFAULT_STAGE1_DATA,
          patientId: '',
          fullName: '',
          age: 0
        },
        stage3Visits: []
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-hebrew">
      {/* סרגל עליון */}
      <Header
        record={record}
        onOpenModuleH={() => setIsModuleHOpen(true)}
        onOpenQr={() => setIsQrModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetPatient={handleResetPatient}
      />

      {/* מדריך שלבים (Stepper) */}
      <Stepper
        activeStage={record.activeStage}
        isStage1Complete={isStage1Complete}
        hasStage2Recommendations={!!record.stage2}
        onSelectStage={(stage) => setRecord((prev) => ({ ...prev, activeStage: stage }))}
      />

      {/* תוכן השלב הפעיל */}
      <main className="flex-1">
        {record.activeStage === 1 && (
          <Stage1View
            data={record.stage1}
            onChange={handleStage1Change}
            onProceedToStage2={handleProceedToStage2}
            onPrintPatientInstructions={() =>
              setPrintModalConfig({ isOpen: true, type: 'PATIENT_INSTRUCTIONS' })
            }
          />
        )}

        {record.activeStage === 2 && (
          <Stage2View
            stage1Data={record.stage1}
            onProceedToStage3={handleProceedToStage3}
            onPrintPatientLeaflet={() =>
              setPrintModalConfig({ isOpen: true, type: 'PATIENT_LEAFLET' })
            }
          />
        )}

        {record.activeStage === 3 && (
          <Stage3View
            stage1Data={record.stage1}
            stage2Recs={record.stage2}
            visits={record.stage3Visits}
            onAddVisit={handleAddLongitudinalVisit}
          />
        )}
      </main>

      {/* פוטר */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            מערכת קלינית תומכת החלטה לגיל המעבר | מתכונת <strong>Zero-Server (Client-Side Only)</strong>
          </div>
          <div className="text-slate-400">
            מבוסס על הנחיות Red Whale, BMS 2024–2025, דר' סיגל שקלאי, דר' מרב פרייברג ודר' נעמה סרבניק
          </div>
        </div>
      </footer>

      {/* מודאלים */}
      <ModuleHModal isOpen={isModuleHOpen} onClose={() => setIsModuleHOpen(false)} />
      
      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        record={record}
        onRestoreFromCompressed={handleRestoreFromCompressed}
      />

      <PrintModal
        isOpen={printModalConfig.isOpen}
        type={printModalConfig.type}
        record={record}
        onClose={() => setPrintModalConfig({ ...printModalConfig, isOpen: false })}
      />
    </div>
  );
};
