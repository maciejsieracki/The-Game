#!/usr/bin/env node
/**
 * diplo-json-descriptions-sync-test.cjs — R-WEB-DIPLO-JSON-DESCRIPTIONS-SYNC-Q1.
 *
 * Sprawdza, czy OPISOWE fragmenty gra/data/diplomacy.json (tabele referencyjne
 * i opisy akcji dla gracza) zgadzają się z parametrami czytanymi przez kod:
 *   - gra/data/diplomacy.json            (sekcja `params`, opisy)
 *   - gra/src/game/diplomacy.ts          (DIPLOMACY_PARAMS, dZ w switch zdarzeń)
 *
 * Test nie zmienia żadnych danych. Zawiera samo-test mutacji: zmiana liczby
 * w opisie musi zostać wykryta (czerwień testu, gdy opis rozjedzie się z kodem).
 *
 * Uruchom: node gra/tools/diplo-json-descriptions-sync-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const JSON_PATH = path.join(GRA, 'data', 'diplomacy.json');
const TS_PATH = path.join(GRA, 'src', 'game', 'diplomacy.ts');

const MINUS = '−'; // znak minus używany w tekstach dla gracza

let fails = 0;
let checks = 0;
function ok(cond, msg) {
  checks += 1;
  if (!cond) {
    fails += 1;
    console.log('  FAIL: ' + msg);
  }
  return !!cond;
}

/** Parsuje blok DIPLOMACY_PARAMS z pliku TS (wartości liczbowe). */
function parseDiplomacyParams(src) {
  const start = src.indexOf('export const DIPLOMACY_PARAMS');
  if (start < 0) throw new Error('brak DIPLOMACY_PARAMS w diplomacy.ts');
  const endRel = src.slice(start).search(/\n\} as const;/);
  const block = src.slice(start, start + endRel);
  const out = {};
  const re = /^\s+(\w+):\s*(-?\d+(?:\.\d+)?),/gm;
  let m;
  while ((m = re.exec(block))) out[m[1]] = Number(m[2]);
  return out;
}

/** Wartość dZ przypisywana w gałęzi switch `case '<name>':` (pierwsze `dZ = N;`). */
function caseDZ(src, caseName) {
  const i = src.indexOf(`case '${caseName}':`);
  if (i < 0) return null;
  const m = /dZ = (-?\d+)\s*;/.exec(src.slice(i, i + 900));
  return m ? Number(m[1]) : null;
}

function walk(node, fn) {
  if (Array.isArray(node)) {
    node.forEach((n) => walk(n, fn));
  } else if (node && typeof node === 'object') {
    fn(node);
    Object.values(node).forEach((v) => walk(v, fn));
  }
}

function findAkcja(data, prefix) {
  const list = Array.isArray(data.akcje_dyplomatyczne) ? data.akcje_dyplomatyczne : [];
  return list.find((a) => typeof a.Akcja === 'string' && a.Akcja.startsWith(prefix)) || null;
}

/**
 * Zwraca listę niezgodności opisów z parametrami/kodem.
 * @param data  sparsowany diplomacy.json
 * @param code  { params, zerwanieTraktatu, zerwanieHandlu } z diplomacy.ts
 * @returns { fails: string[], checks: number }
 */
