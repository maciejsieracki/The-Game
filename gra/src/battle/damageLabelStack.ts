/**
 * damageLabelStack.ts -- pionowe ukladanie unoszacych sie etykiet obrazen.
 *
 * R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1: gdy ta sama jednostka dostaje kilka
 * trafien w krotkim czasie, nowa etykieta startuje co najmniej jeden krok powyzej
 * AKTUALNEJ pozycji kazdej etykiety tej jednostki, ktora nadal jest aktywna.
 * Krok liczony jest w pikselach ekranu (DMG_LABEL_STACK_STEP_PX), a przeliczany na
 * jednostki swiata przez biezaca skale kamery -- inaczej przy 15 px czcionce
 * etykiety i tak by sie nakladaly. Liczy sie rzeczywista wysokosc (nie liczba
 * aktywnych etykiet), wiec po wygasnieciu starszej etykiety nowa nadal nie nachodzi.
 * Etykiety unosza sie z ta sama predkoscia, wiec odstep utrzymuje sie przez caly ich czas zycia.
 *
 * Czysta funkcja (bez DOM/THREE) -- testowana w gra/tools/battle-damage-label-stack-test.cjs.
 */

/** Odstep pionowy miedzy etykietami tej samej jednostki, w pikselach ekranu (czcionka 15 px). */
export const DMG_LABEL_STACK_STEP_PX = 20;

/** Krok zapasowy w jednostkach swiata, gdy skali kamery nie da sie ustalic. */
export const DMG_LABEL_STACK_FALLBACK_WORLD = 2.5;

/** Krok w jednostkach swiata dla danej skali (px na jednostke swiata). Brak/0 skali -> zapas. */
export function damageLabelStackStepWorld(pxPerWorldUnit: number): number {
  if (!Number.isFinite(pxPerWorldUnit) || pxPerWorldUnit <= 0) return DMG_LABEL_STACK_FALLBACK_WORLD;
  return DMG_LABEL_STACK_STEP_PX / pxPerWorldUnit;
}

/**
 * Pozycja pionowa (Y swiata) nowej etykiety: `baseY`, albo wyzej niz kazda z
 * aktywnych etykiet tej jednostki (`activeYs` = ich AKTUALNE Y) o co najmniej `stepWorld`.
 * Brak aktywnych -> baseY. Niepoprawne wartosci (NaN/nieskonczone) sa ignorowane.
 */
export function damageLabelStackY(baseY: number, activeYs: readonly number[], stepWorld: number): number {
  let y = baseY;
  for (const ay of activeYs) {
    if (!Number.isFinite(ay)) continue;
    const candidate = ay + stepWorld;
    if (candidate > y) y = candidate;
  }
  return y;
}
