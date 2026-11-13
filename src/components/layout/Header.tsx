import React from 'react';
import { BookOpen, QrCode, Download, Upload, RotateCcw, ShieldCheck } from 'lucide-react';
import { PatientRecord } from '../../clinical-engine/types';

interface HeaderProps {
  record: PatientRecord;
  onOpenModuleH: () => void;
  onOpenQr: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetPatient: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  record,
  onOpenModuleH,
  onOpenQr,
  onExportJson,
  onImportJson,
  onResetPatient
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-gradient-to-l from-teal-800 via-teal-700 to-teal-900 text-white shadow-md no-print sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* כותרת ומיתוג */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-teal-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  ניהול גיל המעבר
                </h1>
                <span className="text-xs bg-teal-600/80 text-teal-100 px-2 py-0.5 rounded-full font-medium border border-teal-400/30">
                  Zero-Server CDSS
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                מרפאת רופאת המשפחה | מעקב אורכי רב-מפגשי מאובטח
              </p>
            </div>
          </div>

          {/* פרטי מטופלת פעילה וכפתורי פעולה */}
          <div className="flex flex-wrap items-center gap-2">
            {record.stage1.fullName && (
              <div className="bg-teal-950/60 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-teal-300 font-medium">מטופלת: </span>
                <span className="font-semibold text-white">{record.stage1.fullName}</span>
                {record.stage1.age > 0 && <span className="text-teal-200 mr-1.5">({record.stage1.age})</span>}
              </div>
            )}

            {/* כפתור מודול H */}
            <button
              onClick={onOpenModuleH}
              className="flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition border border-rose-400/40"
              title="דף עזר מהיר וטבלאות השוואת תרופות לרופא/ה"
            >
              <BookOpen className="w-4 h-4" />
              <span>מודול H לרופא/ה</span>
            </button>

            {/* כפתור QR */}
            <button
              onClick={onOpenQr}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition border border-white/15"
              title="הצגת או סריקת קוד QR"
            >
              <QrCode className="w-4 h-4 text-teal-200" />
              <span>קוד QR</span>
            </button>

            {/* ייצוא קובץ מוצפן */}
            <button
              onClick={onExportJson}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition border border-white/15"
              title="שמירת קובץ נתונים מוצפן מקומית"
            >
              <Download className="w-4 h-4 text-teal-200" />
              <span>שמור תיק (JSON)</span>
            </button>

            {/* טעינת קובץ */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition border border-white/15"
              title="טעינת תיק מטופלת מקובץ מוצפן"
            >
              <Upload className="w-4 h-4 text-teal-200" />
              <span>טען תיק</span>
            </button>

            {/* מטופלת חדשה */}
            <button
              onClick={onResetPatient}
              className="flex items-center gap-1.5 bg-teal-950/80 hover:bg-teal-950 text-teal-200 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition border border-teal-800"
              title="איפוס ופתיחת תיק מטופלת חדשה"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>חדשה</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
