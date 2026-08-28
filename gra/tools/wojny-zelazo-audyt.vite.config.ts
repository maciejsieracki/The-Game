/**
 * wojny-zelazo-audyt.vite.config.ts — konfiguracja buildu WYŁĄCZNIE dla pomiaru
 * R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 (kryterium końca 4: pomiar PRZED/PO w rozgrywce).
 *
 * DLACZEGO OSOBNA KONFIGURACJA, A NIE ZMIANA `gra/src`: pomiar musi iść przez PRAWDZIWĄ
 * pętlę tury (`decideAIDiplomacy` wołane z `main.ts` w normalnym końcu tury), a nie przez
 * ręczne wołanie predykatów w izolacji, a jednocześnie pliki źródłowe muszą zostać bajt
 * w bajt nietknięte (`git status` czysty jest częścią dowodu). Rozwiązanie to samo, co
 * w audycie Kamienia (`wojny-kamien-audyt.vite.config.ts`): instrumentacja wstrzykiwana
 * W PAMIĘCI na etapie `transform` vite. Brak kotwicy = twardy błąd buildu.
 *
 * TRZY WARSTWY (każda osobno włączana zmienną środowiskową, każda jawnie raportowana):
 *  1. REJESTRATORY (zawsze) — tylko dopisują odczyt do `globalThis.__ZELAZO_AUDIT__`;
 *     nie zmieniają żadnego warunku, progu ani kolejności instrukcji.
 *  2. SCENARIUSZ `ZELAZO_SCEN_ERA=1` — hak sterujący `advanceMajorAiToIron()`: podnosi
 *     WYŁĄCZNIE `ownerStartEraByOwner` głównych cywilizacji AI do 3 i woła PRAWDZIWY
 *     `reconcileAllOwnerErasFromResearch()`. Awans epoki, wykrycie wejścia do Żelaza,
 *     wybór celu, komenda DOW i zapis stanu idą NIEZMIENIONYM kodem gry. To akcelerator
 *     czasu (naturalne dojście do epoki 3 to setki tur), NIE obejście mechanizmu.
 *  3. ODBLOKOWANIA ŚRODOWISKA (`ZELAZO_SCEN_CS=1`, `ZELAZO_SCEN_LAYER=1`) — wyłączają
 *     DWIE UDOKUMENTOWANE, NIEZALEŻNE OD TEGO TEMATU blokady, przez które dziś ŻADNA
 *     wojna wymuszona (Kamień, Brąz, Żelazo) nie dochodzi do skutku w rozgrywce
 *     (audyt `P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1`, przyczyny Z1 i Z5):
 *       Z1 — `isOwnerClusterCityState` zwraca `true` dla KAŻDEJ głównej cywilizacji, która
 *            przejęła miasto byłego miasta-państwa (znacznik `startCityState` nie jest
 *            kasowany), więc wyzwalacz i pula celów są puste;
 *       Z5 — `filterDiplomacyCommandsForLayer` kasuje WSZYSTKIE komendy AI (łącznie
 *            z `wypowiedz_wojne` wobec innego AI), gdy GRACZ nie odkrył jeszcze tej
 *            cywilizacji (`dipLayer === 'pre_contact'`).
 *     Obie blokady są POZA zakresem tego tematu (osobne, otwarte wątki). Pomiar bazowy
 *     (bez tych flag) i pomiar z odblokowaniem są raportowane osobno.
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

/** Kotwica → wstrzykiwany kod. `mode`: przed/po/zamiast kotwicy. Brak kotwicy = twardy błąd buildu. */
interface Injection { file: string; anchor: string; mode: 'before' | 'after' | 'replace'; code: string; id: string; }

/**
 * Rejestrator stanu Żelaza per (tura, owner) — wstawiany PO przekazaniu celu do
 * `decideAIDiplomacy`, czyli dokładnie tam, gdzie main.ts już policzył wszystko, co
 * decyduje o wymuszonej wojnie tej tury.
 */
const OWNER_RECORDER = `
                try {
                  const __za = (globalThis as any).__ZELAZO_AUDIT__;
                  if (__za && __za.on) {
                    __za.owners.push({
                      turn,
                      ownerId,
                      epoch: empireEpochForOwner(ownerId),
                      wars: countActiveWarsForOwner(ownerId),
                      dipLayer,
                      ironTarget: ironForceWarTargetId == null ? null : ironForceWarTargetId,
                      bronzeTarget: bronzeForceWarTargetId == null ? null : bronzeForceWarTargetId,
                      stoneTarget: stoneForceWarTargetId == null ? null : stoneForceWarTargetId,
                      ironPending: Array.from(ironForceWarPendingOwners),
                      ironCycle: Array.from(ironForceWarCycleOwners),
                      ironActivePairs: Array.from(ironForceWarActiveByPairKey.keys()),
                      ironRestUntil: ironForceWarRestUntilByOwner.get(ownerId) == null
                        ? null : ironForceWarRestUntilByOwner.get(ownerId),
                      isCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
                      cityCount: cities.filter(function (c) { return c.ownerId === ownerId; }).length,
                    });
                  }
                } catch (__e) { /* audyt nie może wpłynąć na grę */ }
`;

