STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-A-Q1
GOAL: Migracja `playerDeclareWarOnOwner` (main.ts ok. 9864-9897) z hardkodu literału `0` na
`isMe()`/`ME()`, zgodnie z wzorcem już zmigrowanej sąsiedniej `ownerDeclareWarOn` (9907) i
całego Etapu 6d ENGINE (commit `6ce48d7d`).

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ:
1. README.md, docs/decyzje/R-PROC-AUTOBOT.md
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1/01-operator-runda1.md` —
   §1 (pełny cytat ciała, dokładnie 9 hardkodów, uzasadnienie aliasu) i §6 "Podetap A"
   (uzasadnienie zakresu/ryzyka). To jest ŹRÓDŁO PRAWDY dla tego dispatchu — nie zgaduj z
   nazwy, przeczytaj cytat.
3. Wcześniejszy precedens: `R-HOTSEAT-ETAP6F-...` lub dowolny inny już zintegrowany podetap
   Etapu 6 (np. Etap 6c/6e w REJESTR-PROSB-I-ZADAN.md) dla wzorca testu no-op.

ZADANIE: `gra/src/main.ts::playerDeclareWarOnOwner` — zamień WSZYSTKIE 9 miejsc literału `0`
(linie 9866, 9880, 9881, 9882, 9884, 9886×2, 9888, 9889 — patrz cytat w recon) na `isMe()`
tam gdzie `0` reprezentuje "aktywny fotel" jako WOŁAJĄCY (pierwszy argument funkcji typu
`chargeWarDeclarationCredibility`, `breakTreatiesOnWar`, `applyAllianceObligationsOnWar`,
`setDiploRelation`, `applyDiploEventTracked`, `getDiploRelation`, `pruneTributeNegotiationsBetween`,
`recordWarDeclarationEvent`) — wzorem już zmigrowanej `ownerDeclareWarOn` tuż obok (main.ts:9907),
przeczytaj JEJ ciało jako wzorzec identycznej migracji. ZACHOWAJ sygnaturę zwracającą `boolean`
(dwa wczesne `return false;` + końcowe `return true;`) — NIE zmieniaj na `void`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz deklaracji "zamknięte" bez żywego dowodu PRZED/PO że
gra nadal działa identycznie dla jednego gracza (no-op) — wzorem `hotseat-etap6e-render-noop-test.cjs`
(3× vite build + Chromium × N tur, PRZED/PO identyczne, bramka MUSI czerwienieć na mutacji
`ME()`→literał inny niż 0, żeby dowieść że nie jest tautologią). Nie wystarczy `tsc --noEmit`
ani odczyt kodu.

BINARNE KRYTERIUM SUKCESU: (1) zero literałów `0` pozostałych w ciele `playerDeclareWarOnOwner`
tam gdzie reprezentują "aktywny fotel"; (2) nowa/rozszerzona bramka no-op PRZED/PO identyczna
dla trybu jednego gracza; (3) bramka czerwienieje po wstrzyknięciu mutacji (dowód nietautologii);
(4) wywołanie funkcji z UI (przycisk wypowiedzenia wojny w panelu audiencji) nadal działa —
żywy dowód Chromium, nie tylko unit.

ALLOWLISTA:
- `gra/src/main.ts` — WYŁĄCZNIE ciało `playerDeclareWarOnOwner` (9864-9897, ±kilka linii jeśli
  main.ts się przesunął od recon — zweryfikuj świeżym `grep -n`)
- `gra/tools/*-test.cjs` — nowa/rozszerzona bramka no-op
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-A-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `ownerDeclareWarOn` (już zmigrowana, tylko odczyt jako wzorzec).

IZOLACJA: worktree `/home/user/wt-6d-PODETAP-A`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-A-Q1`,
baza `origin/main` (świeża, sparse-checkout gra+docs+dyspozycje, `node_modules` zlinkowany).
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`; jedyny
dozwolony build do bramki Chromium: `node ./node_modules/vite/bin/vite.js build --outDir <poza
repo> --emptyOutDir`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Workflow, Sonnet
5 effort high) → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
