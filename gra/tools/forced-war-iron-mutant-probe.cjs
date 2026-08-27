'use strict';

/**
 * forced-war-iron-mutant-probe.cjs — DOWÓD NIETAUTOLOGICZNOŚCI bramek Żelaza
 * (R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1, kryterium końca 6 dispatchu).
 *
 * Pyta: czy KAŻDA nowa asercja z `forced-war-iron-test.cjs` (kontrakt czysty) oraz
 * `forced-war-iron-main-guard-test.cjs` (wiązanie main.ts/ai.ts) potrafi się ZACZERWIENIĆ
 * pod JEDNĄ celowaną mutacją źródła? Asercja, której nie da się zaczerwienić, niczego nie
 * pilnuje.
 *
 * JAK: dla każdej mutacji z listy niżej sonda podmienia dokładnie jeden fragment tekstu
 * w `src/game/forced-war-iron.ts`, `src/game/ai.ts` albo `src/main.ts`, uruchamia wskazane
 * bramki, zbiera etykiety asercji, które spadły na FAIL, i PRZYWRACA plik. Na końcu liczy
 * pokrycie: ile z N asercji zaczerwieniło się przynajmniej raz. Brak pokrycia = twardy FAIL
 * sondy z listą nieprzykrytych asercji.
 *
 * Pliki źródłowe są przywracane z pamięci w `finally`; na koniec sonda dodatkowo weryfikuje
 * bajt w bajt, że wróciły do stanu wyjściowego (gdyby nie — twardy błąd, nie cicha zmiana).
 *
 * Uruchamianie z gra/: node tools/forced-war-iron-mutant-probe.cjs
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const FILES = {
  iron: path.join(GRA, 'src', 'game', 'forced-war-iron.ts'),
  ai: path.join(GRA, 'src', 'game', 'ai.ts'),
  main: path.join(GRA, 'src', 'main.ts'),
};
const ORIGINAL = Object.fromEntries(
  Object.entries(FILES).map(([k, p]) => [k, fs.readFileSync(p, 'utf8')]),
);

const PURE = 'pure';
const GUARD = 'guard';

/** @type {{id:string,file:keyof FILES,gates:string[],find:string,replace:string,why:string}[]} */
const MUTATIONS = [
  // --- forced-war-iron.ts: stałe -------------------------------------------------
  { id: 'M01-epoka-numer', file: 'iron', gates: [PURE], why: 'Żelazo przestaje być epoką 3',
    find: 'export const EPOKA_ZELAZO_NUMER = 3;', replace: 'export const EPOKA_ZELAZO_NUMER = 2;' },
  { id: 'M02-prog-miast', file: 'iron', gates: [PURE], why: 'próg 2 miast → 3',
    find: 'export const WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 2;',
    replace: 'export const WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 3;' },
  { id: 'M03-odpoczynek', file: 'iron', gates: [PURE], why: 'odpoczynek 20 → 10 tur',
    find: 'export const WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR = 20;',
    replace: 'export const WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR = 10;' },
  { id: 'M04-cooldown', file: 'iron', gates: [PURE], why: 'cooldown pary 20 → 10 tur',
    find: 'export const WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 20;',
    replace: 'export const WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 10;' },

  // --- forced-war-iron.ts: wyzwalacz awansu --------------------------------------
  { id: 'M05-entry-sztywne-2-3', file: 'iron', gates: [PURE], why: 'wyzwalacz tylko dla dokładnie 2→3 (gubi skok 1→3)',
    find: '  return prevEra < EPOKA_ZELAZO_NUMER && nextEra >= EPOKA_ZELAZO_NUMER;',
    replace: '  return prevEra === 2 && nextEra === 3;' },
  { id: 'M06-entry-bez-prev', file: 'iron', gates: [PURE], why: 'wyzwalacz ignoruje poprzednią epokę (odpala ponownie w Żelazie)',
    find: '  return prevEra < EPOKA_ZELAZO_NUMER && nextEra >= EPOKA_ZELAZO_NUMER;',
    replace: '  return nextEra >= EPOKA_ZELAZO_NUMER;' },
  { id: 'M07-entry-bez-next', file: 'iron', gates: [PURE], why: 'wyzwalacz ignoruje docelową epokę (odpala przy 1→2)',
    find: '  return prevEra < EPOKA_ZELAZO_NUMER && nextEra >= EPOKA_ZELAZO_NUMER;',
    replace: '  return prevEra < EPOKA_ZELAZO_NUMER;' },
  { id: 'M08-entry-nigdy', file: 'iron', gates: [PURE], why: 'wyzwalacz nie odpala nigdy',
    find: '  return prevEra < EPOKA_ZELAZO_NUMER && nextEra >= EPOKA_ZELAZO_NUMER;',
    replace: '  return false;' },

  // --- forced-war-iron.ts: kwalifikacja napastnika --------------------------------
  { id: 'M09-eligible-zawsze', file: 'iron', gates: [PURE], why: 'kwalifikacja zawsze true (gracz/CS i owner w wojnie przechodzą)',
    find: '  return inp.isMainAiCiv && !inp.isAlreadyAtWarAnyRole;', replace: '  return true;' },
  { id: 'M10-eligible-nigdy', file: 'iron', gates: [PURE], why: 'kwalifikacja zawsze false',
    find: '  return inp.isMainAiCiv && !inp.isAlreadyAtWarAnyRole;', replace: '  return false;' },

  // --- forced-war-iron.ts: wybór celu --------------------------------------------
  { id: 'M11-pick-bez-blokad', file: 'iron', gates: [PURE], why: 'blockedOwnerIds ignorowane przy wyborze celu',
    find: '    opts?.blockedOwnerIds ?? new Set<number>(),', replace: '    new Set<number>(),' },
  { id: 'M12-pick-pierwszy', file: 'iron', gates: [PURE], why: 'cel = pierwszy z listy zamiast najbliższego',
    find: `  return pickForcedWarTargetId(
    candidates,
    referenceHex,
    hexDistanceFn,
    opts?.blockedOwnerIds ?? new Set<number>(),
  );`,
    replace: '  return candidates[0]?.ownerId ?? -1;' },
  { id: 'M13-pick-null', file: 'iron', gates: [PURE], why: 'wybór celu zawsze null',
    find: `  return pickForcedWarTargetId(
    candidates,
    referenceHex,
    hexDistanceFn,
    opts?.blockedOwnerIds ?? new Set<number>(),
  );`,
    replace: '  return null;' },

  // --- forced-war-iron.ts: próg miast --------------------------------------------
  { id: 'M14-prog-1', file: 'iron', gates: [PURE], why: 'próg twardo 1 miasto',
    find: `    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,`,
    replace: `    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    1,` },
  { id: 'M15-prog-gubi-atakujacego', file: 'iron', gates: [PURE], why: 'miasta zdobyte przez napastnika nie liczą się',
    find: `    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,`,
    replace: `    0,
    citiesCapturedByDefender,
    threshold,` },
  { id: 'M16-prog-gubi-obronce', file: 'iron', gates: [PURE], why: 'miasta stracone na rzecz obrońcy nie liczą się',
    find: `    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,`,
    replace: `    citiesCapturedByAttacker,
    0,
    threshold,` },

  // --- forced-war-iron.ts: odpoczynek --------------------------------------------
  { id: 'M17-rest-nigdy', file: 'iron', gates: [PURE], why: 'odpoczynek nigdy nie obowiązuje',
    find: '  return isRestingFromForcedWar(currentTurn, restUntilTurn);', replace: '  return false;' },
  { id: 'M18-rest-o-1-za-dlugi', file: 'iron', gates: [PURE], why: 'odpoczynek trwa o turę za długo (granica <=)',
    find: '  return isRestingFromForcedWar(currentTurn, restUntilTurn);',
    replace: '  return isRestingFromForcedWar(currentTurn, (restUntilTurn ?? 0) + 1);' },
  { id: 'M19-rest-bez-wpisu', file: 'iron', gates: [PURE], why: 'brak wpisu restUntil traktowany jak wieczny odpoczynek',
    find: '  return isRestingFromForcedWar(currentTurn, restUntilTurn);',
    replace: '  return isRestingFromForcedWar(currentTurn, restUntilTurn ?? Infinity);' },

  // --- forced-war-iron.ts: save/load ---------------------------------------------
  { id: 'M20-save-gubi-pending', file: 'iron', gates: [PURE], why: 'serializacja gubi pendingOwners',
    find: `  return serializeForcedWarState(
    pendingOwners,`,
    replace: `  return serializeForcedWarState(
    new Set<number>(),` },
  { id: 'M21-load-gubi-cycle', file: 'iron', gates: [PURE], why: 'odczyt gubi cycleOwners',
    find: '  return restoreForcedWarState(saved);',
    replace: '  return restoreForcedWarState(saved ? { ...saved, cycleOwners: [] } : saved);' },
  { id: 'M22-load-gubi-rest', file: 'iron', gates: [PURE], why: 'odczyt gubi restUntilByOwner',
    find: '  return restoreForcedWarState(saved);',
    replace: '  return restoreForcedWarState(saved ? { ...saved, restUntilByOwner: [] } : saved);' },
  { id: 'M23-load-zeruje-licznik', file: 'iron', gates: [PURE], why: 'odczyt zeruje licznik zdobytych miast',
    find: '  return restoreForcedWarState(saved);',
    replace: `  return restoreForcedWarState(
    saved && saved.activeByPairKey
      ? {
        ...saved,
        activeByPairKey: saved.activeByPairKey.map(
          ([k, v]) => [k, { ...v, capturedByAttacker: 0 }] as [string, typeof v],
        ),
      }
      : saved,
  );` },
  { id: 'M24-load-stary-zapis-smieci', file: 'iron', gates: [PURE], why: 'brak zapisu daje NIEpusty stan zamiast pustego',
    find: '  return restoreForcedWarState(saved);',
    replace: `  return restoreForcedWarState(saved ?? {
    pendingOwners: [1],
    cycleOwners: [],
    restUntilByOwner: [],
    activeByPairKey: [['1_2', { attackerId: 1, targetId: 2, capturedByAttacker: 0, capturedByDefender: 0 }]],
  });` },
  { id: 'M25-load-czesciowy', file: 'iron', gates: [PURE], why: 'częściowy zapis gubi obecne pole',
    find: '  return restoreForcedWarState(saved);',
    replace: '  return restoreForcedWarState(saved ? { ...saved, cycleOwners: saved.cycleOwners ? [] : undefined } : saved);' },

  { id: 'M25b-load-domyslne-pending', file: 'iron', gates: [PURE], why: 'brakujące pole w częściowym zapisie dostaje śmieci zamiast pustego stanu',
    find: '  return restoreForcedWarState(saved);',
    replace: '  return restoreForcedWarState(saved ? { pendingOwners: [1], ...saved } : saved);' },
  { id: 'M25c-load-pending-niemutowalny', file: 'iron', gates: [PURE], why: 'odtworzony pendingOwners nie przyjmuje mutacji (main.ts nie mógłby skonsumować pending)',
    find: '  return restoreForcedWarState(saved);',
    replace: `  const restored = restoreForcedWarState(saved);
  (restored.pendingOwners as unknown as { delete: (v: number) => boolean }).delete = () => false;
  return restored;` },
  { id: 'M25d-load-rest-niemutowalny', file: 'iron', gates: [PURE], why: 'odtworzony restUntilByOwner nie przyjmuje mutacji (nie dałoby się uzbroić odpoczynku)',
    find: '  return restoreForcedWarState(saved);',
    replace: `  const restored = restoreForcedWarState(saved);
  (restored.restUntilByOwner as unknown as { set: (k: number, v: number) => unknown }).set = () => undefined;
  return restored;` },

  // --- ai.ts ---------------------------------------------------------------------
  { id: 'M26-ai-brak-guarda-zelaza', file: 'ai', gates: [PURE, GUARD], why: 'cały wczesny return Żelaza usunięty z decideAIDiplomacy',
    find: `  if (inp.ironForceWarTargetId != null) {
    const forcedId = String(inp.ironForceWarTargetId);`,
    replace: `  if (false) {
    const forcedId = String(inp.ironForceWarTargetId);` },
  { id: 'M27-ai-pole-inputu', file: 'ai', gates: [GUARD], why: 'pole wejścia przemianowane (wiązanie main.ts→ai.ts zerwane)',
    find: '  ironForceWarTargetId?: number;', replace: '  ironForceWarTargetIdX?: number;' },
  { id: 'M28-ai-bez-guarda-wojny', file: 'ai', gates: [PURE], why: 'guard „cel już w wojnie" usunięty',
    find: `      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA`,
    replace: `      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA` },
  { id: 'M29-ai-bez-peacelock', file: 'ai', gates: [PURE], why: 'guard blokady pokoju/cooldownu pary usunięty',
    find: `      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA`,
    replace: `      && !forcedRel.stanWojny
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA` },
  { id: 'M30-ai-bez-nap', file: 'ai', gates: [PURE], why: 'guard NAP usunięty',
    find: `      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA`,
    replace: `      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA` },
  { id: 'M31-ai-bez-sojuszu', file: 'ai', gates: [PURE, GUARD], why: 'guard sojuszu z celem usunięty',
    find: `      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA`,
    replace: `      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA` },
  { id: 'M32-ai-powod-bez-epoki', file: 'ai', gates: [PURE], why: 'powód DOW nie identyfikuje już mechanizmu Żelaza',
    find: 'powod:    `R-EPOKA-ZELAZO-WYMUSZONA-WOJNA: wymuszona wojna z sąsiadem terytorialnym',
    replace: 'powod:    `R-EPOKA-WYMUSZONA-WOJNA: wymuszona wojna z sąsiadem terytorialnym' },
  { id: 'M33-ai-odpala-bez-celu', file: 'ai', gates: [PURE], why: 'mechanizm odpala nawet BEZ wskazanego celu (bierze pierwszą relację)',
    find: `  if (inp.ironForceWarTargetId != null) {
    const forcedId = String(inp.ironForceWarTargetId);`,
    replace: `  if (true) {
    const forcedId = String(inp.ironForceWarTargetId ?? inp.relacje[0]?.partnerId);` },
  { id: 'M34-ai-fallback-relacji', file: 'ai', gates: [PURE], why: 'brak relacji z celem podmieniany na pierwszą relację (cel 0 = gracz przechodzi)',
    find: `    const forcedRel = inp.relacje.find(r => r.partnerId === forcedId);
    if (
      forcedRel
      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA`,
    replace: `    const forcedRel = inp.relacje.find(r => r.partnerId === forcedId) ?? inp.relacje[0];
    if (
      forcedRel
      && !forcedRel.stanWojny
      && !forcedRel.peaceLocked
      && !forcedRel.hasNapTreaty
      && !forcedRel.hasAllianceTreaty
    ) {
      return [{
        type:     'wypowiedz_wojne',
        targetId: forcedId,
        powod:    \`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA` },
  { id: 'M35-ai-regresja-brazu', file: 'ai', gates: [PURE, GUARD], why: 'REGRESJA: guard Brązu wyłączony',
    find: '  if (inp.bronzeForceWarTargetId != null) {', replace: '  if (inp.bronzeForceWarTargetIdZZZ != null) {' },
  { id: 'M36-ai-regresja-kamienia', file: 'ai', gates: [PURE, GUARD], why: 'REGRESJA: guard Kamienia wyłączony',
    find: '  if (inp.stoneForceWarTargetId != null) {', replace: '  if (inp.stoneForceWarTargetIdZZZ != null) {' },

  // --- main.ts -------------------------------------------------------------------
  { id: 'M37-main-import', file: 'main', gates: [GUARD], why: 'import modułu Żelaza zerwany',
    find: "} from './game/forced-war-iron';", replace: "} from './game/forced-war-iron-nieistnieje';" },
  { id: 'M38-main-wyzwalacz-prog-tury', file: 'main', gates: [GUARD], why: 'wyzwalacz awansu podmieniony na próg tury (dokładnie to, czego dispatch zakazuje)',
    find: `      if (
        isIronEraEntry(prev, next)
        && !isOwnerClusterCityState(ownerId, ownerCityStateOpts())
      ) {
        ironForceWarPendingOwners.add(ownerId);
      }`,
    replace: `      if (
        turn >= WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR
        && !isOwnerClusterCityState(ownerId, ownerCityStateOpts())
      ) {
        ironForceWarPendingOwners.add(ownerId);
      }` },
  { id: 'M39-main-napastnik-barbarzynca', file: 'main', gates: [GUARD], why: 'barbarzyńca dopuszczony jako napastnik wymuszonej wojny Żelaza',
    find: `                  && !isBarbarian(ownerId)
                  && !eliminatedOwners.has(ownerId)
                  && !isOwnerClusterCityState(ownerId, ownerCityStateOpts())
                ) {
                  const wasPending = ironForceWarPendingOwners.has(ownerId);`,
    replace: `                  && !eliminatedOwners.has(ownerId)
                  && !isOwnerClusterCityState(ownerId, ownerCityStateOpts())
                ) {
                  const wasPending = ironForceWarPendingOwners.has(ownerId);` },
  { id: 'M40-main-bez-eligible', file: 'main', gates: [GUARD], why: 'kwalifikacja napastnika omija isEligibleForIronForcedWar',
    find: `                    ? isEligibleForIronForcedWar({
                      isMainAiCiv: true,
                      isAlreadyAtWarAnyRole: alreadyAtWarAnyRole,
                    })`,
    replace: '                    ? !alreadyAtWarAnyRole' },
  { id: 'M41-main-cykl-bez-wojny', file: 'main', gates: [GUARD], why: 'cykl po odpoczynku nie sprawdza już trwającej wojny',
    find: `                    && !hasActiveForcedWarAsAttacker
                    && !alreadyAtWarAnyRole
                    && !isRestingFromIronForcedWar(`,
    replace: `                    && !hasActiveForcedWarAsAttacker
                    && !isRestingFromIronForcedWar(` },
  { id: 'M42-main-gracz-w-puli', file: 'main', gates: [GUARD], why: 'GRACZ (ownerId 0) dopuszczony do puli celów',
    find: `                      .filter(oid =>
                        oid !== ownerId
                        && oid > 0
                        && !typCityCopyOwners.has(oid)
                        && !isBarbarian(oid)
                        && !eliminatedOwners.has(oid)
                        && !isOwnerClusterCityState(oid, ownerCityStateOpts()),
                      )
                      .map(oid => {
                        const c = cities.find(cc => cc.ownerId === oid);
                        return c ? { ownerId: oid, q: c.q, r: c.r } : null;
                      })
                      .filter((c): c is { ownerId: number; q: number; r: number } => c !== null);
                    const ironBlockedOwnerIds`,
    replace: `                      .filter(oid =>
                        oid !== ownerId
                        && !typCityCopyOwners.has(oid)
                        && !isBarbarian(oid)
                        && !eliminatedOwners.has(oid)
                        && !isOwnerClusterCityState(oid, ownerCityStateOpts()),
                      )
                      .map(oid => {
                        const c = cities.find(cc => cc.ownerId === oid);
                        return c ? { ownerId: oid, q: c.q, r: c.r } : null;
                      })
                      .filter((c): c is { ownerId: number; q: number; r: number } => c !== null);
                    const ironBlockedOwnerIds` },
  { id: 'M43-main-bez-peacelock-w-puli', file: 'main', gates: [GUARD], why: 'blokada pokoju (cooldown pary) nie wyklucza już celu',
    find: `                          hasTreaty(activeDeals, ownerId, c.ownerId, RodzajTraktatu.PaktNieagresji)
                          || isPeaceLockedBetween(ownerId, c.ownerId)
                          || allianceFormalKindBetween(activeDeals, ownerId, c.ownerId) !== null,
                        )
                        .map(c => c.ownerId),
                    );
                    const ironPicked`,
    replace: `                          hasTreaty(activeDeals, ownerId, c.ownerId, RodzajTraktatu.PaktNieagresji)
                          || allianceFormalKindBetween(activeDeals, ownerId, c.ownerId) !== null,
                        )
                        .map(c => c.ownerId),
                    );
                    const ironPicked` },
  { id: 'M44-main-pick-bez-blokad', file: 'main', gates: [GUARD], why: 'wybór celu bez przekazania blockedOwnerIds',
    find: '                      { blockedOwnerIds: ironBlockedOwnerIds },', replace: '                      undefined,' },
  { id: 'M45-main-bez-przekazania-celu', file: 'main', gates: [GUARD], why: 'cel Żelaza nie trafia do decideAIDiplomacy (mechanizm martwy)',
    find: '                diploInp.ironForceWarTargetId = ironForceWarTargetId;\n', replace: '' },
  { id: 'M46-main-bez-cyklu', file: 'main', gates: [GUARD], why: 'udany DOW nie zapisuje ownera do cyklu (wojna raz i koniec)',
    find: '                        ironForceWarCycleOwners.add(ownerId);\n', replace: '' },
  { id: 'M47-main-pending-bez-eliminacji', file: 'main', gates: [GUARD], why: 'pending Żelaza nie jest kasowany przy eliminacji cywilizacji',
    find: `      ironForceWarPendingOwners.delete(ownerId);
      ironForceWarCycleOwners.delete(ownerId);`,
    replace: '      ironForceWarCycleOwners.delete(ownerId);' },
  { id: 'M48-main-bez-guarda-sojuszu-w-komendzie', file: 'main', gates: [GUARD], why: 'finalny guard sojuszu w komendzie DOW usunięty',
    find: `                      if (
                        ironForceWarTargetId != null
                        && targetId === ironForceWarTargetId
                        && allianceFormalKindBetween(activeDeals, ownerId, targetId) !== null
                      ) {
                        continue;
                      }
`,
    replace: '' },
  { id: 'M49-main-hak-licznika-nazwa', file: 'main', gates: [GUARD], why: 'funkcja licznika miast Żelaza przemianowana (definicja i cooldown)',
    find: 'function maybeResolveIronForcedWarOnCityCapture(oldOwner: number, newOwner: number): void {',
    replace: 'function maybeResolveIronForcedWarOnCityCaptureX(oldOwner: number, newOwner: number): void {' },
  { id: 'M49b-main-cooldown-pokoju', file: 'main', gates: [GUARD], why: 'auto-pokój Żelaza używa długości odpoczynku zamiast cooldownu pary',
    find: `      finalizePeaceTreatyBetween(
        st.attackerId,
        st.targetId,
        WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR,
      );`,
    replace: `      finalizePeaceTreatyBetween(
        st.attackerId,
        st.targetId,
        WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
      );` },
  { id: 'M50-main-hak-bitwa', file: 'main', gates: [GUARD], why: 'hak licznika usunięty z funnela podboju bojowego',
    find: '      maybeResolveIronForcedWarOnCityCapture(oldOwner, atkOwner);\n', replace: '' },
  { id: 'M51-main-hak-kapitulacja', file: 'main', gates: [GUARD], why: 'hak licznika usunięty z kapitulacji głodowej (wojna AI↔AI nigdy się nie kończy)',
    find: '        maybeResolveIronForcedWarOnCityCapture(oldOwner, newOwner);\n', replace: '' },
  { id: 'M52-main-licznik-bez-pary', file: 'main', gates: [GUARD], why: 'licznik przestaje być ograniczony do aktywnej pary wymuszonej (dotyka zwykłych wojen)',
    find: `      const st = ironForceWarActiveByPairKey.get(pairKey);
      if (!st) return;`,
    replace: `      const st = ironForceWarActiveByPairKey.get(pairKey)
        ?? { attackerId: oldOwner, targetId: newOwner, capturedByAttacker: 0, capturedByDefender: 0 };
      if (!st) return;` },
  { id: 'M53-main-bez-cleanup-pokoj', file: 'main', gates: [GUARD], why: 'pokój nie uzbraja odpoczynku Żelaza',
    find: '      cleanupIronForcedWarOnPeace(proposerId, responderId);\n', replace: '' },
  { id: 'M54-main-save-bez-cycle', file: 'main', gates: [GUARD], why: 'zapis gry gubi cycleOwners Żelaza',
    find: '          ironForceWarCycleOwners: ironForceWarSave.cycleOwners,\n', replace: '' },
  { id: 'M55-main-bez-restore', file: 'main', gates: [GUARD], why: 'odczyt zapisu nie odtwarza stanu Żelaza',
    find: '      const ironForceWarRestored = restoreIronForcedWarState({',
    replace: '      const ironForceWarRestored = restoreIronForcedWarStateX({' },
  { id: 'M56-main-bez-resetu-nowej-gry', file: 'main', gates: [GUARD], why: 'nowa gra dziedziczy rejestry Żelaza z poprzedniej rozgrywki',
    find: `      ironForceWarPendingOwners.clear();
      ironForceWarCycleOwners.clear();
      ironForceWarRestUntilByOwner.clear();
      ironForceWarActiveByPairKey.clear();
      barbCamps = [];`,
    replace: '      barbCamps = [];' },
  { id: 'M57-main-regresja-kamienia', file: 'main', gates: [GUARD], why: 'REGRESJA: import modułu Kamienia zerwany',
    find: "} from './game/forced-war-stone';", replace: "} from './game/forced-war-stoneZZZ';" },
  { id: 'M58-main-rejestr-cycle', file: 'main', gates: [GUARD], why: 'rejestr cycleOwners Żelaza przemianowany (deklaracja)',
    find: '    const ironForceWarCycleOwners = new Set<number>();',
    replace: '    const ironForceWarCycleOwnersZZZ = new Set<number>();' },
];

