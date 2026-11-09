'use strict';
/**
 * card-resource-purpose-test.cjs — R-WEB-CARDS-RESOURCE-PURPOSE-Q1.
 *
 * Strażnik treści kart TOP 5 (odkrycia + budynki), bez przeglądarki i bez esbuild:
 *   [R] każda pozycja z wzorcem PRODUKCJI/PRZERobu surowca ('wytwarza', 'wytapia', 'przerabia',
 *       'zamienia', '→', 'na turę') zawiera zdanie o ZASTOSOWANIU (potrzebn*|służy|odblokowuje|
 *       koszt*|daje|idzie|zużywa|buduje|wymaga|rekrutacj*|…) — i KAŻDE nazwane zastosowanie ma
 *       pokrycie w danych (koszt_surowce w buildings.json, „Surowiec” w units.json,
 *       econ-params.json: zużycie Spichlerza, building-resource-gate.ts: bramka Spichlerza II);
 *   [A] brak „+N pieniądza” przy budynkach/polach/ulepszeniach (to PODATEK) — wyjątek: klasa C
 *       (premia morska Portu liczona z tras handlowych, osobny strumień: trade-routes.ts:1740-1790);
 *       klasa B (Mennica „zamienia podatek na pieniądz”, podział na pieniądz/naukę/luksus) ZOSTAJE;
 *   [J] zdania bez orzeczenia / żargon z DODATKU 2 nie wracają;
 *   [W] adaptery „Plony i efekty” (budynek, ulepszenie) pokazują PODATEK, nie Pieniądz;
 *   [G] oba generatory --check (dane == CSV + warstwy + card-text-corrections.cjs).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; return; }
  fail++;
  console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''));
}
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(GRA, rel), 'utf8'));

const techCards = readJson('data/tech-cards-top5.json');
const bldCards = readJson('data/building-cards-top5.json');
const buildings = readJson('data/buildings.json');
const econ = readJson('data/econ-params.json');
const unitsRaw = readJson('data/units.json');
const units = Array.isArray(unitsRaw) ? unitsRaw : unitsRaw.jednostki;
const gateSrc = fs.readFileSync(path.join(GRA, 'src/game/building-resource-gate.ts'), 'utf8');

/** Wszystkie teksty graczowe kart: { src, id, pole, text }. */
function allTexts() {
  const out = [];
  for (const [id, c] of Object.entries(techCards)) {
    if (id.startsWith('_')) continue;
    (c.top5 || []).forEach((i, n) => { out.push({ src: 'tech', id, pole: `top5.${n}.tytul`, text: i.tytul }); out.push({ src: 'tech', id, pole: `top5.${n}.zdanie`, text: i.zdanie }); });
    (c.cmz || []).forEach((x, n) => { out.push({ src: 'tech', id, pole: `cmz.${n}.czynnosc`, text: x.czynnosc }); out.push({ src: 'tech', id, pole: `cmz.${n}.korzysc`, text: x.korzysc }); });
  }
  for (const [id, c] of Object.entries(bldCards)) {
    if (id.startsWith('_') || c.ukryty) continue;
    (c.top5 || []).forEach((i, n) => { out.push({ src: 'bud', id, pole: `top5.${n}.tytul`, text: i.tytul }); out.push({ src: 'bud', id, pole: `top5.${n}.zdanie`, text: i.zdanie }); });
    (c.cmz || []).forEach((x, n) => { out.push({ src: 'bud', id, pole: `cmz.${n}.czynnosc`, text: x.czynnosc }); out.push({ src: 'bud', id, pole: `cmz.${n}.korzysc`, text: x.korzysc }); });
  }
  return out;
}
const TEXTS = allTexts();
check('[0] zebrano teksty kart (sanity)', TEXTS.length > 600, TEXTS.length);

// ------------------------------------------------------------------ [R] zastosowanie surowca
const RES_RE = /(cegł|ceramik|\bsól\b|\bsoli\b|żelaz|brąz|drewn|\bkamień\b|\bkamienia\b|glin|\brud[aęy]\b|\bkoni\b|złot)/i;
const PRODUCTION_RE = /(wytwarza|wytapia|wytapiać|przerabia|zamienia|(glin|drewn|rud)[^→]*→|na turę|\/tur)/i;
const PURPOSE_RE = /(dostarcza|potrzebn|służy|odblokowuj|koszt|daje|idzie|zużywa|buduje|wymaga|rekrutacj|wojsk|do wytopu|limit ludności|bonus)/i;

