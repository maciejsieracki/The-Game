/**
 * wojny-kamien-ev.vite.config.ts — build pomiarowy EVALUATORA
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 (runda 1, weryfikacja niezalezna)
 *
 * DLACZEGO OSOBNY PLIK, A NIE `wojny-kamien-audyt.vite.config.ts` Operatora:
 * regula przeciw samooszukiwaniu wymaga POMIARU INNA METODA. Operator
 * instrumentowal WEJSCIA bramy wojny wewnatrz `ai.ts` (`rw`, `score`,
 * `effAgresja`, progi) — czyli mierzyl, co AI *widzi* przed decyzja.
 * Ten build nie dotyka `ai.ts` w ogole. Mierzy od strony STANU GRY:
 *   (1) pelna mapa `diplomacyRelations` co ture -> kto z kim jest w stanie
 *       wojny w turze N; wypowiedzenia wojny wylaniaja sie z DIFFU macierzy,
 *       nie z instrumentacji decyzji;
 *   (2) `warEventLog` (zrodlo panelu Wydarzen) + `collectWarsWithPlayer()` +
 *       `collectKnownWarsBetweenOthers()` (zrodlo panelu dyplomacji) -> punkt 5
 *       dispatchu: co gracz FAKTYCZNIE widzi;
 *   (3) census komend dyplomatycznych na granicy `main.ts`: ile komend
 *       `wypowiedz_wojne` AI wyprodukowalo (dipCmdsRaw) i ile przezylo filtr
 *       warstwy (dipCmdsLayered) + warstwa `dipLayer` per owner per tura.
 *
 * Instrumentacja jest wstrzykiwana W PAMIECI na etapie `transform`. Pliki
 * `gra/src/**` i `gra/data/**` pozostaja bajt w bajt nietkniete.
 *
 * MUTANTY (dowod nietautologicznosci, zmienne srodowiskowe):
 *   EV_MUT_CS=1   — usuwa galaz `startCityState` w `isOwnerClusterCityState`
 *                   (replikacja mutanta M1 Operatora, hipoteza Z1)
 *   EV_MUT_LAYER=1 — `filterDiplomacyCommandsForLayer` traktuje `pre_contact`
 *                   jak `full` (test hipotezy Z5 Operatora)
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

function fixScriptTag(): Plugin {
  return {
    name: 'ev-fix-script-tag',
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

/** Sonda stanu — CZYTA, nigdy nie pisze do stanu gry. */
const STATE_PROBE = `
    // === EVALUATOR P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1: sonda stanu (build pomiarowy) ===
    (window as any).__ev = {
      ready: true,
      params: function () { return (globalThis as any).__evBuildParams(); },
      start: function (seed: number) {
        const p = Object.assign({}, (globalThis as any).__evBuildParams(), { seed });
        return doStartGame(p).then(function () { return true; });
      },
      /** Peirwsze miasto gracza — bez tego gra nie rusza z miejsca. */
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
      /** Lekki odczyt na potrzeby waitFor — bez pelnego zrzutu. */
      tick: function () {
        return { turn, endTurnInProgress, gameOver, cities: cities.length };
      },
      /**
       * PELNY ZRZUT STANU. Zadnej instrumentacji decyzji — same odczyty
       * struktur, ktorymi gra faktycznie zyje.
       */
      snap: function () {
        const rel: any[] = [];
        for (const [k, v] of diplomacyRelations.entries()) {
          const parts = k.split('_').map(Number);
          if (parts.length !== 2) continue;
          const a = parts[0] as number; const b = parts[1] as number;
          if (isBarbarian(a) || isBarbarian(b)) continue;
          rel.push({
            k,
            s: (v as any).status,
            z: (v as any).zaufanie,
            r: (v as any).respekt,
          });
        }
        const ownersSet = new Set<number>();
        for (const c of cities) ownersSet.add(c.ownerId);
        for (const u of units) ownersSet.add(u.ownerId);
        const owners: any[] = [];
        for (const oid of Array.from(ownersSet).sort(function (x, y) { return x - y; })) {
          if (isBarbarian(oid)) continue;
          owners.push({
            o: oid,
            cities: cities.filter(function (c) { return c.ownerId === oid; }).length,
            csCities: cities.filter(function (c) { return c.ownerId === oid && (c as any).startCityState; }).length,
            units: units.filter(function (u) { return u.ownerId === oid; }).length,
            epoch: empireEpochForOwner(oid),
            power: objectivePowerForOwner(oid),
            isCS: isOwnerClusterCityState(oid, ownerCityStateOpts()),
            typCopy: typCityCopyOwners.has(oid),
            simpl: simplifiedDiplomacyOwners.has(oid),
            elim: eliminatedOwners.has(oid),
            wars: countActiveWarsForOwner(oid),
          });
        }
        return {
          turn,
          era: player.era,
          gameOver,
          endTurnInProgress,
          awaitingFirstCity: isAwaitingFirstPlayerCity(),
          rel,
          owners,
          discovered: Array.from(diplomaticallyDiscoveredOwners).sort(function (x, y) { return x - y; }),
          contactEstablished: Array.from(diplomaticContactEstablished).sort(function (x, y) { return x - y; }),
          stonePending: Array.from(stoneForceWarPendingOwners),
          stoneCycle: Array.from(stoneForceWarCycleOwners),
          stoneActive: Array.from(stoneForceWarActiveByPairKey.keys()),
          bronzePending: Array.from(bronzeForceWarPendingOwners),
          bronzeActive: Array.from(bronzeForceWarActiveByPairKey.keys()),
          // PUNKT 5 — dokladnie to, co widzi gracz:
          warEvents: warEventLog.map(function (e: any) {
            return { id: e.id, title: e.title, subtitle: e.subtitle, kind: e.kind };
          }),
          panelWarsWithPlayer: collectWarsWithPlayer(),
          panelWarsBetweenOthers: collectKnownWarsBetweenOthers(),
        };
      },
    };
`;

