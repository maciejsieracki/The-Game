'use strict';
/**
 * node tools/wonder-transfer-on-conquest-test.cjs
 * R-WEB-WONDER-TRANSFER-ON-CONQUEST-Q1 (wariant B, decyzja właściciela 2026-11-07):
 * ukończony cud przechodzi na cywilizację kontrolującą terytorium jego hexa po zmianie właściciela
 * miasta (podbój / cesja / aneksja / rewolta / odbicie), a bonusy przeliczają się natychmiast.
 *
 * Blok A: logika czysta (game/wonder-transfer.ts + prawdziwe territoryOwnerAt + prawdziwe sumy bonusów
 *         z wonders-data.ts) -- scenariusze przed/po.
 * Blok B: bramka strukturalna main.ts -- KAŻDA ścieżka zmiany właściciela miasta jest opleciona
 *         beginWonderTransferWatch/settleWonderTransfer (main.ts nie jest bundlowany osobno).
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.wonder-transfer-entry.ts');
const bundle = path.join(__dirname, '.wonder-transfer-bundle.cjs');

fs.writeFileSync(entry, `
export { snapshotWonderTerritoryOwners, planWonderTransfers, applyWonderTransfers } from '../src/game/wonder-transfer';
export { territoryOwnerAt } from '../src/map/territory';
export { sumWonderCityYieldsForOwner, sumWonderTradeRouteBonusForOwner } from '../src/game/wonders-data';
export { fortTerritoryNodes } from '../src/game/fort-territory';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent',
});
const M = require(bundle);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (_) { /* sprzątanie best-effort */ }

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); }
}

// --- symulator: miasta + cuda; zmiana właściciela miasta owinięta migawkami jak w main.ts ---
function mkWorld(cities, wonders, forts) {
  return {
    cities: cities.map(c => ({ ...c })), wonders: wonders.map(w => ({ ...w })),
    forts: (forts || []).map(f => ({ contestedUseless: false, builtAtTurn: 1, seq: 1, ...f })),
  };
}
function nodes(w) {
  const cityN = w.cities.map(c => ({ q: c.q, r: c.r, pop: c.pop, level: 1, ownerId: c.ownerId }));
  return (w.forts && w.forts.length) ? cityN.concat(M.fortTerritoryNodes(w.forts)) : cityN;
}
function ownerAtFn(w) { const n = nodes(w); return (q, r) => M.territoryOwnerAt(q, r, n); }
function changeOwner(w, cityId, newOwner) {
  const before = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  w.cities.find(c => c.id === cityId).ownerId = newOwner;
  const after = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  const plan = M.planWonderTransfers(w.wonders, before, after);
  M.applyWonderTransfers(w.wonders, plan);
  return plan;
}
const owned = (w, o) => w.wonders.filter(x => x.ownerId === o).map(x => x.wonderId);
function changeFortOwner(w, fortQ, fortR, newOwner) {
  const before = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  w.forts.find(f => f.q === fortQ && f.r === fortR).ownerId = newOwner;
  const after = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  const plan = M.planWonderTransfers(w.wonders, before, after);
  M.applyWonderTransfers(w.wonders, plan);
  return plan;
}
const city = (w, o) => M.sumWonderCityYieldsForOwner(owned(w, o), 1);

console.log('wonder-transfer-on-conquest-test\n');

// 1. Cud w mieście (w terytorium miasta) -- podbój gracz<-AI
{
  const w = mkWorld(
    [{ id: 'A1', q: 0, r: 0, pop: 3, ownerId: 2 }, { id: 'P1', q: 20, r: 0, pop: 3, ownerId: 0 }],
    [{ wonderId: 'piramidy', q: 1, r: 1, ownerId: 2 }],
  );
  const aiBefore = city(w, 2); const meBefore = city(w, 0);
  assert(aiBefore.pieniadz === 3 && meBefore.pieniadz === 0, 'przed: bonusy piramid u AI(2), nic u gracza(0)');
  const plan = changeOwner(w, 'A1', 0);
  assert(plan.length === 1 && plan[0].fromOwnerId === 2 && plan[0].toOwnerId === 0, 'podbój: plan 2->0');
  assert(w.wonders[0].ownerId === 0, 'podbój: ownerId cudu = zdobywca');
  const aiAfter = city(w, 2); const meAfter = city(w, 0);
  assert(aiAfter.pieniadz === 0 && aiAfter.praca === 0, 'po: poprzedni właściciel traci bonusy');
  assert(meAfter.pieniadz === 3 && meAfter.praca === 3, 'po: zdobywca dostaje bonusy dokładnie raz (bez dublowania)');
  // odbicie z powrotem
  const plan2 = changeOwner(w, 'A1', 2);
  assert(plan2.length === 1 && w.wonders[0].ownerId === 2, 'odbicie: cud wraca do pierwotnego właściciela');
}

