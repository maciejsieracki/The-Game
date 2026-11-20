# R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1 — Operator (SONNET), runda 3/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PLAYER-IN-ALL-ERAS-AND-MEASURE-Q1
GOAL: gracz jako cel wojen epoki Kamienia/Brązu/Żelaza jak AI; narzędzie pomiarowe; bieg dymny 120 tur × 2 ziarna; test sekwencji; bez zmiany progów/liczników/kosztów.
BAZA: 8af54d2dc (`git checkout --detach`). node_modules: własna kopia (134 MB) w worktree, nie symlink.

ZMIANY-COMMIT (allowlista): gra/src/main.ts, gra/src/game/war-rules-multiwar.ts, gra/tools/era-war-measure-run.cjs, gra/tools/era-war-engine-scenario-test.cjs, gra/tools/forced-war-iron-main-guard-test.cjs, ten raport. war-rules-params.json bez zmian.

## Co zrobiono

1. Hak `__eraWarMeasure` (tylko odczyt): nowe `rejections()` — każda komenda wojny epoki AI odrzucona w main.ts z powodem: `evaluateEraForcedWarGate:*`, `evaluateInterCivWarGate:*`, `typCityCopyOwner`, `isWarTreatyBlocked(sojusz/NAP/pokoj)`, `stone-/iron-alliance-guard`, `warLimitAllowsDeclaration`, `filtered-before-gate(layer/contact)` (komenda wygenerowana, ale odfiltrowana warstwą), `pairing-unresolved`. `attempts()` ma teraz stan wojny naturalnej i wojny epoki napastnika i celu (`attackerNaturalWars`, `targetNaturalWars`, `attackerEraWarActive`, `targetEraWarActive`). Nic nie zmienia decyzji gry.
2. Runner `era-war-measure-run.cjs` WZNAWIALNY: `--ckpt N` zapisuje slot `eraw-<seed>` realną ścieżką gry (`__truceTestDebug.saveForTest`), `--resume 1` wczytuje slot (`loadForTest`) i dopisuje do JSONL; zapis końcowy przy wall-limit; rekord tury zapisywany PRZED sprawdzeniem limitu (wcześniej gubił turę). Odcinki ≤ 8 min.
3. Poprawka reguły (zarzut 5, znaleziona pomiarem): w biegu seed 4242 AI1 było w wojnie NATURALNEJ z graczem; `isPlayerPairGateOpen` mimo to wybierało je na partnera pary gracza w t117–t120 (4 tury), a ai.ts nie wypowiada wojny celowi z `stanWojny` — partner „wisiał" i blokował innych kandydatów. Dodano `&& getDiploRelation(aiOwnerId, 0).status !== 'wojna'`. Po poprawce: t117 wojna Żelaza AI19 → gracz.
4. Zapis wejścia gracza (zarzut 6): `reconcilePlayerEraFromResearch` zapisuje wejście także gdy go brak mimo epoki ≥2/≥3 (obok istniejącego backfillu w bramce puli). Dowód w biegu: seed 4242, gracz e2=77, `wejscieBrazTura`=77 (ten sam rekord, odcinek BEZ wznowienia). Źródło dawnego braku wpisu NIE ustalone jednoznacznie (jedyne przypisanie `player.era` w tym torze to reconcile); zabezpieczenie jest przy źródle zmiany epoki.
5. `eraWarTargetDelayOk` wyciągnięte do czystej `isEraWarTargetDelayOk` (war-rules-multiwar.ts), main.ts ją woła (zachowanie 1:1) — test silnikowy woła tę samą funkcję.
6. Test sekwencji `era-war-engine-scenario-test.cjs` rozszerzony (S6–S9): Kamień trwa → Brąz pending → pokój (t85) → start w pierwszej turze po pokoju (t86, cel gracz 0); to samo gdy blokadą była wojna naturalna (fallback, cel 3); opóźnienie 40 tur AI; AI w wojnie z graczem nie jest partnerem (S7b); piny main.ts (S9). Realne funkcje: `isEligibleForBronzeForcedWar`, `isEraWarTargetDelayOk`, `isPlayerEligibleForEraWarPool`, `assignForcedWarPairings` (esbuild). UCZCIWIE: pętla main.ts jako całość nie wykonuje się w node; sekwencja jest lustrem jej kroków na realnych funkcjach, wiązanie main.ts pilnują piny. Mutacje (MUTATE=): `delay` 22/1 czerwony (S8b), `wiring` 21/1 (S9), `gate` 21/1 (S9), `nobackfill` 19/3. Bez mutacji 23/0.
7. `forced-war-iron-main-guard-test.cjs`: pin guardu sojuszu Żelaza dopuszcza opcjonalne `emRej('…');` przed `continue` (pomiar); reszta asercji bez zmian.

