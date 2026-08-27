/**
 * flaga-mp-op.vite.config.ts — build pomiarowy OPERATORA
 * TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (ECHO wlasciciela = wariant A)
 *
 * PO CO: dispatch wymaga pomiaru PRZED i PO na tym SAMYM sterowniku. Sonda tylko CZYTA
 * stan gry; sterownik wykonuje wylacznie akcje dostepne graczowi w UI. Instrumentacja
 * wstrzykiwana W PAMIECI (`transform`) — `gra/src/**` i `gra/data/**` zostaja bajt w bajt
 * nietkniete, `git status` jest na to dowodem.
 *
 * Sterownik jest kopia scenariusza „aktywny" z `wojny-kamien-fc.vite.config.ts`
 * (P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1): gracz zaklada miasto, kupuje zwiadowce i wlacza
 * im „Zwiedzaj" — bez tego `diplomaticallyDiscoveredOwners` zostaje puste i KAZDE AI
 * siedzi w warstwie `pre_contact`, co samo z siebie produkuje falszywe „0 wojen".
 *
 * DODANE WZGLEDEM harnessu FC (kryterium konca nr 4 dispatchu):
 *   - `power` — czy owner przechodzi filtr rankingu Mocy (`filterOwnersForPowerRanking`,
 *     `showAllCivs: true`, wiec bez zaklocenia mgla wojny),
 *   - `portrait` — czy medalion wymusza symbol kultury zamiast portretu wladcy
 *     (`portraitForceCultureIcon` = `shouldForceCultureIconForOwner`),
 *   - `csCityIds` — identyfikatory miast z flaga `startCityState`, zeby dalo sie sledzic
 *     WEDROWKE konkretnego miasta miedzy wlascicielami (zdobycie sila).
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

function fixScriptTag(): Plugin {
  return {
    name: 'flg-fix-script-tag',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string): string {
      let result = html.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g, '');
      result = result.replace(/<script\s+type="module"/g, '<script type="text/javascript"');
      return result;
    },
  };
}

interface Injection { file: string; anchor: string; after: boolean; code: string; id: string; }

const PROBE = `
    // === OPERATOR R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (build pomiarowy) ===
    (window as any).__flg = {
      ready: true,
      start: function (seed: number, extra: any) {
        const p = Object.assign({}, (globalThis as any).__flgBuildParams(), { seed }, extra || {});
        return doStartGame(p).then(function () { return true; });
      },
      foundFirstCity: function () {
        if (!isAwaitingFirstPlayerCity()) return 'already';
        const start = playerStartHex;
        if (!start) return 'no-start-hex';
        for (let rad = 0; rad <= Math.max(3, startRevealRadius); rad++) {
          for (let dq = -rad; dq <= rad; dq++) {
            for (let dr = -rad; dr <= rad; dr++) {
              const q = start.q + dq; const r = start.r + dr;
              if (hexDistance(start.q, start.r, q, r) !== rad) continue;
              if (canFoundPlayerCityAt(q, r).ok) {
                return tryFoundPlayerCityAt(q, r) ? 'ok:' + q + ',' + r : 'try-failed';
              }
            }
          }
        }
        return 'no-valid-hex';
      },
      /** Odpowiednik akcji „Zwiedzaj" (scout-explore) z UI. Ruch wykonuje gra sama. */
      enableExplore: function () {
        let n = 0;
        for (const u of units) {
          if (u.ownerId !== 0) continue;
          if (!isScoutUnit(u)) continue;
          if (u.autoExplore === true) continue;
          clearPlannedMarch(u.id, true);
          if (u.ufortyfikowanyWPolu === true) exitFieldFortify(u);
          u.autoExplore = true;
          n++;
        }
        return n;
      },
      /** Kanoniczna sciezka rekrutacji gracza (ta sama, ktorej uzywa UI). */
      recruitScout: function () {
        const cap = cities.find(function (c) { return c.ownerId === 0; });
        if (!cap) return 'no-city';
        const prod = cityProd.get(cap.id);
        if (((prod as any)?.rekrutacja?.length ?? 0) > 0) return 'already';
        if (units.some(function (u) { return u.ownerId === 0 && isScoutUnit(u); })) return 'have-scout';
        const item = unitProductionItem(
          'Zwiadowca', data, civBonusyForOwnerId(0),
          player.kosztJednostekPace ?? 'niski', 0, _menuDifficulty,
        );
        if (!item) return 'no-item';
        const ok = purchaseRecruitmentUnit(cap.id, 'Zwiadowca', item.koszt, 0);
        return ok ? ('bought:' + item.koszt) : ('failed');
      },
      blockers: function () {
        return {
          awaitingFirstCity: isAwaitingFirstPlayerCity(),
          preBattleOpen: isPreBattleOpen(),
          pendingAutoPreBattle: hasPendingAutoPreBattle(),
          gameOver,
          endTurnInProgress,
        };
      },
      unblock: function () {
        try { hidePreBattle(); } catch (__e) { /* pomiar */ }
        try { clearDeferredAutoPreBattleQueue(); } catch (__e) { /* pomiar */ }
        try { resetEndTurnBlockers('flgAudit'); } catch (__e) { /* pomiar */ }
        return true;
      },
      endTurn: function () {
        try { flushDeferredAutoPreBattle(); } catch (__e) { /* pomiar */ }
        triggerPlayerEndTurn();
        return endTurnInProgress;
      },
      tick: function () {
        return { turn, endTurnInProgress, gameOver };
      },
      snap: function () {
        const contacts = getDiplomaticContacts();
        const ownersSet = new Set<number>();
        for (const c of cities) ownersSet.add(c.ownerId);
        for (const u of units) ownersSet.add(u.ownerId);
        for (const a of aiStartHexes) ownersSet.add(a.ownerId);
        const powerEligible = new Set(filterOwnersForPowerRanking(allPowerOwnerIds(), {
          cityStateOpts: ownerCityStateOpts(),
          discoveredOwners: getDiplomaticContacts(),
          showAllCivs: true,
        }));
        const owners: any[] = [];
        for (const oid of Array.from(ownersSet).sort(function (x, y) { return x - y; })) {
          if (isBarbarian(oid)) continue;
          owners.push({
            o: oid,
            cities: cities.filter(function (c) { return c.ownerId === oid; }).length,
            csCities: cities.filter(function (c) {
              return c.ownerId === oid && (c as any).startCityState === true;
            }).length,
            isCS: isOwnerClusterCityState(oid, ownerCityStateOpts()),
            simpl: simplifiedDiplomacyOwners.has(oid),
            typCopy: typCityCopyOwners.has(oid),
            capital: clusterCapitalOwnerIds.has(oid),
            elim: eliminatedOwners.has(oid),
            power: powerEligible.has(oid),
            portrait: portraitForceCultureIcon(oid),
            wars: countActiveWarsForOwner(oid),
          });
        }
        const warPairs: string[] = [];
        const all = Array.from(ownersSet).filter(function (o) { return !isBarbarian(o); });
        for (let i = 0; i < all.length; i++) {
          for (let j = i + 1; j < all.length; j++) {
            const a = all[i] as number; const b = all[j] as number;
            if (getDiploRelation(a, b).status === 'wojna') warPairs.push(a + 'x' + b);
          }
        }
        return {
          t: turn,
          gameOver,
          contacts: Array.from(contacts).sort(function (x, y) { return x - y; }),
          owners,
          warPairs: warPairs.sort(),
          // Wedrowka konkretnych miast z flaga MP — dowod na przejscie flagi do zdobywcy.
          csCityIds: cities.filter(function (c) { return (c as any).startCityState === true; })
            .map(function (c) { return c.id + '@' + c.ownerId; }).sort(),
          stonePending: Array.from(stoneForceWarPendingOwners),
          stoneActive: Array.from(stoneForceWarActiveByPairKey.keys()),
          plrUnits: units.filter(function (u) { return u.ownerId === 0; }).length,
        };
      },
    };
