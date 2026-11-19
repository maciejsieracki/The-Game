'use strict';
/**
 * diplomacy-war-level-test.cjs -- R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1.
 * Ustawienie nowej gry „Dyplomacja i wojna”: ŁATWA (= dziś), NORMALNA (kary ×2, bonusy ÷2),
 * TRUDNA (kary ×3, bonusy ÷3). Źródło: gra/src/game/diplomacy-war-level.ts i punkty wiązania.
 *
 *  (W1) ŁATWA = wartości bazowe bit-w-bit (snapshot przed zmianą poziomu == po powrocie na ŁATWĄ);
 *  (W2) kary (zaufanie, respekt, wiarygodność N1–N7, klamry sojuszu) ×2 / ×3;
 *  (W3) bonusy (zaufanie za czynności, respekt, wiarygodność P/S, premie sojuszu) ÷2 / ÷3;
 *  (W4) zdarzenia sztywne w applyDiplomaticEvent: casus belli, ultimatum, trybut, zerwanie, pokój,
 *       trybut przyjęty, wymiana gratis (kary ×k, bonusy ÷k);
 *  (W5) progi, startowe zaufanie, czasy, ceny PN i wagi zmęczenia NIE zmienione (poziom TRUDNA);
 *  (W6) twarda dyplomacja (harder): napięcie granicy przyrost/klamra ×k PO klamrze, zazdrość ×k;
 *       progi zazdrości i sufit handlu bez zmian;
 *  (W7) przelicznik PN→Zaufanie: pn_na_zaufanie ×k, max_zaufanie_na_ture ÷k, progi bez zmian;
 *  (W8) bonus schodkowy wymiany (p7): krok i limit ÷k, sufit wartości bez zmian;
 *  (W9) agresor: relacjaDeltaSojusz ×k; willingnessAllyMnoznik 1−(1−x)·k (0,7 → 0,4 / 0,1);
 *  (W10) przemarsz nieautoryzowany ×k (wielkość kary), AI↔AI zerwanie (−30 → −60/−90);
 *  (W11) normalizacja pola: brak / zła wartość / stare zapisy = 'latwa'; 'normalna' i 'trudna' przechodzą;
 *  (W12) podgląd kary: trust-line 'zaufanie' ×k (zob. diplomacy-penalty-preview.ts, bez stałych -10/-15);
 *  (W13) mutacja kopii źródła helpera (ścieżka ×k usunięta) MUSI czerwienić testy.
 *
 *   node tools/diplomacy-war-level-test.cjs   # exit 0 = wszystko zielone i mutant wykryty
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');
const LEVEL_FILE = path.resolve(GAME_DIR, 'diplomacy-war-level.ts');
const LEVEL_ORIG = fs.readFileSync(LEVEL_FILE, 'utf8');

const ENTRY = `
export * as D from ${JSON.stringify(path.join(GAME_DIR, 'diplomacy.ts'))};
export * as L from ${JSON.stringify(LEVEL_FILE)};
export * as H from ${JSON.stringify(path.join(GAME_DIR, 'diplomacy-harder.ts'))};
export * as V from ${JSON.stringify(path.join(GAME_DIR, 'diplomacy-value-catalog.ts'))};
export * as T from ${JSON.stringify(path.join(GAME_DIR, 'diplomacy-tick-war-brake.ts'))};
export * as B from ${JSON.stringify(path.join(GAME_DIR, 'diplomacy-border-march.ts'))};
export * as AT from ${JSON.stringify(path.join(GAME_DIR, 'ai-ai-treaty-tick.ts'))};
export * as AE from ${JSON.stringify(path.join(GAME_DIR, 'ai-ai-treaty-evaluate.ts'))};
export * as P from ${JSON.stringify(path.join(GAME_DIR, 'diplomacy-penalty-preview.ts'))};
`;

const PREVIEW_FILE = path.resolve(GAME_DIR, 'diplomacy-penalty-preview.ts');
const EVAL_FILE = path.resolve(GAME_DIR, 'ai-ai-treaty-evaluate.ts');

/** Buduje bundle; `overrides` = { absPath: treść } (oryginał albo mutant danego pliku). */
async function loadBundle(overrides) {
  const res = await esbuild.build({
    stdin: { contents: ENTRY, resolveDir: GAME_DIR, sourcefile: 'entry.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
    plugins: [{
      name: 'war-level-mutant',
      setup(build) {
        build.onLoad({ filter: /\.ts$/ }, (args) => {
          const src = overrides[path.resolve(args.path)];
          return src === undefined ? undefined : { contents: src, loader: 'ts' };
        });
      },
    }],
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

/** Snapshot wartości bazowych (JSON-merge) przy aktualnym poziomie. */
function snapshot(M) {
  return JSON.parse(JSON.stringify(M.D.getBaseDiplomacyParams()));
}

function runSuite(M) {
  const out = [];
  const check = (name, fn) => {
    try {
      const r = fn();
      out.push({ name, ok: r === true, detail: r === true ? '' : String(r) });
    } catch (e) {
      out.push({ name, ok: false, detail: String(e && e.message || e) });
    }
  };
  const setLevel = (lvl) => M.L.setDiplomacyWarLevel(lvl);
  const withLevel = (lvl, fn) => { setLevel(lvl); try { return fn(); } finally { setLevel('latwa'); } };
  const eq = (label, got, want) => (near(got, want) ? true : `${label}: dostano ${got}, oczekiwano ${want}`);

  // ---- snapshot wartości bazowych (ŁATWA) ----
  setLevel('latwa');
  M.D.resetEffectiveDiplomacyParamsCache();
  const baseLatwa = snapshot(M);

  check('W1 ŁATWA: base == snapshot po powrocie z trudnej (bit-w-bit)', () => {
    withLevel('trudna', () => M.D.getBaseDiplomacyParams());
    const after = snapshot(M);
    return JSON.stringify(after) === JSON.stringify(baseLatwa) || 'ŁATWA po trudnej różni się od bazy';
  });

  check('W1b ŁATWA: getBaseDiplomacyParams zwraca te same liczby co dane (np. zlamanaPaktAI -20)', () => {
    setLevel('latwa');
    return eq('zlamanaPaktAI_zaufanie', M.D.getBaseDiplomacyParams().zlamanaPaktAI_zaufanie, -20);
  });

  check('W2 kary ×2 (NORMALNA) / ×3 (TRUDNA): zlamanaPaktAI -20 -> -40 / -60', () => {
    const n = withLevel('normalna', () => M.D.getBaseDiplomacyParams().zlamanaPaktAI_zaufanie);
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams().zlamanaPaktAI_zaufanie);
    return eq('N', n, -40) === true && eq('T', t, -60) === true ? true : `N=${n} T=${t}`;
  });

  check('W2b kary ×k: wiarygodnoscN2ZlamaniePaktuSojusz -25 -> -50 / -75; N7 -2 -> -4 / -6', () => {
    const p = (lvl) => withLevel(lvl, () => M.D.getBaseDiplomacyParams());
    const n = p('normalna'); const t = p('trudna');
    const r = [
      eq('N2S', n.wiarygodnoscN2ZlamaniePaktuSojusz, -50),
      eq('T2S', t.wiarygodnoscN2ZlamaniePaktuSojusz, -75),
      eq('N7', n.wiarygodnoscN7NieautoryzowanyPrzemarsz, -4),
      eq('T7', t.wiarygodnoscN7NieautoryzowanyPrzemarsz, -6),
    ].find(x => x !== true);
    return r || true;
  });

  check('W2c kary sąsiedztwa: ekspansjaGranicaZelazo -5 -> -10 / -15', () => {
    const n = withLevel('normalna', () => M.D.getBaseDiplomacyParams().ekspansjaGranicaZelazo_zaufanie_perTura);
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams().ekspansjaGranicaZelazo_zaufanie_perTura);
    return eq('N', n, -10) === true && eq('T', t, -15) === true ? true : `N=${n} T=${t}`;
  });

  check('W2d klamry sojuszu: progSojuszKaraSilniejszyMax 0,40 -> 0,80 / 1,20', () => {
    const n = withLevel('normalna', () => M.D.getBaseDiplomacyParams().progSojuszKaraSilniejszyMax);
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams().progSojuszKaraSilniejszyMax);
    return eq('N', n, 0.8) === true && eq('T', t, 1.2) === true ? true : `N=${n} T=${t}`;
  });

  check('W3 bonusy ÷2 (NORMALNA) / ÷3 (TRUDNA): handel_zaufanie_perTura 1 -> 0,5 / 0,333', () => {
    const n = withLevel('normalna', () => M.D.getBaseDiplomacyParams().handel_zaufanie_perTura);
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams().handel_zaufanie_perTura);
    return eq('N', n, 0.5) === true && eq('T', t, 1 / 3) === true ? true : `N=${n} T=${t}`;
  });

  check('W3b bonusy ÷k: wiarygodnoscS3HandelPerTureLatwy 1,2 -> 0,6 / 0,4 (ten sam klucz, ÷k)', () => {
    const n = withLevel('normalna', () => M.D.getBaseDiplomacyParams().wiarygodnoscS3HandelPerTureLatwy);
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams().wiarygodnoscS3HandelPerTureLatwy);
    return eq('N', n, 0.6) === true && eq('T', t, 0.4) === true ? true : `N=${n} T=${t}`;
  });

  check('W3c premia sojuszu ÷k: progSojuszPremiaSilniejszyMax 0,25 -> 0,125 / 0,0833', () => {
    const n = withLevel('normalna', () => M.D.getBaseDiplomacyParams().progSojuszPremiaSilniejszyMax);
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams().progSojuszPremiaSilniejszyMax);
    return eq('N', n, 0.125) === true && eq('T', t, 0.25 / 3) === true ? true : `N=${n} T=${t}`;
  });

  check('W5 progi/start/czas/PN nie zmienione przy TRUDNA', () => {
    const t = withLevel('trudna', () => M.D.getBaseDiplomacyParams());
    const same = [
      'progSojuszZaufanie', 'progSojuszRelacja', 'progMinimalnyRelacja', 'progNapRelacja',
      'startZaufanie', 'startRespekt', 'rywalizacjaTenSamTyp_zaufanie', 'roznicaKulturowa_zaufanie',
      'progSojuszWillingnessMin', 'wiarygodnoscProgWiarolomny', 'wiarygodnoscSkalaMin', 'wiarygodnoscSkalaMax',
      'wiarygodnoscN3KarencjaBezterminoweTur', 'wiarygodnoscN6ProgTurZRzedu', 'wiarygodnoscCzasZapomnieniaNagrodaLatwy',
      'wiarygodnoscCzasZapomnieniaKaraTrudny', 'progWymianaTechZaufanie', 'turyEfektuPodarunku',
      'wiarygodnoscP4OknoBezWojnyTur', 'zerwanie_handlu_bez_kary',
    ];
    for (const k of same) {
      if (!(k in baseLatwa)) continue;
      if (!near(t[k], baseLatwa[k])) return `${k} zmienione: ${baseLatwa[k]} -> ${t[k]}`;
    }
    return true;
  });

  check('W4 źródło: brak literalnych dZ/dR sztywnych w applyDiplomaticEvent (wszystkie przez ×k / ÷k)', () => {
    // wojna_casus_belli nie da się zmierzyć dZ (clampRelationForWar zeruje Zaufanie przy statusie wojna),
    // więc sprawdzamy źródło: żadnego literału -10/5/-15 przypisanego do dZ/dR w diplomacy.ts.
    const src = fs.readFileSync(path.join(GAME_DIR, 'diplomacy.ts'), 'utf8');
    const lit = src.match(/\b(dZ|dR) = -?[1-9]\d*(\.\d+)?;/g) || [];  // zera (dZ = 0) są dozwolone
    return lit.length === 0 || 'literały sztywne: ' + lit.join(', ');
  });

  check('W4b ultimatum: dZ -10 i dR -10 -> -20 / -30 (NORMALNA/TRUDNA)', () => {
    const rel = { zaufanie: 60, respekt: 60, status: 'pokoj' };
    const run = (lvl) => withLevel(lvl, () => {
      const r = M.D.applyDiplomaticEvent(rel, 'ultimatum_bezpodstawne', M.D.getBaseDiplomacyParams());
      return [r.zaufanie - 60, r.respekt - 60];
    });
    const n = run('normalna'); const t = run('trudna');
    return [eq('NZ', n[0], -20), eq('NR', n[1], -20), eq('TZ', t[0], -30), eq('TR', t[1], -30)].find(x => x !== true) || true;
  });

  check('W4c zerwanie_traktatu dZ: -15 / -30 / -45', () => {
    const rel = { zaufanie: 80, respekt: 50, status: 'pokoj' };
    const dz = (lvl) => withLevel(lvl, () => M.D.applyDiplomaticEvent(rel, 'zerwanie_traktatu', M.D.getBaseDiplomacyParams()).zaufanie - 80);
    return [eq('L', dz('latwa'), -15), eq('N', dz('normalna'), -30), eq('T', dz('trudna'), -45)].find(x => x !== true) || true;
  });

  check('W4d pokój (bonus sztywny) dZ: +5 / +2,5 / +1,67', () => {
    const rel = { zaufanie: 20, respekt: 50, status: 'wojna' };
    const dz = (lvl) => withLevel(lvl, () => M.D.applyDiplomaticEvent(rel, 'pokoj', M.D.getBaseDiplomacyParams()).zaufanie - 20);
    return [eq('L', dz('latwa'), 5), eq('N', dz('normalna'), 2.5), eq('T', dz('trudna'), 5 / 3)].find(x => x !== true) || true;
  });

  check('W4e trybut_oferta_przyjeta i wymiana_tech_gratis (bonusy sztywne): +5 / +2,5 / +1,67', () => {
    const rel = { zaufanie: 20, respekt: 50, status: 'pokoj' };
    const out2 = [];
    for (const ev of ['trybut_oferta_przyjeta', 'wymiana_tech_gratis']) {
      const dz = (lvl) => withLevel(lvl, () => M.D.applyDiplomaticEvent(rel, ev, M.D.getBaseDiplomacyParams()).zaufanie - 20);
      out2.push(eq(ev + ' L', dz('latwa'), 5), eq(ev + ' N', dz('normalna'), 2.5), eq(ev + ' T', dz('trudna'), 5 / 3));
    }
    return out2.find(x => x !== true) || true;
  });

  check('W4f trybut_odmowa dZ: -10 / -20 / -30', () => {
    const rel = { zaufanie: 60, respekt: 50, status: 'pokoj' };
    const dz = (lvl) => withLevel(lvl, () => M.D.applyDiplomaticEvent(rel, 'trybut_odmowa', M.D.getBaseDiplomacyParams()).zaufanie - 60);
    return [eq('L', dz('latwa'), -10), eq('N', dz('normalna'), -20), eq('T', dz('trudna'), -30)].find(x => x !== true) || true;
  });

  check('W6 napięcie granicy: przyrost ×k PO klamrze; zazdrość ×k; progi bez zmian', () => {
    const r = [];
    // ŁATWA: przyrost 1/okres 10, klamra 6. 20 tur => -2, suma -5-2=-7 => klamra -6
    setLevel('latwa');
    r.push(eq('L clamp', M.H.karaGranicaZNapieciem(-5, 100), -6));
    // NORMALNA: przyrost 2, klamra 12. karaBazowa już ×2 (-10). 20 tur => -4, suma -14 => klamra -12
    setLevel('normalna');
    r.push(eq('N clamp', M.H.karaGranicaZNapieciem(-10, 100), -12));
    // TRUDNA: przyrost 3, klamra 18. karaBazowa -15, 20 tur => -6, suma -21 => klamra -18
    setLevel('trudna');
    r.push(eq('T clamp', M.H.karaGranicaZNapieciem(-15, 100), -18));
    r.push(eq('T przyrost', M.H.napieciePenaltyZaTure(20), -6));
    const zaz = { czyParaZLiderem: true, partnerToGracz: false, sojuszZLiderem: false, mocLidera: 10, mocDrugiego: 5 };
    r.push(eq('T zazdrość duża', M.H.zazdroscLidera(zaz), -6));
    setLevel('latwa');
    r.push(eq('L zazdrość duża', M.H.zazdroscLidera(zaz), -2));
    setLevel('normalna');
    r.push(eq('N zazdrość duża', M.H.zazdroscLidera(zaz), -4));
    setLevel('latwa');
    return r.find(x => x !== true) || true;
  });

  check('W6b progi zazdrości i sufit handlu nie zmienione (TRUDNA)', () => {
    setLevel('trudna');
    const sufit = M.H.capZaufanieZaHandel(10, 100, false);
    setLevel('latwa');
    // sufit handelSufitZaufania = 50 => headroom 40 => min(100, 40) = 40 niezależnie od poziomu
    return eq('sufit', sufit, 40) === true ? true : `sufit=${sufit}`;
  });

  check('W7 PN→Zaufanie: pn_na_zaufanie ×k, max ÷k, progi nie zmienione', () => {
    const p = (lvl) => withLevel(lvl, () => M.V.diplomacyPnRelacjaParams());
    const l = p('latwa'); const n = p('normalna'); const t = p('trudna');
    const r = [
      eq('pn L', l.pn_na_zaufanie, 100), eq('pn N', n.pn_na_zaufanie, 200), eq('pn T', t.pn_na_zaufanie, 300),
      eq('max L', l.max_zaufanie_na_ture, 5), eq('max N', n.max_zaufanie_na_ture, 2.5), eq('max T', t.max_zaufanie_na_ture, 5 / 3),
      eq('min_nadmiar T', t.min_nadmiar_pn, l.min_nadmiar_pn),
      eq('prog_dar T', t.prog_dar_relacja, l.prog_dar_relacja),
      eq('dobra_wola_min T', t.dobra_wola_min_nadmiar_pn, l.dobra_wola_min_nadmiar_pn),
      eq('dobra_wola_tur T', t.dobra_wola_tur, l.dobra_wola_tur),
      eq('dobra_wola_zaufanie N', n.dobra_wola_zaufanie_per_tura, 0.5),
    ];
    return r.find(x => x !== true) || true;
  });

  check('W8 bonus schodkowy wymiany p7: krok ÷k i limit ÷k; sufit bez zmian', () => {
    const p7 = {
      wymianaKrokPktPerEpoka: { '1': 100 }, wymianaMnoznikNaEpoke: 2, wymianaZaufanieNaKrok: 0.5,
      wymianaMaxPerTura: 5, wymianaSufitZaufania: 60, wymianaMinTurDostaw: 2,
    };
    const inp = { nadwyzkaPn: 1000, epoka: 1, zaufanie: 0, kolejneTuryDostaw: 5 };
    const g = (lvl) => withLevel(lvl, () => M.T.tradeTrustBonusPerTura(inp, p7));
    const r = [eq('L', g('latwa'), 5), eq('N', g('normalna'), 2.5), eq('T', g('trudna'), 5 / 3)];
    // sufit: zaufanie 58 => headroom 2; limit ÷3 = 1,67 < 2 => wynik 1,67 (sufit wartości nie dzielony, bo to nie bonus)
    const headroom = withLevel('trudna', () => M.T.tradeTrustBonusPerTura({ ...inp, zaufanie: 58 }, p7));
    r.push(eq('limit T < sufit', headroom, 5 / 3));
    return r.find(x => x !== true) || true;
  });

  check('W9 agresor: relacjaDeltaSojusz 15 -> 30/45; willingness 0,7 -> 0,4/0,1; bez flagi = 0 / 1', () => {
    const r = [];
    setLevel('latwa');
    r.push(eq('del L', M.D.deltaRelacjiSojusz(true), 15));
    r.push(eq('wil L', M.D.mnoznikWillingnessAlly(true), 0.7));
    setLevel('normalna');
    r.push(eq('del N', M.D.deltaRelacjiSojusz(true), 30));
    r.push(eq('wil N', M.D.mnoznikWillingnessAlly(true), 0.4));
    setLevel('trudna');
    r.push(eq('del T', M.D.deltaRelacjiSojusz(true), 45));
    r.push(eq('wil T', M.D.mnoznikWillingnessAlly(true), 0.1));
    r.push(eq('bez flagi del', M.D.deltaRelacjiSojusz(false), 0));
    r.push(eq('bez flagi wil', M.D.mnoznikWillingnessAlly(false), 1));
    setLevel('latwa');
    return r.find(x => x !== true) || true;
  });

  check('W10 przemarsz nieautoryzowany (wielkość): 5 -> 10 / 15; AI↔AI zerwanie −30 -> −60 / −90', () => {
    const kara = (lvl) => withLevel(lvl, () => M.B.loadBorderMarchParams().karaPrzemarszNieautoryzowany_zaufanie_perTura);
    const zer = (lvl) => withLevel(lvl, () => M.AT.aiAiNapBreachRelacjaDelta());
    return [
      eq('przemarsz L', kara('latwa'), 5), eq('przemarsz N', kara('normalna'), 10), eq('przemarsz T', kara('trudna'), 15),
      eq('AI zerwanie L', zer('latwa'), -30), eq('AI zerwanie N', zer('normalna'), -60), eq('AI zerwanie T', zer('trudna'), -90),
    ].find(x => x !== true) || true;
  });

  check('W10b AI↔AI zerwanie zaufania (treatyParamsDefault): −20 -> −40 / −60 (ścieżka evaluateTreatyOffer)', () => {
    const z = (lvl) => withLevel(lvl, () => M.AE.aiAiBreachTrustDeltaDefault());
    return [eq('L', z('latwa'), -20), eq('N', z('normalna'), -40), eq('T', z('trudna'), -60)].find(x => x !== true) || true;
  });

  check('W11 normalizacja: brak / null / zła wartość = latwa; normalna / trudna przechodzą', () => {
    const n = M.L.normalizeDiplomacyWarLevel;
    const r = [
      eq('undef', n(undefined) === 'latwa' ? 1 : 0, 1),
      eq('null', n(null) === 'latwa' ? 1 : 0, 1),
      eq('bzdura', n('bzdura') === 'latwa' ? 1 : 0, 1),
      eq('normalna', n('normalna') === 'normalna' ? 1 : 0, 1),
      eq('trudna', n('trudna') === 'trudna' ? 1 : 0, 1),
      eq('stary zapis', n(false) === 'latwa' ? 1 : 0, 1),
    ];
    setLevel('trudna');
    setLevel(undefined);
    r.push(eq('set(undef)->latwa', M.L.getDiplomacyWarLevel() === 'latwa' ? 1 : 0, 1));
    return r.find(x => x !== true) || true;
  });

  check('W11b zapis/wczytanie: poziom z pola zapisu wraca identyczny; stary zapis (brak pola) = ŁATWA', () => {
    const saved = { advanced: { diplomacyWarLevel: 'trudna' } };
    const old = { advanced: {} };
    setLevel(saved.advanced.diplomacyWarLevel);
    const t = M.L.getDiplomacyWarLevel() === 'trudna';
    setLevel(old.advanced.diplomacyWarLevel);
    const l = M.L.getDiplomacyWarLevel() === 'latwa';
    setLevel('latwa');
    return t && l ? true : `trudna=${t} stary=${l}`;
  });

  check('W12 podgląd kary (realny moduł diplomacy-penalty-preview.ts): zerwanie traktatu Z −10/−15 ×k', () => {
    const PP = { zlamanaPaktGracz_zaufanie: -40, wiarygodnoscN1BezOstrzezenia: -10, wiarygodnoscN2ZlamaniePaktuNap: -18,
      wiarygodnoscN2ZlamaniePaktuSojusz: -25, wiarygodnoscN3AtakWOknieKarencji: -12, wiarygodnoscN3KarencjaBezterminoweTur: 10,
      wiarygodnoscN5ZerwanieTraktatCzasowy: -6, wiarygodnoscN5ZerwanieHandelCzasowy: -4 };
    const z = (lvl, rodzaj) => withLevel(lvl, () => M.P.previewVoluntaryTreatyBreakPenalties({ rodzaj, wygasaTura: 20 }, PP).zaufanieTotal);
    const r = [
      eq('handel L', z('latwa', 'umowa_handlowa'), -10),
      eq('handel N', z('normalna', 'umowa_handlowa'), -20),
      eq('handel T', z('trudna', 'umowa_handlowa'), -30),
      eq('traktat L', z('latwa', 'pakt_nieagresji'), -15),
      eq('traktat N', z('normalna', 'pakt_nieagresji'), -30),
      eq('traktat T', z('trudna', 'pakt_nieagresji'), -45),
    ];
    return r.find(x => x !== true) || true;
  });

  check('W12c źródło: ai.ts ekspansja_heurystyka_granica_kara przechodzi przez scalePenaltyForWarLevel (ABC7)', () => {
    const src = fs.readFileSync(path.resolve(GAME_DIR, 'ai.ts'), 'utf8');
    return src.includes("scalePenaltyForWarLevel(getAiParam(data, 'ekspansja_heurystyka_granica_kara'")
      || 'brak mnożnika poziomu przy ekspansja_heurystyka_granica_kara';
  });

  check('W12b nie-mutacja: base po poziomach == snapshot ŁATWA (JSON nie zmieniony)', () => {
    withLevel('trudna', () => M.D.getBaseDiplomacyParams());
    withLevel('normalna', () => M.D.getBaseDiplomacyParams());
    return JSON.stringify(snapshot(M)) === JSON.stringify(baseLatwa) || 'base zmienione po przełączeniu';
  });

  return out;
}

