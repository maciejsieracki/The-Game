'use strict';
/**
 * R-WEB-STARVATION-DESIGN-Q42C — MODEL (tylko odczyt, bez zmian gry).
 *
 * Model tur z brakiem żywności dla gracza po t16 (Trudny = poziom maksymalny dla wartości
 * glod_wojska_hp_frac / karencji): dwie jednostki wojskowe (Wojownik 22 HP, Łucznik 10 HP),
 * Zwiadowca = cywil (poza atrycją). Parametry z kodu/danych:
 *  - glod_wojska_karencja_tur = 3 (gra/data/econ-params.json, wszystkie poziomy)
 *  - glod_wojska_hp_frac = 0.10 (Trudny) -> loss = max(1, floor(maxHp * 0.10))  (army-starvation.ts)
 *  - atrycja aktywna gdy turyUjemnychZapasowPo >= karencja (empire-food.ts l.298/316)
 *  - koszt żywności jednostki wojskowej = 16/turę (FAKTY: rozwiązanie jednostki +16 na turę)
 *  - S0 = nadwyżka żywności bez armii PO reakcji automatu: 14 (ziarno 11) lub 16 (ziarno 7)
 *    (FAKTY/OKNO-LASKI: prognoza −18 z 2 jednostkami -> −2 po 1 -> +14 po 2; ziarno 7: −16)
 * Uwaga: S0 i koszt to wartości z pomiaru live (2 ziarna), nie z kodu; wynik to model.
 */

const fs = require('fs');
const path = require('path');

const unitsPath = path.join(__dirname, '..', 'data', 'units.json');
const unitsRaw = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
const unitsArr = Array.isArray(unitsRaw) ? unitsRaw : (unitsRaw.units || Object.values(unitsRaw));
const healthOf = (name) => {
  const u = unitsArr.find(x => x && x.Jednostka === name);
  return u ? Number(u.health) : NaN;
};

const HP_FRAC = 0.10;
const KARENCJA = 3;
const FOOD_PER_UNIT = 16;
const START_TURN = 16;
const END_TURN = 30;

function runBaseline(S0, popAtT16, hpFrac = HP_FRAC) {
  const units = [
    { name: 'Lucznik', hp: healthOf('Łucznik'), max: healthOf('Łucznik'), alive: true },
    { name: 'Wojownik', hp: healthOf('Wojownik'), max: healthOf('Wojownik'), alive: true },
  ];
  let zapasTurNeg = 0;
  let hungryTicks = 0;
  let firstLoss = null;
  let statMultFrom = null;
  let attritionTicks = 0;
  const log = [];
  for (let t = START_TURN; t <= END_TURN; t++) {
    const alive = units.filter(u => u.alive);
    const cost = alive.length * FOOD_PER_UNIT;
    const hungry = S0 - cost < 0;
    if (hungry) {
      zapasTurNeg += 1;
      hungryTicks += 1;
      if (statMultFrom === null) statMultFrom = t;
    } else {
      zapasTurNeg = 0;
    }
    const attrActive = hungry && zapasTurNeg >= KARENCJA;
    const died = [];
    if (attrActive) {
      attritionTicks += 1;
      for (const u of alive) {
        const loss = Math.max(1, Math.floor(u.max * hpFrac));
        u.hp = Math.max(0, u.hp - loss);
        if (u.hp <= 0) { u.alive = false; died.push(u.name); }
      }
    }
    if (died.length && firstLoss === null) firstLoss = t;
    log.push(`t${t}: koszt=${cost} ${hungry ? 'GLOD' : 'ok'} atrycja=${attrActive ? 'tak' : 'nie'} HP=[${units.map(u => u.name + ':' + u.hp).join(' ')}] zgony=[${died.join(',')}]`);
  }
  const popLossG1 = Math.min(hungryTicks, Math.max(0, popAtT16 - 1));
  return {
    S0,
    hungryTicks,
    statMultFrom,
    firstUnitLoss: firstLoss,
    unitsLostByT30: units.filter(u => !u.alive).length,
    attritionTicks,
    popLossG1IfPopAtT16: popAtT16 === null ? 'NIE ZMIERZONO (populacja t16 nieznana)' : popLossG1,
    log,
  };
}