// 2. Cud poza centrum miasta, w terytorium miasta A1, ale miasto A2 tego samego właściciela trzyma go dalej
{
  const w = mkWorld(
    [{ id: 'A1', q: 0, r: 0, pop: 3, ownerId: 2 }, { id: 'A2', q: 3, r: 0, pop: 3, ownerId: 2 }],
    [{ wonderId: 'piramidy', q: 2, r: 0, ownerId: 2 }],
  );
  // najbliższe miasto hexa (2,0) to A2 (dystans 1) -- zdobycie A1 nie rusza cudu
  const plan = changeOwner(w, 'A1', 0);
  assert(plan.length === 0 && w.wonders[0].ownerId === 2, 'cud w terytorium najbliższego miasta A2: zdobycie A1 go NIE przenosi');
  const plan2 = changeOwner(w, 'A2', 0);
  assert(plan2.length === 1 && w.wonders[0].ownerId === 0, 'zdobycie A2 (najbliższe miasto cudu) przenosi cud');
}

// 3. Aneksja miasta-państwa (wiele miast naraz) i dwa cuda
{
  const w = mkWorld(
    [{ id: 'C1', q: 0, r: 0, pop: 2, ownerId: 9 }, { id: 'C2', q: 10, r: 0, pop: 2, ownerId: 9 }, { id: 'P1', q: 30, r: 0, pop: 2, ownerId: 3 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: 9 }, { wonderId: 'wiszace_ogrody', q: 10, r: 1, ownerId: 9 }],
  );
  const before = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  for (const c of w.cities.filter(c => c.ownerId === 9)) c.ownerId = 3; // annexCityStateToOwner: petla po miastach
  const after = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  const plan = M.planWonderTransfers(w.wonders, before, after);
  M.applyWonderTransfers(w.wonders, plan);
  assert(plan.length === 2 && owned(w, 3).length === 2 && owned(w, 9).length === 0, 'aneksja: oba cuda (dwa miasta) przechodzą na aneksującego');
  const sum = M.sumWonderCityYieldsForOwner(owned(w, 3), 1);
  assert(sum.pieniadz === 3 && sum.praca === 3 && sum.zywnosc === 3, 'aneksja: bonusy obu cudów sumują się u zdobywcy');
}

// 4. Gracz traci miasto na rzecz AI (symetria) + rewolta (ujemny właściciel)
{
  const w = mkWorld(
    [{ id: 'P1', q: 0, r: 0, pop: 3, ownerId: 0 }, { id: 'A1', q: 20, r: 0, pop: 3, ownerId: 2 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: 0 }],
  );
  changeOwner(w, 'P1', 2);
  assert(w.wonders[0].ownerId === 2 && city(w, 0).pieniadz === 0 && city(w, 2).pieniadz === 3, 'AI zdobywa miasto gracza: cud + bonusy przechodzą na AI');
  // ZMIANA R-WEB-WONDER-TRANSFER-FOLLOWUP-Q1 (decyzja właściciela 2026-11-07): rebelianci nie posiadają cudów.
  // Dawna asercja zakładała ownerId cudu === -99 po rewolcie; nowe oczekiwanie: cud ZOSTAJE u ostatniego
  // właściciela-cywilizacji (2), a po odbiciu przez cywilizację (0) przechodzi do odbijającego.
  const planRebel = changeOwner(w, 'P1', -99);
  assert(planRebel.length === 0 && w.wonders[0].ownerId === 2, 'rewolta: cud NIE przechodzi do rebeliantów, zostaje przy ostatnim właścicielu-cywilizacji');
  assert(city(w, 2).pieniadz === 3, 'rewolta: bonusy cudu działają dalej u ostatniego właściciela');
  changeOwner(w, 'P1', 0);
  assert(w.wonders[0].ownerId === 0, 'odbicie od rebeliantów przez cywilizację: cud przechodzi do odbijającego (nie dawnego właściciela)');
}

