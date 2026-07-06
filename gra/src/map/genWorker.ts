/**
 * genWorker.ts — generacja mapy poza głównym wątkiem (DYSPOZYCJA-WYDAJNOSC C1).
 */
import { generujSwiat, type RozmiarSwiata, type GameMapWithStarts } from './generator';
import type { TypSwiata } from './gen-helpers';
import type { WorldGenOptions } from './newGameMapDefaults';

export type GenWorkerRequest = {
  type: 'generate';
  seed: number;
  rozmiar: RozmiarSwiata;
  typ: TypSwiata;
  genOpts?: WorldGenOptions;
};

export type GenWorkerResponse =
  | { type: 'progress'; faza: string; pct: number; phaseNum?: number; phaseTotal?: number }
  | { type: 'done'; map: GameMapWithStarts }
  | { type: 'error'; message: string };

self.onmessage = (ev: MessageEvent<GenWorkerRequest>) => {
  const msg = ev.data;
  if (msg.type !== 'generate') return;
  try {
    const map = generujSwiat(msg.seed, msg.rozmiar, msg.typ, msg.genOpts, (faza, pct, phaseNum, phaseTotal) => {
      const out: GenWorkerResponse = { type: 'progress', faza, pct, phaseNum, phaseTotal };
      self.postMessage(out);
    });
    const done: GenWorkerResponse = { type: 'done', map };
    self.postMessage(done);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const out: GenWorkerResponse = { type: 'error', message };
    self.postMessage(out);
  }
};