function summarize(label, results) {
  const failed = results.filter(r => !r.ok);
  console.log(`== ${label}: ${results.length - failed.length}/${results.length} zielone`);
  for (const r of failed) console.log(`   FAIL ${r.name}: ${r.detail}`);
  return failed.length;
}

async function main() {
// --- bieg główny: oryginał ---
const mainMod = await loadBundle({});
const mainFailed = summarize('ORYGINAŁ', runSuite(mainMod));

// --- mutanty: każdy usuwa ×k w jednym punkcie wiązania — każdy MUSI czerwienić testy ---
const mutants = [
  { name: 'helper kary bez ×k', file: LEVEL_FILE,
    from: 'return k === 1 ? value : value * k;', to: 'return value;' },
  { name: 'podgląd zerwania traktatu bez ×k (M5)', file: PREVIEW_FILE,
    from: 'scalePenaltyForWarLevel(isTrade ? -10 : -15)', to: '(isTrade ? -10 : -15)' },
  { name: 'AI↔AI zerwanie zaufania bez ×k (M4)', file: EVAL_FILE,
    from: 'zerwanieZaufanie: scalePenaltyForWarLevel(', to: 'zerwanieZaufanie: ((v: number) => v)(' },
];
let mutantProblem = false;
for (const m of mutants) {
  const orig = fs.readFileSync(m.file, 'utf8');
  if (orig.split(m.from).length !== 2) {
    console.log(`MUTANT ${m.name}: wzorzec nie znaleziony dokładnie raz — test nieważny`);
    mutantProblem = true;
    continue;
  }
  const mutMod = await loadBundle({ [path.resolve(m.file)]: orig.replace(m.from, m.to) });
  const mutFails = runSuite(mutMod).filter(r => !r.ok).length;
  console.log(`== MUTANT ${m.name}: ${mutFails} czerwonych`);
  if (mutFails === 0) { console.log('   BŁĄD: mutant NIE został wykryty'); mutantProblem = true; }
}

if (mutantProblem) process.exitCode = 1;
if (mainFailed > 0) process.exitCode = 1;
if (!process.exitCode) console.log('OK: wszystkie asercje zielone, wszystkie mutanty wykryte');
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
