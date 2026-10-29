#!/usr/bin/env node
/**
 * run-k04d-units.mjs — wektory testowe karet paska gornego (TopBar) K04D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04D-Q1,
 * runda 1): Zywnosc, Ludnosc, Praca, Zloto, Nauka, Kultura, Religia (`src/ui/cityPanel/k04d-*.ts`).
 *
 * Oczekiwane wartosci wypisane z kodu pinu `gra/src/ui/cityPanel.ts` (edb8fb56), numer linii przy kazdym wektorze.
 * To NIE jest porownanie 1:1 z pinem na zywo (pin liczy lokalnie i wola silnik; patrz P5-8-K04D.md, NIE_ZMIERZONO).
 * Karta Rekruci nie jest tu testowana — zaportowana w K03 (`buildTopBarRekruciDetailCardK`, run-k03-units.mjs).
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/run-k04d-units.mjs
 * EXIT 0 <=> wszystkie wektory zielone; 1 <=> >=1 bledny wektor; 2 <=> blad harnessu.
 */
import { mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { bundle } from './build.mjs';

const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');

/** Stuby identyczne z harnessem K04C (ikony -> tekst), zeby asercje dotyczyly tresci karty. */
const STUB_PATCHES = [
  ['export function cpInlineIcons(text: string): string {', 'export function cpInlineIcons(text: string): string { return text; '],
  ['export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string {', 'export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string { return \'<i class="cw">\' + id + \'</i>\'; '],
  ['export function resourceBrandIconHtml(nazwa: string): string {', 'export function resourceBrandIconHtml(nazwa: string): string { return \'<i class="rb">\' + nazwa + \'</i>\'; '],
];
const stubPlugin = {
  name: 'k04d-stubs',
  setup(b) {
    b.onLoad({ filter: /k01a-fundament\.ts$/ }, (a) => {
      let s = readFileSync(a.path, 'utf8');
      for (const [from, to] of STUB_PATCHES) {
        const n = s.split(from).length - 1;
        if (n !== 1) throw new Error(`patch stubu: oczekiwano 1 trafienia, jest ${n}: ${from}`);
        s = s.replace(from, to);
      }
      return { contents: s, loader: 'ts', resolveDir: dirname(a.path) };
    });
  },
};

const entryJs = (outdir, name) => {
  const hit = (function walk(d) {
    return readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  })(outdir).find((p) => p.endsWith('/' + name));
  if (!hit) throw new Error('brak bundla: ' + name);
  return hit;
};

const tmp = mkdtempSync(join(tmpdir(), 'k04d-units-'));
const vc = new VirtualConsole();
const jsdomErrors = [];
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0]));

