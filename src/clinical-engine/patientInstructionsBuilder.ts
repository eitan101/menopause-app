import { evaluateCompletenessGate } from './completenessGate';
import { checkDrugInteractions } from './drugInteractions';
import { calculateAhaPreventRisk } from './riskCalculators';
import { evaluateContraceptionAndMirena, evaluateSTRAWStage } from './strawStaging';
import {
  LocalGsmOption,
  LongitudinalVisit,
  SelectedTreatmentPlan,
  Stage1Data,
  Stage2Recommendations,
  TestosteroneHsddOption,
  TreatmentOptionCard
} from './types';

export interface PatientInstructionsOutput {
  stage: 1 | 2 | 3;
  titleHebrew: string;
  subtitleHebrew: string;
  structuredBullets: string[];
  physicianFreeText: string;
  formattedPlainText: string;
}

// 1. פלט הנחיות למטופלת בשלב 1 – הבדיקות הנדרשות להשלמה והכנה לקראת הטיפול
export function buildStage1PatientInstructions(data: Stage1Data): PatientInstructionsOutput {
  const gate = evaluateCompletenessGate(data);
  const prevent = calculateAhaPreventRisk(data);
  const straw = evaluateSTRAWStage(data);
  const contra = evaluateContraceptionAndMirena(data);
  const interactions = checkDrugInteractions(data);

  const bullets: string[] = [...gate.patientInstructions];

  if (straw.fshRequired && !bullets.some((b) => b.includes('FSH'))) {
    bullets.push('בדיקת דם לפרופיל הורמונלי (FSH, Estradiol, פרולקטין ו-TSH) ובדיקת הריון לפי הנחיית הרופא/ה.');
  }

  if (data.medications.recentTshLevel !== undefined && data.medications.recentTshLevel < 0.4) {
    bullets.push(
      'בדיקת דם חוזרת לתפקודי תריס (TSH, FT4, FT3) והתאמת מינון אלטרוקסין/יותירוקס – ערך TSH נמוך עשוי לגרום בעצמו לגלי חום ודפיקות לב.'
    );
  }

  if (prevent.shouldAutoOpen && !prevent.hasCompleteLabInputs && prevent.isApplicable) {
    const missing = prevent.missingInputsHebrew.join(', ');
    if (!bullets.some((b) => b.includes('פרופיל שומנים'))) {
      bullets.push(`השלמת בדיקות מעבדה להערכת סיכון לבבי (AHA PREVENT): ${missing}.`);
    }
  }

  if (contra.mirenaExpiredForMhtWarning) {
    bullets.push(
      'תיאום תור לרופא/ת נשים להחלפת התקן המירנה (תוקף ההגנה על רירית הרחם בטיפול הורמונלי הוא 5 שנים ממועד ההתקנה).'
    );
  }

  if (contra.chcOver50SwitchWarning) {
    bullets.push(
      'מעבר מתוכנן מגלולות משולבות (CHC) לאמצעי מניעה/טיפול מותאם לגיל 50+ בהתאם להנחיית הרופא/ה.'
    );
  }

  if (interactions.some((i) => i.id === 'tamoxifen') && data.medications.takingCyp2d6InhibitorParoxetineFluoxetine) {
    bullets.push(
      'תיאום מיידי מול הרופא/ה המטפל/ת להחלפת פאקסט/פרוזק בתרופה שאינה פוגעת ביעילות הטמוקסיפן (אין להפסיק תרופה בבת אחת ללא הנחיה).'
    );
  }

  if (bullets.length === 0) {
    bullets.push('כל בדיקות הבסיס והסקר הרלוונטיות לגילך מעודכנות ותקינות – אין צורך בהשלמת בדיקות מקדימות נוספות כעת.');
  }

  const freeText = (data.stage1PatientInstructionsFreeText || '').trim();
  const lines = [
    `דף הנחיות ובדיקות להשלמה – ${data.fullName || 'מטופלת'}`,
    ...bullets.map((b, idx) => `${idx + 1}. ${b}`),
    ...(freeText ? [`\nדגשים אישיים מהרופא/ה:\n${freeText}`] : [])
  ];

  return {
    stage: 1,
    titleHebrew: 'פלט הנחיות למטופלת (שלב 1): בדיקות להשלמה והכנה להחלטה טיפולית',
    subtitleHebrew: 'רשימה מותאמת אישית של בדיקות מעבדה, הדמיה וסקר הנדרשות לפי גילך ונתונייך הרפואיים',
    structuredBullets: bullets,
    physicianFreeText: freeText,
    formattedPlainText: lines.join('\n')
  };
}

