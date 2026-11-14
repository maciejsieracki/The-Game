STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza; zmian logiki gry brak)
TEMAT: R-WEB-DETERMINISM-WAR-T19-DIVERGENCE-DIAG-Q1
GOAL: znaleźć źródło niedeterminizmu przebiegu wojny gracz↔AI (rozjazd digestu od tury 19/20) i rozstrzygnąć: (a) realny defekt silnika → minimalna poprawka albo (b) artefakt harnessu → udokumentować.

## Baza i kandydat
- Start: 714de7e74 (raport operatora 10-operator-claude.md), detach w worktree `wf_c1b95947-78e-3`, czysty przed pracą.
- Zmiany tej rundy: dwa pliki narzędzi w `gra/tools/` (commit obrony) i raport `30-obrona-claude.md`. Kod `gra/src` nietknięty.

## Odpowiedzi na zarzuty Evaluatora (45b7fcb1f)

| Nr | Zarzut | Werdykt | Dowód / poprawka |
|---|---|---|---|
| 1 | Skrypty `determinism-war-t19-diag-dump.cjs` i `-cmp.cjs` nie zacommitowane | PRZYJMUJĘ | Oba pliki skopiowane z worktree operatora (`wf_c1b95947-78e-1/gra/tools/`) do `gra/tools/` i dodane do commitu obrony. Dodano w dumpie zmienną `FAST_MODE=0` (wyłącza `setFastMode(true)`, linia ~97) potrzebną do kontroli z zarzutu 2. Reszta logiki runnera bez zmian. |
| 2 | Kontrola bez trybu przyspieszonego niewykonana; etykieta „ODRZUCONE” zawyżona | PRZYJMUJĘ (wykonano) | Pomiar wykonany, patrz sekcja „Kontrola bez trybu przyspieszonego” niżej. Hipoteza trybu przyspieszonego: ODRZUCONE z pomiarem (rozjazd występuje też bez trybu). Hipoteza „zamrożony zegar + zwykły tryb”: zmierzona, 22/22 identyczne. |
| 3 | Math.random (combat.ts:890, siege.ts:659) oznaczone ODRZUCONE, a powinno być NIE_ZMIERZONO; nie sprawdzono przekazywania `rng` w battleScene.ts:20838 i manualBattle.ts:1062 | PRZYJMUJĘ (relabel + sprawdzenie) | Sprawdzenie statyczne: `battleScene.ts:20838` i `manualBattle.ts:1062` wołają `resolveCombat(...)` bez pola `rng` (grep `rng` w tych plikach przy wywołaniu: brak). `combat.ts:890` ma `opts.rng ?? (() => Math.random())`, więc w tych ścieżkach walka używa Math.random. Czy w 22 turach scenariusza zaszła walka: NIE_ZMIERZONO. Patrz UWAGA-1. |
| 4 | Zakres digestu (units/cities) i brak kolejek negocjacji w pamięci: zbyt mocne „NIE jest błędem logiki gry” | PRZYJMUJĘ (zawężenie) | Wniosek zawężony: „w polach objętych pomiarem (units, cities, zapis bez stackGroupId/savedAt, diploRelations, gracze, tradeRoutes, cityProd, aiResearchDone) do T21 nie ma innej różnicy niż stackGroupId”. Kolejki negocjacji w pamięci: NIE_ZMIERZONO. |
| 5 | stackGroupSeq po wczytaniu NIE_ZMIERZONO; opcja (b) maskuje; cities.ts:89 niezbadany | PRZYJMUJĘ (zbadano statycznie, reszta NIE_ZMIERZONO) | Patrz sekcja „Dług statyczny” niżej. |

## Kontrola bez trybu przyspieszonego (zarzut 2) — pomiary

Konfiguracja: runner `gra/tools/determinism-war-t19-diag-dump.cjs`, `FAST_MODE=0 NOTRACE=1 WAR_SEED=271828 WAR_TURNS=22`, bez FIXED_NOW (kontrola nr 1), potem z `FIXED_NOW=1` (kontrola nr 2). Bundle vite zbudowany poza repo: `scratchpad/b1/bundle` (`node ./node_modules/vite/bin/vite.js build --outDir ... --emptyOutDir`, rc=0). `gra/node_modules` podlinkowane (symlink, git-ignored) do `wf_c1b95947-78e-1/gra/node_modules`.

Wyniki (`turns[].digest`, stoppedBy=koniec zakresu w każdym przebiegu, 22 tury):