// ---------------------------------------------------------------- fixtures (wejscia z DTO, pin-equivalent)
/** CityView (k01b-t) — pola czytane przez karty TopBar. */
const VIEW_BASE = {
  praca: 10, pieniadz: 50, nauka: 7, kultura: 6,
  poziomRacji: 3, zywnoscBrutto: 10, kosztRacji: 9, bilansLokalny: 1, wzrostUlamkowy: 0.5,
  maSpichlerz: true, maAkwedukt: false, popCapSpichlerz: 12, popCapZAkweduktem: 0, popCapBezAkweduktu: 8,
  popCapAktualny: 8, atPopCap: false,
  growthBreakdown: { total: 4, racje: -1, maleMiasto: 0, spichlerz: 2, zdrowie: 1, szczescie: 1, cywilizacja: 0, zaopatrzenie: 1 },
};
const EMPIRE_BASE = {
  pracaPool: 120, pracaRate: 6, zloto: 500, zlotoRate: 9,
  bogactwoWplywyBrutto: 30, bogactwoHandel: 5, bogactwoUtrzymanieBudynkow: 4, bogactwoUtrzymanieSurowcowBudynkow: {},
  bogactwoUtrzymanieJednostek: 0, bogactwoRate: 11,
  nauka: 40, naukaRate: 3, kulturaRate: 20,
  religionStock: 77, religionRate: 6, stateReligion: 'Politeizm', religionSharePct: 70,
};
const WYZ_BASE = {
  ludnoscAbsolutna: 12345, ludnoscNaObywatela: 200,
  wyzwienieSummary: '2 🍞/miesz. · +1%',
  tick: { uprawaHodowla: 10.4, wyzwienieLudnosci: 3, pomocMiastom: 0, wojsko: 1, maxCap: 500, zapasyPo: 120 },
  zapasyPanstwa: null,
};
const PODZIAL = { procentPieniadz: 50, procentNauka: 30, procentLuksus: 20 };
const PRACA_BASE = { total: 10, doBudynkow: 4, doPuli: 6, pctBudynki: 40, pctPuli: 60, sumaMiast: 25 };
const CULTURE_BASE = { kulturaSuma: 30, przyrost: 4, borderRadius: 2, thresholds: [10, 50, 120] };
const RELIGION_BASE = { stateReligion: 'Politeizm', dominujaca: 'Politeizm', udzialPct: 70, wplywSzczescieSzPkt: -7.7, przyrostWiernych: 1, sklad: [], zrodla: [] };
const MONEY_SNAP = {
  doSkarbca: 33, pieniadzBrutto: 40, wealthMnoznik: 1.25, handelZeSzlakow: 3,
  utrzymanieBudynkow: 2, utrzymanieSurowcowBudynkow: {}, utrzymanieGarnizonu: 1, nauka: 4,
};

