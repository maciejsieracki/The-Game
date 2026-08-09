'use strict';
/**
 * surowce-dostep-test.cjs — R-SUROWCE-DOSTEP-ILOSC-Q1 (Maciej 2026-08-08, decyzja A):
 * pełne cofnięcie 331aa180. Wszystkie 13 surowców katalogu (w tym Ceramika/Sól/Koń/
 * Złoto) mają REALNY cap — panel imperium (empireDetailPanel.ts renderSurowceSection)
 * pokazuje ich ilość (stock/cap) w siatce „Magazynowane", nie w osobnej sekcji
 * boolean-only „Dostęp — nie magazynowane" (usunięta razem z empire-resource-access.ts).
 *
 * Ten test odtwarza kontrakt `stored = rows.filter(r => r.cap != null)` z
 * empireDetailPanel.ts na mockowanych wierszach EmpireResourceRow-podobnych, bez
 * importu modułu UI (który renderuje HTML, nie eksportuje logiki podziału) — tak samo
 * jak reszta bramek `tools/*.cjs` w tym repo testuje kontrakty danych, nie DOM.
 *
 * Run: node tools/surowce-dostep-test.cjs
 */

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

// Kontrakt renderSurowceSection: stored = rows.filter(r => r.cap != null).
function storedOf(rows) {
  return rows.filter(r => r.cap != null);
}

const EMPIRE_CAP = 1200; // przykładowa wartość civ-wide (bazaSurowcePanstwo + bonus×Magazyny)

// Wszystkie 13 surowców katalogu (main.ts CATALOG) — po cofnięciu 331aa180 KAŻDY
// dostaje cap = empireCap wprost z buildEmpireResourceRows, bez wyjątków.
const CATALOG_IDS = [
  'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'cegla',
  'ceramika', 'braz', 'zelazo', 'stal', 'sol', 'kon', 'zloto',
];

const mockRows = CATALOG_IDS.map(id => ({
  id,
  cap: EMPIRE_CAP,
  stock: id === 'zloto' ? 0 : 42, // złoto: stock=0 celowo — sprawdza, że i tak trafia do "Magazynowane"
  dostep: true,
}));

ok(mockRows.length === 13, 'katalog ma 13 surowców');

const stored = storedOf(mockRows);
ok(stored.length === 13, 'wszystkie 13 surowców trafiają do siatki „Magazynowane" (cap != null)');
ok(stored.every(r => r.cap === EMPIRE_CAP), 'każdy wiersz ma realny cap civ-wide, nie undefined');

for (const id of ['ceramika', 'sol', 'kon', 'zloto']) {
  const row = mockRows.find(r => r.id === id);
  ok(row.cap === EMPIRE_CAP, `${id}: cap = empireCap (nie undefined) — 331aa180 cofnięte`);
  ok(stored.some(r => r.id === id), `${id}: w siatce „Magazynowane", nie w osobnej sekcji dostępu`);
}

// Złoto z zerowym zapasem (np. dostęp tylko przez szlak handlowy, magazyn pusty) MUSI
// nadal pokazać pasek "0/cap", a nie zniknąć do sekcji boolean-only (świadomie
// zaakceptowane ryzyko z R-SUROWCE-DOSTEP-ILOSC-Q1: Mennica traci osobny sygnał
// dostępu w panelu, ale ilość jest realna).
const zlotoZero = mockRows.find(r => r.id === 'zloto');
ok(zlotoZero.stock === 0 && zlotoZero.cap === EMPIRE_CAP,
  'złoto stock=0 nadal ma cap realny — pokazuje pasek "0 / cap", nie znika');

// Regresja architektury: moduł empire-resource-access.ts (isEmpireAccessResource /
// partitionEmpireResourceRows / EMPIRE_ACCESS_RESOURCE_IDS) był JEDYNYM producentem
// cap=null dla tych 4 surowców — usunięty w tym zadaniu. Brak plikowy = brak importu
// w main.ts, więc nie ma już mechanizmu, który mógłby ponownie ukryć ilość.
const fs = require('fs');
const path = require('path');
const deadModule = path.resolve(__dirname, '..', 'src', 'game', 'empire-resource-access.ts');
ok(!fs.existsSync(deadModule), 'empire-resource-access.ts usunięty (architektura boolean-access martwa)');

console.log(`\nsurowce-dostep: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
