'use strict';
/**
 * dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs
 *
 * TEMAT: P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA — RUNDA 3
 *
 * Naprawa regresji zgłoszonej przez niezależnego Evaluatora rundy 2: case 'pokoj' w
 * evaluateProposal (diplomacy-proposals.ts) dla !proposerIsPlayer (AI proponuje pokój) wołał
 * `treatyBaseFairnessGap` BEZWARUNKOWO tą samą matematyką co gałąź proposerIsPlayer — matematyka
 * ta zakłada, że PIERWSZY argument danych (`givePn`) to WŁASNY wkład gracza (dostaje rabat
 * Relacji), a DRUGI (`receivePn`) to wkład partnera/AI (płaska baza) — poprawne wyłącznie gdy
 * proposerIsPlayer. Gdy AI jest proponentem, `givePn` to wkład AI — rabat trafiał do AI, płaska
 * baza do gracza, dokładnie odwrotnie niż `effectiveTreatyPnRequired` dokumentuje ("Partner (AI)
 * zawsze na bazie"). Skutek: pusty koszyk (typowe zaproponuj_pokoj AI) + DOWOLNA relacja podczas
 * wojny -> pwBalance ujemny zawsze (bo `partnerTreatyPnRequired(basePn)`=500 stały >> maksymalnie
 * osiągalne podczas wojny `effectiveTreatyPnRequired(basePn, 29)`=145, `clampRelationForWar` tnie
 * relTotal do <=29) -> gracz praktycznie NIGDY nie mógł przyjąć gołej propozycji pokoju od AI
 * podczas wojny.
 *
 * NAPRAWA (diplomacy-proposals.ts, case 'pokoj'): gałąź !proposerIsPlayer woła TĘ SAMĄ
 * `treatyBaseFairnessGap` z TĄ SAMĄ kolejnością argumentów (givePn pomaga, receivePn szkodzi —
 * NIE zamienione) — zmieniony WYŁĄCZNIE `relTotal` wejściowy: `relationTotal(relation)` SUROWA
 * (bez `clampRelationForWar`) zamiast `treatyEvalRelationTotal` (wojennie ograniczonej do <=29).
 * Uzasadnienie i DOWÓD, że dosłowna zamiana argumentów (`treatyBaseFairnessGap(basePn, receivePn,
 * givePn, relTotal)`, litera kierunku z dispatchu rundy 3) NIE naprawia problemu — sekcja PROOF
 * niżej (TEST 4).
 *
 * Deterministyczny test jednostkowy (esbuild -> Node CJS, BEZ mocków) na REALNYCH funkcjach
 * produkcyjnych — evaluateProposal (diplomacy-proposals.ts), balancePanelDataFromRows
 * (diplomacyAcceptanceBalance.ts).
 *
 * Usage (z gra/): node tools/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.dyplo-bilans-n-e1-r3-entry.ts');
const DIPLO_PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');
const DIPLO_BALANCE = path.resolve(GRA, 'src', 'ui', 'diplomacyAcceptanceBalance.ts');

const BUNDLES = {
  fixed: path.resolve(__dirname, '.dyplo-n-e1-r3-fixed.cjs'),
  mutR2: path.resolve(__dirname, '.dyplo-n-e1-r3-mutR2.cjs'),
  mutSwap: path.resolve(__dirname, '.dyplo-n-e1-r3-mutSwap.cjs'),
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

function cleanup() {
  try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
  for (const p of Object.values(BUNDLES)) {
    try { fs.unlinkSync(p); } catch (_) { /* ok */ }
  }
}

function writeEntry() {
  fs.writeFileSync(ENTRY, [
    "/* GENEROWANY PRZEZ dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs — nie edytowac recznie. */",
    "export { evaluateProposal, treatyEvalRelationTotal } from '../src/game/diplomacy-proposals';",
    "export { balancePanelDataFromRows } from '../src/ui/diplomacyAcceptanceBalance';",
    "export { computePlayerAcceptanceSides } from '../src/game/diplomacy-acceptance-points';",
    "",
  ].join('\n'), 'utf8');
}

