'use strict';
/**
 * koszty-surowcowe-test.cjs -- regresja SPEC-KOSZTY-SUROWCOWE-BUDYNKOW (Maciej
 * 2026-07-25, dyspozycje/SPEC-KOSZTY-SUROWCOWE-BUDYNKOW.md) + Baszta (decyzja
 * 41B) + naprawa ogniwa lancucha kuzni (kuznia_zelaza.upgradeFrom='kuznia') +
 * "stala wartosc per tier" (maksPoziom=1 dla szesciu lancuchow "w gore") +
 * Odlewnia zelaza (decyzja 42A, Praca 8 -> 12 pkt/ture).
 *
 * Pokrywa (wymagania z zadania):
 *   A. Epoka Kamienia -- wylacznie drewno, poza dwoma zatwierdzonymi wyjatkami
 *      (Kamienne kregi, Stela/Pomnik -- zostaja na kamieniu).
 *   B. Epoka Brazu -- drewno + kamien (oba surowce, zaden inny).
 *   C. Epoka Zelaza -- drewno + cegla; budowle obronne (Cytadela, Baszta,
 *      Warsztat oblezniczy) i port (Port wielki) -- drewno + kamien.
 *   D. Brąz i żelazo jako surowiec BUDOWLANY zakazane wszedzie w grze.
 *   E. Baszta -- nowy budynek: grupa "Wojsko i obrona", brak upgradeFrom,
 *      +100% Obrony (miasto-params.json bonus_obrona_baszta_proc).
 *   F. Obrona miasta: Mury=+200%, Mury+Cytadela=+300%, Mury+Cytadela+Baszta=+400%
 *      (game/city-defense.ts cityWallDefenseBonusPercent, uzywana przez
 *      main.ts structureDefenseBonusFor i battle/battleScene.ts).
 *   G. Lancuch kuzni: kuznia_zelaza.upgradeFrom==='kuznia'; Pancerz skumulowany
 *      Kuznia brazu=15%, Kuznia zelaza=30%, Wielka Kuznia=45%.
 *   H. Szesc lancuchow "w gore" -> wszyscy czlonkowie maja maksPoziom=1.
 *   I. Odlewnia zelaza: Praca=12 pkt/ture.
 *
 * Run from gra/:  node tools/koszty-surowcowe-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.koszty-surowcowe-entry.ts');
const BUNDLE = path.resolve(__dirname, '.koszty-surowcowe-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { cityWallDefenseBonusPercent } from '../src/game/city-defense';
export {
  ARMOR_BUILDING_IDS, cityArmorBonusPercent, cumulativeMnoznikForBuildingId,
} from '../src/game/unit-building-bonuses';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const miastoParams = JSON.parse(fs.readFileSync(path.join(GRA, 'data/miasto-params.json'), 'utf8'));
const byId = new Map(buildings.map(b => [b.id, b]));

let pass = 0, fail = 0;
function ok(c, m) {
  if (c) { pass++; }
  else { fail++; console.error('  FAIL:', m); }
}

// ===========================================================================
// A. Epoka Kamienia (epokaWejscia=1) -- wylacznie drewno, poza dwoma wyjatkami.
// ===========================================================================
{
  const KAMIEN_WYJATKI = new Set(['stela', 'kamienne_kregi']);
  const epoch1 = buildings.filter(b => b.epokaWejscia === 1);
  ok(epoch1.length > 0, 'sanity: sa budynki epoki Kamienia');
  for (const b of epoch1) {
    const keys = Object.keys(b.koszt_surowce || {});
    if (KAMIEN_WYJATKI.has(b.id)) {
      ok(keys.length === 1 && keys[0] === 'kamien',
        `${b.id} (wyjatek zatwierdzony): koszt_surowce = wylacznie kamien (ma: ${JSON.stringify(b.koszt_surowce)})`);
    } else {
      ok(keys.length === 1 && keys[0] === 'drewno',
        `${b.id} (epoka Kamienia): koszt_surowce = wylacznie drewno (ma: ${JSON.stringify(b.koszt_surowce)})`);
    }
  }
  ok(byId.get('stela').koszt_surowce.kamien === 6, 'Stela/Pomnik: kamien 6 (wyjatek)');
  ok(byId.get('kamienne_kregi').koszt_surowce.kamien === 8, 'Kamienne kregi: kamien 8 (wyjatek)');
}

// ===========================================================================
// B. Epoka Brazu (epokaWejscia=2) -- drewno + kamien, oba surowce, zaden inny.
// Wyjatek: palisada drewniana -- tylko drewno (wczesna obrona przed Mury).
// ===========================================================================
{
  const EPOCH2_DRENO_ONLY = new Set(['palisada']);
  const epoch2 = buildings.filter(b => b.epokaWejscia === 2);
  ok(epoch2.length > 0, 'sanity: sa budynki epoki Brazu');
  for (const b of epoch2) {
    const keys = new Set(Object.keys(b.koszt_surowce || {}));
    if (EPOCH2_DRENO_ONLY.has(b.id)) {
      ok(keys.size === 1 && keys.has('drewno'),
        `${b.id} (epoka Brazu, palisada): koszt_surowce = samo drewno (ma: ${JSON.stringify(b.koszt_surowce)})`);
    } else {
      ok(keys.size === 2 && keys.has('drewno') && keys.has('kamien'),
        `${b.id} (epoka Brazu): koszt_surowce = drewno + kamien (ma: ${JSON.stringify(b.koszt_surowce)})`);
    }
  }
}

// ===========================================================================
// C. Epoka Zelaza (epokaWejscia=3) -- drewno + cegla; obrona i port -> drewno + kamien.
// ===========================================================================
{
  const OBRONA_I_PORT = new Set(['fort', 'baszta', 'warsztat_oblezniczy', 'port_wielki']);
  const epoch3 = buildings.filter(b => b.epokaWejscia === 3);
  ok(epoch3.length > 0, 'sanity: sa budynki epoki Zelaza');
  for (const b of epoch3) {
    const keys = new Set(Object.keys(b.koszt_surowce || {}));
    if (OBRONA_I_PORT.has(b.id)) {
      ok(keys.size === 2 && keys.has('drewno') && keys.has('kamien'),
        `${b.id} (obrona/port, epoka Zelaza): koszt_surowce = drewno + kamien (ma: ${JSON.stringify(b.koszt_surowce)})`);
    } else {
      ok(keys.size === 2 && keys.has('drewno') && keys.has('cegla'),
        `${b.id} (epoka Zelaza): koszt_surowce = drewno + cegla (ma: ${JSON.stringify(b.koszt_surowce)})`);
    }
  }
}

// ===========================================================================
// D. Brąz i żelazo jako surowiec budowlany -- ZAKAZANE we wszystkich budynkach.
// ===========================================================================
{
  const violators = buildings.filter(b => {
    const ks = b.koszt_surowce || {};
    return 'braz' in ks || 'zelazo' in ks;
  });
  ok(violators.length === 0,
    `zaden budynek nie wymaga brazu/zelaza jako surowca budowlanego (naruszaja: ${violators.map(b => b.id).join(', ')})`);
}

// ===========================================================================
// E. Baszta -- nowy budynek: Wojsko i obrona, brak upgradeFrom, +100% Obrony.
// ===========================================================================
{
  const baszta = byId.get('baszta');
  ok(!!baszta, 'Baszta istnieje w buildings.json');
  ok(baszta.grupa === 'Wojsko i obrona', `Baszta: grupa = "Wojsko i obrona" (ma: ${baszta.grupa})`);
  ok(baszta.upgradeFrom === undefined, 'Baszta: brak upgradeFrom (nie zastepuje Murow/Cytadeli, "w bok")');
  ok(baszta.epokaWejscia === 3, 'Baszta: epoka Zelaza (epokaWejscia=3)');
  ok(baszta.lokalizacja === undefined, 'Baszta: brak pola lokalizacja (budowalna w stolicy i regionach)');
  const keys = new Set(Object.keys(baszta.koszt_surowce || {}));
  ok(keys.size === 2 && keys.has('drewno') && keys.has('kamien'),
    `Baszta: koszt_surowce drewno+kamien (budowla obronna epoki Zelaza), ma: ${JSON.stringify(baszta.koszt_surowce)}`);
  ok(miastoParams.bonus_obrona_baszta_proc?.wartosc === 100,
    `miasto-params.json bonus_obrona_baszta_proc = 100 (ma: ${miastoParams.bonus_obrona_baszta_proc?.wartosc})`);
}

// ===========================================================================
// F. Obrona miasta -- Mury=200%, Mury+Cytadela=300%, Mury+Cytadela+Baszta=400%.
// ===========================================================================
{
  const params = {
    mur: miastoParams.bonus_obrona_mur_proc.wartosc,
    cytadela: miastoParams.bonus_obrona_cytadela_proc.wartosc,
    baszta: miastoParams.bonus_obrona_baszta_proc.wartosc,
    palisada: miastoParams.bonus_obrona_palisada_proc.wartosc,
  };
  ok(M.cityWallDefenseBonusPercent(['mury'], params) === 200, 'Mury (samo): +200% Obrony');
  ok(M.cityWallDefenseBonusPercent(['mury', 'fort'], params) === 300, 'Mury+Cytadela: +300% Obrony');
  ok(M.cityWallDefenseBonusPercent(['mury', 'fort', 'baszta'], params) === 400,
    'Mury+Cytadela+Baszta: +400% Obrony (komplet trzech budowli obronnych)');
  ok(M.cityWallDefenseBonusPercent([], params) === 0, 'Miasto bez budowli obronnych: 0% Obrony');
  ok(M.cityWallDefenseBonusPercent(['palisada'], params) === 100,
    'Palisada drewniana (sama): +100% Obrony');
  ok(M.cityWallDefenseBonusPercent(['palisada', 'mury'], params) === 200,
    'Palisada+Mury w zapisie: tylko bonus Murów (+200%), bez stacku z palisadą');
  ok(M.cityWallDefenseBonusPercent(['baszta'], params) === 100,
    'Sama Baszta (bez Murow/Cytadeli): tylko wlasny +100% (nie odblokowuje bazy muru)');
}

// ===========================================================================
// G. Lancuch kuzni -- upgradeFrom naprawiony + Pancerz skumulowany 15/30/45%.
// ===========================================================================
{
  ok(byId.get('kuznia').nazwa === 'Kuźnia brązu', 'Nazwa wyswietlana: "Kuznia" -> "Kuźnia brązu"');
  ok(byId.get('kuznia').id === 'kuznia', 'Identyfikator "kuznia" BEZ ZMIAN (wsteczna zgodnosc zapisow)');
  ok(byId.get('kuznia_zelaza').upgradeFrom === 'kuznia',
    `kuznia_zelaza: upgradeFrom === 'kuznia' (ma: ${byId.get('kuznia_zelaza').upgradeFrom})`);

  ok(M.cityArmorBonusPercent(['kuznia'], buildings) === 15, 'Kuźnia brązu (sama): Pancerz +15%');
  // Po prawdziwym awansie w silniku 'kuznia' znika z cityBuilt (podmieniona przez
  // applyCompletedBuildingIds) -- miasto ma tylko 'kuznia_zelaza'.
  ok(M.cityArmorBonusPercent(['kuznia_zelaza'], buildings) === 30,
    'Kuźnia żelaza (po awansie, bez Kuzni brazu na liscie): Pancerz +30% (suma lancucha)');
  ok(M.cityArmorBonusPercent(['wielka_kuznia'], buildings) === 45,
    'Wielka Kuźnia (po awansie, bez poprzednikow na liscie): Pancerz +45% (suma pelnego lancucha)');

  ok(M.cumulativeMnoznikForBuildingId('kuznia_zelaza', buildings) === 30,
    'UI: karta Kuznia zelaza pokazuje skumulowane +30% (wlasny+Kuznia brazu)');
  ok(M.cumulativeMnoznikForBuildingId('wielka_kuznia', buildings) === 45,
    'UI: karta Wielka Kuznia pokazuje skumulowane +45% (caly lancuch)');
}

// ===========================================================================
// H. Szesc lancuchow "w gore" -- wszyscy czlonkowie maja maksPoziom=1.
// ===========================================================================
{
  const chains = {
    'Pałac I/II/III': ['palac', 'palac_ii', 'palac_iii'],
    'Dom Starszyzny -> Dwór Zarządcy -> Pretorium': ['dom_starszyzny', 'dwor_zarzadcy', 'pretorium'],
    'Kuźnia brązu -> Kuźnia żelaza -> Wielka Kuźnia': ['kuznia', 'kuznia_zelaza', 'wielka_kuznia'],
    'Spichlerz -> Spichlerz II': ['spichlerz', 'spichlerz_ii'],
    'Port handlowy -> Port wielki': ['port', 'port_wielki'],
    'Odlewnia brązu -> Odlewnia żelaza -> Wielka odlewnia': ['odlewnia_brazu', 'odlewnia_zelaza', 'wielka_odlewnia'],
  };
  let totalMembers = 0;
  for (const [label, ids] of Object.entries(chains)) {
    for (const id of ids) {
      totalMembers++;
      const b = byId.get(id);
      ok(!!b, `${label}: budynek "${id}" istnieje`);
      ok(b && b.maksPoziom === 1, `${label}: "${id}" ma maksPoziom=1 (ma: ${b && b.maksPoziom})`);
    }
  }
  ok(totalMembers === 16, `sanity: 16 budynkow w szesciu lancuchach "w gore" (ma: ${totalMembers})`);

  // Budynki SPOZA tych szesciu lancuchow nie sa ruszone -- rosna dalej z epoka
  // (przykladowa proba: budynki z wlasnym lancuchem "w bok" lub bez lancucha wcale).
  const untouched = ['stolarnia', 'garncarnia', 'kamieniarski', 'biblioteka', 'akademia', 'koszary', 'akademia_wojskowa', 'mury', 'fort', 'baszta', 'trybunal', 'sad', 'mennica', 'magazyn', 'akwedukt', 'studnia'];
  for (const id of untouched) {
    const b = byId.get(id);
    ok(!!b, `sanity: "${id}" istnieje`);
  }
  ok(byId.get('stolarnia').maksPoziom === 3, 'Stolarnia (poza szescioma lancuchami): maksPoziom NIETKNIETY (=3, rosnie z epoka)');
  ok(byId.get('koszary').maksPoziom === 2, 'Koszary (poza szescioma lancuchami): maksPoziom NIETKNIETY (=2, rosnie z epoka)');
  ok(byId.get('trybunal').maksPoziom === 2, 'Trybunał (poza szescioma lancuchami): maksPoziom NIETKNIETY (=2, rosnie z epoka)');
}

// ===========================================================================
// I. Odlewnia zelaza -- Praca 8 -> 12 pkt/ture (decyzja 42A).
// ===========================================================================
{
  const odlewniaZelaza = byId.get('odlewnia_zelaza');
  ok(odlewniaZelaza.baza.praca === 12, `Odlewnia żelaza: Praca = 12 pkt/turę (ma: ${odlewniaZelaza.baza.praca})`);
  const odlewniaBrązu = byId.get('odlewnia_brazu');
  ok(odlewniaBrązu.baza.praca === 5, 'sanity: Odlewnia brązu (poprzednik) Praca niezmieniona (=5)');
  ok(odlewniaZelaza.baza.praca > odlewniaBrązu.baza.praca,
    'Awans Odlewnia brązu -> Odlewnia żelaza faktycznie zwieksza Prace (nie 8->8 jak przed naprawa)');
}

console.log(`\nkoszty-surowcowe-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (e) {}
try { fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(fail > 0 ? 1 : 0);
