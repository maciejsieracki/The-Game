'use strict';
/**
 * dyplo-pokoj-kierunek-runda1-test.cjs
 *
 * TEMAT: R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1 — RUNDA 1
 *
 * CZĘŚĆ A: bramka bilansu PW dla 'pokoj' ma być KIERUNKOWA — pominięta gdy PARTNER jest
 * autorem AKTUALNYCH warunków (direction=incoming, ctx.authorOwnerId != gracz), zastosowana
 * gdy GRACZ jest autorem (direction=own, ctx.authorOwnerId===gracz) — DYNAMICZNIE, nie przez
 * statyczny `proposerOwnerId` (patrz komentarz `authorOwnerId` przy ProposalEvalContext w
 * diplomacy-proposals.ts). TEST 3 niżej jest kryterium końca krytycznym: kontroferta, gdzie
 * proposerOwnerId (statyczny, partner) i authorOwnerId (dynamiczny, po kontrofercie: gracz)
 * się rozjeżdżają — dokładnie miejsce, w którym naiwna bramka oparta o proposerOwnerId
 * dawałaby błędny wynik (przepuściłaby nieuczciwą kontrofertę gracza).
 *
 * CZĘŚĆ B: AI, proponując "goły" pokój, ma zażądać surowców/złota od gracza, żeby wyrównać
 * WŁASNY bilans PW (peaceOfferAiOwnBilans, diplomacy-ai-offer-balance.ts) do bliskiego zera —
 * NOWA logika (rozszerzenie D-DYPLO-AI-OFERTA-ZERO na 'pokoj', dotąd tylko handel/traktaty
 * handlowe). UWAGA ZNAKU udokumentowana w kodzie i tu: bilans AI jest NIEKORZYSTNY przy
 * WYSOKIEJ (surowej) Relacji, nie niskiej — zweryfikowane wprost testem regresji rundy 3
 * P-DYPLO-BILANS-GATE (dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs, TEST 2: AI daje
 * 300 PW za darmo -> pwBalance idzie W GÓRĘ = korzystniej dla GRACZA, czyli mniej korzystnie
 * dla AI) — TEST 5 niżej odtwarza to jawnie jako PROOF, bo dosłowny przykład dispatchu
 * ("relacja niska") wskazywał kierunek przeciwny do zweryfikowanej matematyki.
 *
 * Usage (z gra/): node tools/dyplo-pokoj-kierunek-runda1-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.dyplo-pokoj-kierunek-r1-entry.ts');
const DIPLO_PROPOSALS = path.resolve(GRA, 'src', 'game', 'diplomacy-proposals.ts');

const BUNDLES = {
  fixed: path.resolve(__dirname, '.dyplo-pokoj-kierunek-r1-fixed.cjs'),
  mutStatic: path.resolve(__dirname, '.dyplo-pokoj-kierunek-r1-mutStatic.cjs'),
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
    "/* GENEROWANY PRZEZ dyplo-pokoj-kierunek-runda1-test.cjs — nie edytowac recznie. */",
    "export {",
    "  evaluateProposal, createNegotiation, applyCounterOffer, negotiationAsProposal,",
    "  treatyEvalRelationTotal, treatyBasePnFromConfig,",
    "} from '../src/game/diplomacy-proposals';",
    "export { relationTotal } from '../src/game/diplomacy-pn-engine';",
    "export {",
    "  peaceOfferAiOwnBilans, peaceOfferAiRequestPn, peaceOfferAiRequestBasket,",
    "  aiOfferPwSurplusTolerance,",
    "} from '../src/game/diplomacy-ai-offer-balance';",
    "",
  ].join('\n'), 'utf8');
}

/* Mutacja KONTROLNA (nietautologiczna): usuwa fallback dynamiczny `ctx.authorOwnerId ??
 * proposerOwnerId` w case 'pokoj', wracając do WYŁĄCZNIE statycznego `proposerOwnerId` — to
 * jest DOKŁADNIE błąd, przed którym ostrzega recon dispatchu ("ZASTRZEŻENIE ARCHITEKTONICZNE").
 * Jeśli TEST 3 (kontroferta) przechodzi identycznie z tą mutacją, test nie dowodzi niczego
 * (tautologia) — MUSI się różnić (mutStatic błędnie przepuszcza kontrofertę gracza). */
