import LZString from 'lz-string';
import QRCode from 'qrcode';
import { PatientRecord } from '../clinical-engine/types';

// ניקוי שדות ריקים/ברירת-מחדל כדי לאפשר דחיסת תיק מלא לתוך קוד QR תקני (<2200 תווים)
function stripDefaultEmptyValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(stripDefaultEmptyValues);
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj as Record<string, any>)) {
      if (v === false || v === '' || v === undefined || v === null) continue;
      if (
        typeof v === 'object' &&
        !Array.isArray(v) &&
        v.severity === 0 &&
        v.importance === 0 &&
        (v.frequency === undefined || v.frequency === 0)
      ) {
        continue;
      }
      const cleaned = stripDefaultEmptyValues(v);
      if (
        cleaned !== undefined &&
        !(typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0)
      ) {
        out[k] = cleaned;
      }
    }
    return out;
  }
  return obj;
}

export function compressPatientData(record: PatientRecord): string {
  // הסרת stage2 המחושב מחדש (ניתן לגזירה מיידית מ-stage1 + selectedPlan) לחיסכון עצום במקום ה-QR
  const slimRecord = stripDefaultEmptyValues({
    version: record.version,
    lastUpdated: record.lastUpdated,
    activeStage: record.activeStage,
    stage1: record.stage1,
    selectedPlan: record.selectedPlan,
    stage2Notes: record.stage2Notes,
    stage3Visits: record.stage3Visits
  });

  const jsonStr = JSON.stringify(slimRecord);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);

  // אם התיק כולל היסטוריה מרובת שנים וחורג מקיבולת QR בודד, נשמור גרסה תמציתית לגיבוי QR
  if (compressed.length > 2300) {
    const fallback = stripDefaultEmptyValues({
      version: record.version,
      activeStage: record.activeStage,
      stage1: {
        ...record.stage1,
        demographicsLifestyleNotes: record.stage1.demographicsLifestyleNotes.slice(0, 120)
      },
      selectedPlan: record.selectedPlan,
      stage2Notes: record.stage2Notes.slice(-3),
      stage3Visits: record.stage3Visits.slice(-2)
    });
    return LZString.compressToEncodedURIComponent(JSON.stringify(fallback));
  }

  return compressed;
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
    errorCorrectionLevel: 'L',
    margin: 2,
    width: 260,
    color: {
      dark: '#0f766e',
      light: '#ffffff'
    }
  });
}