## BIEG DYMNY (surowe, final build, gracz AI, flagi domyślne, start Kamień, 120 tur, rekordy t2–t120 bez luk)

seed 4242 | wypowiedziane (tura napastnik→cel):
- Kamień 3: t40 1→16, t40 4→GRACZ, t40 7→10 (cel=gracz 1)
- Brąz 3: t79 13→19, t84 10→16, t92 1→7 (cel=gracz 0; gracz wszedł w Brąz t77, próg 40 → t117)
- Żelazo 3: t109 10→4, t117 19→GRACZ (77+40=117), t118 13→16 (cel=gracz 1)
- Odroczenie Brąz/Żelazo: po 40–51 tur od wejścia napastnika (pending→wojna). Brak wojny do t120: Brąz AI4 (pending od t41), Żelazo AI1 (od t69), AI7 (od t78).

seed 7:
- Kamień 3: t40 1→GRACZ, t40 7→13, t40 16→19 (cel=gracz 1)
- Brąz 3: t79 4→10, t81 1→7, t91 13→16 (cel=gracz 0; gracz do t120 w Kamieniu, bez wejścia w Brąz)
- Żelazo 3: t105 4→19, t107 1→10, t112 13→7 (cel=gracz 0)
- Odroczenie 40–44 tur od wejścia. Brak wojny do t120: Brąz AI19, Żelazo AI16 (wejście t82).

Wnioski: (a) Brąz i Żelazo wybuchają po 40–51 turach od wejścia napastnika, nie wisną w nieskończoność; (b) gracz był celem Kamienia w obu ziarnach (zarzut 5 — dowód z biegu), celem Żelaza raz (seed 4242, t117, dokładnie próg) i nie był celem Brązu w żadnym (gracz wszedł w Brąz późno/wcale); (c) odrzucenia bramki main: seed 4242 jedno `civ-cap-target` (Brąz); `pairing-unresolved(sojusze)` 24 tury (4242) i 18 tur (7). Próby przydziału bez wypowiedzenia (7 i 6) to druga, lustrzana strona pary AI↔AI (wypowiada jedna).

Zastrzeżenia: bieg jest w odcinkach z zapisem/wczytaniem slotu (3 odcinki/ziarno); NIE ZMIERZONO, czy wznowienie jest bit-w-bit równoważne biegowi ciągłemu. Artefakt wznowienia: wczytanie zapisu uruchamia `backfillMissingEraEntryTurns` dla Żelaza także dla właścicieli w epoce 2 (stąd `wejscieZelazoTura` gracza=87 mimo epoki 2) — nieszkodliwe (nadpisywane przy realnym wejściu), do rozważenia osobno. Hak `rejections()` w biegu nie zarejestrował odrzuceń po stronie ai.ts (brak komendy) — to są próby bez wypowiedzenia powyżej.

## BRAMKI (surowe wyjście, ten worktree)
tsc --noEmit exit 0 (bez flag); logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6;
forced-war-bronze 48/0; iron 55/0; stone 31/0; multi-turn 48/0; era-war-delays 55/0; ignore-treaties 22/0; defer-not-cancel 29/0; player-included 10/0; bronze-player-target 44/0; engine-scenario 23/0;
main-guardy: bronze 22/0, iron 36/0, stone 15/0.

BLOKADY: brak. UWAGI-DLA-ORKIESTRATORA: (1) `pairing-unresolved(wszystkie pary zablokowane sojuszem)` trzyma pending (4242: Brąz AI4 przez całe 120 tur; seed 7: AI19/AI16) — gałąź ECHO DECISION_REQUIRED w main.ts, nie zmieniana; kandydat na osobny temat. (2) Pozostawiono katalogi tymczasowe poza repo (/tmp/claude-0/ew4: dist, profile, JSONL) — do sprzątnięcia. (3) gra/node_modules w worktree to nieśledzona kopia.
RUNDY: 3/5 (FC r2: FAIL).
NASTĘPNY KROK: Evaluator → Obrona → Final Control.
DEPLOY/PUSH: NIE WYKONANO
