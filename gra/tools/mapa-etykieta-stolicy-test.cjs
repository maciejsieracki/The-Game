'use strict';
/**
 * mapa-etykieta-stolicy-test.cjs
 * R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — bramka rundy 2 (R2-1 + R2-2).
 *
 * ZGŁOSZENIE (właściciel, 2026-09-04, ze zrzutem mapy): „czasem miasta danej cywilizacji,
 * zamiast nazywać się z listy miast, nazywają się Chińczycy. (…) tak jak Ateny były dla
 * Grecji czy Rzym dla Rzymian".
 *
 * DWA STANY, KTÓRE TA BRAMKA ODRZUCA — oba realnie istniały:
 *  - stan sprzed tematu: plakietka obcej stolicy = nazwa CYWILIZACJI („CHIŃCZYCY");
 *  - stan rundy 1: oba człony („Xi'an · Chińczycy") — pomiar prawdziwym fontem wobec budżetu
 *    `cityMapStatChip.ts:769` dał 14/15 stolic przyciętych, u Zulusów człon cywilizacji
 *    znikał w całości. ECHO właściciela po pomiarze: „Sama nazwa miasta, bez cywilizacji".
 * Stan docelowy jest TRZECI: sama nazwa miasta. Sekcja (A) sprawdza oba odrzucone warianty
 * jawnie, żeby cofnięcie w którąkolwiek stronę czerwieniło bramkę.
 *
 * CO JESZCZE DOWODZI (R2-2, sekcja E): stolica AI bierze nazwę z `miasta_cywilizacji[0]`,
 * a nie z puli miast-państw `miasta_panstwa[0]` — Chińczycy `Xi'an`, nie `Qin` (nazwa państwa
 * i dynastii, dosłownie napis ze zrzutu właściciela); Słowianie `Kijów`, nie `Kiev`.
 * Sekcja (F) spina jedno z drugim: to, co pula daje stolicy AI, wchodzi na plakietkę.
 *
 * Dane czytane z `gra/data/*.json` — asercje porównują z ŹRÓDŁEM (pula), nie z przepisanym
 * literałem, żeby test nie był kopią implementacji.
 *
 * Usage (z gra/):  node tools/mapa-etykieta-stolicy-test.cjs
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.mapa-etykieta-stolicy-entry.ts');
const bundle = path.join(__dirname, '.mapa-etykieta-stolicy-bundle.cjs');

fs.writeFileSync(entry, `
export {
  formatCityMapLabel,
  formatEntityDisplayName,
  foreignCapitalMapName,
  resolveOwnerBaseName,
  isTechnicalOwnerLabel,
  CITY_STATE_LABEL,
  CITY_STATE_SEPARATOR,
} from '../src/game/display-names';
export {
  foreignCapitalCityName,
  clusterRivalCityName,
  playerStartCityName,
  pickAiFoundCityName,
} from '../src/game/civ-names';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);
const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-names-pools.json'), 'utf8'));
const civs = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'civs.json'), 'utf8'));

let passed = 0;
let failed = 0;
function assert(cond, label, got) {
  if (cond) { passed++; console.log('  [OK] ' + label); }
  else {
    failed++;
    console.log('  [FAIL] ' + label + (got === undefined ? '' : ' — otrzymano: ' + JSON.stringify(got)));
  }
}

const SEP = M.CITY_STATE_SEPARATOR;
const MP_SUFFIX = SEP + M.CITY_STATE_LABEL;

/** Etykieta obcej stolicy na mapie — dokładnie to, co woła `render/cities.ts::_cityMapLabel`. */
function capitalLabel(cityName, civ, extra) {
  return M.formatCityMapLabel(
    { name: cityName, ownerId: 5, startCityState: false },
    Object.assign({ playerOwnerId: 0, isCapital: true, civDisplayName: civ }, extra || {}),
  );
}

// ---------------------------------------------------------------------------
// (A) R2-1 — obca stolica niesie SAMĄ nazwę miasta
// ---------------------------------------------------------------------------
console.log('\n-- (A) obca stolica: sama nazwa miasta --');

