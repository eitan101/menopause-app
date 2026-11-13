import React, { useState, useEffect } from 'react';
import { X, QrCode, Download, Printer, Copy, Check, Upload } from 'lucide-react';
import { PatientRecord } from '../../clinical-engine/types';
import { compressPatientData, decompressPatientData, generateQrCodeDataUrl } from '../../services/qrPersistence';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PatientRecord;
  onRestoreFromCompressed: (data: any) => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  record,
  onRestoreFromCompressed
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [compressedString, setCompressedString] = useState<string>('');
  const [pasteInput, setPasteInput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const compressed = compressPatientData(record);
      setCompressedString(compressed);
      generateQrCodeDataUrl(compressed).then(setQrDataUrl).catch(console.error);
    }
  }, [isOpen, record]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(compressedString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = () => {
    if (!pasteInput.trim()) return;
    try {
      const parsed = decompressPatientData(pasteInput.trim());
      onRestoreFromCompressed(parsed);
      alert('התיק שוחזר בהצלחה מקוד ה-QR!');
      onClose();
    } catch (err) {
      alert('שגיאה בפענוח מחרוזת ה-QR. אנא ודא שהמחרוזת הועתקה בשלמותה.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-right">
        {/* כותרת */}
        <div className="bg-gradient-to-l from-teal-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-200" />
            <h3 className="text-base font-bold">קוד QR דחוס לשמירה ושחזור רציף (Zero-Server)</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            קוד זה מכיל את מלוא נתוני המטופלת וההחלטות בפורמט דחוס. ניתן להדפיסו בתחתית סיכום הביקור ולסרוק אותו במפגש הבא לשחזור מיידי.
          </p>

          {/* תצוגת QR */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Patient Summary QR Code" className="w-48 h-48 rounded-xl shadow-sm" />
            ) : (
              <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-xl" />
            )}
            <span className="text-[11px] text-slate-500 mt-2 font-medium">
              מטופלת: {record.stage1.fullName || 'מטופלת'} | ת.ז: {record.stage1.patientId || 'ללא'}
            </span>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg border font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'מחרוזת הועתקה!' : 'העתק מחרוזת'}</span>
            </button>
          </div>

          {/* שחזור באמצעות הדבקת מחרוזת סרוקה */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">שחזור ביקור באמצעות הדבקת מחרוזת QR סרוקה:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="הדבק כאן את המחרוזת מסורק הברקוד..."
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-xs"
              />
              <button
                onClick={handleRestore}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-2 rounded-lg"
              >
                שחזר תיק
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2 rounded-xl"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