`;

const INJECTIONS: Injection[] = [
  {
    id: 'flg-probe',
    file: 'src/main.ts',
    anchor: `    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);`,
    after: true,
    code: PROBE,
  },
  {
    id: 'flg-params',
    file: 'src/ui/newGameFlow.ts',
    anchor: `function buildParams(): NewGameParams {`,
    after: false,
    code: `(globalThis as any).__flgBuildParams = function () { return buildParams(); };\n`,
  },
];

/**
 * MUTANT (dowod nie-tautologicznosci pomiaru, wlaczany zmienna FLG_MUT_KEEP=1):
 * przywraca STARE zachowanie — kasowanie `startCityState` przy zdobyciu miasta jest
 * wylaczone. Pomiar PO z tym mutantem musi wygladac jak pomiar PRZED.
 */
const MUT_KEEP = process.env.FLG_MUT_KEEP === '1';
const MUTANT: Injection = {
  id: 'flg-mut-keep',
  file: 'src/game/display-names.ts',
  anchor: `  if (city.startCityState !== true) return false;`,
  after: true,
  code: `  // [FLG-MUT-KEEP] gaszenie flagi MP przy przejeciu wylaczone (tylko w pamieci buildu)\n  return false;`,
};

function instrumentFlg(): Plugin {
  const applied = new Set<string>();
  const all = MUT_KEEP ? INJECTIONS.concat([MUTANT]) : INJECTIONS;
  return {
    name: 'flaga-mp-op-instrument',
    enforce: 'pre',
    apply: 'build',
    transform(code: string, id: string) {
      const norm = id.split('\\').join('/');
      let out = code;
      let touched = false;
      for (const inj of all) {
        if (!norm.endsWith('/' + inj.file)) continue;
        const idx = out.indexOf(inj.anchor);
        if (idx < 0) throw new Error('[flg] KOTWICA NIE ZNALEZIONA: ' + inj.id + ' w ' + inj.file);
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error('[flg] KOTWICA NIEJEDNOZNACZNA: ' + inj.id + ' w ' + inj.file);
        }
        out = inj.after
          ? out.slice(0, idx + inj.anchor.length) + '\n' + inj.code + out.slice(idx + inj.anchor.length)
          : out.slice(0, idx) + inj.code + '\n' + out.slice(idx);
        applied.add(inj.id);
        touched = true;
      }
      return touched ? { code: out, map: null } : null;
    },
    buildEnd() {
      const missing = all.filter(i => !applied.has(i.id)).map(i => i.id);
      if (missing.length > 0) throw new Error('[flg] instrumentacja NIE weszla: ' + missing.join(', '));
      console.log('[flg] instrumentacja OK: ' + Array.from(applied).join(', '));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [instrumentFlg(), viteSingleFile(), fixScriptTag()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
