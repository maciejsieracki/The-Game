'use strict';
/**
 * diplo-treaty-payment-wiring-test.cjs -- R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1 (obrona r2, zarzut 1 i 3).
 * Wiring nośnika dopłaty D w ocenie propozycji (diplomacy-proposals.ts: treatyCarrierPlanForPlayerPayer,
 * bramka treatyParityPowerGate, attachTreatyCarrier) dla GRACZA-płatnika: NAP i sojusz pełny.
 *
 *  (W1) słaby gracz, zapasy zerowe: odrzut z powodem „brakuje X PW” + informacja o braku zapasów;
 *  (W2) słaby gracz, zapas pełny: bramka przepuszcza (accepted), wynik niesie treatyCarrier z pozycjami złota;
 *  (W3) to samo dla sojuszu pełnego (ten sam mechanizm);
 *  (W4) silniejszy gracz: plan = null, brak treatyCarrier;
 *  (W5) AI proponuje graczowi (płatnik = AI): plan = null — ZAŁOŻENIE/NIE ZMIERZONO (decyzja 2 z dispatchu,
 *       silna AI żąda D od gracza, NIE podłączone; ten test dokumentuje obecny stan);
 *  (W6) zapas pomniejszony o pozycje koszyka już oferowane (brak podwójnego liczenia złota);
 *  (W7) r = 1 ⇒ D = 0 ⇒ brak planu i brak nośnika;
 *  (W8) Σ extra[].pn = coveredByExtraPn ≤ reszta D (zarzut 7, komposer).
 *  (W9) granice i wasal (poza zakresem nośnika): bramka parytetu nadal odrzuca, brak treatyCarrier.
 *  Mutanty (wstrzykiwane przez plugin esbuild do źródła diplomacy-proposals.ts, bez zmian w repo):
 *   M1 bramka ignoruje nośnik (zawsze odrzuca) → W2/W3 muszą czerwienić;
 *   M2 brak attachTreatyCarrier → W2/W3 muszą czerwienić;
 *   M3 brak odejmowania koszyka od zapasu → W6 musi czerwienić.
 *
 *   node tools/diplo-treaty-payment-wiring-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-carrier-wiring-entry.ts');
const PROPOSALS = path.resolve(SRC, 'game', 'diplomacy-proposals.ts');
const BUNDLE_DIR = path.resolve(__dirname);

fs.writeFileSync(ENTRY, `
export { evaluateProposal, treatyCarrierPlanForPlayerPayer, treatyBasePnFromConfig, treatyCarrierPayloadPatch } from './game/diplomacy-proposals';
export { diplomacyPnTech } from './game/diplomacy-value-catalog';
export { composeTreatyPayment } from './game/treaty-payment';
`);

/** Buduje bundle; `mutate` = { from, to } podmienia tekst w diplomacy-proposals.ts (musi wystąpić dokładnie raz). */
async function buildBundle(tag, mutate) {
  const outfile = path.resolve(BUNDLE_DIR, `.dip-carrier-wiring-${tag}.cjs`);
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    absWorkingDir: SRC,
    logLevel: 'silent',
    plugins: mutate ? [{
      name: 'mutant-proposals',
      setup(build) {
        build.onLoad({ filter: /diplomacy-proposals\.ts$/ }, () => {
          const text = fs.readFileSync(PROPOSALS, 'utf8');
          const n = text.split(mutate.from).length - 1;
          if (n !== 1) throw new Error(`mutant ${tag}: wzorzec wystepuje ${n}x (oczekiwano 1)`);
          return { contents: text.replace(mutate.from, mutate.to), loader: 'ts' };
        });
      },
    }] : [],
  });
  const mod = require(outfile);
  fs.unlinkSync(outfile);
  return mod;
}

let pass = 0;
let fail = 0;
let quiet = false; // w przebiegach mutantów błędy asercji są OCZEKIWANYM wykryciem — nie drukujemy ich
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  if (!quiet) console.error('[FAIL]', msg);
}

