/**
 * sidePanelEventTabs.ts
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 — jedno miejsce klasyfikacji wpisów informacyjnych
 * panelu WYDARZENIA do trzech zakładek: Dyplomacja · Ważne · Inne.
 * Zastępuje dawny chip „🌍 Inne cyw.” (filtr origin === 'other-civs').
 *
 * Kolejność reguł ma znaczenie (pierwsza pasująca wygrywa):
 *  1. dyplomacja — kind 'diplo', origin 'other-civs' (handel AI↔AI) albo tytuł „Dyplomacja”;
 *  2. ważne      — karta blokująca / kind 'enemy' (armia, wróg);
 *  3. tekst (znormalizowany: małe litery, bez diakrytyków; granica słowa = POCZĄTEK wyrazu,
 *     więc „armi” nie pasuje do „farmie”, a „głód”/„Głód”/„glod” to to samo):
 *     a) dyplomacja — wymiana propozycji / audiencja / handel AI↔AI (bez prefiksu „Dyplomacja:”),
 *     b) ważne      — braki (brak środków/pokrycia/zasobów, deficyt, wyczerpany…),
 *     c) dyplomacja — wojna/pokój/rozejm/traktat/sojusz/trybut (Wypowiedziałeś wojnę, Pokój z:…),
 *     d) ważne      — magazyn, oblężenie, kapitulacja, głód, armia, wróg, bunt, strata, zniszczenie…;
 *  4. inne       — reszta.
 * Komunikaty zbędne (nowy szlak, wycinka, auto-ulepszenia, „Dotarło do celu”, wzrost populacji,
 * dobra wola) NIE trafiają tu wcale — są usunięte u źródła w main.ts.
 * EN: single classification point for informational panel entries; first matching rule wins.
 */
import type { SidePanelEvent } from './sidePanelHud';

export type SidePanelTab = 'dyplomacja' | 'wazne' | 'inne';

export const SIDE_PANEL_TABS: readonly SidePanelTab[] = ['dyplomacja', 'wazne', 'inne'];

export const SIDE_PANEL_TAB_LABELS: Readonly<Record<SidePanelTab, string>> = {
  dyplomacja: 'Dyplomacja',
  wazne: 'Ważne',
  inne: 'Inne',
};

/** Małe litery, bez znaków diakrytycznych (ó→o, ł→l, ę→e…), pojedyncze spacje. */
export function normalizeEventText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ');
}

/** Wzorzec na znormalizowanym tekście; `W` = granica POCZĄTKU wyrazu (nie zaczyna w środku słowa). */
const W = '(?<![a-z0-9])';
const re = (alts: readonly string[]): RegExp => new RegExp(W + '(?:' + alts.join('|') + ')');

/** (a) Wymiana propozycji, audiencja, handel AI↔AI — dyplomacja nawet gdy w treści jest „brak zasobów”. */
const DIPLO_PROPOSAL_RE = re([
  'propozycj', 'kontrofert', 'audiencj', '[a-z-]+ handluje z ',
]);

/** (b) Braki — „coś złego, wymaga reakcji”. */
const SHORTAGE_RE = re([
  'brak (?:srodk|pokryci|zasob|wystarcz|surow|zywn|drewn|zlota|zloz|kamien|zelaz|zboz|rekrut|mocy)',
  'brakuj', 'niedobor', 'deficyt', 'wyczerp', 'nie stac', 'za malo',
]);

/** (c) Wojna / pokój / traktaty — komunikaty dyplomatyczne bez prefiksu „Dyplomacja:”. */
const DIPLO_PHRASE_RE = re([
  'wypowiada wojn', 'wypowiedzia\\w* wojn', 'wojna z ', 'wojny z ', 'do wojny', 'ryzyko wojny',
  'pokoj z[: ]', 'pokoj zawarty', 'pokoj nie zawarty', 'rozejm', 'zerwano traktat', 'traktat',
  'sojus', 'trybut', 'casus belli',
]);

/** (d) Zagrożenia i straty: magazyn, oblężenie, armia, wróg, bunt, głód… */
const IMPORTANT_RE = re([
  'magazyn (?:centraln|ujemn|pust|wyczerp)', 'kapitulac', 'oblez', 'glod', 'zagroz',
  'atakuj', 'atakow', 'zaatak', 'atak (?:na|wrog)', 'strat[ayi]', 'stracon', 'utrac', 'utrat',
  'armi[aeiy]', 'wojsk', 'wrog(?![a-z])', 'bunt', 'zbunt', 'zniszcz', 'dezert', 'eliminac',
  'zdobyt\\w* przez wrog', 'wojn[aey]', 'szturm', 'niewol',
]);

/** Przypisuje wpis informacyjny do zakładki. Czysta funkcja (bez DOM, bez stanu). */
export function eventTabOf(
  ev: Pick<SidePanelEvent, 'title' | 'subtitle' | 'kind' | 'blocking' | 'origin'>,
): SidePanelTab {
  if (ev.kind === 'diplo' || ev.origin === 'other-civs' || ev.title.startsWith('Dyplomacja')) {
    return 'dyplomacja';
  }
  if (ev.blocking === true || ev.kind === 'enemy') return 'wazne';
  const text = normalizeEventText(ev.title + ' ' + (ev.subtitle ?? ''));
  if (DIPLO_PROPOSAL_RE.test(text)) return 'dyplomacja';
  if (SHORTAGE_RE.test(text)) return 'wazne';
  if (DIPLO_PHRASE_RE.test(text)) return 'dyplomacja';
  if (IMPORTANT_RE.test(text)) return 'wazne';
  return 'inne';
}

/**
 * Zakładka domyślna: „Ważne” gdy są wpisy, inaczej „Dyplomacja”, inaczej „Inne”.
 * Wywołujący przekazuje liczniki BEZ ukrytych wpisów AI↔AI (patrz sidePanelHud), żeby handel
 * innych cywilizacji sam nie przełączał panelu na Dyplomację.
 */
export function defaultSidePanelTab(counts: Readonly<Record<SidePanelTab, number>>): SidePanelTab {
  if (counts.wazne > 0) return 'wazne';
  if (counts.dyplomacja > 0) return 'dyplomacja';
  return 'inne';
}
