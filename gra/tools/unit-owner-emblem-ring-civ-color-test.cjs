'use strict';

// R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1: obwódka medalionu właściciela na tabliczce
// jednostki ma barwę DANEJ cywilizacji (ringHex), a miasto-państwo i barbarzyńcy
// zachowują stałe barwy. Test jednostkowy na module render/unitOwnerEmblem.ts
// (bez przeglądarki): kanwa 2D jest atrapą, która zapisuje ustawiane barwy.

const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const THREE = require(path.resolve(__dirname, '..', 'node_modules', 'three'));

const ROOT = path.resolve(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ring-civ-color-test-'));
const ENTRY = path.join(TMP, 'entry.ts');
const OUT = path.join(TMP, 'entry.cjs');
const BRASS = '#e8d88a';
const SILVER = '#b9c8d8';
const RED = '#c84040';
let pass = 0;
let fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS:', label); }
  else { fail++; console.error('FAIL:', label, detail ?? ''); }
}

/** Atrapa kanwy 2D: zapisuje każdą barwę obwódki (strokeStyle) rysowaną na kanwie. */
function installDomStub() {
  const made = [];
  global.document = {
    createElement(tag) {
      if (tag !== 'canvas') throw new Error('unexpected element ' + tag);
      const strokes = [];
      const canvas = {
        width: 0, height: 0,
        strokes,
        getContext() {
          const ctx = {
            fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: '', textBaseline: '',
            clearRect() {}, beginPath() {}, arc() {}, fill() {}, stroke() {}, clip() {},
            save() {}, restore() {}, fillText() {}, drawImage() {},
          };
          let current = ctx.strokeStyle;
          Object.defineProperty(ctx, 'strokeStyle', {
            get() { return current; },
            set(v) { current = v; strokes.push(v); },
          });
          return ctx;
        },
      };
      made.push(canvas);
      return canvas;
    },
  };
  return made;
}

function ctxOf(civId, ringHex, extra = {}) {
  return { civId, era: 1, isCityState: false, isBarbarian: false, ringHex, ...extra };
}

async function main() {
  const made = installDomStub();
  try {
    const src = fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8');
    check('main.ts podaje rezolwerowi barwę cywilizacji (ringHex) z tej samej funkcji co obwódka heksu',
      /ringHex:\s*isBarbarian\(ownerId\)\s*\|\|\s*portraitForceCultureIcon\(ownerId\)\s*\?\s*null\s*:\s*civRingHexFn\(ownerId\)/.test(src)
      && /function civRingHexFn\(ownerId: number\): string \{\s*return '#' \+ civColorFn\(ownerId\)\.toString\(16\)\.padStart\(6, '0'\);/.test(src));

    fs.writeFileSync(ENTRY,
      `export * from ${JSON.stringify(path.join(ROOT, 'src/render/unitOwnerEmblem.ts'))};\n`);
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
      outfile: OUT, logLevel: 'silent',
    });
    const emb = require(OUT);
    // Bez wstrzykniętych assetów nie ma ładowania obrazków (brak Image w node).
    emb.setUnitOwnerEmblemAssets(null);

    const greeks = ctxOf('grecy', '#1e5aa8');
    const persians = ctxOf('persowie', '#c41e3a');
    const greeksAgain = ctxOf('grecy', '#1e5aa8');

    check('dwie pełne cywilizacje o różnych barwach mają różne klucze emblematu',
      emb.ownerEmblemKey(greeks) !== emb.ownerEmblemKey(persians));
    check('ta sama cywilizacja z tą samą barwą ma ten sam klucz (jedna tekstura)',
      emb.ownerEmblemKey(greeks) === emb.ownerEmblemKey(greeksAgain));

    const texGreeks = emb.ownerEmblemTexture(greeks);
    const texPersians = emb.ownerEmblemTexture(persians);
    const texGreeksAgain = emb.ownerEmblemTexture(greeksAgain);
    check('dwie różne barwy obwódki → dwie różne tekstury medalionu',
      !!texGreeks && !!texPersians && texGreeks !== texPersians);
    check('ten sam kolor → jedna tekstura (cache)',
      texGreeks === texGreeksAgain);
    check('obwódka cywilizacji rysowana jest jej własną barwą (1. barwa na kanwie)',
      made[0] && made[0].strokes[0] === '#1e5aa8', made[0] && made[0].strokes);
    check('druga cywilizacja rysuje swoją barwę, nie barwę pierwszej',
      made[1] && made[1].strokes[0] === '#c41e3a', made[1] && made[1].strokes);

    const noColor = ctxOf('lidzie', null);
    const badColor = ctxOf('lidzie2', 'nie-kolor');
    emb.ownerEmblemTexture(noColor);
    emb.ownerEmblemTexture(badColor);
    check('brak barwy → fallback mosiądz (dotychczasowe zachowanie)',
      made[2].strokes[0] === BRASS, made[2].strokes);
    check('nieprawidłowa barwa → fallback mosiądz',
      made[3].strokes[0] === BRASS, made[3].strokes);

    const cs = { civId: 'grecy', era: 1, isCityState: true, isBarbarian: false, ringHex: '#1e5aa8' };
    const barb = { civId: null, era: 1, isCityState: false, isBarbarian: true, ringHex: '#1e5aa8' };
    emb.ownerEmblemTexture(cs);
    emb.ownerEmblemTexture(barb);
    check('miasto-państwo ma stałe srebro, mimo podanej barwy cywilizacji',
      made[4].strokes[0] === SILVER, made[4].strokes);
    check('barbarzyńcy mają stałą czerwień, mimo podanej barwy cywilizacji',
      made[5].strokes[0] === RED, made[5].strokes);
    check('klucz miasta-państwa i barbarzyńców nie zależy od barwy cywilizacji',
      emb.ownerEmblemKey(cs) === emb.ownerEmblemKey({ ...cs, ringHex: null })
      && emb.ownerEmblemKey(barb) === 'barb');

    const dark = ctxOf('mrok', '#1b1b1b');
    emb.ownerEmblemTexture(dark);
    check('ciemna barwa cywilizacji jest zapisana bez zmian (czytelność sprawdzana zrzutem)',
      made[6].strokes[0] === '#1b1b1b', made[6].strokes);

    check('barwa z wielkich liter jest normalizowana do lowercase (ten sam klucz)',
      emb.ownerEmblemKey(ctxOf('grecy', '#1E5AA8')) === emb.ownerEmblemKey(greeks));

    const sample = new THREE.Group();
    emb.applyUnitOwnerEmblem(sample, greeks);
    check('applyUnitOwnerEmblem nadal tworzy sprite dla pełnej cywilizacji',
      sample.children.length === 1);
  } finally {
    delete global.document;
    fs.rmSync(TMP, { recursive: true, force: true });
  }
  console.log(`\nunit-owner-emblem-ring-civ-color-test: ${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exit(1); });