const FIXED_NEEDLE = `const gap = basePn > 0
        ? (proposerIsPlayer
            ? treatyBaseFairnessGap(basePn, givePn, receivePn, relTotal)
            : treatyBaseFairnessGap(basePn, givePn, receivePn, relationTotal(relation)))
        : 0;
      const pokojPwBalanceRaw = basePn > 0 ? -gap : undefined;
      // Normalizacja -0 → 0 (JS: \`-0 < 0\` jest \`false\`, więc bramka canAccept działa poprawnie
      // nawet bez tego, ale \`-0\` w komunikacie/liczbie wyświetlanej graczowi wyglądałby myląco).
      const pokojPwBalance = pokojPwBalanceRaw != null && Object.is(pokojPwBalanceRaw, -0)
        ? 0
        : pokojPwBalanceRaw;`;

/* Mutacja R2 (KONTROLA NIETAUTOLOGICZNA, PRZED tą rundą): przywraca DOKŁADNIE kod rundy 2 —
 * treatyBaseFairnessGap wołane BEZWARUNKOWO tymi samymi (givePn, receivePn, relTotal-WOJENNIE-
 * OGRANICZONE) dla OBU ról — to jest DOKŁADNIE regresja zgłoszona przez Evaluatora.
 *
 * ROZSZERZENIE RUNDA 4 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA, decyzja właściciela —
 * 00-dispatch.md rundy 4): runda 4 USUNĘŁA z kodu bazowego (1) blokadę `accepted:false` w
 * gałęzi proposerIsPlayer case 'pokoj' (diplomacy-proposals.ts) i (2) generyczną blokadę
 * `pwBalance<0 -> blockReason` dla wierszy 'pokoj' w balancePanelDataFromRows
 * (diplomacyAcceptanceBalance.ts, `row.uiActionId !== '10'`). Bez przywrócenia OBU, bundle mutR2
 * miałby formułę rundy 2 (poprawny cel TESTU 4/PROOF), ale zachowanie accept/canAccept rundy 4
 * (canAccept zawsze true) — TESTY 1/2/3 (PRZED/PO, canAccept) przestałyby cokolwiek dowodzić
 * (tautologia: PRZED i PO dawałyby to samo canAccept). Ta mutacja przywraca więc PEŁNY stan
 * SPRZED rundy 4 (formuła rundy 2 + blokada canAccept z rund 2/3) w OBU plikach — jeden plugin,
 * dwa `onLoad` (esbuild woła jeden onLoad na plik, więc DWA osobne filtry w TYM SAMYM pluginie,
 * nie dwa osobne pluginy na ten sam plik). */
const mutR2 = { applied: 0, balanceApplied: 0 };
const POST_R4_RETURN =
  "return { accepted: true, pwBalance: pokojPwBalance, reason: 'Warunki pokoju spełnione', oneShotTrade: true };";
const PRE_R4_BLOCK = `if (proposerIsPlayer && basePn > 0) {
        if (gap > 0) {
          return {
            accepted: false,
            pwBalance: pokojPwBalance,
            reason: \`Brakuje \${gap} PW do uczciwej oferty pokoju @ Relacji (baza \${basePn} PW) — oferta nieuczciwa dla partnera\`,
          };
        }
        if (receivePn > 0 && !pnDealAcceptedByAi(givePn, receivePn, relTotal)) {
          return { accepted: false, pwBalance: pokojPwBalance, reason: 'Oferta poniżej uczciwej wartości PW @ Relacji' };
        }
      }
      ${POST_R4_RETURN}`;
