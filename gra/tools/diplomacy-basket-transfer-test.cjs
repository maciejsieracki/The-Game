'use strict';
/** diplomacy-basket-transfer-test.cjs — P6 tech + surowiec boolean */
const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-basket-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-basket-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  grantTechToOwner,
  grantSurowiecBooleanAccess,
  hasSurowiecBooleanAccess,
  createEmptyBasketTransferContext,
  resetBasketTransferGrantSeq,
} from '../src/game/diplomacy-basket-transfer.ts';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const B = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) {
  if (c) { pass++; console.log('  OK:', m); }
  else { fail++; console.error('  FAIL:', m); }
}

console.log('diplomacy-basket-transfer-test');

B.resetBasketTransferGrantSeq(0);

const techCatalog = [{ Technologia: 'Garncarstwo', Epoka: 'Kamien' }];
let ctx = B.createEmptyBasketTransferContext(techCatalog);

const t1 = B.grantTechToOwner('Garncarstwo', 2, ctx);
ok(t1.granted, 'tech grant OK');
ok(t1.context.researchedByOwner.get(2)?.has('Garncarstwo'), 'tech w zbadanych owner 2');
ctx = t1.context;

const t2 = B.grantTechToOwner('Garncarstwo', 2, ctx);
ok(!t2.granted, 'duplikat tech → no-op');

const t3 = B.grantTechToOwner('NieistniejacaTech', 2, ctx);
ok(!t3.granted, 'nieznana tech odrzucona');

const s1 = B.grantSurowiecBooleanAccess('drewno', 1, 3, ctx);
ok(s1.granted, 'surowiec grant OK');
ctx = s1.context;
ok(
  B.hasSurowiecBooleanAccess('drewno', 1, 3, ctx),
  'hasSurowiecBooleanAccess true',
);
ok(
  !B.hasSurowiecBooleanAccess('drewno', 1, 2, ctx),
  'brak grantu dla innej pary',
);

const s2 = B.grantSurowiecBooleanAccess('drewno', 1, 3, ctx);
ok(!s2.granted, 'duplikat surowiec → no-op');

// -----------------------------------------------------------------------
// P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE (2026-08-09): grantTechToOwner musi
// odrzucić technologię, dla której odbiorca nie ma zbadanych prerekwizytów
// drzewka ani spełnionej bramki epoki/tieru — ta sama logika co przy normalnym
// badaniu (research.ts::canResearch), bez bramki budynku (dar nie wymaga budynku).
// -----------------------------------------------------------------------
console.log('grantTechToOwner — prereq/epoch (P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE)');

const prereqCatalog = [
  { Technologia: 'Rolnictwo', Epoka: 'Kamien', Poziom: 1 },
  { Technologia: 'Kolo', Epoka: 'Kamien', Poziom: 2, 'Wymaga (prereq)': 'Rolnictwo' },
  { Technologia: 'Brazownictwo', Epoka: 'Braz', Poziom: 1 },
];

B.resetBasketTransferGrantSeq(100);

// 1) Prereq brakuje (odbiorca 5 nie ma Rolnictwo) → odrzucone, kontekst niezmieniony.
{
  let c = B.createEmptyBasketTransferContext(prereqCatalog);
  const r = B.grantTechToOwner('Kolo', 5, c);
  ok(!r.granted, 'Kolo bez zbadanego Rolnictwo (prereq) → NIE przyznane');
  ok(!r.context.researchedByOwner.get(5)?.has('Kolo'), 'Kolo NIE trafia do zbadanych owner 5');
}

// 2) Prereq spełniony → przyznane normalnie.
{
  let c = B.createEmptyBasketTransferContext(prereqCatalog);
  const r0 = B.grantTechToOwner('Rolnictwo', 5, c);
  ok(r0.granted, 'Rolnictwo (bez prereq) → przyznane owner 5');
  c = r0.context;
  const r1 = B.grantTechToOwner('Kolo', 5, c);
  ok(r1.granted, 'Kolo PO zbadaniu Rolnictwo → przyznane owner 5');
  ok(r1.context.researchedByOwner.get(5)?.has('Kolo'), 'Kolo w zbadanych owner 5');
}

// 3) Bramka epoki (Zasada 1): Brazownictwo (epoka Braz) blokowane, dopóki cała
//    epoka Kamien (Rolnictwo + Kolo) nie jest ukończona — mimo braku formalnego
//    pola prereq na Brazownictwo.
{
  let c = B.createEmptyBasketTransferContext(prereqCatalog);
  const r = B.grantTechToOwner('Brazownictwo', 6, c);
  ok(!r.granted, 'Brazownictwo (epoka Braz) bez ukończonej epoki Kamien → NIE przyznane');
}

// 4) Bramka epoki spełniona (cała epoka Kamien ukończona) → Brazownictwo przyznane.
{
  let c = B.createEmptyBasketTransferContext(prereqCatalog);
  c = B.grantTechToOwner('Rolnictwo', 6, c).context;
  c = B.grantTechToOwner('Kolo', 6, c).context;
  const r = B.grantTechToOwner('Brazownictwo', 6, c);
  ok(r.granted, 'Brazownictwo PO ukończeniu całej epoki Kamien → przyznane');
}

// 5) STRICT-PARITY: identyczna reguła niezależnie od toOwnerId — gracz (0) traktowany
//    tak samo jak AI (owner 5/6 powyżej), bez specjalnej gałęzi ownerId===0.
{
  let c = B.createEmptyBasketTransferContext(prereqCatalog);
  const r = B.grantTechToOwner('Kolo', 0, c);
  ok(!r.granted, 'PARITY: Kolo bez prereq odrzucone RÓWNIEŻ dla owner 0 (gracz), nie tylko AI');
}

// 6) Bez techCatalog (wołający nie przekazał katalogu) → walidacja prereq pominięta,
//    zachowanie kompatybilne wstecz (jak istniejąca walidacja "nieznana technologia").
{
  let c = B.createEmptyBasketTransferContext(undefined);
  const r = B.grantTechToOwner('CokolwiekBezKatalogu', 7, c);
  ok(r.granted, 'brak techCatalog → walidacja prereq pominięta (kompatybilność wsteczna)');
}

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
