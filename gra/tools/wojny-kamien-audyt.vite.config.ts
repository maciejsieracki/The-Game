/**
 * wojny-kamien-audyt.vite.config.ts — konfiguracja buildu WYŁĄCZNIE dla audytu
 * P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1.
 *
 * DLACZEGO OSOBNA KONFIGURACJA, A NIE ZMIANA `gra/src`:
 * temat jest audytem pomiarowym — allowlista zabrania JAKIEJKOLWIEK zmiany w
 * `gra/src/**` i `gra/data/**`. Pomiar musi jednak iść przez PRAWDZIWĄ pętlę tury
 * (`decideAIDiplomacy` wołane z `main.ts`), a nie przez ręczne wołanie predykatów
 * w izolacji. Rozwiązanie: instrumentacja wstrzykiwana W PAMIĘCI, na etapie
 * `transform` vite — pliki w repo pozostają bajt w bajt nietknięte (`git status`
 * czysty), a bundle uruchamiany w Chromium niesie dodatkowe rejestratory.
 * Ten sam wzorzec co „mutant" w `tools/sidepanel-event-header-wydarzenie-real-render-test.cjs`
 * (build wariantu bez dotykania plików źródłowych).
 *
 * Wstrzykiwane rejestratory NIE zmieniają żadnego warunku, progu ani kolejności
 * instrukcji — tylko dopisują odczyt do `globalThis.__WAR_AUDIT__`.
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

function fixScriptTag(): Plugin {
  return {
    name: 'fix-script-tag',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string): string {
      let result = html.replace(/\s+crossorigin(?:="[^"]*")?(?=[\s>])/g, '');
      result = result.replace(/<script\s+type="module"/g, '<script type="text/javascript"');
      return result;
    },
  };
}

/** Kotwica → wstrzykiwany kod. Brak kotwicy = twardy błąd buildu (bez cichej ciszy). */
interface Injection { file: string; anchor: string; after: boolean; code: string; id: string; }

const GATE_RECORDER = `
    try {
      const __wa = (globalThis as any).__WAR_AUDIT__;
      if (__wa && __wa.on) {
        __wa.gates.push({
          turn: inp.currentTurn == null ? 0 : inp.currentTurn,
          me: inp.myPlayerId,
          partner: rel.partnerId,
          rw,
          score,
          stanWojny: rel.stanWojny === true,
          peaceLocked: rel.peaceLocked === true,
          nap: rel.hasNapTreaty === true,
          ally: rel.hasAllianceTreaty === true,
          willWar: stance.willingnessWar,
          agresjaRaw: inp.agresja,
          effAgresja,
          progSila: effProgWojnaSila,
          progAgresja: effProgWojnaAgresja,
          progRel: progMinimalnyRelacja,
          contact: rel.contactEstablished === true,
        });
      }
    } catch (__e) { /* audyt nie może wpłynąć na grę */ }
`;

const OWNER_RECORDER = `
                try {
                  const __wa = (globalThis as any).__WAR_AUDIT__;
                  if (__wa && __wa.on) {
                    __wa.owners.push({
                      turn,
                      ownerId,
                      epoch: empireEpochForOwner(ownerId),
                      wars: countActiveWarsForOwner(ownerId),
                      stoneTarget: stoneForceWarTargetId == null ? null : stoneForceWarTargetId,
                      bronzeTarget: bronzeForceWarTargetId == null ? null : bronzeForceWarTargetId,
                      pending: Array.from(stoneForceWarPendingOwners),
                      cycle: Array.from(stoneForceWarCycleOwners),
                      restUntil: stoneForceWarRestUntilByOwner.get(ownerId) == null
                        ? null : stoneForceWarRestUntilByOwner.get(ownerId),
                      activePairs: Array.from(stoneForceWarActiveByPairKey.keys()),
                      relPartners: relacjeDip.map(function (r) { return r.partnerId; }),
                      agresja: diploInp.agresja,
                      cityCount: cities.filter(function (c) { return c.ownerId === ownerId; }).length,
                      isCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
                    });
                  }
                } catch (__e) { /* audyt */ }
`;

const CANDIDATE_RECORDER = `
                    try {
                      const __wa = (globalThis as any).__WAR_AUDIT__;
                      if (__wa && __wa.on) {
                        __wa.stoneCand.push({
                          turn,
                          ownerId,
                          aiOwnerList: Array.from(aiOwnerList),
                          candidates: stoneCandidates.map(function (c) { return c.ownerId; }),
                        });
                      }
                    } catch (__e) { /* audyt */ }
`;

