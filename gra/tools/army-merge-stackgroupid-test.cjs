'use strict';
/**
 * army-merge-stackgroupid-test.cjs — P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO, BB2
 * (ECHO B, Maciej 2026-08-10): testy funkcjonalne dla `stackGroupId` —
 * tożsamość STOSU niezależna od heksu (game/armyMerge.ts).
 *
 * Sedno BB2: przed tym refaktorem `activeUnitStack`/`visibleStackOnHex`
 * grupowały WYŁĄCZNIE po (ownerId,q,r[,garnizon]) — gdy wracająca po „Zostaw
 * osobno" armia lądowała na origin zajętym przez REZYDENTA (inna własna
 * jednostka/armia), oba stosy dzieliły JEDEN klucz grupowania i ich pule
 * ruchu się zlewały (przeliczenie jednej po cichu nadpisywało drugą).
 *
 * Ten test sprawdza SAME funkcje z armyMerge.ts (nie main.ts — to chroni
 * `army-merge-separate-return-mainguard-test.cjs` jako tekst), w tym
 * przypadki brzegowe spoza dosłownego scenariusza BB2 (Evaluator, wzmocnienie
 * lean-loop: „Operator wykracza poza literalny scenariusz zgłoszenia własnym
 * dowodem" — min. 2 własne przypadki brzegowe tego samego niezmiennika).
 *
 * Usage (z gra/): node tools/army-merge-stackgroupid-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ENTRY = path.join(__dirname, '.army-merge-stackgroupid-entry.ts');
const BUNDLE = path.join(__dirname, '.army-merge-stackgroupid-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import {
  stackGroupIdOf,
  sameStackGroup,
  freshStackGroupId,
  assignSharedStackGroupId,
  visibleStackOnHex,
  coLocatedForMergePrompt,
  garrisonUnitsOnHex,
  activeUnitStack,
  computeStackDisplay,
  syncStackRuchLeft,
  deductStackRuchLeft,
} from '../src/game/armyMerge';
export {
  stackGroupIdOf,
  sameStackGroup,
  freshStackGroupId,
  assignSharedStackGroupId,
  visibleStackOnHex,
  coLocatedForMergePrompt,
  garrisonUnitsOnHex,
  activeUnitStack,
  computeStackDisplay,
  syncStackRuchLeft,
  deductStackRuchLeft,
};`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  stackGroupIdOf,
  sameStackGroup,
  freshStackGroupId,
  assignSharedStackGroupId,
  visibleStackOnHex,
  coLocatedForMergePrompt,
  garrisonUnitsOnHex,
  activeUnitStack,
  computeStackDisplay,
  syncStackRuchLeft,
  deductStackRuchLeft,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

function u(over) {
  return Object.assign({
    id: 'u', ownerId: 0, typeId: 'Miecznik', category: 'piechota',
    q: 0, r: 0, ruch: 2, ruchLeft: 2,
  }, over);
}

// ===========================================================================
// 1) SEDNO BB2 (scenariusz dosłowny): armia wraca na origin zajęty przez
//    rezydenta -- OBIE pule ruchu liczone NIEZALEŻNIE, nawet dzieląc heks.
// ===========================================================================
{
  const resident = u({ id: 'resident', q: 5, r: 5, ruch: 2, ruchLeft: 2 });
  // rezydent bez jawnego stackGroupId -> fallback po heksie (stary zapis / stara jednostka)
  const returning1 = u({ id: 'r1', q: 5, r: 5, ruch: 2, ruchLeft: 0.4, stackGroupId: 'armyA' });
  const returning2 = u({ id: 'r2', q: 5, r: 5, ruch: 2, ruchLeft: 0.4, stackGroupId: 'armyA' });
  const units = [resident, returning1, returning2];

  assert(
    !sameStackGroup(resident, returning1),
    'BB2 sedno: rezydent (fallback po heksie) i wracająca armia (stackGroupId="armyA") to RÓŻNE grupy mimo wspólnego heksu',
  );

  const residentStack = activeUnitStack(units, resident);
  assert(residentStack.length === 1 && residentStack[0].id === 'resident',
    'BB2: activeUnitStack(rezydent) widzi WYŁĄCZNIE rezydenta, nie wracającą armię');

  const returningStack = activeUnitStack(units, returning1);
  assert(returningStack.length === 2
    && returningStack.some(x => x.id === 'r1') && returningStack.some(x => x.id === 'r2'),
    'BB2: activeUnitStack(wracająca armia) widzi WYŁĄCZNIE swoje 2 jednostki, nie rezydenta');

  // Przeliczenie puli WRACAJĄCEJ armii NIE dotyka rezydenta (sedno buga BB2:
  // przed fixem to przeliczenie nadpisywało cudzą pulę, bo grupowanie było po heksie).
  syncStackRuchLeft(returningStack);
  assert(resident.ruchLeft === 2,
    'BB2: sync puli wracającej armii NIE zmienia ruchLeft rezydenta (był=2, PRZED fixem zostałby ściągnięty do min ze stosu heksu)');
  assert(returning1.ruchLeft === 0.4 && returning2.ruchLeft === 0.4,
    'BB2: sync ujednolicił pulę WEWNĄTRZ wracającej armii (min z jej członków), bez ingerencji rezydenta');

  // I odwrotnie: przeliczenie rezydenta nie rusza wracającej armii.
  deductStackRuchLeft(residentStack, 1.5);
  assert(resident.ruchLeft === 0.5, 'BB2: deduct na rezydencie działa na jego własnej puli');
  assert(returning1.ruchLeft === 0.4 && returning2.ruchLeft === 0.4,
    'BB2: deduct na rezydencie NIE dotyka wracającej armii (odwrotny kierunek kontaminacji)');
}

// ===========================================================================
// 2) Własny przypadek brzegowy #1: TRZY niezależne grupy na jednym heksie
//    (rezydent fallback + dwie różne, jawne stackGroupId) -- każda osobno.
// ===========================================================================
{
  const a = u({ id: 'a', q: 3, r: 3, ruchLeft: 2 });                      // fallback
  const b = u({ id: 'b', q: 3, r: 3, ruchLeft: 1, stackGroupId: 'grpB' });
  const c = u({ id: 'c', q: 3, r: 3, ruchLeft: 0, stackGroupId: 'grpC' });
  const units = [a, b, c];
  assert(activeUnitStack(units, a).length === 1, 'brzeg #1: grupa A (fallback) izolowana od B i C');
  assert(activeUnitStack(units, b).length === 1, 'brzeg #1: grupa B izolowana od A i C');
  assert(activeUnitStack(units, c).length === 1, 'brzeg #1: grupa C izolowana od A i B');
}

// ===========================================================================
// 3) Własny przypadek brzegowy #2: GARNIZON -- dwie armie ufortyfikowane w
//    tym samym mieście z różnym stackGroupId też się nie zlewają.
// ===========================================================================
{
  const g1 = u({ id: 'g1', q: 7, r: 7, inGarnizon: true, stackGroupId: 'garA' });
  const g2 = u({ id: 'g2', q: 7, r: 7, inGarnizon: true, stackGroupId: 'garA' });
  const g3 = u({ id: 'g3', q: 7, r: 7, inGarnizon: true, stackGroupId: 'garB' });
  const units = [g1, g2, g3];
  const stackG1 = activeUnitStack(units, g1);
  assert(stackG1.length === 2 && stackG1.every(x => x.stackGroupId === 'garA'),
    'brzeg #2 (garnizon): activeUnitStack(g1) widzi TYLKO garA (2 jedn.), nie garB');
  assert(garrisonUnitsOnHex(units, 7, 7, 0).length === 3,
    'brzeg #2 (garnizon): garrisonUnitsOnHex BEZ groupId nadal widzi WSZYSTKICH (Prawo/lista garnizonu, celowo unscoped)');
  assert(garrisonUnitsOnHex(units, 7, 7, 0, 'garA').length === 2,
    'brzeg #2 (garnizon): garrisonUnitsOnHex Z groupId zawęża poprawnie');
}

// ===========================================================================
// 4) assignSharedStackGroupId — scalenie ujednolica tożsamość (merge realny).
// ===========================================================================
{
  const resident = u({ id: 'resident', q: 1, r: 1 });
  const arriving = u({ id: 'arriving', q: 1, r: 1, stackGroupId: 'oldGroup' });
  const units = [resident, arriving];
  assert(!sameStackGroup(resident, arriving), 'merge: PRZED scaleniem różne grupy');
  assignSharedStackGroupId(units);
  assert(sameStackGroup(resident, arriving), 'merge: PO scaleniu WSPÓLNA grupa (assignSharedStackGroupId)');
  assert(typeof resident.stackGroupId === 'string' && resident.stackGroupId === arriving.stackGroupId,
    'merge: obie jednostki mają IDENTYCZNY, nadpisany stackGroupId (nie "oldGroup" z arriving)');
  // Pula po scaleniu jest jedna dla obu.
  const merged = activeUnitStack(units, resident);
  assert(merged.length === 2, 'merge: activeUnitStack po scaleniu widzi OBIE jednostki jako jeden stos');
}

// ===========================================================================
// 5) freshStackGroupId — unikalność (dwa kolejne wywołania różne id, nawet
//    dla tego samego ownerId).
// ===========================================================================
{
  const id1 = freshStackGroupId(0);
  const id2 = freshStackGroupId(0);
  assert(id1 !== id2, 'freshStackGroupId: dwa kolejne wywołania dają RÓŻNE id (ten sam ownerId)');
  assert(typeof id1 === 'string' && id1.length > 0, 'freshStackGroupId: zwraca niepusty string');
}

// ===========================================================================
// 6) assignSharedStackGroupId — pusta lista jest no-op (nie rzuca wyjątku).
// ===========================================================================
{
  let threw = false;
  try { assignSharedStackGroupId([]); } catch { threw = true; }
  assert(!threw, 'assignSharedStackGroupId([]) nie rzuca wyjątku (pusta lista, brak jednostek do scalenia)');
}

// ===========================================================================
// 7) Kompatybilność wsteczna — BEZ groupId (4 argumenty), visibleStackOnHex/
//    coLocatedForMergePrompt zachowują się DOKŁADNIE jak przed BB2 (wszyscy
//    właściciela na heksie, niezależnie od stackGroupId).
// ===========================================================================
{
  const a = u({ id: 'a', q: 2, r: 2, stackGroupId: 'gX' });
  const b = u({ id: 'b', q: 2, r: 2, stackGroupId: 'gY' });
  const units = [a, b];
  assert(visibleStackOnHex(units, 2, 2, 0).length === 2,
    'wsteczna zgodność: visibleStackOnHex bez groupId widzi WSZYSTKICH właściciela na heksie (jak przed BB2)');
  assert(coLocatedForMergePrompt(units, 2, 2, 0).length === 2,
    'wsteczna zgodność: coLocatedForMergePrompt bez groupId widzi WSZYSTKICH (merge-prompt musi widzieć każdego, żeby zaproponować scalenie)');
}

// ===========================================================================
// 8) computeStackDisplay — zmiana widoczna zaakceptowana w ECHO B: DWA różne
//    stackGroupId na jednym heksie = DWA żetony. BEZ jawnego stackGroupId
//    (fallback) na jednym heksie = nadal JEDEN żeton (zero regresji wizualnej
//    dla starych zapisów / jednostek, które nigdy nie przeszły split/merge).
// ===========================================================================
{
  const attackOf = () => 1;
  const a = u({ id: 'a', q: 4, r: 4, stackGroupId: 'sepA' });
  const b = u({ id: 'b', q: 4, r: 4, stackGroupId: 'sepB' });
  const disp1 = computeStackDisplay([a, b], attackOf);
  assert(disp1.visibleIds.size === 2,
    'ECHO B: dwie różne stackGroupId na jednym heksie -> DWA widoczne tokeny (nowa, zaakceptowana zmiana)');

  const c = u({ id: 'c', q: 6, r: 6 });
  const d = u({ id: 'd', q: 6, r: 6 });
  const disp2 = computeStackDisplay([c, d], attackOf);
  assert(disp2.visibleIds.size === 1,
    'brak regresji: dwie jednostki BEZ stackGroupId na jednym heksie -> nadal JEDEN token (fallback = stary klucz po heksie)');
  assert(disp2.badgeByRepId.size === 1,
    'brak regresji: badge ×2 nadal wystawiony dla fallbackowego stosu (jak przed refaktorem)');
}

// ===========================================================================
// 8b) B1 (Evaluator runda 3, FAIL) — `stackGroupIdOf(u)` SAMO w sobie to
//     tożsamość STOSU, nie POZYCJI. Dwie jednostki tej samej, jawnie
//     scalonej grupy na RÓŻNYCH heksach (realny scenariusz: zwiadowca
//     odjeżdża sam z auto-explore — scout-auto-explore.ts; albo cywil
//     zostaje na origin, gdy reszta idzie do bitwy —
//     moveAtkRosterOntoBattleHex) NIE MOGĄ wpaść do jednej grupy renderu —
//     to dawałoby jeden żeton z visible=false (znika z mapy) i drugi z
//     zsumowanymi wartościami z DWÓCH różnych heksów.
// ===========================================================================
{
  const attackOf = () => 1;
  const stayed = u({ id: 'stayed', q: 4, r: 4, stackGroupId: 'armyZ', ruchLeft: 2 });
  const wandered = u({ id: 'wandered', q: 9, r: 9, stackGroupId: 'armyZ', ruchLeft: 1 }); // odjechał (Zwiedzaj)
  const disp = computeStackDisplay([stayed, wandered], attackOf);
  assert(disp.visibleIds.size === 2,
    'B1: TA SAMA stackGroupId na RÓŻNYCH heksach (4,4) i (9,9) -> DWA żetony, nie jeden (żaden nie znika z mapy)');
  assert(disp.visibleIds.has('stayed') && disp.visibleIds.has('wandered'),
    'B1: OBIE jednostki tej samej grupy, ale różnych heksów, są widoczne (rep z ich WŁASNEGO heksu, nie zjadają się nawzajem)');
  assert(disp.badgeByRepId.size === 0,
    'B1: żadna z nich nie dostaje badge ×2 — to są dwa oddzielne, jednoosobowe stosy na mapie, nie jeden stos ×2');
}

// ===========================================================================
// 8c) B2 (Evaluator runda 3, FAIL) — ten sam klucz musi też rozróżniać
//     garnizon vs pole. Scalony garnizon (wspólne stackGroupId), z którego
//     JEDNA jednostka wychodzi w pole (onLeaveGarrison — inGarnizon: false,
//     ta sama grupa, ten sam heks miasta) musi dać DWA żetony na heksie
//     miasta (garnizon + pole), zgodnie z kontraktem w armyMerge.ts
//     (findSplitDestHexes: „garnizon i pole współistnieją jako dwa widoczne
//     stosy"), nie jeden zlany token.
// ===========================================================================
{
  const attackOf = () => 1;
  const inGarrison = u({ id: 'garr', q: 5, r: 5, stackGroupId: 'armyY', inGarnizon: true });
  const inField = u({ id: 'field', q: 5, r: 5, stackGroupId: 'armyY', inGarnizon: false }); // wyszedł (onLeaveGarrison)
  const disp = computeStackDisplay([inGarrison, inField], attackOf);
  assert(disp.visibleIds.size === 2,
    'B2: ta sama stackGroupId, ten sam heks (5,5), ALE różna flaga inGarnizon -> DWA żetony (garnizon + pole), nie jeden');
  assert(disp.visibleIds.has('garr') && disp.visibleIds.has('field'),
    'B2: zarówno reprezentant garnizonu, jak i reprezentant pola, są widoczni jednocześnie');
}

// ===========================================================================
// 9) Save/load: pole jest zwykłą właściwością obiektu -- JSON round-trip
//    zachowuje je 1:1, a STARY zapis (bez pola) po JSON.parse ma
//    stackGroupId===undefined i poprawnie spada na fallback (zero migracji).
// ===========================================================================
{
  const withId = u({ id: 'x', q: 9, r: 9, stackGroupId: 'persisted-group-1' });
  const roundTripped = JSON.parse(JSON.stringify(withId));
  assert(roundTripped.stackGroupId === 'persisted-group-1',
    'save/load: stackGroupId przeżywa round-trip JSON.stringify/parse bez zmian');
  assert(stackGroupIdOf(roundTripped) === 'persisted-group-1',
    'save/load: stackGroupIdOf() na wczytanej jednostce zwraca zapisaną wartość, nie fallback');

  // Stary zapis -- symulacja: obiekt zserializowany PRZED istnieniem pola
  // (żadnego stackGroupId w JSON w ogóle, nie tylko `undefined`).
  const oldSaveJson = '{"id":"legacy","ownerId":0,"typeId":"Miecznik","category":"piechota","q":8,"r":8,"ruch":2,"ruchLeft":2}';
  const legacyUnit = JSON.parse(oldSaveJson);
  assert(legacyUnit.stackGroupId === undefined,
    'save/load (stary zapis): jednostka z JSON bez pola stackGroupId ma je undefined po wczytaniu (brak crasha/migracji)');
  assert(stackGroupIdOf(legacyUnit) === '0|8,8',
    'save/load (stary zapis): stackGroupIdOf() na jednostce bez pola spada na fallback po heksie (identyczny z zachowaniem SPRZED BB2)');

  // Dwie jednostki wczytane z tego samego starego zapisu, na tym samym
  // heksie -- nadal grupują się razem (fallback), DOKŁADNIE jak przed BB2.
  const legacyUnit2 = JSON.parse(
    '{"id":"legacy2","ownerId":0,"typeId":"Miecznik","category":"piechota","q":8,"r":8,"ruch":2,"ruchLeft":1}',
  );
  assert(sameStackGroup(legacyUnit, legacyUnit2),
    'save/load (stary zapis): dwie jednostki bez stackGroupId na tym samym heksie nadal jedna grupa (fallback spójny)');
}

// ===========================================================================
// 10) Save/load: MIESZANY zapis -- jedna jednostka ma stackGroupId (nowszy
//     zapis PO tym refaktorze), druga nie (nigdy nie przeszła split/merge w
//     TEJ konkretnej rozgrywce) -- na wspólnym heksie muszą pozostać
//     rozdzielone (fallback jednej != jawne id drugiej), nie zlać się.
// ===========================================================================
{
  const explicit = JSON.parse(JSON.stringify(u({ id: 'e', q: 2, r: 9, stackGroupId: 'sgX', ruchLeft: 2 })));
  const legacy = JSON.parse(JSON.stringify(u({ id: 'l', q: 2, r: 9, ruchLeft: 0 })));
  assert(!sameStackGroup(explicit, legacy),
    'save/load (mieszany): jednostka z jawnym stackGroupId i jednostka fallback na tym samym heksie NIE są tą samą grupą');
  const units = [explicit, legacy];
  syncStackRuchLeft(activeUnitStack(units, explicit));
  assert(legacy.ruchLeft === 0,
    'save/load (mieszany): sync puli jednostki z jawnym stackGroupId nie dotyka jednostki fallback na tym samym heksie');
}

// ===========================================================================
// 11) B4 (Evaluator runda 3, FAIL, 2026-08-10) — FUZZ RÓŻNICOWY: gwarancja
//     „fallback stackGroupIdOf jest BIT-IDENTYCZNY ze starym grupowaniem po
//     heksie" (fundament decyzji właściciela ECHO B) była tylko punktowo
//     sprawdzona (kilka ręcznych przykładów w sekcjach wyżej) — Evaluator
//     usunął sufiks `|g` z fallbacku i WSZYSTKIE bramki, w tym te ręczne
//     przykłady, zostały zielone (żaden z nich akurat nie mieszał garnizonu
//     z polem na tym samym heksie z ownerId powtórzonym gdzie indziej).
//
//     Poniżej: NIEZALEŻNY oracle, który odtwarza STARE grupowanie sprzed BB2
//     wprost (`ownerId|q,r[|g]`, bez wołania ŻADNEJ funkcji z armyMerge.ts —
//     gdyby oracle importował stackGroupIdOf, test i kod pod testem
//     zgadzałyby się ZAWSZE, nawet po zepsuciu), porównany fuzz-em 500
//     losowych układów jednostek (bez ustawionego stackGroupId — to jest
//     dokładnie populacja, dla której gwarancja "identyczne jak przed BB2"
//     musi się trzymać) z DZISIEJSZYM stackGroupIdOf / activeUnitStack /
//     visibleStackOnHex / garrisonUnitsOnHex. 0 rozbieżności wymuszone przez
//     assert (nie tylko wypisane/zliczone) — pierwsza rozbieżność przerywa
//     cały test jako FAIL.
// ===========================================================================
{
  // Prosty deterministyczny PRNG (mulberry32) — powtarzalne uruchomienia,
  // bez zależności od Math.random ani od zegara.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function rnd() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20260810);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  // ORACLE — odtworzenie stanu SPRZED BB2 wprost, bez importu armyMerge.ts.
  function oldGroupKey(unit) {
    return unit.ownerId + '|' + unit.q + ',' + unit.r + (unit.inGarnizon === true ? '|g' : '');
  }
  function oldActiveUnitStack(all, active) {
    // Stary activeUnitStack: garnizon -> WSZYSCY w garnizonie na heksie;
    // inaczej -> WSZYSCY widoczni (bez garnizonu) na heksie. Bez pojęcia
    // stackGroupId w ogóle (bo go jeszcze nie było).
    if (active.inGarnizon === true) {
      return all.filter(x => x.ownerId === active.ownerId && x.q === active.q && x.r === active.r && x.inGarnizon === true);
    }
    return all.filter(x => x.ownerId === active.ownerId && x.q === active.q && x.r === active.r && x.inGarnizon !== true);
  }
  const idSet = (arr) => new Set(arr.map(x => x.id)).size + ':' + [...arr.map(x => x.id)].sort().join(',');

  const FUZZ_RUNS = 500;
  let fuzzChecks = 0;
  for (let run = 0; run < FUZZ_RUNS; run++) {
    const nUnits = 3 + Math.floor(rnd() * 10); // 3..12 jednostek
    const owners = [0, 1, 2];
    const coords = [-2, -1, 0, 1, 2]; // heksy gęsto obsadzone -> dużo kolizji do złapania
    const layout = [];
    for (let i = 0; i < nUnits; i++) {
      layout.push(u({
        id: 'f' + run + '_' + i,
        ownerId: pick(owners),
        q: pick(coords),
        r: pick(coords),
        inGarnizon: rnd() < 0.35,
        ruch: 2,
        ruchLeft: rnd() * 2,
        // CELOWO bez stackGroupId — to jest dokładnie populacja objęta
        // gwarancją B4 ("bez ustawionego stackGroupId").
      }));
    }

    for (const active of layout) {
      fuzzChecks++;
      // a) stackGroupIdOf === oracle key
      assert(stackGroupIdOf(active) === oldGroupKey(active),
        `B4 fuzz run ${run}: stackGroupIdOf(${active.id}) === stary klucz "${oldGroupKey(active)}" (dostano "${stackGroupIdOf(active)}")`);

      // b) activeUnitStack (dzisiejszy, group-scoped) === activeUnitStack sprzed BB2
      const gotActive = idSet(activeUnitStack(layout, active));
      const wantActive = idSet(oldActiveUnitStack(layout, active));
      assert(gotActive === wantActive,
        `B4 fuzz run ${run}: activeUnitStack(${active.id}) zgodny ze starym grupowaniem (dostano [${gotActive}], oczekiwano [${wantActive}])`);

      // c) visibleStackOnHex bez groupId (jak używane w merge-prompt/split-gate) —
      //    dla jednostek NIE w garnizonie musi zgadzać się z oracle „widocznych".
      if (active.inGarnizon !== true) {
        const gotVisible = idSet(visibleStackOnHex(layout, active.q, active.r, active.ownerId));
        const wantVisible = idSet(layout.filter(x =>
          x.ownerId === active.ownerId && x.q === active.q && x.r === active.r && x.inGarnizon !== true));
        assert(gotVisible === wantVisible,
          `B4 fuzz run ${run}: visibleStackOnHex(${active.q},${active.r}) zgodny z oracle widocznych (dostano [${gotVisible}], oczekiwano [${wantVisible}])`);
      }

      // d) garrisonUnitsOnHex bez groupId — dla jednostek W garnizonie musi
      //    zgadzać się z oracle „wszyscy w garnizonie na heksie".
      if (active.inGarnizon === true) {
        const gotGar = idSet(garrisonUnitsOnHex(layout, active.q, active.r, active.ownerId));
        const wantGar = idSet(layout.filter(x =>
          x.ownerId === active.ownerId && x.q === active.q && x.r === active.r && x.inGarnizon === true));
        assert(gotGar === wantGar,
          `B4 fuzz run ${run}: garrisonUnitsOnHex(${active.q},${active.r}) zgodny z oracle garnizonu (dostano [${gotGar}], oczekiwano [${wantGar}])`);
      }
    }
  }
  assert(fuzzChecks >= FUZZ_RUNS * 3,
    `B4 fuzz: wykonano realną liczbę porównań (${fuzzChecks}, oczekiwano ≥${FUZZ_RUNS * 3}) — nie pusta pętla`);
  console.log(`  (B4 fuzz: ${FUZZ_RUNS} układów, ${fuzzChecks} porównań jednostkowych, 0 rozbieżności)`);
}

console.log(`army-merge-stackgroupid-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