const XIAN = capitalLabel("Xi'an", 'Chińczycy');

assert(XIAN === "Xi'an",
  '(A1) etykieta obcej stolicy = sama nazwa miasta', XIAN);

assert(!XIAN.includes('Chińczycy') && !XIAN.includes(SEP.trim()),
  '(A2) bez członu cywilizacji i bez separatora', XIAN);

assert(XIAN !== 'Chińczycy',
  '(A3) NIE stan sprzed tematu (nazwa cywilizacji na plakietce)', XIAN);

assert(XIAN !== "Xi'an" + SEP + 'Chińczycy',
  '(A4) NIE stan rundy 1 (dwa człony, 14/15 stolic przycięte)', XIAN);

// PARYTET Z ŻYWEGO KODU, nie z literału: stolica ma być podpisana jak KAŻDE inne obce
// miasto — korona zostaje jedynym znakiem stolicy. Prawa strona liczona tą samą funkcją.
const SAME_CITY_NOT_CAPITAL = M.formatCityMapLabel(
  { name: "Xi'an", ownerId: 5, startCityState: false },
  { playerOwnerId: 0, isCapital: false, civDisplayName: 'Chińczycy' },
);
assert(XIAN === SAME_CITY_NOT_CAPITAL,
  '(A5) stolica podpisana identycznie jak zwykłe obce miasto (parytet z żywego kodu)',
  { stolica: XIAN, zwykle: SAME_CITY_NOT_CAPITAL });

// ---------------------------------------------------------------------------
// (B) R2-1 — degradacje: nigdy pusto, nigdy separator-sierota
// ---------------------------------------------------------------------------
console.log('\n-- (B) degradacje --');

assert(M.isTechnicalOwnerLabel('Rywal 7') === true,
  '(B1) „Rywal 7" jest rozpoznany jako nazwa techniczna (założenie B2)');

const TECH_CITY = capitalLabel('Rywal 7', 'Chińczycy');
assert(TECH_CITY === 'Chińczycy',
  '(B2) obca stolica bez realnej nazwy miasta → sama nazwa cywilizacji', TECH_CITY);

assert(TECH_CITY.trim().length > 0 && !TECH_CITY.includes(SEP.trim()),
  '(B3) degradacja nie daje pustej etykiety ani separatora-sieroty', TECH_CITY);

const TECH_CIV = capitalLabel('Neapol', 'AI 4');
assert(M.isTechnicalOwnerLabel('AI 4') === true && TECH_CIV === 'Neapol',
  '(B4) techniczna nazwa CYWILIZACJI odfiltrowana → zostaje nazwa miasta', TECH_CIV);

const BOTH_TECH = capitalLabel('Rywal 7', 'AI 4');
assert(BOTH_TECH.trim().length > 0,
  '(B5) oba człony techniczne → etykieta nadal niepusta (stare zachowanie)', BOTH_TECH);

assert(M.foreignCapitalMapName('Rywal 7', 'AI 4') === '',
  '(B6) `foreignCapitalMapName` sygnalizuje brak nazwy pustym stringiem, nie placeholderem');

// ---------------------------------------------------------------------------
// (C) REGRESJA: wszystko poza obcą stolicą bit w bit jak przed tematem
// ---------------------------------------------------------------------------
console.log('\n-- (C) reszta etykiet DOKŁADNIE jak dziś --');

assert(
  M.formatCityMapLabel(
    { name: 'Sparta', ownerId: 3, startCityState: true },
    { playerOwnerId: 0, isCapital: true, civDisplayName: 'Grecja' },
  ) === 'Sparta' + MP_SUFFIX,
  '(C1) państwo-miasto → „Sparta · miasto-państwo" (bez zmian)');

assert(
  M.formatCityMapLabel(
    { name: 'Mykeny', ownerId: 7, startCityState: false },
    { playerOwnerId: 0, isCapital: true, civDisplayName: 'Grecja', isCityStateOwner: true },
  ) === 'Mykeny',
  '(C2) isCityStateOwner nadal blokuje podmianę (bez zmian)');

