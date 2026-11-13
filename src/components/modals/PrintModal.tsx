import React from 'react';
import { X, Printer } from 'lucide-react';
import { PatientRecord } from '../../clinical-engine/types';
import { calculateStrawStage } from '../../clinical-engine/strawStaging';
import { evaluateCompletenessGate } from '../../clinical-engine/completenessGate';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'PATIENT_INSTRUCTIONS' | 'PATIENT_LEAFLET' | 'EMR_SUMMARY';
  record: PatientRecord;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  type,
  record
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const p = record.stage1;
  const straw = calculateStrawStage(p);
  const gate = evaluateCompletenessGate(p);
  const now = new Date().toLocaleDateString('he-IL');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-right">
        {/* סרגל עליון - לא להדפסה */}
        <div className="bg-teal-800 text-white p-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-200" />
            <h3 className="font-bold text-sm">תצוגת הדפסה נקייה</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white text-teal-900 font-bold text-xs px-3 py-1.5 rounded-lg shadow hover:bg-teal-50 transition"
            >
              הדפס כעת
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* תוכן הדף המודפס */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-900 font-hebrew text-sm" id="printable-area">
          {/* כותרת מוסדית */}
          <div className="border-b-2 border-teal-700 pb-3 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-teal-900">מרפאת בריאות האישה וגיל המעבר</h2>
              <p className="text-xs text-slate-600">רפואת משפחה בקהילה</p>
            </div>
            <div className="text-left text-xs text-slate-500">
              <p>תאריך: <strong>{now}</strong></p>
            </div>
          </div>

          {/* פרטי מטופלת */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>שם המטופלת: <strong>{p.fullName || 'מטופלת'}</strong></div>
            <div>ת.ז/מזהה: <strong>{p.patientId || '---'}</strong></div>
            <div>גיל: <strong>{p.age}</strong></div>
            <div>שלב STRAW: <strong>{straw.stageCode}</strong></div>
          </div>

          {/* דף 1: הנחיות להשלמת בדיקות עזר למטופלת */}
          {type === 'PATIENT_INSTRUCTIONS' && (
            <div className="space-y-4">
              <div className="border-r-4 border-amber-500 pr-3">
                <h3 className="text-base font-bold text-slate-900">
                  דף הנחיות למטופלת: השלמת בדיקות ובירורים רפואיים
                </h3>
                <p className="text-xs text-slate-600">
                  לצורך התאמה בטוחה ומדויקת של טיפול הורמונלי לגיל המעבר, אנא השלימי את הבדיקות הבאות לקראת פגישתנו הבאה:
                </p>
              </div>

              <div className="space-y-2.5">
                {gate.patientInstructions.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="w-5 h-5 rounded-md border-2 border-slate-400 mt-0.5 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">{item}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                <strong>הנחיה להמשך:</strong> עם קבלת תוצאות הבדיקות, אנא קבעי תור המשך למפגש שלב 2 (הגדרת טיפול והמלצות).
              </div>
            </div>
          )}

          {/* דף 2: דף תיאום ציפיות והסבר על הטיפול */}
          {type === 'PATIENT_LEAFLET' && record.stage2 && (
            <div className="space-y-4">
              <div className="border-r-4 border-teal-600 pr-3">
                <h3 className="text-base font-bold text-teal-950">
                  דף מידע ותיאום ציפיות: תחילת הטיפול ההורמונלי בגיל המעבר
                </h3>
                <p className="text-xs text-slate-600">
                  הנחיות קליניות והסבר על מה שמצופה בששת החודשים הראשונים לטיפול
                </p>
              </div>

              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                <h4 className="font-bold text-teal-950 text-xs">הטיפול שהותאם עבורך:</h4>
                <div className="text-xs space-y-1 text-slate-800">
                  <p>• משטר טיפול: <strong>{record.stage2.regimenHebrewTitle}</strong></p>
                  {record.stage2.estrogenOption && (
                    <p>• תכשיר אסטרוגן: <strong>{record.stage2.estrogenOption.brandName}</strong> ({record.stage2.estrogenOption.dosage}) - {record.stage2.estrogenOption.schedule}</p>
                  )}
                  {record.stage2.progestogenOption && (
                    <p>• תכשיר פרוגסטוגן: <strong>{record.stage2.progestogenOption.brandName}</strong> ({record.stage2.progestogenOption.dosage}) - {record.stage2.progestogenOption.schedule}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs">דגשים חשובים להצלחת הטיפול:</h4>
                {record.stage2.patientExpectationPoints.map((pt, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800">
                    {pt}
                  </div>
                ))}
              </div>

              <div className="pt-2 text-xs text-slate-500 text-center">
                תור המעקב הבא נקבע לעוד כ-3 חודשים להערכת תגובה ומדידת לחץ דם.
              </div>
            </div>
          )}

          {/* חתימת הרופאה */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
            <div>חתימת וחותמת הרופאה: _____________________</div>
            <div>מערכת CDSS לגיל המעבר (Zero-Server Architecture)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
