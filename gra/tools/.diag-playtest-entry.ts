
import { buildPlaytestMiastoEkonomia, PLAYTEST_MIASTO_SEED } from '../src/game/playtestMiastoEkonomia';
import { generujSwiat, rozmiarFromMenuLabel } from '../src/map/generator';
import { loadGameData } from '../src/data/loader';
import { workedHexCoordsForCity } from '../src/game/turn-economy';
import { cityRangeForPopulation, resolveWorkedTiles, yieldOfMapHex } from '../src/game/okolica';
import { hexDistance } from '../src/units/setup';

const data = loadGameData();
const rozmiar = rozmiarFromMenuLabel('Maly');
const map = generujSwiat(PLAYTEST_MIASTO_SEED, rozmiar, 'kontynenty');
const preset = buildPlaytestMiastoEkonomia(map, data);
if (!preset) { console.log('NO PRESET'); process.exit(1); }
const city = preset.cities[0];
console.log('city', { q: city.q, r: city.r, pop: city.population, tryb: city.okolicaTryb, focus: city.okolicaFocus });
const worked = workedHexCoordsForCity(city, map);
console.log('auto worked', worked.length);
const in3 = worked.filter(t => hexDistance(city.q, city.r, t.q, t.r) <= 3);
console.log('within display r=3:', in3.length, in3.map(t => t.q+','+t.r).slice(0, 12));

city.okolicaTryb = 'reczny';
city.okolicaReczne = {};
const workedRecznyEmpty = workedHexCoordsForCity(city, map);
console.log('reczny empty worked', workedRecznyEmpty.length);

city.okolicaTryb = 'auto';
delete city.okolicaReczne;
const workedAfterRestore = workedHexCoordsForCity(city, map);
console.log('after restore auto', workedAfterRestore.length);
