STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB — `gra/`)
TEMAT: R-WEB-SAVELOAD-PRACA-POOL-Q1
GOAL: wczytanie zapisu zachowuje pule Pracy gracza (decyzja ABC A, 2026-10-31); ograniczana jest tylko wartosc nierealna, przy bardzo wysokim progu uzasadnionym danymi.
ZMIANY/COMMIT: SHA w sekcji "COMMIT" na koncu pliku (commit osobny, zawiera ten raport). Allowlista: `gra/src/main.ts` (tylko odczyt/zapis puli Pracy + hak testowy), `gra/tools/saveload-praca-pool-live-test.cjs` (nowy), `dyspozycje/autobot/runs/R-WEB-SAVELOAD-PRACA-POOL-Q1/**`. Zero zmian: gra-robocza, WERSJE.md, rust-port, src-tauri, auto-improvements.ts.
TESTY: patrz nizej.
BLOKADY: brak (notatki: N1-N4).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (te same ID), potem Obrona i Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Rozpoznanie (plik:linia na stanie PRZED zmiana, HEAD 9e54b96f8)

- Zerujacy warunek: `gra/src/main.ts:42668-42674` (numery dispatchu 42491-42497 sa nieaktualne): `maxReasonablePracaPool = Math.max(50, playerCityCountOnLoad*100)`; `if (playerPracaPool > max) { console.warn("... stary bug map-total — reset do 0"); playerPracaPool = 0 }`. Odczyt: `main.ts:42660-42661`; zapis: `main.ts:33433` (`playerPracaPool` w `meta`).
- Historia: `git log -S"map-total" -- gra/src/main.ts` oraz `-S"maxReasonablePracaPool"` zwracaja WYLACZNIE `dd9087002` ("Eksport ROBOCZA e1e0e528 — playtest 2026-07-06", zbiorczy eksport). Oryginalny commit/opis buga NIE jest w historii repo. Co do mechanizmu "map-total" (suma po calej mapie zamiast per-miasto) — NIE_ZMIERZONO / NIE_DO_ODTWORZENIA z historii; wniosek z nazwy komentarza, nie z kodu. Czy nadal mozliwy: obecne zrodla puli to `setOwnerPracaPool` per owner (`main.ts:31395`) i doPuli/overflow per miasto (`main.ts:35825-35858`); nie znalazlem sciezki zasilajacej pule suma mapy (grep `playerPracaPool` — wszystkie zapisy to +=/-= konkretnych kwot lub przypisanie z presetu `main.ts:41662`).
- Ten sam zerujacy warunek w innych miejscach: NIE. `grep "map-total\|maxReasonable"` w `gra/src` — jedyne trafienie to powyzszy blok. Pula AI (`aiPracaPoolByOwner`, `main.ts:42218-42220`) wczytywana bez limitu. Presety (`main.ts:41662`) i nowa gra (`main.ts:40794` = 0) bez limitu.
- Hot-seat: `pracaPoolByHuman` (`main.ts:12295`) NIE jest serializowane w snapshocie (w `meta` jest tylko `playerPracaPool` = fotel glowny, `main.ts:33433`, i `aiPracaPoolByOwner`, `main.ts:33506`). `setOwnerLastPraca` nie dotyka zapisu. Zerujacy warunek dotyczyl wiec tylko puli fotela 0. Patrz N1.

## 2. Pomiar na realnej grze (Chromium, realny vite build do /tmp, REALNE buildSaveGameSnapshot -> JSON -> restoreGameFromSave)

Test: `gra/tools/saveload-praca-pool-live-test.cjs`, 1 miasto gracza (P0).
PRZED (stare zachowanie, `evidence/RED-measure.json`, `evidence/RED-mutacja-stare-zachowanie.txt`):
- pula 405 -> 0; 1500 -> 0; 5000 -> 0 (przy 1 miescie)
- stary zapis 1_000_000 -> 0; 999_999 -> 0; 5e9 -> 0; -5 -> -5 (ujemna przechodzila)
- hot-seat: fotel 0 pula 405 -> 0
- wynik: 5 pass / 8 fail
PO (`evidence/GREEN-live.txt`, `evidence/GREEN-measure.json`): 13 pass / 0 fail
- 405 -> 405; 1500 -> 1500; 5000 -> 5000; 5e9 -> 1_000_000 (przyciete); 1_000_000 -> 1_000_000; 999_999 -> 999_999; -5 -> 0; "abc" -> 0; null -> 0; 0 -> 0
- hot-seat: fotel 0 405 -> 405 przy dwoch fotelach; zero pageerror/console.error.

## 3. Implementacja (`gra/src/main.ts`)

