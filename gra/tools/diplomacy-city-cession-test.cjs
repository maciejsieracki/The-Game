'use strict';
/** R-WEB-PEACE-CITY-CESSION-Q1 (r1+r2) — wycena, zakazy, waga, bramka akcji, suma PN, plan cesji, ścieżka pokojowa. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.dip-city-cession-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-city-cession-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyPnMiasto,
  diplomacyMiastoZakaz,
  diplomacyMiastoWagaBilansu,
  diplomacyMiastoAkcjaDozwolona,
  diplomacyPnZlozaMiasta,
  diplomacySumPn,
  diplomacyPnBudynek,
  MIASTO_PN_BAZA,
  MIASTO_WAGA_ODDAJACEGO,
  MIASTO_AKCJE_DOZWOLONE,
  planCityCession,
} from '../src/game/diplomacy-value-catalog';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const D = require(BUNDLE);
const BUILDINGS = require(path.resolve(__dirname, '..', 'data', 'buildings.json'));
let pass = 0;
let fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }
function near(a, b, m) { ok(Math.abs(a - b) < 1e-9, `${m} (got ${a}, want ${b})`); }

const PEACE = { actionId: 'pokoj', side: 'give' };

// --- Wycena ---------------------------------------------------------------
// kuznia/port/akwedukt: kosztBudowy 30 każdy → Σ=90.
const T3 = [{ id: 'kuznia' }, { id: 'port' }, { id: 'akwedukt' }];
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3 }), 1060, 'wycena 4 obyw. + 3 bud. (30) = 1060');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [] }), D.MIASTO_PN_BAZA, 'pusty = baza 400');
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3, cudy: 1 }), 1560, '+500 za cud');
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3, zlozaPn: 150 }), 1210, '+cena złoża 150');
eq(D.diplomacyPnBudynek('kuznia', 2), 33, 'budynek L2 = 33');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [{ id: 'kuznia', level: 2 }] }), 400 + 66, 'poziom 2 w wycenie miasta');
eq(D.diplomacyPnMiasto({ populacja: 1, budynki: [{ id: 'nie_ma_takiego' }] }), 520, 'nieznany budynek = 0 PW');
eq(D.diplomacyPnMiasto({ populacja: -5, budynki: [] }), 400, 'ujemna populacja obcięta do 0');

// r2: przykład 8 obywateli + 8 budynków — Σ kosztów liczona NIEZALEŻNIE z buildings.json
// (nie przez diplomacyPnBudynek), 8 realnych id o najmniejszym koszcie z listy.
{
  const costs = new Map(BUILDINGS.map(b => [b.id, b.kosztBudowy]));
  const eight = [...BUILDINGS].sort((a, b) => a.kosztBudowy - b.kosztBudowy).slice(0, 8);
  const sumRaw = eight.reduce((s, b) => s + costs.get(b.id), 0);
  const expected = 400 + 120 * 8 + 2 * sumRaw;
  eq(D.diplomacyPnMiasto({ populacja: 8, budynki: eight.map(b => ({ id: b.id })) }), expected,
    `wycena 8 obyw. + 8 realnych budynków = ${expected} (Σ kosztów ${sumRaw})`);
  // Przykład ze specu (≈1840) — Σ kosztów 8 budynków = 240 → dokładnie 1840.
  eq(400 + 120 * 8 + 2 * 240, 1840, 'arytmetyka specu: 8+8 przy Σ=240 → 1840');
}

// r2: złoża liczone z danych mapy (diplomacy.json cena_baza), nie ręcznie.
eq(D.diplomacyPnZlozaMiasta(['miedz', 'zelazo']), 270, 'złoża miedz(120)+zelazo(150) = 270');
eq(D.diplomacyPnZlozaMiasta(['nieznane_zloze']), 0, 'nieznane złoże = 0 PW');
eq(D.diplomacyPnZlozaMiasta([]), 0, 'brak złóż = 0 PW');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [], zlozaPn: D.diplomacyPnZlozaMiasta(['zelazo']) }), 550, 'wycena miasta: złoże żelaza 150 wchodzi do sumy');
eq(D.diplomacyPnMiasto({ populacja: 4, budynki: T3, zlozaPn: D.diplomacyPnZlozaMiasta(['miedz', 'zelazo']) }),
  1060 + 270, 'wycena 4+3 z realnymi złożami = 1330');

// r2: NaN / Infinity nie przenikają do wyceny.
eq(D.diplomacyPnMiasto({ populacja: NaN, budynki: [] }), 400, 'NaN populacja → 0');
eq(D.diplomacyPnMiasto({ populacja: Infinity, budynki: [] }), 400, 'Infinity populacja → 0');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [], zlozaPn: NaN }), 400, 'NaN złoża → 0');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [], zlozaPn: Infinity }), 400, 'Infinity złoża → 0');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [], cudy: NaN }), 400, 'NaN cudów → 0');
eq(D.diplomacyPnMiasto({ populacja: 0, budynki: [], cudy: Infinity }), 400, 'Infinity cudów → 0');
ok(Number.isFinite(D.diplomacyPnMiasto({ populacja: 2, budynki: T3, cudy: 2, zlozaPn: NaN })), 'wynik zawsze skończony');

// --- Zakazy ----------------------------------------------------------------
const owned = ['c1', 'c2', 'c3'];
eq(D.diplomacyMiastoZakaz({ cityId: 'c1', capitalCityId: 'c1', ownerCityIds: owned }),
  'Stolicy nie można oddać w pokoju', 'stolica zakazana');
eq(D.diplomacyMiastoZakaz({ cityId: 'c2', capitalCityId: 'c1', ownerCityIds: owned }), null, 'zwykłe miasto dozwolone');
eq(D.diplomacyMiastoZakaz({ cityId: 'c2', capitalCityId: 'c1', ownerCityIds: ['c1', 'c2'] }), null,
  'N=2 miasta: nie-stolica dozwolona');
eq(D.diplomacyMiastoZakaz({ cityId: 'c9', capitalCityId: 'c1', ownerCityIds: owned }),
  'Miasto nie należy do oddającego', 'obce miasto odrzucone');
eq(D.diplomacyMiastoZakaz({ cityId: 'c2', capitalCityId: null, ownerCityIds: ['c2'] }),
  'Nie można oddać ostatniego miasta', 'ostatnie miasto zakazane (bez stolicy)');
eq(D.diplomacyMiastoZakaz({ cityId: 'c1', capitalCityId: 'c1', ownerCityIds: ['c1'] }),
  'Stolicy nie można oddać w pokoju', 'stolica ma pierwszeństwo przed regułą ostatniego');

// --- Bramka akcji (r2, zarzut 3) ------------------------------------------
eq(D.diplomacyMiastoAkcjaDozwolona('pokoj'), true, 'pokój dozwolony');
eq(D.diplomacyMiastoAkcjaDozwolona('wasal'), true, 'wasalizacja dozwolona');
eq(D.diplomacyMiastoAkcjaDozwolona('umowa_handlowa'), false, 'umowa handlowa zakazana');
eq(D.diplomacyMiastoAkcjaDozwolona('handel'), false, 'handel zakazany');
eq(D.diplomacyMiastoAkcjaDozwolona(undefined), false, 'brak akcji = zakaz (fail-safe)');
eq(D.diplomacyMiastoAkcjaDozwolona(''), false, 'pusta akcja = zakaz');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1060 }], { actionId: 'handel' }), null,
  'suma: miasto w handlu = null (dispatch: tylko propozycja pokoju)');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1060 }]), null, 'suma: miasto bez akcji = null');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1060 }], PEACE), 1590,
  'suma: miasto w pokoju (give, ×1.5 domyślnie) 1060 → 1590');

// --- Waga bilansu ----------------------------------------------------------
eq(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: false }), 1, 'gracz oddający: bez wagi AI');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 3 }), 1.5, 'AI eks=3 → ×1.5');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 5 }), 1.8, 'AI eks=5 → ×1.8');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 1 }), 1.2, 'AI eks=1 → ×1.2');
near(D.diplomacyMiastoWagaBilansu({ oddajacyJestAI: true, aiEkspansywnosc: 0 }), 1.05, 'AI eks=0 → ×1.05');
eq(D.MIASTO_WAGA_ODDAJACEGO, 1.5, 'stała wagi 1.5');

// r2 (zarzut 2): waga WCHODZI do sumy używanej przez bilans pokoju (diplomacySumPn).
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1000 }], PEACE), 1500, 'bilans: oddający ×1.5 (1000→1500)');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1000 }], { actionId: 'pokoj', side: 'receive' }), 1000,
  'bilans: przyjmujący bez wagi (1000)');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1000, cityWeight: 1.8 }], PEACE), 1800,
  'bilans: waga AI eks=5 zapisana w pozycji (1000→1800)');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1000, cityWeight: NaN }], PEACE), 1500,
  'waga NaN → domyślna 1.5');

// --- Suma PN pozycji 'miasto' ---------------------------------------------
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 1060, cityWeight: 1 }], PEACE), 1060, 'suma: waga 1 = 1060');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', ilosc: 3, cityPn: 1060, cityWeight: 1 }], PEACE), 1060,
  'suma: miasto nie mnoży się przez ilosc');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2' }], PEACE), null, 'brak cityPn = nieznana wartość (null)');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: NaN }], PEACE), null, 'NaN cityPn = null');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: -1 }], PEACE), null, 'ujemne cityPn = null');
eq(D.diplomacySumPn([{ typ: 'miasto', id: 'c2', cityPn: 500, cityWeight: 1 }, { typ: 'zloto', id: '', ilosc: 100 }], PEACE),
  600, 'suma miasto + złoto (w pokoju)');

// --- Plan cesji (r2, zarzut 1: wykonanie; ścieżka czysta) -----------------
// Siatka 1-wymiarowa dla testu: heks (q,0) ma sąsiadów (q±1,0).
const line = (q) => [{ q: q - 1, r: 0 }, { q: q + 1, r: 0 }];
const baseCession = {
  cityId: 'c2', cityOwnerId: 1, fromOwnerId: 1, toOwnerId: 2, cityQ: 5, cityR: 0,
  ownerCityIds: ['c1', 'c2', 'c3'], capitalCityId: 'c1',
  units: [], neighborsOf: line, isFreeHex: () => true,
};
{
  const p = D.planCityCession(baseCession);
  eq(p.ok, true, 'cesja zwykłego miasta dozwolona');
  eq(p.unitMoves.length, 0, 'brak jednostek = brak ruchów');
}
eq(D.planCityCession({ ...baseCession, cityId: 'c1' }).ok, false, 'plan: stolica odrzucona');
eq(D.planCityCession({ ...baseCession, ownerCityIds: ['c2'], capitalCityId: 'c1' }).ok, false, 'plan: ostatnie miasto odrzucone');
eq(D.planCityCession({ ...baseCession, cityOwnerId: 7 }).ok, false, 'plan: miasto nie oddającego odrzucone');
eq(D.planCityCession({ ...baseCession, toOwnerId: 1 }).ok, false, 'plan: cesja do siebie odrzucona');
{
  // Jednostka ODDAJĄCEGO na heksie miasta → przesunięta na sąsiada, właściciel bez zmian.
  const p = D.planCityCession({
    ...baseCession,
    units: [{ id: 'u1', ownerId: 1, q: 5, r: 0 }, { id: 'u2', ownerId: 2, q: 9, r: 0 }],
  });
  eq(p.ok, true, 'plan z jednostką w mieście dozwolony');
  eq(p.unitMoves.length, 1, 'tylko jednostka oddającego na heksie miasta jest ruszana');
  eq(p.unitMoves[0].unitId, 'u1', 'ruszona jednostka to u1');
  ok(Math.abs(p.unitMoves[0].q - 5) === 1 && p.unitMoves[0].r === 0, 'u1 na sąsiednim heksie (nie na mieście)');
}
{
  // Dwie jednostki: pierwsza na lewego sąsiada, druga na prawego (bez kolizji).
  const p = D.planCityCession({
    ...baseCession,
    units: [{ id: 'a', ownerId: 1, q: 5, r: 0 }, { id: 'b', ownerId: 1, q: 5, r: 0 }],
  });
  eq(p.ok, true, 'dwie jednostki w mieście');
  eq(new Set(p.unitMoves.map(m => `${m.q},${m.r}`)).size, 2, 'dwie jednostki trafiają na DWA różne heksy');
}
{
  // Jednostka PRZYJMUJĄCEGO na heksie miasta nie jest ruszana przez plan.
  const p = D.planCityCession({ ...baseCession, units: [{ id: 'r1', ownerId: 2, q: 5, r: 0 }] });
  eq(p.ok, true, 'plan z jednostką przyjmującego dozwolony');
  eq(p.unitMoves.length, 0, 'jednostka przyjmującego nie jest przesuwana');
}
{
  // Wolny heks dopiero w odległości 2 (BFS musi sięgnąć drugiego pierścienia).
  const p = D.planCityCession({
    ...baseCession,
    units: [{ id: 'a', ownerId: 1, q: 5, r: 0 }],
    isFreeHex: (q) => q === 7,
  });
  eq(p.ok, true, 'wolny heks w odległości 2 znaleziony');
  eq(p.ok && p.unitMoves[0] ? p.unitMoves[0].q : -1, 7, 'jednostka trafia na heks q=7');
}
eq(D.planCityCession({
  ...baseCession,
  units: [{ id: 'a', ownerId: 1, q: 5, r: 0 }],
  isFreeHex: () => false,
}).ok, false, 'brak wolnego heksu dla jednostki = cesja odrzucona (fail-safe)');

// --- Ścieżka pokojowa nie niesie skutków wojennych (zarzut 1) -------------
{
  const fs2 = require('fs');
  const mainSrc = fs2.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
  const start = mainSrc.indexOf('function transferCityByTreaty(');
  const end = mainSrc.indexOf('function clearMapBattleUiState(', start);
  ok(start > 0 && end > start, 'transferCityByTreaty istnieje w main.ts');
  const body = mainSrc.slice(start, end);
  for (const forbidden of [
    'applyCityCaptureToMap', 'recordWarCityLossForPair', 'maybeResolveRegularWarOnCityCapture',
    'triggerRebelProtectionWarConsequence', 'applyPostCaptureLawOnCapture', 'applyCityCaptureAfterBattle',
  ]) {
    ok(!body.includes(forbidden), `ścieżka pokojowa nie woła ${forbidden}`);
  }
  ok(body.includes('planCityCession('), 'ścieżka pokojowa używa planu cesji');
}

console.log(`diplomacy-city-cession-test: ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
