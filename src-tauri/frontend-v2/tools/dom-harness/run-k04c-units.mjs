#!/usr/bin/env node
/**
 * run-k04c-units.mjs — wektory testowe jednostek K04C batch 4a (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04C-Q1, runda 1):
 * karty Porzadek / Kultura i Religia / Zamoznosc / Wyzywienie i wzrost (`src/ui/cityPanel/k04c-*.ts`).
 *
 * Oczekiwane wartosci sa wypisane z kodu pinu `gra/src/ui/cityPanel.ts` (edb8fb56) — numer linii przy kazdym
 * wektorze. To NIE jest porownanie 1:1 z pinem na zywo (pin liczy lokalnie i wola silnik; patrz P5-8-K04C.md,
 * sekcja „NIE_ZMIERZONO”). Harness sprawdza, ze karty produkuja tekst zgodny z pinem dla zadanych wejsc.
 *
 * Uzycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/run-k04c-units.mjs
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

/** Stuby identyczne z harnessem K03 (cpInlineIcons/ikony -> tekst), zeby asercje dotyczyly tresci karty. */
const STUB_PATCHES = [
  ['export function cpInlineIcons(text: string): string {', 'export function cpInlineIcons(text: string): string { return text; '],
  ['export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string {', 'export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string { return \'<i class="cw">\' + id + \'</i>\'; '],
  ['export function resourceBrandIconHtml(nazwa: string): string {', 'export function resourceBrandIconHtml(nazwa: string): string { return \'<i class="rb">\' + nazwa + \'</i>\'; '],
];
const stubPlugin = {
  name: 'k04c-stubs',
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

const tmp = mkdtempSync(join(tmpdir(), 'k04c-units-'));
const vc = new VirtualConsole();
const jsdomErrors = [];
vc.on('jsdomError', (e) => jsdomErrors.push(String(e?.message ?? e).split('\n')[0]));

// ---------------------------------------------------------------- fixtures (wejscia z DTO, pin-equivalent)
const PORZADEK_BASE = {
  porPct: 62.4,
  szczescie: 14.4,
  bandLabel: 'Napięcie',
  szLines: [{ id: 'b', label: 'Budynki', value: 7.666666666666666 }],
  revoltWarning: false,
  revoltGraceRemaining: null,
  rebelActive: false,
  procentLuksus: 15,
  gCount: 3,
  daninaLbl: 'Podatek',
  porzadek: {
    bandKey: 'napiecie',
    szPct: 70.2,
    prawPct: 45.6,
    szMax: 20,
    prawMax: 20,
    prawPkt: 9.4,
    prawLines: [{ id: 'g', label: 'Garnizon', value: -2 }],
  },
};

const RELIGION_BASE = {
  stateReligion: 'Politeizm',
  sklad: [{ name: 'Politeizm', pct: 70 }, { name: 'Animizm', pct: 30 }],
  dominujaca: 'Politeizm',
  udzialPct: 70,
  wplywSzczescieSzPkt: -7.666666666666666,
  przyrostWiernych: 1,
  zrodla: [{ nazwa: 'Świątynia', wartosc: 3 }],
};
const CULTURE_BASE = {
  ownerCultureLabel: 'Polska',
  kulturaMix: [{ label: 'Polska', pct: 80, isOwner: true }, { label: 'Obca', pct: 20, isOwner: false }],
  cultureConverting: true,
  ownCultureSharePct: null,
  kulturaSuma: 30,
  przyrost: 4,
  borderRadius: 2,
  thresholds: [10, 50, 120],
  zrodla: [{ nazwa: 'Teatr', wartosc: 2 }],
};
const KULTURA_BASE = {
  skalaSzEpoki: 23,
  relParams: { progDominacjiPct: 50, szybkoscSzerzeniaBazowa: 1, swiatyniaBonusSzerzenia: 2, szerzenieMaxDystans: 3, konwersjaBazaPct: 10, konwersjaSwiatyniaPct: 5 },
  culture: CULTURE_BASE,
  religion: RELIGION_BASE,
  kulturaZPlonow: 5,
};

const WEALTH_PARAMS = { zachowaniePoAwansie: 0.5, mnoznikNaPoziom: 0.25, progNaPoziom: 100, utrzymanieBaza: 0.1, utrzymaniePrzyCap: 0.3, karaZero: -2, zadowolenieMax: 4 };
const ZAMOZNOSC_BASE = {
  poziom: 2, pula: 40, cap: 5, prog: 100, mnoznik: 1.25, zadowolenie: 1, rownowaga: 0.2,
  epoch: 2, atCap: false, zamIn: 10, etaW: 6, procentLuksus: 20,
  daninaLbl: 'Podatek', daninaLblGen: 'Podatku', pieniadzMiasta: 50, params: WEALTH_PARAMS,
};

/** CityView (k01b-t) — tylko pola czytane przez karte Wyzywienia. */
const VIEW_BASE = {
  poziomRacji: 3, zywnoscBrutto: 10, kosztRacji: 9, bilansLokalny: 1, wzrostUlamkowy: 0.5,
  maSpichlerz: true, maAkwedukt: false, popCapSpichlerz: 12, popCapZAkweduktem: 0, popCapBezAkweduktu: 8,
  atPopCap: false,
};
const BD_BASE = { total: 4, racje: -1, maleMiasto: 0, spichlerz: 2, zdrowie: 1, szczescie: 1, cywilizacja: 0, zaopatrzenie: 1 };
const WYZ_BASE = {
  ludnoscAbsolutna: 12345, ludnoscNaObywatela: 200,
  wyzwienieSummary: '2 🍞/miesz. · +1%',
  tick: { uprawaHodowla: 10.4, wyzwienieLudnosci: 3, pomocMiastom: 0, wojsko: 1, maxCap: 500, zapasyPo: 120 },
  zapasyPanstwa: null,
};

// ---------------------------------------------------------------- bundle + load
let exitCode = 0;
try {
  const v2Out = join(tmp, 'v2');
  await bundle(
    [
      join(CITY, 'k04c-porzadek.ts'), join(CITY, 'k04c-kultura.ts'), join(CITY, 'k04c-zamoznosc.ts'),
      join(CITY, 'k04c-wyzywienie.ts'), join(CITY, 'k04c-model.ts'),
      join(V2_ROOT, 'src/controller/mockCatalog.ts'), join(V2_ROOT, 'src/controller/staticCatalog.ts'),
    ],
    v2Out,
    { extraPlugins: [stubPlugin] },
  );
  const SC = await import(pathToFileURL(entryJs(v2Out, 'staticCatalog.js')).href);
  const MC = await import(pathToFileURL(entryJs(v2Out, 'mockCatalog.js')).href);
  SC.installStaticCatalog(MC.MOCK_STATIC_CATALOG);
  const K = {
    porz: await import(pathToFileURL(entryJs(v2Out, 'k04c-porzadek.js')).href),
    kult: await import(pathToFileURL(entryJs(v2Out, 'k04c-kultura.js')).href),
    zam: await import(pathToFileURL(entryJs(v2Out, 'k04c-zamoznosc.js')).href),
    wyz: await import(pathToFileURL(entryJs(v2Out, 'k04c-wyzywienie.js')).href),
    model: await import(pathToFileURL(entryJs(v2Out, 'k04c-model.js')).href),
  };

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
  /** Pary etykieta/wartosc z `.dc-l` + `.dc-v` (kolejnosc jak w DOM). */
  const rows = (card) => {
    const ls = [...card.querySelectorAll('.dc-l')];
    const vs = [...card.querySelectorAll('.dc-v')];
    return ls.map((l, idx) => [l.textContent, vs[idx]?.textContent ?? '']);
  };
  const text = (card) => card.textContent ?? '';

  // ---------------------------------------------------------------- wektory
  const results = [];
  const expectRow = (name, card, label, value) => {
    const r = rows(card).find(([l]) => l === label);
    const got = r ? r[1] : '<brak wiersza>';
    results.push({ name, ok: r !== undefined && got === value, detail: `${label} => "${got}" (oczekiwano "${value}")` });
  };
  const expectText = (name, card, needle) => {
    const t = text(card);
    results.push({ name, ok: t.includes(needle), detail: `zawiera "${needle}"` });
  };
  const expectAbsentRow = (name, card, label) => {
    const has = rows(card).some(([l]) => l === label);
    results.push({ name, ok: !has, detail: `brak wiersza "${label}"` });
  };

  // Porzadek — pin :3427-3549
  const pz = build(() => K.porz.buildPorzadekDetailCardK(PORZADEK_BASE));
  expectRow('porz:por-lacznie', pz, 'Porządek łącznie', '62% — Napięcie'); // pin :3448
  expectRow('porz:szczescie-max', pz, 'Szczęście', '70% (14/20 pkt)'); // pin :3450-3452
  expectRow('porz:prawo-legacy-pkt', pz, 'Prawo', '46% (9/20 pkt)'); // pin :3458-3462 (state.porzadek)
  expectRow('porz:szlines-display', pz, 'Budynki', '+7.7'); // pin :3489 szPktDisplay
  expectRow('porz:prawlines', pz, 'Garnizon', '-2'); // pin :3497-3498
  expectText('porz:band-note', pz, '50–69% — lekkie napięcie: praca spada o ~5%. Czas reagować, zanim spadnie dalej.'); // pin :3474-3477
  expectText('porz:chain-danina-lower', pz, '1. Suwak Zamożność (podatek) → wyższy udział zamożności'); // pin :3506
  expectText('porz:actions-procent', pz, '(obecnie 15% — im wyżej'); // pin :3530
  expectText('porz:actions-garnizon', pz, '(obecnie 3 jedn. w garnizonie)'); // pin :3532
  const pzNoSzMax = build(() => K.porz.buildPorzadekDetailCardK({ ...PORZADEK_BASE, porzadek: { ...PORZADEK_BASE.porzadek, szMax: null, prawMax: null, bandKey: 'bunt_skrajny' } }));
  expectRow('porz:szczescie-bez-max', pzNoSzMax, 'Szczęście', '70%'); // pin :3453
  expectRow('porz:prawo-bez-max', pzNoSzMax, 'Prawo', '46%'); // pin :3462
  expectText('porz:band-skrajny', pzNoSzMax, '<10% — alert krytyczny, 2 tury grace → potem rebelia AI (odbicie wojskiem).'); // pin :3480
  const pzRevolt = build(() => K.porz.buildPorzadekDetailCardK({ ...PORZADEK_BASE, revoltWarning: true, revoltGraceRemaining: 2, rebelActive: true }));
  expectRow('porz:alert-buntu', pzRevolt, 'Alert buntu', '2 tur(y) na reakcję'); // pin :3464-3466
  expectRow('porz:rebelia', pzRevolt, 'Rebelia', 'Miasto pod kontrolą rebeliantów'); // pin :3467-3469
  expectAbsentRow('porz:brak-alertu', pz, 'Alert buntu'); // pin :3464 (warunek warningu)

  // Kultura i Religia — pin :3836-3990
  const kl = build(() => K.kult.buildKulturaDetailCardK(KULTURA_BASE));
  expectRow('kult:suma', kl, 'Suma kultury', '30'); // pin :3888
  expectRow('kult:przyrost', kl, 'Przyrost', '+4'); // pin :3889
  expectRow('kult:zasieg', kl, 'Zasięg granic', '+2 pierścieni'); // pin :3890
  expectRow('kult:nastepny-prog', kl, 'Następny próg', '50 pkt kultury'); // pin :3892-3893
  expectRow('kult:skladnik-zrodla', kl, 'Teatr', '+2'); // pin :3898
  expectRow('kult:skala-epoki', kl, 'Skala Sz tej epoki', '±23 pkt — 100% własnej +23, 100% obcej −23'); // pin :3934
  expectRow('kult:prog-dominacji', kl, 'Próg dominacji', '>50% wyznawców (opis składu; Szczęście liczy się z udziału)'); // pin :3933
  expectRow('kult:konwersja', kl, 'Konwersja po podboju', '10% (+5% ze Świątynią)'); // pin :3941
  expectRow('kult:wplyw-sz', kl, 'Wpływ na Szczęście', '-7.7 pkt'); // pin :3965-3966 (religiaSzPunkty)
  expectRow('kult:szerzenie', kl, 'Szerzenie', '+1 wiernych'); // pin :3967-3968
  expectRow('kult:dominujaca', kl, 'Dominująca', 'Politeizm'); // pin :3963
  expectRow('kult:udzial', kl, 'Udział wyznawców', '70%'); // pin :3964
  expectRow('kult:skladnik-religii', kl, 'Świątynia', '+3'); // pin :3974
  expectRow('kult:skład-kultury-konwersja', kl, 'Obca', '20% · konwersja w toku'); // pin :3876-3879
  expectRow('kult:skład-wyznawcow-obca', kl, 'Animizm', '30% · obca wiara'); // pin :3953-3956
  expectText('kult:footnote-konwersja', kl, 'udział kultury właściciela rośnie co turę'); // pin :3881-3882
  expectText('kult:footnote-obca-wiara', kl, 'Po podboju obca wiara stopniowo ustępuje religii państwa'); // pin :3958-3959
  const klBrak = build(() => K.kult.buildKulturaDetailCardK({ ...KULTURA_BASE, culture: null, religion: null }));
  expectRow('kult:estymata-plonow', klBrak, 'Przyrost z plonów', '+5'); // pin :3901-3904
  expectText('kult:brak-religii', klBrak, 'Brak danych silnika (hak getReligionState)'); // pin :3978-3979
  const klBrakPlonow = build(() => K.kult.buildKulturaDetailCardK({ ...KULTURA_BASE, culture: null, kulturaZPlonow: null }));
  expectAbsentRow('kult:bez-widoku-brak-estymaty', klBrakPlonow, 'Przyrost z plonów'); // pin :3901 (warunek `view`)

  // Zamożność — pin :4824-4944
  const zm = build(() => K.zam.buildZamoznoscDetailCardK(ZAMOZNOSC_BASE));
  expectText('zam:summary', zm, 'W2 · pula 40 / 100 · ×Skarb 1.25'); // pin :4858-4859
  expectRow('zam:pasek', zm, 'Pasek (główny widok)', '40 / 100 — ile zebrano z puli potrzebnej do W3'); // pin :4871-4873
  expectRow('zam:prog-awansu', zm, 'Próg awansu', '100 💰 w puli → awans na W3 (zostaje 50% puli)'); // pin :4876-4878
  expectRow('zam:postep', zm, 'Postęp paska', '→ W3: 40 / 100 (40%)'); // pin :4884-4886
  expectRow('zam:mnoznik-przecinek', zm, 'Mnożnik skarbca', '×1,25'); // pin :4887
  expectRow('zam:wplyw-szcz', zm, 'Wpływ na szczęście', '+1 zadowolonych'); // pin :4888
  expectRow('zam:kolejny', zm, 'Kolejny poziom W', 'W3 za ok. 6 tur przy ~10 💰/turę do puli (udział „Zamożność” w Podatku)'); // pin :4889-4892 (tury(6)='tur' — sprawdza tekst)
  expectRow('zam:do-puli', zm, '→ do puli zamożności', '~+10'); // pin :4906 (spolEst=round(50*20/100))
  expectRow('zam:koszt-utrzymania', zm, '→ koszt utrzymania W', '~+10'); // pin :4907 (utrzymEst=round(0.2*50))
  expectRow('zam:saldo', zm, 'Saldo puli', '0 (rośnie)'); // pin :4909-4910 (net 0 => rośnie)
  expectText('zam:wzor-rownowaga', zm, 'Równowaga(W) = 10% + (W/cap)×(30%−10%)'); // pin :4899
  expectRow('zam:szczescie-mechanika', zm, 'Szczęście', 'W=0: -2; dalej floor(W × 4 / cap epoki) — max +4 w każdej epoce (cap 5)'); // pin :4921
  const zmCap = build(() => K.zam.buildZamoznoscDetailCardK({ ...ZAMOZNOSC_BASE, poziom: 5, pula: 0, atCap: true, etaW: null, pieniadzMiasta: null }));
  expectRow('zam:cap-pasek', zmCap, 'Pasek (główny widok)', 'Pełny — osiągnięto max W w tej epoce'); // pin :4871-4872
  expectRow('zam:cap-prog', zmCap, 'Próg awansu', 'Brak — cap epoki'); // pin :4877
  expectRow('zam:brak-podgladu', zmCap, 'Pieniądz miasta', '— (brak podglądu tury)'); // pin :4913
  expectRow('zam:cap-kolejny', zmCap, 'Kolejny poziom W', 'Maks. poziom w tej epoce'); // pin :4890

  // Wyzywienie i wzrost — pin :5474-5579
  const wyzFed = build(() => K.wyz.buildWyzywienieDetailCardK({ view: VIEW_BASE, population: 7, maxSafe: 3, bd: BD_BASE, fed: true, turnsDoNastepnego: 3, wyzywienie: WYZ_BASE }));
  expectRow('wyz:obywatele', wyzFed, 'Obywatele (sloty)', '7'); // pin :5503
  expectRow('wyz:ludnosc-abs', wyzFed, 'Ludność absolutna', '≈ 12.3 tys. osób'); // pin :5504
  expectRow('wyz:skala-epoki', wyzFed, 'Skala epoki', '1 obywatel = 200'); // pin :5505
  expectRow('wyz:produkcja', wyzFed, 'Produkcja brutto', '+10 🍞/t'); // pin :5509
  expectRow('wyz:koszt-racji', wyzFed, 'Koszt wyżywienia', '−9 🍞/t (Wyżywienie 3)'); // pin :5510 (cityFoodSplit bez przyciecia: racje=round(kosztRacji)=9)
  expectRow('wyz:wyzywienie-podsum', wyzFed, 'Wyżywienie', '2 🍞/miesz. · +1%'); // pin :5515-5516
  expectRow('wyz:lacznie-fed', wyzFed, 'Łącznie', '+4%'); // pin :5535
  expectRow('wyz:postep', wyzFed, 'Postęp do +1 obywatela', '0,50 / 1'); // pin :5536 (fmtDecPl)
  expectRow('wyz:kolejny-za', wyzFed, 'Kolejny obywatel', 'za ≈ 3 tury'); // pin :5542-5545
  expectText('wyz:spichlerz-budynek', wyzFed, '+2% WZROST · limit ludności 12 bez Akweduktu · niższy koszt racji (Ceramika −25%, pełny II −50%)'); // pin :5556
  expectRow('wyz:magazyn-stan', wyzFed, 'W magazynie', '120 / 500 🍞'); // pin :5570
  expectRow('wyz:uprawa', wyzFed, 'Uprawa i hodowla', '+10 🍞'); // pin :5566 (Math.round(10.4))
  const wyzGlod = build(() => K.wyz.buildWyzywienieDetailCardK({ view: VIEW_BASE, population: 7, maxSafe: 3, bd: BD_BASE, fed: false, turnsDoNastepnego: null, wyzywienie: { ...WYZ_BASE, tick: null, wyzwienieSummary: null, zapasyPanstwa: 130 } }));
  expectRow('wyz:glod-lacznie', wyzGlod, 'Łącznie', '— (głód)'); // pin :5535
  expectRow('wyz:glod-kolejny', wyzGlod, 'Kolejny obywatel', 'brak — głód'); // pin :5543
  expectAbsentRow('wyz:brak-magazynu', wyzGlod, 'W magazynie'); // pin :5563 (if tick)
  const wyzPop = build(() => K.wyz.buildWyzywienieDetailCardK({ view: { ...VIEW_BASE, atPopCap: true }, population: 7, maxSafe: 3, bd: BD_BASE, fed: true, turnsDoNastepnego: 0, wyzywienie: WYZ_BASE }));
  expectRow('wyz:limit-ludnosci', wyzPop, 'Kolejny obywatel', 'limit ludności'); // pin :5542
  const wyzTura = build(() => K.wyz.buildWyzywienieDetailCardK({ view: VIEW_BASE, population: 7, maxSafe: 3, bd: BD_BASE, fed: true, turnsDoNastepnego: 0, wyzywienie: WYZ_BASE }));
  expectRow('wyz:w-tej-turze', wyzTura, 'Kolejny obywatel', 'w tej turze'); // pin :5544
  const wyzTick130 = build(() => K.wyz.buildWyzywienieDetailCardK({ view: VIEW_BASE, population: 7, maxSafe: 3, bd: BD_BASE, fed: true, turnsDoNastepnego: 3, wyzywienie: { ...WYZ_BASE, zapasyPanstwa: 130 } }));
  expectRow('wyz:magazyn-panstwa-priorytet', wyzTick130, 'W magazynie', '130 / 500 🍞'); // pin :5570 `st?.zapasyPanstwa ?? tick.zapasyPo`
  const wyzBezSpichlerza = build(() => K.wyz.buildWyzywienieDetailCardK({ view: { ...VIEW_BASE, maSpichlerz: false, maAkwedukt: false }, population: 7, maxSafe: 3, bd: BD_BASE, fed: true, turnsDoNastepnego: 3, wyzywienie: WYZ_BASE }));
  results.push({ name: 'wyz:brak-sekcji-budynkow', ok: !text(wyzBezSpichlerza).includes('Budynki wpływające na wzrost') && !text(wyzBezSpichlerza).includes('limit ludności 12 bez Akweduktu'), detail: 'brak sekcji „Budynki wpływające na wzrost” gdy brak Spichlerza/Akweduktu (pin :5552)' });

  // Model — pin :3050, :1637, :3281, :170
  const M = K.model;

  // Wektory domykajace przezyte mutacje (mutate-k04c-units.mjs, runda 2 / Operator-pomiary): granice i brzegi wejsc.
  const pzZero = build(() => K.porz.buildPorzadekDetailCardK({ ...PORZADEK_BASE, porzadek: { ...PORZADEK_BASE.porzadek, prawLines: [{ id: 'z', label: 'Zero', value: 0 }] } }));
  expectRow('porz:skladnik-zero', pzZero, 'Zero', '+0'); // pin :3497-3498 (`value >= 0`)
  const klProg = build(() => K.kult.buildKulturaDetailCardK({ ...KULTURA_BASE, culture: { ...CULTURE_BASE, kulturaSuma: 50 } }));
  expectRow('kult:prog-granica', klProg, 'Następny próg', '120 pkt kultury'); // pin :3892 (`t > suma`, suma == próg 50)
  const klSzZero = build(() => K.kult.buildKulturaDetailCardK({ ...KULTURA_BASE, religion: { ...RELIGION_BASE, wplywSzczescieSzPkt: 0 } }));
  expectRow('kult:wplyw-zero', klSzZero, 'Wpływ na Szczęście', '+0 pkt'); // pin :3966 (`>= 0`)
  const klDom = build(() => K.kult.buildKulturaDetailCardK({ ...KULTURA_BASE, religion: { ...RELIGION_BASE, dominujaca: 'Animizm' } }));
  expectRow('kult:dominujaca-z-dto', klDom, 'Dominująca', 'Animizm'); // pin :3963 (`relState.dominujaca`, nie stateReligion)
  expectRow('zam:pula-do-W', zm, 'Pula zamożności', '40 / 100 do W3'); // pin :4883
  const wyzRacje = rows(wyzFed).filter(([l]) => l === 'Wyżywienie')[1];
  results.push({ name: 'wyz:racje-wzrost', ok: wyzRacje !== undefined && wyzRacje[1] === '−1%', detail: `Wyżywienie (WZROST, 2. wiersz) => "${wyzRacje?.[1]}" (oczekiwano "−1%"); pin :5521` });
  expectRow('wyz:wojsko', wyzFed, 'Wojsko', '−1 🍞'); // pin :5569
  const healthLines = M.resolveCityHealthK({ total: 2, lines: [{ label: 'x', value: 2 }, { label: 'y', value: -1 }] });
  results.push({ name: 'model:health-lines', ok: healthLines.lines.length === 2 && healthLines.lines[1].value === -1, detail: 'resolveCityHealthK: linie przepisane z DTO (pin :3282-3283)' });
  results.push({ name: 'model:szPkt-round1', ok: M.religiaSzPunktyK(-7.666666666666666) === -7.7, detail: 'religiaSzPunktyK(-7.6666) === -7.7 (pin szPktDisplay)' });
  results.push({ name: 'model:szPkt-plus', ok: M.religiaSzPunktyK(23) === 23, detail: 'religiaSzPunktyK(23) === 23' });
  const snap = { pracaRate: 3 };
  results.push({ name: 'model:empire-snap-engine', ok: M.resolveEmpireSnapK(snap, 9) === snap, detail: 'snapshot z silnika zwracany bez zmian (pin :1638-1639)' });
  results.push({ name: 'model:empire-snap-fallback', ok: JSON.stringify(M.resolveEmpireSnapK(null, 9)) === '{"zloto":9}', detail: 'brak snapshotu => {zloto} (pin :1641)' });
  const health = M.resolveCityHealthK({ total: 2, lines: [{ label: 'x', value: 2 }] });
  results.push({ name: 'model:health', ok: health.total === 2 && health.fromEngine === true, detail: 'resolveCityHealthK: total + fromEngine (pin :3282-3283)' });
  results.push({ name: 'model:wyz-label-przecinek', ok: M.formatWyzwienieLabelK(2.5) === '2,5' && M.formatWyzwienieLabelK(3) === '3' && M.formatWyzwienieLabelK(9) === '6', detail: 'formatWyzwienieLabelK: 2,5 / 3 / clamp 9→6 (pin :170-173, :135)' });

  let ok = 0;
  for (const r of results) {
    if (r.ok) ok += 1;
    else {
      exitCode = 1;
      console.log(`BLAD ${r.name}: ${r.detail}`);
    }
  }
  console.log(`run-k04c-units: wektory=${results.length} zielone=${ok} bledne=${results.length - ok} jsdomErrors=${jsdomErrors.length}`);
  if (jsdomErrors.length > 0) {
    console.log('jsdomErrors (pierwsze 5):', jsdomErrors.slice(0, 5));
    exitCode = 1;
  }
} catch (e) {
  console.error('run-k04c-units: blad harnessu:', e?.stack ?? e);
  exitCode = 2;
}
process.exit(exitCode);
