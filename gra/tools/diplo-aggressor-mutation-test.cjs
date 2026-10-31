'use strict';
/**
 * diplo-aggressor-mutation-test.cjs — R-WEB-WAR-AGGRESSOR-FLAG-Q1 (mutacje gałęzi sterujących).
 * Run: node tools/diplo-aggressor-mutation-test.cjs
 *
 * Dla każdej mutacji: podmienia JEDEN fragment źródła, uruchamia unit-test i oczekuje FAIL
 * (exit != 0). Mutacja, która przeżyje, = luka w testach. Oryginały są przywracane zawsze
 * (try/finally), także przy błędzie.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AGG = path.resolve(ROOT, 'src', 'game', 'diplomacy.ts');
const DIP = path.resolve(ROOT, 'src', 'game', 'diplomacy.ts');
const TEST = path.resolve(__dirname, 'diplo-aggressor-unit-test.cjs');

// [nazwa, plik, fragment oryginału, zamiennik, 'one' (dokładnie 1 wystąpienie) | 'all']
const MUTATIONS = [
  ['przyczyna: bez priorytetu hamulca', AGG, "  if (input.hamulec) return 'hamulec';", '', 'one'],
  ['przyczyna: bez priorytetu wymuszonej epoki', AGG, "  if (input.wymuszonaEpoka) return 'wymuszona_epoka';", '', 'one'],
  ['przyczyna: bez wymuszonej innej', AGG, "  if (input.wymuszonaInna) return 'wymuszona_inna';", '', 'one'],
  ['przyczyna: bez casus belli', AGG, "  if (input.casusBelliAktywny) return 'casus_belli';", '', 'one'],
  ['flaga: wszystkie przyczyny daja flage', AGG, "  return cause === 'bez_powodu';", '  return true;', 'one'],
  ['flaga: ustawFlage ignoruje przyczyne', AGG, '  if (!czyDajeFlageAgresora(cause)) return state;', '', 'one'],
  ['okno: N wlacznie (<=) w obu oknach', AGG, '  return turn < doTury;', '  return turn <= doTury;', 'all'],
  ['okno: o turę krótsze', AGG, '  const doTury = turn + params.flagaAgresora.trwaTur;', '  const doTury = turn + params.flagaAgresora.trwaTur - 1;', 'one'],
  ['okno: skracanie dozwolone (brak guardu prev)', AGG, '  if (prev !== undefined && prev >= doTury) return state;', '', 'all'],
  ['AI: delta progu z odwrotnym znakiem', AGG, '  return aktywnaFlaga ? params.wplywNaAI.relacjaDeltaSojusz : 0;', '  return aktywnaFlaga ? -params.wplywNaAI.relacjaDeltaSojusz : 0;', 'one'],
  ['AI: mnoznik odwrocony', AGG, '  return aktywnaFlaga ? params.wplywNaAI.willingnessAllyMnoznik : 1;', '  return aktywnaFlaga ? 1 : params.wplywNaAI.willingnessAllyMnoznik;', 'one'],
  ['casus: klucz kierunkowy odwrocony', AGG, '  return `${requester}>${target}`;', '  return `${target}>${requester}`;', 'one'],
  ['casus: self-casus dozwolony', AGG, '  if (requester === target) return state;', '', 'one'],
  ['save: brak sanityzacji wczytania', AGG, '  return serializujMape(raw as Record<string, number>);', '  return raw as Record<string, number>;', 'one'],
  ['rejestracja: przyczyna ignorowana (zawsze flaga)', AGG, '  stanAgresorow = serializujMape(ustawFlageAgresora(stanAgresorow, attackerId, turn, cause));', "  stanAgresorow = serializujMape(ustawFlageAgresora(stanAgresorow, attackerId, turn, 'bez_powodu'));", 'one'],
  ['rejestracja: casus belli nie zapisywany', AGG, '  stanCasusBelli = serializujMape(ustawCasusBelli(stanCasusBelli, requester, target, turn));', '  stanCasusBelli = stanCasusBelli;', 'one'],
  ['silnik AI: brak mnoznika willingnessAlly', DIP, '  allyW = clamp(allyW * mnoznikWillingnessAlly(context.celAgresorAktywny === true), 0, 1);', '', 'one'],
  ['silnik AI: brak delty progu sojuszu', DIP, '  const agresorDeltaSojusz = deltaRelacjiSojusz(context.celAgresorAktywny === true);', '  const agresorDeltaSojusz = 0;', 'one'],
  ['silnik AI: delta progu nieuzyta', DIP, '    p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore + agresorDeltaSojusz,', '    p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore,', 'one'],
];

function countOcc(src, needle) {
  return src.split(needle).length - 1;
}

const results = [];
for (const [name, file, from, to, mode] of MUTATIONS) {
  const original = fs.readFileSync(file, 'utf8');
  const occ = countOcc(original, from);
  if (occ === 0 || (mode === 'one' && occ !== 1)) {
    results.push({ name, status: 'BAD-ANCHOR', detail: `wystapien=${occ}` });
    continue;
  }
  const mutated = mode === 'all' ? original.split(from).join(to) : original.replace(from, to);
  try {
    fs.writeFileSync(file, mutated, 'utf8');
    const run = spawnSync(process.execPath, [TEST], { encoding: 'utf8', timeout: 240000 });
    const killed = run.status !== 0;
    results.push({ name, status: killed ? 'KILLED' : 'SURVIVED', detail: (run.stdout || '').trim().split('\n').pop() });
  } finally {
    fs.writeFileSync(file, original, 'utf8');
  }
}

let killed = 0;
for (const r of results) {
  if (r.status === 'KILLED') killed++;
  console.log(`${r.status.padEnd(11)} ${r.name} | ${r.detail}`);
}
console.log(`diplo-aggressor-mutation-test: ${killed}/${results.length} KILLED`);
const ok = killed === results.length;
process.exit(ok ? 0 : 1);
