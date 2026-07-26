/**
 * wonders-data.ts — odczyt cudów świata (gra/data/wonders.json).
 * Kanon: dostęp E (wyłączny) / R (wyścig), indeks per państwo (typCywilizacji).
 */

import wondersRaw from '../../data/wonders.json';

export type WonderDostep = 'E' | 'R';

/** Stałe bonusy (+/turę) — jak yields w buildings.json. */
export interface WonderYieldBonus {
  pieniadz?: number;
  zywnosc?: number;
  nauka?: number;
  kultura?: number;
  zadowolenie?: number;
  praca?: number;
  obrona?: number;
}

export interface WonderTerenBonus extends WonderYieldBonus {
  typTerenu: string;
  warunek?: string;
}

export interface WonderSpecjalnyBonus {
  typ: string;
  cel?: string;
  wartosc: number | string;
  opis: string;
}

export interface WonderBonusy {
  /** +/turę × każde miasto (kanon Maciej 2026). */
  miasto?: WonderYieldBonus;
  /** Tylko hex cudu — nie × każde miasto. */
  hex?: WonderYieldBonus;
  teren?: WonderTerenBonus[];
  /** Bonusy cywilizacji (specjalne) — NIE w karcie miasta. */
  specjalne?: WonderSpecjalnyBonus[];
}

export interface WonderDef {
  id: string;
  nazwa: string;
  nazwaAlt?: string;
  dostep: WonderDostep;
  /** E = wyłącznie cywilizacje[]; R = wszystkie 15 państw (pełna lista w JSON). */
  cywilizacje: string[];
  techUnlock: string[];
  wymagaTerenu: string[];
  epokaWejscia: number;
  /** Ostatnia epoka imperium z aktywnymi bonusami (włącznie); od absolut+1 efekt wygasa. */
  absolut?: number;
  maxNaSwiecie: number;
  /** Koszt w Pracy (jak kosztBudowy budynków). */
  kosztBudowy: number;
  /** Utrzymanie Pieniądza/turę (propozycja v0.1). */
  utrzymanie?: number;
  bonusy?: WonderBonusy;
  uwagi?: string;
}

export interface WonderPanstwoEntry {
  id: string;
  dostep: WonderDostep;
  kolejnosc: number;
}

export interface WonderPanstwoIndex {
  nazwa: string;
  cuda: WonderPanstwoEntry[];
}

export interface WonderAbsolutMeta {
  opis?: string;
  domyslnie_antyk?: number;
  koniec_sredniowiecza?: number;
  decyzja?: string;
  silnik?: string;
  po_absolut?: {
    decyzja?: string;
    hex?: string;
    jedyny_efekt?: { typ: string; wartosc: number; opis?: string };
  };
}

export interface WondersData {
  _meta: Record<string, unknown> & {
    wszystkie_cywilizacje?: string[];
    absolut?: WonderAbsolutMeta;
  };
  cuda: WonderDef[];
  panstwa: Record<string, WonderPanstwoIndex>;
  /** Cuda odłożone na epoki 4+ — nieaktywne w v1.0 Antyk. */
  parkowane_epoka4plus?: WonderDef[];
}

const data = wondersRaw as unknown as WondersData;

const wonderById = new Map(data.cuda.map(w => [w.id, w]));

/** Pełny słownik cudów. */
export function getWondersData(): WondersData {
  return data;
}

/** Definicja cudu po id. */
export function getWonderById(id: string): WonderDef | undefined {
  return wonderById.get(id);
}

/** Wszystkie cudy dostępne dla państwa (kolejność z indeksu panstwa). */
export function getWondersForCiv(typCywilizacji: string): WonderDef[] {
  const row = data.panstwa[typCywilizacji];
  if (!row) return [];
  return row.cuda
    .slice()
    .sort((a, b) => a.kolejnosc - b.kolejnosc)
    .map(e => wonderById.get(e.id))
    .filter((w): w is WonderDef => w != null);
}

/** Wpis indeksu państwa (z kolejnością i typem dostępu). */
export function getWonderIndexForCiv(typCywilizacji: string): WonderPanstwoIndex | undefined {
  return data.panstwa[typCywilizacji];
}

/** Cuda wyścigowe (R) — uczestniczą wszystkie państwa. */
export function getRaceWonderIds(): string[] {
  return data.cuda.filter(w => w.dostep === 'R').map(w => w.id);
}

/** Klucze wszystkich państw (15) — z _meta lub indeksu panstwa. */
export function getAllWonderCivKeys(): string[] {
  const fromMeta = (data._meta as { wszystkie_cywilizacje?: string[] }).wszystkie_cywilizacje;
  return fromMeta?.length ? fromMeta : Object.keys(data.panstwa);
}

/** Czy dane państwo może budować ten cud. */
export function canCivBuildWonder(typCywilizacji: string, wonderId: string): boolean {
  const w = wonderById.get(wonderId);
  if (!w) return false;
  return w.cywilizacje.includes(typCywilizacji);
}

/** Czy cud jest wyścigowy (R) — wtedy uczestniczą wszystkie nacje. */
export function isWonderRace(wonderId: string): boolean {
  return wonderById.get(wonderId)?.dostep === 'R';
}