// 4b. Barbarzyńcy (-1): cud zostaje; odbicie przez inną cywilizację niż dawny właściciel
{
  const w = mkWorld(
    [{ id: 'P1', q: 0, r: 0, pop: 3, ownerId: 0 }, { id: 'A1', q: 20, r: 0, pop: 3, ownerId: 2 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: 0 }],
  );
  changeOwner(w, 'P1', -1);
  assert(w.wonders[0].ownerId === 0, 'barbarzyńcy zdobywają miasto: cud zostaje przy graczu');
  const plan = changeOwner(w, 'P1', 2);
  assert(plan.length === 1 && plan[0].fromOwnerId === 0 && plan[0].toOwnerId === 2 && w.wonders[0].ownerId === 2,
    'odbicie przez inną cywilizację (2): cud przechodzi do odbijającego');
  // rebelianci -> barbarzyńcy -> odbicie: nadal bez posiadania przez frakcje
  changeOwner(w, 'P1', -99);
  changeOwner(w, 'P1', -1);
  assert(w.wonders[0].ownerId === 2, 'rebelianci i barbarzyńcy kolejno: cud nadal przy cywilizacji');
  // spójność: niespójny zapis (7) nie jest przepisywany także przy odbiciu
  const w2 = mkWorld(
    [{ id: 'P1', q: 0, r: 0, pop: 3, ownerId: -99 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: 7 }],
  );
  changeOwner(w2, 'P1', 0);
  assert(w2.wonders[0].ownerId === 0, 'cud zamrożony przy cywilizacji (7) i hex u rebeliantów: odbicie przez 0 przenosi do 0');
  // stary zapis z cudem już u frakcji (-99): leczy się przy odbiciu przez cywilizację
  const w3 = mkWorld(
    [{ id: 'P1', q: 0, r: 0, pop: 3, ownerId: -99 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: -99 }],
  );
  changeOwner(w3, 'P1', 5);
  assert(w3.wonders[0].ownerId === 5, 'legacy: cud zapisany u -99 przechodzi na cywilizację odbijającą');
}

// 4c. Założenie miasta przejmuje terytorium hexa z cudem: cud przechodzi na zakładającego (jak zdobycie fortu)
{
  // fort wroga (2) r=5 pokrywa hex cudu; zakładane miasto (0) jest bliżej -> miasto ma pierwszeństwo przed fortem
  const w = mkWorld(
    [{ id: 'X1', q: 60, r: 0, pop: 1, ownerId: 5 }],
    [{ wonderId: 'piramidy', q: 2, r: 0, ownerId: 2 }],
    [{ q: 4, r: 0, ownerId: 2, type: 'fort' }],
  );
  assert(ownerAtFn(w)(2, 0) === 2, 'founding: przed założeniem hex cudu w terytorium fortu wroga');
  // jak w main.ts: migawka PRZED bez nowego miasta, miasto dodane, migawka PO
  const before = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  w.cities.push({ id: 'N1', q: 1, r: 0, pop: 1, ownerId: 0 });
  const after = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  const plan = M.planWonderTransfers(w.wonders, before, after);
  M.applyWonderTransfers(w.wonders, plan);
  assert(plan.length === 1 && w.wonders[0].ownerId === 0, 'założenie miasta na terytorium z cudem: cud przechodzi na zakładającego');
  assert(city(w, 0).pieniadz === 3 && city(w, 2).pieniadz === 0, 'założenie miasta: bonusy cudu u zakładającego w pełni (bonusy ekskluzywne u zdobywcy)');
  // miasto poza zasięgiem cudu nie rusza go
  const w2 = mkWorld(
    [{ id: 'X1', q: 60, r: 0, pop: 1, ownerId: 5 }],
    [{ wonderId: 'piramidy', q: 2, r: 0, ownerId: 2 }],
    [{ q: 4, r: 0, ownerId: 2, type: 'fort' }],
  );
  const b2 = M.snapshotWonderTerritoryOwners(w2.wonders, ownerAtFn(w2));
  w2.cities.push({ id: 'N2', q: 30, r: 0, pop: 1, ownerId: 0 });
  const p2 = M.planWonderTransfers(w2.wonders, b2, M.snapshotWonderTerritoryOwners(w2.wonders, ownerAtFn(w2)));
  assert(p2.length === 0, 'założenie miasta daleko od cudu: bez przeniesienia');
}

