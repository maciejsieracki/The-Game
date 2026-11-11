'use strict';
/**
 * city-administrator-test.cjs — R-WEB-CITY-ADMINISTRATOR-Q1 (decyzja właściciela 2026-11-11).
 * (A) dane JSON (koszt 40, utrzymanie 2/3/4, skala x1/x1,5/x2,25, efekty 10/3/3, budynki administracyjne),
 * (B) czysta logika: zatrudnienie/zwolnienie, brak budynku, brak środków, max 1/miasto, tier z budynków,
 *     ulepszenie łańcucha (Dom->Dwór->Pretorium, Pałac I->II->III) zachowuje administratora,
 *     utrata budynku / zdobycie miasta = koniec służby, finansowanie ze skarbca (brak środków = nie pracuje),
 * (C) korupcja addytywna z Sądem/Trybunałem/Pałacem + istniejący sufit 0.60,
 * (D) ekonomia: Praca +3% x tier, ściągalność podatków +3% x tier (cityYieldPerTurn), nie pracuje = neutralnie,
 * (E) bramka autobudowy gracza (admin) + AI bez bramki, AI zatrudnia wg tych samych reguł,
 * (F) sondy tekstowe: wpięcie w turn-economy / main.ts / cityPanel / zapis, brak gałęzi po ownerId w efektach.
 * Run z gra/:  node tools/city-administrator-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA, 'src');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('  [OK] ' + m); } else { failed++; console.error('  [FAIL] ' + m); } }
function close(a, b, m) { ok(Math.abs(a - b) < 1e-9, m + ' (got ' + a + ', want ' + b + ')'); }

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'city-admin-'));
const entry = path.join(temp, 'entry.ts'), bundle = path.join(temp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export * from ${JSON.stringify(SRC + '/game/city-administrator')};\n` +
  `export * from ${JSON.stringify(SRC + '/game/auto-build-gate')};\n` +
  `export { loadEconParams, corruptionRate, corruptionBuildingReduction, cityYieldPerTurn } from ${JSON.stringify(SRC + '/game/economy')};\n` +
  `export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle,
  loader: { '.ts': 'ts', '.json': 'json' }, absWorkingDir: GRA, logLevel: 'error' });
const M = require(bundle);

console.log('(A) dane JSON');
const P = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'city-administrator-params.json'), 'utf8'));
ok(P.koszt_zatrudnienia_pieniadz === 40, 'zatrudnienie 40 Pieniądza (jednorazowo)');
ok(P.utrzymanie_pieniadz_na_ture_wg_tieru['1'] === 2 && P.utrzymanie_pieniadz_na_ture_wg_tieru['2'] === 3 && P.utrzymanie_pieniadz_na_ture_wg_tieru['3'] === 4, 'utrzymanie 2/3/4 na turę');
ok(P.skala_efektow_wg_tieru['1'] === 1 && P.skala_efektow_wg_tieru['2'] === 1.5 && P.skala_efektow_wg_tieru['3'] === 2.25, 'skala tieru x1 / x1,5 / x2,25');
ok(P.efekty_bazowe.korupcja_redukcja_pct === 10 && P.efekty_bazowe.produkcja_miasta_pct === 3 && P.efekty_bazowe.sciagalnosc_podatkow_miasta_pct === 3, 'efekty: korupcja -10%, produkcja +3%, podatki +3%');
const bt = P.budynki_administracyjne_tier;
ok(bt.palac === 1 && bt.palac_ii === 2 && bt.palac_iii === 3 && bt.dom_starszyzny === 1 && bt.dwor_zarzadcy === 2 && bt.pretorium === 3, 'budynki administracyjne: Pałac I/II/III + Dom/Dwór/Pretorium -> tier 1/2/3');
const bld = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const list = Array.isArray(bld) ? bld : (bld.budynki || Object.values(bld));
const ids = new Set(list.filter(b => b && b.id).map(b => b.id));
ok(Object.keys(bt).every(id => ids.has(id)), 'wszystkie id budynków administracyjnych istnieją w buildings.json');

console.log('(B) logika');
const mkCity = (over) => ({ id: 'c1', ownerId: 0, ...over });
ok(M.administrativeBuildingTier([]) === 0 && M.administrativeBuildingTier(['mlyn']) === 0, 'brak budynku administracyjnego => tier 0');
ok(M.administrativeBuildingTier(['dom_starszyzny']) === 1 && M.administrativeBuildingTier(['dwor_zarzadcy']) === 2 && M.administrativeBuildingTier(['pretorium']) === 3, 'tier regionalny 1/2/3');
ok(M.administrativeBuildingTier(['palac']) === 1 && M.administrativeBuildingTier(['palac_ii']) === 2 && M.administrativeBuildingTier(['palac_iii']) === 3, 'tier stolicy 1/2/3');
ok(M.administratorHireBlockReason(mkCity({}), [], 1000) === 'brak_budynku', 'brak budynku => zablokowane (powód: brak_budynku)');
ok(M.administratorHireBlockReason(mkCity({}), ['dom_starszyzny'], 39) === 'brak_srodkow', 'brak środków (39 < 40) => zablokowane');
ok(M.administratorHireBlockReason(mkCity({}), ['dom_starszyzny'], 40) === null, '40 Pieniądza wystarcza');
{
  const c = mkCity({});
  ok(M.hireAdministrator(c, ['dom_starszyzny'], 40, 7) === true && c.administrator && c.administrator.hiredTurn === 7 && c.administrator.ownerId === 0, 'zatrudnienie ustawia administratora');
  ok(M.hireAdministrator(c, ['dom_starszyzny'], 500, 8) === false, 'MAX 1 na miasto (drugie zatrudnienie odrzucone)');
  ok(M.administratorHireBlockReason(c, ['dom_starszyzny'], 500) === 'ma_administratora', 'powód: ma_administratora');
  ok(M.dismissAdministrator(c) === true && !c.administrator, 'zwolnienie usuwa administratora');
  ok(M.dismissAdministrator(c) === false, 'zwolnienie bez administratora = false');
}
console.log('  -- skala tieru i efekty');
for (const [bid, skala, upkeep] of [['dom_starszyzny', 1, 2], ['dwor_zarzadcy', 1.5, 3], ['pretorium', 2.25, 4], ['palac', 1, 2], ['palac_ii', 1.5, 3], ['palac_iii', 2.25, 4]]) {
  const c = mkCity({ administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } });
  const e = M.administratorEffectsFor(c, [bid]);
  close(e.korupcjaRedukcja, 0.10 * skala, bid + ': korupcja -' + (10 * skala) + '%');
  close(e.produkcjaMult, 1 + 0.03 * skala, bid + ': produkcja x' + (1 + 0.03 * skala));
  close(e.podatkiMult, 1 + 0.03 * skala, bid + ': podatki x' + (1 + 0.03 * skala));
  ok(M.administratorUpkeepForCity(c, [bid]) === upkeep, bid + ': utrzymanie ' + upkeep);
}
{
  const idle = mkCity({ administrator: { ownerId: 0, hiredTurn: 1, pracuje: false } });
  const e = M.administratorEffectsFor(idle, ['pretorium']);
  ok(!e.aktywny && e.korupcjaRedukcja === 0 && e.produkcjaMult === 1 && e.podatkiMult === 1, 'nie pracuje => efekty neutralne');
  ok(M.administratorUpkeepForCity(idle, ['pretorium']) === 0, 'nie pracuje => utrzymanie nie jest pobierane');
  ok(!M.cityHasWorkingAdministrator(idle) && M.cityHasAdministrator(idle), 'przypisany, ale nie pracuje');
  const none = mkCity({});
  ok(!M.administratorEffectsFor(none, ['pretorium']).aktywny, 'brak administratora => efekty neutralne');
  const foreign = mkCity({ ownerId: 3, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } });
  ok(!M.administratorEffectsFor(foreign, ['pretorium']).aktywny && !M.cityHasAdministrator(foreign), 'administrator poprzedniego właściciela nie działa');
}
console.log('  -- finansowanie ze skarbca państwa (refreshAdministratorState)');
{
  const cities = [
    { id: 'a', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } },
    { id: 'b', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } },
    { id: 'c', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } },
  ];
  const built = new Map([['a', ['palac_iii']], ['b', ['dwor_zarzadcy']], ['c', ['dom_starszyzny']]]); // 4 + 3 + 2 = 9
  let ch = M.refreshAdministratorState(cities, built, () => 9);
  ok(ch.length === 0 && cities.every(c => c.administrator.pracuje), 'skarbiec 9 pokrywa 4+3+2 => wszyscy pracują');
  ch = M.refreshAdministratorState(cities, built, () => 7);
  ok(cities[0].administrator.pracuje && cities[1].administrator.pracuje && !cities[2].administrator.pracuje, 'skarbiec 7: 4+3 pokryte, 2 nie => trzeci przestaje pracować');
  ok(ch.length === 1 && ch[0].kind === 'stopped_no_funds' && ch[0].city.id === 'c', 'zmiana: stopped_no_funds');
  ok(cities[2].administrator !== undefined, 'niepracujący ZOSTAJE przypisany');
  ch = M.refreshAdministratorState(cities, built, () => 0);
  ok(cities.every(c => !c.administrator.pracuje), 'skarbiec 0 => nikt nie pracuje');
  ch = M.refreshAdministratorState(cities, built, () => 100);
  ok(cities.every(c => c.administrator.pracuje) && ch.length === 3 && ch.every(x => x.kind === 'resumed'), 'skarbiec pokrywa znów => wracają do pracy (resumed)');
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0) === 9, 'suma utrzymania działających = 9');
  cities[2].administrator.pracuje = false;
  ok(M.totalAdministratorUpkeepForOwner(cities, built, 0) === 7 && M.totalAdministratorUpkeepIfAllWorkForOwner(cities, built, 0) === 9, 'niepracujący nie płaci (7), prognoza "gdyby wszyscy" = 9');
}
console.log('  -- ulepszenie łańcucha zachowuje administratora');
{
  const city = { id: 'u', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } };
  for (const [chain, tiers] of [[['dom_starszyzny', 'dwor_zarzadcy', 'pretorium'], [1, 2, 3]], [['palac', 'palac_ii', 'palac_iii'], [1, 2, 3]]]) {
    chain.forEach((bid, i) => {
      const built = new Map([['u', [bid]]]);
      const ch = M.refreshAdministratorState([city], built, () => 100);
      ok(city.administrator && ch.length === 0 && M.administratorEffectsFor(city, [bid]).tier === tiers[i], bid + ': administrator zachowany, tier ' + tiers[i]);
    });
  }
}
console.log('  -- utrata budynku / miasta = koniec służby');
{
  const city = { id: 'l', ownerId: 0, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } };
  let ch = M.refreshAdministratorState([city], new Map([['l', ['mlyn']]]), () => 100);
  ok(!city.administrator && ch.length === 1 && ch[0].kind === 'ended_no_building', 'zburzenie/utrata budynku administracyjnego => administrator odchodzi');
  const city2 = { id: 'm', ownerId: 5, administrator: { ownerId: 0, hiredTurn: 1, pracuje: true } };
  ch = M.refreshAdministratorState([city2], new Map([['m', ['pretorium']]]), () => 100);
  ok(!city2.administrator && ch.length === 1 && ch[0].kind === 'ended_owner_changed', 'zdobycie miasta (zmiana ownerId) => administrator odchodzi');
}

console.log('(C) korupcja addytywna + sufit');
{
  const red = M.corruptionBuildingReduction;
  close(red(['sad'], 0.10), 0.40, 'Sąd (30%) + administrator I (10%) = 40% (addytywnie)');
  close(red(['trybunal'], 0.10 * 1.5), 0.45, 'Trybunał + administrator II (15%) = 45%');
  close(red(['palac_iii'], 0.10 * 2.25), 0.525, 'Pałac III + administrator III (22,5%) = 52,5%');
  close(red(['sad', 'trybunal'], 0.10), 0.60, 'Sąd + Trybunał + administrator => istniejący sufit 0.60 zachowany');
  close(red(['sad', 'trybunal'], 0), 0.60, 'bez administratora: bez zmian (0.60)');
  close(red([], 0.10), 0.10, 'sam administrator I: 10%');
  close(red(['sad']), 0.30, 'wywołanie bez drugiego argumentu = jak dotąd');
}

console.log('(D) ekonomia: Praca i podatki');
{
  const params = M.loadEconParams(JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'econ-params.json'), 'utf8')), 'normal');
  const tiles = Array.from({ length: 20 }, () => ({ terenBazowy: M.TerenBazowy.Rownina, nakladka: M.Nakladka.Brak, maRzeke: false }));
  const city = {
    id: 'c', ludnosc: 3, zdrowie: 0, czyStolica: false, maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 }, podziałPracy: { procentBudynki: 50 },
  };
  const ctx = (extra) => Object.assign({
    wojskoZuzycieZywnosci: 0, maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maAkademia: false, maMennica: false, walutaOdkryta: false, civHandelMult: 1, civNaukaMult: 1, strataFraction: 0,
    additionalTax: 1000,
  }, extra);
  const base = M.cityYieldPerTurn(city, tiles, [], params, ctx({}));
  for (const [tier, scale] of [[1, 1], [2, 1.5], [3, 2.25]]) {
    const y = M.cityYieldPerTurn(city, tiles, [], params, ctx({ administratorProdukcjaMult: 1 + 0.03 * scale, administratorPodatkiMult: 1 + 0.03 * scale }));
    ok(y.pieniadz === Math.floor(1000 * (1 + 0.03 * scale)) || Math.abs(y.pieniadz - base.pieniadz * (1 + 0.03 * scale)) <= 1.5,
      'tier ' + tier + ': podatki +' + (3 * scale) + '% (bazowo ' + base.pieniadz + ' -> ' + y.pieniadz + ')');
    ok(y.pieniadz > base.pieniadz, 'tier ' + tier + ': przychód z podatków rośnie');
    ok(y.praca > base.praca, 'tier ' + tier + ': Praca rośnie (bazowo ' + base.praca + ' -> ' + y.praca + ')');
  }
  const big = M.cityYieldPerTurn(city, tiles, [], params, ctx({ administratorProdukcjaMult: 1.0675 }));
  ok(big.praca >= base.praca, 'mnożnik produkcji stosowany do Pracy (informacyjnie: ' + base.praca + ' -> ' + big.praca + ')');
  // Praca tylko od mnożnika: syntetycznie — kod stosuje (pracaNetto * mult) przed cityPracaInteger
  const src = fs.readFileSync(path.join(SRC, 'game', 'economy.ts'), 'utf8');
  ok(/cityPracaInteger\(pracaNetto \* \(ctx\.administratorProdukcjaMult \?\? 1\)\)/.test(src), 'economy.ts: Praca × administratorProdukcjaMult przed zaokrągleniem');
  ok(/handelBrutto \*= ctx\.administratorPodatkiMult/.test(src), 'economy.ts: Handel brutto × administratorPodatkiMult przed korupcją');
  const idx = src.indexOf('handelBrutto *= ctx.administratorPodatkiMult');
  ok(idx > 0 && idx < src.indexOf('const handelNettoRaw'), 'ściągalność podatków PRZED korupcją');
  const noAdm = M.cityYieldPerTurn(city, tiles, [], params, ctx({ administratorProdukcjaMult: 1, administratorPodatkiMult: 1 }));
  ok(noAdm.pieniadz === base.pieniadz && noAdm.praca === base.praca, 'mnożniki = 1 (brak/nie pracuje) => zero zmiany (neutralność)');
}

console.log('(E) bramka autobudowy i AI');
{
  ok(M.isCityAutoBuildAllowed(0, [0], true, false) === false, 'gracz, opcja ON, BEZ administratora => autobudowa zablokowana');
  ok(M.isCityAutoBuildAllowed(0, [0], true, true) === true, 'gracz, opcja ON, administrator pracuje => działa');
  ok(M.isCityAutoBuildAllowed(0, [0], false, true) === false, 'gracz, opcja OFF => zablokowana mimo administratora (globalny przełącznik zostaje)');
  ok(M.isCityAutoBuildAllowed(3, [0], false, false) === true, 'AI: bez bramki administratora (buduje jak dotąd)');
  ok(M.isCityAutoBuildAllowed(1, [0, 1], true, false) === false, 'drugi fotel ludzki bez administratora => zablokowana');
  // administrator "nie pracuje" (brak środków) => autobudowa wyłączona
  const idle = mkCity({ administrator: { ownerId: 0, hiredTurn: 1, pracuje: false } });
  ok(M.isCityAutoBuildAllowed(0, [0], true, M.cityHasWorkingAdministrator(idle)) === false, 'administrator nie pracuje (brak środków) => brak autobudowy w tym mieście');
  console.log('  -- AI: parytet reguł');
  const c = mkCity({ ownerId: 3 });
  ok(M.aiShouldHireAdministrator(c, ['dom_starszyzny'], 40, 0) === false, 'AI: 40 to za mało (brak rezerwy utrzymania)');
  ok(M.aiShouldHireAdministrator(c, ['dom_starszyzny'], 40 + 2 * M.administratorAiReserveTurns(), 0) === true, 'AI: zatrudnia gdy stać (koszt + rezerwa utrzymania)');
  ok(M.aiShouldHireAdministrator(c, [], 1000, 0) === false, 'AI: bez budynku administracyjnego nie zatrudnia');
  ok(M.aiShouldHireAdministrator(mkCity({ ownerId: 3, administrator: { ownerId: 3, hiredTurn: 1, pracuje: true } }), ['pretorium'], 1000, 4) === false, 'AI: max 1 na miasto');
}

console.log('(F) sondy tekstowe');
const te = fs.readFileSync(path.join(SRC, 'game', 'turn-economy.ts'), 'utf8');
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const panel = fs.readFileSync(path.join(SRC, 'ui', 'cityPanel.ts'), 'utf8');
ok((te.match(/administratorEffectsFor\(city, builtIds\)/g) || []).length === 2, 'turn-economy.ts: efekty administratora w podglądzie HUD i w realnym ticku (2 miejsca, ten sam kod)');
ok((te.match(/administratorProdukcjaMult: administratorEfekty\.produkcjaMult/g) || []).length === 2 && (te.match(/administratorPodatkiMult: administratorEfekty\.podatkiMult/g) || []).length === 2, 'turn-economy.ts: mnożniki w obu ctx');
ok((te.match(/withAdministratorUpkeep\(/g) || []).length >= 3, 'turn-economy.ts: utrzymanie administratorów wchodzi do bilansu (tick + preview)');
const effBlock = te.slice(te.indexOf('administratorEfekty = administratorEffectsFor'), te.indexOf('administratorEfekty = administratorEffectsFor') + 700);
ok(!/isPlayer|ownerId ===|isHuman|isAi/.test(effBlock), 'efekty bez gałęzi po graczu/AI (parytet)');
ok(/refreshCityAdministrators\(true\);\s*(?:\/\/[^\n]*\n\s*)*const econ = advanceCityEconomy\(|refreshCityAdministrators\(true\);\s*const econ = advanceCityEconomy\(/.test(main.replace(/\n\s*\/\/[^\n]*/g, '')), 'main.ts: stan administratorów odświeżany PRZED ekonomią tury');
ok(/aiHireAdministrators\(oid\)/.test(main) && /isMajorAiOwner\(oid, isCityStateOwner\)\) aiHireAdministrators/.test(main), 'main.ts: AI zatrudnia administratorów (major AI)');
ok(/setOwnerTreasury\(city\.ownerId, treasury - administratorHireCost\(\)\)/.test(main), 'main.ts: koszt zatrudnienia ze skarbca państwa');
ok(/cityAdministratorNoticeShown/.test(main) && /cityAdministratorNoticeShown = saved\.meta\?\.cityAdministratorNoticeShown === true/.test(main), 'main.ts: zapis/odczyt flagi migracji (stary zapis = jednorazowe powiadomienie)');
ok(/cityAdministratorNoticeShown = true; \/\/ R-WEB-CITY-ADMINISTRATOR-Q1: nowa gra/.test(main), 'main.ts: nowa gra bez powiadomienia migracyjnego');
ok(/Autobudowa wymaga administratora/.test(main), 'main.ts: komunikat migracyjny w „Ważne”');
ok(/getCityAdministratorState:/.test(main) && /onHireAdministrator:/.test(main) && /onDismissAdministrator:/.test(main), 'main.ts: UI dostaje hak administratora');
ok(/id="civ-v-administrator"/.test(panel) && /Administrator \+/.test(panel) && /Administrator ✓/.test(panel), 'cityPanel.ts: przycisk „Administrator +/✓”');
ok(panel.indexOf('capitalBadgeOrButtonHtml(city) +\n    administratorHeaderHtml(city)') > 0, 'cityPanel.ts: przycisk OBOK pastylki „Ustaw jako stolicę” w nagłówku');
ok(/window\.confirm\('Zwolnić administratora/.test(panel), 'cityPanel.ts: zwolnienie z potwierdzeniem');
ok(/civ-v-adm-chip/.test(panel) && /data-adm-chip/.test(panel), 'cityPanel.ts: chip „Administrator” pod nazwą miasta');
ok(/AUTO_BUILD_NEEDS_ADMINISTRATOR_HINT/.test(panel), 'cityPanel.ts: autobudowa wyszarzona z powodem (brak administratora)');
const saveSrc = fs.readFileSync(path.join(SRC, 'game', 'save.ts'), 'utf8');
ok(/cities: Array\.isArray\(obj\.cities\) \? \(obj\.cities as City\[\]\)/.test(saveSrc), 'save.ts: miasta (z polem administrator) przechodzą bez zmian — stary zapis bez pola = brak administratora');
ok(fs.existsSync(path.join(SRC, 'ui', 'icons', 'brand', 'chip-administrator.svg')) && /chip-administrator/.test(fs.readFileSync(path.join(SRC, 'ui', 'icons', 'administratorIcon.ts'), 'utf8')), 'ikona administratora: pieczęć „A” (chip-administrator.svg) + komponent');
const icon = fs.readFileSync(path.join(SRC, 'ui', 'icons', 'administratorIcon.ts'), 'utf8');
ok(/'ok' \| 'idle' \| 'off'/.test(icon) && /civ-adm-ic-warn/.test(icon) && /improvements/.test(icon), 'ikona: stany ok/idle(!)/off + wariant ulepszeń (wspólny komponent)');

// Zarzut 2 Evaluatora (runda 2): ciche odświeżenia (podgląd HUD / wydatki w trakcie tury) nie mogą gubić powiadomień.
{
  const i = main.indexOf('function refreshCityAdministrators(notify: boolean)');
  const body = i > 0 ? main.slice(i, i + 1600) : '';
  ok(/pendingAdministratorChanges\.(set|get)\(/.test(body) && /if \(notify\)/.test(body) && /for \(const ch of pendingAdministratorChanges\.values\(\)\) noteAdministratorChange\(ch\)/.test(body),
    'main.ts: zmiany z cichych odświeżeń kumulowane i zgłaszane przy najbliższym notify=true');
  ok(/pendingAdministratorChanges\.delete\(pKey\)/.test(body), 'main.ts: nie pracuje → wrócił (lub odwrotnie) w jednej turze znosi się (brak fałszywego powiadomienia)');
  const refreshLive = main.slice(main.indexOf('function refreshLiveEmpireRatesUnsafe'), main.indexOf('function refreshLiveEmpireRatesUnsafe') + 300);
  ok(/refreshCityAdministrators\(false\)/.test(refreshLive), 'main.ts: podgląd HUD odświeża administratorów po cichu (kolejka powiadomień zachowuje zmianę)');
  ok(/pendingAdministratorChanges\.clear\(\)/.test(main.slice(main.indexOf('cityAdministratorNoticeShown = saved.meta'), main.indexOf('cityAdministratorNoticeShown = saved.meta') + 600)), 'main.ts: wczytanie zapisu czyści kolejkę (stan zapisu = punkt odniesienia)');
}

// Zarzut 4 Evaluatora (runda 2): Bilans plonów w cityPanel.ts uwzględnia mnożniki administratora (ta sama funkcja co silnik).
ok(/administratorEffectsFor\(city, built\)/.test(panel) && /administratorProdukcjaMult: administratorEfekty\.produkcjaMult/.test(panel) && /administratorPodatkiMult: administratorEfekty\.podatkiMult/.test(panel),
  'cityPanel.ts: Bilans plonów dostaje mnożniki administratora (Praca +3%, podatki +3% × tier) jak silnik');

try { fs.rmSync(temp, { recursive: true, force: true }); } catch { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
