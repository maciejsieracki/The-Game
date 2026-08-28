/**
 * flaga-mp-diag.vite.config.ts — build DIAGNOSTYCZNY OPERATORA
 * TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
 *
 * PO CO OSOBNY PLIK: `flaga-mp-op.vite.config.ts` jest sterownikiem POMIARU i musi zostać
 * bajt w bajt taki sam między przebiegiem PRZED i PO — dokładanie do niego sond zniszczyłoby
 * porównywalność. Ten plik jest jego kopią z DODATKOWYMI sondami, używaną wyłącznie do
 * ustalenia, GDZIE zatrzymuje się wymuszona wojna epoki Kamienia po naprawie flagi
 * (pomiar PO pokazał: `stoneForceWarPendingOwners` zapełnia się od tury 20, ale
 * `stoneForceWarActiveByPairKey` zostaje puste i nie pada żadne wypowiedzenie).
 *
 * Sondy TYLKO CZYTAJĄ. Instrumentacja wstrzykiwana w pamięci (`transform`); `gra/src/**`
 * i `gra/data/**` zostają nietknięte.
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
    // === OPERATOR R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1 (build diagnostyczny) ===
    (window as any).__flgDiag = [];
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
      diag: function () { return (window as any).__flgDiag; },
      snap: function () {
        return {
          t: turn,
          gameOver,
          // UWAGA: contactedOwners oraz diplomaticContactEstablished NIE sa widoczne w tym
          // zakresie (inna domknięta funkcja niż pętla AI) — stan kontaktu raportuje SONDA 3,
          // która siedzi dokładnie tam, gdzie te zbiory są czytane przez filtry komend.
          contacts: Array.from(getDiplomaticContacts()).sort(function (x, y) { return x - y; }),
          stonePending: Array.from(stoneForceWarPendingOwners),
          stoneActive: Array.from(stoneForceWarActiveByPairKey.keys()),
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
  {
    // SONDA 1 — czy owner w ogóle SZUKA celu wymuszonej wojny Kamienia i jak wypadają
    // sprawdzenia epoki / bycia już w wojnie.
    id: 'flg-diag-search',
    file: 'src/main.ts',
    anchor: `                      isAlreadyAtWarAnyRole: alreadyAtWarAnyRole,
                    })
                    : searchingAfterRest;`,
    after: true,
    code: `                  if (wasPending || searchingAfterRest) (window as any).__flgDiag.push({
                    t: turn, o: ownerId, ev: 'search', shouldSearch, wasPending,
                    atWar: alreadyAtWarAnyRole, epoch: empireEpochForOwner(ownerId),
                  });`,
  },
  {
    // SONDA 2 — czy z listy kandydatów wybrał się jakikolwiek cel.
    id: 'flg-diag-pick',
    file: 'src/main.ts',
    anchor: `                    if (stonePicked != null) stoneForceWarTargetId = stonePicked;`,
    after: true,
    code: `                    (window as any).__flgDiag.push({
                      t: turn, o: ownerId, ev: 'pick', picked: stonePicked,
                      cand: stoneCandidates.map(function (c) { return c.ownerId; }),
                      blocked: Array.from(stoneBlockedOwnerIds),
                    });`,
  },
  {
    // SONDA 3 — co decideAIDiplomacy zwróciło i co PRZEŻYŁO filtry warstwy/kontaktu.
    id: 'flg-diag-cmds',
    file: 'src/main.ts',
    anchor: `                for (const cmd of dipCmdsLayered) {
                  if (cmd.type === 'zaproponuj_audiencje' && cmd.targetId === '0') {
                    applyAiAudienceRequest(ownerId, cmd);
                  }
                }`,
    after: true,
    code: `                if (stoneForceWarTargetId != null) (window as any).__flgDiag.push({
                  t: turn, o: ownerId, ev: 'cmds', target: stoneForceWarTargetId,
                  layer: dipLayer, contacted: contactedOwners.has(ownerId),
                  established: diplomaticContactEstablished.has(ownerId),
                  raw: (Array.isArray(dipCmdsRaw) ? dipCmdsRaw : []).map(function (c: any) { return c.type + '->' + c.targetId; }),
                  layered: dipCmdsLayered.map(function (c: any) { return c.type + '->' + c.targetId; }),
                });`,
  },
];

function instrumentFlg(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'flaga-mp-diag-instrument',
    enforce: 'pre',
    apply: 'build',
    transform(code: string, id: string) {
      const norm = id.split('\\').join('/');
      let out = code;
      let touched = false;
      for (const inj of INJECTIONS) {
        if (!norm.endsWith('/' + inj.file)) continue;
        const idx = out.indexOf(inj.anchor);
        if (idx < 0) throw new Error('[flg-diag] KOTWICA NIE ZNALEZIONA: ' + inj.id + ' w ' + inj.file);
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error('[flg-diag] KOTWICA NIEJEDNOZNACZNA: ' + inj.id + ' w ' + inj.file);
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
      if (missing.length > 0) throw new Error('[flg-diag] instrumentacja NIE weszla: ' + missing.join(', '));
      console.log('[flg-diag] instrumentacja OK: ' + Array.from(applied).join(', '));
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