// 5. Ochrona migracji: niespójny zapis (ownerId != właściciel terytorium) NIE jest przepisywany
{
  const w = mkWorld(
    [{ id: 'A1', q: 0, r: 0, pop: 3, ownerId: 2 }, { id: 'B1', q: 20, r: 0, pop: 3, ownerId: 5 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: 7 }], // zapis: cud 'posiada' 7, choć hex w terytorium 2
  );
  const plan = changeOwner(w, 'B1', 0); // zdarzenie niezwiązane z terytorium cudu
  assert(plan.length === 0 && w.wonders[0].ownerId === 7, 'niespójny zapis: zdarzenie obok nie przepisuje ownerId');
  const plan2 = changeOwner(w, 'A1', 0); // zdarzenie na terytorium cudu, ale before(2) != ownerId(7)
  assert(plan2.length === 0 && w.wonders[0].ownerId === 7, 'niespójny zapis: nawet zdarzenie na jego terytorium nie zgaduje (DECISION_REQUIRED)');
}

// 6. Brak zdarzenia = brak ruchu; hex poza każdym zasięgiem (null) nie zeruje właściciela
{
  const w = mkWorld(
    [{ id: 'A1', q: 0, r: 0, pop: 1, ownerId: 2 }],
    [{ wonderId: 'piramidy', q: 1, r: 0, ownerId: 2 }],
  );
  const before = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  const plan0 = M.planWonderTransfers(w.wonders, before, before);
  assert(plan0.length === 0, 'te same migawki -> brak przeniesień');
  w.cities[0].pop = 0; // zasięg 0: hex cudu poza terytorium => after = null
  const after = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  assert(after.get('piramidy') === null && M.planWonderTransfers(w.wonders, before, after).length === 0,
    'hex poza zasięgiem (null) -> cud zostaje przy dotychczasowym właścicielu');
  const planA = [{ wonderId: 'piramidy', q: 1, r: 0, fromOwnerId: 2, toOwnerId: 0 }];
  assert(M.applyWonderTransfers(w.wonders, planA) === 1 && M.applyWonderTransfers(w.wonders, planA) === 0, 'applyWonderTransfers idempotentne');
}

// 7. Zdobycie fortu przez wejście wojska (sweepFortCaptures): hex cudu w terytorium fortu, bez miasta
{
  const w = mkWorld(
    [{ id: 'X1', q: 40, r: 0, pop: 1, ownerId: 5 }],
    [{ wonderId: 'piramidy', q: 2, r: 0, ownerId: 2 }],
    [{ q: 4, r: 0, ownerId: 2, type: 'fort' }],
  );
  const before = M.snapshotWonderTerritoryOwners(w.wonders, ownerAtFn(w));
  assert(before.get('piramidy') === 2, 'fort: hex cudu w terytorium fortu właściciela 2 (bez miasta w zasięgu)');
  const plan = changeFortOwner(w, 4, 0, 0);
  assert(plan.length === 1 && w.wonders[0].ownerId === 0 && owned(w, 2).length === 0,
    'zdobycie fortu (sweep): cud przechodzi na zdobywcę terytorium');
  assert(city(w, 0).pieniadz === 3 && city(w, 2).pieniadz === 0, 'zdobycie fortu: bonusy przeliczone (zdobywca +, poprzedni 0)');
}

// ---------------- Blok B: main.ts ----------------
const src = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
function between(re, label) {
  const m = re.exec(src);
  assert(!!m, label);
}
between(/import\s*\{[^}]*snapshotWonderTerritoryOwners[^}]*planWonderTransfers[^}]*applyWonderTransfers[^}]*\}\s*from\s*'\.\/game\/wonder-transfer';/,
  'main.ts: import wonder-transfer');
