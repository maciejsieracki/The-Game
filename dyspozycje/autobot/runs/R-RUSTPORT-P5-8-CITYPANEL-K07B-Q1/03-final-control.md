STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1
GOAL: Port K07B (15 jednostek DOM, pin edb8fb56) do frontend-v2/src/ui/cityPanel/k07b-*.ts.
ROLA: Final Control, runda 2/5, commit oceniany 3f0faf11 (baza 12574ab8 = origin/rust-port/parity-v2).

DOWÓD (samodzielny):
- git diff --name-only 12574ab8..3f0faf11: wyłącznie allowlista (run K07B, P5-8-K07B.md, PORTING-QUEUE.md, k07b-*.ts, tools/dom-harness). Brak gra/, rust-port, WERSJE.md, package.json.
- git diff --check: czysty.
- ls tools/dom-harness | grep k07: brak run-k07b-units.mjs (są tylko run-k07a-units, mutate-k07a-units).
- grep setK07aDeps/setK07bDeps w src/ poza cityPanel/k07*: 0 trafień; w diffie brak plików controller/ i viewmodel/.
- 305ad8ee: select-k07a.mjs w trybie --k07b zapisuje do runu K07B (diff potwierdzony).
- Bramki npm/cargo nie uruchamiane ponownie (brak node_modules w worktree; Evaluator i Obrona zgodnie raportują npm ci/typecheck/check EXIT 0, kopie 23/0/0, mutator kopii 83/83; cargo: diff bez Rust, INFRA). Liczby nie są sprzeczne z diffem.

ROZSTRZYGNIĘCIA ZARZUTÓW:
1. Brak harnessu DOM z pinem (run-k07b-units.mjs): NAPRAW. Kryterium dispatchu wprost; Obrona przyjmuje.
2. Brak mutacji pól DTO i behawioralnych (83/83 to tylko wierność tekstu kopii): NAPRAW. Raportować jako "bramka kopii", nie jako mutacje tematu.
3. Brak adaptera CityRefDto->CityK07 i wiringu setK07aDeps/setK07bDeps (controller/, wzór k06aWiring.ts z K06B): NAPRAW. Zadanie jawnie w zakresie dispatchu; odroczenie do "K09/integracji" bez decyzji jest niedopuszczalne.
4. Brak harnessu z prawdziwym buildChipDeltaStockHtml: NAPRAW.
5. Jednostki niewykonywalne bez wiringu (dep(...) rzuca): NAPRAW (skutek 1+3; dowód wykonalności = harness + wiring).
6. Zgodność z P5.13 / kontrakt DTO za anonimowymi dep(name): NAPRAW. Do wykazania w rundzie 3 przez typowane delegaty lub tabelę dep->źródło w kontrolerze, harness i mutacje pól DTO; tabelę było/jest w dossier §7 zweryfikować z kodem.
7. Status PASS-WITH-NOTES przy niespełnionych kryteriach: ODDAL (Obrona już zmieniła na FAIL; treść pokrywa się z 1-5). Runda 3 ma wyprodukować kod; BLOCK/DEFERRED z powodu wielkości zakresu zabronione.
8. select-k07a.mjs pisał do cudzego runu: ODDAL (naprawione w 305ad8ee, dowód w diffie).

WERDYKT: FAIL (zarzuty 1-6 NAPRAW). Nie READY_FOR_DEPLOY. Brak DECISION_REQUIRED: żadnej realnej decyzji produktowej, luki to zadania wykonawcze.

ZAŁOŻENIE (kolejność względem origin/rust-port/parity-v2): 12574ab8 jest przodkiem 3f0faf11; K07B NIE jest do integracji w tym stanie. Po rundzie 3 (PASS) integrować dopiero po rebase/merge z aktualnym parity-v2 (równolegle K08A), z ponowną bramką npm run check + typecheck.

WYMAGANIA RUNDY 3 (Operator-impl, ten sam ID, baza 3f0faf11):
a) run-k07b-units.mjs: harness DOM z pinem dla 15 jednostek, z prawdziwym buildChipDeltaStockHtml (wzór run-k05b/k06a/k06b-units).
b) Mutacje pól DTO + behawioralne (dziedziny brzegowe), każdy mutant zabity; osobno od bramki kopii.
c) Adapter CityRefDto->CityK07 + wiring setK07aDeps/setK07bDeps w controller/ (tylko dopiski), z testem w harnessie; brak wyjątków dep().
d) Aktualizacja dossier §7 (tabela było/jest, zmiany API), PORTING-QUEUE, nagłówek rundy.
e) Commit po każdym kroku, jawny git add, bez push, npm run check + typecheck zielone.

ZMIANY/COMMIT: ten plik (commit Final Control) na bazie 3f0faf11.
TESTY: jak wyżej (dowód diff/grep; liczby npm z raportów Evaluatora i Obrony).
BLOKADY: brak decyzji ludzkich; Rust clippy/test INFRA (środowisko).
RUNDY: 2/5; następna 3/5.
NASTĘPNY KROK: Operator-impl r3.
DEPLOY/PUSH: NIE WYKONANO