let produkcyjne = 0;
for (const src of ['tech', 'bud']) {
  const cards = src === 'tech' ? techCards : bldCards;
  for (const [id, c] of Object.entries(cards)) {
    if (id.startsWith('_') || c.ukryty) continue;
    (c.top5 || []).forEach((i, n) => {
      const blob = `${i.tytul} ${i.zdanie}`;
      if (!RES_RE.test(blob) || !PRODUCTION_RE.test(blob)) return;
      produkcyjne++;
      check(`[R] ${src}:${id} top5.${n}: pozycja produkcji surowca ma zdanie o zastosowaniu`,
        PURPOSE_RE.test(i.zdanie), i);
    });
  }
}
check('[R] wykryto pozycje produkcji/przerobu surowców (sanity ≥ 15)', produkcyjne >= 15, produkcyjne);

// Pokrycie w danych: cegła = koszt budowy nazwanych budynków (buildings.json koszt_surowce.cegla).
const NAME_TO_ID = Object.fromEntries(buildings.map((b) => [b.nazwa, b.id]));
const cegla = (name) => ((buildings.find((b) => b.id === NAME_TO_ID[name]) || {}).koszt_surowce || {}).cegla || 0;
for (const nazwa of ['Akademia', 'Sąd', 'Łaźnia publiczna', 'Kuźnia żelaza']) {
  check(`[R] cegła: „${nazwa}” realnie kosztuje cegłę (buildings.json koszt_surowce.cegla)`, cegla(nazwa) > 0, cegla(nazwa));
}
const cegielniaTech = techCards['Garncarstwo'].top5.find((i) => /^Cegielnia/.test(i.tytul));
check('[R] cegła (Garncarstwo/Cegielnia): zdanie wymienia Akademię, Sąd, Łaźnię publiczną i Kuźnię żelaza jako koszt budowy',
  cegielniaTech && /kosztem budowy/.test(cegielniaTech.zdanie) && /Akademii/.test(cegielniaTech.zdanie) && /Sądu/.test(cegielniaTech.zdanie)
  && /Łaźni publicznej/.test(cegielniaTech.zdanie) && /Kuźni żelaza/.test(cegielniaTech.zdanie), cegielniaTech);
check('[R] cegła: fałszywe „cegła potrzebna do zbadania Pisma” NIE wraca (Pismo wymaga budynku Cegielni, nie cegły)',
  !TEXTS.some((t) => /cegł[^.;]*zbadania Pisma/i.test(t.text)));
const cegielniaB = bldCards.cegielnia.top5[0];
check('[R] cegła (karta Cegielni): koszt budowy budynków epoki Żelaza — wszystkie budynki z cegłą mają epokaWejscia 3',
  /kosztem budowy budynków epoki Żelaza/.test(cegielniaB.zdanie)
  && buildings.filter((b) => (b.koszt_surowce || {}).cegla && !b.suppressed).every((b) => b.epokaWejscia === 3 || b.id === 'wielka_odlewnia' || b.id === 'wielka_kuznia' || b.id === 'teatr'),
  buildings.filter((b) => (b.koszt_surowce || {}).cegla).map((b) => `${b.id}:${b.epokaWejscia}`));

