'use strict';

/** diplomacy-ai-balance-test.cjs — R-HANDEL-AI-FALA */

const fs = require('fs');

const path = require('path');



const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));



const ENTRY = path.resolve(__dirname, '.dip-ai-balance-entry.ts');

const BUNDLE = path.resolve(__dirname, '.dip-ai-balance-bundle.cjs');



fs.writeFileSync(ENTRY, `

export {
  clampAiResourceTradeCommand,
  basketItemsAffordableExtended,
  maxSustainablePakietyPerTura,
  maxResourcePakiety,
  clampBasketItemsToAffordable,
  buildClampedAiTradeAgreementPayload,
} from '../src/game/diplomacy-ai-balance.ts';

// R-DYPLO-CENNIK-KROK5-Q1 runda 2: potrzebne do zweryfikowania, że ilość zwrócona
// przez clampAiResourceTradeCommand jest tą SAMĄ ilością, dla której liczy się cena/PN
// (bez rozjazdu surowa-ilość vs zflorowana-ilość) — patrz testy niżej.
export {
  diplomacyNormalizeSurowiecIlosc,
  diplomacyPnSurowiecIlosc,
  diplomacyHandelSurowiecCenaZaBlok,
} from '../src/game/diplomacy-value-catalog.ts';

`, 'utf8');



esbuild.buildSync({

  entryPoints: [ENTRY],

  bundle: true,

  platform: 'node',

  format: 'cjs',

  target: 'node18',

  outfile: BUNDLE,

  logLevel: 'silent',

  resolveExtensions: ['.ts', '.js', '.json'],

});



const B = require(BUNDLE);



let pass = 0;

let fail = 0;

function ok(c, m) {

  if (c) { pass++; console.log('  OK:', m); }

  else { fail++; console.error('  FAIL:', m); }

}



console.log('diplomacy-ai-balance-test');



const baseCtx = {

  aiOwnerId: 2,

  partnerOwnerId: 0,

  aiGold: 500,

  partnerGold: 300,

  aiPraca: 50,

  partnerPraca: 40,

  aiStock: { drewno: 100 },

  partnerStock: { drewno: 200 },

  pakietWielkosc: 10,

  defaultTurns: 10,

};



const baseCmd = {

  type: 'zaproponuj_handel_surowiec',

  targetId: '0',

  powod: 'test',

  surowiecKey: 'drewno',

  label: 'Drewno',

  pakietyPerTura: 5,

  zaplataTyp: 'zloto',

  zaplataPerTura: 20,

  turns: 10,

  kierunek: 'sprzedaz',

};



// per_turn: magazyn nie podbija stawki — tylko produkcja
// R-DYPLO-CENNIK-KROK5-Q1 runda 2, wartości zaktualizowane po R-DYPLO-CENNIK-KROK10-Q1
// (2026-08-30, krok 5→10): production(150)/pakiet(10)=15 pakietów, poniżej żądania (20)
// -> produkcja jest wiążącym ograniczeniem (nie zapas 500), a wynik 15 floruje dodatkowo
// do kroku 10 (drewno objęte krokiem 10) — test pokazuje oba mechanizmy naraz. UWAGA
// balansowa: dawna wartość testu (75) dawała 7 pakietów, co przy kroku 10 floruje do 0 ->
// AI z produkcją 75 szt./turę NIE MOŻE już zaproponować handlu tym surowcem (realny,
// zamierzony efekt uboczny podniesienia kroku — mniejsi producenci wypadają z oferowania).

{

  const ctx = { ...baseCtx, aiStock: { drewno: 500 }, aiResourceRates: { drewno: 150 } };

  const cmd = { ...baseCmd, pakietyPerTura: 20 };

  const out = B.clampAiResourceTradeCommand(cmd, ctx);

  ok(out != null && out.pakietyPerTura === 10,

    `per_turn cap from production (15 pakietów), floored to step 10 (got ${out?.pakietyPerTura}, want 10)`);

}

// R-DYPLO-CENNIK-KROK10-Q1 (2026-08-30): produkcja PONIŻEJ nowego progu (krok 10 × pakiet
// AI 10 = potrzeba >=100 szt./turę, żeby cokolwiek zaoferować) teraz zwraca null zamiast
// wcześniej poprawnej małej oferty — dokładnie scenariusz, który dawny test (production=75)
// niechcący przestał pokrywać. Jawna asercja, żeby ta zmiana zachowania miała własny dowód.