between(/function settleWonderTransfer\([^)]*\)[^{]*\{[\s\S]{0,400}?planWonderTransfers\(placedWorldWonders[\s\S]{0,200}?applyWonderTransfers\(placedWorldWonders, plan\)[\s\S]{0,1800}?syncWonderRender\(\);[\s\S]{0,200}?markCityStateDirty\(\);/,
  'main.ts: settle stosuje plan na placedWorldWonders, odświeża render i ekonomię');
between(/Zdobyto cud:[\s\S]{0,400}?Utracono cud:/, 'main.ts: powiadomienia „Zdobyto cud" / „Utracono cud"');
between(/const wonderWatchSurrender = beginWonderTransferWatch\(\);[\s\S]{0,6000}?city\.ownerId = newOwner;\s*settleWonderTransfer\(wonderWatchSurrender\);/,
  'main.ts: kapitulacja głodowa owinięta migawkami');
between(/const wonderWatchAnnex = beginWonderTransferWatch\(\);[\s\S]{0,1500}?for \(const city of csCities\) \{[\s\S]{0,500}?city\.ownerId = annexerId;[\s\S]{0,1500}?\}\s*settleWonderTransfer\(wonderWatchAnnex\);/,
  'main.ts: aneksja miasta-państwa owinięta migawkami');
between(/const wonderWatchCession = beginWonderTransferWatch\(\);[\s\S]{0,700}?city\.ownerId = toOwnerId;\s*settleWonderTransfer\(wonderWatchCession\);/,
  'main.ts: cesja w pokoju owinięta migawkami');
between(/const wonderWatchRebel = beginWonderTransferWatch\(\);[^\n]*\n\s*markCityRebellionStarted\(city\);[\s\S]{0,200}?city\.ownerId = REBEL_FACTION_OWNER_ID;\s*settleWonderTransfer\(wonderWatchRebel\);/,
  'main.ts: rewolta owinięta migawkami');
between(/const wonderWatchFort = beginWonderTransferWatch\(\);[\s\S]{0,400}?if \(evs\.length === 0\) return 0;\s*settleWonderTransfer\(wonderWatchFort\);/,
  'main.ts: zdobycie fortu (sweepFortCaptures) owinięte migawkami');
// Inwentarz przypisań właściciela miasta w main.ts (bez komentarzy). Nowe przypisanie = nowa ścieżka
// do przejrzenia: podnieś oczekiwaną liczbę dopiero po dopisaniu migawek albo jawnym uzasadnieniu.
// Zdarzenia (owinięte): 16847 kapitulacja, 33570 aneksja, 34742 cesja, 37782 rewolta.
// Nie-zdarzenia: 27240 wczytanie rebelii, 27399 i 28192 hooki testowe.
{
  const lines = src.split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l));
  const hits = lines.filter(l => /\b(city|c)\.ownerId\s*=(?!=)/.test(l));
  assert(hits.length === 7, `main.ts: inwentarz przypisań city.ownerId = 7 (znaleziono ${hits.length}); nowa ścieżka wymaga migawek`);
  const pb = fs.readFileSync(path.join(GRA, 'src', 'game', 'post-battle-map.ts'), 'utf8');
  const pbHits = pb.split('\n').filter(l => /\bcity\.ownerId\s*=(?!=)/.test(l));
  assert(pbHits.length === 1, `post-battle-map.ts: jedno przypisanie city.ownerId (podbój, wołane w migawce main.ts), znaleziono ${pbHits.length}`);
}
between(/function finalizeCityFounding\(c: City, q: number, r: number\): void \{[\s\S]{0,500}?const wonderWatchFounding = beginWonderTransferWatch\(c\);\s*finalizeCityFoundingCore\(c, q, r\);\s*settleWonderTransfer\(wonderWatchFounding\);/,
  'main.ts: założenie miasta (finalizeCityFounding) owinięte migawkami, migawka PRZED bez nowego miasta');
between(/const wonderWatchCapture = beginWonderTransferWatch\(\);[^\n]*\n\s*const lead = applyCityCaptureAfterBattle\([\s\S]{0,4000}?\);\s*settleWonderTransfer\(wonderWatchCapture\);/,
  'main.ts: podbój bojowy (applyCityCaptureToMap) owinięty migawkami');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