const baseCtx = {
  relation: { zaufanie: 150, respekt: 150, status: 'pokoj' },
  stanWojny: false,
  turn: 1,
  difficulty: 'normal',
  activeDeals: [],
  proposerRespekt: 50,
  responderRespekt: 50,
  proposerWiarygodnosc: 100,
  responderWiarygodnosc: 100,
};
const RICH = { zloto: 1e7, brak: 0, zelazo: 1e7, ruda: 1e7, ruda_cyny: 1e7, ruda_zelaza: 1e7 };
const ZERO = { zloto: 0, brak: 0, zelazo: 0, ruda: 0, ruda_cyny: 0, ruda_zelaza: 0 };

function run(mod) {
  const weakCtxRich = { ...baseCtx, treatyPower: { powerPlayer: 100, powerOther: 400 }, playerStock: RICH, tradeEra: 1 };
  const weakCtxZero = { ...baseCtx, treatyPower: { powerPlayer: 100, powerOther: 400 }, playerStock: ZERO, tradeEra: 1 };
  const napP = (payload) => ({ actionId: 'nap', proposerOwnerId: 0, responderOwnerId: 1, payload });
  const allP = (payload) => ({ actionId: 'sojusz_pelny', proposerOwnerId: 0, responderOwnerId: 1, payload });

  // W1: zapas zerowy → odrzut, powód z parytetem i informacją o braku zapasów.
  const w1 = mod.evaluateProposal(napP({}), weakCtxZero);
  ok(!w1.accepted, 'W1: słaby gracz bez zapasów: odrzucony');
  ok((w1.reason ?? '').includes('parytetu'), `W1: powód z parytetem (jest: ${w1.reason})`);
  ok((w1.reason ?? '').includes('brak zapasów'), `W1: powód mówi o braku zapasów (jest: ${w1.reason})`);
  ok(w1.treatyCarrier === undefined, 'W1: brak treatyCarrier przy odrzuceniu');

  // W2: zapas pełny → bramka przepuszcza; wynik niesie nośnik (złoto ze Skarbca).
  const w2 = mod.evaluateProposal(napP({}), weakCtxRich);
  ok(!(w2.reason ?? '').includes('parytetu'), `W2: zapas pełny: bramka parytetu przepuszcza (powód: ${w2.reason})`);
  ok(w2.accepted === true, `W2: NAP z pełnym nośnikiem akceptowany (accepted=${w2.accepted}, powód: ${w2.reason})`);
  ok(w2.treatyCarrier != null && w2.treatyCarrier.items.length > 0, 'W2: treatyCarrier niesie pozycje płatności');
  ok(w2.treatyCarrier && w2.treatyCarrier.items.every(i => i.typ === 'zloto' || i.typ === 'surowiec_ilosc'),
    'W2: pozycje nośnika to złoto/surowce (typ zgodny z koszykiem)');
  ok(w2.treatyCarrier && w2.treatyCarrier.coveredPn > 0, 'W2: coveredPn > 0');

  // W3: sojusz pełny — ten sam mechanizm.
  const w3 = mod.evaluateProposal(allP({}), weakCtxRich);
  ok(w3.accepted === true, `W3: sojusz pełny z pełnym nośnikiem akceptowany (accepted=${w3.accepted}, powód: ${w3.reason})`);
  ok(w3.treatyCarrier != null, 'W3: sojusz niesie treatyCarrier');

  // W9 (r2): granice i wasal — ścieżka akceptacji przelewa koszyk (generic `else if` w main.ts): nośnik działa jak NAP.
  for (const act of ['granice', 'wasal']) {
    // wasal wymaga Respektu proponującego ≥ 70 (bramka wasalizacji) — ustawiamy go, żeby sprawdzić nośnik, nie próg.
    const w9ctx = { ...weakCtxRich, proposerRespekt: 100 };
    const w9 = mod.evaluateProposal({ actionId: act, proposerOwnerId: 0, responderOwnerId: 1, payload: {} }, w9ctx);
    ok(w9.accepted === true, `W9: ${act} z pełnym nośnikiem akceptowany (accepted=${w9.accepted}, powód: ${w9.reason})`);
    ok(w9.treatyCarrier != null && w9.treatyCarrier.items.length > 0, `W9: ${act} niesie treatyCarrier`);
    const w9z = mod.evaluateProposal({ actionId: act, proposerOwnerId: 0, responderOwnerId: 1, payload: {} }, { ...weakCtxZero, proposerRespekt: 100 });
    ok(w9z.accepted === false && (w9z.reason ?? '').includes('parytetu'), `W9: ${act} bez zapasów odrzucony z powodem parytetu`);
  }

  // W10 (r2): stopień technologii w wiringu — tech gracza, której AI nie ma, trafia do treatyCarrier jako typ 'tech'.
  const T = 'Rolnictwo';
  const w10 = mod.evaluateProposal(napP({}), { ...weakCtxRich, playerTechs: [T], partnerTechs: [] });
  ok(w10.accepted === true, `W10: NAP z techem i zapasem akceptowany (accepted=${w10.accepted}, powód: ${w10.reason})`);
  ok(w10.treatyCarrier && w10.treatyCarrier.items.some(i => i.typ === 'tech' && i.id === T),
    `W10: treatyCarrier niesie technologię ${T} (typ tech) jako pierwszy stopień`);
  ok(w10.treatyCarrier && w10.treatyCarrier.items[0] && w10.treatyCarrier.items[0].typ === 'tech',
    'W10: pozycje techów przed ogonem złota');

  // W11 (r2): tech, którą druga strona JUŻ ma, NIE wchodzi do nośnika (brak odkrycia-duplikatu).
  const w11 = mod.evaluateProposal(napP({}), { ...weakCtxRich, playerTechs: [T], partnerTechs: [T] });
  ok(!(w11.treatyCarrier && w11.treatyCarrier.items.some(i => i.typ === 'tech')),
    `W11: tech posiadana przez drugą stronę nie trafia do nośnika (items: ${JSON.stringify(w11.treatyCarrier && w11.treatyCarrier.items)})`);

  // W12 (r2): planer przyjmuje listy technologii z wywołania; bez nich brak stopnia technologii.
  const planT = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1, { payerTechs: [T], otherTechs: [] });
  ok(planT && planT.payment.techs.some(t => t.name === T), 'W12: planer z techem płatnika wybiera technologię');
  const planN = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1);
  ok(planN && planN.payment.techs.length === 0, 'W12: bez listy technologii brak stopnia technologii');

  // W4: silniejszy gracz → plan = null, brak nośnika.
  const strongCtx = { ...baseCtx, treatyPower: { powerPlayer: 400, powerOther: 100 }, playerStock: RICH, tradeEra: 1 };
  const w4 = mod.evaluateProposal(napP({}), strongCtx);
  ok(w4.treatyCarrier === undefined, 'W4: silniejszy gracz: brak treatyCarrier');
  ok(mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 400, powerOther: 100 }, 0, RICH, 1) === null, 'W4: plan = null dla silniejszego gracza');

  // W5 (r3, zarzut 1): AI proponuje graczowi, gracz słabszy = płatnik. Plan niepusty, strona 'responder' (receiveItems).
  const aiProp = { actionId: 'nap', proposerOwnerId: 1, responderOwnerId: 0, payload: {} };
  const w5plan = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 1, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1);
  ok(w5plan !== null && w5plan.payerSide === 'responder', 'W5: AI→gracz: plan dla słabszego gracza (payerSide=responder)');
  ok(w5plan !== null && w5plan.payment.full === true, 'W5: AI→gracz z pełnym zapasem: nośnik pokrywa D');
  const w5 = mod.evaluateProposal(aiProp, weakCtxRich);
  ok(w5.accepted === true, `W5: AI→gracz NAP, słaby gracz z zapasem: akceptowany (accepted=${w5.accepted}, powód: ${w5.reason})`);
  ok(w5.treatyCarrier != null && w5.treatyCarrier.side === 'responder' && w5.treatyCarrier.items.length > 0,
    'W5: nośnik AI→gracz ma side=responder (pozycje gracza, receiveItems)');
  const w5z = mod.evaluateProposal(aiProp, weakCtxZero);
  ok(w5z.accepted === false && (w5z.reason ?? '').includes('parytetu'), `W5: AI→gracz bez zapasów odrzucony z parytetem (powód: ${w5z.reason})`);
  // W5b: silny gracz wobec AI proponującej → plan null (płaci AI, nie gracz).
  ok(mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 1, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 400, powerOther: 100 }, 0, RICH, 1) === null, 'W5b: AI→silniejszy gracz: plan = null');

  // W13 (r3, zarzut 4): sojusz obronny w obu kierunkach (gracz proponuje i AI proponuje).
  const defP = { actionId: 'sojusz_defensywny', proposerOwnerId: 0, responderOwnerId: 1, payload: {} };
  const defA = { actionId: 'sojusz_defensywny', proposerOwnerId: 1, responderOwnerId: 0, payload: {} };
  const d1 = mod.evaluateProposal(defP, weakCtxRich);
  ok(d1.accepted === true && d1.treatyCarrier && d1.treatyCarrier.side === 'proposer', `W13: sojusz obronny gracz→AI akceptowany, side=proposer (accepted=${d1.accepted}, powód: ${d1.reason})`);
  const d2 = mod.evaluateProposal(defA, weakCtxRich);
  ok(d2.accepted === true && d2.treatyCarrier && d2.treatyCarrier.side === 'responder', `W13: sojusz obronny AI→gracz akceptowany, side=responder (accepted=${d2.accepted}, powód: ${d2.reason})`);
  ok(mod.evaluateProposal(defP, weakCtxZero).accepted === false, 'W13: sojusz obronny gracz→AI bez zapasów odrzucony');
  ok(mod.evaluateProposal(defA, weakCtxZero).accepted === false, 'W13: sojusz obronny AI→gracz bez zapasów odrzucony');

  // W14 (r3, zarzut 5): wycena technologii nośnika idzie w tempie gry (szybka ×1 ≠ standardowa ×2).
  const tSz = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1, { payerTechs: [T], otherTechs: [], tempoGry: 'szybka' });
  const tSt = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1, { payerTechs: [T], otherTechs: [], tempoGry: 'standardowa' });
  const pnSz = tSz && tSz.payment.techs[0] ? tSz.payment.techs[0].pn : null;
  const pnSt = tSt && tSt.payment.techs[0] ? tSt.payment.techs[0].pn : null;
  ok(pnSz !== null && pnSz === mod.diplomacyPnTech(T, 'szybka'), `W14: wycena techu w tempie szybka = diplomacyPnTech(T,'szybka') (jest ${pnSz})`);
  ok(pnSt !== null && pnSt === mod.diplomacyPnTech(T, 'standardowa'), `W14: wycena techu w tempie standardowa = diplomacyPnTech(T,'standardowa') (jest ${pnSt})`);
  ok(pnSz !== pnSt, `W14: tempo zmienia wycenę techu (szybka ${pnSz} vs standardowa ${pnSt})`);

  // W15 (r3, zarzut 6): technologia już oferowana w koszyku płatnika nie wchodzi drugi raz do nośnika.
  const planDup = mod.treatyCarrierPlanForPlayerPayer('nap', { giveItems: [{ typ: 'tech', id: T, ilosc: 1 }] }, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1, { payerTechs: [T], otherTechs: [] });
  ok(planDup && !planDup.payment.techs.some(t => t.name === T), 'W15: tech oferowana w koszyku gracza nie jest dobierana do nośnika');
  const planDupAI = mod.treatyCarrierPlanForPlayerPayer('nap', { receiveItems: [{ typ: 'tech', id: T, ilosc: 1 }] }, baseCtx.relation,
    { proposerOwnerId: 1, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 400 }, 0, RICH, 1, { payerTechs: [T], otherTechs: [] });
  ok(planDupAI && !planDupAI.payment.techs.some(t => t.name === T), 'W15b: tech w receiveItems (AI→gracz) też nie jest dobierana drugi raz');

  // W16 (r3, zarzut 3): helper przelewu — strona koszyka zgodna z kierunkiem.
  const carrierItems = [{ typ: 'zloto', id: 'zloto', ilosc: 5 }];
  const pPlayer = mod.treatyCarrierPayloadPatch({ giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1 }] },
    { side: 'proposer', items: carrierItems });
  ok(pPlayer.giveItems.length === 2 && pPlayer.receiveItems === undefined, 'W16: side=proposer dopisuje do giveItems');
  const pAI = mod.treatyCarrierPayloadPatch({}, { side: 'responder', items: carrierItems });
  ok(pAI.receiveItems && pAI.receiveItems.length === 1 && pAI.giveItems === undefined, 'W16: side=responder dopisuje do receiveItems');
  const pNone = mod.treatyCarrierPayloadPatch({ giveItems: [] }, { side: 'responder', items: [] });
  ok(pNone.giveItems.length === 0 && pNone.receiveItems === undefined, 'W16: pusty nośnik nie zmienia payloadu');

  // W17 (r3, zarzut 3): pełny łańcuch oceny → payload do przelewu (AI→gracz NAP, technologia + złoto).
  const w17 = mod.evaluateProposal({ actionId: 'nap', proposerOwnerId: 1, responderOwnerId: 0, payload: {} },
    { ...weakCtxRich, playerTechs: [T], partnerTechs: [] });
  const w17p = w17.treatyCarrier ? mod.treatyCarrierPayloadPatch({}, w17.treatyCarrier) : {};
  ok(w17p.receiveItems && w17p.receiveItems.some(i => i.typ === 'tech' && i.id === T), 'W17: AI→gracz: technologia gracza trafia do receiveItems (przelew gracz→AI)');
  ok(w17p.giveItems === undefined, 'W17: AI→gracz: nic nie trafia do giveItems');

  // W6: zapas pomniejszony o pozycje koszyka już oferowane — złoto oferowane w koszyku nie wchodzi drugi raz.
  const onlyGold = { ...ZERO, zloto: 1000 };
  const basketGold = { giveItems: [{ typ: 'zloto', id: 'zloto', ilosc: 1000 }] };
  const planNoBasket = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal', tradeEra: 1 },
    { powerPlayer: 100, powerOther: 400 }, 0, onlyGold, 1);
  const planWithBasket = mod.treatyCarrierPlanForPlayerPayer('nap', basketGold, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal', tradeEra: 1 },
    { powerPlayer: 100, powerOther: 400 }, 0, onlyGold, 1);
  ok(planNoBasket && planNoBasket.payment.tail.some(t => t.key === 'zloto'),
    'W6: bez koszyka zloto wchodzi w ogon');
  ok(planWithBasket && planWithBasket.payment.tail.every(t => t.key !== 'zloto'),
    `W6: zloto już oferowane w koszyku nie wchodzi w ogon (ogon: ${JSON.stringify(planWithBasket && planWithBasket.payment.tail)})`);

  // W7: r = 1 ⇒ D = 0 ⇒ brak planu.
  const w7 = mod.treatyCarrierPlanForPlayerPayer('nap', {}, baseCtx.relation,
    { proposerOwnerId: 0, playerOwnerId: 0, difficulty: 'normal' },
    { powerPlayer: 100, powerOther: 100 }, 0, RICH, 1);
  ok(w7 === null, 'W7: r = 1 (D = 0): brak planu nośnika');

  // W8: komposer — Σ extra[].pn = coveredByExtraPn ≤ reszta D (zarzut 7).
  const res = mod.composeTreatyPayment({
    duePn: 10,
    payerTechs: [],
    otherTechs: [],
    techPn: () => null,
    pricing: { holdings: { zloto: 0 }, pnPerUnit: () => null },
    extraStages: [{ key: 'praca', have: 100, pnPerUnit: 7 }],
  });
  const sumExtra = res.extra.reduce((a, e) => a + e.pn, 0);
  ok(sumExtra === res.coveredByExtraPn, `W8: Σ extra.pn (${sumExtra}) = coveredByExtraPn (${res.coveredByExtraPn})`);
  ok(res.coveredByExtraPn <= 10, `W8: pokryte praca ≤ D (jest ${res.coveredByExtraPn})`);
  ok(res.full === true && res.shortfallPn === 0, 'W8: D=10 pokryte pracą (7 + 3)');
  return { w2accepted: w2.accepted };
}