{

  const ctx = { ...baseCtx, aiStock: { drewno: 500 }, aiResourceRates: { drewno: 75 } };

  const cmd = { ...baseCmd, pakietyPerTura: 20 };

  const out = B.clampAiResourceTradeCommand(cmd, ctx);

  ok(out === null,

    `production(75)/pakiet(10)=7 pakietów floruje do 0 przy kroku 10 -> null (got ${JSON.stringify(out)})`);

}



// per_turn: duży magazyn + zero produkcji → null

{

  const ctx = { ...baseCtx, aiStock: { drewno: 500 }, aiResourceRates: { drewno: 0 } };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out === null, 'per_turn with stock but no production -> null');

}



// clamp reduces zaplata when buyer poor gold over 10 turns
// R-DYPLO-CENNIK-KROK10-Q1 (2026-08-30): zarówno production/pakiet JAK I samo
// cmd.pakietyPerTura (baseCmd domyślnie 5) muszą dawać >=1 blok kroku 10 po
// Math.min(cmd.pakietyPerTura, maxPakietyPerTura), inaczej clampAiResourceTradeCommand
// zwraca null (test przestałby w ogóle sprawdzać zaplatę) — 5 samo w sobie floruje do 0
// przy kroku 10, więc cmd.pakietyPerTura podniesione do 10, production do 150/10=15
// pakietów (>=10, więc min(10,15)=10 nietknięte) — niezwiązane z tym, co ten test
// faktycznie bada (klamrowanie zapłaty, nie ilość surowca).

{

  const ctx = { ...baseCtx, partnerGold: 50, aiResourceRates: { drewno: 150 } };

  const cmd = { ...baseCmd, pakietyPerTura: 10 };

  const out = B.clampAiResourceTradeCommand(cmd, ctx);

  ok(out != null && out.zaplataPerTura <= 5,

    `clamp reduces zaplata when buyer poor (got ${out?.zaplataPerTura}/turę)`);

}



// returns null when impossible

{

  const ctx = { ...baseCtx, aiStock: { drewno: 0 }, partnerGold: 0, aiResourceRates: { drewno: 0 } };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out === null, 'returns null when impossible');

}



// once mode: rejects surowiec_ilosc when insufficient stock

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { kamien: 5 },

    pakietWielkosc: 10,

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 2 }];

  ok(!B.basketItemsAffordableExtended(items, ownerCtx, 1, 'once'),

    'once: rejects surowiec_ilosc when insufficient stock');

}



// once mode: accepts when stock sufficient

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { kamien: 50 },

    pakietWielkosc: 10,

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'kamien', ilosc: 2 }];

  ok(B.basketItemsAffordableExtended(items, ownerCtx, 1, 'once'),

    'once: accepts when stock sufficient');

}



// per_turn: production enables offer without relying on stock
// R-DYPLO-CENNIK-KROK5-Q1 runda 2, zaktualizowane po R-DYPLO-CENNIK-KROK10-Q1 (2026-08-30):
// production(150)/pakiet(10)=15 pakietów mimo zerowego zapasu; wynik 15 floruje dodatkowo
// do kroku 10 (jak wyżej — oba mechanizmy naraz). Dawna wartość testu (90) dawałaby 9
// pakietów, co przy kroku 10 floruje do 0 (patrz jawna asercja tego przypadku wyżej).

{

  const ctx = {

    ...baseCtx,

    aiStock: { drewno: 0 },

    aiResourceRates: { drewno: 150 },

  };

  const cmd = { ...baseCmd, pakietyPerTura: 20 };

  const out = B.clampAiResourceTradeCommand(cmd, ctx);

  ok(out != null && out.pakietyPerTura === 10,

    `production enables 15 pakietów bez zapasu, floored to step 10 (got ${out?.pakietyPerTura})`);

}



// no production + no stock -> null

{

  const ctx = {

    ...baseCtx,

    aiStock: { drewno: 0 },

    aiResourceRates: { drewno: 0 },

  };

  const out = B.clampAiResourceTradeCommand(baseCmd, ctx);

  ok(out === null, 'no stock and no production -> null');

}



// maxResourcePakiety unit checks

{

  ok(B.maxResourcePakiety('once', 250, 0, 10) === 25,

    'once: stock 250 -> 25 pakietów');

  ok(B.maxResourcePakiety('per_turn', 300, 20, 10) === 2,

    'per_turn: prod 20/t -> 2 pakiety/t (ignores stock)');

}