function checkDescriptions(data, code) {
  const out = [];
  let n = 0;
  const expect = (cond, msg) => {
    n += 1;
    if (!cond) out.push(msg);
  };
  const P = code.params;

  // 1. Religia nie wpływa na Zaufanie: każdy wiersz religii (tabela zdarzeń i tabela Δ/turę) = 0.
  let religiaRows = 0;
  walk(data, (o) => {
    const name = o['Zdarzenie / Działanie'] || o['Stan / zdarzenie ciągłe'];
    if (typeof name !== 'string' || !/religi/i.test(name)) return;
    religiaRows += 1;
    const v = o['Zmiana'] !== undefined ? o['Zmiana'] : o['Δ Zaufanie/turę'];
    const zero = v === 0 || (typeof v === 'string' && /^0(\s|$)/.test(v));
    expect(zero, `wiersz religii „${name}” podaje wpływ ${JSON.stringify(v)} (kod: 0)`);
  });
  expect(religiaRows >= 4, `oczekiwano >= 4 wierszy religii, znaleziono ${religiaRows}`);
  expect(P.wspolnaReligia_zaufanie_perTura === 0 && P.odmiennaReligia_zaufanie_perTura === 0,
    'params religii != 0 — opis „brak wpływu” jest wtedy niezgodny z kodem');

  // 2. Kara za sąsiedztwo: −3/−4/−5 wg epoki, wiersz tabeli Δ/turę = epoka Kamienia.
  expect(P.ekspansjaGranica_zaufanie_perTura === -3
    && P.ekspansjaGranicaBraz_zaufanie_perTura === -4
    && P.ekspansjaGranicaZelazo_zaufanie_perTura === -5,
  'params kary za sąsiedztwo != −3/−4/−5 — opis w JSON jest wtedy niezgodny');
  let granicaRows = 0;
  walk(data, (o) => {
    const name = o['Zdarzenie / Działanie'] || o['Stan / zdarzenie ciągłe'];
    if (typeof name !== 'string' || !/^(Ekspansja|Ekspansja przy granicy)/.test(name)) return;
    granicaRows += 1;
    if (o['Zmiana'] !== undefined) {
      expect(String(o['Zmiana']).includes('-3') && String(o['Zmiana']).includes('-4')
        && String(o['Zmiana']).includes('-5'),
      `wiersz „${name}” podaje ${JSON.stringify(o['Zmiana'])} (kod: −3/−4/−5 wg epoki)`);
    } else {
      expect(o['Δ Zaufanie/turę'] === P.ekspansjaGranica_zaufanie_perTura,
        `wiersz „${name}” podaje Δ ${o['Δ Zaufanie/turę']} (kod: ${P.ekspansjaGranica_zaufanie_perTura})`);
    }
  });
  expect(granicaRows >= 2, `oczekiwano >= 2 wierszy kary za sąsiedztwo, znaleziono ${granicaRows}`);

  // 3. Pakt o nieagresji: próg Relacji i Zaufania oraz kara za złamanie.
  const nap = findAkcja(data, '2. Pakt');
  expect(nap !== null, 'brak akcji „2. Pakt …”');
  if (nap) {
    expect(nap.Opis.includes(`Relacji ≥ ${P.progNapRelacja}`),
      `opis paktu NAP bez progu „Relacji ≥ ${P.progNapRelacja}”`);
    expect(nap.Opis.includes(`Zaufania ≥ ${P.progNapZaufanie}`),
      `opis paktu NAP bez progu „Zaufania ≥ ${P.progNapZaufanie}”`);
    const karaZ = `${MINUS}${Math.abs(P.zlamanaPaktGracz_zaufanie)} Zaufanie`;
    expect(nap.Opis.includes(karaZ),
      `opis paktu NAP bez kary „${karaZ}” (params.zlamanaPaktGracz_zaufanie = ${P.zlamanaPaktGracz_zaufanie})`);
  }

  // 4. Sojusz: wypowiedzenie = zerwanie traktatu (kod: zerwanie_traktatu).
  const sojusz = findAkcja(data, '3. Sojusz');
  expect(sojusz !== null, 'brak akcji „3. Sojusz …”');
  if (sojusz) {
    const want = `${MINUS}${Math.abs(code.zerwanieTraktatu)} Zaufanie`;
    expect(sojusz.Opis.includes(want),
      `opis sojuszu bez kary wypowiedzenia „${want}” (kod: zerwanie_traktatu)`);
  }

  // 5. Traktat handlowy: zerwanie −10 Zaufania (kod: zerwanie_handlu), przyrost +1/turę.
  const handel = findAkcja(data, '5. Traktat handlowy');
  expect(handel !== null, 'brak akcji „5. Traktat handlowy”');
  if (handel) {
    const want = `${MINUS}${Math.abs(code.zerwanieHandlu)} Zaufanie`;
    expect(handel.Opis.includes(want),
      `opis traktatu handlowego bez kary zerwania „${want}” (kod: zerwanie_handlu)`);
    expect(handel.Efekt.includes(`+${P.handel_zaufanie_perTura} Zaufanie`),
      `efekt traktatu handlowego bez „+${P.handel_zaufanie_perTura} Zaufanie/turę”`);
  }

  // 5b. Odmowa obowiązku sojuszniczego: kara N4 to Wiarygodność, nie Zaufanie (params).
  if (sojusz) {
    const want = `${MINUS}${Math.abs(P.wiarygodnoscN4OdmowaObowiazkuSojuszu)} Wiarygodności`;
    expect(sojusz.Efekt.includes(want),
      `efekt sojuszu bez kary odmowy „${want}” (params.wiarygodnoscN4OdmowaObowiazkuSojuszu)`);
    expect(!sojusz.Efekt.includes(`odmowa: ${MINUS}${Math.abs(P.wiarygodnoscN4OdmowaObowiazkuSojuszu)} Zaufanie`),
      'efekt sojuszu podaje odmowę jako utratę Zaufania (to Wiarygodność N4)');
  }

  // 5c. Wypowiedzenie wojny bez casus belli: sama deklaracja nie obniża Zaufania
  // (kod: case 'wojna_wypowiedziana' bez dZ); kara to Wiarygodność N1.
  const wojna = findAkcja(data, '11. Wypowiedzenie wojny');
  expect(wojna !== null, 'brak akcji „11. Wypowiedzenie wojny”');
  if (wojna) {
    expect(!wojna.Efekt.includes(`${MINUS}20 Zaufanie`),
      'efekt wypowiedzenia wojny podaje −20 Zaufanie (kod: deklaracja nie zmienia Zaufania)');
    const karaN1 = `Wiarygodności N1 (${MINUS}${Math.abs(P.wiarygodnoscN1BezOstrzezenia)} pkt`;
    expect(wojna.Efekt.includes(karaN1),
      `efekt wypowiedzenia wojny bez kary N1 „${karaN1}” (params.wiarygodnoscN1BezOstrzezenia)`);
  }

  // 6. Tabela D: tempo co turę — NAP +nap, sojusz +sojusz, przyrost handlu.
  walk(data, (o) => {
    const name = o['Stan / zdarzenie ciągłe'];
    if (name === 'Aktywny pakt NAP / sojusz') {
      expect(o['Δ Zaufanie/turę'] === P.nap_zaufanie_perTura,
        `tempo NAP w tabeli D = ${o['Δ Zaufanie/turę']} (kod: ${P.nap_zaufanie_perTura})`);
      expect(String(o['Uwagi']).includes(`+${P.sojusz_zaufanie_perTura}`),
        `tabela D nie podaje tempa sojuszu +${P.sojusz_zaufanie_perTura}`);
    }
  });

  // 7. Próg „Sojusze osiągalne gdy Relacja ≥” = progSojuszRelacja.
  let sojRows = 0;
  walk(data, (o) => {
    const name = o['Akcja / warunek'];
    if (typeof name !== 'string' || !name.includes('Sojusze osiągalne')) return;
    sojRows += 1;
    expect(o['Próg'] === P.progSojuszRelacja,
      `„Sojusze osiągalne” ma próg ${o['Próg']} (kod: progSojuszRelacja = ${P.progSojuszRelacja})`);
  });
  expect(sojRows >= 1, 'brak wiersza „Sojusze osiągalne gdy Relacja ≥”');

  // 8. Ultimatum spełnione: zdarzenie ultimatum_spelnione usunięte jako martwe (brak emitera w kodzie),
  // więc opis musi mówić wprost, że Zaufanie i Relacja u adresata się nie zmieniają.
  const ultim = findAkcja(data, '9. Ultimatum');
  expect(ultim !== null, 'brak akcji „9. Ultimatum …”');
  if (ultim) {
    expect(code.ultimatumSpelnione === null,
      `zdarzenie ultimatum_spelnione wróciło do kodu (dZ = ${code.ultimatumSpelnione}), opis musi zostać zaktualizowany`);
    expect(ultim.Efekt.includes('brak zmiany Zaufania i Relacji u adresata'),
      'efekt ultimatum nie mówi „brak zmiany Zaufania i Relacji u adresata”');
    expect(!ultim.Efekt.includes(`${MINUS}5 Zaufanie`) && !ultim.Efekt.includes(`${MINUS}5 Relacja`),
      'efekt ultimatum podaje −5 Zaufanie/Relację, a kod nie wykonuje tego efektu');
  }

  // 9. Złamany pakt przez gracza: wiersz tabeli zdarzeń = params.zlamanaPaktGracz_zaufanie.
  let zlamaneRows = 0;
  walk(data, (o) => {
    if (o['Zdarzenie / Działanie'] !== 'Złamany pakt przez gracza') return;
    zlamaneRows += 1;
    expect(String(o['Zmiana']) === String(P.zlamanaPaktGracz_zaufanie),
      `wiersz „Złamany pakt przez gracza” podaje ${JSON.stringify(o['Zmiana'])} (params: ${P.zlamanaPaktGracz_zaufanie})`);
  });
  expect(zlamaneRows === 1, `oczekiwano 1 wiersza „Złamany pakt przez gracza”, znaleziono ${zlamaneRows}`);

  return { fails: out, checks: n };
}

