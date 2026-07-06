
import { loadGameData } from '../src/data/loader';
import { generujSwiat, rozmiarFromMenuLabel } from '../src/map/generator';
import { buildPlaytestWalkaMapy, PLAYTEST_WALKA_SEED } from '../src/game/playtestWalkaMapy';
import { hexDistance } from '../src/units/setup';
import { detectAutoSiegeOnCity, canInitiateSiege } from '../src/game/mapSiegeDetect';
const d = loadGameData();
const m = generujSwiat(PLAYTEST_WALKA_SEED, rozmiarFromMenuLabel('Maly'), 'kontynenty');
const p = buildPlaytestWalkaMapy(m, d);
if (!p) throw new Error('no preset');
const pl = p.units.find(u => u.ownerId === 0);
const at = p.cities.find(c => c.id === 'city1');
const rom = p.cities.find(c => c.id === 'city0');
export const result = {
  distPlayerAteny: hexDistance(pl.q, pl.r, at.q, at.r),
  autoRoma: detectAutoSiegeOnCity(rom, p.units)?.tryb,
  canSiegeAteny: canInitiateSiege(pl, at),
};
