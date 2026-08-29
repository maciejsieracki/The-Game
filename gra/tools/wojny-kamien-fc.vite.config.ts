/**
 * wojny-kamien-fc.vite.config.ts — build pomiarowy FINAL CONTROL
 * TEMAT: P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 (runda 1, trzecia niezalezna reprodukcja)
 *
 * DLACZEGO TRZECI HARNESS, SKORO SA JUZ DWA:
 * regula przeciw samooszukiwaniu (lekcja P-PROC-HARNESS-NIEPELNA-SCENA-Q1).
 * Operator i Evaluator roznia sie SONDA (Operator instrumentowal wejscia bramy
 * w `ai.ts`, Evaluator diffowal macierz `diplomacyRelations`), ale uzyli
 * IDENTYCZNEGO STEROWNIKA: gracz zaklada jedno miasto i przez 60 tur wylacznie
 * konczy ture. Gracz nigdy nie rusza jednostka, wiec nigdy nikogo nie odkrywa,
 * wiec `diplomaticallyDiscoveredOwners` zostaje puste, wiec KAZDE AI ma warstwe
 * `pre_contact` i `filterDiplomacyCommandsForLayer` kasuje mu wszystkie komendy.
 * To jest wspolny stub obu rol i moze samodzielnie wyprodukowac wynik "0 wojen".
 *
 * Ten harness ma dwa scenariusze na to samo ziarno:
 *   A_PASYWNY — replikacja sterownika obu rol (kontrola zgodnosci liczb);
 *   B_AKTYWNY — gracz WLACZA "Zwiedzaj" na swoich zwiadowcach, dokladnie tak jak
 *               w UI (akcja `scout-explore`, main.ts:18717-18742), wiec gra sama
 *               eksploruje mape wlasnym `runScoutsAutoExplore` i realnie nawiazuje
 *               kontakty. To lamie wspolny stub PRAWDZIWA akcja gracza, nie mutantem.
 *
 * Instrumentacja wstrzykiwana W PAMIECI (`transform`). `gra/src/**` i `gra/data/**`
 * pozostaja bajt w bajt nietkniete — `git status` jest dowodem.
 */
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

