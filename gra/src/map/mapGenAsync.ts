/**
 * mapGenAsync.ts — generacja mapy w Web Workerze z fallbackiem na main thread.
 */
import MapGenWorker from './genWorker.ts?worker&inline';
import {
  generujSwiat,
  type GameMapWithStarts,
  type MapGenProgressCallback,
  type RozmiarSwiata,
} from './generator';
import type { TypSwiata } from './gen-helpers';
import type { WorldGenOptions } from './newGameMapDefaults';
import type { GenWorkerRequest, GenWorkerResponse } from './genWorker';
import { getRiverGenEnabled } from './riverGenSwitch';

const yieldMain = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/** Generacja w workerze; przy błędzie workera — main thread z yield między fazami postępu. */
export async function generujSwiatAsync(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ: TypSwiata,
  genOpts?: WorldGenOptions,
  onProgress?: MapGenProgressCallback,
): Promise<GameMapWithStarts> {
  try {
    return await generujSwiatInWorker(seed, rozmiar, typ, genOpts, onProgress);
  } catch (workerErr) {
    console.warn('[mapGenAsync] Worker niedostępny — fallback main thread:', workerErr);
    return generujSwiatOnMainWithYields(seed, rozmiar, typ, genOpts, onProgress);
  }
}

function generujSwiatInWorker(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ: TypSwiata,
  genOpts?: WorldGenOptions,
  onProgress?: MapGenProgressCallback,
): Promise<GameMapWithStarts> {
  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;
    try {
      worker = new MapGenWorker();
    } catch (err) {
      reject(err);
      return;
    }

    const cleanup = () => {
      worker?.terminate();
      worker = null;
    };

    worker.onmessage = (ev: MessageEvent<GenWorkerResponse>) => {
      const msg = ev.data;
      if (msg.type === 'progress') {
        onProgress?.(msg.faza, msg.pct, msg.phaseNum, msg.phaseTotal);
      } else if (msg.type === 'done') {
        cleanup();
        resolve(msg.map);
      } else if (msg.type === 'error') {
        cleanup();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (ev) => {
      cleanup();
      reject(ev.error ?? new Error('Worker error'));
    };

    const req: GenWorkerRequest = {
      type: 'generate',
      seed: seed ?? 0,
      rozmiar,
      typ,
      genOpts,
      riverGenEnabled: getRiverGenEnabled(),
    };
    worker.postMessage(req);
  });
}

/** Fallback: sync generacja z yield przed/po — postęp z generateMap/generujSwiat. */
async function generujSwiatOnMainWithYields(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ: TypSwiata,
  genOpts?: WorldGenOptions,
  onProgress?: MapGenProgressCallback,
): Promise<GameMapWithStarts> {
  await yieldMain();
  const map = generujSwiat(seed, rozmiar, typ, genOpts, onProgress);
  await yieldMain();
  return map;
}
