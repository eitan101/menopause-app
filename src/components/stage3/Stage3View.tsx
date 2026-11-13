import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Activity,
  HeartPulse,
  TrendingDown,
  ChevronDown,
  Copy,
  Check,
  RotateCcw,
  FileCheck
} from 'lucide-react';
import { Stage1Data, Stage2Recommendations, LongitudinalVisit } from '../../clinical-engine/types';
import { evaluateBleeding } from '../../clinical-engine/bleedingAlgorithm';
import { solveSideEffects } from '../../clinical-engine/sideEffectEngine';

interface Stage3ViewProps {
  stage1Data: Stage1Data;
  stage2Recs?: Stage2Recommendations;
  visits: LongitudinalVisit[];
  onAddVisit: (visit: LongitudinalVisit) => void;
}

export const Stage3View: React.FC<Stage3ViewProps> = ({
  stage1Data,
  stage2Recs,
  visits,
  onAddVisit
}) => {
  // נתוני הטופס למפגש המעקב הנוכחי
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthsSinceStart, setMonthsSinceStart] = useState(3);
  const [vmsChange, setVmsChange] = useState<'RESOLVED' | 'IMPROVED' | 'NO_CHANGE' | 'WORSENED'>('IMPROVED');
  const [gsmChange, setGsmChange] = useState<'RESOLVED' | 'IMPROVED' | 'NO_CHANGE' | 'WORSENED'>('IMPROVED');
  const [moodChange, setMoodChange] = useState<'RESOLVED' | 'IMPROVED' | 'NO_CHANGE' | 'WORSENED'>('IMPROVED');

  const [hasMastalgia, setHasMastalgia] = useState(false);
  const [hasDrowsiness, setHasDrowsiness] = useState(false);
  const [hasMoodOrAcne, setHasMoodOrAcne] = useState(false);
  const [hasNauseaOrBloat, setHasNauseaOrBloat] = useState(false);

  const [hasBleeding, setHasBleeding] = useState(false);
  const [isHeavyOrProlonged, setIsHeavyOrProlonged] = useState(false);
  const [hasRecentDoseChange, setHasRecentDoseChange] = useState(false);
  const [tvsThicknessMm, setTvsThicknessMm] = useState<number | undefined>(undefined);

  const [newlyStartedGlp1, setNewlyStartedGlp1] = useState(false);
  const [wantsCessation, setWantsCessation] = useState(false);
  const [notes, setNotes] = useState('');

  const [copiedEmr, setCopiedEmr] = useState(false);

  // מנועי החלטה קליניים
  const bleedingResult = evaluateBleeding({
    hasBleeding,
    monthsOnTreatment: monthsSinceStart,
    hasRecentDoseChangeIn3Months: hasRecentDoseChange,
    isHeavyOrProlonged,
    regimenType: (stage2Recs?.regimenType as any) || 'CONTINUOUS_COMBINED',
    isHighEndometrialRisk: stage1Data.bmi >= 40 || stage1Data.lynchSyndrome,
    tvsThicknessMm
  });

  const sideEffectsResult = solveSideEffects({
    hasMastalgia,
    hasDrowsiness,
    hasMoodOrAcne,
    hasNauseaOrBloat,
    wantsCessation
  });

  const handleSaveVisit = () => {
    const newVisit: LongitudinalVisit = {
      visitId: `visit-${Date.now()}`,
      visitDate,
      monthsSinceStart,
      currentRegimen: stage2Recs?.regimenHebrewTitle || 'משטר HRT',
      currentEstrogenDose: stage2Recs?.estrogenOption?.dosage || '',
      currentProgestogenDose: stage2Recs?.progestogenOption?.dosage || '',
      symptomVmsChange: vmsChange,
      symptomGsmChange: gsmChange,
      symptomMoodChange: moodChange,
      sideEffectMastalgia: hasMastalgia,
      sideEffectDrowsiness: hasDrowsiness,
      sideEffectMoodOrAcne: hasMoodOrAcne,
      sideEffectNauseaOrBloat: hasNauseaOrBloat,
      hasNewBleeding: hasBleeding,
      isBleedingHeavyOrProlonged: isHeavyOrProlonged,
      isWithinFirst6Months: monthsSinceStart <= 6,
      hasRecentDoseChangeIn3Months: hasRecentDoseChange,
      newlyStartedGlp1,
      urgentTvsIndicated: bleedingResult.urgentTvsRequired,
      tvsReason: bleedingResult.categoryTitleHebrew,
      recommendedAction: bleedingResult.regimenAdjustmentRecommendations[0] || 'המשך טיפול',
      sideEffectPlan: sideEffectsResult.actionPointsHebrew,
      cessationRecommended: wantsCessation,
      cessationPlan: sideEffectsResult.cessationProtocolHebrew,
      visitSummaryNotes: notes || bleedingResult.clinicalExplanationHebrew
    };

    onAddVisit(newVisit);
    alert('ביקור המעקב תועד בהצלחה ונשמר בציר הזמן האורכי של המטופלת!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* כותרת שלב 3 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              שלב 3 מתוך 3
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              מעקב אורכי, פתרון בעיות ושינוי/הפסקת טיפול (Longitudinal Care)
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            מעקב דינמי ורב-מפגשי לאורך חודשים ושנים: הערכת שיפור בתסמינים, ניהול דימומים לפי עץ דר' פרייברג ו-BMS, ופתרון תופעות לוואי.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl font-medium border border-slate-200">
            מפגשים שתועדו: <strong className="text-teal-900">{visits.length}</strong>
          </span>
        </div>
      </div>

      {/* היסטוריית ציר זמן רפואי מצטבר (Timestamped Longitudinal Care Timeline) */}
      {visits.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">ציר זמן ביקורי מעקב קודמים</h3>
          </div>

          <div className="space-y-3">
            {visits.map((v, i) => (
              <div key={v.visitId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900">ביקור בתאריך: {v.visitDate}</span>
                    <span className="text-xs text-slate-500 font-medium">({v.monthsSinceStart} חודשים על טיפול)</span>
                  </div>
                  {v.urgentTvsIndicated && (
                    <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-300">
                      הופנתה ל-TVS דחוף
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-500">תגובת VMS: </span>
                    <span className="font-semibold text-slate-800">{v.symptomVmsChange}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">GSM: </span>
                    <span className="font-semibold text-slate-800">{v.symptomGsmChange}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">דימום: </span>
                    <span className="font-semibold text-slate-800">{v.hasNewBleeding ? 'יש דימום' : 'שקט'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">פעולה: </span>
                    <span className="font-semibold text-teal-800">{v.recommendedAction}</span>
                  </div>
                </div>

                {v.visitSummaryNotes && (
                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    {v.visitSummaryNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* טופס רישום מפגש מעקב חדש */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <PlusCircle className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">רישום ביקור מעקב חדש / פתרון תלונות</h3>
        </div>

        {/* מועד וותק טיפול */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">תאריך ביקור מעקב</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">משך זמן מאז התחלת הטיפול (חודשים)</label>
            <input
              type="number"
              value={monthsSinceStart}
              onChange={(e) => setMonthsSinceStart(parseInt(e.target.value) || 0)}
              className="w-full p-2 border rounded-lg font-bold text-teal-900"
            />
          </div>
        </div>

        {/* הערכת שינוי בתסמינים */}
        <div className="space-y-3 text-xs bg-teal-50/40 p-4 rounded-xl border border-teal-100">
          <h4 className="font-bold text-teal-950 text-sm">1. הערכת שינוי בתסמינים תחת הטיפול</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">תסמינים וזומוטוריים (VMS - גלי חום):</label>
              <select
                value={vmsChange}
                onChange={(e) => setVmsChange(e.target.value as any)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="RESOLVED">חלפו לחלוטין (ריפוי מלא)</option>
                <option value="IMPROVED">שיפור משמעותי</option>
                <option value="NO_CHANGE">ללא שינוי מספק</option>
                <option value="WORSENED">החמרה</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">תסמיני GSM (יובש / כאבים ביחסים):</label>
              <select
                value={gsmChange}
                onChange={(e) => setGsmChange(e.target.value as any)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="RESOLVED">החלמה מלאה</option>
                <option value="IMPROVED">שיפור מסוים</option>
                <option value="NO_CHANGE">ללא שינוי</option>
                <option value="WORSENED">החמרה</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">מצב רוח, שינה וערפול מוחי:</label>
              <select
                value={moodChange}
                onChange={(e) => setMoodChange(e.target.value as any)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="RESOLVED">שינה טובה ומצב רוח יציב</option>
                <option value="IMPROVED">שיפור</option>
                <option value="NO_CHANGE">ללא הטבה</option>
                <option value="WORSENED">החמרה</option>
              </select>
            </div>
          </div>
        </div>

        {/* מנוע ניהול דימומים תחת HRT (דר' מרב פרייברג & BMS 2024) */}
        <div className="space-y-3 text-xs bg-rose-50/40 p-4 rounded-xl border border-rose-100">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-rose-950 text-sm">2. מעקב דימומים בלתי סדירים (אלגוריתם דר' פרייברג & BMS)</h4>
            <span className="text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
              עץ החלטה TVS וביופסיה
            </span>
          </div>

          <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-rose-200 cursor-pointer">
            <input
              type="checkbox"
              checked={hasBleeding}
              onChange={(e) => setHasBleeding(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <span className="font-bold text-rose-950">
              הופיע דימום חדש / הכתמות בלתי סדירות מאז הביקור הקודם
            </span>
          </label>

          {hasBleeding && (
            <div className="p-3 bg-white rounded-xl border border-rose-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHeavyOrProlonged}
                    onChange={(e) => setIsHeavyOrProlonged(e.target.checked)}
                    className="rounded text-rose-600"
                  />
                  <span>דימום כבד או ממושך (מעל מספר ימים רצופים)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasRecentDoseChange}
                    onChange={(e) => setHasRecentDoseChange(e.target.checked)}
                    className="rounded text-rose-600"
                  />
                  <span>בוצע שינוי מינון ב-3 החודשים האחרונים</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  עובי רירית הרחם ב-TVS (מ"מ - אם בוצע אולטרסאונד):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={tvsThicknessMm || ''}
                    onChange={(e) => setTvsThicknessMm(parseFloat(e.target.value) || undefined)}
                    placeholder="למשל 3.5 או 8 מ&quot;מ"
                    className="w-36 p-1.5 border rounded-lg text-xs"
                  />
                  <span className="text-[11px] text-slate-500">
                    סף תקין: ≤4 מ"מ ברציף (ccHRT) | ≤7 מ"מ בסדרתי (sHRT)
                  </span>
                </div>
              </div>

              {/* קופסת פלט של מנוע הדימומים */}
              <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                bleedingResult.biopsyRequired
                  ? 'bg-rose-100/90 border-rose-400 text-rose-950'
                  : bleedingResult.urgentTvsRequired
                  ? 'bg-amber-100/80 border-amber-300 text-amber-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>קטגוריית טריאז': {bleedingResult.categoryTitleHebrew}</span>
                  {bleedingResult.urgencyTimelineHebrew && (
                    <span className="bg-white/80 px-2 py-0.5 rounded text-[11px] font-extrabold border">
                      {bleedingResult.urgencyTimelineHebrew}
                    </span>
                  )}
                </div>
                <p>{bleedingResult.clinicalExplanationHebrew}</p>
                <div className="pt-1">
                  <span className="font-bold">המלצה לשינוי משטר:</span>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                    {bleedingResult.regimenAdjustmentRecommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* מנוע פתרון תופעות לוואי נוספות */}
        <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-900 text-sm">3. תופעות לוואי ואי-סבילות</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMastalgia}
                onChange={(e) => setHasMastalgia(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>גודש וכאב בחזה</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDrowsiness}
                onChange={(e) => setHasDrowsiness(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>נמנום ועייפות ביום</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasMoodOrAcne}
                onChange={(e) => setHasMoodOrAcne(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>מצב רוח ירוד / אקנה</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNauseaOrBloat}
                onChange={(e) => setHasNauseaOrBloat(e.target.checked)}
                className="rounded text-teal-600"
              />
              <span>בחילות או נפיחות</span>
            </label>
          </div>

          {sideEffectsResult.actionPointsHebrew.length > 0 && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
              <span className="font-bold text-teal-950">המלצות לפתרון תופעות הלוואי:</span>
              <ul className="list-disc list-inside space-y-0.5 text-teal-900">
                {sideEffectsResult.actionPointsHebrew.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* תרחיש הפסקת טיפול או התחלת GLP-1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={newlyStartedGlp1}
              onChange={(e) => setNewlyStartedGlp1(e.target.checked)}
              className="rounded text-purple-600 mt-0.5"
            />
            <div>
              <span className="font-bold text-purple-900 block">המטופלת החלה לאחרונה טיפול ב-GLP-1 (אוזמפיק/מונג'רו)</span>
              <span className="text-[11px] text-slate-600">
                הנחיה: העלאת מינון פרוגסטרון פומי ל-4 שבועות או שקילת התקנת מירנה (52mg IUS) להגנה ריריתית.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
            <input
              type="checkbox"
              checked={wantsCessation}
              onChange={(e) => setWantsCessation(e.target.checked)}
              className="rounded text-slate-700 mt-0.5"
            />
            <div>
              <span className="font-bold text-slate-900 block">רצון או התוויה להפסקת הטיפול (Cessation)</span>
              <span className="text-[11px] text-slate-600">
                הפחתה הדרגתית של המינון על פני 3–6 חודשים למניעת גלי חום חדים חוזרים.
              </span>
            </div>
          </label>
        </div>

        {wantsCessation && sideEffectsResult.cessationProtocolHebrew && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium">
            {sideEffectsResult.cessationProtocolHebrew}
          </div>
        )}

        {/* הערות חופשיות */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">הערות הרופאה לביקור זה</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות קליניות, סיכום שינויים או תוכנית לביקור הבא..."
            className="w-full text-xs p-2.5 border rounded-xl"
          />
        </div>

        {/* כפתור שמירת הביקור */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveVisit}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow transition"
          >
            <FileCheck className="w-4 h-4" />
            <span>תעד ביקור זה בציר הזמן האורכי של המטופלת</span>
          </button>
        </div>
      </div>
    </div>
  );
};
