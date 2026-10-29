STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1
GOAL: K08C = kontynuacja K08B: (1) wiring setK08aDeps/setK05bHost/setK06bDeps, (2) harness pin-exec owned/purchase, (3) partie 6 jednostek DOM z §3 K08B (praca, podział pracy, wealth, religia, handel). Runda 1/5: zrobione (1), (2) dla ścieżek pustych, (3) częściowo (2 z 6).
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 @ b19311e2. Commit kodu: 8457525f (gałąź wf/R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, bez push). Allowlista: src-tauri/frontend-v2/src/controller/k08cWiring.ts (NOWY), src/ui/cityPanel/{k08c-deps.ts, k08c-praca.ts} (NOWE), src/ui/cityPanel/k05b-host.ts (+getCities), tools/dom-harness/{k08c-subs.mjs, gen-k08c-port.mjs, verify-k08c-copies.mjs, run-k08c-praca-pin.mjs, run-k08c-owned-purchase-pin.mjs}, PORTING-QUEUE.md (dopisek), dyspozycje/rust-port/p5/P5-8-K08C.md (NOWY), runs/R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1/. Zero zmian w gra/**, .rs, package.json, WERSJE.md.
TESTY:
- verify-k08c-copies --batch praca: EXIT 0 (TEXT 2, COVER 2, EXPORT 2, ORPHAN 0, fails 0)
- run-k08c-praca-pin: EXIT 0, 25/25 zgodnych
- run-k08c-owned-purchase-pin: EXIT 0, 21/21 zgodnych (ścieżki puste)
- npm run check: EXIT 0 (pin-copies 435, niezgodnych 0)
- npm run typecheck (tsc --noEmit): EXIT 0, 0 błędów (po npm ci)
- regresja: run-k08b-rail EXIT 0; run-k08b-title-pin EXIT 0; verify-k08b-copies owned/purchase EXIT 0
- mutacje punktowe: k08c-praca literał -> harness EXIT 1, gate EXIT 1; k08b-purchase literał -> harness EXIT 1 (plik przywrócony)
- logi: dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1/r1-logi/*.txt
BLOKADY: brak blokad technicznych. Zakres rundy zredukowany względem dispatchu: renderPodzialPracy (blokery: appendPodzialPracyInfo, resolveEmpireSnap), renderWealth (buildWealthDetailCard 121 linii), renderReligia (religiaSzPunkty, appendCompositionBlock, buildTopBarReligiaDetailCard, resolveEmpireSnap), renderHandelSlidersPanel (buildHandelDetailCard 161 linii) — NIE_ZROBIONE, do rundy 2 (K08C-Z6). Pięć delegatów regułowych K06B to neutralne atrapy (K08C-Z5, lista `stubbed` w wiringu) — NIE_ZROBIONE: podpięcie silnika (K09).
RUNDY: 1/5
NASTĘPNY KROK: Operator-impl r2 (ten sam ID): (a) resolveEmpireSnap jako delegat wiringu, (b) partia handel (buildHandelDetailCard + renderHandelSlidersPanel), (c) wealth, (d) religia, (e) renderPodzialPracy + appendPodzialPracyInfo; pełne mutacje; pin-exec ścieżek niepustych po wiringu K06B. Bramka: Evaluator r1 -> Final Control.
DEPLOY/PUSH: NIE WYKONANO

Ograniczenia (NIE_ZMIERZONO): zachowanie w przeglądarce, CSS, dokowanie hoverDetailDock, ikony z import.meta.glob (atrapa pustego słownika po obu stronach harnessu), cargo clippy/test (brak zmian .rs), rebase poza bazą b19311e2.
