import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  buildStage1PatientInstructions,
  buildStage2PatientInstructions
} from '../../clinical-engine/patientInstructionsBuilder';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import { PatientRecord } from '../../clinical-engine/types';
import { generateEmrSummary } from '../../services/emrExportService';

interface PrintModalProps {
  isOpen: boolean;
  type: 'PATIENT_INSTRUCTIONS' | 'PATIENT_LEAFLET' | 'STAGE3_FOLLOWUP' | 'EMR_SUMMARY';
  record: PatientRecord;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, type, record, onClose }) => {
  if (!isOpen) return null;

  const p = record.stage1;
  const recs = record.stage2 || formulateTreatment(p);
  const stage1Output = buildStage1PatientInstructions(p);
  const stage2Output = buildStage2PatientInstructions(p, recs, record.selectedPlan);
  const lastVisit = record.stage3Visits[record.stage3Visits.length - 1];

  const today = new Date().toLocaleDateString('he-IL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-right">
        {/* כותרת בקרה (מוסתרת בהדפסה) */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between no-print shrink-0">
          <h3 className="text-sm font-bold">
            {type === 'PATIENT_INSTRUCTIONS'
              ? 'פלט למטופלת (שלב 1): דף בדיקות להשלמה'
              : type === 'PATIENT_LEAFLET'
              ? 'פלט למטופלת (שלב 2): הנחיות לדרך הטיפול שנבחר'
              : type === 'STAGE3_FOLLOWUP'
              ? 'פלט למטופלת (שלב 3): הנחיות למעקב והמשך טיפול'
              : 'סיכום רשומה רפואית (EMR)'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
            >
              <Printer className="w-4 h-4" />
              <span>הדפס / שמור PDF</span>
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* תוכן להדפסה */}
        <div className="p-8 overflow-y-auto space-y-5 text-sm text-slate-800 flex-1">
          <div className="border-b-2 border-teal-700 pb-3 flex justify-between items-end">
            <div>
              <h1 className="text-xl font-extrabold text-teal-900">מרפאת גיל המעבר – דף הנחיות אישי למטופלת</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                שם: <strong>{p.fullName || 'מטופלת'}</strong> | ת.ז: {p.patientId || '-'} | גיל: {p.age || '-'}
              </p>
            </div>
            <div className="text-xs text-slate-500">תאריך: {today}</div>
          </div>

          {type === 'PATIENT_INSTRUCTIONS' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <h2 className="text-base font-extrabold text-slate-900">{stage1Output.titleHebrew}</h2>
              <ol className="list-decimal pr-5 space-y-2">
                {stage1Output.structuredBullets.map((inst, idx) => (
                  <li key={idx}>{inst}</li>
                ))}
              </ol>
              {stage1Output.physicianFreeText && (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                  <strong className="block text-teal-950 mb-1">דגשים והערות אישיות מהרופא/ה:</strong>
                  <p className="whitespace-pre-wrap">{stage1Output.physicianFreeText}</p>
                </div>
              )}
            </div>
          )}

          {type === 'PATIENT_LEAFLET' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <h2 className="text-base font-extrabold text-slate-900">{stage2Output.titleHebrew}</h2>
              <ol className="list-decimal pr-5 space-y-2">
                {stage2Output.structuredBullets.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ol>
              {stage2Output.physicianFreeText && (
                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                  <strong className="block text-teal-950 mb-1">דגשים והנחיות אישיות מהרופא/ה:</strong>
                  <p className="whitespace-pre-wrap">{stage2Output.physicianFreeText}</p>
                </div>
              )}
            </div>
          )}

          {type === 'STAGE3_FOLLOWUP' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <h2 className="text-base font-extrabold text-slate-900">
                פלט הנחיות למטופלת (שלב 3): הנחיות למעקב והמשך הטיפול
              </h2>
              {lastVisit ? (
                <>
                  <ol className="list-decimal pr-5 space-y-2">
                    {lastVisit.patientFollowUpInstructions.map((pt, idx) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ol>
                  {lastVisit.patientFollowUpInstructionsFreeText && (
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
                      <strong className="block text-teal-950 mb-1">דגשים והנחיות אישיות מהרופא/ה:</strong>
                      <p className="whitespace-pre-wrap">{lastVisit.patientFollowUpInstructionsFreeText}</p>
                    </div>
                  )}
                </>
              ) : (
                <p>יש לשמור תחילה את ביקור המעקב להדפסת דף ההנחיות המעודכן (או להשתמש בכפתור ההעתקה המיידי).</p>
              )}
            </div>
          )}

          {type === 'EMR_SUMMARY' && (
            <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              {generateEmrSummary(record)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
