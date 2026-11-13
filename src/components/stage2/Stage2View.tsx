import React, { useState } from 'react';
import {
  Pill,
  Sparkles,
  Shield,
  Copy,
  Printer,
  ArrowLeft,
  ChevronDown,
  Info,
  Check,
  Search,
  ExternalLink
} from 'lucide-react';
import { Stage1Data, Stage2Recommendations } from '../../clinical-engine/types';
import { formulateTreatment } from '../../clinical-engine/treatmentEngine';
import { ISRAELI_DRUG_ARSENAL } from '../../clinical-engine/data/drugArsenal';

interface Stage2ViewProps {
  stage1Data: Stage1Data;
  onProceedToStage3: () => void;
  onPrintPatientLeaflet: () => void;
}

export const Stage2View: React.FC<Stage2ViewProps> = ({
  stage1Data,
  onProceedToStage3,
  onPrintPatientLeaflet
}) => {
  const recommendations = formulateTreatment(stage1Data);
  const [copiedEmr, setCopiedEmr] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArsenal, setShowArsenal] = useState(false);

  const handleCopyEmr = () => {
    navigator.clipboard.writeText(recommendations.emrSummaryText);
    setCopiedEmr(true);
    setTimeout(() => setCopiedEmr(false), 2500);
  };

  const filteredArsenal = ISRAELI_DRUG_ARSENAL.filter(
    (d) =>
      d.brandNameHebrew.includes(searchTerm) ||
      d.brandNameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* כותרת שלב 2 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              שלב 2 מתוך 3
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              הגדרת טיפול והמלצות קליניות (Treatment Formulation)
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            התאמת משטר טיפולי אישי, בחירת תכשירים מאושרים בישראל, ציר מתן עורי/פומי ותיאום ציפיות מובנה.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyEmr}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border shadow-sm transition ${
              copiedEmr
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-teal-800 border-teal-300'
            }`}
          >
            {copiedEmr ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-teal-600" />}
            <span>{copiedEmr ? 'הועתק לתיק בהצלחה!' : 'העתק לתיק רפואי (EMR)'}</span>
          </button>

          <button
            onClick={onPrintPatientLeaflet}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>הדפס דף למטופלת</span>
          </button>
        </div>
      </div>

      {/* כרטיסיות ראשיות: משטר וציר מתן */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* כרטיס משטר הטיפול */}
        <div className="bg-gradient-to-br from-teal-50/60 to-white rounded-2xl p-5 border border-teal-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">משטר הטיפול הנבחר</span>
            <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-semibold">
              לפי סטטוס רחם ו-STRAW+10
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-teal-950">
            {recommendations.regimenHebrewTitle}
          </h3>

          <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-teal-100">
            {recommendations.regimenType === 'ESTROGEN_ONLY' && (
              <p>במטופלת לאחר כריתת רחם ללא היסטוריה של אנדומטריוזיס: אסטרוגן בלבד בטוח לחלוטין ואינו דורש תוספת פרוגסטוגן.</p>
            )}
            {recommendations.regimenType === 'SEQUENTIAL_COMBINED' && (
              <p>במטופלת עם רחם בפרי-מנופאוזה: טיפול סדרתי/מחזורי (sHRT) המכיל אסטרוגן רציף ופרוגסטוגן לפחות 12–14 ימים בחודש, מגן על הרירית ומסדיר את המחזור.</p>
            )}
            {recommendations.regimenType === 'CONTINUOUS_COMBINED' && (
              <p>במטופלת עם רחם בפוסט-מנופאוזה (>12 חודשי אל-ווסת או מעל גיל 54): טיפול משולב רציף (ccHRT) מגן על רירית הרחם ומעניק משטר ללא ווסת (bleed-free).</p>
            )}
            {recommendations.regimenType === 'NON_HORMONAL_ONLY' && (
              <p>עקב התווית נגד לטיפול הורמונלי (רקע אונקולוגי): מיקוד בחלופות לא-הורמונליות יעילות כגון Veoza (Fezolinetant) ו-CBT.</p>
            )}
          </div>
        </div>

        {/* כרטיס דרך המתן (Route) */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">ציר מתן האסטרוגן המומלץ</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              recommendations.routePreference.includes('MANDATORY')
                ? 'bg-rose-100 text-rose-800'
                : recommendations.routePreference.includes('PREFERRED')
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {recommendations.routePreference === 'TRANSDERMAL_MANDATORY' && 'מתן עורי בלבד (חובה)'}
              {recommendations.routePreference === 'TRANSDERMAL_PREFERRED' && 'מתן עורי מועדף (קו ראשון)'}
              {recommendations.routePreference === 'ORAL_ACCEPTABLE' && 'מתן פומי או עורי'}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-slate-900">
            {recommendations.routePreference.includes('ORAL') ? 'מתן פומי או עורי לפי בחירה' : 'מתן עורי (Transdermal) – ג\'ל או מדבקות'}
          </h3>

          <div className="text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
            <p className="font-semibold text-slate-900 mb-1">נימוקים קליניים לבחירת ציר המתן:</p>
            {recommendations.routeRationale.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {recommendations.routeRationale.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              <p>פרופיל סיכון נמוך: גיל &lt; 60, BMI תקין, ללא יל"ד או גורמי VTE. ניתן לתת פומי או עורי.</p>
            )}
          </div>
        </div>
      </div>

      {/* מרשם והמלצות תרופתיות ספציפיות בישראל */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Pill className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-slate-900 text-base">מרשם מומלץ והנחיות נטילה (שמות מסחריים בישראל)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* אסטרוגן */}
          {recommendations.estrogenOption && (
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800">רכיב אסטרוגני</span>
                <span className="text-[10px] bg-teal-200/70 text-teal-900 font-bold px-2 py-0.5 rounded">
                  {recommendations.estrogenOption.route}
                </span>
              </div>
              <h4 className="font-extrabold text-base text-teal-950">
                {recommendations.estrogenOption.brandName}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                חומר פעיל: {recommendations.estrogenOption.genericName} | מינון התחלתי: {recommendations.estrogenOption.dosage}
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-teal-100 text-xs text-slate-800">
                <span className="font-semibold text-teal-900">אופן נטילה: </span>
                {recommendations.estrogenOption.schedule}
              </div>
              {recommendations.estrogenOption.notes && (
                <p className="text-[11px] text-teal-800 font-medium">{recommendations.estrogenOption.notes}</p>
              )}
            </div>
          )}

          {/* פרוגסטוגן */}
          {recommendations.progestogenOption && (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-800">רכיב פרוגסטוגני להגנת הרירית</span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-900 font-bold px-2 py-0.5 rounded">
                  {recommendations.progestogenOption.route}
                </span>
              </div>
              <h4 className="font-extrabold text-base text-indigo-950">
                {recommendations.progestogenOption.brandName}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                חומר פעיל: {recommendations.progestogenOption.genericName} | מינון: {recommendations.progestogenOption.dosage}
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100 text-xs text-slate-800">
                <span className="font-semibold text-indigo-900">אופן נטילה: </span>
                {recommendations.progestogenOption.schedule}
              </div>
              {recommendations.progestogenOption.notes && (
                <p className="text-[11px] text-indigo-800 font-medium">{recommendations.progestogenOption.notes}</p>
              )}
            </div>
          )}

          {/* טיפול מקומי ב-GSM */}
          {recommendations.localGsmOption && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">טיפול מקומי באטרופיה נרתיקית (GSM)</span>
                <span className="text-[10px] bg-rose-200/70 text-rose-900 font-bold px-2 py-0.5 rounded">
                  {recommendations.localGsmOption.route}
                </span>
              </div>
              <h4 className="font-extrabold text-base text-rose-950">
                {recommendations.localGsmOption.brandName}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {recommendations.localGsmOption.genericName} ({recommendations.localGsmOption.dosage})
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-rose-100 text-xs text-slate-800">
                <span className="font-semibold text-rose-900">אופן נטילה: </span>
                {recommendations.localGsmOption.schedule}
              </div>
              {recommendations.localGsmOption.notes && (
                <p className="text-[11px] text-rose-800 font-medium">{recommendations.localGsmOption.notes}</p>
              )}
            </div>
          )}

          {/* טסטוסטרון עורי */}
          {recommendations.testosteroneOption && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">טיפול משלים לירידה בחשק (HSDD)</span>
                <span className="text-[10px] bg-amber-200/70 text-amber-900 font-bold px-2 py-0.5 rounded">
                  עורי
                </span>
              </div>
              <h4 className="font-extrabold text-base text-amber-950">
                {recommendations.testosteroneOption.brandName}
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                {recommendations.testosteroneOption.genericName}
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-amber-100 text-xs text-slate-800">
                <span className="font-semibold text-amber-900">אופן נטילה: </span>
                {recommendations.testosteroneOption.schedule}
              </div>
              <p className="text-[11px] text-amber-800 font-medium">
                {recommendations.testosteroneOption.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* דף תיאום ציפיות למטופלת (Patient Leaflet Box) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">דף תיאום ציפיות והסבר למטופלת (ששת החודשים הראשונים)</h3>
          </div>
          <button
            onClick={onPrintPatientLeaflet}
            className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>הדפסת דף המידע</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {recommendations.patientExpectationPoints.map((point, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                {idx + 1}
              </span>
              <p className="text-slate-800 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ארסנל תרופות גיל המעבר בישראל (אקורדיון לרופא/ה) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowArsenal(!showArsenal)}
          className="w-full flex items-center justify-between p-5 bg-slate-50/70 hover:bg-slate-100 transition text-right"
        >
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                ארסנל תרופות גיל המעבר הרשומות בישראל (טבלת חיפוש ומינונים)
              </h4>
              <p className="text-xs text-slate-500">לחץ לצפייה בכל התכשירים, דרכי המתן ומינוני השוואה</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showArsenal ? 'rotate-180' : ''}`} />
        </button>

        {showArsenal && (
          <div className="p-5 space-y-4 border-t border-slate-200">
            <div className="max-w-md">
              <input
                type="text"
                placeholder="חיפוש לפי שם מסחרי, חומר פעיל או אופן מתן..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                    <th className="p-2.5">שם מסחרי בישראל</th>
                    <th className="p-2.5">חומר פעיל</th>
                    <th className="p-2.5">מינונים זמינים</th>
                    <th className="p-2.5">דרך מתן</th>
                    <th className="p-2.5">בטיחות שד</th>
                    <th className="p-2.5">בטיחות VTE</th>
                    <th className="p-2.5">דגשים קליניים</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredArsenal.map((drug) => (
                    <tr key={drug.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {drug.brandNameHebrew}
                        <span className="block text-[10px] text-slate-500 font-normal">{drug.brandNameEnglish}</span>
                      </td>
                      <td className="p-2.5 text-slate-700">{drug.genericName}</td>
                      <td className="p-2.5 text-slate-600">{drug.availableDoses.join(', ')}</td>
                      <td className="p-2.5 text-slate-600">{drug.route}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          drug.breastSafety === 'HIGH' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {drug.breastSafety === 'HIGH' ? 'גבוהה ביותר' : 'סטנדרטית'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          drug.vteSafety === 'SAFE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {drug.vteSafety === 'SAFE' ? 'בטוח ל-VTE' : 'זהירות / פומי'}
                        </span>
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600 max-w-xs">{drug.clinicalHighlightsHebrew}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* מעבר לשלב 3 */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onProceedToStage3}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition"
        >
          <span>מעבר לשלב 3: מפגשי מעקב חוזרים ופתרון בעיות</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
