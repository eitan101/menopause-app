import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  Filter,
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
import { ISRAELI_DRUG_ARSENAL } from '../../clinical-engine/data/drugArsenal';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import {
  PatientRecord,
  SelectedTreatmentPlan,
  Stage1Data,
  TimestampedNote,
  TreatmentOptionCard
} from '../../clinical-engine/types';
import { generateEmrSummary } from '../../services/emrExportService';

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

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'HORMONAL_SYSTEMIC' | 'NON_HORMONAL_SYSTEMIC'>('ALL');
  const [noteInput, setNoteInput] = useState('');
  const [arsenalQuery, setArsenalQuery] = useState('');
  const [copiedEmr, setCopiedEmr] = useState(false);

  // תוכנית פעילה (או ברירת מחדל לאופציה המדורגת #1)
  const activeOptionId = selectedPlan?.selectedPrimaryOptionId || recs.rankedOptions[0]?.id || '';
  const currentPlan: SelectedTreatmentPlan = selectedPlan || {
    selectedPrimaryOptionId: activeOptionId,
    selectedGsmOptionId: recs.localAndAdjunctOptions.find((l) => l.domain === 'GSM_VAGINAL' && l.recommended)?.id,
    includeTestosterone: false,
    selectionRationaleTags: [],
    selectionRationaleFreeText: '',
    selectedAtIso: new Date().toISOString()
  };

  const chosenOption = recs.rankedOptions.find((o) => o.id === currentPlan.selectedPrimaryOptionId);

  const visibleOptions = recs.rankedOptions.filter((opt) =>
    categoryFilter === 'ALL' ? true : opt.category === categoryFilter
  );

  const filteredArsenal = ISRAELI_DRUG_ARSENAL.filter(
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
      label: 'חלופה טיפולית מתאימה',
      cls: 'bg-teal-50 text-teal-900 border-teal-200'
    },
    CONDITIONAL: {
      label: 'אפשרי בתנאים מסוימים / קו שני',
      cls: 'bg-amber-100 text-amber-900 border-amber-300'
    },
    CONTRAINDICATED_FOR_PATIENT: {
      label: 'לא מומלץ / התווית נגד למטופלת זו',
      cls: 'bg-rose-100 text-rose-900 border-rose-300'
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
              <span>שלב 2: הגדרת הטיפול, השוואת חלופות ותיעוד ההחלטה המשותפת</span>
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
              <span>דף הדרכה ותיאום ציפיות למטופלת</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. השוואת אופציות טיפול מדורגות (הורמונליות + לא-הורמונליות) עם יתרונות וחסרונות */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>אפשרויות טיפול מדורגות לפי התאמה אישית למטופלת (כולל הורמונלי ולא-הורמונלי)</span>
            </h3>
            <p className="text-xs text-slate-500">
              הדירוג משקלל שלב STRAW+10, חשיבות תסמינים (IMS), סיכוני PREVENT/VTE/רירית, אינטראקציות, העדפות וטיפולי עבר
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
              הכל מדורג ({recs.rankedOptions.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('HORMONAL_SYSTEMIC')}
              className={`px-3 py-1.5 rounded-lg transition ${
                categoryFilter === 'HORMONAL_SYSTEMIC'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              הורמונלי סיסטמי (MHT)
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('NON_HORMONAL_SYSTEMIC')}
              className={`px-3 py-1.5 rounded-lg transition ${
                categoryFilter === 'NON_HORMONAL_SYSTEMIC'
                  ? 'bg-indigo-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              לא-הורמונלי ({recs.rankedOptions.filter((o) => o.category === 'NON_HORMONAL_SYSTEMIC').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleOptions.map((opt, idx) => {
            const isSelected = currentPlan.selectedPrimaryOptionId === opt.id;
            const badge = badgeStyles[opt.suitabilityBadge];
            const globalRank = recs.rankedOptions.findIndex((o) => o.id === opt.id) + 1;

            return (
              <div
                key={opt.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition bg-white ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/40 shadow-md'
                    : opt.suitabilityBadge === 'CONTRAINDICATED_FOR_PATIENT'
                    ? 'border-rose-200 opacity-80'
                    : 'border-slate-200 hover:border-teal-300 shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  {/* כותרת, דירוג ותגית התאמה */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                        דירוג #{globalRank} (ציון {opt.rankScore})
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

                  {/* תכשירים ומינון בישראל */}
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

                  {/* התאמות אישיות ספציפיות למטופלת */}
                  {opt.tailoredMatchReasons.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 text-[11px] text-teal-950 space-y-1">
                      <div className="font-bold">מדוע דורג כך עבור מטופלת זו:</div>
                      {opt.tailoredMatchReasons.map((m, i) => (
                        <p key={i}>✓ {m}</p>
                      ))}
                    </div>
                  )}

                  {/* יתרונות וחסרונות */}
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

                {/* כפתור בחירה באופציה זו */}
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
                    <span>{isSelected ? 'אופציה זו נבחרה כטיפול' : 'בחר באופציה זו'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. טיפולים מקומיים משלימים ל-GSM (יובש/שתן) וטסטוסטרון ל-HSDD */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>שילוב טיפול מקומי ל-GSM (יובש נרתיקי / שתן) וטסטוסטרון ל-HSDD (ניתן לשלב עם כל אופציה לעיל)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {recs.localAndAdjunctOptions.map((loc) => {
            const isGsmSelected =
              loc.domain === 'GSM_VAGINAL' && currentPlan.selectedGsmOptionId === loc.id;
            const isTestoSelected =
              loc.domain === 'HSDD_TESTOSTERONE' && Boolean(currentPlan.includeTestosterone);
            const active = isGsmSelected || isTestoSelected;

            return (
              <div
                key={loc.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  active ? 'bg-teal-50/50 border-teal-500' : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{loc.titleHebrew}</span>
                    {loc.recommended && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        מומלץ לפי תסמינים
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-900 font-semibold">{loc.brandAndDoseHebrew}</p>
                  <p className="text-[11px] text-slate-600">{loc.scheduleHebrew}</p>
                  {loc.cautionsHebrew.map((c, i) => (
                    <p key={i} className="text-[10px] text-amber-800">
                      • {c}
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (loc.domain === 'GSM_VAGINAL') {
                      onSelectPlan({
                        ...currentPlan,
                        selectedGsmOptionId: isGsmSelected ? undefined : loc.id,
                        selectedAtIso: new Date().toISOString()
                      });
                    } else {
                      onSelectPlan({
                        ...currentPlan,
                        includeTestosterone: !isTestoSelected,
                        selectedAtIso: new Date().toISOString()
                      });
                    }
                  }}
                  className={`mt-3 py-1.5 px-3 rounded-lg font-bold text-xs border transition ${
                    active
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {active ? 'משולב בתוכנית הטיפול ✓' : 'שלב בתוכנית הטיפול'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. תיעוד האופציה שנבחרה ומדוע + הערות רופא/ה מתוארכות במלל חופשי */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-teal-300 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck2 className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">תיעוד האופציה שנבחרה ומדוע (Shared Decision-Making)</h3>
              <p className="text-[11px] text-slate-500">
                מתעד בתיק ובסיכום ה-EMR איזה טיפול נבחר ומה היו השיקולים הקליניים והעדפת המטופלת
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
              נימוק חופשי לבחירת הטיפול והתאמות מינון ספציפיות (מדוע נבחרה אופציה זו?):
            </label>
            <textarea
              rows={3}
              value={currentPlan.selectionRationaleFreeText}
              onChange={(e) =>
                onSelectPlan({
                  ...currentPlan,
                  selectionRationaleFreeText: e.target.value,
                  selectedAtIso: new Date().toISOString()
                })
              }
              placeholder="למשל: הוסברו יתרונות וחסרונות פומי מול ג׳ל ומדבקה; המטופלת בחרה בג׳ל אסטרוג׳ל + אוטרוגסטן בערב בשל הפרעות שינה קשות ורצון להימנע מדבק מדבקה..."
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
        </section>

        {/* הערות במלל חופשי בשלב 2 כולל תאריך ושעה */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquarePlus className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">הערות רופא/ה במלל חופשי (כולל תיעוד תאריך)</h3>
              <p className="text-[11px] text-slate-500">כל הערה נשמרת אוטומטית עם חותמת תאריך ושעה מדויקת</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              rows={2}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="הוסף/י הערה קלינית לשלב הגדרת הטיפול..."
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

          <div className="space-y-2 max-h-52 overflow-y-auto">
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

      {/* 5. ארסנל התכשירים המלא בישראל (הורמונלי + לא-הורמונלי + מקומי) לחיפוש מהיר */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">
              מדריך תכשירים ומינונים זמינים בישראל (כולל חוק הפרופורציונליות וניטור כבד בויוזה)
            </h3>
          </div>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חפש תכשיר (למשל ויוזה, אוטרוגסטן, אסטרוג׳ל)..."
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
                <th className="p-2.5 font-bold">דגשים והתוויות נגד</th>
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
                  <td className="p-2.5 align-top text-rose-900/90">{drug.cautionsAndContraindications}</td>
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