// 2. פלט הנחיות למטופלת בשלב 2 – הנחיות מפורטות לדרך הטיפול שנבחר, שילובים מקומיים ותיאום ציפיות
export function buildStage2PatientInstructions(
  data: Stage1Data,
  recs: Stage2Recommendations,
  selectedPlan?: SelectedTreatmentPlan
): PatientInstructionsOutput {
  const chosenPrimary: TreatmentOptionCard | undefined =
    recs.rankedOptions.find((o) => o.id === selectedPlan?.selectedPrimaryOptionId) ||
    recs.rankedOptions[0];

  const chosenGsmList: LocalGsmOption[] = recs.localGsmOptions.filter((g) =>
    selectedPlan?.selectedGsmOptionIds?.includes(g.id)
  );

  const chosenTesto: TestosteroneHsddOption | undefined =
    selectedPlan?.includeTestosterone && recs.testosteroneOption ? recs.testosteroneOption : undefined;

  const bullets: string[] = [];

  if (chosenPrimary) {
    bullets.push(`הטיפול הסיסטמי שנבחר עבורך: ${chosenPrimary.titleHebrew}.`);
    for (const howTo of chosenPrimary.patientHowToTakeHebrew) {
      bullets.push(howTo);
    }
  }

  for (const gsm of chosenGsmList) {
    bullets.push(`טיפול מקומי משולב (${gsm.titleHebrew}): ${gsm.patientInstructionsHebrew}`);
  }

  if (chosenTesto) {
    bullets.push(`טיפול בחשק המיני (${chosenTesto.titleHebrew}): ${chosenTesto.patientInstructionsHebrew}`);
  }

  for (const exp of recs.patientExpectationPoints) {
    bullets.push(exp);
  }

  bullets.push(
    'סימני אזהרה המחייבים פנייה מוקדמת לרופא/ה (לפני ביקור המעקב בעוד 3 חודשים): דימום נרתיקי כבד או ממושך, גוש/שינוי בשד, כאב או נפיחות חריגה בשוק הרגל, כאב בחזה/קוצר נשימה, כאב ראש חריף חדש, או (תחת ויוזה) שתן כהה/צהבת/עייפות חריגה.'
  );

  const freeText = (selectedPlan?.stage2PatientInstructionsFreeText || '').trim();
  const lines = [
    `תוכנית טיפול והנחיות נטילה אישיות – ${data.fullName || 'מטופלת'}`,
    ...bullets.map((b, idx) => `${idx + 1}. ${b}`),
    ...(freeText ? [`\nהנחיות והערות אישיות מהרופא/ה:\n${freeText}`] : [])
  ];

  return {
    stage: 2,
    titleHebrew: 'פלט הנחיות למטופלת (שלב 2): אופן נטילת הטיפול, שילובים ותיאום ציפיות',
    subtitleHebrew: 'הוראות שימוש מדויקות לתכשירים שנבחרו עבורך ולוח זמנים למעקב',
    structuredBullets: bullets,
    physicianFreeText: freeText,
    formattedPlainText: lines.join('\n')
  };
}

