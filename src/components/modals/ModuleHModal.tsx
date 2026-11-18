import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  HeartPulse,
  Pill,
  Scale,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X
} from 'lucide-react';
import { evaluateCompletenessGate } from '../../clinical-engine/completenessGate';
import { ISRAELI_DRUG_ARSENAL } from '../../clinical-engine/data/drugArsenal';
import { checkDrugInteractions } from '../../clinical-engine/drugInteractions';
import { summarizeSymptoms } from '../../clinical-engine/imsSymptoms';
import {
  calculateAhaPreventRisk,
  calculateBoneRisk,
  calculateEndometrialRisk,
  calculateVteRisk
} from '../../clinical-engine/riskCalculators';
import { evaluateContraceptionAndMirena, evaluateSTRAWStage } from '../../clinical-engine/strawStaging';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import { PatientRecord } from '../../clinical-engine/types';

interface ModuleHModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PatientRecord;
}

type ModuleHTab =
  | 'PATIENT_TAILORED'
  | 'PROPORTIONAL_DOSING'
  | 'BLEEDING_CUTOFFS'
  | 'ISRAELI_ARSENAL'
  | 'SAFETY_MONITORING';

export const ModuleHModal: React.FC<ModuleHModalProps> = ({ isOpen, onClose, record }) => {
  const [activeTab, setActiveTab] = useState<ModuleHTab>('PATIENT_TAILORED');

  const p = record.stage1;
  const straw = useMemo(() => evaluateSTRAWStage(p), [p]);
  const contra = useMemo(() => evaluateContraceptionAndMirena(p), [p]);
  const sym = useMemo(() => summarizeSymptoms(p.symptoms), [p]);
  const prevent = useMemo(() => calculateAhaPreventRisk(p), [p]);
  const vte = useMemo(() => calculateVteRisk(p), [p]);
  const endo = useMemo(() => calculateEndometrialRisk(p), [p]);
  const bone = useMemo(() => calculateBoneRisk(p), [p]);
  const interactions = useMemo(() => checkDrugInteractions(p), [p]);
  const gate = useMemo(() => evaluateCompletenessGate(p), [p]);
  const recs = useMemo(() => formulateTreatment(p), [p]);

  if (!isOpen) return null;

  const chosenOption =
    recs.rankedOptions.find((o) => o.id === record.selectedPlan?.selectedPrimaryOptionId) ||
    recs.rankedOptions[0];

  const isContinuous = recs.regimenType === 'CONTINUOUS_COMBINED';
  const hasUterus = !p.hadHysterectomy || p.medicalHistory.hadEndometriosis;

  // פנינים קליניות דינמיות לפי התסמינים והמאפיינים של המטופלת הספציפית
  const tailoredPearls: string[] = [];
  if (sym.hasSignificantSleepIssue) {
    tailoredPearls.push(
      'הפרעות שינה בולטות אצל מטופלת זו: אם נבחר MHT עם רחם שמור (וללא אלרגיית בוטנים/סויה) – נטילת Utrogestan בערב משפרת שינה דרך מטבוליטים גאבארגיים; במסלול לא-הורמונלי שקלי Lynkuet 120mg בערב או Gabapentin לילי + CBT-I.'
    );
  }
  if (sym.hasSignificantMoodOrFog) {
    tailoredPearls.push(
      'ערפול מוחי (Brain Fog) ותנודות מצב רוח: מתן אסטרדיול עורי יציב (במיוחד בפרי-מנופאוזה) מפחית תנודות חדות; חשוב לוודא פריטין ≥30 ng/mL, ויטמין B12 ו-TSH תקין, ולהדגיש ש-MHT אינו מותווה למניעת דמנציה בגיל מבוגר אך משפר תפקוד קוגניטיבי משני לשינה וגלי חום.'
    );
  }
  if (sym.hasSignificantGsm) {
    tailoredPearls.push(
      'תסמיני GSM פעילים (יובש/צריבה/שתן): עד 20%–25% מהנשים הנוטלות MHT סיסטמי עדיין זקוקות לתוספת אסטרוגן נרתיקי מקומי! אין צורך בתוספת פרוגסטוגן עבור אסטרוגן נרתיקי.'
    );
  }
  if (sym.hasSignificantHsdd) {
    tailoredPearls.push(
      'ירידה בתשוקה המינית (HSDD): אסטרוגן פומי מעלה SHBG ומוריד טסטוסטרון חופשי – לכן במטופלת זו מתן אסטרדיול עורי עדיף משמעותית, ולאחר תיקון יובש נרתיקי ניתן לשקול ניסיון של 3–6 חודשים בטסטוסטרון עורי במינון נשי (~5 מ"ג/יום) עם ניטור רמות.'
    );
  }
  if (p.familyHistory.brcaStatus === 'BRCA1' || p.familyHistory.brcaStatus === 'BRCA2') {
    tailoredPearls.push(
      `נשאית ${p.familyHistory.brcaStatus}: בהיעדר היסטוריה אישית של סרטן שד, לאחר כריתת שחלות מניעתית (RRSO) מומלץ לתת MHT עד גיל המנופאוזה הטבעי (~51) – עדיפות לאסטרוגן בלבד אם עברה גם כריתת רחם.`
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-right">
        {/* כותרת דינמית עם פרטי המטופלת */}
        <div className="bg-gradient-to-l from-rose-800 via-rose-700 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                מודול H לרופא/ה – תדריך קליני מותאם אישית למטופלת
              </h2>
              <p className="text-xs text-rose-100">
                מותאם בזמן אמת עבור: <strong>{p.fullName || 'מטופלת נוכחית'}</strong> (גיל {p.age}, BMI {p.bmi},{' '}
                {straw.code})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* לשוניות מודול H */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap gap-1.5 text-xs font-bold shrink-0">
          {[
            { id: 'PATIENT_TAILORED', label: '🎯 סינתזה מותאמת למטופלת הנוכחית', icon: UserCheck },
            { id: 'PROPORTIONAL_DOSING', label: '⚖ התאמת מינון אסטרוגן–פרוגסטוגן', icon: Scale },
            { id: 'BLEEDING_CUTOFFS', label: '🩸 ספי TVS וניהול דימומים (BMS 2024)', icon: ShieldAlert },
            { id: 'ISRAELI_ARSENAL', label: '💊 תכשירים בישראל (מודגש למטופלת)', icon: Pill },
            { id: 'SAFETY_MONITORING', label: '🛡 אינטראקציות, ויוזה וטסטוסטרון', icon: HeartPulse }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ModuleHTab)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition ${
                  active
                    ? 'bg-white text-rose-800 shadow-sm border border-rose-200'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* גוף המודאל */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* ================================================================= */}
          {/* לשונית 1: סינתזה דינמית מלאה המותאמת לנתוני המטופלת הפעילה! */}
          {/* ================================================================= */}
          {activeTab === 'PATIENT_TAILORED' && (
            <div className="space-y-4">
              {/* שורה עליונה: 3 כרטיסי מפתח של המטופלת */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1.5">
                  <div className="font-extrabold text-teal-950 text-sm">שלב אנדוקריני ואמצעי מניעה</div>
                  <div className="font-bold text-teal-800">{straw.hebrewName}</div>
                  <p className="text-slate-700">{straw.fshNote}</p>
                  <p className="text-teal-900 font-semibold pt-1 border-t border-teal-200/70">
                    {contra.contraceptionRuleHebrew}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                  <div className="font-extrabold text-indigo-950 text-sm">ריבוד סיכונים מחושב למטופלת</div>
                  <div>
                    <strong>PREVENT CV: </strong>
                    {prevent.hasCompleteLabInputs
                      ? `10y Total CVD ${prevent.risk10YearTotalCvd}% | ASCVD ${prevent.risk10YearAscvd}%${
                          prevent.risk30YearTotalCvd !== undefined ? ` | 30y ${prevent.risk30YearTotalCvd}%` : ''
                        }`
                      : prevent.inapplicableReason || 'חסרים ליפידים/eGFR לחישוב מלא'}
                  </div>
                  <div>
                    <strong>סיכון VTE: </strong>
                    <span>{vte.mandatoryTransdermal ? `גבוה/מחייב עורי (${vte.factors.join(', ')})` : 'נמוך'}</span>
                  </div>
                  <div>
                    <strong>רירית הרחם (BMS): </strong>
                    <span>
                      {p.hadHysterectomy
                        ? 'ללא רחם'
                        : endo.riskTier === 'HIGH'
                        ? `סיכון מוגבר (${[...endo.majorFactors, ...endo.minorFactors].join(', ')})`
                        : 'סיכון בסיסי תקין'}
                    </span>
                  </div>
                  <div>
                    <strong>עצם (DXA/FRAX): </strong>
                    <span>{bone.riskTier === 'LOW' ? 'רגיל' : `${bone.riskTier} (${bone.triggers.join(', ')})`}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                  <div className="font-extrabold text-rose-950 text-sm">אסטרטגיה ואופציה מובילה עבור {p.fullName || 'המטופלת'}</div>
                  <div className="font-bold text-rose-900">{recs.regimenHebrewTitle}</div>
                  {chosenOption && (
                    <div className="bg-white/90 p-2 rounded-xl border border-rose-200">
                      <div className="font-bold text-slate-900">{chosenOption.titleHebrew}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {chosenOption.israeliProductsSummary.primaryAgent}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* התראות אינטראקציות והתוויות נגד פעילות אצל מטופלת זו */}
              {(gate.contraindicationNotices.length > 0 || interactions.length > 0) && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2">
                  <div className="font-extrabold text-amber-950 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>נקודות בטיחות קריטיות שזוהו בתיק של {p.fullName || 'המטופלת'}:</span>
                  </div>
                  {gate.contraindicationNotices.map((c, i) => (
                    <p key={`ci_${i}`} className="text-rose-900 font-semibold">
                      • {c}
                    </p>
                  ))}
                  {interactions.map((al) => (
                    <p key={al.id} className="text-slate-800">
                      • <strong>{al.drugName}:</strong> {al.clinicalAction}
                    </p>
                  ))}
                </div>
              )}

              {/* פנינים קליניות מותאמות לתסמינים שדורגו על ידי המטופלת */}
              {tailoredPearls.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>דגשים קליניים ממוקדים לתסמינים המובילים של המטופלת:</span>
                  </div>
                  {tailoredPearls.map((pearl, idx) => (
                    <p key={idx} className="text-slate-700 leading-relaxed">
                      ✓ {pearl}
                    </p>
                  ))}
                </div>
              )}

              {/* השלמות סל הבריאות ומעקב מותאם אישית */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-extrabold text-slate-900 text-sm">
                    בדיקות סקר ומניעה הרלוונטיות לגילה ({p.age}) ולמוצאה:
                  </div>
                  {gate.basketRecommendations.length > 0 ? (
                    gate.basketRecommendations.map((b, i) => (
                      <p key={i} className="text-slate-700">
                        • {b}
                      </p>
                    ))
                  ) : (
                    <p className="text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>כל בדיקות הסקר הרלוונטיות לגיל המטופלת מעודכנות ותקינות!</span>
                    </p>
                  )}
                  {prevent.hasCompleteLabInputs && (
                    <>
                      <p className="text-slate-700 pt-1">• {prevent.bp2025GuidanceHebrew}</p>
                      <p className="text-slate-700">• {prevent.statin2026GuidanceHebrew}</p>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-extrabold text-slate-900 text-sm">פרוטוקול ניטור לטיפול שנבחר לה:</div>
                  <p className="text-slate-700">
                    • ביקור מעקב ראשון בעוד <strong>3 חודשים</strong>: הערכת שינוי בשאלון IMS (19 פריטים), מדידת ל"ד ומשקל, תופעות לוואי והיענות.
                  </p>
                  {chosenOption?.id.includes('nk3') ? (
                    <p className="text-indigo-900 font-bold">
                      • מטופלת על ויוזה / לינקואט: חובה בדיקת ALT, AST ובילירובין בבסיס ובחודשים 1, 2, 3, 6 ו-9!
                    </p>
                  ) : hasUterus && !gate.systemicMhtContraindicated ? (
                    <p className="text-slate-700">
                      • רחם שמור תחת MHT: הכתמות קלות מותרות ב-{endo.riskTier === 'HIGH' ? 'אפס המתנה – בסיכון אנדומטריאלי גבוה לבצע TVS בכל דימום!' : '6 החודשים הראשונים; סף רירית תקין ב-TVS הוא ' + (isContinuous ? '≤4 מ"מ (רציף)' : '≤7 מ"מ (סדרתי)')}.
                    </p>
                  ) : null}
                  {record.selectedPlan?.includeTestosterone && (
                    <p className="text-rose-900 font-semibold">
                      • משולב טסטוסטרון עורי: לבדוק Total Testosterone בדם בבסיס, כעבור 3–6 שבועות וכל 6–12 חודשים.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* לשונית 2: טבלת התאמת מינון פרופורציונלי אסטרוגן–פרוגסטוגן (השורה של המטופלת מודגשת!) */}
          {/* ================================================================= */}
          {activeTab === 'PROPORTIONAL_DOSING' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 font-medium">
                <strong>חוק הפרופורציונליות (BMS 2024):</strong> כאשר עולים במינון האסטרדיול (למשל במטופלות צעירות/POI או בשל ספיגה חלקית),{' '}
                <strong>חובה להעלות במקביל את מינון הפרוגסטוגן הסיסטמי</strong> להגנה מלאה על רירית הרחם (התקן מירנה 52 מ"ג בתוקף ≤5 שנים מכסה את כל מדרגות המינון!). השורה המודגשת בירוק מתאימה למדרגת המינון המחושבת של{' '}
                <strong>{p.fullName || 'המטופלת'}</strong> ({recs.estrogenDoseTier}).
              </div>

              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2.5">מדרגת מינון אסטרוגן</th>
                    <th className="p-2.5">שווה-ערך בתכשירים בישראל</th>
                    <th className="p-2.5">אוטרוגסטן רציף (ccHRT)</th>
                    <th className="p-2.5">אוטרוגסטן ציקלי (sHRT)</th>
                    <th className="p-2.5">חלופה: דופסטון / מירנה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    {
                      tier: 'LOW',
                      name: 'אולטרה-נמוך / נמוך (גיל ≥60 או רגישות)',
                      e2: 'Estrogel לחיצה 1 (0.75mg) | Sandrena 0.5mg | Evorel 25 | Estrofem 1mg (או 0.5mg ב-Femoston Conti 0.5/2.5 / Eviana)',
                      cc: '100 מ"ג כל ערב',
                      seq: '200 מ"ג ל-12–14 יום בחודש',
                      alt: 'Duphaston 5–10mg | מירנה 52 מ"ג (≤5 שנים)'
                    },
                    {
                      tier: 'STANDARD',
                      name: 'תקני (Standard – רוב הנשים בגילאי 45–59)',
                      e2: 'Estrogel 2 לחיצות (1.5mg) | Sandrena 1mg | Evorel 50 | Estrofem 1–2mg / Progynova 2mg',
                      cc: '100 מ"ג כל ערב',
                      seq: '200 מ"ג ל-12–14 יום בחודש',
                      alt: 'Duphaston 10mg | מירנה 52 מ"ג (≤5 שנים)'
                    },
                    {
                      tier: 'MODERATE_HIGH_PHYSIOLOGIC',
                      name: 'בינוני–גבוה פיזיולוגי (POI / מנופאוזה מוקדמת <45 / תת-ספיגה)',
                      e2: 'Estrogel 3–4 לחיצות (2.25–3.0mg) | Evorel 75–100 | Estrofem 2mg+',
                      cc: '200 מ"ג כל ערב (חובה להכפיל!)',
                      seq: '300 מ"ג ל-12 יום בחודש (חובה להעלות!)',
                      alt: 'מירנה 52 מ"ג מומלצת במיוחד! (או Duphaston 10–20mg)'
                    }
                  ].map((row) => {
                    const isPatientTier = recs.estrogenDoseTier === row.tier;
                    return (
                      <tr
                        key={row.tier}
                        className={isPatientTier ? 'bg-emerald-50 font-semibold ring-2 ring-emerald-400' : 'bg-white'}
                      >
                        <td className="p-3 font-bold">
                          {row.name}
                          {isPatientTier && (
                            <span className="block text-[10px] text-emerald-700 mt-0.5">
                              ★ המדרגה המומלצת למטופלת הנוכחית
                            </span>
                          )}
                        </td>
                        <td className="p-3">{row.e2}</td>
                        <td className="p-3">{row.cc}</td>
                        <td className="p-3">{row.seq}</td>
                        <td className="p-3">{row.alt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ================================================================= */}
          {/* לשונית 3: ספי TVS וניהול דימומים (BMS 2024) עם הדגשת המטופלת */}
          {/* ================================================================= */}
          {activeTab === 'BLEEDING_CUTOFFS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="font-bold text-rose-950 mb-1">
                  סטטוס רירית הרחם של {p.fullName || 'המטופלת'}:{' '}
                  {p.hadHysterectomy
                    ? 'עברה כריתת רחם'
                    : endo.riskTier === 'HIGH'
                    ? `סיכון אנדומטריאלי מוגבר (${[...endo.majorFactors, ...endo.minorFactors].join(', ')})`
                    : 'סיכון אנדומטריאלי בסיסי נמוך'}
                </div>
                {!p.hadHysterectomy && (
                  <p className="text-slate-700">
                    עבור המשטר שלה ({isContinuous ? 'רציף ccHRT' : 'סדרתי sHRT'}), סף עובי הרירית התקין ב-TVS הוא:{' '}
                    <strong className="text-rose-800">{isContinuous ? '≤ 4 מ"מ' : '≤ 7 מ"מ'}</strong>.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-extrabold text-slate-900">גורמי סיכון לפי BMS 2024 (מתי לשלוח ל-TVS מיד ללא המתנת 6 חודשים):</div>
                  <p>
                    <strong>גורמים מז׳וריים (מספיק ≥1):</strong> BMI ≥ 40, תסמונת לינץ׳, היפרפלזיה אטיפית בעבר, משטר ציקלי (sHRT) מעל 5 שנים באישה מעל גיל 45, אסטרוגן ללא הגנה מספקת (כגון מירנה מעל 5 שנים או Kyleena/POP), או טמוקסיפן.
                  </p>
                  <p>
                    <strong>גורמים מינוריים (מצטברים ≥2):</strong> BMI 30–39.9, סוכרת / תנגודת לאינסולין, PCOS / אל-ביוץ כרוני.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-extrabold text-slate-900">ערכי הסף ב-TVS והמשך ניהול (ד"ר מרב פרייברג / BMS):</div>
                  <p>• <strong>תחת משטר רציף (ccHRT):</strong> רירית <strong>≤ 4 מ"מ</strong> היא תקינה; מעל 4 מ"מ מחייב דגימת פיפל והיסטרוסקופיה!</p>
                  <p>• <strong>תחת משטר סדרתי (sHRT):</strong> רירית <strong>≤ 7 מ"מ</strong> (מיד לאחר דמם הגמילה) תקינה; מעל 7 מ"מ מחייב פיפל והיסטרוסקופיה!</p>
                  <p>• <strong>מבחן הפסקה ל-4 שבועות:</strong> אם הרירית תקינה והדימום מציק – ניתן להפסיק HRT ל-4 שבועות; אם פסק הדימום אין צורך בבירור פולשני נוסף.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* לשונית 4: ארסנל התכשירים בישראל עם הדגשת הבחירה של המטופלת */}
          {/* ================================================================= */}
          {activeTab === 'ISRAELI_ARSENAL' && (
            <div className="space-y-2">
              {ISRAELI_DRUG_ARSENAL.map((d) => {
                const relevantToChosen =
                  chosenOption &&
                  (chosenOption.israeliProductsSummary.primaryAgent
                    .toLowerCase()
                    .includes(d.brandName.split(' ')[0].toLowerCase()) ||
                    (chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor || '')
                      .toLowerCase()
                      .includes(d.brandName.split(' ')[0].toLowerCase()));

                return (
                  <div
                    key={d.id}
                    className={`p-3 rounded-xl border ${
                      relevantToChosen
                        ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900">
                        {d.hebrewName} <span className="text-teal-700">({d.brandName})</span>
                      </div>
                      {relevantToChosen && (
                        <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                          כלול באופציה שנבחרה למטופלת
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 mt-1">
                      <strong>מינון:</strong> {d.dosingSchedule}
                    </p>
                    <p className="text-rose-900 mt-0.5">
                      <strong>דגשים:</strong> {d.cautionsAndContraindications}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================================================= */}
          {/* לשונית 5: אינטראקציות, פרוטוקול כבד בויוזה וטסטוסטרון נשי */}
          {/* ================================================================= */}
          {activeTab === 'SAFETY_MONITORING' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="font-extrabold text-indigo-950 text-sm">
                  פרוטוקול ניטור תפקודי כבד בויוזה (Veoza 45mg) – אזהרת EMA / משרד הבריאות 2025
                </div>
                <p>1. <strong>לפני התחלת טיפול:</strong> לבדוק ALT, AST, ALP ובילירובין (כללי וישיר). אין להתחיל אם ALT או AST ≥ 2x ULN או בילירובין מוגבר!</p>
                <p>2. <strong>לוח זמנים לבדיקות דם חוזרות:</strong> מדי חודש ב-3 החודשים הראשונים (<strong>חודש 1, חודש 2, חודש 3</strong>), ולאחר מכן ב<strong>חודש 6 ובחודש 9</strong>.</p>
                <p>3. <strong>הפסקה מיידית:</strong> אם ALT/AST עולים מעל 3x ULN עם בילירובין &gt;2x ULN או תסמינים (עייפות קשה, בחילה, גרד, צהבת, שתן כהה), או אם הטרנסאמינזות &gt;5x ULN גם ללא תסמינים.</p>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2">
                <div className="font-extrabold text-teal-950 text-sm">
                  פרוטוקול מתן טסטוסטרון עורי לאישה (HSDD)
                </div>
                <p>1. <strong>תנאי קדם:</strong> לוודא שהמטופלת על אסטרוגן עורי (אסטרוגן פומי מעלה SHBG ומנטרל טסטוסטרון חופשי!) ושטופל כל יובש/כאב נרתיקי (GSM).</p>
                <p>2. <strong>מינון נשי:</strong> כ-5 מ"ג ליום של ג׳ל טסטוסטרון 1% (שקית AndroGel 50mg מחולקת ל-8–10 ימים = טיפה בגודל אפונה על הירך החיצונית/שוק).</p>
                <p>3. <strong>מעקב מעבדה:</strong> Total Testosterone בבסיס, כעבור 3–6 שבועות וכל 6–12 חודשים (יעד: לא לחרוג מהגבול העליון הפיזיולוגי הנשי). הפסקה אם אין תועלת לאחר 6 חודשים.</p>
              </div>

              <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-extrabold text-slate-900 text-sm">תזכורת מהירה ל-5 מלכודות אינטראקציה נפוצות במרפאה:</div>
                <p>• <strong>זריקות GLP-1 (אוזמפיק/וויגובי/מונג׳רו):</strong> מפחיתות ספיגת פרוגסטוגן פומי ← להעדיף מירנה או מדבקה משולבת (או לתגבר פרוגסטוגן ל-4 שבועות סביב עליית מינון).</p>
                <p>• <strong>למוטריג׳ין (Lamictal):</strong> אסטרוגן פומי מפיל רמות למוטריג׳ין ב-50% ← מתן עורי בלבד!</p>
                <p>• <strong>טמוקסיפן + SSRI:</strong> איסור מוחלט על Paroxetine ו-Fluoxetine (עיכוב CYP2D6) ← לתת Venlafaxine או Escitalopram!</p>
                <p>• <strong>אלרגיה לבוטנים / סויה:</strong> אוטרוגסטן אסור לחלוטין (לציטין סויה) ← לתת Duphaston או מירנה!</p>
                <p>• <strong>אלטרוקסין ו-TSH מדוכא (&lt;0.4):</strong> מינון-יתר של תירוקסין מחקה גלי חום, דפיקות לב ונדודי שינה; אסטרוגן עורי אינו משנה TBG!</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-6 py-2 rounded-xl"
          >
            סגור מודול H
          </button>
        </div>
      </div>
    </div>
  );
};
