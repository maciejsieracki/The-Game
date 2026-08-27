/**
 * ev-zelazo-pomiar.vite.config.ts — NIEZALEŻNY pomiar EVALUATORA dla
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1. Świadomie INNA METODA niż harness Operatora
 * (`wojny-zelazo-audyt.*`), żeby pomiar był powtórzeniem, a nie przepisaniem:
 *
 *  1. DŹWIGNIA DOJŚCIA DO ŻELAZA — Operator podnosił `ownerStartEraByOwner` do 3.
 *     Evaluator zamiast tego NADAJE PRAWDZIWE BADANIA: wszystkie technologie z
 *     `data.tech` trafiają do `aiResearchDone`, a cuda wyłączne (E) epok 1 i 2 do
 *     `completedWorldWonders`. Dzięki temu `computeMainCivEraFromResearch` liczy awans
 *     SWOJĄ pętlą `while` z realnych warunków (techy + cud), a nie z podniesionej epoki
 *     startowej. Efekt uboczny jest tu POŻĄDANY: awans idzie 1 → 3 JEDNYM SKOKIEM, więc
 *     pomiar wprost sprawdza sporną decyzję Operatora (`prev < 3 && next >= 3` zamiast
 *     sztywnego `prev === 2 && next === 3`).
 *  2. ODBLOKOWANIA Z1/Z5 — Operator łatał ŹRÓDŁO (gałąź `startCityState` w
 *     display-names.ts, podmiana `dipLayer`). Evaluator NIE dotyka źródła tych dwóch
 *     mechanizmów: robi to na POZIOMIE STANU GRY z haka sterującego —
 *     `startCityState` kasowany na miastach trzymanych przez ownerów, którzy nie są
 *     miastami-państwami, a kontakt dyplomatyczny dodawany do
 *     `diplomaticallyDiscoveredOwners` (czyli tak, jakby gracz te cywilizacje odkrył).
 *  3. REJESTRATOR WYPOWIEDZEŃ — Operator notował TYLKO wypowiedzenia Żelaza (hak
 *     w bloku Żelaza). Evaluator notuje KAŻDE `wypowiedz_wojne` w grze wraz z polem
 *     `powod` z `ai.ts` i klasyfikacją obu stron — dopiero potem filtruje po mechanizmie.
 *     Dzięki temu kryterium 5 („miasta-państwa i gracz nigdy celem ani napastnikiem")
 *     jest sprawdzane na PEŁNYM zbiorze wypowiedzeń, a nie na zbiorze wstępnie
 *     przefiltrowanym przez badany mechanizm.
 *  4. REJESTRATOR AWANSU EPOKI — notuje `prev`/`next` per (tura, owner) prosto z
 *     `syncOwnerEraFromResearch` i to, czy owner został wtedy uzbrojony w
 *     `ironForceWarPendingOwners`. To niezależny dowód wyzwalacza.
 *
 * Pliki `gra/src/**` NIE są zmieniane — instrumentacja wchodzi w pamięci na etapie
 * `transform`. Brak kotwicy albo kotwica niejednoznaczna = twardy błąd buildu.
 *
 * ZMIENNE ŚRODOWISKOWE:
 *   EV_ZELAZO_BASELINE=1  wariant PRZED (worktree na origin/main — bez mechanizmu Żelaza)
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

interface Injection { file: string; anchor: string; mode: 'before' | 'after' | 'replace'; code: string; id: string; }

const BASELINE = process.env.EV_ZELAZO_BASELINE === '1';

/** Rejestrator awansu epoki: prev/next + czy owner został uzbrojony w rejestrze Żelaza. */
const ERA_RECORDER = `
      try {
        const __ev = (globalThis as any).__EV_ZELAZO__;
        if (__ev && __ev.on) {
          __ev.eras.push({
            turn,
            ownerId,
            prev,
            next,
            ironArmed: ${BASELINE ? 'false' : 'ironForceWarPendingOwners.has(ownerId)'},
            bronzeArmed: bronzeForceWarPendingOwners.has(ownerId),
            isCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
          });
        }
      } catch (__e) { /* pomiar nie może wpłynąć na grę */ }
`;

/** Rejestrator KAŻDEGO wypowiedzenia wojny przez AI — z powodem i klasyfikacją stron. */
const DOW_RECORDER = `
                      try {
                        const __ev = (globalThis as any).__EV_ZELAZO__;
                        if (__ev && __ev.on) {
                          __ev.dows.push({
                            turn,
                            attackerId: ownerId,
                            targetId,
                            powod: String((cmd as any).powod || ''),
                            attackerEra: empireEpochForOwner(ownerId),
                            targetEra: targetId === 0 ? null : empireEpochForOwner(targetId),
                            attackerIsCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
                            targetIsCityState: isOwnerClusterCityState(targetId, ownerCityStateOpts()),
                            attackerIsBarb: isBarbarian(ownerId),
                            targetIsBarb: isBarbarian(targetId),
                            attackerIsCsCopy: typCityCopyOwners.has(ownerId),
                            targetIsCsCopy: typCityCopyOwners.has(targetId),
                            ironTargetThisOwner: ${BASELINE ? 'null' : 'ironForceWarTargetId == null ? null : ironForceWarTargetId'},
                            dipLayer,
                          });
                        }
                      } catch (__e) { /* pomiar */ }
`;