function fixScriptTag(): Plugin {
  return {
    name: 'fc-fix-script-tag',
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

/** Sonda + sterownik. Sonda tylko CZYTA stan; sterownik wykonuje wylacznie akcje gracza. */
const PROBE = `
    // === FINAL CONTROL P-DYPLO-WOJNY-KAMIEN-NIE-WIDAC-Q1 (build pomiarowy) ===
    (window as any).__fc = {
      ready: true,
      start: function (seed: number, extra: any) {
        const p = Object.assign({}, (globalThis as any).__fcBuildParams(), { seed }, extra || {});
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
      /**
       * DOKLADNY odpowiednik klikniecia akcji "Zwiedzaj" (scout-explore) w UI,
       * main.ts:18717-18742 — bez czesci czysto wizualnej (toast, cykl zaznaczenia).
       * Zadnej wlasnej nawigacji: ruch wykonuje gra przez runScoutsAutoExplore.
       */
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

      /**
       * KOREKTA FC (runda 1): pierwsza wersja kolejkowala zwiadowce w kolejce PRACY
       * (setCityProduction). Zmierzone: po 61 turach gracz mial 0 jednostek - jednostki
       * NIE powstaja z Pracy. Kanoniczna sciezka rekrutacji to purchaseRecruitmentUnit
       * (main.ts:3462) - oplata ze skarbca + Manpower + surowce; komentarz w kodzie mowi
       * wprost, ze gracz i AI ida "ta sama sciezka". Tego uzywam.
       */
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
        return ok ? ('bought:' + item.koszt)
          : ('failed:skarbiec=' + Math.round(player.skarbiec) + ',koszt=' + item.koszt);
      },
      prodState: function () {
        const cap = cities.find(function (c) { return c.ownerId === 0; });
        if (!cap) return null;
        const p = cityProd.get(cap.id);
        return {
          skarbiec: Math.round(player.skarbiec),
          kolejka: (p?.kolejka ?? []).map(function (i: any) { return i.kind + ':' + i.id; }),
          rekrutacja: ((p as any)?.rekrutacja ?? []).map(function (i: any) { return i.id; }),
        };
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
        try { resetEndTurnBlockers('fcAudit'); } catch (__e) { /* pomiar */ }
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
      /** Pelny odczyt stanu. Warstwa liczona TA SAMA funkcja, ktorej uzywa gra. */
      snap: function () {
        const contacts = getDiplomaticContacts();
        const ownersSet = new Set<number>();
        for (const c of cities) ownersSet.add(c.ownerId);
        for (const u of units) ownersSet.add(u.ownerId);
        const owners: any[] = [];
        for (const oid of Array.from(ownersSet).sort(function (x, y) { return x - y; })) {
          if (isBarbarian(oid)) continue;
          owners.push({
            o: oid,
            cities: cities.filter(function (c) { return c.ownerId === oid; }).length,
            csCities: cities.filter(function (c) {
              return c.ownerId === oid && (c as any).startCityState === true;
            }).length,
            epoch: empireEpochForOwner(oid),
            isCS: isOwnerClusterCityState(oid, ownerCityStateOpts()),
            simpl: simplifiedDiplomacyOwners.has(oid),
            typCopy: typCityCopyOwners.has(oid),
            elim: eliminatedOwners.has(oid),
            wars: countActiveWarsForOwner(oid),
            layer: oid === 0 ? null
              : diplomacyLayerForOwner(oid, simplifiedDiplomacyOwners, foreignTypeOwners, contacts),
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
        const plr: any[] = [];
        for (const oid of all) {
          if (oid === 0) continue;
          const r = getDiploRelation(0, oid);
          plr.push({ o: oid, s: r.status, z: r.zaufanie, resp: r.respekt, score: r.zaufanie + r.respekt });
        }
        return {
          t: turn,
          era: player.era,
          gameOver,
          contacts: Array.from(contacts).sort(function (x, y) { return x - y; }),
          contactEstablished: Array.from(diplomaticContactEstablished).sort(function (x, y) { return x - y; }),
          owners,
          warPairs: warPairs.sort(),
          plr,
          stonePending: Array.from(stoneForceWarPendingOwners),
          stoneCycle: Array.from(stoneForceWarCycleOwners),
          stoneActive: Array.from(stoneForceWarActiveByPairKey.keys()),
          scouts: units.filter(function (u) { return u.ownerId === 0 && isScoutUnit(u); })
            .map(function (u) { return { q: u.q, r: u.r, ae: u.autoExplore === true }; }),
          plrUnits: units.filter(function (u) { return u.ownerId === 0; }).length,
          // Co gracz FAKTYCZNIE widzi:
          warEvents: warEventLog.map(function (e: any) { return { id: e.id, title: e.title }; }),
          panelPlayer: collectWarsWithPlayer(),
          panelOthers: collectKnownWarsBetweenOthers(),
        };
      },
    };
`;

const INJECTIONS: Injection[] = [
  {
    id: 'fc-probe',
    file: 'src/main.ts',
    anchor: `    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);`,
    after: true,
    code: PROBE,
  },
  {
    id: 'fc-params',
    file: 'src/ui/newGameFlow.ts',
    anchor: `function buildParams(): NewGameParams {`,
    after: false,
    code: `(globalThis as any).__fcBuildParams = function () { return buildParams(); };\n`,
  },
];

function instrumentFc(): Plugin {
  const applied = new Set<string>();
  return {
    name: 'wojny-kamien-fc-instrument',
    enforce: 'pre',
    apply: 'build',
    transform(code: string, id: string) {
      const norm = id.split('\\').join('/');
      let out = code;
      let touched = false;
      for (const inj of INJECTIONS) {
        if (!norm.endsWith('/' + inj.file)) continue;
        const idx = out.indexOf(inj.anchor);
        if (idx < 0) throw new Error('[fc] KOTWICA NIE ZNALEZIONA: ' + inj.id + ' w ' + inj.file);
        if (out.indexOf(inj.anchor, idx + inj.anchor.length) >= 0) {
          throw new Error('[fc] KOTWICA NIEJEDNOZNACZNA: ' + inj.id + ' w ' + inj.file);
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
      if (missing.length > 0) throw new Error('[fc] instrumentacja NIE weszla: ' + missing.join(', '));
      console.log('[fc] instrumentacja OK: ' + Array.from(applied).join(', '));
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [instrumentFc(), viteSingleFile(), fixScriptTag()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      output: { format: 'iife', inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
