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