function runGate(script, env) {
  try {
    const out = execFileSync('node', [path.join('tools', script)], {
      cwd: GRA, encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status == null ? -1 : e.status, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

function failedLabels(out) {
  const set = new Set();
  for (const line of out.split('\n')) {
    const m = line.match(/^\s*FAIL:\s*(.+?)\s*$/);
    if (m) set.add(m[1].replace(/ \(got [\s\S]*$/, ''));
  }
  return set;
}

function allLabels(out, prefix) {
  const set = new Set();
  for (const line of out.split('\n')) {
    const m = line.match(new RegExp('^\\s*' + prefix + '\\s*(.+?)\\s*$'));
    if (m) set.add(m[1]);
  }
  return set;
}

let exitCode = 0;
try {
  console.log('=== BAZA (bez mutacji) ===');
  const basePure = runGate('forced-war-iron-test.cjs', { FORCED_WAR_IRON_LIST_ASSERTS: '1' });
  const baseGuard = runGate('forced-war-iron-main-guard-test.cjs', {});
  if (basePure.code !== 0 || baseGuard.code !== 0) {
    console.error('BAZA NIE JEST ZIELONA — sonda mutacyjna nie ma sensu.');
    console.error(basePure.out);
    console.error(baseGuard.out);
    process.exit(1);
  }
  const pureLabels = allLabels(basePure.out, 'ASSERT-LABEL:');
  const guardLabels = allLabels(baseGuard.out, 'PASS:');
  console.log(`  asercje kontraktu czystego: ${pureLabels.size}`);
  console.log(`  asercje bramki main.ts/ai.ts: ${guardLabels.size}`);

  const coveredPure = new Map();
  const coveredGuard = new Map();

  for (const mut of MUTATIONS) {
    const file = FILES[mut.file];
    const src = ORIGINAL[mut.file];
    const idx = src.indexOf(mut.find);
    if (idx < 0) {
      console.error(`\n${mut.id}: KOTWICA NIE ZNALEZIONA w ${mut.file} — mutacja nie może po cichu nie zadziałać.`);
      exitCode = 1;
      continue;
    }
    if (src.indexOf(mut.find, idx + mut.find.length) >= 0) {
      console.error(`\n${mut.id}: KOTWICA NIEJEDNOZNACZNA w ${mut.file}.`);
      exitCode = 1;
      continue;
    }
    fs.writeFileSync(file, src.slice(0, idx) + mut.replace + src.slice(idx + mut.find.length), 'utf8');
    const red = [];
    if (mut.gates.includes(PURE)) {
      const r = runGate('forced-war-iron-test.cjs', {});
      for (const l of failedLabels(r.out)) {
        red.push('[czysty] ' + l);
        if (!coveredPure.has(l)) coveredPure.set(l, mut.id);
      }
    }
    if (mut.gates.includes(GUARD)) {
      const r = runGate('forced-war-iron-main-guard-test.cjs', {});
      for (const l of failedLabels(r.out)) {
        red.push('[bramka] ' + l);
        if (!coveredGuard.has(l)) coveredGuard.set(l, mut.id);
      }
    }
    fs.writeFileSync(file, src, 'utf8');
    console.log(`\n${mut.id} (${mut.file}) — ${mut.why}`);
    if (red.length === 0) {
      console.log('  !!! ŻADNA ASERCJA SIĘ NIE ZACZERWIENIŁA — mutacja nieprzykryta');
      exitCode = 1;
    } else {
      for (const l of red) console.log('  RED: ' + l);
    }
  }

  console.log('\n=== POKRYCIE ===');
  const uncoveredPure = [...pureLabels].filter(l => !coveredPure.has(l));
  const uncoveredGuard = [...guardLabels].filter(l => !coveredGuard.has(l));
  console.log(`kontrakt czysty: ${pureLabels.size - uncoveredPure.length}/${pureLabels.size} asercji zaczerwienionych`);
  console.log(`bramka main/ai: ${guardLabels.size - uncoveredGuard.length}/${guardLabels.size} asercji zaczerwienionych`);
  for (const l of uncoveredPure) console.log('  NIEPRZYKRYTA [czysty]: ' + l);
  for (const l of uncoveredGuard) console.log('  NIEPRZYKRYTA [bramka]: ' + l);
  if (uncoveredPure.length || uncoveredGuard.length) exitCode = 1;
} finally {
  for (const [k, p] of Object.entries(FILES)) fs.writeFileSync(p, ORIGINAL[k], 'utf8');
  for (const [k, p] of Object.entries(FILES)) {
    if (fs.readFileSync(p, 'utf8') !== ORIGINAL[k]) {
      console.error('KRYTYCZNE: nie udało się przywrócić ' + p);
      exitCode = 1;
    }
  }
  console.log('\nŹródła przywrócone bajt w bajt.');
}
process.exit(exitCode);
