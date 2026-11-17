/**
 * damageLabelStack.ts -- pionowe ukladanie unoszacych sie etykiet obrazen.
 *
 * R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1: gdy ta sama jednostka dostaje kilka
 * trafien w krotkim czasie, kazda nowa etykieta dostaje przesuniecie wzgledem tych,
 * ktore nadal sa widoczne (licznik aktywnych etykiet na jednostke). Etykiety unosza
 * sie z ta sama predkoscia, wiec przesuniecie utrzymuje sie przez caly ich czas zycia.
 *
 * Czysta funkcja (bez DOM/THREE) -- testowana w gra/tools/battle-damage-label-stack-test.cjs.
 */

/** Odstep swiatowy miedzy kolejnymi etykietami tej samej jednostki. */
export const DMG_LABEL_STACK_STEP = 0.30;

/**
 * Przesuniecie w gore (jednostki swiata) dla nowej etykiety, gdy nad jednostka
 * jest juz `activeOnUnit` aktywnych etykiet. 0 aktywnych -> 0 (bez zmiany).
 */
export function damageLabelStackOffset(activeOnUnit: number): number {
  if (!(activeOnUnit > 0)) return 0;
  return activeOnUnit * DMG_LABEL_STACK_STEP;
}
