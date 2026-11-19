import React, { useEffect, useState } from 'react';
import { evaluateCompletenessGate } from './clinical-engine/completenessGate';
import { createInitialRecord, normalizePatientRecord } from './clinical-engine/defaults';
import { formulateTreatment } from './clinical-engine/treatmentEngine';
import {
  LongitudinalVisit,
  PatientRecord,
  SelectedTreatmentPlan,
  Stage1Data
} from './clinical-engine/types';
import { Header } from './components/layout/Header';
import { Stepper } from './components/layout/Stepper';
import { ModuleHModal } from './components/modals/ModuleHModal';
import { PrintModal } from './components/modals/PrintModal';
import { QrModal } from './components/modals/QrModal';
import { Stage1View } from './components/stage1/Stage1View';
import { Stage2View } from './components/stage2/Stage2View';
import { Stage3View } from './components/stage3/Stage3View';
import { decryptData, encryptData } from './services/cryptoService';

const DRAFT_STORAGE_KEY = 'menopause_active_draft_v2';

export const App: React.FC = () => {
  const [record, setRecord] = useState<PatientRecord>(() => {
    const savedV2 = localStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem('menopause_active_draft');
    if (savedV2) {
      try {
        return normalizePatientRecord(JSON.parse(savedV2));
      } catch (e) {
        console.error('Failed to parse draft from localStorage', e);
      }
    }
    return createInitialRecord(false);
  });

  const [isModuleHOpen, setIsModuleHOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [printModalConfig, setPrintModalConfig] = useState<{
    isOpen: boolean;
    type: 'PATIENT_INSTRUCTIONS' | 'PATIENT_LEAFLET' | 'STAGE3_FOLLOWUP' | 'EMR_SUMMARY';
  }>({
    isOpen: false,
    type: 'PATIENT_LEAFLET'
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(record));
  }, [record]);

  const gateResult = evaluateCompletenessGate(record.stage1);
  const isStage1Complete = gateResult.isPassed;

  // עדכון שדות שלב 1
  const handleStage1Change = (updated: Partial<Stage1Data>) => {
    setRecord((prev) => ({
      ...prev,
      stage1: { ...prev.stage1, ...updated },
      lastUpdated: new Date().toISOString()
    }));
  };

  // מעבר לשלב 2 וחישוב אופציות הטיפול המתאימות בלבד
  const handleProceedToStage2 = () => {
    const recs = formulateTreatment(record.stage1);
    setRecord((prev) => {
      const validPrimaryId =
        prev.selectedPlan?.selectedPrimaryOptionId &&
        recs.rankedOptions.some((o) => o.id === prev.selectedPlan?.selectedPrimaryOptionId)
          ? prev.selectedPlan.selectedPrimaryOptionId
          : recs.rankedOptions[0]?.id || '';

      const defaultSelected: SelectedTreatmentPlan = prev.selectedPlan
        ? {
            ...prev.selectedPlan,
            selectedPrimaryOptionId: validPrimaryId
          }
        : {
            selectedPrimaryOptionId: validPrimaryId,
            selectedGsmOptionIds: recs.localGsmOptions.filter((l) => l.recommended).map((l) => l.id),
            includeTestosterone: false,
            selectionRationaleTags: [],
            selectionRationaleFreeText: '',
            stage2PatientInstructionsFreeText: '',
            selectedAtIso: new Date().toISOString()
          };
      return {
        ...prev,
        activeStage: 2,
        stage2: recs,
        selectedPlan: defaultSelected,
        lastUpdated: new Date().toISOString()
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // שמירת האופציה שנבחרה, תוספות מקומיות (Multi-Select), טסטוסטרון ונימוק בשלב 2
  const handleSelectPlan = (plan: SelectedTreatmentPlan) => {
    setRecord((prev) => ({
      ...prev,
      stage2: formulateTreatment(prev.stage1),
      selectedPlan: plan,
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleAddStage2Note = (text: string) => {
    setRecord((prev) => ({
      ...prev,
      stage2Notes: [
        ...prev.stage2Notes,
        {
          id: `s2note_${Date.now()}`,
          createdAtIso: new Date().toISOString(),
          stage: 2,
          text
        }
      ],
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleDeleteStage2Note = (id: string) => {
    setRecord((prev) => ({
      ...prev,
      stage2Notes: prev.stage2Notes.filter((n) => n.id !== id),
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleProceedToStage3 = () => {
    setRecord((prev) => {
      const recs = formulateTreatment(prev.stage1);
      const ensuredPlan: SelectedTreatmentPlan = prev.selectedPlan || {
        selectedPrimaryOptionId: recs.rankedOptions[0]?.id || '',
        selectedGsmOptionIds: recs.localGsmOptions.filter((l) => l.recommended).map((l) => l.id),
        includeTestosterone: false,
        selectionRationaleTags: [],
        selectionRationaleFreeText: '',
        stage2PatientInstructionsFreeText: '',
        selectedAtIso: new Date().toISOString()
      };
      return {
        ...prev,
        activeStage: 3,
        stage2: recs,
        selectedPlan: ensuredPlan,
        lastUpdated: new Date().toISOString()
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddLongitudinalVisit = (visit: LongitudinalVisit, switchedPlan?: SelectedTreatmentPlan) => {
    setRecord((prev) => ({
      ...prev,
      selectedPlan: switchedPlan || prev.selectedPlan,
      stage3Visits: [...prev.stage3Visits, visit],
      lastUpdated: new Date().toISOString()
    }));
  };

  const handleExportJson = async () => {
    try {
      const encryptedBase64 = await encryptData(record);
      const blob = new Blob([encryptedBase64], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Menopause_Record_${record.stage1.patientId || 'patient'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Encryption failed', err);
      alert('שגיאה בהצפנת קובץ המטופלת.');
    }
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = await decryptData<PatientRecord>(text.trim());
      } catch {
        parsed = JSON.parse(text);
      }
      const normalized = normalizePatientRecord(parsed);
      if (!normalized.stage2 && normalized.activeStage >= 2) {
        normalized.stage2 = formulateTreatment(normalized.stage1);
      }
      setRecord(normalized);
    } catch (err) {
      console.error('Import failed', err);
      alert('שגיאה בפענוח הקובץ. אנא ודא/י שהקובץ תקין.');
    }
  };

  const handleRestoreFromCompressed = (data: any) => {
    const normalized = normalizePatientRecord(data);
    if (normalized.selectedPlan || normalized.activeStage >= 2) {
      normalized.stage2 = formulateTreatment(normalized.stage1);
    }
    setRecord(normalized);
  };

  // איפוס מלא של 100% מהשדות ופתיחת תיק מטופלת חדשה עם recordSessionId חדש (המרענן את כל רכיבי הממשק!)
  const handleResetPatient = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem('menopause_active_draft');
    const cleanRecord = createInitialRecord(true);
    setRecord(cleanRecord);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-hebrew">
      <Header
        record={record}
        onOpenModuleH={() => setIsModuleHOpen(true)}
        onOpenQr={() => setIsQrModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetPatient={handleResetPatient}
      />

      <Stepper
        activeStage={record.activeStage}
        isStage1Complete={isStage1Complete}
        hasStage2Recommendations={Boolean(record.stage2 || record.selectedPlan)}
        onSelectStage={(stage) => {
          if (stage >= 2 && !record.stage2) {
            handleProceedToStage2();
          } else {
            setRecord((prev) => ({ ...prev, activeStage: stage }));
          }
        }}
      />

      <main className="flex-1">
        {record.activeStage === 1 && (
          <Stage1View
            key={`s1_${record.recordSessionId}`}
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
            key={`s2_${record.recordSessionId}`}
            record={record}
            stage1Data={record.stage1}
            selectedPlan={record.selectedPlan}
            stage2Notes={record.stage2Notes}
            onSelectPlan={handleSelectPlan}
            onAddStage2Note={handleAddStage2Note}
            onDeleteStage2Note={handleDeleteStage2Note}
            onProceedToStage3={handleProceedToStage3}
            onPrintPatientLeaflet={() =>
              setPrintModalConfig({ isOpen: true, type: 'PATIENT_LEAFLET' })
            }
          />
        )}

        {record.activeStage === 3 && (
          <Stage3View
            key={`s3_${record.recordSessionId}`}
            record={record}
            stage1Data={record.stage1}
            stage2Recs={record.stage2}
            selectedPlan={record.selectedPlan}
            visits={record.stage3Visits}
            onAddVisit={handleAddLongitudinalVisit}
            onPrintFollowUpSummary={() =>
              setPrintModalConfig({ isOpen: true, type: 'STAGE3_FOLLOWUP' })
            }
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            מערכת קלינית תומכת החלטה לגיל המעבר | ארכיטקטורת <strong>Zero-Server (Client-Side Only)</strong>
          </div>
          <div className="text-slate-400">
            מבוסס על שאלון IMS, מחשבון AHA PREVENT™, הנחיות BMS 2024–2025, Red Whale, ד"ר שקלאי, ד"ר פרייברג וד"ר סרבניק
          </div>
        </div>
      </footer>

      <ModuleHModal
        isOpen={isModuleHOpen}
        onClose={() => setIsModuleHOpen(false)}
        record={record}
      />

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
