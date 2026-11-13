'use strict';
/**
 * diplo-peace-gate-mutation-run.cjs -- R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (h): dowod mutacyjny bramek.
 * Dla kazdej bramki: podmienia JEDEN unikalny fragment kodu na wersje neutralna, uruchamia test zachowania,
 * oczekuje czerwieni (exit != 0). Zawsze przywraca oryginal (takze po bledzie). Nie zmienia kodu trwale.
 * Run: node tools/diplo-peace-gate-mutation-run.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const MUTANTS = [
  { name: 'M1 bramka silniejsza w evaluatePeaceAiGate', file: 'src/game/diplomacy-war-peace-profile.ts',
    from: "if (input.pozycjaMilitarna === 'silniejsza') {", to: 'if (false) {',
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs', 'tools/diplo-peace-balance-accept-test.cjs'] },
  { name: 'M2 miasto >= PN w bramce proposals (r5Gate)', file: 'src/game/diplomacy-proposals.ts',
    from: 'if (!(cityGivePn >= basePn)) {', to: 'if (false) {',
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M3 odrzucenie zlota/surowcow (proposals)', file: 'src/game/diplomacy-proposals.ts',
    from: 'if (nonCitySweetener) {', to: 'if (false) {',
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M4 AI silniejsza nie proponuje (ai.ts aiFeelsStronger)', file: 'src/game/ai.ts',
    from: "const aiFeelsStronger = rel.stanWojny && peacePosMil === 'silniejsza';", to: 'const aiFeelsStronger = false;',
    tests: ['tools/diplo-peace-balance-accept-test.cjs', 'tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M5 słabsza bez miasta nie proponuje wobec gracza (ai.ts)', file: 'src/game/ai.ts',
    from: "const peaceWeakerNoCityVsPlayer = rel.partnerId === '0' && peacePosMil === 'slabsza';", to: 'const peaceWeakerNoCityVsPlayer = false;',
    tests: ['tools/diplo-peace-balance-accept-test.cjs', 'tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M6 forced-peace: silniejsza przyjmuje tylko za miasto (accept_paid)', file: 'src/game/diplomacy-ai-forced-peace.ts',
    from: "if (inp.winnerGateVerdict === 'stronger') {", to: 'if (false) {',
    tests: ['tools/ai-war-nearest-city-peace-2t-test.cjs'] },
  { name: 'M7 forced-peace: zaplata tylko miastami (D2)', file: 'src/game/diplomacy-ai-forced-peace.ts',
    from: ".filter(a => a.kind === 'miasto')", to: '',
    tests: ['tools/ai-war-nearest-city-peace-2t-test.cjs'] },
  { name: 'M8 rozejm z miastem (proposals rodzaj)', file: 'src/game/diplomacy-proposals.ts',
    from: "if (cmd.rodzaj === 'rozejm') {\n        return {\n          ...base,\n          id: makeDealId('pending-rozejm-miasto'", to: "if (false) {\n        return {\n          ...base,\n          id: makeDealId('pending-rozejm-miasto'",
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M9 pasmo: próg rozniceSily ignorowany', file: 'src/game/diplomacy-military-strength.ts',
    from: "if (prog > 0 && withinBand) return 'pasmo';", to: '',
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M10 ZLOTO: przywrocona galaz oferuj_trybut_za_pokoj (D2) przed zaproponuj_pokoj (ai.ts)', file: 'src/game/ai.ts',
    from: '    // ---- Priorytet 2: zaproponuj_pokoj (słaby', to: "    if (rel.stanWojny && rw <= p.progTrybutKrytyczny && !csBlocksTribute && capAiGoldOffer(inp.skarbiecGold ?? 0, 50) > 0) { komendy.push({ type: 'oferuj_trybut_za_pokoj', targetId: rel.partnerId, powod: 'mut', goldOnce: capAiGoldOffer(inp.skarbiecGold ?? 0, 50) }); continue; }\n    // ---- Priorytet 2: zaproponuj_pokoj (słaby",
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M11 rodzaj oferty miasta zawsze pokoj (ai.ts cityOfferKind)', file: 'src/game/ai.ts',
    from: 'const cityOfferKind = aiPeaceProposalKind(turnsAtWarRel);', to: "const cityOfferKind = 'pokoj' as const;",
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M12 odwrocone strony w peaceStanceOf (wiazanie pozycji)', file: 'src/game/diplomacy-military-strength.ts',
    from: "    { id: String(self.id), sila: self.sila, armiaPkt: self.armiaPkt },\n    { id: String(partner.id), sila: partner.sila, armiaPkt: partner.armiaPkt },",
    to: "    { id: String(partner.id), sila: partner.sila, armiaPkt: partner.armiaPkt },\n    { id: String(self.id), sila: self.sila, armiaPkt: self.armiaPkt },",
    tests: ['tools/diplo-peace-weaker-seeks-city-only-test.cjs'] },
  { name: 'M13 zla kolejnosc stron w wywolaniu main.ts (gateVerdict AI<->AI)', file: 'src/main.ts',
    from: "              pozycjaMilitarna: peaceStanceOf(\n                { id: winner, sila: wSide.sila, armiaPkt: wSide.armiaPkt },\n                { id: loser, sila: lSide.sila, armiaPkt: lSide.armiaPkt },",
    to: "              pozycjaMilitarna: peaceStanceOf(\n                { id: loser, sila: lSide.sila, armiaPkt: lSide.armiaPkt },\n                { id: winner, sila: wSide.sila, armiaPkt: wSide.armiaPkt },",
    tests: ['tools/diplo-peace-stance-wiring-test.cjs'] },
];

const ONLY = process.argv[2];
const results = [];
for (const m of MUTANTS.filter(x => !ONLY || x.name.startsWith(ONLY))) {
  const abs = path.join(GRA, m.file);
  const original = fs.readFileSync(abs, 'utf8');
  const count = original.split(m.from).length - 1;
  if (count !== 1) {
    results.push({ name: m.name, status: 'NIE_ZASTOSOWANO', detail: `fragment wystapil ${count} razy` });
    continue;
  }
  let killed = false;
  const detail = [];
  try {
    fs.writeFileSync(abs, original.replace(m.from, m.to), 'utf8');
    for (const t of m.tests) {
      const r = spawnSync(process.execPath, [path.join(GRA, t)], { cwd: GRA, encoding: 'utf8', timeout: 540000 });
      const out = (r.stdout || '') + (r.stderr || '');
      const failLines = out.split('\n').filter(l => /^FAIL/.test(l)).length;
      detail.push(`${path.basename(t)} exit=${r.status} FAIL=${failLines}`);
      if (r.status !== 0) killed = true;
    }
  } finally {
    fs.writeFileSync(abs, original, 'utf8');
  }
  const restored = fs.readFileSync(abs, 'utf8') === original;
  results.push({ name: m.name, status: killed ? 'ZABITY' : 'PRZETRWAL', detail: detail.join('; ') + (restored ? '' : ' [UWAGA: nie przywrocono]') });
}

for (const r of results) console.log(`${r.status.padEnd(16)} ${r.name} -- ${r.detail}`);
const killedN = results.filter(r => r.status === 'ZABITY').length;
console.log(`\nMUTACJE BRAMEK: ${killedN}/${results.length} zabite`);
process.exit(killedN === results.length ? 0 : 1);
