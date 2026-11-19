import React, { useState } from 'react';
import { Check, Copy, FileText, Printer, Send } from 'lucide-react';
import { PatientInstructionsOutput } from '../../clinical-engine/patientInstructionsBuilder';

interface PatientOutputCardProps {
  output: PatientInstructionsOutput;
  freeTextValue: string;
  onFreeTextChange: (val: string) => void;
  onPrint?: () => void;
  freeTextPlaceholder?: string;
}

export const PatientOutputCard: React.FC<PatientOutputCardProps> = ({
  output,
  freeTextValue,
  onFreeTextChange,
  onPrint,
  freeTextPlaceholder
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output.formattedPlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/60 rounded-3xl border-2 border-teal-400/70 shadow-sm p-5 space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-200/80 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-teal-950">{output.titleHebrew}</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">{output.subtitleHebrew}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'ההנחיות למטופלת הועתקו!' : 'העתק הנחיות למטופלת'}</span>
          </button>

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-teal-900 border border-teal-300 font-bold px-3.5 py-2 rounded-xl transition"
            >
              <Printer className="w-4 h-4" />
              <span>הדפס / PDF למטופלת</span>
            </button>
          )}
        </div>
      </div>

      {/* רשימת ההנחיות המובנות למטופלת */}
      <div className="bg-white rounded-2xl border border-teal-200/80 p-4 space-y-2">
        <div className="font-bold text-slate-800 mb-1">הנחיות מותאמות אישית למסירה למטופלת:</div>
        <ol className="list-decimal pr-5 space-y-1.5 text-slate-800 leading-relaxed">
          {output.structuredBullets.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      </div>

      {/* שדה מלל חופשי מהרופא/ה למטופלת (מתווסף ישירות לפלט ולהדפסה!) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1.5">
        <label className="flex items-center gap-1.5 font-bold text-teal-900">
          <FileText className="w-4 h-4 text-teal-600" />
          <span>הנחיות ודגשים נוספים במלל חופשי מהרופא/ה למטופלת (מתווסף לדף המטופלת):</span>
        </label>
        <textarea
          rows={2}
          value={freeTextValue}
          onChange={(e) => onFreeTextChange(e.target.value)}
          placeholder={
            freeTextPlaceholder ||
            'כתבי כאן דגשים אישיים עבור המטופלת בשפה נגישה (למשל: להתחיל בלחיצה אחת בשבוע הראשון ואז לעלות ל-2 לחיצות, לתאם ממוגרפיה במוקד הקופה)...'
          }
          className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>
    </section>
  );
};
