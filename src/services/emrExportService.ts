import { checkDrugInteractions } from '../clinical-engine/drugInteractions';
import { summarizeSymptoms } from '../clinical-engine/imsSymptoms';
import { calculateAhaPreventRisk, calculateVteRisk } from '../clinical-engine/riskCalculators';
import { evaluateContraceptionAndMirena, evaluateSTRAWStage } from '../clinical-engine/strawStaging';
import { PatientRecord } from '../clinical-engine/types';

export function generateEmrSummary(record: PatientRecord): string {
  const p = record.stage1;
  const straw = evaluateSTRAWStage(p);
  const contra = evaluateContraceptionAndMirena(p);
  const sym = summarizeSymptoms(p.symptoms);
  const prevent = calculateAhaPreventRisk(p);
  const vte = calculateVteRisk(p);
  const interactions = checkDrugInteractions(p);
  const now = new Date().toLocaleDateString('he-IL');

  const lines: string[] = [];
  lines.push('=== סיכום ייעוץ ומעקב גיל המעבר (מרפאת רופאת המשפחה) ===');
  lines.push(`תאריך: ${now} | ת.ז/מזהה: ${p.patientId || 'ללא'} | שם: ${p.fullName || 'מטופלת'} | גיל: ${p.age}`);
  lines.push(
    `מדדים: BMI ${p.bmi.toFixed(1)} (משקל ${p.weightKg} ק"ג, גובה ${p.heightCm} ס"מ) | ל"ד ${p.bpSystolic}/${p.bpDiastolic} ממ"כ | עישון: ${
      p.isSmoker ? 'מעשנת פעילה' : 'לא'
    }`
  );
  lines.push(`שלב STRAW+10: ${straw.hebrewName} (${straw.code})`);
  lines.push(`אמצעי מניעה נוכחי: ${p.contraception.currentMethod} (${contra.contraceptionRuleHebrew})`);

  // תסמינים מובילים לפי שאלון IMS
  const topSymptomsText =
    sym.topPriorityItems.length > 0
      ? sym.topPriorityItems
          .map((t) => `${t.item.shortTitleHebrew} (עוצמה ${t.entry.severity}/4, חשיבות ${t.entry.importance}/4)`)
          .join('; ')
      : 'ללא תסמינים מדורגים';
  lines.push(`סימפטומים (שאלון IMS 19 פריטים – סה"כ חומרה ${sym.totalSeverityScore}/76): ${topSymptomsText}`);

  // הערכות סיכון (PREVENT + VTE)
  if (prevent.hasCompleteLabInputs) {
    lines.push(
      `הערכת סיכון קרדיו-וסקולרי AHA PREVENT: 10y Total CVD ${prevent.risk10YearTotalCvd}% | 10y ASCVD ${prevent.risk10YearAscvd}% | 10y HF ${prevent.risk10YearHeartFailure}%${
        prevent.risk30YearTotalCvd !== undefined ? ` | 30y Total CVD ${prevent.risk30YearTotalCvd}%` : ''
      }`
    );
  }
  if (vte.factors.length > 0) {
    lines.push(`גורמי סיכון VTE: ${vte.factors.join(', ')}`);
  }
  if (interactions.length > 0) {
    lines.push(`אינטראקציות ורגישויות פעילות: ${interactions.map((i) => i.drugName).join(' | ')}`);
  }

  // ריכוז כל שדות המלל החופשי לידיעת הרופא/ה משלב 1
  const stage1Notes: string[] = [];
  if (p.demographicsLifestyleNotes.trim()) stage1Notes.push(`אורח חיים: ${p.demographicsLifestyleNotes.trim()}`);
  if (p.menstrualStageNotes.trim()) stage1Notes.push(`גינקולוגי/מחזור: ${p.menstrualStageNotes.trim()}`);
  if (p.contraception.notes.trim()) stage1Notes.push(`אמצעי מניעה: ${p.contraception.notes.trim()}`);
  if (p.symptomsFreeTextNotes.trim()) stage1Notes.push(`סימפטומים נוספים: ${p.symptomsFreeTextNotes.trim()}`);
  if (p.medicalHistory.otherBackgroundConditionsFreeText.trim()) {
    stage1Notes.push(`מחלות רקע נוספות: ${p.medicalHistory.otherBackgroundConditionsFreeText.trim()}`);
  }
  if (p.medications.otherMedicationsAndSupplementsFreeText.trim()) {
    stage1Notes.push(`תרופות/תוספים נוספים: ${p.medications.otherMedicationsAndSupplementsFreeText.trim()}`);
  }
  if (p.familyHistory.notes.trim()) stage1Notes.push(`היסטוריה משפחתית: ${p.familyHistory.notes.trim()}`);
  if (p.preferences.notes.trim()) stage1Notes.push(`העדפות מטופלת: ${p.preferences.notes.trim()}`);
  if (p.screeningLabsNotes.trim()) stage1Notes.push(`מעבדה וסקר: ${p.screeningLabsNotes.trim()}`);

  if (stage1Notes.length > 0) {
    lines.push(`\nהערות קליניות לידיעת הרופא/ה (שלב 1):\n- ${stage1Notes.join('\n- ')}`);
  }

  // החלטה טיפולית בשלב 2 + אופציה שנבחרה ומדוע + הערות מתוארכות
  if (record.stage2) {
    lines.push('\n--- שלב 2: הגדרת תוכנית הטיפול ---');
    lines.push(`משטר מומלץ: ${record.stage2.regimenHebrewTitle}`);
    const chosenOption =
      record.stage2.rankedOptions.find((o) => o.id === record.selectedPlan?.selectedPrimaryOptionId) ||
      record.stage2.rankedOptions[0];

    if (chosenOption) {
      lines.push(
        `אופציה שנבחרה: ${chosenOption.titleHebrew} (${chosenOption.israeliProductsSummary.primaryAgent}${
          chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor
            ? ` + ${chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor}`
            : ''
        })`
      );
    }
    if (record.selectedPlan) {
      const reasons = [
        ...record.selectedPlan.selectionRationaleTags,
        record.selectedPlan.selectionRationaleFreeText.trim()
      ]
        .filter(Boolean)
        .join('; ');
      if (reasons) {
        lines.push(`נימוק לבחירת האופציה: ${reasons}`);
      }
      if (record.selectedPlan.selectedGsmOptionId) {
        const gsm = record.stage2.localAndAdjunctOptions.find(
          (l) => l.id === record.selectedPlan?.selectedGsmOptionId
        );
        if (gsm) lines.push(`טיפול מקומי משולב ל-GSM: ${gsm.titleHebrew} (${gsm.brandAndDoseHebrew})`);
      }
      if (record.selectedPlan.includeTestosterone) {
        lines.push('תוספת נשקלת ל-HSDD: טסטוסטרון עורי במינון נשי פיזיולוגי עם מעקב רמות בדם.');
      }
    }

    if (record.stage2Notes.length > 0) {
      lines.push('הערות מתוארכות (שלב 2):');
      for (const n of record.stage2Notes) {
        lines.push(`  [${new Date(n.createdAtIso).toLocaleString('he-IL')}] ${n.text}`);
      }
    }
  }

  // ביקורי מעקב בשלב 3
  if (record.stage3Visits.length > 0) {
    lines.push('\n--- שלב 3: מעקב אורכי ---');
    for (const v of record.stage3Visits) {
      lines.push(`ביקור מעקב ${v.visitDate} (חודש ${v.monthsSinceStart} לטיפול):`);
      if (v.symptomSummaryDeltaText) lines.push(`  - שינוי בסימפטומים: ${v.symptomSummaryDeltaText}`);
      lines.push(
        `  - אימות רקע רפואי: ${
          v.medicalBackgroundChanged ? `חל שינוי (${v.backgroundChangeDetails || 'עודכן'})` : 'אומת שלא חל שינוי'
        }`
      );
      if (v.reportedSideEffectIds.length > 0 || v.sideEffectsFreeText) {
        lines.push(`  - תופעות לוואי: ${[...v.reportedSideEffectIds, v.sideEffectsFreeText].filter(Boolean).join(', ')}`);
      }
      if (v.hasNewBleeding) {
        lines.push(`  - דימום חדש תחת טיפול: כן (${v.tvsReason || 'בוצע טריאז׳ BMS 2024'})`);
      }
      lines.push(`  - החלטה/שינוי תרופתי: ${v.updatedRegimenText}`);
      for (const n of v.timestampedNotes) {
        lines.push(`  - הערה [${new Date(n.createdAtIso).toLocaleString('he-IL')}]: ${n.text}`);
      }
    }
  }

  lines.push('\nהופק במערכת תומכת החלטה קלינית לגיל המעבר (Zero-Server Client-Side CDSS)');
  return lines.join('\n');
}
