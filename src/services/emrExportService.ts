import { PatientRecord } from '../clinical-engine/types';
import { calculateStrawStage } from '../clinical-engine/strawStaging';

export function generateEmrSummary(record: PatientRecord): string {
  const p = record.stage1;
  const straw = calculateStrawStage(p);
  const now = new Date().toLocaleDateString('he-IL');

  let text = `=== סיכום ביקור מעקב גיל המעבר (מרפאת רופאת המשפחה) ===\n`;
  text += `תאריך: ${now} | ת.ז/מזהה: ${p.patientId || 'ללא'} | שם: ${p.fullName || 'מטופלת'}\n`;
  text += `גיל: ${p.age} | BMI: ${p.bmi.toFixed(1)} (גובה ${p.heightCm} ס"מ, משקל ${p.weightKg} ק"ג) | ל"ד: ${p.bpSystolic}/${p.bpDiastolic} mmHg\n`;
  text += `שלב STRAW+10: ${straw.titleHebrew} [${straw.stageCode}]\n`;
  text += `דפוס דימומים: ${p.cyclePattern} (ווסת אחרונה: ${p.lastPeriodDate || 'לא ידוע'})\n`;
  text += `תסמינים פעילים: VMS (${p.vmsSeverity}), גלי לילה: ${p.hasNightSweats ? 'כן' : 'לא'}, GSM: ${p.hasVaginalDryness ? 'יובש/כאב' : 'שלילי'}, ערפול מוחי: ${p.hasBrainFog ? 'כן' : 'לא'}\n`;
  text += `אינטראקציות ורקע: ${p.takingGlp1 ? 'מטופלת ב-GLP-1 (מונג\'רו/אוזמפיק)' : 'ללא אינטראקציה קריטית'}\n\n`;

  if (record.stage2) {
    text += `החלטה טיפולית:\n`;
    text += `- משטר: ${record.stage2.regimenHebrewTitle}\n`;
    text += `- ציר מתן: ${record.stage2.routePreference}\n`;
    if (record.stage2.estrogenOption) {
      text += `- אסטרוגן: ${record.stage2.estrogenOption.brandName} (${record.stage2.estrogenOption.dosage}) - ${record.stage2.estrogenOption.schedule}\n`;
    }
    if (record.stage2.progestogenOption) {
      text += `- פרוגסטוגן: ${record.stage2.progestogenOption.brandName} (${record.stage2.progestogenOption.dosage}) - ${record.stage2.progestogenOption.schedule}\n`;
    }
    if (record.stage2.localGsmOption) {
      text += `- טיפול מקומי ב-GSM: ${record.stage2.localGsmOption.brandName} - ${record.stage2.localGsmOption.schedule}\n`;
    }
    text += `\nבוצע תיאום ציפיות מלא לגבי הכתמות ודימומים שפירים קלים בחצי השנה הראשונה.\n`;
  }

  if (record.stage3Visits.length > 0) {
    text += `\nהיסטוריית מעקבים אחרונה:\n`;
    const lastVisit = record.stage3Visits[record.stage3Visits.length - 1];
    text += `מפגש מעקב בתאריך ${lastVisit.visitDate} (חודש ${lastVisit.monthsSinceStart} לטיפול):\n`;
    text += `- תגובת תסמינים: VMS: ${lastVisit.symptomVmsChange}, GSM: ${lastVisit.symptomGsmChange}\n`;
    text += `- דימומים חדשים: ${lastVisit.hasNewBleeding ? 'יש דימום' : 'ללא דימום'}\n`;
    text += `- החלטה: ${lastVisit.recommendedAction}\n`;
  }

  text += `\nהופק באמצעות מערכת תומכת החלטה קלינית לגיל המעבר (Zero-Server Architecture)`;
  return text;
}