async function main() {
const base = await buildBundle('base', null);
run(base);

// Mutanty: każdy musi czerwienić test (fail > 0 po jego uruchomieniu).
async function mutantDetected(tag, mutate) {
  const before = fail;
  const mod = await buildBundle(tag, mutate);
  quiet = true;
  try {
    run(mod);
  } catch (e) {
    fail++;
    quiet = false;
    console.error(`[mutant ${tag}] wyjątek: ${e.message}`);
  }
  quiet = false;
  const detected = fail > before;
  // Mutanty liczymy osobno: fail z uruchomienia mutanta to OCZEKIWANE wykrycie, nie błąd testu.
  fail = before;
  if (detected) pass++;
  else { fail++; console.error(`[FAIL] mutant ${tag} NIE wykryty`); }
  return detected;
}

await mutantDetected('M1-gate-ignores-carrier', {
  from: 'if (plan.supported && plan.payment.full) return null;',
  to: 'if (false) return null;',
});
await mutantDetected('M2-no-attach', {
  from: 'return attachTreatyCarrier(proposal, ctx, attachTreatyPowerSplit(proposal, ctx, result));',
  to: 'return attachTreatyPowerSplit(proposal, ctx, result);',
});
await mutantDetected('M3-no-basket-dedupe', {
  from: "    if (i.typ !== 'zloto' && i.typ !== 'surowiec_ilosc') continue;\n    const k = i.typ === 'zloto' ? 'zloto' : i.id;\n    if (k in left)",
  to: "    const k = i.typ === 'zloto' ? 'zloto' : i.id;\n    if (false && k in left)",
});

// M4: attachTreatyCarrier pomija pozycje technologii → W10 musi czerwienić.
await mutantDetected('M4-carrier-drops-tech-items', {
  from: 'const items = [...techItems, ...peaceTailBasketItems(plan.payment.tail)];',
  to: 'const items = [...peaceTailBasketItems(plan.payment.tail)];',
});
// M5: planer ignoruje technologie drugiej strony → W11 musi czerwienić.
await mutantDetected('M5-planner-ignores-partner-techs', {
  from: 'otherTechs: techs?.otherTechs ?? [],',
  to: 'otherTechs: [],',
});

// M6 (r3): helper przelewu ignoruje stronę koszyka → W16/W17 muszą czerwienić.
await mutantDetected('M6-patch-ignores-side', {
  from: "  if (carrier.side === 'proposer') return { ...payload, giveItems: [...(payload.giveItems ?? []), ...items] };",
  to: "  if (true) return { ...payload, giveItems: [...(payload.giveItems ?? []), ...items] };",
});
// M7 (r3): brak filtra „tech już w koszyku płatnika” → W15 musi czerwienić.
await mutantDetected('M7-no-offered-tech-filter', {
  from: "payerTechs: (techs?.payerTechs ?? []).filter(t => !offeredTechs.has(t)),",
  to: "payerTechs: (techs?.payerTechs ?? []),",
});
// M8 (r3): wycena techu bez tempa gry → W14 musi czerwienić.
await mutantDetected('M8-tech-price-ignores-tempo', {
  from: "techPn: name => diplomacyPnTech(name, techs?.tempoGry ?? 'standardowa'),",
  to: "techPn: name => diplomacyPnTech(name),",
});
// M9 (r3): planer wraca do starego zachowania (tylko propozycje gracza) → W5 musi czerwienić.
await mutantDetected('M9-planner-player-proposer-only', {
  from: "  if (!treatyPower) return null;\n  if (!treatyParityEnabled(actionId)) return null;\n  // r3 (zarzut 1)",
  to: "  if (!treatyPower) return null;\n  if (!treatyParityEnabled(actionId)) return null;\n  if (!((pnOpts.proposerOwnerId ?? 0) === (pnOpts.playerOwnerId ?? 0))) return null;\n  // r3 (zarzut 1)",
});

try { fs.unlinkSync(ENTRY); } catch (_) { /* już usunięty */ }
console.log(`diplo-treaty-payment-wiring-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