/** Rejestrator puli kandydatów (dowód: gracz i miasta-państwa nigdy nie są celem). */
const CANDIDATE_RECORDER = `
                    try {
                      const __za = (globalThis as any).__ZELAZO_AUDIT__;
                      if (__za && __za.on) {
                        __za.ironCand.push({
                          turn,
                          ownerId,
                          aiOwnerList: Array.from(aiOwnerList),
                          candidates: ironCandidates.map(function (c) { return c.ownerId; }),
                          blocked: Array.from(ironBlockedOwnerIds),
                        });
                      }
                    } catch (__e) { /* audyt */ }
`;

/** Rejestrator FAKTYCZNIE wykonanego wpisu wymuszonej wojny Żelaza (po komendzie DOW). */
const DOW_RECORDER = `
                        try {
                          const __za = (globalThis as any).__ZELAZO_AUDIT__;
                          if (__za && __za.on) {
                            __za.ironWars.push({
                              turn,
                              attackerId: ownerId,
                              targetId,
                              attackerEpoch: empireEpochForOwner(ownerId),
                              targetEpoch: empireEpochForOwner(targetId),
                              attackerIsCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
                              targetIsCityState: isOwnerClusterCityState(targetId, ownerCityStateOpts()),
                            });
                          }
                        } catch (__e) { /* audyt */ }
`;

/**
 * Wariant PRZED (`ZELAZO_BASELINE=1`) — ten sam plik konfiguracyjny skopiowany do
 * worktree na `origin/main`, gdzie mechanizmu Żelaza NIE MA. Kotwice Żelaza tam nie
 * istnieją, więc rejestrator wchodzi w kotwicę Kamienia i notuje to samo (epoka, wojny,
 * warstwa dyplomacji, cele Kamienia/Brązu) minus pola Żelaza. Dzięki temu PRZED i PO
 * jadą IDENTYCZNYM harnessem, tym samym ziarnem i tym samym scenariuszem.
 */
const BASELINE_OWNER_RECORDER = `
                try {
                  const __za = (globalThis as any).__ZELAZO_AUDIT__;
                  if (__za && __za.on) {
                    __za.owners.push({
                      turn,
                      ownerId,
                      epoch: empireEpochForOwner(ownerId),
                      wars: countActiveWarsForOwner(ownerId),
                      dipLayer,
                      ironTarget: null,
                      bronzeTarget: bronzeForceWarTargetId == null ? null : bronzeForceWarTargetId,
                      stoneTarget: stoneForceWarTargetId == null ? null : stoneForceWarTargetId,
                      ironPending: [],
                      ironCycle: [],
                      ironActivePairs: [],
                      ironRestUntil: null,
                      isCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
                      cityCount: cities.filter(function (c) { return c.ownerId === ownerId; }).length,
                    });
                  }
                } catch (__e) { /* audyt */ }
`;

const IRON_STATE_HOOK = `
      ironState: function () {
        return {
          turn,
          pending: Array.from(ironForceWarPendingOwners),
          cycle: Array.from(ironForceWarCycleOwners),
          activePairs: Array.from(ironForceWarActiveByPairKey.entries()),
          restUntil: Array.from(ironForceWarRestUntilByOwner.entries()),
        };
      },
`;

const IRON_STATE_HOOK_BASELINE = `
      ironState: function () {
        return { turn, pending: [], cycle: [], activePairs: [], restUntil: [] };
      },
`;

const DRIVER_HOOK = `
    // POMIAR R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 — hak sterujący (build pomiarowy, nie repo).
    (window as any).__zelazoAudit = {
      ready: true,
      startGame: function (seed: number, overrides: any) {
        const base = (window as any).__zelazoAuditBuildParams();
        const params = Object.assign({}, base, { seed }, overrides || {});
        return doStartGame(params).then(function () { return { seed: _gameSeed }; });
      },
      /**
       * SCENARIUSZ (akcelerator czasu): podnosi WYŁĄCZNIE epokę STARTOWĄ głównych
       * cywilizacji AI do 3 i woła PRAWDZIWY reconcileAllOwnerErasFromResearch().
       * Wykrycie wejścia do Żelaza (isIronEraEntry), wpis do ironForceWarPendingOwners,
       * wybór celu i komenda DOW idą NIEZMIENIONYM kodem gry.
       */
      advanceMajorAiToIron: function () {
        const touched: number[] = [];
        for (const oid of allAiOwnerIdsOnMap()) {
          if (oid <= 0) continue;
          if (isBarbarian(oid)) continue;
          if (typCityCopyOwners.has(oid)) continue;
          if (eliminatedOwners.has(oid)) continue;
          ownerStartEraByOwner.set(oid, 3);
          touched.push(oid);
        }
        reconcileAllOwnerErasFromResearch();
        return touched;
      },
__IRON_STATE__
      state: function () {
        const owners: any[] = [];
        const seen = new Set<number>();
        for (const c of cities) seen.add(c.ownerId);
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
        try { resetEndTurnBlockers('zelazoAudit'); } catch (__e) { /* audyt */ }
        return true;
      },
    };
`;