/** Rejestrator puli kandydatów Żelaza (kryterium 5 — pula, nie tylko wynik). */
const CAND_RECORDER = `
                    try {
                      const __ev = (globalThis as any).__EV_ZELAZO__;
                      if (__ev && __ev.on) {
                        __ev.cands.push({
                          turn,
                          ownerId,
                          aiOwnerList: Array.from(aiOwnerList),
                          candidates: ironCandidates.map(function (c) { return c.ownerId; }),
                          blocked: Array.from(ironBlockedOwnerIds),
                        });
                      }
                    } catch (__e) { /* pomiar */ }
`;

const IRON_STATE = BASELINE
  ? `      ironState: function () { return { turn, pending: [], cycle: [], activePairs: [], restUntil: [] }; },`
  : `      ironState: function () {
        return {
          turn,
          pending: Array.from(ironForceWarPendingOwners),
          cycle: Array.from(ironForceWarCycleOwners),
          activePairs: Array.from(ironForceWarActiveByPairKey.entries()),
          restUntil: Array.from(ironForceWarRestUntilByOwner.entries()),
        };
      },`;

const DRIVER = `
    // POMIAR EVALUATORA R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 (build pomiarowy, nie repo).
    (window as any).__evZelazo = {
      ready: true,
      startGame: function (seed: number) {
        const base = (globalThis as any).__evZelazoBuildParams();
        return doStartGame(Object.assign({}, base, { seed })).then(function () { return { seed: _gameSeed }; });
      },
      /**
       * DŹWIGNIA EVALUATORA — PRAWDZIWE BADANIA, nie podniesiona epoka startowa.
       * Wszystkie technologie z data.tech → aiResearchDone danego ownera; cuda wyłączne
       * (E) epok 1 i 2 tej cywilizacji → completedWorldWonders. Potem PRAWDZIWY
       * reconcileAllOwnerErasFromResearch(). Awans, wykrycie wejścia do Żelaza, pula
       * celów, komenda DOW i filtry idą NIEZMIENIONYM kodem gry.
       */
      researchToIron: function () {
        const rows = (data.tech as any[]) || [];
        const allTechNames: string[] = [];
        for (const t of rows) {
          const n = (t as any).Technologia;
          if (typeof n === 'string' && n.length > 0) allTechNames.push(n);
        }
        const out: any[] = [];
        for (const oid of allAiOwnerIdsOnMap()) {
          if (oid <= 0) continue;
          if (isBarbarian(oid)) continue;
          if (typCityCopyOwners.has(oid)) continue;
          if (eliminatedOwners.has(oid)) continue;
          if (simplifiedDiplomacyOwners.has(oid)) continue;
          const before = ownerEraByOwner.get(oid);
          let done = aiResearchDone.get(oid);
          if (!done) { done = new Set<string>(); aiResearchDone.set(oid, done); }
          for (const n of allTechNames) done.add(n);
          const civType = civTypeForOwner(oid);
          const addedWonders: string[] = [];
          for (const era of [1, 2]) {
            for (const wid of eraOwnWonderIds(civType, era)) {
              if (!completedWorldWonders.includes(wid)) {
                completedWorldWonders.push(wid);
                addedWonders.push(wid);
              }
            }
          }
          out.push({ ownerId: oid, civType, eraBefore: before, techsInDone: done.size, addedWonders });
        }
        reconcileAllOwnerErasFromResearch();
        for (const rec of out) rec.eraAfter = ownerEraByOwner.get(rec.ownerId);
        return out;
      },
      /**
       * Odblokowanie Z5 NA POZIOMIE STANU (nie łatka źródła): gracz „odkrywa" wszystkie
       * cywilizacje, więc diplomacyLayerForOwner przestaje zwracać 'pre_contact'.
       */
      meetAllCivs: function () {
        const added: number[] = [];
        for (const oid of allAiOwnerIdsOnMap()) {
          if (oid <= 0) continue;
          if (eliminatedOwners.has(oid)) continue;
          if (!diplomaticallyDiscoveredOwners.has(oid)) { diplomaticallyDiscoveredOwners.add(oid); added.push(oid); }
          diplomaticContactEstablished.add(oid);
        }
        return added;
      },
      /**
       * Odblokowanie Z1 NA POZIOMIE STANU (nie łatka źródła): kasuje znacznik
       * startCityState na miastach trzymanych przez ownerów, którzy NIE są dziś
       * miastami-państwami (simplifiedDiplomacyOwners / typCityCopyOwners) — czyli
       * dokładnie na miastach przejętych przez główne cywilizacje.
       */
      clearStaleCityStateFlags: function () {
        const cleared: any[] = [];
        for (const c of cities) {
          if (!(c as any).startCityState) continue;
          const oid = c.ownerId;
          if (oid <= 0) continue;
          if (simplifiedDiplomacyOwners.has(oid) || typCityCopyOwners.has(oid)) continue;
          (c as any).startCityState = false;
          cleared.push({ ownerId: oid, id: (c as any).id });
        }
        return cleared;
      },
${IRON_STATE}
      /** PEŁNY przegląd ownerów — własna klasyfikacja Evaluatora pod kryterium 5. */
      audit: function () {
        const seen = new Set<number>();
        for (const c of cities) seen.add(c.ownerId);
        for (const u of units) seen.add(u.ownerId);
        seen.add(0);
        const owners: any[] = [];
        for (const oid of Array.from(seen).sort(function (a, b) { return a - b; })) {
          owners.push({
            ownerId: oid,
            isPlayer: oid === 0,
            barbarian: oid === 0 ? false : isBarbarian(oid),
            csCopy: typCityCopyOwners.has(oid),
            simplified: simplifiedDiplomacyOwners.has(oid),
            clusterCityState: isOwnerClusterCityState(oid, ownerCityStateOpts()),
            eliminated: eliminatedOwners.has(oid),
            era: oid === 0 ? player.era : empireEpochForOwner(oid),
            cityCount: cities.filter(function (c) { return c.ownerId === oid; }).length,
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
        return { turn, gameOver, endTurnInProgress, citiesLen: cities.length, owners, wars };
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
        try { flushDeferredAutoPreBattle(); } catch (__e) { /* pomiar */ }
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
        try { hidePreBattle(); } catch (__e) { /* pomiar */ }
        try { clearDeferredAutoPreBattleQueue(); } catch (__e) { /* pomiar */ }
        try { resetEndTurnBlockers('evZelazo'); } catch (__e) { /* pomiar */ }
        return true;
      },
    };
`;