const DRIVER_HOOK = `
    // AUDYT P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 — hak sterujący (build audytowy, nie repo).
    (window as any).__warAudit = {
      ready: true,
      startGame: function (seed: number, overrides: any) {
        const base = (window as any).__warAuditBuildParams();
        const params = Object.assign({}, base, { seed }, overrides || {});
        return doStartGame(params).then(function () { return { seed: _gameSeed }; });
      },
      state: function () {
        const owners: any[] = [];
        const seen = new Set<number>();
        for (const c of cities) {
          if (seen.has(c.ownerId)) continue;
          seen.add(c.ownerId);
        }
        for (const oid of Array.from(seen).sort(function (a, b) { return a - b; })) {
          owners.push({
            ownerId: oid,
            cityCount: cities.filter(function (c) { return c.ownerId === oid; }).length,
            epoch: empireEpochForOwner(oid),
            barbarian: isBarbarian(oid),
            cityStateCopy: typCityCopyOwners.has(oid),
            clusterCityState: isOwnerClusterCityState(oid, ownerCityStateOpts()),
            eliminated: eliminatedOwners.has(oid),
            relToPlayer: oid === 0 ? null : getDiploRelation(0, oid).status,
          });
        }
        const wars: string[] = [];
        const all = Array.from(seen);
        for (let i = 0; i < all.length; i++) {
          for (let j = i + 1; j < all.length; j++) {
            const a = all[i] as number; const b = all[j] as number;
            if (getDiploRelation(a, b).status === 'wojna') wars.push(a + 'x' + b);
          }
        }
        return {
          turn,
          playerEra: player.era,
          awaitingFirstCity: isAwaitingFirstPlayerCity(),
          gameOver,
          endTurnInProgress,
          citiesLen: cities.length,
          unitsLen: units.length,
          owners,
          wars,
        };
      },
      warLog: function () {
        return warEventLog.map(function (e: any) {
          return { id: e.id, title: e.title, subtitle: e.subtitle, kind: e.kind };
        });
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
      endTurn: function () {
        try { flushDeferredAutoPreBattle(); } catch (__e) { /* audyt */ }
        triggerPlayerEndTurn();
        return endTurnInProgress;
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
      clearPreBattle: function () {
        try { hidePreBattle(); } catch (__e) { /* audyt */ }
        try { clearDeferredAutoPreBattleQueue(); } catch (__e) { /* audyt */ }
        try { resetEndTurnBlockers('warAudit'); } catch (__e) { /* audyt */ }
        return true;
      },
    };
`;

const PARAMS_HOOK = `
(globalThis as any).__warAuditBuildParams = function () { return buildParams(); };
`;

/**
 * MUTANT M1 (diagnostyka przyczynowa, WOJNY_AUDYT_MUTANT=1) — dowód NIETAUTOLOGICZNOŚCI.
 * Usuwa TRZECIĄ gałąź klasyfikatora `isOwnerClusterCityState` (`cities.some(c => c.ownerId
 * === ownerId && c.startCityState)`), czyli dokładnie tę, która po przejęciu miasta byłego
 * miasta-państwa trwale klasyfikuje główną cywilizację AI jako miasto-państwo. Jeśli
 * hipoteza Z1 jest prawdziwa, przebieg mutanta MUSI wyprodukować wojny wymuszone Kamienia
 * tam, gdzie przebieg bazowy dał zero. Jeśli mutant też da zero — mój pomiar mierzy własny
 * harness, nie grę, i wniosek Z1 jest nieuprawniony.
 * Mutacja żyje WYŁĄCZNIE w pamięci buildu. Plik `src/game/display-names.ts` jest nietknięty.
 */
const MUTANT_M1: Injection = {
  id: 'mutant-m1-startCityState-branch',
  file: 'src/game/display-names.ts',
  anchor: `  if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;`,
  after: false,
  // Gałąź startCityState jest OSTATNIA przed `return false`, więc wstawiony przed nią
  // `return false` jest dokładnym równoważnikiem jej usunięcia.
  code: `  // [MUTANT M1] gałąź startCityState wyłączona — patrz wojny-kamien-audyt.vite.config.ts
  return false;`,
};

const INJECTIONS: Injection[] = [
  {
    id: 'ai-gate-recorder',
    file: 'src/game/ai.ts',
    anchor: `    const effProgWojnaAgresja = Math.max(
      0.15,
      p.progWojnaAgresja - podbojBoost * 0.5 + bias.warAgresjaBonus,
    );`,
    after: true,
    code: GATE_RECORDER,
  },
  {
    id: 'main-owner-recorder',
    file: 'src/main.ts',
    anchor: `                diploInp.stoneForceWarTargetId = stoneForceWarTargetId;`,
    after: true,
    code: OWNER_RECORDER,
  },
  {
    id: 'main-stone-candidates',
    file: 'src/main.ts',
    anchor: `                    const stoneBlockedOwnerIds = new Set(`,
    after: false,
    code: CANDIDATE_RECORDER,
  },
  {
    id: 'main-driver-hook',
    file: 'src/main.ts',
    anchor: `    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);`,
    after: true,
    code: DRIVER_HOOK,
  },
  ...(process.env.WOJNY_AUDYT_MUTANT === '1' ? [MUTANT_M1] : []),
  {
    id: 'newgameflow-params',
    file: 'src/ui/newGameFlow.ts',
    anchor: `export function showNewGameFlow(config: NewGameFlowConfig): void {`,
    after: false,
    code: PARAMS_HOOK,
  },
];

function instrumentForAudit(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'wojny-kamien-audyt-instrument',
    enforce: 'pre',
    apply: 'build',
    transform(code: string, id: string) {
      const norm = id.split('\\').join('/');
      let out = code;
      let touched = false;
      for (const inj of INJECTIONS) {
        if (!norm.endsWith('/' + inj.file)) continue;
        const idx = out.indexOf(inj.anchor);
        if (idx < 0) {
          throw new Error(
            `[wojny-kamien-audyt] KOTWICA NIE ZNALEZIONA: ${inj.id} w ${inj.file}. `
            + 'Instrumentacja nie może po cichu nie zadziałać — popraw kotwicę.',
          );
        }
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error(`[wojny-kamien-audyt] KOTWICA NIEJEDNOZNACZNA: ${inj.id} w ${inj.file}`);
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
      if (missing.length > 0) {
        throw new Error('[wojny-kamien-audyt] instrumentacja NIE weszła: ' + missing.join(', '));
      }
      console.log('[wojny-kamien-audyt] instrumentacja OK: ' + Array.from(applied).join(', '));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [instrumentForAudit(), viteSingleFile(), fixScriptTag()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
