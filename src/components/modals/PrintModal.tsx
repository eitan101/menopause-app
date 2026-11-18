import React from 'react';
import { Printer, X } from 'lucide-react';
import { evaluateCompletenessGate } from '../../clinical-engine/completenessGate';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import { PatientRecord } from '../../clinical-engine/types';
import { generateEmrSummary } from '../../services/emrExportService';

interface PrintModalProps {
  isOpen: boolean;
  type: 'PATIENT_INSTRUCTIONS' | 'PATIENT_LEAFLET' | 'EMR_SUMMARY';
  record: PatientRecord;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, type, record, onClose }) => {
  if (!isOpen) return null;

  const p = record.stage1;
  const gate = evaluateCompletenessGate(p);
  const recs = record.stage2 || formulateTreatment(p);
  const chosenOption =
    recs.rankedOptions.find((o) => o.id === record.selectedPlan?.selectedPrimaryOptionId) ||
    recs.rankedOptions[0];
  const gsmOption = recs.localAndAdjunctOptions.find(
    (l) => l.id === record.selectedPlan?.selectedGsmOptionId
  );

  const today = new Date().toLocaleDateString('he-IL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-right">
        {/* כותרת בקרה (מוסתרת בהדפסה) */}
        <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between no-print shrink-0">
          <h3 className="text-sm font-bold">
            {type === 'PATIENT_INSTRUCTIONS'
              ? 'דף הנחיות להשלמת בדיקות לקראת המשך בירור'
              : type === 'PATIENT_LEAFLET'
              ? 'דף הדרכה ותיאום ציפיות אישי למטופלת'
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
              <h1 className="text-xl font-extrabold text-teal-900">מרפאת גיל המעבר – דף מידע אישי למטופלת</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                שם: <strong>{p.fullName || 'מטופלת'}</strong> | ת.ז: {p.patientId || '-'} | גיל: {p.age}
              </p>
            </div>
            <div className="text-xs text-slate-500">תאריך: {today}</div>
          </div>

          {type === 'PATIENT_INSTRUCTIONS' && (
            <div className="space-y-4">
              <p className="font-bold text-slate-900">
                לקראת השלמת התאמת הטיפול המדויק והבטוח ביותר עבורך, מומלץ להשלים את הבדיקות הבאות:
              </p>
              <ul className="list-disc pr-5 space-y-2 text-xs leading-relaxed">
                {gate.patientInstructions.length > 0 ? (
                  gate.patientInstructions.map((inst, idx) => <li key={idx}>{inst}</li>)
                ) : (
                  <li>כל בדיקות הבסיס הושלמו – ניתן להמשיך בתוכנית הטיפול.</li>
                )}
              </ul>
            </div>
          )}

          {type === 'PATIENT_LEAFLET' && (
            <div className="space-y-4 text-xs leading-relaxed">
              {chosenOption && (
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1.5">
                  <div className="text-sm font-extrabold text-teal-950">תוכנית הטיפול שנבחרה יחד איתך:</div>
                  <div className="font-bold text-slate-900">{chosenOption.titleHebrew}</div>
                  <div>
                    <strong>תכשיר ומינון:</strong> {chosenOption.israeliProductsSummary.primaryAgent}
                  </div>
                  {chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor && (
                    <div>
                      <strong>הגנה נלווית / מעקב:</strong>{' '}
                      {chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor}
                    </div>
                  )}
                  <div>
                    <strong>אופן נטילה:</strong> {chosenOption.israeliProductsSummary.scheduleHebrew}
                  </div>
                  {gsmOption && (
                    <div className="pt-1 border-t border-teal-200 mt-1">
                      <strong>טיפול מקומי משולב:</strong> {gsmOption.titleHebrew} ({gsmOption.scheduleHebrew})
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-extrabold text-slate-900 mb-2">דגשים חשובים ותיאום ציפיות לחודשים הראשונים:</h4>
                <ul className="list-disc pr-5 space-y-2">
                  {recs.patientExpectationPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                <strong>מתי לפנות לבדיקה רפואית לפני מועד המעקב המתוכנן (3 חודשים)?</strong>
                <p className="mt-1">
                  במקרה של דימום נרתיקי כבד או ממושך, גוש או שינוי חדש בשד, כאב/נפיחות חריגה בשוק הרגל, קוצר נשימה/כאב בחזה, כאב ראש חריף חדש, או (תחת טיפול בויוזה) הופעת עייפות חריגה, בחילה ממושכת, שתן כהה או הצהבת עור/עיניים.
                </p>
              </div>
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