assert(
  M.formatCityMapLabel(
    { name: 'Neapol', ownerId: 5, startCityState: false },
    { playerOwnerId: 0, isCapital: false, civDisplayName: 'Rzym' },
  ) === 'Neapol',
  '(C3) zwykłe obce miasto (nie stolica) → sama nazwa miasta (bez zmian)');

assert(
  M.formatCityMapLabel(
    { name: 'Ateny', ownerId: 0, startCityState: false },
    { playerOwnerId: 0, isCapital: true, civDisplayName: 'Grecja' },
  ) === 'Ateny',
  '(C4) stolica gracza → własna nazwa miasta (bez zmian)');

assert(
  M.formatCityMapLabel(
    { name: 'Korynt', ownerId: 0, startCityState: false },
    { playerOwnerId: 0, isCapital: false, civDisplayName: 'Grecja' },
  ) === 'Korynt',
  '(C5) zwykłe miasto gracza → własna nazwa miasta (bez zmian)');

assert(
  M.formatCityMapLabel({ name: 'Neapol', ownerId: 5, startCityState: false }) === 'Neapol',
  '(C6) wołanie BEZ opcji (cityPanel.ts) → stare zachowanie');

assert(
  capitalLabel('Neapol', undefined) === 'Neapol',
  '(C7) obca stolica bez nazwy cywilizacji → nazwa miasta (bez zmian)');

// ŚCIEŻKA DYPLOMACJI (`main.ts::ownerDiploLabel`): ta sama `resolveOwnerBaseName`,
// `isClusterCapital: true` — nazwa PAŃSTWA ma zostać. To bramka przeciw rozlaniu zmiany
// z plakietki na dyplomację/HUD.
assert(
  M.resolveOwnerBaseName({
    ownerId: 3, cached: 'Hattusa', cityName: 'Hattusa', civDisplayName: 'Hetyci',
    isCityState: false, isClusterCapital: true,
  }) === 'Hetyci',
  '(C8) dyplomacja/HUD → nadal sama nazwa nacji „Hetyci"');

assert(
  M.resolveOwnerBaseName({
    ownerId: 3, cityName: 'Sparta', civDisplayName: 'Grecja', isCityState: true,
  }) === 'Sparta' + SEP + 'Grecja',
  '(C9) rdzeń etykiety państwa-miasta („Sparta · Grecja") nietknięty');

// ---------------------------------------------------------------------------
// (D) strażnik zakresu w źródle
// ---------------------------------------------------------------------------
console.log('\n-- (D) strażnik zakresu --');

const dnSrc = fs.readFileSync(path.join(GRA, 'src', 'game', 'display-names.ts'), 'utf8');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const citiesSrc = fs.readFileSync(path.join(GRA, 'src', 'render', 'cities.ts'), 'utf8');

// Pole/parametr, nie wzmianka w komentarzu historycznym: `nazwa:`, `nazwa?:`, `nazwa =`.
assert(!/clusterCapitalWithCityName\s*[:?=]/.test(dnSrc),
  '(D1) opt-in `clusterCapitalWithCityName` z rundy 1 usunięty z KODU — brak martwego pokrętła');
assert(!/foreignCapitalMapName/.test(mainSrc),
  '(D2) main.ts NIE woła ścieżki mapy — dyplomacja/HUD poza zakresem tematu');
