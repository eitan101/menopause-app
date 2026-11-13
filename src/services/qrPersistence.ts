import LZString from 'lz-string';
import QRCode from 'qrcode';
import { PatientRecord } from '../clinical-engine/types';

export function compressPatientData(record: PatientRecord): string {
  // שמירת שדות עיקריים לדחיסת QR מרבית
  const compactPayload = {
    v: record.version,
    id: record.stage1.patientId,
    nm: record.stage1.fullName,
    ag: record.stage1.age,
    bm: record.stage1.bmi,
    bp: `${record.stage1.bpSystolic}/${record.stage1.bpDiastolic}`,
    st: record.activeStage,
    reg: record.stage2?.regimenHebrewTitle,
    est: record.stage2?.estrogenOption?.brandName,
    prg: record.stage2?.progestogenOption?.brandName,
    fu: record.stage3Visits.length
  };

  const jsonStr = JSON.stringify(compactPayload);
  return LZString.compressToEncodedURIComponent(jsonStr);
}

export function decompressPatientData(compressedStr: string): any {
  const decompressed = LZString.decompressFromEncodedURIComponent(compressedStr);
  if (!decompressed) {
    throw new Error('שגיאה בפריקת נתוני קוד QR');
  }
  return JSON.parse(decompressed);
}

export async function generateQrCodeDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#0f766e',
      light: '#ffffff'
    }
  });
}
