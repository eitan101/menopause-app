import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  FileCheck2,
  Filter,
  Flame,
  MessageSquarePlus,
  Pill,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2
} from 'lucide-react';
import { getEligibleArsenalForPatient } from '../../clinical-engine/data/drugArsenal';
import { buildStage2PatientInstructions } from '../../clinical-engine/patientInstructionsBuilder';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import {
  PatientRecord,
  SelectedTreatmentPlan,
  Stage1Data,
  TimestampedNote,
  TreatmentOptionCard
} from '../../clinical-engine/types';
import { generateEmrSummary } from '../../services/emrExportService';
import { PatientOutputCard } from '../common/PatientOutputCard';

interface Stage2ViewProps {
  record: PatientRecord;
  stage1Data: Stage1Data;
  selectedPlan?: SelectedTreatmentPlan;
  stage2Notes: TimestampedNote[];
  onSelectPlan: (plan: SelectedTreatmentPlan) => void;
  onAddStage2Note: (text: string) => void;
  onDeleteStage2Note: (id: string) => void;
  onProceedToStage3: () => void;
  onPrintPatientLeaflet: () => void;
}

const RATIONALE_QUICK_CHIPS = [
  'פרופיל בטיחות ווסקולרי/קרישתי מיטבי (עקיפת כבד)',
  'תואם את העדפת המטופלת לצורת המתן (ג׳ל / מדבקה / פומי)',
  'בחירה לא-הורמונלית בשל העדפת המטופלת / התווית נגד',
  'מענה משולב להפרעות שינה (נטילת ערב)',
  'שילוב הגנת רירית + מניעת הריון / שליטה בדימום כבד (מירנה)',
  'הותאם עקב כישלון או אי-סבילות בטיפול עבר',
  'הותאם בשל אינטראקציה תרופתית (GLP-1 / למוטריג׳ין / אלרגיית סויה-בוטנים)'
];