// ---------------------------------------------------------------------------
// Uruchomienie
// ---------------------------------------------------------------------------
const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const src = fs.readFileSync(TS_PATH, 'utf8');
const code = {
  params: parseDiplomacyParams(src),
  zerwanieTraktatu: caseDZ(src, 'zerwanie_traktatu'),
  zerwanieHandlu: caseDZ(src, 'zerwanie_handlu'),
  ultimatumSpelnione: caseDZ(src, 'ultimatum_spelnione'), // null = zdarzenie usunięte (martwe)
};
ok(code.zerwanieTraktatu === -15, `dZ zerwanie_traktatu = ${code.zerwanieTraktatu} (oczekiwano −15)`);
ok(code.zerwanieHandlu === -10, `dZ zerwanie_handlu = ${code.zerwanieHandlu} (oczekiwano −10)`);
ok(code.ultimatumSpelnione === null, `ultimatum_spelnione wróciło do kodu (dZ = ${code.ultimatumSpelnione}); oczekiwano usunięcia`);

console.log('[1] Zgodność opisów diplomacy.json z kodem (stan obecny)');
const real = checkDescriptions(data, code);
checks += real.checks;
for (const f of real.fails) ok(false, f);
console.log(`  wykonano ${real.checks} sprawdzeń opisów, niezgodności: ${real.fails.length}`);

