/**
 * save-label.ts — domyślne nazwy zapisów (manual / szybki / autozapis).
 * Pure functions · bez DOM · lane UI/E.
 */

import type { GameDifficulty } from './difficulty-cost';

export type SaveLabelKind = 'manual' | 'quick' | 'autosave';

export interface DefaultSaveLabelInput {
  kind?: SaveLabelKind;
  turn: number;
  /** Stolica, pierwsze miasto lub nazwa cywilizacji. */
  headline?: string;
  mapSize?: string;
  difficulty?: GameDifficulty;
  /** Domyślnie 72 — zgodnie z polem nazwy w dialogu zapisu. */
  maxLen?: number;
}

const DIFFICULTY_LABEL: Record<GameDifficulty, string> = {
  easy: 'Łatwy',
  normal: 'Normalny',
  hard: 'Trudny',
};

const KIND_PREFIX: Record<SaveLabelKind, string> = {
  manual: '',
  quick: 'Szybki zapis · ',
  autosave: 'Autozapis · ',
};

/** Rok kalendarzowy jak w HUD: tura 1 = 4000 p.n.e., potem −50 lat na każdą kolejną turę. */
export function yearLabelFromTurn(turn: number): string {
  const t = Math.max(1, turn);
  const y = Math.max(0, 4000 - (t - 1) * 50);
  return `rok ${y} p.n.e.`;
}

/**
 * Etykieta domyślna, np.:
 * «Ateny · rok 3500 p.n.e. · tura 10 · Standardowy · Normalny»
 * «Szybki zapis · Ateny · rok 3500 p.n.e. · tura 10 · Standardowy · Normalny»
 */
export function buildDefaultSaveLabel(input: DefaultSaveLabelInput): string {
  const maxLen = input.maxLen ?? 72;
  const kind = input.kind ?? 'manual';
  const prefix = KIND_PREFIX[kind];
  const headline = input.headline?.trim() || 'Gra';
  const year = yearLabelFromTurn(input.turn);
  const mapSize = input.mapSize?.trim() || 'Standardowy';
  const diffLabel = DIFFICULTY_LABEL[input.difficulty ?? 'normal'];

  const candidates = [
    `${headline} · ${year} · tura ${input.turn} · ${mapSize} · ${diffLabel}`,
    `${headline} · tura ${input.turn} · ${mapSize} · ${diffLabel}`,
    `${headline} · tura ${input.turn} · ${diffLabel}`,
    `${headline} · tura ${input.turn}`,
  ];

  for (const core of candidates) {
    const label = prefix + core;
    if (label.length <= maxLen) return label;
  }

  const last = prefix + candidates[candidates.length - 1]!;
  return last.length <= maxLen ? last : last.slice(0, maxLen);
}
