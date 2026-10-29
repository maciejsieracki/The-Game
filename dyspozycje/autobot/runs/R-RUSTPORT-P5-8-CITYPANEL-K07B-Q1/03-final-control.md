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

---

# Final Control, runda 3/5 (commit oceniany 238eb5e4, baza kodu 12574ab8)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1

## Orzeczenia wobec zarzutow Evaluatora r3 i obrony
1. Dossier: 63 vs 53 nazw. ODDAL (naprawione w 238eb5e4; dossier §3 K07B-Z2 i linia 41 podaja 53, zgodne z dep() w kodzie).
2. PORTING-QUEUE: sprzeczny NIE_ZMIERZONO. ODDAL (usuniety; grep "r2 nie zdazyl" pusty).
3. Wykonalnosc jednostek na domyslnym wiringu. ODDAL (K07B-Z8: neutralne atrapy resolveOrderState/getProd; smoke sekcja D 45/45 bez wyjatku; mutanty M17/M18 zabite). Ograniczenie: smoke sprawdza brak wyjatku, nie tresc; produkcyjny wywolujacy = K09.
4. Kopia chipDeltaStockHtmlK07 poza bramka tekstu. ODDAL (zgodnosc behawioralna z prawdziwym buildChipDeltaStockHtml, siatka 225 par, 0 niezgodnosci; mutanty M05-M07 zabite). Uwaga drobna: ryzyko dryfu po pinie.
Zero NAPRAW, zero DO DECYZJI CZLOWIEKA.

## Weryfikacja wlasna (pin edb8fb56 w scratchpadzie, 238eb5e4)
- npm ci EXIT 0
- run-k07b-units.mjs --pin-dir: EXIT 0; comparisons=335, diffs=0, wiringFails=0, przypadkiZBledem=0, smoke 45/45
- verify-k07b-copies.mjs: EXIT 0; bloki=23, niezgodne=0, ORPHAN=0
- mutate-k07b-units.mjs 1-16 EXIT 0, 17-31 EXIT 0 (wszystkie zabite, w tym Z13)
- npm run check EXIT 0; npm run typecheck EXIT 0
- git diff --check 12574ab8..238eb5e4 czysty
- Allowlista: tylko k07b-*, controller/k07bWiring.ts, tools/dom-harness, PORTING-QUEUE.md, P5-8-K07B.md, run K07B. Brak gra/, rust-port, WERSJE.md, package.json.
- Rust/cargo: nie dotyczy (brak plikow Rust w diffie; clippy INFRA GTK).

## Integracja
SHA do integracji: 238eb5e4 (+ commit tego raportu). origin/rust-port/parity-v2 = 6daf5ed1 (K08A zintegrowane); baza K07B 12574ab8 nie jest przodkiem. Merge-tree: jedyny konflikt = src-tauri/frontend-v2/PORTING-QUEUE.md (rozwiazac recznie, zachowac wpisy K08A i K07B). Kolejnosc: K07B po K08A; po rebase powtorzyc check, typecheck, run-k07b-units.
NIE_ZMIERZONO: przegladarka, produkcyjny wywolujacy (K09), rebase.
RUNDY: 3/5
DEPLOY-PUSH: NIE WYKONANO