/** Census komend — na granicy main.ts, NIE wewnatrz ai.ts. */
const CMD_CENSUS = `
                try {
                  const __ev = (globalThis as any).__EV__;
                  if (__ev && __ev.on) {
                    const __raw = Array.isArray(dipCmdsRaw) ? dipCmdsRaw : [];
                    const __rw = __raw.filter(function (c: any) { return c.type === 'wypowiedz_wojne'; });
                    const __kw = dipCmdsLayered.filter(function (c: any) { return c.type === 'wypowiedz_wojne'; });
                    __ev.cmd.push({
                      t: turn,
                      o: ownerId,
                      l: dipLayer,
                      n: __raw.length,
                      k: dipCmdsLayered.length,
                      rw: __rw.map(function (c: any) { return c.targetId; }),
                      kw: __kw.map(function (c: any) { return c.targetId; }),
                    });
                  }
                } catch (__e) { /* pomiar nie moze wplynac na gre */ }
`;

/** MUTANT CS — replikacja M1 Operatora (hipoteza Z1). */
const MUT_CS: Injection = {
  id: 'ev-mut-cs',
  file: 'src/game/display-names.ts',
  anchor: `  if (opts?.cities?.some(c => c.ownerId === ownerId && c.startCityState)) return true;`,
  after: false,
  code: `  // [EV-MUT-CS] galaz startCityState wylaczona (tylko w pamieci buildu)
  return false;`,
};

/** MUTANT LAYER — `pre_contact` przestaje kasowac komendy (hipoteza Z5). */
const MUT_LAYER: Injection = {
  id: 'ev-mut-layer',
  file: 'src/game/diplomacy-layers.ts',
  anchor: `  if (layer === 'pre_contact') return [];`,
  after: false,
  code: `  // [EV-MUT-LAYER] pre_contact przepuszcza komendy (tylko w pamieci buildu)
  if (layer === 'pre_contact') return list;`,
};

const INJECTIONS: Injection[] = [
  {
    id: 'ev-state-probe',
    file: 'src/main.ts',
    anchor: `    // --- Konfiguracja pickera badań (przed hubem — getScienceHubSnapshot wymaga hooków) ---`,
    after: false,
    code: STATE_PROBE,
  },
  {
    id: 'ev-cmd-census',
    file: 'src/main.ts',
    anchor: `                const dipCmds: AIDiplomacyCommand[] = filterDiplomacyCommandsForEstablishedContact(`,
    after: false,
    code: CMD_CENSUS,
  },
  {
    id: 'ev-params',
    file: 'src/ui/newGameFlow.ts',
    anchor: `function buildParams(): NewGameParams {`,
    after: false,
    code: `(globalThis as any).__evBuildParams = function () { return buildParams(); };\n`,
  },
  ...(process.env.EV_MUT_CS === '1' ? [MUT_CS] : []),
  ...(process.env.EV_MUT_LAYER === '1' ? [MUT_LAYER] : []),
];

function instrumentEv(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'wojny-kamien-ev-instrument',
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
          throw new Error(`[ev] KOTWICA NIE ZNALEZIONA: ${inj.id} w ${inj.file}`);
        }
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error(`[ev] KOTWICA NIEJEDNOZNACZNA: ${inj.id} w ${inj.file}`);
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
        throw new Error('[ev] instrumentacja NIE weszla: ' + missing.join(', '));
      }
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