// 3. פלט הנחיות למטופלת בשלב 3 – הנחיות למעקב, עדכון הטיפול ובדיקות בקרה
export function buildStage3PatientInstructions(
  data: Stage1Data,
  visitInput: {
    updatedRegimenText: string;
    selectedOption?: TreatmentOptionCard;
    selectedGsmOptions?: LocalGsmOption[];
    includeTestosterone?: boolean;
    testosteroneOption?: TestosteroneHsddOption;
    urgentTvsIndicated?: boolean;
    biopsyIndicated?: boolean;
    veozaAltAstNormal?: LongitudinalVisit['veozaAltAstNormal'];
    unresolvedHighPrioritySymptoms?: boolean;
    medicationAction: LongitudinalVisit['medicationAction'];
    patientFollowUpInstructionsFreeText?: string;
  }
): PatientInstructionsOutput {
  const bullets: string[] = [];

  bullets.push(`הנחיית המשך/עדכון הטיפול: ${visitInput.updatedRegimenText}`);

  if (visitInput.selectedOption) {
    for (const step of visitInput.selectedOption.patientHowToTakeHebrew) {
      bullets.push(step);
    }
  }

  if (visitInput.selectedGsmOptions && visitInput.selectedGsmOptions.length > 0) {
    for (const gsm of visitInput.selectedGsmOptions) {
      bullets.push(`טיפול מקומי (${gsm.titleHebrew}): ${gsm.patientInstructionsHebrew}`);
    }
  }

  if (visitInput.includeTestosterone && visitInput.testosteroneOption) {
    bullets.push(visitInput.testosteroneOption.patientInstructionsHebrew);
  }

  if (visitInput.urgentTvsIndicated) {
    bullets.push(
      visitInput.biopsyIndicated
        ? 'בירור דימום דחוף: יש לתאם בהקדם (תוך שבועיים) בדיקת רופא/ת נשים לביצוע אולטרסאונד נרתיקי (TVS), בדיקת רירית הרחם (פיפל) והיסטרוסקופיה לפי צורך.'
        : 'בירור דימום: יש לבצע אולטרסאונד נרתיקי (TVS) להערכת עובי רירית הרחם ובדיקת רופא/ת נשים.'
    );
  }

  if (
    visitInput.unresolvedHighPrioritySymptoms &&
    visitInput.selectedOption?.category === 'HORMONAL_SYSTEMIC' &&
    visitInput.selectedOption.routeLabelHebrew.includes('עורי')
  ) {
    bullets.push(
      'בקרת ספיגה עורית: מומלץ לבצע בדיקת דם לרמת Estradiol להערכת ספיגת הג׳ל/המדבקה ולהקפיד על מריחה/הדבקה על עור נקי ללא קרם גוף.'
    );
  }

  if (visitInput.veozaAltAstNormal === 'CRITICAL_OVER_3X') {
    bullets.push(
      'הוראת בטיחות מיידית: יש להפסיק מיד את נטילת ויוזה/לינקואט ולחזור על בדיקת תפקודי כבד בדם לפי הנחיית הרופא/ה!'
    );
  } else if (visitInput.selectedOption?.id.includes('nk3')) {
    bullets.push('להמשיך מעקב בדיקות דם לתפקודי כבד (ALT, AST ובילירובין) במועדים חודשים 1, 2, 3, 6 ו-9 לתחילת הטיפול.');
  }

  const nextVisitTiming =
    visitInput.medicationAction === 'CONTINUE_SAME' && !visitInput.urgentTvsIndicated
      ? 'מועד ביקורת המעקב הבא: בעוד 6–12 חודשים (למעקב שנתי אחר מדדים, בדיקות סקר והמשך התאמת הטיפול).'
      : 'מועד ביקורת המעקב הבא: בעוד 3 חודשים לבחינת ההשפעה של עדכון המינון / החלפת התכשיר.';
  bullets.push(nextVisitTiming);

  bullets.push(
    'יש לפנות לבדיקה מוקדמת בכל הופעה של דימום נרתיקי כבד/חריג, ממצא חדש בשד, כאב/נפיחות בשוק, קוצר נשימה או כאב בחזה.'
  );

  const freeText = (visitInput.patientFollowUpInstructionsFreeText || '').trim();
  const lines = [
    `דף הנחיות מעקב והמשך טיפול – ${data.fullName || 'מטופלת'}`,
    ...bullets.map((b, idx) => `${idx + 1}. ${b}`),
    ...(freeText ? [`\nהנחיות והערות אישיות מהרופא/ה:\n${freeText}`] : [])
  ];

  return {
    stage: 3,
    titleHebrew: 'פלט הנחיות למטופלת (שלב 3): הנחיות להמשך הטיפול ומעקב',
    subtitleHebrew: 'סיכום עדכון התרופות, בדיקות הבקרה הנדרשות ומועד המפגש הבא עבור המטופלת',
    structuredBullets: bullets,
    physicianFreeText: freeText,
    formattedPlainText: lines.join('\n')
  };
}