// Ceramika = zużycie Spichlerza (econ-params.json) ; sól = zużycie Spichlerza Królewskiego + bramka.
const cer = econ && JSON.stringify(econ).match(/"budynek_spichlerz_zuzywa_ceramika":\s*\{\s*"easy":\s*(\d+),\s*"normal":\s*(\d+)/);
const sol = econ && JSON.stringify(econ).match(/"budynek_spichlerz_ii_zuzywa_sol":\s*\{\s*"easy":\s*(\d+),\s*"normal":\s*(\d+)/);
check('[R] ceramika: Spichlerz zużywa 25/turę (econ-params.json) — jak w tekście karty', cer && Number(cer[2]) === 25, cer && cer[0]);
check('[R] sól: Spichlerz Królewski zużywa 25/turę (econ-params.json) — jak w tekście karty', sol && Number(sol[2]) === 25, sol && sol[0]);
check('[R] sól: bramka Spichlerza II wymaga Ceramiki i Soli (building-resource-gate.ts)', /spichlerz_ii:\s*\['Ceramika',\s*'Sól'\]/.test(gateSrc));
check('[R] sól: premia armii (poza terytorium 2→1) ze Spichlerza II płacącego sól (building-resource-gate.ts)',
  /Armia poza terytorium: 2→1 gdy ≥1 Spichlerz II płaci Sól/.test(gateSrc));
const garn = techCards['Garncarstwo'].top5;
const garncarnia = garn.find((i) => /^Garncarnia/.test(i.tytul));
check('[R] ceramika (Garncarstwo/Garncarnia): zdanie mówi, że Spichlerz ją zużywa (25 na turę) i bez niej nie daje bonusów ludności',
  garncarnia && /Spichlerz zużywa jej 25 na turę/.test(garncarnia.zdanie) && /bonusów ludności/.test(garncarnia.zdanie), garncarnia);
const warzelnia = garn.find((i) => /^Warzelnia soli/.test(i.tytul));
check('[R] sól (Garncarstwo/Warzelnia soli): zdanie nazywa Spichlerz Królewski (25 na turę) i korzyść dla armii (połowa żywności)',
  warzelnia && /Spichlerz Królewski/.test(warzelnia.zdanie) && /25 na turę/.test(warzelnia.zdanie) && /o połowę mniej żywności/.test(warzelnia.zdanie), warzelnia);
check('[R] sól (karta Spichlerza Królewskiego): zużycie 25 ceramiki i 25 soli na turę',
  /zużywa 25 ceramiki i 25 soli na turę/.test(bldCards.spichlerz_ii.top5[0].zdanie), bldCards.spichlerz_ii.top5[0]);
check('[R] ceramika (karta Garncarni): bez ceramiki Spichlerz nie daje bonusów ludności', /bez niej nie daje bonusów ludności/.test(bldCards.garncarnia.top5[0].zdanie));

// Drewno i kamień: koszt budowy w danych + koszt jednostek (drewno).
const drewnoBud = buildings.filter((b) => (b.koszt_surowce || {}).drewno > 0).length;
const kamienBud = buildings.filter((b) => (b.koszt_surowce || {}).kamien > 0).length;
const drewnoUn = units.filter((u) => u['Surowiec'] === 'Drewno').length;
check('[R] drewno: realnie kosztuje budynki i jednostki (buildings.json / units.json)', drewnoBud > 10 && drewnoUn > 5, { drewnoBud, drewnoUn });
check('[R] kamień: realnie kosztuje budynki (mury, świątynia …)', kamienBud > 5 && ['mury', 'swiatynia'].every((id) => (buildings.find((b) => b.id === id).koszt_surowce || {}).kamien > 0), kamienBud);
check('[R] drewno: karta Stolarni i odkrycia (Obróbka drewna) mówią o budowach i rekrutacji',
  /budowy i rekrutację/.test(bldCards.stolarnia.top5[0].zdanie) && /budowy i rekrutacja/.test(techCards['Obróbka drewna'].top5[2].zdanie));
check('[R] kamień: karta Warsztatu kamieniarskiego i odkrycia (Murarstwo) mówią o murach i świątyniach',
  /mury, świątynie/.test(bldCards.kamieniarski.top5[0].zdanie) && /mury, świątynie/.test(techCards['Murarstwo'].top5[1].zdanie));

// ------------------------------------------------------------------ [A] podatek, nie pieniądz
const C_WYJATKI = [
  /\+1 pieniądza za każdą trasę morską/,        // port top5.2 (klasa C — dochód z tras)
  /premii \+1 pieniądza za trasę morską/,        // port_wielki top5.1 (klasa C)
];
const PIENIADZ_PLUS = /[+−-]\s?\d+\s+pieniądza/i;
for (const t of TEXTS) {
  if (!PIENIADZ_PLUS.test(t.text)) continue;
  check(`[A] ${t.src}:${t.id} ${t.pole}: „+N pieniądza” przy budynku/polu to klasa C (premia morska tras) — inaczej PODATEK`,
    C_WYJATKI.some((re) => re.test(t.text)), t.text);
}
check('[A] zakaz: „Stały dochód … pieniądza”, „dać miastu N pieniądza”, „pieniądz” jako plon pola',
  !TEXTS.some((t) => /dochód[^.;]{0,25}pieniądza|dać miastu \d+ pieniądza|Pracę, pieniądz i podatek|\+\d+ pieniądza \(\+\d+ na poziom/i.test(t.text)),
  TEXTS.filter((t) => /dochód[^.;]{0,25}pieniądza|dać miastu \d+ pieniądza|Pracę, pieniądz i podatek/i.test(t.text)).map((t) => t.text));
const aExpect = [
  ['bud', 'targowisko', 'top5.0.tytul', '+5 podatku w mieście (8 w Brązie, 11 w Żelazie)'],
  ['bud', 'emporion', 'top5.0.tytul', '+8 podatku w mieście'],
  ['bud', 'mennica', 'top5.1.tytul', '+3 podatku w stolicy (5 w Żelazie)'],
  ['tech', 'Wymiana', 'top5.4.tytul', 'Targowisko: +5 podatku (+3 na poziom, maks. 3)'],
  ['tech', 'Waluta', 'top5.4.tytul', 'Mennica: +3 podatku (+2 na poziom)'],
  ['tech', 'Łowiectwo', 'top5.0.tytul', 'Obóz łowiecki: +1 żywności, +1 Pracy, +3 podatku'],
];
for (const [src, id, pole, expected] of aExpect) {
  const t = TEXTS.find((x) => x.src === src && x.id === id && x.pole === pole);
  check(`[A] ${src}:${id} ${pole} = „${expected}”`, t && t.text === expected, t && t.text);
}
// Fakt z silnika: baza.pieniadz budynków i bonus.pieniadz ulepszeń zasila podatek.
const econSrc = fs.readFileSync(path.join(GRA, 'src/game/economy.ts'), 'utf8');
check('[A] silnik: baza.pieniadz budynków wchodzi do bazy PODATKU (handelBazowy = handelTerenu + pieniadzBudynkow)',
  /const handelBazowy = handelTerenu \+ pieniadzBudynkow;/.test(econSrc));
const tiSrc = fs.readFileSync(path.join(GRA, 'src/game/terrain-improvements.ts'), 'utf8');
check('[A] silnik: bonus.pieniadz ulepszenia terenu wpada w TileYield.handel (podatek)', /if \(b\.pieniadz\) yld\.handel \+=/.test(tiSrc));
// Klasa B zostaje: Mennica zamienia podatek na pieniądz po podziale; skarbiec/utrzymanie nietknięte.
const waluta = techCards['Waluta'];
check('[B] Waluta/Mennica: podział podatku na naukę, pieniądz i luksus ZOSTAJE (klasa B)',
  waluta.top5[0].zdanie.includes('naukę, pieniądz i luksus') && waluta.cmz[0].korzysc.includes('pieniądz i nauka'));
check('[B] adaptery: utrzymanie budynku wciąż liczone w Pieniądzu (opłacane z kasy)', /parts\.push\(`\$\{gold\} Pieniądza`\)/.test(fs.readFileSync(path.join(GRA, 'src/ui/entityCards/buildingAdapter.ts'), 'utf8')));
check('[C] port/port_wielki: premia morska (+1 pieniądza za trasę morską) bez zmian — klasa C do decyzji',
  bldCards.port.top5[2].tytul === '+1 pieniądza za każdą trasę morską ponad pierwszą' && /premii \+1 pieniądza za trasę morską/.test(bldCards.port_wielki.top5[1].zdanie));

// ------------------------------------------------------------------ [J] język (DODATEK 2)
const ZAKAZANE_J = [
  /żadnych tras/, /bramką całego/, /[Rr]yczałt/, /szczęściodajn/, /konwerter/, /drabink/, /warstwa ścieżki/, /Po 1 Kultury/,
  /— z Koszarami$/, /slotu trasy/, /bez niego i bez Koszar brak/, /\/turę — koszt/, /sumuje się z Koszarami wprost/,
];
for (const re of ZAKAZANE_J) {
  const hit = TEXTS.filter((t) => re.test(t.text));
  check(`[J] zakazany zwrot ${re} nie występuje w kartach`, hit.length === 0, hit.map((t) => `${t.src}:${t.id} ${t.pole}: ${t.text}`));
}
const wym = techCards['Wymiana'].top5[0];
check('[J] Wymiana top1 — wersja właściciela', wym.tytul === 'Otwiera handel: bez Wymiany nie ma tras handlowych'
  && wym.zdanie === 'Wymiana jest warunkiem handlu — dopiero po niej wyznaczysz trasy handlowe.', wym);
check('[J] korekty zapisane w card-text-corrections.cjs mają powód (c, r) i klasę z {A,J,R}', (() => {
  const m = require('./card-text-corrections.cjs');
  return [...m.TECH, ...m.BUD].every((e) => e.r && e.r.length > 5 && ['A', 'J', 'R'].includes(e.c));
})());

// ------------------------------------------------------------------ [W] adaptery „Plony i efekty”
const bAd = fs.readFileSync(path.join(GRA, 'src/ui/entityCards/buildingAdapter.ts'), 'utf8');
const iAd = fs.readFileSync(path.join(GRA, 'src/ui/entityCards/improvementAdapter.ts'), 'utf8');
check('[W] buildingAdapter: wiersz plonu budynku z kluczem `pieniadz` ma etykietę „Podatek”', /\{ key: 'pieniadz', label: 'Podatek' \}/.test(bAd));
check('[W] improvementAdapter: `pieniadz` i `handel` ulepszenia = jeden wiersz „Podatek” (suma)',
  /pieniadz: 'Podatek'/.test(iAd) && /podatekSuma/.test(iAd));

// ------------------------------------------------------------------ [G] generatory
for (const gen of ['gen-tech-cards-top5.cjs', 'gen-building-cards-top5.cjs']) {
  const r = spawnSync(process.execPath, [path.join(__dirname, gen), '--check'], { encoding: 'utf8' });
  check(`[G] ${gen} --check: dane zgodne z generatorem (CSV + warstwy + card-text-corrections)`, r.status === 0, (r.stderr || r.stdout).trim());
}

console.log(`[card-resource-purpose-test] ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