export const Stage2View: React.FC<Stage2ViewProps> = ({
  record,
  stage1Data,
  selectedPlan,
  stage2Notes,
  onSelectPlan,
  onAddStage2Note,
  onDeleteStage2Note,
  onProceedToStage3,
  onPrintPatientLeaflet
}) => {
  const recs = useMemo(() => formulateTreatment(stage1Data), [stage1Data]);
  const eligibleArsenal = useMemo(() => getEligibleArsenalForPatient(stage1Data), [stage1Data]);

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'HORMONAL_SYSTEMIC' | 'NON_HORMONAL_SYSTEMIC'>('ALL');
  const [showAuditReasons, setShowAuditReasons] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [arsenalQuery, setArsenalQuery] = useState('');
  const [copiedEmr, setCopiedEmr] = useState(false);

  // תוכנית פעילה – בחירה מרובה של תוספות מקומיות (selectedGsmOptionIds) וטסטוסטרון מופרד!
  const defaultGsmIds = recs.localGsmOptions.filter((l) => l.recommended).map((l) => l.id);
  const activeOptionId =
    selectedPlan?.selectedPrimaryOptionId &&
    recs.rankedOptions.some((o) => o.id === selectedPlan.selectedPrimaryOptionId)
      ? selectedPlan.selectedPrimaryOptionId
      : recs.rankedOptions[0]?.id || '';

  const currentPlan: SelectedTreatmentPlan = selectedPlan
    ? {
        ...selectedPlan,
        selectedPrimaryOptionId: activeOptionId
      }
    : {
        selectedPrimaryOptionId: activeOptionId,
        selectedGsmOptionIds: defaultGsmIds,
        includeTestosterone: false,
        selectionRationaleTags: [],
        selectionRationaleFreeText: '',
        stage2PatientInstructionsFreeText: '',
        selectedAtIso: new Date().toISOString()
      };

  const chosenOption = recs.rankedOptions.find((o) => o.id === currentPlan.selectedPrimaryOptionId);
  const stage2PatientOutput = useMemo(
    () => buildStage2PatientInstructions(stage1Data, recs, currentPlan),
    [stage1Data, recs, currentPlan]
  );

  const hormonalCount = recs.rankedOptions.filter((o) => o.category === 'HORMONAL_SYSTEMIC').length;
  const nonHormonalCount = recs.rankedOptions.filter((o) => o.category === 'NON_HORMONAL_SYSTEMIC').length;

  const visibleOptions = recs.rankedOptions.filter((opt) =>
    categoryFilter === 'ALL' ? true : opt.category === categoryFilter
  );

  const filteredArsenal = eligibleArsenal.filter(
    (d) =>
      !arsenalQuery.trim() ||
      d.brandName.toLowerCase().includes(arsenalQuery.toLowerCase()) ||
      d.hebrewName.includes(arsenalQuery) ||
      d.activeIngredients.toLowerCase().includes(arsenalQuery.toLowerCase())
  );

  const handleChooseOption = (opt: TreatmentOptionCard) => {
    onSelectPlan({
      ...currentPlan,
      selectedPrimaryOptionId: opt.id,
      selectedAtIso: new Date().toISOString()
    });
  };

  // בחירה מרובה (Multi-Select) של תוספות מקומיות ל-GSM!
  const toggleLocalGsmOption = (gsmId: string) => {
    const exists = currentPlan.selectedGsmOptionIds.includes(gsmId);
    const nextIds = exists
      ? currentPlan.selectedGsmOptionIds.filter((id) => id !== gsmId)
      : [...currentPlan.selectedGsmOptionIds, gsmId];
    onSelectPlan({
      ...currentPlan,
      selectedGsmOptionIds: nextIds,
      selectedAtIso: new Date().toISOString()
    });
  };

  const toggleRationaleChip = (chip: string) => {
    const exists = currentPlan.selectionRationaleTags.includes(chip);
    const nextTags = exists
      ? currentPlan.selectionRationaleTags.filter((t) => t !== chip)
      : [...currentPlan.selectionRationaleTags, chip];
    onSelectPlan({
      ...currentPlan,
      selectionRationaleTags: nextTags,
      selectedAtIso: new Date().toISOString()
    });
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    onAddStage2Note(noteInput.trim());
    setNoteInput('');
  };

  const handleCopyEmr = () => {
    const summary = generateEmrSummary({
      ...record,
      stage2: recs,
      selectedPlan: currentPlan
    });
    navigator.clipboard.writeText(summary);
    setCopiedEmr(true);
    setTimeout(() => setCopiedEmr(false), 2500);
  };

  const badgeStyles: Record<TreatmentOptionCard['suitabilityBadge'], { label: string; cls: string }> = {
    RECOMMENDED_TOP: {
      label: 'מומלץ בעדיפות עליונה למטופלת',
      cls: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    GOOD_ALTERNATIVE: {
      label: 'חלופה טיפולית מתאימה ובטוחה',
      cls: 'bg-teal-50 text-teal-900 border-teal-200'
    },
    CONDITIONAL: {
      label: 'מתאים כעדיפות שנייה',
      cls: 'bg-amber-100 text-amber-900 border-amber-300'
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. כרטיס אסטרטגיה קלינית מותאמת למטופלת */}
      <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-slate-900 text-white rounded-3xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>שלב 2: תרופות מתאימות בלבד למטופלת, השוואת חלופות ותיעוד ההחלטה</span>
            </div>
            <h2 className="text-xl font-extrabold">{recs.regimenHebrewTitle}</h2>
            <p className="text-xs text-teal-100 leading-relaxed max-w-4xl">
              <strong>מדרגת מינון והגנה פרופורציונלית:</strong> {recs.estrogenDoseTierReasonHebrew}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {recs.routeRationale.map((r, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-black/25 border border-white/15 px-2.5 py-1 rounded-lg text-teal-50"
                >
                  • {r}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyEmr}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition"
            >
              {copiedEmr ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedEmr ? 'הועתק לרשומה!' : 'העתק סיכום ל-EMR'}</span>
            </button>
            <button
              type="button"
              onClick={onPrintPatientLeaflet}
              className="flex items-center gap-1.5 bg-white text-teal-900 hover:bg-teal-50 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>הדפס דף הנחיות למטופלת</span>
            </button>
          </div>
        </div>

        {/* חיווי שקיפות על סינון אוטומטי של תרופות שנפסלו בשאלון (ללא הצגתן ככרטיסי טיפול) */}
        {recs.excludedReasonsAudit.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/15 text-xs">
            <button
              type="button"
              onClick={() => setShowAuditReasons(!showAuditReasons)}
              className="flex items-center gap-1.5 text-teal-200 hover:text-white font-semibold"
            >
              {showAuditReasons ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>
                סוננו אוטומטית {recs.excludedReasonsAudit.length} קבוצות/תכשירים שנפסלו עבור מטופלת זו (מוצגות אך ורק תרופות מתאימות)
              </span>
            </button>
            {showAuditReasons && (
              <ul className="mt-2 space-y-1 text-[11px] text-teal-100 bg-black/20 p-3 rounded-xl">
                {recs.excludedReasonsAudit.map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* 2. השוואת אופציות טיפול סיסטמיות מתאימות בלבד */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>אפשרויות טיפול סיסטמיות מתאימות למטופלת (מדורגות לפי התאמה אישית)</span>
            </h3>
            <p className="text-xs text-slate-500">
              תרופות וצירי מתן שנפסלו בשלב איסוף הנתונים או בטיפולי עבר אינם מוצגים ברשימה זו
            </p>
          </div>

          <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                categoryFilter === 'ALL' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              כל המתאימים ({recs.rankedOptions.length})
            </button>
            {hormonalCount > 0 && (
              <button
                type="button"
                onClick={() => setCategoryFilter('HORMONAL_SYSTEMIC')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  categoryFilter === 'HORMONAL_SYSTEMIC'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                הורמונלי סיסטמי ({hormonalCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => setCategoryFilter('NON_HORMONAL_SYSTEMIC')}
              className={`px-3 py-1.5 rounded-lg transition ${
                categoryFilter === 'NON_HORMONAL_SYSTEMIC'
                  ? 'bg-indigo-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              לא-הורמונלי ({nonHormonalCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleOptions.map((opt) => {
            const isSelected = currentPlan.selectedPrimaryOptionId === opt.id;
            const badge = badgeStyles[opt.suitabilityBadge];
            const globalRank = recs.rankedOptions.findIndex((o) => o.id === opt.id) + 1;

            return (
              <div
                key={opt.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition bg-white ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/40 shadow-md'
                    : 'border-slate-200 hover:border-teal-300 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                        דירוג #{globalRank} (התאמה {opt.rankScore}%)
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          opt.category === 'NON_HORMONAL_SYSTEMIC'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {opt.category === 'NON_HORMONAL_SYSTEMIC' ? 'לא-הורמונלי' : opt.routeLabelHebrew}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{opt.titleHebrew}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.subtitleHebrew}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div>
                      <strong className="text-slate-800">תכשיר עיקרי: </strong>
                      <span className="text-slate-700">{opt.israeliProductsSummary.primaryAgent}</span>
                    </div>
                    {opt.israeliProductsSummary.secondaryProgestogenOrMonitor && (
                      <div>
                        <strong className="text-slate-800">הגנת רירית / ניטור נלווה: </strong>
                        <span className="text-teal-900 font-semibold">
                          {opt.israeliProductsSummary.secondaryProgestogenOrMonitor}
                        </span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500">
                      <strong>משטר נטילה:</strong> {opt.israeliProductsSummary.scheduleHebrew}
                    </div>
                  </div>

                  {opt.tailoredMatchReasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 text-[11px] text-teal-950 space-y-1">
                      <div className="font-bold">מדוע מתאים למטופלת זו:</div>
                      {opt.tailoredMatchReasons.map((m, i) => (
                        <p key={i}>✓ {m}</p>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>יתרונות:</span>
                      </div>
                      {opt.prosHebrew.map((p, i) => (
                        <p key={i} className="text-slate-700">
                          • {p}
                        </p>
                      ))}
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50/40 border border-rose-200 space-y-1">
                      <div className="font-bold text-rose-900 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>חסרונות / דגשים:</span>
                      </div>
                      {opt.consHebrew.map((c, i) => (
                        <p key={i} className="text-slate-700">
                          • {c}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {opt.monitoringNotesHebrew ? (
                    <span className="text-[10px] text-slate-500 flex-1">{opt.monitoringNotesHebrew}</span>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    onClick={() => handleChooseOption(opt)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 border border-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSelected ? 'אופציה זו נבחרה כטיפול ✓' : 'בחר באופציה זו'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3א. שילוב טיפול מקומי לתסמונת אורו-גניטלית (GSM) – בחירה מרובה (תכשירי לחות מופרדים מאינטררוזה!) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>טיפול מקומי משלים לתסמונת אורו-גניטלית (GSM – יובש נרתיקי, כאב ביחסים ושתן)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              ניתן לבחור <strong>מספר תוספות מקומיות במקביל</strong> (למשל שילוב אסטרוגן נרתיקי או אינטררוזה יחד עם תכשירי לחות וחומרי סיכה)
            </p>
          </div>
          {currentPlan.selectedGsmOptionIds.length > 0 && (
            <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
              נבחרו {currentPlan.selectedGsmOptionIds.length} תוספות מקומיות
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {recs.localGsmOptions.map((loc) => {
            const active = currentPlan.selectedGsmOptionIds.includes(loc.id);
            return (
              <div
                key={loc.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  active ? 'bg-teal-50/60 border-teal-500 ring-1 ring-teal-400' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{loc.titleHebrew}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          loc.isHormonal
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {loc.isHormonal ? 'הורמונלי מקומי' : 'לא-הורמונלי'}
                      </span>
                      {loc.recommended && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          מומלץ לתסמיניה
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-teal-900 font-semibold">{loc.brandAndDoseHebrew}</p>
                  <p className="text-[11px] text-slate-600">{loc.scheduleHebrew}</p>
                  {loc.prosHebrew.map((pr, i) => (
                    <p key={i} className="text-[11px] text-slate-700">
                      ✓ {pr}
                    </p>
                  ))}
                  {loc.cautionsHebrew.map((c, i) => (
                    <p key={i} className="text-[10px] text-amber-800">
                      • {c}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => toggleLocalGsmOption(loc.id)}
                  className={`mt-3 py-2 px-3 rounded-xl font-bold text-xs border transition ${
                    active
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active ? 'משולב בתוכנית הטיפול ✓ (לחצי להסרה)' : '+ הוסף לתוכנית הטיפול (ניתן לשלב)'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3ב. סקשן מופרד לחלוטין: טיפול בטסטוסטרון עורי נשי עבור HSDD */}
      {recs.testosteroneOption && (
        <section className="bg-white rounded-2xl border border-rose-200 shadow-sm p-5 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  טיפול ייעודי בחשק מיני ירוד הגורם מצוקה (HSDD) – מופרד מהטיפול המקומי ב-GSM
                </h3>
                <p className="text-[11px] text-slate-500">
                  טסטוסטרון סיסטמי עורי במינון נשי פיזיולוגי (בהתאם לקונצנזוס הבינלאומי ו-BMS)
                </p>
              </div>
            </div>
            {recs.testosteroneOption.recommended && (
              <span className="text-[11px] bg-rose-100 text-rose-900 border border-rose-200 px-2.5 py-1 rounded-full font-bold self-start">
                רלוונטי לתלונת ירידה בתשוקה שדווחה בשאלון IMS
              </span>
            )}
          </div>

          <div
            className={`p-4 rounded-2xl border transition ${
              currentPlan.includeTestosterone
                ? 'bg-rose-50/60 border-rose-500 ring-1 ring-rose-400'
                : 'bg-slate-50/70 border-slate-200'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="font-extrabold text-slate-900 text-sm">
                  {recs.testosteroneOption.titleHebrew}
                </div>
                <p className="text-rose-900 font-semibold">{recs.testosteroneOption.brandAndDoseHebrew}</p>
                <p className="text-slate-700">{recs.testosteroneOption.scheduleHebrew}</p>
                <div className="pt-1">
                  <strong className="text-slate-800">תנאי קדם קליניים:</strong>
                  {recs.testosteroneOption.prerequisitesHebrew.map((pre, i) => (
                    <p key={i} className="text-[11px] text-slate-700">
                      • {pre}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                  <strong className="text-slate-800">פרוטוקול ניטור מעבדה מחייב:</strong>
                  {recs.testosteroneOption.monitoringProtocolHebrew.map((m, i) => (
                    <p key={i} className="text-[11px] text-slate-700">
                      • {m}
                    </p>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onSelectPlan({
                      ...currentPlan,
                      includeTestosterone: !currentPlan.includeTestosterone,
                      selectedAtIso: new Date().toISOString()
                    })
                  }
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs border transition ${
                    currentPlan.includeTestosterone
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-rose-900 border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  {currentPlan.includeTestosterone
                    ? 'טסטוסטרון עורי נשי משולב בתוכנית ✓ (לחצי להסרה)'
                    : '+ הוסף טסטוסטרון עורי נשי לתוכנית הטיפול'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. תיעוד האופציה שנבחרה ומדוע + הערות רופא/ה מתוארכות במלל חופשי */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-teal-300 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck2 className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">תיעוד האופציה שנבחרה ומדוע (Shared Decision-Making)</h3>
              <p className="text-[11px] text-slate-500">
                מתעד ברשומה הרפואית איזה טיפול נבחר ומה היו השיקולים הקליניים והעדפת המטופלת
              </p>
            </div>
          </div>

          {chosenOption && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <div className="font-bold text-teal-950">
                האופציה שנבחרה: {chosenOption.titleHebrew} ({chosenOption.routeLabelHebrew})
              </div>
              <div className="text-[11px] text-slate-700 mt-0.5">
                {chosenOption.israeliProductsSummary.primaryAgent}
                {chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor
                  ? ` + ${chosenOption.israeliProductsSummary.secondaryProgestogenOrMonitor}`
                  : ''}
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-2">
              סמן/י נימוקים עיקריים לבחירת האופציה (ניתן לבחור מספר נימוקים):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RATIONALE_QUICK_CHIPS.map((chip) => {
                const active = currentPlan.selectionRationaleTags.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleRationaleChip(chip)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                      active
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {active ? `✓ ${chip}` : chip}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              נימוק חופשי לבחירת הטיפול (מדוע נבחרה אופציה זו?):
            </label>
            <textarea
              rows={2}
              value={currentPlan.selectionRationaleFreeText}
              onChange={(e) =>
                onSelectPlan({
                  ...currentPlan,
                  selectionRationaleFreeText: e.target.value,
                  selectedAtIso: new Date().toISOString()
                })
              }
              placeholder="למשל: הוסברו האפשרויות המתאימות; המטופלת בחרה בג׳ל + אוטרוגסטן בערב בשל הפרעות שינה קשות..."
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
        </section>

        {/* הערות פנימיות לרופא/ה במלל חופשי בשלב 2 כולל תאריך ושעה */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquarePlus className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">יומן הערות לרופא/ה במלל חופשי (כולל תאריך)</h3>
              <p className="text-[11px] text-slate-500">נשמר בתיק המטופלת עם חותמת תאריך ושעה אוטומטית</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="הוסף/י הערה קלינית לתיק הרפואי..."
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition"
            >
              שמור הערה מתוארכת
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stage2Notes.length === 0 ? (
              <p className="text-slate-400 text-center py-4">טרם נוספו הערות מתוארכות בשלב 2.</p>
            ) : (
              stage2Notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 mb-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.createdAtIso).toLocaleString('he-IL')}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{note.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteStage2Note(note.id)}
                    className="text-slate-400 hover:text-rose-600 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 5. פלט הנחיות למטופלת לשלב 2: הנחיות לדרך הטיפול + מלל חופשי מהרופאה */}
      <PatientOutputCard
        output={stage2PatientOutput}
        freeTextValue={currentPlan.stage2PatientInstructionsFreeText || ''}
        onFreeTextChange={(val) =>
          onSelectPlan({
            ...currentPlan,
            stage2PatientInstructionsFreeText: val,
            selectedAtIso: new Date().toISOString()
          })
        }
        onPrint={onPrintPatientLeaflet}
        freeTextPlaceholder="כתבי כאן הנחיות אישיות למטופלת לגבי אופן התחלת הטיפול, טיטרציה או תיאום בדיקות..."
      />

      {/* 6. מדריך התכשירים המתאימים למטופלת בישראל (מסונן מתרופות שנפסלו!) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                טבלת תכשירים ומינונים מתאימים למטופלת בישראל ({filteredArsenal.length} תכשירים מאושרים לפרופיל שלה)
              </h3>
              <p className="text-[11px] text-slate-500">
                תכשירים שנפסלו בשל התוויות נגד, רגישויות, אינטראקציות או כישלון קודם הוסרו אוטומטית מהטבלה
              </p>
            </div>
          </div>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חפש מתוך התכשירים המתאימים..."
              value={arsenalQuery}
              onChange={(e) => setArsenalQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 text-xs border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-2.5 font-bold">שם תכשיר</th>
                <th className="p-2.5 font-bold">הרכב ומינון נטילה</th>
                <th className="p-2.5 font-bold">יתרונות קליניים</th>
                <th className="p-2.5 font-bold">דגשים</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredArsenal.map((drug) => (
                <tr key={drug.id} className="hover:bg-slate-50/80">
                  <td className="p-2.5 align-top font-bold text-slate-900 whitespace-nowrap">
                    <div>{drug.hebrewName}</div>
                    <div className="text-[10px] text-teal-700 font-semibold">{drug.brandName}</div>
                  </td>
                  <td className="p-2.5 align-top text-slate-700">
                    <div className="font-semibold text-slate-800">{drug.activeIngredients}</div>
                    <div className="mt-0.5">{drug.dosingSchedule}</div>
                    {drug.proportionalTierNote && (
                      <div className="mt-1 text-[10px] text-indigo-800 font-semibold">
                        ⚖ {drug.proportionalTierNote}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 align-top text-slate-700">{drug.clinicalAdvantages}</td>
                  <td className="p-2.5 align-top text-slate-600">{drug.cautionsAndContraindications}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* כפתור מעבר לשלב 3 */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onProceedToStage3}
          className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-sm flex items-center gap-2 transition"
        >
          <span>שמור תוכנית נבחרת והמשך לשלב 3: מעקב אורכי ושינוי מינונים</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
