#!/usr/bin/env node
/**
 * mutate-k05b-units.mjs — mutacje portu K05B partii 1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1).
 *
 * Każda mutacja zmienia DOKŁADNIE jedno wystąpienie wzorca w jednym pliku portu (w pamięci, przez plugin esbuild
 * w run-k05b-units.mjs; pliki na dysku się nie zmieniają). Mutant ZABITY, gdy harness zwraca EXIT 1 (>=1 różnica).
 * Mutant PRZEŻYTY, gdy harness zwraca EXIT 0. EXIT 2 (błąd harnessu / wzorzec nie jednoznaczny) liczy się jako błąd.
 *
 * Mutacje obejmują: ciała jednostek (podział, złoto, bilans, garnizon, okolica), pola DTO/wejść hosta
 * (readPodzialHandlu, adjustHandelSplit, isMeCity, freshWealthState, cfg, rerender) oraz adaptery sygnatur
 * (formatResourceUpkeepSummary, daninaLabelForCity, appendIndywidualneToggle) i stałe K05B-Z2.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k05b-units.mjs --pin-dir <PIN_DIR> [--range a:b]
 * EXIT 0 <=> wszystkie mutanty z zakresu zabite; 1 <=> >=1 przeżył; 2 <=> błąd.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k05b-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const RANGE = argOf('--range');
const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const CITY = join(V2_ROOT, 'src/ui/cityPanel');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k05b-units.mjs');

/** [id, plik, z, na] — `z` musi wystąpić w pliku dokładnie raz. */
const MUTANTS = [
  // --- k05b-podzial.ts: renderEkonomiaStrip / appendPodzialHandlu / appendCitySkarbiecBalance / renderPodzialHandlu / buildTopBarZlotoDetailCard
  ['eko-brak-danych', 'k05b-podzial.ts', "'Brak danych gry'", "'Brak danych'"],
  ['podzial-klasa-grid', 'k05b-podzial.ts', "el('div', 'handel-chip-grid');", "el('div', 'handel-chip-gridX');"],
  ['podzial-disabled', 'k05b-podzial.ts', 'inp.disabled = !editable;', 'inp.disabled = editable;'],
  ['podzial-suma-bez-luksus', 'k05b-podzial.ts', 'const sum = split.procentPieniadz + split.procentNauka + split.procentLuksus;', 'const sum = split.procentPieniadz + split.procentNauka;'],
  ['podzial-suma-99', 'k05b-podzial.ts', 'if (sum !== 100) {', 'if (sum !== 99) {'],
  ['podzial-zapis-bez-updated', 'k05b-podzial.ts', 'cfg.onPodzialHandluChange?.(city.id, { ...updated });', 'cfg.onPodzialHandluChange?.(city.id, { ...split });'],
  ['podzial-brak-rerender', 'k05b-podzial.ts', 'rerender();', 'void 0;'],
  ['skarb-kolejnosc-zrodel', 'k05b-podzial.ts', 'Math.round(empire.zloto ?? cfg.getTreasury?.(city.ownerId) ?? 0)', 'Math.round(cfg.getTreasury?.(city.ownerId) ?? empire.zloto ?? 0)'],
  ['skarb-pieniadz-z-nauki', 'k05b-podzial.ts', 'const cityMoney = Math.round(view.pieniadz);', 'const cityMoney = Math.round(view.nauka);'],
  ['skarb-znak-doSkarbca', 'k05b-podzial.ts', "snap.doSkarbca > 0 ? 'green'", "snap.doSkarbca > 0 ? 'red'"],
  ['skarb-upkeep-pusty', 'k05b-podzial.ts', 'formatResourceUpkeepSummary(snap.utrzymanieSurowcowBudynkow ?? {})', 'formatResourceUpkeepSummary({})'],
  ['skarb-nauka-zle-pole', 'k05b-podzial.ts', "signed(moneySnap.nauka));", "signed(moneySnap.doSkarbca));"],
  ['zloto-upkeep-gorny-pusty', 'k05b-podzial.ts', 'formatResourceUpkeepSummary(utrzRes)', 'formatResourceUpkeepSummary({})'],
  ['zloto-netto-warunek', 'k05b-podzial.ts', 'if (est.netto) {', 'if (!est.netto) {'],
  ['zloto-wealth-fallback', 'k05b-podzial.ts', 'const ws = city.wealthState ?? freshWealthState();', 'const ws = freshWealthState();'],
  // --- k05b-widgety.ts: renderSplitPane / appendGarrisonUnitChip / improvementRangeRow
  ['split-kolejnosc', 'k05b-widgety.ts', '  split.appendChild(rowTop);\n  split.appendChild(rowBot);', '  split.appendChild(rowBot);\n  split.appendChild(rowTop);'],
  ['garn-prog-niski', 'k05b-widgety.ts', 'const low = pct < 40;', 'const low = pct < 50;'],
  ['garn-ukryta-zla', 'k05b-widgety.ts', 'const isHidden = u.inGarnizon === true;', 'const isHidden = u.inGarnizon !== undefined;'],
  ['garn-disabled-odwrotnie', 'k05b-widgety.ts', 'leaveBtn.disabled = !isHidden;', 'leaveBtn.disabled = isHidden;'],
  ['garn-leave-id-zle', 'k05b-widgety.ts', 'cfg.onLeaveGarrison?.(u.id);', 'cfg.onLeaveGarrison?.(u.nazwa);'],
  ['impr-etykieta', 'k05b-widgety.ts', 'szczegóły →`', 'szczegóły`'],
  ['impr-tryb-karty', 'k05b-widgety.ts', "openEntityCard('improvement', key, { mode: 'dialog' })", "openEntityCard('improvement', key, { mode: 'page' })"],
  ['impr-entity-id', 'k05b-widgety.ts', "vBtn.setAttribute('data-entity-id', key);", "vBtn.setAttribute('data-entity-id', nazwa);"],
  // --- k05b-host.ts: wiring hosta, adaptery, stałe
  ['host-krok-suwaka', 'k05b-host.ts', 'export const HANDEL_PCT_STEP = 10;\n', 'export const HANDEL_PCT_STEP = 5;\n'],
  ['host-max-nauki', 'k05b-host.ts', 'export const MAX_PROCENT_NAUKA = 60;\n', 'export const MAX_PROCENT_NAUKA = 50;\n'],
  ['host-readPodzial-proc', 'k05b-host.ts', 'return h().readPodzialHandlu(city, data);', 'return { ...h().readPodzialHandlu(city, data), procentNauka: 0 };'],
  ['host-adjust-brak', 'k05b-host.ts', 'return h().adjustHandelSplit(split, key, value);', 'return split;'],
  ['host-isMe-odwrotnie', 'k05b-host.ts', 'return h().isMeCity(ownerId);', 'return !h().isMeCity(ownerId);'],
  ['host-fresh-wealth', 'k05b-host.ts', 'return h().freshWealthState();', 'return { poziom: 0 };'],
  ['host-rerender-brak', 'k05b-host.ts', '  h().rerender();', '  void 0;'],
  ['host-cfg-bez-split', 'k05b-host.ts', 'get: (_t, k) => h().cfg[k as keyof K05bCfg],', "get: (_t, k) => (k === 'onPodzialHandluChange' ? undefined : h().cfg[k as keyof K05bCfg]),"],
  ['host-danina-spacja', 'k05b-host.ts', 'return daninaLabelForCityK01B({});', "return daninaLabelForCityK01B({}) + ' ';"],
  ['host-upkeep-minus', 'k05b-host.ts', 'return formatResourceUpkeepSummaryK04(resources, labels);', "return formatResourceUpkeepSummaryK04(resources, labels).replace('−', '-');"],
  ['host-upkeep-etykieta', 'k05b-host.ts', "typeof k === 'string' ? h().stockResourceLabel(k) : undefined", "typeof k === 'string' ? k : undefined"],
  ['host-toggle-rerender', 'k05b-host.ts', 'appendIndywidualneToggleK02(mount, overrideOn, onToggle, rowCls, rerender);', 'appendIndywidualneToggleK02(mount, overrideOn, onToggle, rowCls, () => {});'],
  // --- k05b-karty.ts: partia 2 (karty budynków) — ciała i adaptery
  ['karty-daje-etykieta', 'k05b-karty.ts', "el('div', 'bld-infocard-eyebrow', 'Daje'));", "el('div', 'bld-infocard-eyebrow', 'Daje!'));"],
  ['karty-epoka-tekst', 'k05b-karty.ts', 'Epoka ${epochLabelNum(def.epokaWejscia).toLowerCase()}', 'Epoka ${epochLabelNum(def.epokaWejscia)}'],
  ['karty-bez-upgrade', 'k05b-karty.ts', "'bez upgrade'", "'brak upgrade'"],
  ['karty-lancuch-etykieta', 'k05b-karty.ts', "'Łańcuch wymagań'", "'Łańcuch'"],
  ['karty-startowa-tekst', 'k05b-karty.ts', "'Brak wymogu (startowa)'", "'Brak wymogu'"],
  ['karty-lancuch-prog', 'k05b-karty.ts', 'if (chain.length > 1) {', 'if (chain.length > 2) {'],
  ['karty-pelna-karta-tryb', 'k05b-karty.ts', "openEntityCard('technology', techSlug, { mode: 'dialog' })", "openEntityCard('technology', techSlug, { mode: 'page' })"],
  ['karty-pelna-karta-id', 'k05b-karty.ts', "vBtn.setAttribute('data-entity-id', techSlug);", "vBtn.setAttribute('data-entity-id', techName);"],
  ['karty-styl-bez-strazy', 'k05b-karty.ts', 'if (document.getElementById(ENTITY_CARD_BUILDING_STYLE_ID)) return;', 'if (false) return;'],
  ['karty-owner-legacy', 'k05b-karty.ts', 'const ownerId = 0;', 'const ownerId = 1;'],
  ['karty-upkeep-poziom', 'k05b-karty.ts', 'formatBuildingUpkeepGridValue(buildingUpkeepDisplay(def, 1))', 'formatBuildingUpkeepGridValue(buildingUpkeepDisplay(def, 2))'],
  ['karty-infocard-eta', 'k05b-karty.ts', "cost.innerHTML = `${opts.item.koszt}${workIc}${e !== null ? ' · ~' + e", "cost.innerHTML = `${opts.item.koszt}${workIc}${e !== null ? ' · ~' + (e + 1)"],
  ['karty-kolejka-etykieta', 'k05b-karty.ts', 'Koszt kolejki: ', 'Koszt kolejki :'],
  ['karty-buildtab-zablokowana', 'k05b-karty.ts', 'if (opts?.item && city && !opts.locked) {', 'if (opts?.item && city) {'],
  ['karty-dostep-ikona', 'k05b-karty.ts', "acc.textContent = '⛰️ ' + accessReq;", 'acc.textContent = accessReq;'],
  ['karty-ctx-brak-fallbacku', 'k05b-karty.ts', 'const ctx = opts?.ctx ?? (opts?.city ? productionCtxForCity(opts.city) : undefined);', 'const ctx = opts?.ctx ?? undefined;'],
  ['karty-techs-fallback', 'k05b-karty.ts', "cfg.getUnlockedTechs?.(opts.city.ownerId) ?? []", "cfg.getUnlockedTechs?.(opts.city.ownerId) ?? ['Rolnictwo']"],
  ['karty-adapter-ctx', 'k05b-karty.ts', 'return buildingAdapterDto(def as unknown as BuildingDefDto, ctx as unknown as Parameters<typeof buildingAdapterDto>[1]);', 'return buildingAdapterDto(def as unknown as BuildingDefDto, { city: undefined } as unknown as Parameters<typeof buildingAdapterDto>[1]);'],
  ['karty-adapter-miniatura', 'k05b-karty.ts', 'return makeBuildingThumbK02(buildingIconHtml(def));', 'return makeBuildingThumbK02(buildingIconHtml(undefined));'],
  ['karty-adapter-sekcje', 'k05b-karty.ts', 'return appendBuildingRequirementChipSectionsK02(parent, chips, buildingRequirementChipsHtml);', 'return appendBuildingRequirementChipSectionsK02(parent, chips, (g) => buildingRequirementChipsHtml(g.slice(0, 1)));'],
  ['karty-host-etaTurns', 'k05b-host.ts', 'return h().rules.etaTurns(koszt, postep, praca);', 'return h().rules.etaTurns(koszt, postep, praca + 1);'],
  ['host-cityprereq-klucz', 'k05b-host.ts', 'h().rules.cityBuildingPrereqOf(k) : undefined) },', "h().rules.cityBuildingPrereqOf('x' + k) : undefined) },"],
  ['host-woda-zbior', 'k05b-host.ts', 'has: (id: string) => h().rules.isWaterAccessBuilding(id),', "has: (id: string) => h().rules.isWaterAccessBuilding(id) || id === 'wall',"],
  ['host-formatManpower', 'k05b-host.ts', 'return h().rules.formatManpower(n);', "return h().rules.formatManpower(n) + ' ';"],
  ['host-getProd-pusty', 'k05b-host.ts', 'return h().rules.getProd(cityId);', 'return { kolejka: [] };'],
  ['host-stockCost-pusty', 'k05b-host.ts', 'return h().rules.buildingStockCost(def);', 'return {};'],
  ['host-przyciski-etykieta', 'k05b-host.ts', 'h().rules.appendBuildActionButtons(btnWrap, city, item, skarb, buildLabel, upgrade, opts);', "h().rules.appendBuildActionButtons(btnWrap, city, item, skarb, 'Buduj', upgrade, opts);"],
  // --- k05b-jednostki.ts: partia 3 (karty jednostek, rekrutacja, bonusy ulepszeń)
  ['jedn-rekrut-epoka', 'k05b-jednostki.ts', 'const epoch = cfg.getEpoch?.(city.ownerId) ?? 1;', 'const epoch = cfg.getEpoch?.(city.ownerId) ?? 2;'],
  ['jedn-rekrut-mnoznik', 'k05b-jednostki.ts', 'const maxMult = civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));', 'const maxMult = civManpowerMaxMult(undefined);'],
  ['jedn-rekrut-kolejka', 'k05b-jednostki.ts', 'const rq = getProd(city.id).rekrutacja?.length ?? 0;', 'const rq = getProd(city.id).rekrutacja?.length ?? 1;'],
  ['jedn-rekrut-skarb-etykieta', 'k05b-jednostki.ts', "'Skarb imperium'", "'Skarb'"],
  ['jedn-rekrut-pula-kolejnosc', 'k05b-jednostki.ts', "`${formatManpower(mpSnap.manpowerBiezacy)} / ${formatManpower(mpSnap.manpowerMax)}`", "`${formatManpower(mpSnap.manpowerMax)} / ${formatManpower(mpSnap.manpowerBiezacy)}`"],
  ['jedn-ruch-jednostka', 'k05b-jednostki.ts', "fight('Ruch (mapa)', u.Ruch, n => `${n} hex`);", "fight('Ruch (mapa)', u.Ruch, n => `${n} pol`);"],
  ['jedn-dezercja-procent', 'k05b-jednostki.ts', 'Math.round(n * 100)}% HP', 'Math.round(n * 10)}% HP'],
  ['jedn-utrzymanie-zasob', 'k05b-jednostki.ts', "formatResourceUpkeepSummary(resUpkeep) + '/t'", "formatResourceUpkeepSummary(resUpkeep) + '/h'"],
  ['jedn-tech-zle-pole', 'k05b-jednostki.ts', 'appendTechDetailBlock(card, data, u.Tech);', 'appendTechDetailBlock(card, data, u.Epoka);'],
  ['jedn-upg-lancuch-prog', 'k05b-jednostki.ts', 'if (chain.length > 1) {', 'if (chain.length > 2) {'],
  ['jedn-upg-skala-etykieta', 'k05b-jednostki.ts', 'gridDetailRow(g1, `${y.label} — skala`, scale);', 'gridDetailRow(g1, `${y.label} — skala poziomów`, scale);'],
  ['jedn-upg-pusty-tekst', 'k05b-jednostki.ts', "note.textContent = 'Brak statów bazowych w definicji.';", "note.textContent = 'Brak danych.';"],
  ['jedn-upg-pancerz-etykieta', 'k05b-jednostki.ts', "'Pancerz (jednostki)'", "'Pancerz'"],
  ['jedn-upg-miasto-poziom', 'k05b-jednostki.ts', 'const displayLevel = buildingUiDisplayLevel(def, city);', 'const displayLevel = buildingUiDisplayLevel(def, undefined);'],
  ['jedn-legacy-nazwa-linii', 'k05b-jednostki.ts', "if (role) gridDetailRow(gChar, 'Linia', role);", "if (role) gridDetailRow(gChar, 'Rola', role);"],
  ['jedn-legacy-walka-prog', 'k05b-jednostki.ts', "fight('Obrona', u.Obrona);", "fight('Obrona', u.Obrona, n => `${n}!`);"],
  ['jedn-legacy-zywnosc', 'k05b-jednostki.ts', "gridDetailRow(gEco, 'Żywność', u['żywność/turę'] != null ? `${u['żywność/turę']}` : null);", "gridDetailRow(gEco, 'Żywność', u['żywność/turę'] != null ? `+${u['żywność/turę']}` : null);"],
  // --- k05b-chipy.ts: teksty i klasy chipów wymagań (ZADANIE 2) + wsparcie
  ['chip-w-miescie-tekst', 'k05b-chipy.ts', 'W mieście: ${names[0]}', 'Miasto: ${names[0]}'],
  ['chip-stolica-tekst', 'k05b-chipy.ts', "'Tylko stolica' : 'Tylko poza stolicą'", "'Stolica' : 'Tylko poza stolicą'"],
  ['chip-woda-tekst', 'k05b-chipy.ts', "label: 'Wybrzeże lub rzeka przy mieście',", "label: 'Wybrzeże',"],
  ['chip-masz-tekst', 'k05b-chipy.ts', 'w magazynie (masz ${have})`,', 'w magazynie (ma ${have})`,'],
  ['chip-rozbudowa-met', 'k05b-chipy.ts', "|| isBuildingSupersededByUpgrade(parentId, built, buildings);", '|| false;'],
  ['chip-stock-met', 'k05b-chipy.ts', 'met: have >= need,\n      kind: \'stock\',', "met: have > need,\n      kind: 'stock',"],
  ['chip-stock-klasa', 'k05b-chipy.ts', "      met: have >= need,\n      kind: 'stock',", "      met: have >= need,\n      kind: 'other',"],
  ['chip-tech-separator', 'k05b-chipy.ts', "steps.join(' → ')", "steps.join(' - ')"],
  ['chip-lokalizacja-met', 'k05b-chipy.ts', "if (lokalizacja === 'region') return isCapital === false;", 'if (lokalizacja === \'region\') return isCapital === true;'],
  ['chip-brak-tech-steps', 'k05b-chipy.ts', 'return chain.filter(t => !unlocked.has(t));', 'return chain.filter(t => unlocked.has(t));'],
  ['chip-pula-miasta', 'k05b-chipy.ts', 'const pool = city !== undefined\n    ? ownerSurowcePoolFor(city)\n    : (ctx.empireResourceStock', 'const pool = city === undefined\n    ? ownerSurowcePoolFor(city)\n    : (ctx.empireResourceStock'],
  ['chip-stock-chips-html-met', 'k05b-chipy.ts', 'const met = pool !== undefined && have >= need;', 'const met = pool !== undefined && have > need;'],
  ['chip-stock-chips-html-etykieta', 'k05b-chipy.ts', 'label: pool !== undefined', 'label: pool === undefined'],
];