/** @deprecated Użyj isWonderRace — R dotyczy wszystkich państw. */
export function isWonderRaceForCiv(typCywilizacji: string, wonderId: string): boolean {
  void typCywilizacji;
  return isWonderRace(wonderId);
}

/** Lista typCywilizacji z wpisem w indeksie (15 państw). */
export function listWonderCivKeys(): string[] {
  return Object.keys(data.panstwa);
}

/** Ostatnia epoka z aktywnymi bonusami cudu (domyślnie koniec Średniowiecza = 6). */
export function getWonderAbsolutEpoka(w: Pick<WonderDef, 'absolut'>): number {
  if (w.absolut != null) return w.absolut;
  const meta = (data._meta as { absolut?: WonderAbsolutMeta }).absolut;
  return meta?.domyslnie_antyk ?? meta?.koniec_sredniowiecza ?? 6;
}

/** Czy bonusy cudu są aktywne w danej epoce imperium. */
export function isWonderBonusActive(
  w: Pick<WonderDef, 'absolut'>,
  eraImperium: number,
): boolean {
  return eraImperium <= getWonderAbsolutEpoka(w);
}

/** Po absolut: turystyka (+handel) — wartość z _meta.po_absolut.jedyny_efekt. */
export function getWonderTourismTradeBonus(): number {
  const po = (data._meta as { absolut?: WonderAbsolutMeta }).absolut?.po_absolut?.jedyny_efekt;
  return po?.typ === 'handel_turystyka' ? (po.wartosc ?? 0) : 0;
}

// ---------------------------------------------------------------------------
// CUDA-EKON-01 (2026-07-23): wpięcie bonusów bonusy.miasto cudów w ekonomię.
// Czysty helper (brak DOM/THREE) — czytany przez turn-economy.ts (osobny krok
// "+wonder yields", NIE przeplatany z resztą ekonomii/Pracy) oraz
// society-breakdown.ts (linia "Cuda świata" w rozbiciu Szczęścia).
//
// Zakres (decyzja, patrz raport C-CUDA-BONUS=A): bonusy.miasto działają
// "× KAŻDE miasto" wg _meta.bonus_miasto w wonders.json ("Yield +/turę × KAŻDE
// miasto") i wonderEffectsLabel() w main.ts (etykieta "(× każde miasto)") —
// a więc są FLAT dodatkiem do KAŻDEGO miasta właściciela, nie tylko do miasta,
// w którym cud stoi. Wartości brane WPROST z JSON (BEZ ponownego mnożenia przez
// _meta.bonus_miasto_mnoznik=3 — to pole dokumentuje HISTORYCZNE skalowanie
// v0.1→kanon 2026; liczby w cuda[].bonusy.miasto JUŻ je zawierają, a
// wonderEffectsLabel też czyta je wprost — podwojenie rozjechałoby UI vs silnik).
//
// bonusy.teren / bonusy.hex (też ilościowe, ale przypisane do KONKRETNYCH heksów
// w terytorium, nie "każde miasto") oraz bonusy.specjalne (wpływ/zaufanie/%/armia
// — imperium, nie yield miasta) NIE są tu liczone — TODO, patrz raport zadania.

/** Akumulator startowy dla sumWonderCityYieldsForOwner. */
const ZERO_WONDER_CITY_YIELD: Required<WonderYieldBonus> = {
  pieniadz: 0, zywnosc: 0, nauka: 0, kultura: 0, zadowolenie: 0, praca: 0, obrona: 0,
};

/**
 * Suma bonusy.miasto (flat, × KAŻDE miasto właściciela) po wszystkich cudach
 * ukończonych i posiadanych przez właściciela (ownerWonderIds), z bramką absolut
 * (isWonderBonusActive) — po końcu Średniowiecza bonusy miasta wygasają (zostaje
 * tylko po_absolut.jedyny_efekt — handel_turystyka, patrz getWonderTourismTradeBonus).
 * Zwraca sumę gotową do dodania DO KAŻDEGO miasta tego właściciela (nie sumowana
 * per-miasto — caller dolicza ten sam obiekt do każdego miasta ownera).
 */
export function sumWonderCityYieldsForOwner(
  ownerWonderIds: readonly string[],
  ownerEra: number,
): Required<WonderYieldBonus> {
  const totals = { ...ZERO_WONDER_CITY_YIELD };
  for (const id of ownerWonderIds) {
    const w = wonderById.get(id);
    const m = w?.bonusy?.miasto;
    if (!w || !m) continue;
    if (!isWonderBonusActive(w, ownerEra)) continue;
    totals.pieniadz     += m.pieniadz ?? 0;
    totals.zywnosc      += m.zywnosc ?? 0;
    totals.nauka        += m.nauka ?? 0;
    totals.kultura      += m.kultura ?? 0;
    totals.zadowolenie  += m.zadowolenie ?? 0;
    totals.praca        += m.praca ?? 0;
    totals.obrona       += m.obrona ?? 0;
  }
  return totals;
}