assert(/formatCityMapLabel\(city,\s*\{/.test(citiesSrc)
  && !/foreignCapitalMapName/.test(citiesSrc),
  '(D3) render/cities.ts karmi etykietę bez nowych pól — dane były tam już wcześniej');

// ---------------------------------------------------------------------------
// (E) R2-2 — stolica AI bierze nazwę z miasta_cywilizacji[0], nie z miasta_panstwa[0]
// ---------------------------------------------------------------------------
console.log('\n-- (E) R2-2: źródło nazwy stolicy AI --');

const CHIN = M.foreignCapitalCityName(civs, 'chinczycy', pools);
assert(CHIN === "Xi'an", '(E1) stolica AI Chińczyków = „Xi\'an"', CHIN);
assert(CHIN !== 'Qin' && CHIN !== pools.chinczycy.miasta_panstwa[0],
  '(E2) NIE „Qin" — nazwa państwa/dynastii z puli miast-państw', CHIN);

const SLOW = M.foreignCapitalCityName(civs, 'slowianie', pools);
assert(SLOW === 'Kijów', '(E3) stolica AI Słowian = „Kijów"', SLOW);
assert(SLOW !== 'Kiev' && SLOW !== pools.slowianie.miasta_panstwa[0],
  '(E4) NIE „Kiev" z puli miast-państw', SLOW);

const mismatched = Object.keys(pools).filter(
  (k) => M.foreignCapitalCityName(civs, k, pools) !== pools[k].miasta_cywilizacji[0],
);
assert(mismatched.length === 0,
  '(E5) WSZYSTKIE cywilizacje: stolica AI = miasta_cywilizacji[0] (parytet ze źródłem)',
  mismatched);

// REGRESJA R2-2: pula miast-państw dalej obsługuje miasta-państwa klastra.
assert(M.clusterRivalCityName(civs, 'chinczycy', 1, pools) === pools.chinczycy.miasta_panstwa[1],
  '(E6) miasta-państwa klastra nadal z miasta_panstwa[1..] (bez zmian)');
// (E7) ZMIENIONA W RUNDZIE 3 (R3-2). Do rundy 2 ta asercja brzmiała
//   `M.playerStartCityName(civs, 'chinczycy', pools) === pools.chinczycy.miasta_panstwa[0]`
// czyli utrwalała `Qin` — stan, w którym stolica GRACZA szła z puli MIAST-PAŃSTW. Runda 2
// świadomie zostawiła tę ścieżkę poza zakresem (R2-2 mówiło o stolicy AI) i zapisała stan
// w bramce, żeby nie zmienił się po cichu. Właściciel rozstrzygnął (ECHO rundy 3: „Naprawić
// teraz, w rundzie 3"), więc stara wartość utrwala już defekt: `Qin` to nazwa państwa
// i dynastii, nie miasta — dokładnie ta pomyłka, którą właściciel zgłosił dla AI.
const PLAYER_CHIN = M.playerStartCityName(civs, 'chinczycy', pools);
assert(PLAYER_CHIN === pools.chinczycy.miasta_cywilizacji[0],
  '(E7) stolica GRACZA-Chińczyka = miasta_cywilizacji[0] („Xi\'an") — R3-2', PLAYER_CHIN);
assert(PLAYER_CHIN !== 'Qin' && PLAYER_CHIN !== pools.chinczycy.miasta_panstwa[0],
  '(E7a) NIE „Qin" z puli miast-państw (wartość utrwalona przez bramkę rundy 2)', PLAYER_CHIN);

const PLAYER_SLOW = M.playerStartCityName(civs, 'slowianie', pools);
assert(PLAYER_SLOW === 'Kijów' && PLAYER_SLOW !== pools.slowianie.miasta_panstwa[0],
  '(E7b) stolica GRACZA-Słowianina = „Kijów", nie „Kiev"', PLAYER_SLOW);

const playerMismatched = Object.keys(pools).filter(
  (k) => M.playerStartCityName(civs, k, pools) !== pools[k].miasta_cywilizacji[0],
);
assert(playerMismatched.length === 0,
  '(E7c) WSZYSTKIE 15 cywilizacji: stolica gracza = miasta_cywilizacji[0]', playerMismatched);

// PARYTET gracz/AI (zasada nadrzędna projektu) — ta sama pula, ta sama pozycja.
assert(Object.keys(pools).every(
  (k) => M.playerStartCityName(civs, k, pools) === M.foreignCapitalCityName(civs, k, pools),
), '(E7d) parytet: stolica gracza i stolica AI tej samej cywilizacji czytają to samo źródło');

// BRAK DUPLIKATU W JEDNEJ PARTII (kryterium 4 rundy 3). Obce klastry pomijają typ gracza
// (`cluster-spawn.ts:332`), a rywale tego samego typu biorą `miasta_panstwa[1..]`
// (`clusterRivalCityName`), więc nazwa stolicy gracza nie może paść drugi raz.
const PLAYER_CIV = 'chinczycy';
const nazwyPartii = [];
for (let i = 1; i <= 9; i++) nazwyPartii.push(M.clusterRivalCityName(civs, PLAYER_CIV, i, pools));
for (const k of Object.keys(pools)) {
  if (k === PLAYER_CIV) continue;                      // obce klastry pomijają typ gracza
  nazwyPartii.push(M.foreignCapitalCityName(civs, k, pools));
  for (let i = 1; i <= 9; i++) nazwyPartii.push(M.clusterRivalCityName(civs, k, i, pools));
}
assert(!nazwyPartii.includes(M.playerStartCityName(civs, PLAYER_CIV, pools)),
  '(E7e) nazwa stolicy gracza nie powtarza się w żadnym innym mieście startowym partii');

// KOLEJNE miasta AI: pula regularna, bez duplikatu nazwy stolicy.
const NEXT_AI = M.pickAiFoundCityName(
  pools, 'chinczycy',
  [{ ownerId: 5, name: CHIN }],
  () => 'chinczycy',
  5,
);
assert(NEXT_AI === pools.chinczycy.miasta_cywilizacji[1],
  '(E8) kolejne miasto AI = następna wolna z miasta_cywilizacji, bez duplikatu stolicy', NEXT_AI);

// ---------------------------------------------------------------------------
// (F) SPRZĘŻENIE R2-1 + R2-2 — to, co daje pula, ląduje na plakietce
// ---------------------------------------------------------------------------
console.log('\n-- (F) sprzężenie: pula → plakietka --');

const CHIN_LABEL = M.formatCityMapLabel(
  { name: CHIN, ownerId: 5, startCityState: false },
  { playerOwnerId: 0, isCapital: true, civDisplayName: 'Chińczycy' },
);
assert(CHIN_LABEL === "Xi'an",
  '(F1) stolica AI Chińczyków na mapie: „Xi\'an" (zrzut rundy 1 pokazywał „QIN · CHIŃCZ…")',
  CHIN_LABEL);

const SLOW_LABEL = M.formatCityMapLabel(
  { name: SLOW, ownerId: 6, startCityState: false },
  { playerOwnerId: 0, isCapital: true, civDisplayName: 'Słowianie' },
);
assert(SLOW_LABEL === 'Kijów', '(F2) stolica AI Słowian na mapie: „Kijów"', SLOW_LABEL);

const allLabels = Object.keys(pools).map((k) => M.formatCityMapLabel(
  { name: M.foreignCapitalCityName(civs, k, pools), ownerId: 5, startCityState: false },
  { playerOwnerId: 0, isCapital: true, civDisplayName: pools[k].nazwa_pl },
));
assert(allLabels.every((l, i) => l === pools[Object.keys(pools)[i]].miasta_cywilizacji[0]),
  '(F3) wszystkie 15 stolic AI: plakietka = pierwsze miasto cywilizacji, nic więcej');

// ---------------------------------------------------------------------------
// (G) R3-1 + R4-1 — budżet szerokości nazwy na plakietce (trzy konfiguracje slotów)
// ---------------------------------------------------------------------------
// Ta bramka jest ARYTMETYCZNA, nie graficzna: node nie ma canvasu, więc szerokości fontu
// mierzy osobny dowód w żywym Chromium
// (`dyspozycje/autobot/runs/R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1/dowody/
//   pomiar-plakietki-runda-4.cjs`, prawdziwe `makeCityMapBadgeSprite`).
// Tu utrwalone są nierówności, które ten pomiar dał, żeby cofnięcie bazy albo jej
// nadmierne podniesienie czerwieniło bramkę bez uruchamiania przeglądarki.
console.log('\n-- (G) R3-1 + R4-1: budżet szerokości nazwy --');

const chipSrc = fs.readFileSync(path.join(GRA, 'src', 'render', 'cityMapStatChip.ts'), 'utf8');
const num = (re, nazwa) => {
  const m = chipSrc.match(re);
  if (!m) throw new Error('Nie znalazłem stałej ' + nazwa + ' w cityMapStatChip.ts');
  return Number(m[1]);
};
const BASE = num(/CITY_NAME_BUDGET_BASE\s*=\s*(\d+)/, 'CITY_NAME_BUDGET_BASE');
const PROD_W = num(/PROD_SLOT_W\s*=\s*(\d+)/, 'PROD_SLOT_W');
const CROWN_W = num(/CAPITAL_CROWN_SLOT_W\s*=\s*(\d+)/, 'CAPITAL_CROWN_SLOT_W');
const MAX_SCALE = num(/BADGE_MAX_TOTAL_SCALE\s*=\s*(\d+)/, 'BADGE_MAX_TOTAL_SCALE');

assert(/maxNameW\s*=\s*CITY_NAME_BUDGET_BASE\s*-\s*prodW\s*-\s*growthW\s*-\s*crownW/.test(chipSrc),
  '(G1) budżet nazwy liczony od CITY_NAME_BUDGET_BASE (nie od literału 200)');

// Najdłuższe `miasta_cywilizacji[0]` = zuluskie `uMgungundlovu`; 213,9 px zmierzone w żywym
// Chromium fontem `700 22px Georgia` (pomiar rundy 2 i rundy 3, ta sama liczba).
const NAJDLUZSZA_STOLICA_PX = 213.9;
const najdluzsza = Object.keys(pools)
  .map((k) => pools[k].miasta_cywilizacji[0])
  .reduce((a, b) => (b.length > a.length ? b : a));
assert(najdluzsza === 'uMgungundlovu',
  '(G2) najdłuższe pierwsze miasto cywilizacji w pulach to nadal „uMgungundlovu"', najdluzsza);

assert(BASE - CROWN_W >= NAJDLUZSZA_STOLICA_PX,
  '(G3) budżet stolicy OBCEJ (korona, bez glifu produkcji i bez slotu WZROST%) mieści '
  + 'najdłuższą stolicę',
  BASE - CROWN_W);
assert(BASE - CROWN_W - PROD_W >= NAJDLUZSZA_STOLICA_PX,
  '(G4) budżet stolicy OBCEJ (korona + glif produkcji, bez slotu WZROST%) mieści najdłuższą '
  + 'stolicę — 0/15 przyciętych w TEJ konfiguracji, nie we wszystkich',
  BASE - CROWN_W - PROD_W);

// R4-1 — TRZECIA konfiguracja, najciaśniejsza, bo G3/G4 jej NIE obejmują: WŁASNA stolica
// gracza dostaje jeszcze slot WZROST% (`render/cities.ts` — `getCityGrowth` wołane wyłącznie
// dla miast gracza), a ten slot wchodzi do tego samego budżetu (`cityMapStatChip.ts`:
// `CITY_NAME_BUDGET_BASE - prodW - growthW - crownW`). W rundzie 3 była tylko RAPORTOWANA
// (decyzja właściciela była otwarta); po ratyfikacji rundy 4 jest pełnoprawnym kryterium.
//
// KOREKTA LICZBY Z RUNDY 3: tamten pomiar wziął szerokość slotu z literału „−100,0%" (51,7 px),
// którego `formatCityGrowthPercentLabel` NIE potrafi wydać — dla −100 zwraca „−100%" (część
// ułamkowa tylko gdy istnieje). Najszerszy zapis dla realnej wartości to „−99,9%" = 45 px
// (`700 13px Arial`, szerokość liczona jak w produkcji, przez `Math.ceil`; pomiar prawdziwym
// formatterem w żywym Chromium: dowody/pomiar-plakietki-runda-4.cjs). Minimum arytmetyczne
// spada więc z 304,6 do 297,9 px — a mimo to bazą jest 305, patrz G7 niżej.
const GROWTH_MAX_PX = 45;
const BAZA_MINIMALNA_STOLICA_GRACZA = 297.9;
const wymaganaGracz = NAJDLUZSZA_STOLICA_PX + CROWN_W + PROD_W + GROWTH_MAX_PX;
assert(Math.abs(wymaganaGracz - BAZA_MINIMALNA_STOLICA_GRACZA) < 0.5,
  '(G6a) minimalna baza dla WŁASNEJ stolicy gracza (korona + glif produkcji + WZROST%) '
  + 'to 297,9 px — zmiana szerokości któregokolwiek slotu unieważnia tę liczbę',
  wymaganaGracz.toFixed(1));
assert(BASE - CROWN_W - PROD_W - GROWTH_MAX_PX >= NAJDLUZSZA_STOLICA_PX,
  '(G6) budżet WŁASNEJ stolicy gracza (korona + glif produkcji + WZROST%) mieści najdłuższą '
  + 'stolicę — 0/15 przyciętych w TRZECIEJ, najciaśniejszej konfiguracji',
  BASE - CROWN_W - PROD_W - GROWTH_MAX_PX);

// G7 — DLACZEGO 305, a nie minimalne 298. Przy 298 zapas nad zuluską nazwą wynosi 0,1 px
// i znika przy pierwszym zapisie WZROST% szerszym niż „−99,9%" (np. „−100,5%" ≈ 49 px).
// Baza 305 przepuszcza slot WZROST% do 52 px. Ta asercja utrwala właśnie ten zapas, nie samą
// liczbę 305: obniżenie bazy do minimum czerwieni bramkę, zamiast po cichu zjeść margines.
const GROWTH_SLOT_ZAPAS_PX = 52;
assert(BASE - CROWN_W - PROD_W - GROWTH_SLOT_ZAPAS_PX >= NAJDLUZSZA_STOLICA_PX,
  '(G7) baza zostawia zapas na slot WZROST% do ' + GROWTH_SLOT_ZAPAS_PX + ' px — najdłuższa '
  + 'stolica nie wpadnie w wielokropek przy skrajnym zapisie wzrostu',
  BASE - CROWN_W - PROD_W - GROWTH_SLOT_ZAPAS_PX);

// Sufit od góry: `BADGE_MAX_TOTAL_SCALE` opiera się na tym, że najszersza plakietka razy
// mnożnik mieści się w gwarantowanym w WebGL2 MAX_TEXTURE_SIZE = 2048. Zmierzone prawdziwym
// `makeCityMapBadgeSprite` (dowody/pomiar-plakietki-runda-4.cjs): przy bazie 305 najszersza
// plakietka 15 stolic ma 426 px CSS (przy bazie 260 — 385 px). Bramka NIE utrwala pomiaru,
// tylko NAJGORSZY przypadek policzony z układu pigułki: pełny komplet slotów (tarcza obrony
// 22 + odstęp 8, medalion 38 + 8, korona 19 + 8, WZROST% i glif produkcji z odstępami,
// kółko populacji 30, dwa marginesy 10) przy nazwie wykorzystującej cały budżet daje
// `W ≤ BASE + 158` — sloty WZROST%/glif skracają nazwę o dokładnie tyle, ile same zajmują.
const SLOTY_POZA_NAZWA_PX = 158;
const WEBGL2_MIN_MAX_TEXTURE = 2048;
assert((BASE + SLOTY_POZA_NAZWA_PX) * MAX_SCALE <= WEBGL2_MIN_MAX_TEXTURE,
  '(G5) najszersza plakietka × sufit skali nadal mieści się w 2048 px tekstury',
  Math.round((BASE + SLOTY_POZA_NAZWA_PX) * MAX_SCALE));

console.log('\n[mapa-etykieta-stolicy-test] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