// clampBasket per_turn scales to production

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { drewno: 500 },

    pakietWielkosc: 10,

    resourceRates: { drewno: 25 },

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 5 }];

  const clamped = B.clampBasketItemsToAffordable(items, ownerCtx, 10, 'per_turn');

  ok(clamped.length === 1 && clamped[0].ilosc === 2,

    `clampBasket per_turn scales to production (got ${clamped[0]?.ilosc})`);

}



// clampBasket once scales to stock

{

  const ownerCtx = {

    gold: 1000,

    praca: 100,

    foodReserve: 100,

    stock: { drewno: 250 },

    pakietWielkosc: 10,

    resourceRates: { drewno: 100 },

  };

  const items = [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 30 }];

  const clamped = B.clampBasketItemsToAffordable(items, ownerCtx, 1, 'once');

  ok(clamped.length === 1 && clamped[0].ilosc === 25,

    `clampBasket once scales to stock (got ${clamped[0]?.ilosc})`);

}



{

  const ownerCtx = { gold: 90, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };

  const items = [{ typ: 'zloto', id: 'zloto', ilosc: 10 }];

  ok(!B.basketItemsAffordableExtended(items, ownerCtx, 10),

    'rejects zloto when 10/turę × 10 tur > treasury');

  ok(B.basketItemsAffordableExtended(items, ownerCtx, 9),

    'accepts zloto when 10/turę × 9 tur fits treasury');

}



{

  const quick = { giveItems: [], receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 1 }] };

  const aiCtx = { gold: 50, praca: 0, foodReserve: 0, stock: { drewno: 100 }, pakietWielkosc: 10 };

  const playerCtx = { gold: 0, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };

  const empty = B.buildClampedAiTradeAgreementPayload(quick, 0, aiCtx, playerCtx);

  ok(empty === null, 'empty receive after clamp → null (no enqueue)');

}



{

  const quick = { giveItems: [], receiveItems: [{ typ: 'surowiec_ilosc', id: 'drewno', ilosc: 2 }] };

  const aiCtx = { gold: 30, praca: 0, foodReserve: 0, stock: {}, pakietWielkosc: 10 };

  const playerCtx = { gold: 0, praca: 0, foodReserve: 0, stock: { drewno: 25 }, pakietWielkosc: 10 };

  const out = B.buildClampedAiTradeAgreementPayload(quick, 20, aiCtx, playerCtx);

  ok(out != null && (out.giveItems?.length ?? 0) > 0 && (out.receiveItems?.length ?? 0) > 0,

    'sweetener + receive clamped to player stock');

  const gold = out?.giveItems?.find(i => i.typ === 'zloto');

  ok(gold != null && gold.ilosc === 15, `sweetener capped to AI_TRADE_AGREEMENT_SWEETENER_MAX (got ${gold?.ilosc})`);

}



// ---------------------------------------------------------------------------
// R-DYPLO-CENNIK-KROK5-Q1 runda 2 (Evaluator FAIL, luka easy trudność):
// clampAiResourceTradeCommand jest DRUGĄ ścieżką generującą 'zaproponuj_handel_surowiec'
// (enqueueNegotiationFromAiCmd, main.ts:12982) — bez floora do kroku 5 tu, AI na trudności
// Łatwej (gdzie aiOfferTargetsZeroBalance('easy')===false, więc trimResourcePaymentTradeForZeroBalance
// NIE dotyka payloadu) mogło zaproponować np. 7 lub 9 szt./turę zamiast wielokrotności 5,
// co dawało rozjazd: deal SAYS 7-9, downstream dostawa floruje do 5, cena zostaje dla 7-9.
// / EN: exact reproduction of the Evaluator's blocking-gap scenario — production rate not
// a multiple of the trade step must be floored INSIDE this function, unconditionally
// (no difficulty gate), so the deal's own quantity always matches what gets delivered.
console.log('R-DYPLO-CENNIK-KROK5-Q1 runda 2 — clampAiResourceTradeCommand floor do kroku (10 od R-DYPLO-CENNIK-KROK10-Q1, 2026-08-30)');

