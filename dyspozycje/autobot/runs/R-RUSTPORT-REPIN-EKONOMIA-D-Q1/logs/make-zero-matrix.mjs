// Tworzy kopie civ-matrix.json (pin 91dc998a) z kontrolowanym wejsciem do wektora "zero":
// wiersz 0: params.meta_mnoznik_waluta = 0 (surowe zero macierzy); wiersz 1: pole usuniete (=> defaults = 2).
// Dane wejsciowe to plik weba; zmienia sie tylko kopia poza repo.
import { readFileSync, writeFileSync } from 'node:fs';
const src = process.argv[2];
const dst = process.argv[3];
const m = JSON.parse(readFileSync(src, 'utf8'));
m.cywilizacje[0].params.meta_mnoznik_waluta = 0;
delete m.cywilizacje[1].params.meta_mnoznik_waluta;
writeFileSync(dst, JSON.stringify(m));
console.log('row0', m.cywilizacje[0].ikonaId, 'row1', m.cywilizacje[1].ikonaId);