Kontrola 1: zwykły tryb, BEZ zamrożenia zegara, seed 271828, przebiegi A i B
- T2–T18: identyczne (`=`)
- T19: `8084e1cf:144` vs `251adb51:144` — rozjazd
- T20–T23: rozjazd (`3c73320b` vs `4d5d3902`, `80189171` vs `c5d66471`, `b3b2d5b2` vs `caca752b`, `d0fa99d0` vs `a82ad4d2`)
- Wniosek: rozjazd od T19 występuje także bez trybu przyspieszonego. Tryb przyspieszony NIE jest przyczyną. Etykieta: ODRZUCONE (zmierzone).

Kontrola 2: zwykły tryb, Z zamrożonym `Date.now` (`FIXED_NOW=1`), seed 271828, przebiegi A i B
- Digesty T2–T23: 22/22 identyczne.
- Wniosek: zamrożenie zegara usuwa rozjazd także w zwykłym trybie. Wynik zgodny z operatorem (tryb przyspieszony, 22/22). Mechanizm Date.now potwierdzony niezależnie od trybu przyspieszonego.

Pliki wyników (poza repo, scratchpad): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/b1/nofast-271828-A.json`, `.../nofast-271828-B.json`, `.../nofast-fixed-271828-A.json`, `.../nofast-fixed-271828-B.json`.

Ograniczenie: kontrola 2 porównuje digesty, nie pełny zrzut. Pole-level („tylko stackGroupId”) w zwykłym trybie nie zostało ponownie zrzucone (DUMP_DIR/SNAP nieuruchomione w tej rundzie); pole-level pochodzi z pomiaru operatora w trybie przyspieszonym. Różnica zwykłego trybu w polach poza digestem: NIE_ZMIERZONO.

## Tabela hipotez (zaktualizowana)

| Hipoteza | Werdykt | Dowód |
|---|---|---|
| Date.now w ID stosu (`stackGroupId`) wpływa na digest | PRZYCZYNA (źródło rozjazdu digestu) | armyMerge.ts:75 `'sg'+ownerId+'_'+Date.now().toString(36)+'_'+seq`; zamrożony zegar 22/22 w obu trybach (kontrola 2 i operator, FIXED_NOW) |
| Rozjazd zachowania gry od `stackGroupId` | ODRZUCONE (dla pól zmierzonych) | `stackGroupIdOf(a)===stackGroupIdOf(b)` (armyMerge.ts:67, map-attack-city.ts:60/95, main.ts:34843); brak sortowania po ID; pełny zapis różni się tylko ID i savedAt do T21 (pomiar operatora) |
| Tryb przyspieszony jako przyczyna | ODRZUCONE (zmierzone) | kontrola 1: rozjazd T19 bez trybu przyspieszonego (`FAST_MODE=0`) |
| Math.random w ścieżce walki | NIE_ZMIERZONO (czy walka zaszła w 22 turach) | combat.ts:890 i siege.ts:659 fallback; battleScene.ts:20838 i manualBattle.ts:1062 bez `rng`; patrz UWAGA-1 |
| Timery EOT / asynchroniczne endTurn | ODRZUCONE | runner czeka na `turn>t && !isEndTurnInProgress()`; zamrożenie Date.now daje 22/22 przy zwykłym endTurn |
| Wygasanie ofert (NEGOTIATION_EXPIRY_TURNS=5), cooldowny, zmęczenie 0,95/1,0, progi desperacji 90/100% | ODRZUCONE dla rozjazdu | pełny zapis (pomiar operatora) identyczny w dyplomacji T19–T21; progi deterministyczne |
| Dosypki NNS / odrzucanie ofert przez runner | ODRZUCONE jako przyczyna | ta sama sekwencja w obu przebiegach |
| `cities.ts:89` i `main.ts:9639` (`budowa-lista-${Date.now()}`) | NIE_ZMIERZONO | nie w zakresie digestu (units/cities); czy ID szablonu trafia do zapisu i stanu miasta: nie sprawdzono w scenariuszu |
| `save.ts:1091–1107` (`zapis-${Date.now()}`) | ODRZUCONE (poza stanem gry) | etykiety slotów zapisu |

## Pierwszy rozbieżny podsystem i pole
Jednostki (armia AI, ownerId=1): `units[*].stackGroupId`, tworzone przy scalaniu (`assignSharedStackGroupId`, armyMerge.ts:79–87; setup.ts:151). Pierwsza różnica: T19 dla 271828, T20 dla 314159 (zgodnie z r3 i pomiarem operatora). Inne podsystemy (dyplomacja, ekonomia, AI, kolejki) bez różnicy w zakresie pomiaru do T21.

## Dług statyczny (zarzut 5)
- `stackGroupSeq` (armyMerge.ts:70,74,75) jest modułowym licznikiem. Poza tymi trzema wystąpieniami nie ma w `src` odczytu ani zapisu (grep `stackGroupSeq` w gra/src). Oznacza to, że po wczytaniu zapisu licznik zaczyna od 0. Unikalność w nowej sesji opiera się wtedy wyłącznie na prefiksie `Date.now()`. Zachowanie to NIE_ZMIERZONO w scenariuszu z wczytaniem (runy były ciągłe). Konsekwencja dla opcji (a): deterministyczne ID wymaga trwałego licznika w zapisie i decyzji o formacie zapisu.
- Opcja (b) (normalizacja w digest) maskuje niedeterminizm ID, nie usuwa go. Nie wdrażana (poza zakresem, zgodnie z dispatchem).

## UWAGA-1 (poza zakresem; do osobnej decyzji orkiestratora)
Ścieżki walki ręcznej i bitwy scenicznej nie przekazują `rng` do `resolveCombat` (battleScene.ts:20838, manualBattle.ts:1062), więc wyniki trafień w tych ścieżkach zależą od `Math.random`. Tematy #362 (walki auto i oblężenia) zamknięto, lecz z tych grepów wynika, że wstrzyknięcie RNG nie obejmuje tych dwóch wywołań. NIE_ZMIERZONO: czy to realny rozjazd w grze (wymaga przebiegu z walką). Nie naprawiano tutaj.

## Skrypty i reprodukowalność
- Commitowane: `gra/tools/determinism-war-t19-diag-dump.cjs` (runner z dodanym `FAST_MODE`, `FIXED_NOW`, `DUMP_DIR`, `SNAP`), `gra/tools/determinism-war-t19-diag-cmp.cjs` (porównanie JSON po ścieżkach).
- Komendy kontroli 1 i 2: `cd gra && BUNDLE_DIR=<abs> SKIP_BUILD=1 FAST_MODE=0 [FIXED_NOW=1] NOTRACE=1 WAR_SEED=271828 WAR_TURNS=22 MAX_SEC=470 RESULT=<abs.json> node tools/determinism-war-t19-diag-dump.cjs`. Każdy przebieg ~5 min (w tym build przy pierwszym uruchomieniu).

## Bramki
- `tsc --noEmit -p gra/tsconfig.json`: rc=0 (surowe wyjście: brak błędów, kod exit 0).
- `git diff --check`: patrz wynik poniżej w sekcji TESTY.
- Gry nie dotyczy: zmiany tylko w `gra/tools/` i w raporcie.

## TESTY
- Kontrola 1 (zwykły tryb, bez FIXED_NOW, A vs B, seed 271828): 18 identycznych digestów (T2–T18), rozjazd od T19 (22 tury, stoppedBy=koniec zakresu w obu).
- Kontrola 2 (zwykły tryb, FIXED_NOW=1, A vs B, seed 271828): 22/22 identycznych digestów.
- Nie powtórzono: seed 314159 (zostaje z pomiaru operatora, 22/22 przy FIXED_NOW w trybie przyspieszonym).
- tsc rc=0.

## BLOKADY
Brak blokad technicznych. Ograniczenia: NIE_ZMIERZONO (patrz tabela); kontrola 2 bez pola-level dumpu w zwykłym trybie.

## RUNDY
1/5 (obrona r1, odpowiedzi na zarzuty 1–5).

## NASTĘPNY KROK
Orkiestrator: (1) rozstrzygnąć opcję normalizacji digestu (b) lub deterministycznego ID (a), z decyzją o formacie zapisu; (2) osobny temat dla UWAGI-1 (rng w bitwie ręcznej i scenicznej) z dowodem przebiegiem z walką; (3) test regresji z FIXED_NOW (dwa przebiegi, identyczne digesty przez 22 tury, oba ziarna) — w osobnym temacie.

## UWAGI-DLA-ORKIESTRATORA
- Nie założono żadnych sesji, zadań ani wyzwalaczy (zakaz zachowany).
- `gra/node_modules` podlinkowane jako symlink do worktree `wf_c1b95947-78e-1` (git-ignored); do sprzątania.
- Bundle i JSON-y w scratchpadzie; nie w repo.

DEPLOY/PUSH: NIE WYKONANO
