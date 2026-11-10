// Generator grupy DYPLOMACJA (P3-22 etap 2, runda 3): URUCHAMIA kod TS weba (pin edb8fb56).
// Uzycie (z katalogu runu, po git archive edb8fb56 gra/src gra/data do KORZENIA poza repo):
//   node --experimental-strip-types --import ./gen-loader-register.mjs ./gen-diplomacy-web.mjs <KORZEN> <wyjscie.json>
// Zapisuje surowe wartosci zaobserwowane z uruchomionego kodu weba (nie z literalow).
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-diplomacy-web.mjs <KORZEN> <wyjscie.json>');
  process.exit(2);
}
const url = (p) => pathToFileURL(`${root}/${p}`).href;

const catalog = await import(url('gra/src/game/diplomacy-value-catalog.ts'));
const economy = await import(url('gra/src/game/diplomacy-economy.ts'));
const proposals = await import(url('gra/src/game/diplomacy-proposals.ts'));
const diplomacy = await import(url('gra/src/game/diplomacy.ts'));

const result = {
  zrodlo: 'uruchomiony kod TS weba (gen-diplomacy-web.mjs)',
  basket_give: { ...catalog.BASKET_PN_DIFFICULTY_MULT_PLAYER_GIVE },
  basket_receive: { ...catalog.BASKET_PN_DIFFICULTY_MULT_PLAYER_RECEIVE },
  basket_side_fn: [],
  building_pn: null,
  generosity: { ...economy.AI_DIPLOMACY_GENEROSITY_GOLD_MULT },
  sister: { ...diplomacy.SISTER_ALLIANCE_THRESHOLD_SCALE },
  treaty_probe: [],
};

// Rola strony koszyka: side x proposer (0 = gracz proponuje, 1 = AI proponuje) x trudnosc.
for (const side of ['give', 'receive']) {
  for (const proposer of [0, 1]) {
    for (const difficulty of ['easy', 'normal', 'hard']) {
      result.basket_side_fn.push({
        side,
        proposer,
        difficulty,
        mnoznik: catalog.basketSidePnDifficultyMultiplier(side, difficulty, proposer, 0),
      });
    }
  }
}

// Budynek: diplomacyPnBudynek(id, poziom) = round(kosztBudowy * factor^(poziom-1)).
// Factor pochodzi z danych (diplomacy.json pn_budynek_skalowanie), literal fallbacku jest nieeksportowany.
result.building_pn = {
  id: 'targowisko',
  poziom2: catalog.diplomacyPnBudynek('targowisko', 2),
  poziom1: catalog.diplomacyPnBudynek('targowisko', 1),
};

// Mnoznik czasu traktatu: probki punktow odniesienia i akcje spoza zbioru (pokoj).
for (const action of ['nap', 'trybut_zadanie', 'trybut_oferta', 'pokoj']) {
  for (const turns of [undefined, 0, -3, 5, 10, 12, 15, 20, 25]) {
    const payload = turns === undefined ? {} : { turns };
    result.treaty_probe.push({
      action,
      turns: turns === undefined ? null : turns,
      mnoznik: proposals.treatyDurationPnMultiplier(action, payload),
    });
  }
}

writeFileSync(out, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`ZAPISANO ${out}: basket_side=${result.basket_side_fn.length}, treaty=${result.treaty_probe.length}`);
