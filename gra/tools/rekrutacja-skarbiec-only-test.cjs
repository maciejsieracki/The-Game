'use strict';
/**
 * P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B.
 * Testuje czystą bramkę kolejki Pracy i migrację starych zapisów:
 * jednostka nie może zostać zakolejkowana za Pracę, a jej stary postęp
 * wraca do puli właściciela zamiast pozostać martwym wpisem.
 *
 * Uruchomienie: z katalogu gra: node tools/rekrutacja-skarbiec-only-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entry = path.resolve(__dirname, '.rekrutacja-skarbiec-only-entry.ts');
const bundle = path.resolve(__dirname, '.rekrutacja-skarbiec-only-bundle.cjs');
fs.writeFileSync(entry, `
  export {
    enqueue,
    sanitizeBuildQueue,
    enqueueRecruitment,
  } from '../src/game/production';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: bundle,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
  });
} catch (error) {
  console.error('[rekrutacja-skarbiec-only-test] bundling failed:', error.message || error);
  process.exit(1);
}

const { enqueue, sanitizeBuildQueue, enqueueRecruitment } = require(bundle);
let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else {
    failed++;
    console.error('FAIL:', message);
  }
}

const building = { kind: 'budynek', id: 'spichlerz', nazwa: 'Spichlerz', koszt: 20 };
const unitFront = { kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 40 };
const unitWaiting = { ...unitFront, id: 'Łucznik', nazwa: 'Łucznik', postep: 7 };
const paidRecruit = { ...unitFront, koszt: 40 };

console.log('\n-- kolejka Pracy odrzuca jednostkę --');
const base = { kolejka: [building], postep: 3, rekrutacja: [paidRecruit] };
const rejected = enqueue(base, unitFront);
assert(rejected.kolejka.length === 1 && rejected.kolejka[0].id === 'spichlerz',
  'enqueue(unit) nie dodaje jednostki do kolejki budynków');
assert(rejected.rekrutacja.length === 1 && rejected.rekrutacja[0].id === 'Wojownik',
  'odrzucenie jednostki nie usuwa legalnej kolejki rekrutacji');

console.log('\n-- migracja starego save: front + oczekująca jednostka --');
const legacy = {
  kolejka: [
    { ...unitFront, postep: undefined },
    unitWaiting,
    building,
  ],
  postep: 11,
  wstrzymana: false,
  rekrutacja: [paidRecruit],
};
const migrated = sanitizeBuildQueue(legacy);
assert(migrated.prod.kolejka.length === 1 && migrated.prod.kolejka[0].id === 'spichlerz',
  'migracja usuwa wszystkie jednostki z kolejki Pracy');
assert(migrated.refundedPraca === 18,
  'migracja zwraca aktywny postęp frontu i postęp oczekującej jednostki');
assert(migrated.prod.rekrutacja.length === 1 && migrated.prod.rekrutacja[0].id === 'Wojownik',
  'migracja zachowuje legalną kolejkę zakupionych jednostek');
assert(migrated.prod.postep === 0,
  'po usunięciu frontu jednostki budynek nie dziedziczy jej postępu');

console.log('\n-- edge case: jednostka oczekująca bez postępu --');
const onlyWaiting = sanitizeBuildQueue({
  kolejka: [{ ...unitWaiting, postep: undefined }, building],
  postep: 0,
});
assert(onlyWaiting.refundedPraca === 0 && onlyWaiting.prod.kolejka.length === 1,
  'brak postępu nie tworzy ujemnego ani fałszywego zwrotu');

console.log('\n-- mutacja: wejście pozostaje niezmienione --');
const mutationInput = { kolejka: [unitFront, building], postep: 4 };
const mutationResult = sanitizeBuildQueue(mutationInput);
mutationInput.kolejka[0].id = 'Zmieniono';
assert(mutationResult.prod.kolejka[0].id === 'spichlerz',
  'wynik migracji nie wskazuje na zmutowany wpis legacy');

console.log('\n-- kontrakt ścieżek gracz/AI --');
const mainSource = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
const aiUnitBranch = mainSource.slice(
  mainSource.indexOf("} else if (item.kind === 'jednostka')"),
  mainSource.indexOf('                  }\n                  continue;', mainSource.indexOf("} else if (item.kind === 'jednostka')")),
);
assert(aiUnitBranch.includes('purchaseRecruitmentUnit(cmd.cityId, candId, item.koszt, ownerId)'),
  'AI jednostkę kieruje do zakupu za Skarbiec');
assert(!aiUnitBranch.includes('enqueue(prod0, item)'),
  'AI nie dodaje jednostki do kolejki Pracy');
const cityPanelSource = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'ui', 'cityPanel.ts'), 'utf8');
const addItemUnitBranch = cityPanelSource.slice(
  cityPanelSource.indexOf("} else if (item.kind === 'jednostka')"),
  cityPanelSource.indexOf('\n  }\n  setProd(city.id, enqueue', cityPanelSource.indexOf("} else if (item.kind === 'jednostka')")),
);
assert(addItemUnitBranch.includes('return;'),
  'panel budowy odrzuca jednostkę zamiast dodawać ją za Pracę');

console.log(`\nrekrutacja-skarbiec-only-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch (_) {}
try { fs.unlinkSync(bundle); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);