const PARAMS_HOOK = `
(globalThis as any).__evZelazoBuildParams = function () { return buildParams(); };
`;

const ERA_ANCHOR = BASELINE
  ? `        bronzeForceWarPendingOwners.add(ownerId);
      }
      return prev !== next;`
  : `        ironForceWarPendingOwners.add(ownerId);
      }
      return prev !== next;`;

const INJECTIONS: Injection[] = [
  {
    id: 'ev-era-recorder',
    file: 'src/main.ts',
    anchor: ERA_ANCHOR,
    mode: 'replace',
    code: ERA_ANCHOR.replace('      return prev !== next;', ERA_RECORDER + '      return prev !== next;'),
  },
  {
    id: 'ev-dow-recorder',
    file: 'src/main.ts',
    anchor: `                      chargeWarDeclarationCredibility(ownerId, targetId);`,
    mode: 'before',
    code: DOW_RECORDER,
  },
  ...(BASELINE ? [] : [{
    id: 'ev-cand-recorder',
    file: 'src/main.ts',
    anchor: `                    const ironPicked = pickIronForcedWarTargetId(`,
    mode: 'before' as const,
    code: CAND_RECORDER,
  }]),
  {
    id: 'ev-driver-hook',
    file: 'src/main.ts',
    anchor: `    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);`,
    mode: 'after',
    code: DRIVER,
  },
  {
    id: 'ev-params-hook',
    file: 'src/ui/newGameFlow.ts',
    anchor: `export function showNewGameFlow(config: NewGameFlowConfig): void {`,
    mode: 'before',
    code: PARAMS_HOOK,
  },
];

function instrument(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'ev-zelazo-pomiar-instrument',
    enforce: 'pre',
    apply: 'build',
    transform(code: string, id: string) {
      const norm = id.split('\\').join('/');
      let out = code;
      let touched = false;
      for (const inj of INJECTIONS) {
        if (!norm.endsWith('/' + inj.file)) continue;
        const idx = out.indexOf(inj.anchor);
        if (idx < 0) throw new Error(`[ev-zelazo] KOTWICA NIE ZNALEZIONA: ${inj.id} w ${inj.file}`);
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error(`[ev-zelazo] KOTWICA NIEJEDNOZNACZNA: ${inj.id} w ${inj.file}`);
        }
        if (inj.mode === 'after') {
          out = out.slice(0, idx + inj.anchor.length) + '\n' + inj.code + out.slice(idx + inj.anchor.length);
        } else if (inj.mode === 'before') {
          out = out.slice(0, idx) + inj.code + '\n' + out.slice(idx);
        } else {
          out = out.slice(0, idx) + inj.code + out.slice(idx + inj.anchor.length);
        }
        applied.add(inj.id);
        touched = true;
      }
      return touched ? { code: out, map: null } : null;
    },
    buildEnd() {
      const missing = INJECTIONS.filter(i => !applied.has(i.id)).map(i => i.id);
      if (missing.length > 0) throw new Error('[ev-zelazo] instrumentacja NIE weszła: ' + missing.join(', '));
      console.log('[ev-zelazo] instrumentacja OK: ' + Array.from(applied).join(', '));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [instrument(), viteSingleFile(), fixScriptTag()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
