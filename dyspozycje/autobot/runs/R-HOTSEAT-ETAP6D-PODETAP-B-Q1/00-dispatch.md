STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-B-Q1
GOAL: Migracja klastra "HUD/panel dyplomacji" (15 funkcji, ok. 24 miejsca literału `0`) na
`isMe()`/`ME()`, kontynuacja Etapu 6d (dyplomacja, plan hot-seat).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ:
1. README.md, docs/decyzje/R-PROC-AUTOBOT.md, docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1/01-operator-runda1.md` —
   §2 (tabela 15 funkcji, cytaty, uzasadnienie) i §6 "Podetap B". ŹRÓDŁO PRAWDY dla dokładnych
   linii i cytatów — main.ts przesunął się od recon (integracje Podetapu A/C/E już w main),
   zweryfikuj świeżym `grep -n` przed każdą edycją, nie ufaj numerom linii ślepo.
3. UWAGA WAŻNA: recon (§6, poprawka rundy 2) przeniósł `handleNegotiationReject` z tego
   podetapu do Podetapu E — **Podetap E jest już zintegrowany do main** (commit `4e07a9aa`),
   `handleNegotiationReject` jest już zmigrowana. NIE dotykaj jej ponownie w tej rundzie.

ZADANIE: zmigruj na `isMe()`/`ME()` 15 funkcji z klastra HUD/render (perspektywa aktywnego
fotela) wymienionych w recon §2: `relationColorFn`, `unitRingStanceForPlayer`,
`playerFormalRelationLabel`, `cityMapOutlineKindForOwner`, `buildPlayerDiploRelations`,
`buildDiploPairSummaryData`, `buildAudienceActions`, `buildPendingNegotiationRows`,
`foreignCivsMissingTradeTreatyForCity`, `collectDiploChipCounts`,
`enqueueNegotiationFromAiCmd`, `buildEmpireDetailSnap`, `applyBorderMarchPenaltiesEndTurn`,
`currentVisibleForOwner`, `peacefulArchetypeForOwner` — dokładne linie i cytaty w recon §2,
przeczytaj każdą przed edycją (main.ts przesunięty, użyj `grep -n` na nazwę funkcji).

RYZYKO ŚREDNIE: to jest warstwa HUD/renderu, wymaga żywego dowodu Chromium (panel audiencji,
mapa, HUD) — wzorem precedensu Etapu 6c/ENGINE, nie wystarczy test jednostkowy dla funkcji
renderujących.

REGUŁA PRZECIW SAMOOSZUKIWANIU: bramka no-op PRZED/PO musi czerwienieć na wstrzykniętej
mutacji (np. `isMe()`→zawsze `false`) — inaczej to tautologia. Dla funkcji czysto
silnikowych/pomocniczych (jeśli jakaś w tej liście nie ma bezpośredniej ścieżki UI) dopuszczalny
jest test jednostkowy wołający REALNĄ funkcję z main.ts (nie regex na tekście źródłowym — to
dokładnie błąd złapany w Podetapie E runda 1, `hotseat-etap6d-podetap-e-source-test.cjs`
sprawdzał tylko regex, Evaluator to odrzucił, wymagana była poprawka `exec-test.cjs` z
realnym wykonaniem kodu przez `esbuild.transformSync`+`new Function`). Nie powtarzaj tego
błędu — jeśli piszesz test "jednostkowy", upewnij się że faktycznie WYKONUJE kod z main.ts,
nie tylko sprawdza jego tekst.

BINARNE KRYTERIUM SUKCESU: (1) wszystkich 15 funkcji zmigrowanych, zero pozostałych literałów
`0` tam gdzie reprezentują aktywny fotel; (2) żywa bramka Chromium dla ścieżek UI (panel
dyplomacji/audiencji, HUD, mapa) — PRZED/PO identyczne dla jednego gracza, mutacja
czerwieni; (3) test jednostkowy z realnym wykonaniem dla funkcji bez bezpośredniej ścieżki
UI (jeśli dotyczy); (4) `handleNegotiationReject` potwierdzona NIETKNIĘTA (już zmigrowana w
Podetapie E).

ALLOWLISTA:
- `gra/src/main.ts` — WYŁĄCZNIE ciała 15 wymienionych funkcji
- `gra/tools/*-test.cjs` — nowa bramka (jednostkowa z realnym wykonaniem + Chromium)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-B-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `handleNegotiationReject`, `applyProposalOutcome` i
jakiejkolwiek innej funkcji spoza tej listy 15.

IZOLACJA: worktree `/home/user/wt-6d-PODETAP-B`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-B-Q1`,
baza `origin/main` (świeża, zawiera już zintegrowane Podetapy A/C/E). C-001: zakaz `npm run
build`/`dev`; `tsc --noEmit` jedyna dozwolona kompilacja; `node ./node_modules/vite/bin/vite.js
build --outDir <poza repo> --emptyOutDir` jedyny dozwolony build do bramki Chromium.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Workflow,
Sonnet 5 effort high) → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