function runG2(S0) {
  // G2: automatyczne rozwiązanie najsłabszej jednostki (najmniejsze HP) aż do pokrycia niedoboru.
  const units = [
    { name: 'Lucznik', alive: true, hp: healthOf('Łucznik') },
    { name: 'Wojownik', alive: true, hp: healthOf('Wojownik') },
  ];
  const dissolved = [];
  let hungryTicks = 0;
  for (let t = START_TURN; t <= END_TURN; t++) {
    let alive = units.filter(u => u.alive).sort((a, b) => a.hp - b.hp);
    let cost = alive.length * FOOD_PER_UNIT;
    while (S0 - cost < 0 && alive.length > 0) {
      const w = alive.shift();
      w.alive = false;
      dissolved.push(`t${t}:${w.name}`);
      cost = alive.length * FOOD_PER_UNIT;
    }
    if (S0 - cost < 0) hungryTicks += 1;
  }
  return { S0, dissolved, hungryTicks, unitsLostByT30: units.filter(u => !u.alive).length };
}

const out = [];
out.push('MODEL R-WEB-STARVATION-DESIGN-Q42C (baseline = obecny silnik po zdjęciu blokady; G1 = dodatkowo -1 ludności za każdą turę głodu)');
out.push('Parametry: HP_FRAC=' + HP_FRAC + ' KARENCJA=' + KARENCJA + ' FOOD_PER_UNIT=' + FOOD_PER_UNIT + ' tury ' + START_TURN + '..' + END_TURN);
out.push('HP: Wojownik=' + healthOf('Wojownik') + ' Łucznik=' + healthOf('Łucznik') + ' (units.json)');
for (const S0 of [14, 16]) {
  const b = runBaseline(S0, null);
  out.push('');
  out.push('--- S0=' + S0 + ' (baseline) ---');
  out.push(b.log.join('\n'));
  out.push('tury glodu=' + b.hungryTicks + ' pierwszy zgon jednostki=t' + b.firstUnitLoss + ' zgony do t30=' + b.unitsLostByT30 + ' tury atrycji=' + b.attritionTicks + ' stat x0.75 od t' + b.statMultFrom);
  const g2 = runG2(S0);
  out.push('G2 rozwiązane: [' + g2.dissolved.join(', ') + '] tury glodu=' + g2.hungryTicks);
  for (const pop of [3, 5, 8]) {
    const b2 = runBaseline(S0, pop);
    out.push('G1 pop t16=' + pop + ': utrata ludności do t30 = ' + b2.popLossG1IfPopAtT16 + ' (tury glodu ' + b2.hungryTicks + ')');
  }
}
out.push('');
out.push('');
out.push('--- WRAŻLIWOŚĆ (założenia modelu; NIE jest pomiarem gry) ---');
out.push('Stałe założenia: S0 stały przez t16-t30 (bez wzrostu miasta, bez zmiany racji, bez zapasu Spichlerza), koszt 16/jednostkę, karencja 3.');
out.push('Rozbieżność HUD (-30) vs komunikat bramki (-18) NIE jest wyjaśniona; tabela S0 obejmuje oba rzędy wielkości.');
out.push('S0 | HP_FRAC | pierwszy zgon jednostki | zgony do t30 | tury głodu');
for (const hf of [0.06, 0.08, 0.10]) {
  for (const S0 of [10, 12, 14, 16, 18]) {
    const b = runBaseline(S0, null, hf);
    const fl = b.firstUnitLoss === null ? 'brak' : 't' + b.firstUnitLoss;
    out.push(S0 + ' | ' + hf.toFixed(2) + ' | ' + fl + ' | ' + b.unitsLostByT30 + ' | ' + b.hungryTicks);
  }
}
out.push('G3 (kara produkcji/Szczęścia) — bez liczb: magnitude NIE ZMIERZONO, model nie zawiera; wymaga wyłączenia atrycji HP, inaczej zgony jednostek jak w baseline.');
process.stdout.write(out.join('\n') + '\n');