- Nowe `PRACA_POOL_LOAD_SANITY_MAX = 1_000_000` + `sanitizeLoadedPracaPool(raw)` (przed `let playerPracaPool`, ok. `main.ts:12700-12720`): nie-liczba/NaN/Infinity/ujemna -> 0; > 1_000_000 -> przyciecie DO progu z `console.warn`; reszta bez zmian.
- Wczytanie (`main.ts` blok `playerPracaPool = sanitizeLoadedPracaPool(saved.meta?.playerPracaPool)`) zastapilo stary kod; usuniety blok `maxReasonablePracaPool`/reset do 0.
- Hak testowy `window.__pracaPoolSaveLoadTestDebug` (getPool/setPool/getOwnerPool/cityCount/roundTrip) — zero reimplementacji, wola realne `buildSaveGameSnapshot`/`restoreGameFromSave`.
- Uzasadnienie progu: najwieksza zmierzona realna pula 405 (t5) i 398 (t17) wg dispatchu/`evidence/A-save-zywnosc-seed778899.json` runu R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1; 1_000_000 to ~2500x tej wartosci, a zarazem dokladnie wartosc, ktora hak `foundPlayerCity` (`main.ts` ok. 26525) wpisuje celowo (musi przezyc round-trip). Dane z historii buga: NIE_ZMIERZONO (brak w repo, patrz pkt 1). Pule po 300+ turach: NIE_ZMIERZONO.
- Migracja starych zapisow: bez zmiany formatu (pole `meta.playerPracaPool` bez zmian). Stary zapis z realna pula (np. 405) wczytuje sie TERAZ z pula, a nie z zerem; stary zapis z wartoscia > 1_000_000 jest przyciety do 1_000_000; brak pola -> 0 (jak dotad).

## 4. Testy i bramki

- Mutacja (powrot do `> max(50, miasta*100) -> 0`): `saveload-praca-pool-live-test` pada 5 pass / 8 fail (log RED); po przywroceniu poprawki 13/0. Mutacja zrealizowana jako chwilowa edycja main.ts, przywrocona (potwierdzone: `grep MUTACJA` = 0).
- `npx tsc --noEmit` (TS z `npm ci`): EXIT=0.
- Bramki wymagane PRZED (HEAD, `evidence/pre/gate-*.txt`) i PO (`evidence/po/gate-*.txt`), identyczne: diplomacy 148/0; war-era-counter 82/0; unit-owner-emblem-ring-civ-color ("ring") 15/0; autoimprove-stages-q1 184/0; auto-improvements 46/0; ai-improvements 53/0; city-clears-forest 18/0; fort-outpost-hard-territory 80/0; defeat-last-city 14/0. Kazdy `gate-*.txt` konczy sie linia `EXIT=`.
- Testy zapisu/wczytania z `git grep -l "buildSaveGameSnapshot\|restoreGameFromSave" gra/tools` (nie-live): uruchomiono 21, PO PASS dla 13; 6 FAIL jest TAKICH SAMYCH PRZED zmiana (pre-istniejace, tekstowe kotwice w main.ts / INFRA): ai-dlug-porzadki-q1-test (crash modulu), citizen-resource-upkeep-test (107/2), army-stack-commander-identity-test (Error), march-attack-queue-persist-test (55/2, liczniki wywolan), okolica-load-reconcile-test (21/2), resource-usage-breakdown-test (98/2). Zero regresji.
- NIE_URUCHOMIONE / NIE_ZAKONCZONE: hotseat-etap4-noop-test (live, ubity po ~500 s w turze 5, `po/gate-hotseat-etap4-noop-test.txt`, EXIT=137 — INFRA, hash-e tur do tego momentu identyczne); hotseat-dyplo-kontakt-per-fotel-test (EXIT=2, TimeoutError `.civ-newgame .start` — INFRA Chromium, nie porownane PRZED); ciezkie live: hotseat-etap6d-podetap-c-live-saveload, interaction-latency-vs-citycount-live, perf-large-empire-stress-live, ai-buduje-budynki, ai4-*, ai5-*, fc5-*, ev5-* (pominiete: czas/obciazenie; pierwsze trzy niezwiazane z pula Pracy poza round-tripem pokrytym moim testem).

## 5. Notatki

- N1 (poza zakresem, do decyzji orkiestratora): pula Pracy FOTELA 2+ w hot-seat NIE jest w snapshocie (`pracaPoolByHuman`, `main.ts:12295`, brak w `meta`). W tescie in-process pula fotela 1 (77) przetrwala `restoreGameFromSave` tylko dlatego, ze mapa zyje w pamieci; po swiezym zaladowaniu strony prawdopodobnie 0 (`main.ts:12418`/`26589` tworza `{praca:0}`) — NIE_ZMIERZONO na swiezym zaladowaniu. Wymaga osobnego tematu (zmiana formatu zapisu).
- N2: dispatch podawal numery linii 42491-42497; w tym HEAD blok stoi na 42668-42674 (przesuniecie po wczesniejszych merge'ach).
- N3: 21 testow zapisu/wczytania uruchomiono na PO; PRZED uruchomiono wylacznie 6 padajacych + 9 wymaganych (reszta zielona PO, wiec porownanie PRZED nie bylo potrzebne).
- N4: node_modules (`npm ci`) i scratch /tmp usuniete na koniec.

## COMMIT
(uzupelnione po commicie — patrz odpowiedz koncowa Operatora; commit zawiera ten plik)