const selected = RANGE
  ? MUTANTS.slice(Number(RANGE.split(':')[0]), Number(RANGE.split(':')[1]))
  : MUTANTS;

let killed = 0;
let survived = [];
let errors = [];
for (const [id, file, from, to] of selected) {
  const src = readFileSync(join(CITY, file), 'utf8');
  const n = src.split(from).length - 1;
  if (n !== 1) {
    errors.push(`${id}: wzorzec występuje ${n} razy (oczekiwano 1)`);
    console.log(`BLAD ${id}: wzorzec występuje ${n} razy`);
    continue;
  }
  const env = { ...process.env, K05B_MUTANT: JSON.stringify({ file, from, to }) };
  const r = spawnSync(process.execPath, [HARNESS, '--pin-dir', resolve(PIN_DIR)], { env, encoding: 'utf8', timeout: 240000 });
  if (r.status === 1) {
    killed++;
    console.log(`ZABITY  ${id}`);
  } else if (r.status === 0) {
    survived.push(id);
    console.log(`PRZEZYL ${id}`);
  } else {
    errors.push(`${id}: EXIT ${r.status}`);
    console.log(`BLAD    ${id}: EXIT ${r.status} ${(r.stderr || '').split('\n').slice(0, 2).join(' | ').slice(0, 300)}`);
  }
}
console.log(`mutantów ${selected.length}, zabitych ${killed}, przeżytych ${survived.length}, błędów ${errors.length}`);
if (survived.length) console.log(`przeżyte: ${survived.join(', ')}`);
process.exit(survived.length === 0 && errors.length === 0 ? 0 : 1);