/** True gdy suma bonusów niezerowa (unika wpisywania pustych map/linii UI). */
export function hasAnyWonderCityYield(b: Readonly<WonderYieldBonus>): boolean {
  return (b.pieniadz ?? 0) !== 0
    || (b.zywnosc ?? 0) !== 0
    || (b.nauka ?? 0) !== 0
    || (b.kultura ?? 0) !== 0
    || (b.zadowolenie ?? 0) !== 0
    || (b.praca ?? 0) !== 0
    || (b.obrona ?? 0) !== 0;
}

// ---------------------------------------------------------------------------
// CUDA-HANDEL-01 (Maciej 2026-07-26, decyzja dosłowna: "3 handel nie daninę"):
// ożywienie bonusu bonusy.specjalne[].typ === "handel_procent" (Petra, Kamień
// Ha'amonga, Kolos Rodyjski, Brama wszystkich narodów, Pałac Weiyang) — do tej
// pory czysta martwa obietnica w wonders.json, żaden kod go nie czytał.
//
// ROZSTRZYGNIĘCIA (nie zgaduj przy następnej sesji — to jest kanon):
//   1. ZASILA WYŁĄCZNIE dochód z TRAS HANDLOWYCH (tradeRouteDistanceIncome /
//      computeTradeRouteIncomeByCity w trade-routes.ts, wpięte do
//      turn-economy.ts jako "pieniadzZTras"). NIGDY Daninę/Podatek
//      (handelBrutto/handelNetto w economy.ts, cityYieldPerTurn) — pieniadzZTras
//      jest dodawany do skarbca miasta PO całej ścieżce Daniny (patrz
//      turn-economy.ts, komentarz przy `pieniadzZTras = tradeIncomeByCity...`),
//      więc modyfikując tylko tradeIncomeByCity ten bonus STRUKTURALNIE nie może
//      dotknąć Daniny — nie trzeba osobnej bramki, wystarczy wpiąć się w
//      odpowiednim miejscu (patrz test cuda-handel-test.cjs, asercja #4).
//   2. ZASIĘG: WSZYSTKIE trasy WŁAŚCICIELA cudu (imperium), NIE tylko trasy
//      miasta-nosiciela. Uzasadnienie: bonus żyje w bonusy.specjalne, a
//      _meta.bonus_cywilizacja w wonders.json definiuje tę sekcję wprost jako
//      "Tylko imperium — NIE sumowane w karcie miasta" — dokładnie tak samo jak
//      dyplomacja_wpływ/armia_xp/wojna_wsparcie z tych samych cudów, które też
//      działają na całe imperium, nie na miasto-nosiciela. Cud to inwestycja
//      imperialna (rekomendacja właściciela w zadaniu), spójna z resztą
//      bonus_cywilizacja_typy.
//   3. KUMULACJA: ADDYTYWNA — suma wartości wszystkich aktywnych cudów tego typu
//      posiadanych przez ownera (rekomendacja właściciela — spójne z premiami
//      budynków i redukcją korupcji w projekcie, które też sumują się
//      addytywnie, nigdy mnożnie).
//   4. "cel": "handel" -> dolicza się do KAŻDEJ trasy (dowolne medium, ląd LUB
//      morze) — opisy tych wpisów w JSON są ogólne ("z tras handlowych"/"z
//      handlu"). "cel": "handel_morski" -> dolicza się WYŁĄCZNIE do tras z
//      medium === 'morze' (Kamień Ha'amonga/Kolos Rodyjski: opisy mówią wprost
//      o "handlu morskim"/"portach") — na trasie lądowej ten wpis się NIE liczy.
//   5. PARYTET AI: funkcja jest ownerId-agnostyczna (bierze listę cudów ownera
//      jako argument) — wołający (main.ts) używa jej identycznie dla gracza i AI.
// ---------------------------------------------------------------------------

/** Medium trasy handlowej — luźna kopia trade-routes.ts:TradeRouteMedium (structural,
 *  bez importu, żeby uniknąć zależności cyklicznej wonders-data.ts <-> trade-routes.ts). */
export type WonderTradeRouteMedium = 'lad' | 'morze';

/**
 * Suma % bonusu handel_procent aktywnych cudów właściciela dla danego medium trasy
 * (0, gdy brak). Addytywna kumulacja (patrz nagłówek sekcji, punkt 3). Respektuje
 * bramkę absolut (isWonderBonusActive) — po końcu Średniowiecza bonus wygasa jak
 * każdy inny bonus_cywilizacja cudu Antyku.
 */
export function sumWonderTradeRouteBonusForOwner(
  ownerWonderIds: readonly string[],
  ownerEra: number,
  medium: WonderTradeRouteMedium,
): number {
  let total = 0;
  for (const id of ownerWonderIds) {
    const w = wonderById.get(id);
    if (!w) continue;
    if (!isWonderBonusActive(w, ownerEra)) continue;
    for (const s of w.bonusy?.specjalne ?? []) {
      if (s.typ !== 'handel_procent') continue;
      if (s.cel === 'handel_morski' && medium !== 'morze') continue;
      total += typeof s.wartosc === 'number' ? s.wartosc : 0;
    }
  }
  return total;
}