const mutStatic = { applied: 0 };
const NEEDLE = 'const authorOwnerId = ctx.authorOwnerId ?? proposerOwnerId;';
const pluginStatic = {
  name: 'force-static-proposerOwnerId-for-pokoj-gate',
  setup(build) {
    build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== DIPLO_PROPOSALS) return null;
      const src = fs.readFileSync(args.path, 'utf8');
      const out = src.replace(NEEDLE, () => {
        mutStatic.applied++;
        return 'const authorOwnerId = proposerOwnerId;';
      });
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

const RELACJE = {
  zla: { zaufanie: 5, respekt: 5, status: 'wojna' },
  wysoka: { zaufanie: 95, respekt: 95, status: 'wojna' },
};

function baseCtx(relation) {
  return {
    relation, stanWojny: true, turn: 80,
    proposerRespekt: 60, responderRespekt: 60, militaryRatio: 1, respektWzgledny: 0.5,
    karaWspolnaGranica: false, difficulty: 'normal',
  };
}

async function main() {
  writeEntry();
  await buildBundle(BUNDLES.fixed, []);
  await buildBundle(BUNDLES.mutStatic, [pluginStatic]);

  check('(0) mutacja kontrolna faktycznie usunęła fallback dynamiczny authorOwnerId '
    + '(1 podmiana) — kontrola nietautologiczna aktywna',
    mutStatic.applied === 1, mutStatic.applied);

  const fixed = require(BUNDLES.fixed);
  const mutS = require(BUNDLES.mutStatic);

  // ==========================================================================
  // CZĘŚĆ A — TEST 1: (i) partner proponuje pokój (direction=incoming), bilans ujemny (bara
  // relacja, brak koszyka) -> gracz MOŻE zaakceptować (accepted=true) NIEZALEŻNIE od bilansu.
  // ==========================================================================
  console.log('\n--- CZĘŚĆ A / TEST 1 (incoming: partner proponuje, bilans ujemny) ---');
  {
    const entry = fixed.createNegotiation(
      { actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0, payload: {} },
      80, 'ai', 1,
    );
    check('(1a) round1: authorOwnerId=partner (1), awaitingOwnerId=gracz (0) — direction=incoming',
      entry.authorOwnerId === 1 && entry.awaitingOwnerId === 0, entry);
    const ctx = { ...baseCtx(RELACJE.zla), authorOwnerId: entry.authorOwnerId };
    const proposal = fixed.negotiationAsProposal(entry);
    const res = fixed.evaluateProposal(proposal, ctx);
    check('(1b) incoming, bilans ujemny (' + res.pwBalance + ') -> accepted=true (bramka pominięta)',
      res.accepted === true && typeof res.pwBalance === 'number' && res.pwBalance < 0, res);
  }

  // ==========================================================================
  // CZĘŚĆ A — TEST 2: (ii) gracz proponuje pokój (direction=own, round1, brak kontroferty),
  // bilans ujemny (goły koszyk, wojna) -> NIE MOŻE wysłać (accepted=false, blockReason/reason).
  // ==========================================================================
  console.log('\n--- CZĘŚĆ A / TEST 2 (own: gracz proponuje wprost, bilans ujemny) ---');
  {
    const entry = fixed.createNegotiation(
      { actionId: 'pokoj', proposerOwnerId: 0, responderOwnerId: 1, payload: {} },
      80, 'player', 1,
    );
    check('(2a) round1: authorOwnerId=gracz (0), awaitingOwnerId=partner (1) — direction=own',
      entry.authorOwnerId === 0 && entry.awaitingOwnerId === 1, entry);
    const ctx = { ...baseCtx(RELACJE.zla), authorOwnerId: entry.authorOwnerId };
    const proposal = fixed.negotiationAsProposal(entry);
    const res = fixed.evaluateProposal(proposal, ctx);
    check('(2b) own, bilans ujemny (' + res.pwBalance + ') -> accepted=false (bramka zastosowana)',
      res.accepted === false && typeof res.pwBalance === 'number' && res.pwBalance < 0
      && typeof res.reason === 'string' && res.reason.length > 0,
      res);
  }

  // ==========================================================================
  // CZĘŚĆ A — TEST 3 (KRYTYCZNY, zakaz uznania za gotowe bez tego testu): (iii) partner
  // proponuje pierwszy (proposerOwnerId=partner=1, round1), GRACZ licytuje kontrofertę (goły
  // koszyk, bez poprawy bilansu) -> authorOwnerId zmienia się na gracza (0), ale statyczny
  // proposerOwnerId NADAL wskazuje partnera (1). Bramka MUSI teraz zadziałać (direction=own
  // z perspektywy gracza), mimo że proposerOwnerId!=gracz.
  // ==========================================================================
  console.log('\n--- CZĘŚĆ A / TEST 3 (KRYTYCZNY: kontroferta, proposerOwnerId != authorOwnerId) ---');
  {
    const entry1 = fixed.createNegotiation(
      { actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0, payload: {} },
      80, 'ai', 1,
    );
    // Gracz kontruje (nadal goły koszyk — kontroferta nie poprawia bilansu, np. gracz tylko
    // przesunął czas negocjacji) — authorOwnerId=0 (gracz), round=2.
    const entry2 = fixed.applyCounterOffer(entry1, {}, 0, 81);
    check('(3a) po kontrofercie: proposerOwnerId NADAL partner (1, statyczny, niezmieniony), ale '
      + 'authorOwnerId=gracz (0, dynamiczny, ZMIENIONY) i awaitingOwnerId=partner (1) — dokładnie '
      + 'rozjazd statyczny/dynamiczny opisany w recon dispatchu',
      entry2.proposerOwnerId === 1 && entry2.authorOwnerId === 0 && entry2.awaitingOwnerId === 1
      && entry2.round === 2,
      entry2);

    const ctx = { ...baseCtx(RELACJE.zla), authorOwnerId: entry2.authorOwnerId };
    const proposal = fixed.negotiationAsProposal(entry2);

    const resFixed = fixed.evaluateProposal(proposal, ctx);
    check('(3b) NAPRAWIONE (authorOwnerId dynamiczny): bramka WYKRYWA, że TERAZ gracz jest '
      + 'autorem (mimo proposerOwnerId=partner) -> accepted=false, bilans ujemny ('
      + resFixed.pwBalance + ')',
      resFixed.accepted === false && typeof resFixed.pwBalance === 'number' && resFixed.pwBalance < 0,
      resFixed);

    const resMut = mutS.evaluateProposal(proposal, ctx);
    check('(3c) DOWÓD REGRESJI (kontrola nietautologiczna, mutacja proposerOwnerId-statyczny): '
      + 'BEZ dynamicznego authorOwnerId bramka błędnie patrzy na proposerOwnerId=partner (1) i '
      + 'NIE wykrywa, że gracz właśnie wylicytował te warunki -> accepted=true mimo ujemnego '
      + 'bilansu (' + resMut.pwBalance + ') — dokładnie błąd, przed którym ostrzegał recon '
      + '(ZASTRZEŻENIE ARCHITEKTONICZNE, 00-dispatch.md)',
      resMut.accepted === true && typeof resMut.pwBalance === 'number' && resMut.pwBalance < 0,
      resMut);

    check('(3d) TEST 3 jest nietautologiczny: (3b) i (3c) dają RÓŻNY wynik accepted dla TEJ '
      + 'SAMEJ propozycji/ctx — jedyna różnica to fallback authorOwnerId vs proposerOwnerId',
      resFixed.accepted !== resMut.accepted, { resFixed, resMut });
  }

  // ==========================================================================
  // CZĘŚĆ A — TEST 4: fallback wsteczny — wywołujący BEZ ctx.authorOwnerId (np.
  // evaluatePendingFromAI/generateCounterOffer, poza stołem negocjacji) musi zachować
  // DOKŁADNIE stare zachowanie (fallback na proposerOwnerId statyczny).
  // ==========================================================================
  console.log('\n--- CZĘŚĆ A / TEST 4 (fallback bez ctx.authorOwnerId — wsteczna zgodność) ---');
  {
    const proposal = { actionId: 'pokoj', proposerOwnerId: 1, responderOwnerId: 0, payload: {} };
    const ctx = baseCtx(RELACJE.zla); // BEZ authorOwnerId
    const res = fixed.evaluateProposal(proposal, ctx);
    check('(4) brak ctx.authorOwnerId -> fallback proposerOwnerId (partner, 1) -> authorIsPlayer '
      + '=false -> accepted=true (bit-identyczne ze stanem sprzed tej rundy dla wywołujących bez '
      + 'pojęcia kontroferty)',
      res.accepted === true && typeof res.pwBalance === 'number' && res.pwBalance < 0, res);
  }

  // ==========================================================================
  // CZĘŚĆ B — TEST 5: bilans AI dla "gołego" pokoju — UWAGA ZNAKU (PROOF): niekorzystny dla AI
  // przy WYSOKIEJ (surowej) relacji, korzystny przy NISKIEJ — odwrotnie niż dosłowny przykład
  // dispatchu ("relacja niska"), zgodnie ze zweryfikowaną matematyką treatyBaseFairnessGap
  // (patrz komentarz peaceOfferAiOwnBilans w diplomacy-ai-offer-balance.ts).
  // ==========================================================================
  console.log('\n--- CZĘŚĆ B / TEST 5 (bilans AI gołego pokoju — kierunek, PROOF) ---');
  {
    const basePn = fixed.treatyBasePnFromConfig('pokoj', {});
    check('(5a) baza traktatu pokoju > 0 (z acceptance-points.json)', basePn > 0, basePn);

    const relZla = fixed.relationTotal(RELACJE.zla);
    const bilansZla = fixed.peaceOfferAiOwnBilans(0, 0, relZla, basePn);
    const relWysoka = fixed.relationTotal(RELACJE.wysoka);
    const bilansWysoka = fixed.peaceOfferAiOwnBilans(0, 0, relWysoka, basePn);

    check('(5b) niska relacja (relTotal=' + relZla + '): bilans AI DODATNI (' + bilansZla
      + ') — goły pokój już KORZYSTNY dla AI, nic do dopisania',
      bilansZla > 0, bilansZla);
    check('(5c) wysoka relacja (relTotal=' + relWysoka + '): bilans AI UJEMNY (' + bilansWysoka
      + ') — goły pokój NIEKORZYSTNY dla AI, wymaga kompensacji',
      bilansWysoka < 0, bilansWysoka);
  }

  // ==========================================================================
  // CZĘŚĆ B — TEST 6: gdy bilans AI niekorzystny (wysoka relacja) -> peaceOfferAiRequestPn>0
  // i peaceOfferAiRequestBasket generuje NIEPUSTY koszyk (receiveItems), a dopisanie go
  // realnie zbliża bilans AI do zera (w tolerancji) — kryterium końca CZĘŚCI B.
  // ==========================================================================
  console.log('\n--- CZĘŚĆ B / TEST 6 (dopisanie żądania -> bilans AI bliski zera) ---');
  {
    const basePn = fixed.treatyBasePnFromConfig('pokoj', {});
    const relTotal = fixed.relationTotal(RELACJE.wysoka);
    const tolerance = fixed.aiOfferPwSurplusTolerance('normal');
    const neededPn = fixed.peaceOfferAiRequestPn(0, 0, relTotal, basePn, 'normal');
    check('(6a) neededPn > 0 (bilans AI niekorzystny przy wysokiej relacji)', neededPn > 0, neededPn);

    const items = fixed.peaceOfferAiRequestBasket(neededPn, [
      { id: 'zelazo', label: 'Żelazo', maxQty: 1000 },
    ]);
    check('(6b) receiveItems NIEPUSTY (AI żąda czegoś od gracza zamiast gołego pokoju)',
      Array.isArray(items) && items.length > 0, items);

    const item = items[0];
    check('(6c) pozycja koszyka ma dodatnią ilość', (item.ilosc ?? 0) > 0, item);

    // Weryfikacja bezpośrednio na wzorze (bez zależności od zaokrągleń konwersji PN->sztuki):
    // `peaceOfferAiRequestPn` jest zdefiniowany tak, że dodanie DOKŁADNIE `neededPn` do
    // receivePn AI przywraca bilans do granicy tolerancji (Math.ceil(-tolerance - bilans)).
    const bilansZNeededPn = fixed.peaceOfferAiOwnBilans(0, neededPn, relTotal, basePn);
    check('(6d) po dodaniu DOKŁADNIE neededPn do receivePn AI -> bilans AI w granicy tolerancji '
      + '(' + bilansZNeededPn + ' >= -' + tolerance + ')',
      bilansZNeededPn >= -tolerance - 0.001, { bilansZNeededPn, tolerance });
  }

  // ==========================================================================
  // CZĘŚĆ B — TEST 7: bilans AI już w tolerancji (niska relacja) -> peaceOfferAiRequestPn===0,
  // AI NIC nie dopisuje (nie żąda niepotrzebnie, gdy już korzystnie/neutralnie).
  // ==========================================================================
  console.log('\n--- CZĘŚĆ B / TEST 7 (bilans AI już OK -> brak żądania) ---');
  {
    const basePn = fixed.treatyBasePnFromConfig('pokoj', {});
    const relTotal = fixed.relationTotal(RELACJE.zla);
    const neededPn = fixed.peaceOfferAiRequestPn(0, 0, relTotal, basePn, 'normal');
    check('(7) niska relacja, bilans AI już dodatni -> neededPn===0 (nic do dopisania)',
      neededPn === 0, neededPn);
  }

  console.log('\n=== WYNIK: ' + pass + ' PASS, ' + fail + ' FAIL ===');
  cleanup();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  cleanup();
  process.exit(1);
});
