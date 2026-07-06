/**
 * F-CITY-HEX — wyczyszczenie hexu centrum miasta (tylko terenBazowy widoczny).
 * Snapshot plonów przed czyszczeniem → City.centerWorkedTile.
 */
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { Nakladka, Ulepszenie } from '../types/hex';
import type { City } from './cities';
import type { WorkedTile } from './economy';
import { hexToWorkedTile } from './turn-economy';

type HexExt = Hex & { zloze?: string; improvementKey?: string };

/** Usuwa nakładki / ulepszenia / złoża — zostaje teren bazowy. */
export function clearHexForCityCenter(hex: HexExt): void {
  hex.nakladka = Nakladka.Brak;
  hex.ulepszenie = Ulepszenie.Brak;
  delete hex.zloze;
  delete hex.improvementKey;
}

/** Snapshot plonów + wyczyszczenie hexu miasta (decyzja Maciej F-CITY-HEX). */
export function applyCityFoundingToHex(
  city: City,
  map: GameMap,
  q: number,
  r: number,
): void {
  const hex = map.hexes[`${q},${r}`] as HexExt | undefined;
  if (!hex) return;
  city.centerWorkedTile = hexToWorkedTile(hex);
  clearHexForCityCenter(hex);
}
