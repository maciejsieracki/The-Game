/**
 * flaga-mp-ev.vite.config.ts — NIEZALEZNY build pomiarowy EVALUATORA
 * TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
 *
 * CELOWO INNY PROJEKT NIZ HARNESS OPERATORA (`flaga-mp-op.vite.config.ts`):
 *
 *  1) Operator mierzyl AGREGAT per owner w turze 20 (`isCS` / `csCities`). Tu mierze
 *     PER MIASTO w KAZDEJ turze: `{id, owner, cs}`. Dzieki temu sterownik sam,
 *     bez zadnej wiedzy o naprawie, wykrywa ZDARZENIE „miasto zmienilo wlasciciela"
 *     i sprawdza, czy flaga `startCityState` zgasla — to jest test sciezki przejecia,
 *     a nie test migawki. Metoda jest identyczna dla builda PRZED i PO i nie wymaga
 *     ZADNEJ instrumentacji sciezek przejecia (brak ryzyka, ze sonda mierzy sonde).
 *
 *  2) Dodany LEDGER KOMEND DYPLOMATYCZNYCH: dla kazdej tury i kazdego AI zapisujemy
 *     komendy `wypowiedz_wojne` PRZED filtrem warstwy (`dipCmdsRaw`) i PO nim
 *     (`dipCmdsLayered`) razem z `dipLayer`. To niezalezne sprawdzenie tezy Operatora,
 *     ze warstwa `pre_contact` kasuje wypowiedzenia AI<->AI. Sonda tylko CZYTA.
 *
 * Instrumentacja wstrzykiwana W PAMIECI (`transform`) — `gra/src/**` i `gra/data/**`
 * zostaja bajt w bajt nietkniete.
 *
 * WAZNE: wszystkie kotwice istnieja ZAROWNO na `origin/main` (build PRZED), JAK I na
 * galezi tematu (build PO) — ten sam plik konfiguracyjny obsluguje oba przebiegi.
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

function fixScriptTag(): Plugin {
  return {
    name: 'ev-flg-fix-script-tag',
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

/** Ledger komend dyplomatycznych — czysty odczyt, zero wplywu na przebieg gry. */
const CMD_LEDGER = `
                try {
                  const __evRaw = (Array.isArray(dipCmdsRaw) ? dipCmdsRaw : [])
                    .filter(function (c: any) { return c.type === 'wypowiedz_wojne'; })
                    .map(function (c: any) { return String(c.targetId); });
                  const __evLay = dipCmdsLayered
                    .filter(function (c: any) { return c.type === 'wypowiedz_wojne'; })
                    .map(function (c: any) { return String(c.targetId); });
                  if (__evRaw.length > 0) {
                    const __g = globalThis as any;
                    if (!__g.__evCmdLog) __g.__evCmdLog = [];
                    __g.__evCmdLog.push({
                      t: turn, o: ownerId, layer: dipLayer, raw: __evRaw, lay: __evLay,
                    });
                  }
                } catch (__e) { /* pomiar */ }
`;

const PROBE = `
    // === EVALUATOR R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (build pomiarowy) ===
    (window as any).__ev = {
      ready: true,
      start: function (seed: number, extra: any) {
        const p = Object.assign({}, (globalThis as any).__evBuildParams(), { seed }, extra || {});
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
        try { resetEndTurnBlockers('evAudit'); } catch (__e) { /* pomiar */ }
        return true;
      },
      endTurn: function () {
        try { flushDeferredAutoPreBattle(); } catch (__e) { /* pomiar */ }
        triggerPlayerEndTurn();
        return endTurnInProgress;
      },
      tick: function () { return { turn, endTurnInProgress, gameOver }; },
      /** Zbiera i CZYSCI ledger komend (zeby nie rosl bez konca w pamieci strony). */
      drainCmdLog: function () {
        const g = globalThis as any;
        const out = g.__evCmdLog || [];
        g.__evCmdLog = [];
        return out;
      },
      snap: function () {
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
            n: cities.filter(function (c) { return c.ownerId === oid; }).length,
            isCS: isOwnerClusterCityState(oid, ownerCityStateOpts()),
            simpl: simplifiedDiplomacyOwners.has(oid),
            typCopy: typCityCopyOwners.has(oid),
            cap: clusterCapitalOwnerIds.has(oid),
            elim: eliminatedOwners.has(oid),
            pow: powerEligible.has(oid),
            por: portraitForceCultureIcon(oid),
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
          contacts: Array.from(getDiplomaticContacts()).sort(function (x, y) { return x - y; }),
          owners,
          warPairs: warPairs.sort(),
          // SEDNO METODY EVALUATORA: pelny stan KAZDEGO miasta w kazdej turze.
          // Sterownik z tego sam wyliczy zdarzenia „miasto zmienilo wlasciciela".
          cityRows: cities.map(function (c) {
            return { id: c.id, o: c.ownerId, cs: (c as any).startCityState === true };
          }),
          stonePending: Array.from(stoneForceWarPendingOwners),
          stoneActive: Array.from(stoneForceWarActiveByPairKey.keys()),
        };
      },
    };
`;

const INJECTIONS: Injection[] = [
  {
    id: 'ev-probe',
    file: 'src/main.ts',
    anchor: `    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);`,
    after: true,
    code: PROBE,
  },
  {
    id: 'ev-params',
    file: 'src/ui/newGameFlow.ts',
    anchor: `function buildParams(): NewGameParams {`,
    after: false,
    code: `(globalThis as any).__evBuildParams = function () { return buildParams(); };\n`,
  },
  {
    id: 'ev-cmd-ledger',
    file: 'src/main.ts',
    anchor: `                const dipCmds: AIDiplomacyCommand[] = filterDiplomacyCommandsForEstablishedContact(
                  dipCmdsLayered.filter(c => c.type !== 'zaproponuj_audiencje'),
                  diplomaticContactEstablished.has(ownerId),
                );`,
    after: true,
    code: CMD_LEDGER,
  },
];

function instrumentEv(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'flaga-mp-ev-instrument',
    enforce: 'pre',
    apply: 'build',
    transform(code: string, id: string) {
      const norm = id.split('\\').join('/');
      let out = code;
      let touched = false;
      for (const inj of INJECTIONS) {
        if (!norm.endsWith('/' + inj.file)) continue;
        const idx = out.indexOf(inj.anchor);
        if (idx < 0) throw new Error('[ev] KOTWICA NIE ZNALEZIONA: ' + inj.id + ' w ' + inj.file);
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error('[ev] KOTWICA NIEJEDNOZNACZNA: ' + inj.id + ' w ' + inj.file);
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
      const missing = INJECTIONS.filter(i => !applied.has(i.id)).map(i => i.id);
      if (missing.length > 0) throw new Error('[ev] instrumentacja NIE weszla: ' + missing.join(', '));
      console.log('[ev] instrumentacja OK: ' + Array.from(applied).join(', '));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [instrumentEv(), viteSingleFile(), fixScriptTag()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
