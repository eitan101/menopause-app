import React, { useState } from 'react';
import { X, BookOpen, ShieldCheck, Heart, AlertTriangle, Layers, Activity, Printer } from 'lucide-react';

interface ModuleHModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModuleHModal: React.FC<ModuleHModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ROUTE' | 'PROGESTOGENS' | 'INTERACTIONS' | 'BRCA' | 'BLEEDING'>('PROGESTOGENS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-right">
        {/* כותרת מודאל */}
        <div className="bg-gradient-to-l from-teal-800 to-teal-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 text-teal-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">מודול H: דף הסבר ומידע קליני לרופא/ה (Physician Reference Guide)</h3>
              <p className="text-xs text-teal-100/80">תמצית הנחיות Red Whale, BMS 2024–2025, דר' פרייברג, דר' שקלאי ודר' סרבניק</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* לשוניות ניווט */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-2 flex flex-wrap gap-1 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('PROGESTOGENS')}
            className={`py-2.5 px-3.5 rounded-t-xl transition ${
              activeTab === 'PROGESTOGENS'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            השוואת הפרוגסטרונים
          </button>

          <button
            onClick={() => setActiveTab('ROUTE')}
            className={`py-2.5 px-3.5 rounded-t-xl transition ${
              activeTab === 'ROUTE'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ציר מתן: עורי מול פומי
          </button>

          <button
            onClick={() => setActiveTab('INTERACTIONS')}
            className={`py-2.5 px-3.5 rounded-t-xl transition ${
              activeTab === 'INTERACTIONS'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            אינטראקציות ו-GLP-1
          </button>

          <button
            onClick={() => setActiveTab('BLEEDING')}
            className={`py-2.5 px-3.5 rounded-t-xl transition ${
              activeTab === 'BLEEDING'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ספי TVS ודימומים
          </button>

          <button
            onClick={() => setActiveTab('BRCA')}
            className={`py-2.5 px-3.5 rounded-t-xl transition ${
              activeTab === 'BRCA'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            נשאיות BRCA לאחר RRSO
          </button>
        </div>

        {/* תוכן הלשונית */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-800">
          {/* לשונית 1: השוואת הפרוגסטרונים */}
          {activeTab === 'PROGESTOGENS' && (
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                טבלת השוואת פרוגסטרונים: פרופיל בטיחות שד, VTE, עצם ואנדרוגניות
              </h4>

              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b">
                    <tr>
                      <th className="p-2.5">סוג פרוגסטוגן</th>
                      <th className="p-2.5">תכשירים בישראל</th>
                      <th className="p-2.5">בטיחות שד</th>
                      <th className="p-2.5">סיכון VTE</th>
                      <th className="p-2.5">השפעה אנדרוגנית</th>
                      <th className="p-2.5">יתרונות והתוויה עיקרית</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-teal-950">פרוגסטרון מיקרוניזדי (Bioidentical)</td>
                      <td className="p-2.5">אוטרוגסטן, גפרטיקס</td>
                      <td className="p-2.5 text-emerald-700 font-bold">הבטוח ביותר (נטרלי עד 5 שנים)</td>
                      <td className="p-2.5 text-emerald-700 font-bold">בטוח לחלוטין</td>
                      <td className="p-2.5 text-emerald-700">ללא (נטרלי)</td>
                      <td className="p-2.5">קו ראשון לבטיחות שד; מטבוליט אלופרגננולון משרה שינה איכותית בלילה.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-teal-950">דידרוגסטרון (Retroprogesterone)</td>
                      <td className="p-2.5">דופסטון, פמוסטון</td>
                      <td className="p-2.5 text-emerald-700 font-bold">בטוח מאוד</td>
                      <td className="p-2.5 text-emerald-700 font-bold">בטוח</td>
                      <td className="p-2.5 text-emerald-700">ללא</td>
                      <td className="p-2.5">סבילות גבוהה, ללא השפעות אנדרוגניות, מצוין למשטר סדרתי בפרי-מנופאוזה.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-teal-950">התקן תוך-רחמי (52mg LNG-IUS)</td>
                      <td className="p-2.5">מירנה</td>
                      <td className="p-2.5 text-emerald-700 font-bold">בטוח (רמות סיסטמיות נמוכות)</td>
                      <td className="p-2.5 text-emerald-700 font-bold">בטוח ביותר</td>
                      <td className="p-2.5 text-slate-700">מזערית מקומית</td>
                      <td className="p-2.5">פתרון הזהב: דיכוי דימומים כבדים, עוקף בעיות ספיגת קיבה (GLP-1), אמצעי מניעה מעולה.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-teal-950">דרוספרינון (Drospirenone)</td>
                      <td className="p-2.5">אנג'ליק, סליינד</td>
                      <td className="p-2.5 text-slate-700 font-semibold">סטנדרטית</td>
                      <td className="p-2.5 text-amber-700">זהירות מתונה</td>
                      <td className="p-2.5 text-teal-700 font-bold">אנטי-אנדרוגני מובהק</td>
                      <td className="p-2.5">אנטי-מינרלוקורטיקואיד: מפחית אגירת נוזלים, בצקות ונפיחות; עשוי להוריד ל"ד קלות.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-teal-950">נוראתיסטרון אצטאט (NETA)</td>
                      <td className="p-2.5">אקטיבל, אוורל קונטי</td>
                      <td className="p-2.5 text-amber-700 font-semibold">סיכון מוגבר במקצת בשימוש ממושך</td>
                      <td className="p-2.5 text-amber-700">סטנדרטי</td>
                      <td className="p-2.5 text-rose-700 font-bold">אנדרוגני (נגזרת טסטוסטרון)</td>
                      <td className="p-2.5">יעיל מאוד בהגנה על רירית הרחם ובניית מסת עצם; עשוי לגרום לאקנה/שינויי מצב רוח.</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-teal-950">TSEC (בזדוקסיפן SERM)</td>
                      <td className="p-2.5">דואוויב</td>
                      <td className="p-2.5 text-emerald-700 font-bold">בטוח ביותר לשד</td>
                      <td className="p-2.5 text-amber-700">זהירות (פומי)</td>
                      <td className="p-2.5 text-emerald-700">ללא פרוגסטרון!</td>
                      <td className="p-2.5">חלופה מהפכנית ללא פרוגסטרון לנשים עם רחם הסובלות מאי-סבילות קשה לפרוגסטרון או כאבי שד.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* לשונית 2: ציר מתן עורי מול פומי */}
          {activeTab === 'ROUTE' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                שיקולי בחירת ציר המתן (Transdermal vs Oral Estradiol)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 space-y-2">
                  <h5 className="font-bold text-teal-950 text-sm">יתרונות המתן העורי (מדבקות / ג'ל):</h5>
                  <ul className="list-disc list-inside space-y-1 text-teal-900">
                    <li><strong>דילוג על מעבר כבדי ראשוני:</strong> אינו משרה פקטורי קרישה כבדיים (Fibrinogen, Prothrombin).</li>
                    <li><strong>אפס עלייה בסיכון ל-VTE ולשבץ מוחי:</strong> נחשב בטוח לחלוטין טרומבואמבולית על פי כל המחקרים התצפיתיים והנחיות BMS.</li>
                    <li><strong>אינו מעלה לחץ דם:</strong> אינו מגרה ייצור אנגיוטנסינוגן בכבד.</li>
                    <li><strong>שמירה על החשק המיני (Libido):</strong> אינו מעלה את רמות החלבון SHBG, ובכך מותיר רמות טסטוסטרון חופשי פיזיולוגיות.</li>
                    <li><strong>אינו מושפע מהאטת קיבה (GLP-1):</strong> ספיגה יציבה וישירה דרך העור.</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <h5 className="font-bold text-slate-900 text-sm">אינדיקציות מוחלטות ומועדפות למתן עורי:</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li><strong>השמנת יתר:</strong> BMI ≥ 30 kg/m² (חובה עורי עקב סיכון VTE בסיסי מוגבר).</li>
                    <li><strong>גיל:</strong> גיל מעל 60 שנה או מעל 10 שנים מה-FMP.</li>
                    <li><strong>גורמי סיכון קרדיווסקולריים:</strong> יתר לחץ דם, סוכרת, עישון.</li>
                    <li><strong>מיגרנות:</strong> במיוחד מיגרנה עם אאורה (סיכון מוגבר לשבץ תחת אסטרוגן פומי).</li>
                    <li><strong>מחלת כבד שפירה או אבני מרה:</strong> מתן עורי אינו מפריש רמות אסטרוגן גבוהות לכיס המרה.</li>
                    <li><strong>טיפול מקביל ב-GLP-1</strong> (אוזמפיק, וויגובי, מונג'רו).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* לשונית 3: אינטראקציות ו-GLP-1 */}
          {activeTab === 'INTERACTIONS' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                אינטראקציות תרופתיות קריטיות (הנחיות BMS 2025)
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-purple-950 text-sm block">1. אנלוגים ל-GLP-1 / GIP (סמגלוטייד / טירזפטייד):</span>
                  <p className="text-purple-900">
                    האטת ריקון הקיבה מביאה לירידה בספיגת פרוגסטרון פומי ⬅️ חשיפת רירית הרחם לשגשוג ללא הגנה מספקת ודימומים לא סדירים.
                  </p>
                  <p className="font-semibold text-purple-950">
                    המלצת BMS: קו ראשון הוא שילוב אסטרוגן עורי עם התקן מירנה (52mg LNG-IUS). אם נוטלת פרוגסטרון פומי: העלאת המינון (למשל מ-100 ל-200 מ"ג) ל-4 שבועות עם התחלת הטיפול או בכל העלאת מינון של ה-GLP-1.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-900 text-sm block">2. משרני אנזימי כבד (Carbamazepine, Phenytoin, Rifampicin, St. John's Wort):</span>
                  <p className="text-slate-700">
                    מאיצים פירוק של אסטרוגן ופרוגסטוגן דרך מערכת הציטוכרום P450 (CYP3A4) בכבד. מחייב מתן עורי במינון גבוה יותר ומתן התקן מירנה או מינון פרוגסטוגן מוגבר.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-900 text-sm block">3. אלטרוקסין (Levothyroxine):</span>
                  <p className="text-slate-700">
                    אסטרוגן פומי מעלה רמות TBG, מה שמפחית T4 חופשי. מתן עורי אינו משפיע כמעט על TBG. אם ניתן פומי – בדיקת TSH כעבור 6-8 שבועות והתאמת מינון.
                  </p>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-rose-950 text-sm block">4. טמוקסיפן ומעכבי ארומטאז (סרטן שד):</span>
                  <p className="text-rose-900">
                    איסור על מתן טיפול הורמונלי סיסטמי. טיפול הבחירה: Veoza (Fezolinetant 45mg) או ונלפקסין (שימו לב: אין לתת פרוקסטין החוסמת את האנזים CYP2D6 האחראי על הפעלת טמוקסיפן!).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* לשונית 4: ספי TVS ודימומים */}
          {activeTab === 'BLEEDING' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600" />
                ניהול דימומים וספי עובי רירית ב-TVS (דר' מרב פרייברג & BMS 2024)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-rose-950 text-sm">ספי עובי רירית תקינים באולטרסאונד (TVS):</h5>
                  <ul className="space-y-1.5 text-rose-900">
                    <li className="p-2 bg-white rounded-lg border border-rose-100">
                      <strong>טיפול משולב רציף (ccHRT):</strong> סף תקין הינו <strong>≤ 4 מ"מ</strong>. אם העובי מעל 4 מ"מ בנוכחות דימום חריג ⬅️ מחייב דגימת פיפל (Pipelle) או היסטרוסקופיה.
                    </li>
                    <li className="p-2 bg-white rounded-lg border border-rose-100">
                      <strong>טיפול משולב סדרתי (sHRT):</strong> סף תקין הינו <strong>≤ 7 מ"מ</strong> (מדידה ביום 4–5 של דימום הגמילה). אם מעל 7 מ"מ ⬅️ בירור אנדומטריאלי היסטולוגי.
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-900 text-sm">קריטריונים להפניה דחופה ל-TVS (תוך 6 שבועות):</h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    <li>דימום חדש או נמשך מעבר ל-6 חודשים מתחילת הטיפול.</li>
                    <li>דימום מכל סוג במטופלת עם גורם סיכון מג'ורי (BMI ≥ 40, תסמונת לינץ').</li>
                    <li>דימום כבד וממושך המלווה בסיכון לאנמיה.</li>
                    <li>דימום לאחר מגע מיני (Postcoital bleeding - שלילת פתולוגיית צוואר הרחם).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* לשונית 5: BRCA ו-RRSO */}
          {activeTab === 'BRCA' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                פרוטוקול HRT לנשאיות מוטציות BRCA1/2 לאחר RRSO (דר' נעמה סרבניק)
              </h4>

              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2 text-indigo-950">
                <p className="font-bold text-sm">עקרונות המפתח לנשאיות מוטציה שעברו כריתת שחלות מניעתית:</p>
                <ul className="list-disc list-inside space-y-1.5 text-indigo-900">
                  <li><strong>בטיחות מוכחת:</strong> מתן HRT בנשאיות BRCA1/2 ללא היסטוריה אישית של סרטן שד שעברו RRSO בגיל צעיר אינו מעלה את הסיכון לסרטן שד, ונמצא בטוח ומציל חיים!</li>
                  <li><strong>משך הטיפול:</strong> מומלץ ליטול טיפול הורמונלי במינונים מלאים לפחות עד גיל המנופאוזה הטבעי הממוצע (51–52 שנים).</li>
                  <li><strong>מניעת תחלואה קשה:</strong> מגן באופן דרמטי מפני מוות מוקדם ממחלות לב וכלי דם ומפני שברים אוסטאופורוטיים.</li>
                  <li><strong>אם עברה גם כריתת רחם:</strong> אסטרוגן בלבד (עדיף עורי) – פרופיל הבטיחות הגבוה ביותר לשד.</li>
                  <li><strong>אם הרחם נשמר:</strong> עדיפות עליונה להתקן מירנה (52mg IUS) להגנה מקומית מוחלטת עם חשיפה סיסטמית מינימלית, או פרוגסטרון מיקרוניזדי טבעי (אוטרוגסטן).</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* פוטר מודאל */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500">
            מקורות הידע: Red Whale Clinical Knowledge, British Menopause Society (BMS 2024-2025), ACOG & קורס מנופאוזה פרקטית.
          </span>
          <button
            onClick={onClose}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
          >
            סגור דף עזר
          </button>
        </div>
      </div>
    </div>
  );
};