const pluginR2 = {
  name: 'revert-to-round2-pokoj-formula-and-pre-round4-blocking',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      let src = fs.readFileSync(args.path, 'utf8');
      const replacement = 'const gap = basePn > 0 ? treatyBaseFairnessGap(basePn, givePn, receivePn, relTotal) : 0;\n'
        + '      const pokojPwBalance = basePn > 0 ? -gap : undefined;';
      src = src.replace(FIXED_NEEDLE, () => { mutR2.applied++; return replacement; });
      src = src.replace(POST_R4_RETURN, () => { mutR2.applied++; return PRE_R4_BLOCK; });
      return { contents: src, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /diplomacyAcceptanceBalance\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_BALANCE) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const needle = "if (row.responderPreview.pwBalance < 0 && blockReason == null && row.uiActionId !== '10') {";
      const replacement = 'if (row.responderPreview.pwBalance < 0 && blockReason == null) {';
      const out = src.replace(needle, () => { mutR2.balanceApplied++; return replacement; });
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

/* Mutacja SWAP (PROOF — sekcja dowodowa, TEST 4): implementuje DOSŁOWNIE kierunek naprawy z
 * dispatchu rundy 3 ("swap rol PRZED wywolaniem treatyBaseFairnessGap") — zamienia WYŁĄCZNIE
 * kolejność (givePn, receivePn) w gałęzi !proposerIsPlayer, zachowując relTotal WOJENNIE
 * OGRANICZONY (tak jak dispatch dosłownie sugerował, bez dodatkowej zmiany relTotal). Ten test
 * dowodzi, że SAMA zamiana argumentów, BEZ zmiany relTotal, NIE naprawia problemu (patrz TEST 4). */
const mutSwap = { applied: 0 };
const pluginSwap = {
  name: 'literal-arg-swap-per-dispatch-wording',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const needle = ': treatyBaseFairnessGap(basePn, givePn, receivePn, relationTotal(relation)))';
      const replacement = ': treatyBaseFairnessGap(basePn, receivePn, givePn, relTotal))';
      let n = 0;
      const out = src.replace(needle, () => { n++; return replacement; });
      mutSwap.applied = n;
      return { contents: out, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function buildBundle(outfile, plugins) {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    logLevel: 'silent',
    plugins,
  });
}

/** Propozycja 'pokoj' AI->gracz (proposerOwnerId=1=AI, responderOwnerId=0=gracz), podczas wojny. */
function aiPeaceProposal(payload, relation) {
  const proposal = { actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0, payload };
  const ctx = {
    relation, stanWojny: true, turn: 80,
    proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false, difficulty: 'normal',
  };
  return { proposal, ctx };
}

/** Propozycja 'pokoj' gracz->AI (proposerOwnerId=0=gracz, responderOwnerId=1=AI), podczas wojny. */
function playerPeaceProposal(payload, relation) {
  const proposal = { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload };
  const ctx = {
    relation, stanWojny: true, turn: 80,
    proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    ekspansjaPrzyGranicy: false, difficulty: 'normal',
  };
  return { proposal, ctx };
}

function incomingCanAccept(mod, res, payload, relation) {
  const relTotal = mod.treatyEvalRelationTotal(relation);
  const acceptance = mod.computePlayerAcceptanceSides('pokoj', payload, relTotal, true, {
    difficulty: 'normal', proposerOwnerId: 1, tempoGry: 'standardowa',
  });
  const row = {
    id: 'pokoj-1', direction: 'incoming', actionLabel: 'pokoj', awaitingAiResponse: false,
    responderPreview: { accepted: res.accepted, reason: res.reason, pwBalance: res.pwBalance },
    acceptanceMy: acceptance.my, acceptanceTheir: acceptance.their,
    canCounter: false, uiActionId: '10',
  };
  return mod.balancePanelDataFromRows([row]);
}

const RELACJE = {
  zla: { zaufanie: 5, respekt: 5, status: 'wojna' },
  neutralna: { zaufanie: 50, respekt: 50, status: 'wojna' },
  bardzoDobra: { zaufanie: 95, respekt: 95, status: 'wojna' },
};

async function main() {
  writeEntry();
  await buildBundle(BUNDLES.fixed, []);
  await buildBundle(BUNDLES.mutR2, [pluginR2]);
  await buildBundle(BUNDLES.mutSwap, [pluginSwap]);

  check('(0a) mutacja R2 faktycznie przywróciła formułę rundy 2 (bezwarunkowe wywołanie z '
    + 'relTotal wojennie ograniczonym dla obu ról) ORAZ blokadę accepted:false sprzed rundy 4 '
    + '(gap>0 w gałęzi proposerIsPlayer) — kontrola nietautologiczna aktywna (2 podmiany: '
    + 'formuła + blok blokady)',
    mutR2.applied === 2, mutR2.applied);
  check('(0a2) mutacja R2 faktycznie przywróciła (w diplomacyAcceptanceBalance.ts) generyczną '
    + 'blokadę pwBalance<0 -> blockReason sprzed rundy 4 (bez wyjątku dla uiActionId \'10\') — '
    + 'kontrola nietautologiczna aktywna',
    mutR2.balanceApplied === 1, mutR2.balanceApplied);
  check('(0b) mutacja SWAP faktycznie zamieniła (givePn,receivePn) w gałęzi AI-proponenta na '
    + '(receivePn,givePn), relTotal bez zmian — kontrola nietautologiczna dla TESTU 4 (PROOF) '
    + 'aktywna', mutSwap.applied === 1, mutSwap.applied);

  const fixed = require(BUNDLES.fixed);
  const mutR2_mod = require(BUNDLES.mutR2);
  const mutSwap_mod = require(BUNDLES.mutSwap);

  // ==========================================================================
  // TEST 1 — pusty koszyk, AI proponuje pokój podczas wojny, 3 poziomy relacji (dowód
  // Evaluatora reprodukowany żywo). PRZED (mutacja R2 = stan sprzed rundy 4: formuła rundy 2 +
  // blokada canAccept sprzed rundy 4, patrz komentarz przy pluginR2): pwBalance ujemny WE
  // WSZYSTKICH trzech, canAccept=false wszędzie.
  //
  // PO (kod bieżący, RUNDA 4 — decyzja właściciela, 00-dispatch.md rundy 4, kryterium końca #4:
  // "canAccept ma być TRUE we WSZYSTKICH [zła/neutralna/dobra], niezależnie od pwBalance"):
  // pwBalance NIETKNIĘTY (ta sama liczba, ta sama matematyka rundy 3 — zła: -450 nadal ujemny,
  // neutralna: 0, bardzo dobra: +450), ale canAccept=true WE WSZYSTKICH TRZECH, w tym przy złej
  // relacji z ujemnym pwBalance — to jest DOKŁADNIE zmiana tej rundy względem rundy 3 (rundy 2/3
  // tu jeszcze blokowały złą relację, patrz (1-PO-zla) niżej).
  // ==========================================================================
  console.log('\n--- TEST 1 (pusty koszyk, AI proponuje pokój, zła/neutralna/bardzo dobra relacja w wojnie) ---');
  for (const [label, relation] of Object.entries(RELACJE)) {
    const { proposal, ctx } = aiPeaceProposal({}, relation);
    const resPrzed = mutR2_mod.evaluateProposal(proposal, ctx);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPrzed = incomingCanAccept(mutR2_mod, resPrzed, proposal.payload, relation);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, relation);
    console.log('  [' + label + '] PRZED (runda 2): pwBalance=' + resPrzed.pwBalance
      + ' canAccept=' + panelPrzed.canAccept
      + '  |  PO (runda 3): pwBalance=' + resPo.pwBalance + ' canAccept=' + panelPo.canAccept);
    check('(1-PRZED-' + label + ') DOWÓD REGRESJI: kod rundy 2 blokuje pusty-koszyk pokój od AI '
      + 'przy relacji ' + label + ' (pwBalance<0, canAccept=false) — zawsze, niezależnie od jakości relacji',
      resPrzed.accepted === true && resPrzed.pwBalance < 0 && panelPrzed.canAccept === false,
      { resPrzed, panelPrzed });
  }
  {
    const { proposal, ctx } = aiPeaceProposal({}, RELACJE.zla);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, RELACJE.zla);
    check('(1-PO-zla) RUNDA 4: pwBalance NIETKNIĘTY, nadal ujemny (-450, bit-identyczna liczba z '
      + 'rundą 3 — clamp wojenny <=29 nie miał wpływu na relTotal=10 już poniżej sufitu), ale '
      + 'canAccept=TRUE — decyzja właściciela rundy 4 usuwa blokadę PW dla \'pokoj\' nawet przy '
      + 'złej relacji (rundy 2/3 tu jeszcze blokowały, patrz (1-PRZED-zla) wyżej — to jest '
      + 'kryterium końca #4 dispatchu rundy 4, celowo ODWRÓCONE względem rundy 3)',
      resPo.accepted === true && resPo.pwBalance === -450 && panelPo.canAccept === true,
      { resPo, panelPo });
  }
  {
    const { proposal, ctx } = aiPeaceProposal({}, RELACJE.neutralna);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, RELACJE.neutralna);
    check('(1-PO-neutralna) neutralna relacja podczas wojny -> pwBalance>=0 (0), '
      + 'canAccept=true (nie tylko przy nieosiągalnym relTotal=150 — kryterium końca #2 rundy 3; '
      + 'od rundy 4 canAccept=true tu i tak, niezależnie od znaku pwBalance — patrz (1-PO-zla))',
      resPo.accepted === true && resPo.pwBalance === 0 && panelPo.canAccept === true,
      { resPo, panelPo });
  }
  {
    const { proposal, ctx } = aiPeaceProposal({}, RELACJE.bardzoDobra);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, RELACJE.bardzoDobra);
    check('(1-PO-bardzoDobra) bardzo dobra relacja podczas wojny -> pwBalance>=0 '
      + '(450, wyraźnie dodatni), canAccept=true (od rundy 4 canAccept=true tu i tak, niezależnie '
      + 'od znaku pwBalance — patrz (1-PO-zla))',
      resPo.accepted === true && resPo.pwBalance === 450 && panelPo.canAccept === true,
      { resPo, panelPo });
  }

  // ==========================================================================
  // TEST 2 — AI daje 300 PW (złota) za darmo (payload.goldOnce=300, brak żądania) podczas
  // wojny. PRZED (runda 2): pwBalance nadal ujemny (dar nie wystarcza, by pokonać strukturalny
  // deficyt -355/-450). PO (runda 3, liczba NIETKNIĘTA rundą 4): pwBalance dodatni przy
  // neutralnej/bardzo dobrej relacji -> canAccept=true (kryterium końca #2 rundy 3); przy złej
  // relacji pwBalance ZOSTAJE ujemny (-150, ten sam dowód Evaluatora) — RUNDA 4 dodaje tu
  // (2-PO-zla): canAccept=TRUE mimo tego, kryterium końca #4 dispatchu rundy 4.
  // ==========================================================================
  console.log('\n--- TEST 2 (AI daje 300 PW za darmo podczas wojny) ---');
  for (const [label, relation] of Object.entries(RELACJE)) {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, relation);
    const resPrzed = mutR2_mod.evaluateProposal(proposal, ctx);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPrzed = incomingCanAccept(mutR2_mod, resPrzed, proposal.payload, relation);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, relation);
    console.log('  [' + label + '] PRZED (runda 2): pwBalance=' + resPrzed.pwBalance
      + ' canAccept=' + panelPrzed.canAccept
      + '  |  PO (runda 3): pwBalance=' + resPo.pwBalance + ' canAccept=' + panelPo.canAccept);
  }
  {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, RELACJE.zla);
    const resPrzed = mutR2_mod.evaluateProposal(proposal, ctx);
    check('(2-PRZED-zla) DOWÓD REGRESJI: kod rundy 2 — dar 300 PW przy złej relacji nadal '
      + 'ujemny bilans (-150, dokładnie dowód Evaluatora)',
      resPrzed.accepted === true && resPrzed.pwBalance === -150, resPrzed);
  }
  {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, RELACJE.neutralna);
    const resPrzed = mutR2_mod.evaluateProposal(proposal, ctx);
    check('(2-PRZED-neutralna) DOWÓD REGRESJI: kod rundy 2 — dar 300 PW przy neutralnej relacji '
      + 'nadal ujemny bilans (-55, dokładnie dowód Evaluatora)',
      resPrzed.accepted === true && resPrzed.pwBalance === -55, resPrzed);
  }
  {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, RELACJE.zla);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, RELACJE.zla);
    check('(2-PO-zla) RUNDA 4: dar 300 PW przy złej relacji -> pwBalance NIETKNIĘTY, nadal ujemny '
      + '(-150, bit-identyczny z (2-PRZED-zla)), ale canAccept=TRUE — kryterium końca #4 dispatchu '
      + 'rundy 4 zastosowane również gdy koszyk zawiera realny dar, nie tylko przy pustym koszyku',
      resPo.accepted === true && resPo.pwBalance === -150 && panelPo.canAccept === true,
      { resPo, panelPo });
  }
  {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, RELACJE.neutralna);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, RELACJE.neutralna);
    check('(2-PO-neutralna) dar 300 PW przy neutralnej relacji -> pwBalance dodatni '
      + '(300), canAccept=true',
      resPo.accepted === true && resPo.pwBalance === 300 && panelPo.canAccept === true,
      { resPo, panelPo });
  }
  {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, RELACJE.bardzoDobra);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    const panelPo = incomingCanAccept(fixed, resPo, proposal.payload, RELACJE.bardzoDobra);
    check('(2-PO-bardzoDobra) NAPRAWIONE: dar 300 PW przy bardzo dobrej relacji -> pwBalance '
      + 'dodatni (750), canAccept=true',
      resPo.accepted === true && resPo.pwBalance === 750 && panelPo.canAccept === true,
      { resPo, panelPo });
  }

  // ==========================================================================
  // TEST 3 — gałąź gracz-proponent ('pokoj' proposerOwnerId=0).
  //
  // Historycznie (runda 3): ta gałąź MIAŁA zostać bit-identyczna (accepted+reason+pwBalance)
  // PRZED/PO naprawą formuły — naprawa rundy 3 dotyczyła WYŁĄCZNIE gałęzi AI-proponenta
  // (kryterium #3 rundy 3: "NIE zepsuj przy okazji działającego kierunku proposerIsPlayer===
  // true"). To NADAL prawda dla samej LICZBY pwBalance (formuła gałęzi proposerIsPlayer nie
  // zmieniła się ani w rundzie 3, ani w rundzie 4 — patrz `treatyBaseFairnessGap(basePn, givePn,
  // receivePn, relTotal)` w case 'pokoj', proposerIsPlayer ? ... gałąź, NIETKNIĘTA).
  //
  // AKTUALIZACJA RUNDA 4 (P-DYPLO-BILANS-GATE-NIESPOJNY-N-E1-REPRODUKCJA, decyzja właściciela —
  // kryterium końca #4 dispatchu rundy 4: "Test również odwrotnego kierunku (gracz proponuje
  // pokoj AI) — również bez blokady PW"): `accepted` dla tej gałęzi PRZESTAJE być bit-
  // identyczna z przed-rundą-4 (mutR2, teraz przywracająca też blokadę sprzed rundy 4) —
  // DOKŁADNIE tam, gdzie `gap>0` (relTotal capowany wojennie <=29 niezależnie od jakości
  // relacji — TA SAMA reguła co gałąź AI-proponenta przed naprawą rundy 3 — więc pusty koszyk
  // blokował WCZEŚNIEJ przy KAŻDEJ jakości relacji, nie tylko złej), mutR2 (PRZED rundą 4) daje
  // accepted:false, a fixed (PO, bieżący kod) daje accepted:true. Test niżej sprawdza OBA fakty
  // naraz: (a) pwBalance NIETKNIĘTY (bit-identyczny), (b) fixed.accepted zawsze true (nowa
  // reguła), (c) przynajmniej jeden scenariusz naprawdę POKAZUJE różnicę accepted PRZED/PO —
  // kontrola nietautologiczna, żeby (b) nie przechodziło przypadkiem niezależnie od kodu.
  // ==========================================================================
  console.log('\n--- TEST 3 (gałąź gracz-proponent: pwBalance nietknięty, canAccept nigdy nie blokuje od rundy 4) ---');
  const playerScenarios = [
    ['pusty koszyk, zła relacja', {}, RELACJE.zla],
    ['pusty koszyk, neutralna relacja', {}, RELACJE.neutralna],
    ['pusty koszyk, bardzo dobra relacja', {}, RELACJE.bardzoDobra],
    ['koszyk 400 PW (goldOnce), zła relacja', { goldOnce: 400 }, RELACJE.zla],
    ['koszyk 400 PW (goldOnce), bardzo dobra relacja', { goldOnce: 400 }, RELACJE.bardzoDobra],
  ];
  let anyAcceptedDiffered = false;
  for (const [label, payload, relation] of playerScenarios) {
    const { proposal, ctx } = playerPeaceProposal(payload, relation);
    const resPrzed = mutR2_mod.evaluateProposal(proposal, ctx);
    const resPo = fixed.evaluateProposal(proposal, ctx);
    console.log('  [' + label + '] PRZED (sprzed rundy 4): accepted=' + resPrzed.accepted
      + ' pwBalance=' + resPrzed.pwBalance
      + '  |  PO (runda 4): accepted=' + resPo.accepted + ' pwBalance=' + resPo.pwBalance);
    if (resPrzed.accepted !== resPo.accepted) anyAcceptedDiffered = true;
    check('(3a-' + label + ') pwBalance NIETKNIĘTY rundą 4 (bit-identyczny PRZED/PO — formuła '
      + 'gałęzi proposerIsPlayer nie zmieniła się)',
      resPrzed.pwBalance === resPo.pwBalance, { przed: resPrzed, po: resPo });
    check('(3b-' + label + ") RUNDA 4: accepted=TRUE dla gracza-proponenta 'pokoj', niezależnie "
      + 'od znaku pwBalance (kryterium końca #4 dispatchu rundy 4, kierunek gracz->AI)',
      resPo.accepted === true, resPo);
  }
  check('(3c) kontrola nietautologiczna: przynajmniej jeden z powyższych scenariuszy NAPRAWDĘ '
    + 'miał accepted:false PRZED rundą 4 (mutR2 z przywróconą blokadą) — dowodzi, że (3b) '
    + 'testuje realną zmianę zachowania, nie przechodzi niezależnie od kodu',
    anyAcceptedDiffered === true, { anyAcceptedDiffered });

  // ==========================================================================
  // TEST 4 — PROOF: dosłowna zamiana argumentów (kierunek naprawy dosłownie zgodny z tekstem
  // dispatchu rundy 3 — "swap rol PRZED wywolaniem treatyBaseFairnessGap", relTotal wojennie
  // ograniczony BEZ zmian) NIE naprawia problemu — (a) pusty koszyk daje WYNIK BIT-IDENTYCZNY z
  // rundą 2 (0 zamienione z 0 to nadal 0 — zamiana argumentów nie ma żadnego efektu przy pustym
  // koszyku), (b) scenariusz "dar 300 PW za darmo" wychodzi GORZEJ niż w rundzie 2 (dar trafia do
  // argumentu ODEJMOWANEGO zamiast DODAWANEGO — odwrócona polaryzacja). Dowodzi, że naprawa
  // wymagała zmiany innej niż dosłowna zamiana (relTotal surowy zamiast wojennie ograniczonego —
  // patrz komentarz przy `case 'pokoj'` w diplomacy-proposals.ts).
  // ==========================================================================
  console.log('\n--- TEST 4 (PROOF: sama zamiana argumentów NIE wystarcza) ---');
  {
    const { proposal, ctx } = aiPeaceProposal({}, RELACJE.neutralna);
    const resR2 = mutR2_mod.evaluateProposal(proposal, ctx);
    const resSwap = mutSwap_mod.evaluateProposal(proposal, ctx);
    check('(4a) PROOF pusty koszyk: sama zamiana argumentów (bez zmiany relTotal) daje '
      + 'pwBalance BIT-IDENTYCZNY z rundą 2 dla neutralnej relacji (-355, nadal ujemny, '
      + 'canAccept nadal false) — zamiana SAMA W SOBIE nie naprawia kryterium końca #2',
      resSwap.pwBalance === resR2.pwBalance && resSwap.pwBalance === -355,
      { resR2, resSwap });
  }
  {
    const { proposal, ctx } = aiPeaceProposal({ goldOnce: 300 }, RELACJE.neutralna);
    const resR2 = mutR2_mod.evaluateProposal(proposal, ctx);
    const resSwap = mutSwap_mod.evaluateProposal(proposal, ctx);
    console.log('  dar 300 PW, neutralna: runda2=' + resR2.pwBalance + ' swap-doslowny=' + resSwap.pwBalance);
    check('(4b) PROOF dar 300 PW: sama zamiana argumentów pogarsza wynik względem rundy 2 '
      + '(-655 < -55) zamiast go naprawiać — dar od AI trafia do argumentu odejmowanego zamiast '
      + 'dodawanego, odwrócona polaryzacja — POTWIERDZA, że dosłowna zamiana z dispatchu jest '
      + 'niewystarczająca/błędna, uzasadniając odejście od niej w naprawie tej rundy',
      resSwap.pwBalance < resR2.pwBalance && resSwap.pwBalance === -655,
      { resR2, resSwap });
  }

  console.log('\n=== PODSUMOWANIE: ' + pass + ' PASS / ' + fail + ' FAIL ===');
  cleanup();
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  cleanup();
  process.exit(1);
});