const PARAMS_HOOK = `
(globalThis as any).__zelazoAuditBuildParams = function () { return buildParams(); };
`;

/**
 * ODBLOKOWANIE Z1 (`ZELAZO_SCEN_CS=1`) — wyłącza gałąź `startCityState` klasyfikatora
 * `isOwnerClusterCityState`, przez którą KAŻDA główna cywilizacja AI po przejęciu miasta
 * byłego miasta-państwa jest na stałe klasyfikowana jako miasto-państwo (audyt
 * P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1, przyczyna Z1). Blokada jest wspólna dla Kamienia,
 * Brązu i Żelaza i nie należy do tego tematu.
 */
const UNBLOCK_Z1: Injection = {
  id: 'unblock-z1-startCityState-branch',
  file: 'src/game/display-names.ts',
  anchor: `  if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;`,
  mode: 'before',
  code: `  // [ZELAZO_SCEN_CS] gałąź startCityState wyłączona — patrz wojny-zelazo-audyt.vite.config.ts
  return false;`,
};

/**
 * ODBLOKOWANIE Z5 (`ZELAZO_SCEN_LAYER=1`) — wymusza pełną warstwę dyplomacji dla AI,
 * które gracz jeszcze nie odkrył. Bez tego `filterDiplomacyCommandsForLayer` kasuje
 * WSZYSTKIE komendy AI (w tym `wypowiedz_wojne` AI→AI po drugiej stronie mapy).
 */
const UNBLOCK_Z5: Injection = {
  id: 'unblock-z5-diplomacy-layer',
  file: 'src/main.ts',
  anchor: `                const dipLayer = diplomacyLayerForOwner(
                  ownerId,
                  simplifiedDiplomacyOwners,
                  foreignTypeOwners,
                  contactedOwners,
                );`,
  mode: 'replace',
  code: `                // [ZELAZO_SCEN_LAYER] warstwa wymuszona na 'full' — patrz wojny-zelazo-audyt.vite.config.ts
                const __dipLayerReal = diplomacyLayerForOwner(
                  ownerId,
                  simplifiedDiplomacyOwners,
                  foreignTypeOwners,
                  contactedOwners,
                );
                const dipLayer = __dipLayerReal === 'pre_contact' ? 'full' : __dipLayerReal;`,
};

const BASELINE = process.env.ZELAZO_BASELINE === '1';

const INJECTIONS: Injection[] = [
  BASELINE
    ? {
      id: 'main-owner-recorder',
      file: 'src/main.ts',
      anchor: `                diploInp.stoneForceWarTargetId = stoneForceWarTargetId;`,
      mode: 'after',
      code: BASELINE_OWNER_RECORDER,
    }
    : {
      id: 'main-owner-recorder',
      file: 'src/main.ts',
      anchor: `                diploInp.ironForceWarTargetId = ironForceWarTargetId;`,
      mode: 'after',
      code: OWNER_RECORDER,
    },
  ...(BASELINE ? [] : [
    {
      id: 'main-iron-candidates',
      file: 'src/main.ts',
      anchor: `                    const ironPicked = pickIronForcedWarTargetId(`,
      mode: 'before' as const,
      code: CANDIDATE_RECORDER,
    },
    {
      id: 'main-iron-dow',
      file: 'src/main.ts',
      anchor: `                        ironForceWarCycleOwners.add(ownerId);`,
      mode: 'after' as const,
      code: DOW_RECORDER,
    },
  ]),
  {
    id: 'main-driver-hook',
    file: 'src/main.ts',
    anchor: `    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);`,
    mode: 'after',
    code: DRIVER_HOOK.replace(
      '__IRON_STATE__',
      BASELINE ? IRON_STATE_HOOK_BASELINE : IRON_STATE_HOOK,
    ),
  },
  ...(process.env.ZELAZO_SCEN_CS === '1' ? [UNBLOCK_Z1] : []),
  ...(process.env.ZELAZO_SCEN_LAYER === '1' ? [UNBLOCK_Z5] : []),
  {
    id: 'newgameflow-params',
    file: 'src/ui/newGameFlow.ts',
    anchor: `export function showNewGameFlow(config: NewGameFlowConfig): void {`,
    mode: 'before',
    code: PARAMS_HOOK,
  },
];

function instrumentForAudit(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'wojny-zelazo-audyt-instrument',
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
            `[wojny-zelazo-audyt] KOTWICA NIE ZNALEZIONA: ${inj.id} w ${inj.file}. `
            + 'Instrumentacja nie może po cichu nie zadziałać — popraw kotwicę.',
          );
        }
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error(`[wojny-zelazo-audyt] KOTWICA NIEJEDNOZNACZNA: ${inj.id} w ${inj.file}`);
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
      if (missing.length > 0) {
        throw new Error('[wojny-zelazo-audyt] instrumentacja NIE weszła: ' + missing.join(', '));
      }
      console.log('[wojny-zelazo-audyt] instrumentacja OK: ' + Array.from(applied).join(', '));
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
