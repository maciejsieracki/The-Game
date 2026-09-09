STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-E-Q1
GOAL: Migracja całego modułu "stołu negocjacyjnego" (`negotiationTable`, 14 funkcji, ok. 22
hardkody literału `0`) na `isMe()`/`ME()`, kontynuacja Etapu 6d.

KONTEKST — PRZECZYTAJ W CAŁOŚCI PRZED PIERWSZĄ ZMIANĄ:
1. README.md, docs/decyzje/R-PROC-AUTOBOT.md
2. `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-RECON-REMAINDER-Q1/01-operator-runda1.md` —
   §1b (pełna tabela 14 funkcji z liniami i cytatami) i §6 "Podetap E". ŹRÓDŁO PRAWDY dla
   dokładnych linii i cytatów — main.ts mógł się przesunąć od recon, zweryfikuj świeżym
   `grep -n` przed każdą edycją, nie ufaj numerom linii ślepo.
3. Uwaga z recon: `handleNegotiationReject` (main.ts ok. 16264, 16274, 16275 — 3 hardkody, NIE
   1 jak błędnie liczyła runda 1) NALEŻY DO TEGO PODETAPU, nie do Podetapu B (HUD) — dzieli
   plik logiczny "stołu negocjacyjnego" z resztą tej listy.

ZADANIE: zmigruj WSZYSTKIE 14 funkcji operujących na `negotiationTable` na `isMe()`/`ME()`
(wszystkie mają hardkod `proposerOwnerId`/`responderOwnerId`/`awaitingOwnerId` `===0`/`!==0`
lub literał `0` jako argument — moduł operuje wyłącznie na parach gracz(0)↔AI):
`negotiationPartnerOwnerIdOf`, `resolveNegotiationEntryAt`, `resolvePendingNegotiationsForOwner`,
`handleNegotiationAccept`, `handleNegotiationCounter`, `handleNegotiationReject`,
`handleRequestAiNegotiationResponse`, `getNegotiationsForPair`, `negotiationSummary`,
`previewNegotiationEntry`, `collectTurnEvents`, `collectOpenDiploProposalQueue`,
`openDiplomacyAudienceForNegotiation`, `actionableNegotiationIdsForPair`,
`findIncomingNegotiationForAction` — dokładne linie i cytaty w recon §1b, przeczytaj każdy
przed edycją. WYKLUCZ `applyProposalOutcome` (recon potwierdził: już sparametryzowana przez
`proposerId`/`responderId`, BEZ hardkodu — nie dotykaj).

RYZYKO ŚREDNIE-WYSOKIE: część funkcji ma ścieżki UI wymagające żywego dowodu Chromium
(`handleNegotiationAccept`/`Counter`/`Reject`, `previewNegotiationEntry`, `negotiationSummary`
— panel audiencji/stołu negocjacyjnego), część to czysto silnikowe (`collectTurnEvents`,
`collectOpenDiploProposalQueue`, `resolvePendingNegotiationsForOwner`, `resolveNegotiationEntryAt`
— dowód testem jednostkowym na realnych funkcjach wystarczy, UI niepotrzebne).

REGUŁA PRZECIW SAMOOSZUKIWANIU: bramka no-op PRZED/PO (wzorem innych podetapów Etapu 6) musi
czerwienieć na wstrzykniętej mutacji. Dla ścieżek UI: żywy Chromium z realnym kliknięciem
przycisków accept/counter/reject w panelu audiencji, nie symulacja stanu. Dla ścieżek
silnikowych: wystarczy unit wołający realne funkcje (nie reimplementacja logiki równolegle —
dokładnie ten błąd, który Evaluator złapał w innym temacie tej sesji,
`P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1` runda 2 — nie powtórz go tutaj).

BINARNE KRYTERIUM SUKCESU: (1) wszystkie 14 funkcji zmigrowane, zero pozostałych literałów `0`
tam gdzie reprezentują aktywny fotel w module negotiationTable; (2) `applyProposalOutcome`
NIETKNIĘTA (potwierdź `git diff` nie zawiera tej funkcji); (3) żywa bramka Chromium dla
ścieżek UI (accept/counter/reject faktycznie klikane, stół negocjacyjny działa identycznie
PRZED/PO); (4) bramka jednostkowa dla ścieżek silnikowych, wołająca realne funkcje; (5) obie
bramki czerwienieją na mutacji.

ALLOWLISTA:
- `gra/src/main.ts` — WYŁĄCZNIE ciała 14 wymienionych funkcji (świeży `grep -n`, main.ts mógł
  się przesunąć od recon)
- `gra/tools/*-test.cjs` — nowa/rozszerzona bramka (jednostkowa + Chromium)
- `dyspozycje/autobot/runs/R-HOTSEAT-ETAP6D-PODETAP-E-Q1/*`
Zakaz `git add -A`. Zakaz dotykania `applyProposalOutcome`.

IZOLACJA: worktree `/home/user/wt-6d-PODETAP-E`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-E-Q1`,
baza `origin/main`. C-001: zakaz `npm run build`/`dev`; `tsc --noEmit` jedyna dozwolona
kompilacja; `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir`
jedyny dozwolony build do bramki Chromium.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na TYM
SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Workflow, Sonnet
5 effort high) → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