console.log('[2] Samo-test mutacji: zmiana liczby w opisie musi być wykryta');
function mutate(mutator) {
  const copy = JSON.parse(JSON.stringify(data));
  mutator(copy);
  return checkDescriptions(copy, code).fails.length;
}
const mutations = [
  ['kara paktu −40 → −30', (d) => {
    const a = findAkcja(d, '2. Pakt');
    a.Opis = a.Opis.replace(`${MINUS}40 Zaufanie`, `${MINUS}30 Zaufanie`);
  }],
  ['religia +0.5 w tabeli zdarzeń', (d) => {
    walk(d, (o) => {
      if (o['Zdarzenie / Działanie'] === 'Wspólna religia') o['Zmiana'] = '+0.5 (max +15)';
    });
  }],
  ['kara za sąsiedztwo: tabela Δ −2 zamiast −3', (d) => {
    walk(d, (o) => {
      if (o['Stan / zdarzenie ciągłe'] === 'Ekspansja przy granicy') o['Δ Zaufanie/turę'] = -2;
    });
  }],
  ['odmowa sojuszu: Wiarygodność → Zaufanie', (d) => {
    const a = findAkcja(d, '3. Sojusz');
    a.Efekt = a.Efekt.replace('−15 Wiarygodności', '−15 Zaufanie');
  }],
  ['wypowiedzenie wojny: powrót −20 Zaufanie', (d) => {
    const a = findAkcja(d, '11. Wypowiedzenie wojny');
    a.Efekt = a.Efekt.replace('sama deklaracja nie zmienia Zaufania ani Relacji', '−20 Zaufanie');
  }],
  ['ultimatum: powrót opisu −5 Zaufanie (efekt nieistniejący w kodzie)', (d) => {
    const a = findAkcja(d, '9. Ultimatum');
    a.Efekt = a.Efekt.replace('brak zmiany Zaufania i Relacji u adresata', '−5 Zaufanie (a więc także −5 Relacja) u adresata');
  }],
  ['ultimatum: powrót opisu −5 Relacja', (d) => {
    const a = findAkcja(d, '9. Ultimatum');
    a.Efekt = a.Efekt.replace('brak zmiany Zaufania i Relacji u adresata', '−5 Relacja u adresata');
  }],
  ['złamany pakt przez gracza: wiersz −40 → −30', (d) => {
    walk(d, (o) => {
      if (o['Zdarzenie / Działanie'] === 'Złamany pakt przez gracza') o['Zmiana'] = '-30';
    });
  }],
  ['próg sojuszu 130 → 120', (d) => {
    walk(d, (o) => {
      if (typeof o['Akcja / warunek'] === 'string' && o['Akcja / warunek'].includes('Sojusze osiągalne')) {
        o['Próg'] = 120;
      }
    });
  }],
];
for (const [label, mut] of mutations) {
  const k = mutate(mut);
  ok(k > 0, `mutacja „${label}” NIE została wykryta`);
}
console.log(`  mutacji: ${mutations.length}`);

console.log(`\nWYNIK: ${checks - fails}/${checks} OK, FAIL: ${fails}`);
process.exit(fails === 0 ? 0 : 1);
