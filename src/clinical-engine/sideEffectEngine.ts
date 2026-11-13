export interface SideEffectsInput {
  hasMastalgia: boolean;
  hasDrowsiness: boolean;
  hasMoodOrAcne: boolean;
  hasNauseaOrBloat: boolean;
  wantsCessation: boolean;
  cessationReason?: string;
}

export interface SideEffectManagementOutput {
  actionPointsHebrew: string[];
  cessationProtocolHebrew?: string;
}

export function solveSideEffects(input: SideEffectsInput): SideEffectManagementOutput {
  const actionPoints: string[] = [];

  // גודש וכאבים בחזה (Mastalgia)
  if (input.hasMastalgia) {
    actionPoints.push(
      'גודש ורגישות בשדיים: לרוב מדובר בתופעה אסטרוגנית זמנית בחודשים הראשונים. אם נמשך: מומלץ להפחית מעט את מינון האסטרוגן (למשל מ-2 לחיצות ג\'ל ל-1.5 או 1), או לעבור מפרוגסטוגן סינתטי (NETA) לפרוגסטרון מיקרוניזדי (אוטרוגסטן) או דרוספרינון.'
    );
  }

  // נמנום ועייפות ביום
  if (input.hasDrowsiness) {
    actionPoints.push(
      'נמנום ועייפות יומית: לפרוגסטרון מיקרוניזדי מטבוליט מרגיע (Allopregnanolone) המשרה ישנוניות. הפתרון הפשוט: להקפיד ליטול את האוטרוגסטן בדיוק בשעת ההליכה לישון בלילה, ולא במהלך שעות היום או הערב המוקדמות.'
    );
  }

  // שינויי מצב רוח, פתיל קצר, אקנה (תופעות אנדרוגניות)
  if (input.hasMoodOrAcne) {
    actionPoints.push(
      'תנודות במצב רוח או אקנה ושיעור: תופעות אנדרוגניות שכיחות תחת פרוגסטוגנים נגזרי טסטוסטרון (NETA / Activelle / Evorel). מומלץ לעבור לדידרוגסטרון (Femoston / Duphaston) או לפרוגסטרון מיקרוניזדי טבעי (Utrogestan), שאינם מפעילים קולטנים אנדרוגניים.'
    );
  }

  // בחילות, נפיחות ואגירת נוזלים
  if (input.hasNauseaOrBloat) {
    actionPoints.push(
      'בחילות ואגירת נוזלים/נפיחות בטנית: מעבר למתן עורי (ג\'ל/מדבקות) אם המטופלת נוטלת אסטרוגן פומי; שקילת פרוגסטוגן אנטי-מינרלוקורטיקואידי כגון דרוספרינון (Angeliq) המעודד הפרשת עודפי נוזלים.'
    );
  }

  // פרוטוקול הפסקת טיפול (Treatment Cessation Protocol)
  let cessationProtocol: string | undefined;
  if (input.wantsCessation) {
    cessationProtocol =
      'פרוטוקול גמילה והפסקה הדרגתית (Tapering Protocol על פי הנחיות BMS): ' +
      'מומלץ להפחית את מינון האסטרוגן בהדרגה על פני 3–6 חודשים (למשל: ירידה מ-2 לחיצות ללחיצה אחת למשך 6 שבועות, ולאחר מכן חצי לחיצה או יום כן-יום לא למשך 6 שבועות נוספים, תוך שמירה על כיסוי פרוגסטוגן מקביל). ' +
      'הפחתה הדרגתית מונעת גלי חום חדים חוזרים (Rebound Vasomotor Symptoms) ומאפשרת למערכת להסתגל. יש לקבוע מעקב כעבור 3 חודשים מסיום הטיפול.';
  }

  return {
    actionPointsHebrew: actionPoints,
    cessationProtocolHebrew: cessationProtocol
  };
}