// ---------------------------------------------------------------- bundle + load
let exitCode = 0;
try {
  const v2Out = join(tmp, 'v2');
  await bundle(
    [
      join(CITY, 'k04d-zycie.ts'), join(CITY, 'k04d-gospodarka.ts'), join(CITY, 'k04d-kultura.ts'),
      join(V2_ROOT, 'src/controller/mockCatalog.ts'), join(V2_ROOT, 'src/controller/staticCatalog.ts'),
    ],
    v2Out,
    { extraPlugins: [stubPlugin] },
  );
  const SC = await import(pathToFileURL(entryJs(v2Out, 'staticCatalog.js')).href);
  const MC = await import(pathToFileURL(entryJs(v2Out, 'mockCatalog.js')).href);
  SC.installStaticCatalog(MC.MOCK_STATIC_CATALOG);
  const K = {
    zycie: await import(pathToFileURL(entryJs(v2Out, 'k04d-zycie.js')).href),
    gosp: await import(pathToFileURL(entryJs(v2Out, 'k04d-gospodarka.js')).href),
    kult: await import(pathToFileURL(entryJs(v2Out, 'k04d-kultura.js')).href),
  };
  const STOCK_LABELS = { zywnosc: 'Żywność', drewno: 'Drewno' };

  /** Uruchamia `fn` w swiezym dokumencie jsdom; zwraca element karty. */
  const build = (fn) => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true, virtualConsole: vc });
    const prev = globalThis.document;
    globalThis.document = dom.window.document;
    try {
      return fn(dom.window.document);
    } finally {
      globalThis.document = prev;
    }
  };
  const rows = (card) => {
    const ls = [...card.querySelectorAll('.dc-l')];
    const vs = [...card.querySelectorAll('.dc-v')];
    return ls.map((l, idx) => [l.textContent, vs[idx]?.textContent ?? '']);
  };
  const text = (card) => card.textContent ?? '';

  const results = [];
  const expectRow = (name, card, label, value) => {
    const r = rows(card).find(([l]) => l === label);
    const got = r ? r[1] : '<brak wiersza>';
    results.push({ name, ok: r !== undefined && got === value, detail: `${label} => "${got}" (oczekiwano "${value}")` });
  };
  const expectText = (name, card, needle) => {
    results.push({ name, ok: text(card).includes(needle), detail: `zawiera "${needle}"` });
  };
  const expectAbsentRow = (name, card, label) => {
    results.push({ name, ok: !rows(card).some(([l]) => l === label), detail: `brak wiersza "${label}"` });
  };

  // Zywnosc — pin :5582-5650
  const zyw = build(() => K.zycie.buildTopBarZywnoscDetailCardK({ view: VIEW_BASE, maxSafe: 3, wyzywienie: WYZ_BASE }));
  expectRow('zyw:produkcja', zyw, 'Produkcja brutto', '+10 🍞/t'); // pin :5612
  expectRow('zyw:koszt-racji', zyw, 'Koszt wyżywienia', '−9 🍞/t (Wyżywienie 3)'); // pin :5613
  expectRow('zyw:bilans', zyw, 'Bilans lokalny', '+1 🍞/t'); // pin :5614
  expectRow('zyw:wyzywienie-aktywne', zyw, 'Wyżywienie aktywne', '2 🍞/miesz. · +1%'); // pin :5617-5619
  expectRow('zyw:wzrost-lacznie', zyw, 'Łącznie', '+4%'); // pin :5627
  expectRow('zyw:magazyn', zyw, 'W magazynie', '120 / 500 🍞'); // pin :5638
  expectRow('zyw:wojsko', zyw, 'Wojsko', '−1 🍞'); // pin :5640
  expectAbsentRow('zyw:brak-wyzywienia', build(() => K.zycie.buildTopBarZywnoscDetailCardK({ view: VIEW_BASE, maxSafe: 3, wyzywienie: { ...WYZ_BASE, wyzwienieSummary: null } })), 'Wyżywienie aktywne'); // pin :5617 (`if (rationParams)`)
  expectAbsentRow('zyw:brak-magazynu', build(() => K.zycie.buildTopBarZywnoscDetailCardK({ view: VIEW_BASE, maxSafe: 3, wyzywienie: { ...WYZ_BASE, tick: null } })), 'W magazynie'); // pin :5632 (`if (tick)`)
  expectRow('zyw:magazyn-panstwa', build(() => K.zycie.buildTopBarZywnoscDetailCardK({ view: VIEW_BASE, maxSafe: 3, wyzywienie: { ...WYZ_BASE, zapasyPanstwa: 130 } })), 'W magazynie', '130 / 500 🍞'); // pin :5638 `st?.zapasyPanstwa ?? tick.zapasyPo`

  // Ludnosc — pin :5684-5768
  const lud = build(() => K.zycie.buildTopBarLudnoscDetailCardK({
    epoka: 2, population: 7, view: VIEW_BASE, maxSafe: 3, fed: true, turnsDoNastepnego: 3,
    health: { total: 2, lines: [{ label: 'Szczęście', value: 2 }, { label: 'Głód', value: -1 }] },
    ludnoscAbsolutna: WYZ_BASE.ludnoscAbsolutna,
  }));
  expectRow('lud:obywatele', lud, 'Duża liczba 👥', '7 — obywatele (sloty) tego miasta'); // pin :5697
  expectRow('lud:ludnosc-abs', lud, 'Ludność absolutna', '≈ 12.3 tys. osób'); // pin :5698
  expectRow('lud:epoka', lud, 'Epoka', '2'); // pin :5699
  expectRow('lud:wzrost-pasek', lud, 'WZROST%', '4%'); // pin :5700
  expectRow('lud:wyzywienie', lud, 'Wyżywienie', '3'); // pin :5719 (formatWyzwienieLabel)
  expectRow('lud:postep', lud, 'Postęp do +1', '0,50 / 1 obywatela'); // pin :5722
  expectRow('lud:kolejny', lud, 'Kolejny obywatel', 'za ≈ 3 tury'); // pin :5724-5731 (pluralTur)
  expectRow('lud:bilans-zywnosci', lud, 'Bilans żywności', '+1 🍞/t'); // pin :5736
  expectRow('lud:zdrowie-lacznie', lud, 'Zdrowie łącznie', '+2'); // pin :5750
  expectRow('lud:zdrowie-linia', lud, 'Głód', '-1'); // pin :5752
  expectRow('lud:kolejny-w-tej-turze', build(() => K.zycie.buildTopBarLudnoscDetailCardK({ epoka: 2, population: 7, view: VIEW_BASE, maxSafe: 3, fed: true, turnsDoNastepnego: 0, health: null, ludnoscAbsolutna: 1 })), 'Kolejny obywatel', 'w tej turze'); // pin :5728
  expectRow('lud:glod', build(() => K.zycie.buildTopBarLudnoscDetailCardK({ epoka: 2, population: 7, view: VIEW_BASE, maxSafe: 3, fed: false, turnsDoNastepnego: null, health: null, ludnoscAbsolutna: 1 })), 'Kolejny obywatel', 'brak — głód'); // pin :5726
  expectRow('lud:limit', build(() => K.zycie.buildTopBarLudnoscDetailCardK({ epoka: 2, population: 8, view: { ...VIEW_BASE, atPopCap: true }, maxSafe: 3, fed: true, turnsDoNastepnego: null, health: null, ludnoscAbsolutna: 1 })), 'Limit', 'max 8 mieszkańców'); // pin :5737-5738
  const ludBezWidoku = build(() => K.zycie.buildTopBarLudnoscDetailCardK({ epoka: 2, population: 7, view: null, maxSafe: 3, fed: true, turnsDoNastepnego: null, health: null, ludnoscAbsolutna: 1 }));
  expectAbsentRow('lud:bez-widoku-wzrost', ludBezWidoku, 'WZROST%'); // pin :5700 (`bd ? … : '—'`; gridDetailRow pomija '—' jak w pinie)
  expectAbsentRow('lud:bez-widoku-brak-postepu', ludBezWidoku, 'Postęp do +1'); // pin :5714 (`if (view && bd)`)

  // Praca — pin :5770-5822
  const pracaCard = build(() => K.gosp.buildTopBarPracaDetailCardK({ view: VIEW_BASE, empire: EMPIRE_BASE, praca: PRACA_BASE }));
  expectRow('praca:pula', pracaCard, 'Duża liczba 🔨', '120 — pula Pracy imperium (zapas / suma tur)'); // pin :5796
  expectRow('praca:zloty', pracaCard, 'Złoty dopisek', '+4 — ten gród → kolejka budowy (40%)'); // pin :5797
  expectRow('praca:niebieski', pracaCard, 'Niebieski dopisek', '+6 — ten gród → pula imperium (60%)'); // pin :5798
  expectRow('praca:suma-miast', pracaCard, 'Suma miast', '+25 łącznie z wszystkich grodów'); // pin :5799
  expectRow('praca:brutto', pracaCard, 'Praca brutto', '+10 🔨'); // pin :5804
  expectRow('praca:budynki', pracaCard, '→ Budynki', '+4 — postęp w kolejce produkcji'); // pin :5805
  const pracaBezSumy = build(() => K.gosp.buildTopBarPracaDetailCardK({ view: VIEW_BASE, empire: EMPIRE_BASE, praca: { ...PRACA_BASE, sumaMiast: null } }));
  expectAbsentRow('praca:suma-brak', pracaBezSumy, 'Suma miast'); // pin :5799 (`'—'` pominiete przez gridDetailRow jak w pinie)

  // Zloto (pieniadz) — pin :5824-5902
  const zlotoCard = build(() => K.gosp.buildTopBarZlotoDetailCardK({
    view: VIEW_BASE, empire: EMPIRE_BASE, podzialHandlu: PODZIAL, moneySnap: null, wealthPoziom: 2,
    daninaLbl: 'Podatek', daninaLblGen: 'Podatku', stockLabels: STOCK_LABELS,
  }));
  expectRow('zloto:stan-skarbca', zlotoCard, 'Stan skarbca', '500'); // pin :5843
  expectRow('zloto:duza-liczba', zlotoCard, 'Duża liczba 💰', '500 — skarbiec całego państwa'); // pin :5868 (pasek)
  expectRow('zloto:wplywy', zlotoCard, 'Wpływy brutto', '+25'); // pin :5845 (wplywy − handel)
  expectRow('zloto:utrzymanie-budynkow', zlotoCard, 'Utrzymanie budynków', '−4'); // pin :5848
  expectAbsentRow('zloto:surowce-puste', zlotoCard, 'Utrzymanie surowców budynków'); // pin :5849 (formatResourceUpkeepSummary({}) = '—', pominiete przez gridDetailRow)
  expectRow('zloto:netto', zlotoCard, 'Netto / turę', '+11'); // pin :5852
  expectRow('zloto:wplyw-do-skarbca', zlotoCard, 'Wpływ do skarbca', '+50'); // pin :5862 (brak moneySnap)
  expectRow('zloto:dopisek', zlotoCard, 'Dopisek +X', '+50 — netto z tego grodu do skarbca'); // pin :5869
  expectRow('zloto:podzial', zlotoCard, 'Podział Podatku', '50% Skarb · 30% Nauka · 20% Zamożność'); // pin :5876
  expectRow('zloto:zamoznosc-w', zlotoCard, 'Zamożność W', 'W2 — część Podatku karmi pulę W (mnożnik podatków)'); // pin :5878
  const zlotoSnap = build(() => K.gosp.buildTopBarZlotoDetailCardK({
    view: VIEW_BASE, empire: EMPIRE_BASE, podzialHandlu: PODZIAL, moneySnap: MONEY_SNAP, wealthPoziom: 2,
    daninaLbl: 'Podatek', daninaLblGen: 'Podatku', stockLabels: STOCK_LABELS,
  }));
  expectRow('zloto:snap-brutto', zlotoSnap, 'Pieniądz brutto', '+40'); // pin :5863
  expectRow('zloto:snap-mnoznik', zlotoSnap, 'Mnożnik zamożności W', '×1.25'); // pin :5864
  expectRow('zloto:snap-do-skarbca', zlotoSnap, '→ Do skarbca imperium', '+33'); // pin :5866 (doSkarbca, rozny od pieniadzBrutto)
  expectRow('zloto:snap-garnizon', zlotoSnap, 'Utrzymanie garnizonu', '−1'); // pin :5870
  expectAbsentRow('zloto:snap-bez-wplywu', zlotoSnap, 'Wpływ do skarbca'); // pin :5862 (galaz else pominieta)

  // Nauka — pin :5904-5947
  const naukaBank = build(() => K.gosp.buildTopBarNaukaDetailCardK({ view: VIEW_BASE, empire: EMPIRE_BASE, podzialHandlu: PODZIAL, maBiblioteka: true }));
  expectRow('nauka:bank', naukaBank, 'Duża liczba (bank nauki)', '40 — bank nauki (zebrane punkty)'); // pin :5915-5916
  expectRow('nauka:dopisek', naukaBank, 'Dopisek +X', '+7 — ten gród'); // pin :5922
  expectRow('nauka:biblioteka', naukaBank, 'Pola i budynki', 'Biblioteka + pola z nauką'); // pin :5926
  expectRow('nauka:udzial', naukaBank, 'Udział handlu', '30% handlu netto → nauka'); // pin :5927
  const naukaImp = build(() => K.gosp.buildTopBarNaukaDetailCardK({ view: VIEW_BASE, empire: { ...EMPIRE_BASE, nauka: undefined }, podzialHandlu: PODZIAL, maBiblioteka: false }));
  expectRow('nauka:imperium', naukaImp, 'Duża liczba (bank nauki)', '3 — produkcja nauki imperium'); // pin :5916 (naukaRate)
  expectRow('nauka:bez-biblioteki', naukaImp, 'Pola i budynki', 'Głównie pola z nauką + budynki'); // pin :5926
  const naukaRateBrak = build(() => K.gosp.buildTopBarNaukaDetailCardK({ view: VIEW_BASE, empire: { ...EMPIRE_BASE, nauka: undefined, naukaRate: undefined }, podzialHandlu: PODZIAL, maBiblioteka: false }));
  expectRow('nauka:imperium-fallback-view', naukaRateBrak, 'Duża liczba (bank nauki)', '7 — produkcja nauki imperium'); // pin :5916 (`?? view.nauka`)

  // Kultura — pin :5949-5990
  const kultCard = build(() => K.kult.buildTopBarKulturaDetailCardK({ view: VIEW_BASE, empire: EMPIRE_BASE, culture: CULTURE_BASE }));
  expectRow('kult:suma-imperium', kultCard, 'Duża liczba 🎭', '20 — suma kultury imperium'); // pin :5957
  expectRow('kult:dopisek', kultCard, 'Dopisek +X', '+6 — ten gród'); // pin :5958
  expectRow('kult:stan-suma', kultCard, 'Suma kultury', '30'); // pin :5966
  expectRow('kult:przyrost', kultCard, 'Przyrost', '+4'); // pin :5967
  expectRow('kult:granice', kultCard, 'Granice', '+2 pierścieni wokół miasta'); // pin :5968
  const kultBrak = build(() => K.kult.buildTopBarKulturaDetailCardK({ view: VIEW_BASE, empire: EMPIRE_BASE, culture: null }));
  expectRow('kult:brak-stanu', kultBrak, 'Efekt', 'Więcej kultury → dalsze granice terytorium na mapie okolicy.'); // pin :5977-5978
  expectAbsentRow('kult:brak-stanu-bez-sumy', kultBrak, 'Suma kultury'); // pin :5971 (galaz else)

  // Religia — pin :5992-6046
  const relCard = build(() => K.kult.buildTopBarReligiaDetailCardK({ empire: EMPIRE_BASE, religion: RELIGION_BASE, skalaSzEpoki: 23 }));
  expectRow('rel:wierni', relCard, 'Duża liczba 🛕', '77 — wierni „Politeizm” w państwie'); // pin :6011
  expectRow('rel:udzial', relCard, 'Udział wiary', '70% ludności'); // pin :6012
  expectRow('rel:dopisek', relCard, 'Dopisek +X', '+1 — ten gród szerzy religię'); // pin :6013
  expectRow('rel:imperium', relCard, 'Imperium łącznie', '+6'); // pin :6014
  expectText('rel:skala-epoki', relCard, 'proporcjonalnie do udziału: 100% własnej +23, 50/50 = 0, 100% obcej −23'); // pin :6034-6035
  const relBezPanstwa = build(() => K.kult.buildTopBarReligiaDetailCardK({ empire: { ...EMPIRE_BASE, stateReligion: null }, religion: { ...RELIGION_BASE, dominujaca: 'Animizm' }, skalaSzEpoki: 23 }));
  expectRow('rel:nazwa-z-dominujacej', relBezPanstwa, 'Duża liczba 🛕', '77 — wierni „Animizm” w państwie'); // pin :6010 (`stateReligion ?? dominujaca`)

  let ok = 0;
  for (const r of results) {
    if (r.ok) ok += 1;
    else {
      exitCode = 1;
      console.log(`BLAD ${r.name}: ${r.detail}`);
    }
  }
  console.log(`run-k04d-units: wektory=${results.length} zielone=${ok} bledne=${results.length - ok} jsdomErrors=${jsdomErrors.length}`);
  if (jsdomErrors.length > 0) {
    console.log('jsdomErrors (pierwsze 5):', jsdomErrors.slice(0, 5));
    exitCode = 1;
  }
} catch (e) {
  console.error('run-k04d-units: blad harnessu:', e?.stack ?? e);
  exitCode = 2;
}
process.exit(exitCode);