for (const rawRate of [17, 19]) {
  // Konfiguracja realna z main.ts buildAiResourceTradeClampCtx: pakietWielkosc=1
  // (R-DYP-PAKIET-USUN — pakietyPerTura to dziś sztuki wprost, bez mnożnika pakietu).
  const ctx = {
    ...baseCtx,
    pakietWielkosc: 1,
    aiStock: { drewno: 500 },
    aiResourceRates: { drewno: rawRate },
  };
  // AI oferuje całą swoją produkcję (typowy handel nadwyżką) — żądanie = stawka surowa,
  // NIEBĘDĄCA wielokrotnością kroku 10, dokładnie jak w rejestrze Evaluatora (przeskalowane
  // z dawnego kroku 5: 7/9 -> 17/19, żeby dalej mieścić się PONAD jednym blokiem kroku 10).
  const cmd = { ...baseCmd, pakietyPerTura: rawRate };
  const out = B.clampAiResourceTradeCommand(cmd, ctx);

  ok(out != null, `easy: produkcja ${rawRate} szt./turę -> oferta nie jest null (got ${JSON.stringify(out)})`);
  ok(out != null && out.pakietyPerTura === 10,
    `easy: produkcja ${rawRate} szt./turę floruje do kroku 10 (got ${out?.pakietyPerTura}, want 10)`);
  ok(out != null && out.pakietyPerTura % 10 === 0,
    `wynikowa ilość jest wielokrotnością kroku 10 (got ${out?.pakietyPerTura})`);

  // Pokazana ilość == dostarczana ilość: diplomacyNormalizeSurowiecIlosc to TEN SAM
  // mechanizm, który stosuje transfer wykonawczy przy realnej dostawie surowca (patrz
  // docstring w diplomacy-value-catalog.ts) — floor na już zflorowanej wartości jest
  // no-opem, więc brak dalszej redukcji dowodzi braku rozjazdu.
  const reFloored = out != null ? B.diplomacyNormalizeSurowiecIlosc('drewno', out.pakietyPerTura) : null;
  ok(out != null && reFloored === out.pakietyPerTura,
    `pokazana ilość == dostarczana ilość, brak rozjazdu (${out?.pakietyPerTura} -> ${reFloored})`);

  // Cena/PN liczona dla TEJ SAMEJ już zflorowanej ilości (10), nie dla surowej ${rawRate}:
  // cmd.pakietyPerTura zwrócone przez clampAiResourceTradeCommand jest JEDYNYM polem ilości,
  // które aiCommandToPendingProposal (diplomacy-proposals.ts) wstawia do payloadu
  // (receiveItems/giveItems ilosc: cmd.pakietyPerTura) — więc cokolwiek dalej liczy
  // cenę/PN z tego payloadu, robi to już z ilości 10, nigdy z surowej ${rawRate}.
  // NAPRAWA P-DYPLO-PW-BRAK-KROKU-5-EDYCJA-PROPOZYCJI (2026-08-13): PN = BLOKI × cena/blok
  // (ECHO f838b599) — 10 szt. = 1 blok kroku 10, więc want = 1×cena, nie 10×cena.
  const cena = B.diplomacyHandelSurowiecCenaZaBlok('drewno');
  const pnDlaZflorowanej = out != null ? B.diplomacyPnSurowiecIlosc('drewno', out.pakietyPerTura) : null;
  ok(cena != null && cena > 0, 'drewno ma dodatnią cenę jednostkową w cenniku (przesłanka do sensownej asercji)');
  ok(pnDlaZflorowanej === Math.round((10 / 10) * (cena ?? 0)),
    `PN payloadu liczone dla dostarczanej ilości 10 = 1 blok (got ${pnDlaZflorowanej}, want ${Math.round((10 / 10) * (cena ?? 0))})`);
}

// Guard <=0 (linia ok. 289) domyka oferty PONIŻEJ jednego kroku (floor do 0) zamiast
// wysyłać wadliwą propozycję "0 szt./turę" — zweryfikowane realnym kodem, nie założone.
// Wartość 4 nadal poniżej kroku 10 (jak wcześniej poniżej kroku 5) — bez zmian.
{
  const ctx = { ...baseCtx, pakietWielkosc: 1, aiStock: { drewno: 500 }, aiResourceRates: { drewno: 4 } };
  const cmd = { ...baseCmd, pakietyPerTura: 4 };
  const out = B.clampAiResourceTradeCommand(cmd, ctx);
  ok(out === null,
    `produkcja 4 szt./turę (< krok 10) floruje do 0 -> guard zwraca null (got ${JSON.stringify(out)})`);
}
// ---------------------------------------------------------------------------

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}



console.log(`\n${pass}/${pass + fail} PASS`);

process.exit(fail ? 1 : 0);

