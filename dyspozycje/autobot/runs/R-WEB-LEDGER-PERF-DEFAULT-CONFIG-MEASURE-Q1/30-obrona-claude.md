# R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 — obrona Operatora na zarzuty Evaluatora (runda 3/5)

STATUS: PASS-WITH-NOTES (korekty faktów i interpretacji; werdykt progu 10% bez zmian: NIE ROZSTRZYGNIĘTE)
DOMAIN: GAME (tylko pomiar; w tej rundzie kod gry bez zmian, commit zawiera wyłącznie ten raport)
TEMAT: R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1
GOAL: odpowiedzieć na każdy z 6 zarzutów Evaluatora (kandydat 9ae009803, raport 32a98a20), skorygować fakty w raporcie 10-operator-claude.md i rozstrzygnąć, czy pomiar uzupełniający jest wykonalny w tej rundzie.

BAZA: origin/main 459354a12e00eb04cc8365c5ac03a03c2ffec999 (przodek kandydata: potwierdzone `git merge-base --is-ancestor`).
KANDYDAT zarzutów: 9ae0098038152132cf4cb59d7fde8611ac526519 (worktree ustawiony na ten SHA przed analizą).
Raport 10-operator-claude.md NIE jest edytowany (historia); korekty są w tym pliku.

## ODPOWIEDZI NA ZARZUTY

| Nr | Zarzut Evaluatora | Decyzja | Dowód / uzasadnienie |
|---|---|---|---|
| 1 | Brak evidence seed 777 i uptime.log, mimo deklaracji w raporcie i w opisie commita 9ae009803 | PRZYJMUJĘ (korekta) | `git ls-tree -r --name-only 9ae0098 -- .../R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1` zwraca wyłącznie `10-operator-claude.md`, `evidence/dist-md5.txt` i pliki `evidence/s4242/*`. Brak `evidence/s777/` i brak `uptime.log`. Opis commita 9ae009803 („evidence seed 777 (log)”) jest nieprawdziwy; commit faktycznie zmienia jeden plik (raport). Częściowy przebieg seed 777 (ON1, 50→70, przerwany przy load 7,3) NIE jest zachowany i NIE jest wynikiem; nie jest raportowany jako dane. |
| 2 | Reguła load <= 3,0 naruszona w danych użytych do analizy; opis ON2 („2,0–3,3”) nieprawdziwy | PRZYJMUJĘ (korekta liczb) | Przeliczenie z `evidence/s4242/pairs-4242.csv`, 27 tur okna (52–80 bez rozgrzewek 51/61/71): OFF2 śr. load1 3,02, tur > 3,0: 9, max 8,54; ON2 śr. 2,87, tur > 3,0: 15, max 3,78; ON1 śr. 1,20, max 1,47; OFF1 śr. 1,26, max 1,68. Zdanie „trzeci (uzyty) przy 2,0–3,3” jest nieprawdziwe i wycofane. Twierdzenie „0 tur spełnia warunek dla wszystkich 4 przebiegów” też jest błędne: 12 tur spełnia (58, 59, 60, 62–70). Wariant filtrowany policzony poniżej (sekcja WARIANT Z FILTREM LOAD). |
| 3 | Wyjaśnienie rozrzutu („dryf czasowy maszyny”) to hipoteza na n=2 vs n=2 | PRZYJMUJĘ (zmiana statusu) | Sformułowanie „najwyraźniejszy sygnał” wycofane. Zjawisko zgodne z kolejnością uruchomienia (ON-pierwszy −7,0%, OFF-pierwszy +12,7%) jest HIPOTEZĄ; brak przebiegu kontrolnego (ON,ON lub OFF,OFF w ciszy). Nie wnioskuję o przyczynie. |
| 4 | Obserwacja 1 („historia ledgera nie wraca po loadSlot, wbrew FALI 760”) prawdopodobnie błędna | PRZYJMUJĘ (diagnoza wycofana) | Sprawdzone w kodzie: `gra/src/main.ts:39799` zapis slotu używa `ledgerHistoryToSave(ownerId => isHuman(ownerId))` (tylko gracz). Hak `__aiEconomyMeasure.ledgerStats()` (`gra/src/main.ts:32430–32433`) liczy `ledgerHistoryToSave()` BEZ filtra (wszyscy właściciele). Przywracanie (`gra/src/main.ts:49103`) odtwarza to, co zapisano. Spadek 972 632 B → 118 419 B po wczytaniu jest zgodny z filtrem `isHuman` (historia AI nie trafia do zapisu), a nie z utratą historii. Stwierdzenie „wbrew FALI 760” jest wycofane. Wpływ na Δ% NIE OSZACOWANO: nie wykonano przebiegu kontrolnego, a ledger ON po wczytaniu jest niepełny względem ciągłej gry (dotyczy tur 51–60 i 71–80 segmentów wznowionych). Porównanie `ledgerStats` ciągłej gry i po wczytaniu NIE jest like-for-like. |
| 5 | Brak testu/mutacji opcji `--ledger-off 1` | ODRZUCAM (dowód runtime w danych) | Każdy wiersz JSONL ma pole `ledgerRecording`. Plik `evidence/s4242/off1-seed4242.jsonl.gz`: 30 wierszy `"off"` (tury 51–80) i 49 wierszy `"on"` (tury 2–50; sprawdzone numery tur w polu `turn`). Pliki ON (`on1`, `on2`): 79 wierszy `"on"`. Wariant OFF2 ma ten sam wzorzec (30 `"off"`, 49 `"on"`). Tryb wyłączenia zapisu potwierdzony w każdej turze okna pomiaru, a bajty ledgera OFF (3–4 KB) vs ON (1,5–2,2 MB) są potwierdzeniem zewnętrznym. Hak-test pokrywa `ledgerStats` (zob. 10-operator, TESTY); dodatkowy test opcji runnera nie zmieniłby wyniku pomiaru, więc nie jest dodawany w tej rundzie. |
| 6 | Dane uzupełniające niepełne: uptime przed segmentami, 777/31337, pomiar za mały do progu 10% | PRZYJMUJĘ w części (korekta + NIE ZMIERZONO) | (a) `uptime.log` nie istnieje w drzewie. Prawdą jest tylko to, że `load1` jest zapisany w każdym wierszu CSV dla każdej tury (kolumny `*_load1`); load PRZED każdym segmentem NIE jest zapisany. Zdanie w 10-operator „uptime/load przed każdym segmentem w evidence” jest wycofane. (b) Seed 777 i 31337 NIE ZMIERZONO: w chwili obrony `uptime` 10:19 UTC pokazuje load average 9,28 (8,55 / 6,87), a DODATEK 3 wymaga load ≤ 3,0 przed każdą parą; pomiar przy tym obciążeniu łamałby warunek zlecenia. Jeden segment 30 tur to ok. 10–12 min, a dla 2 dodatkowych ziaren × 2 pary w ciszy potrzeba kilku godzin oczekiwania na ciszę maszyny. (c) Werdykt progu 10% pozostaje NIE ROZSTRZYGNIĘTE (zob. poniżej). |

## WARIANT Z FILTREM LOAD (zamiast odrzucania całych przebiegów)

Tury, w których WSZYSTKIE 4 przebiegi mają load1 ≤ 3,0: 12 z 27 (58, 59, 60, 62, 63, 64, 65, 66, 67, 68, 69, 70). Liczone z `pairs-4242.csv` (bez rozgrzewek):

| Para | Mediana Δ% per tura (12 tur) | Δ% sumy czasu (12 tur) |
|---|---|---|
| ON1 vs OFF1 | −13,6% | −13,6% |
| ON1 vs OFF2 | −12,5% | −11,6% |
| ON2 vs OFF1 | +9,8% | +8,4% |
| ON2 vs OFF2 | +10,1% | +10,9% |

Rozstęp same-variant na tych turach (ON1 vs ON2, po wspólnym mianowniku OFF1): ok. 23 punktów procentowych. Wariant z filtrem NIE zmienia werdyktu: wynik zależy od kolejności przebiegu (pierwsze pary szybsze, późniejsze wolniejsze), a rozstęp ON ≥ 10%. Liczba n=12 tur na filtr jest mała i nieskorelowana z pełnym oknem.

Pełne okno (27 tur, bez filtra), dla porównania ze stanem raportu 10-operator: ON1/OFF1 −2,9%, ON1/OFF2 −11,1%, ON2/OFF1 +17,6%, ON2/OFF2 +7,7%; rozstęp same-variant ON 17,5%, OFF 8,4%.

## KOREKTY FAKTÓW W 10-operator-claude.md (lista; plik nie jest edytowany)

1. „ON2 … trzeci (uzyty) przy 2,0–3,3” → ON2 śr. load 2,87, max 3,78, 15 z 27 tur > 3,0.
2. „0 tur spełnia warunek dla wszystkich 4 przebiegów” → 12 tur (58–60, 62–70).
3. „evidence/s777/uptime.log” i „load przed każdym segmentem w evidence” → brak w drzewie.
4. „historia 10 tur NIE wraca po loadSlot, wbrew FALI 760” → wycofane; przyczyna: filtr `isHuman` przy zapisie (main.ts:39799).
5. „najwyraźniejszy sygnał to dryf czasowy maszyny” → hipoteza, nie wynik.
6. Opis commita 9ae009803 „evidence seed 777 (log)” → nieprawdziwy (commit zmienia tylko raport).

## WERDYKT (bez zmian)

Próg 10%: NIE ROZSTRZYGNIĘTE. Powód: rozstęp same-variant ≥ 10% (ON: 17,5% na pełnym oknie, ok. 23 pp na turach czystego load), jeden seed (4242), 2 pary na wariant, okno t51–t80 (27 tur), nie 100 tur. Nie wnioskuję ani „optymalizacja niepotrzebna”, ani „kandydat R-WEB-*”.

## TESTY

- W tej rundzie NIE ZMIERZONO ponownie tsc ani 5 bramek: zmiana commita to wyłącznie plik raportu, kod gry nie zmieniony (`git diff --stat` po commicie: tylko `30-obrona-claude.md`). Liczby bramek z 20-evaluator-claude.md (Evaluator, 32a98a20) NIE są moimi wynikami.
- Liczby z plików: `pairs-4242.csv` (przeliczone python3 -I w tej rundzie), pola `ledgerRecording` i `turn` z `off1-seed4242.jsonl.gz` (zcat + python3 -I), `main.ts` linie 39799, 32430–32433, 49103 (odczyt bezpośredni).

## BLOKADY

- Rozstęp same-variant ≥ 10%: wynik NIE ROZSTRZYGNIĘTE.
- Seed 777 i 31337 NIE ZMIERZONO: load 9,28 w chwili obrony (warunek ≤ 3,0 niespełniony).
- Brak uptime.log i brak evidence s777 w drzewie.
- Wpływ filtra `isHuman` na Δ% NIE OSZACOWANO (wymaga przebiegu kontrolnego).

## RUNDY

Obrona: runda 3/5 (odpowiedź na 32a98a20-evaluator, kandydat 9ae009803).

## NASTĘPNY KROK

Evaluator (runda 4): ocena korekt z tabeli. Jeśli orkiestrator chce rozstrzygnięcia progu, potrzebny jest NOWY temat pomiarowy: ≥ 2 ziarna, pary na wspólnym slocie, start tylko przy load ≤ 3,0, i przebieg kontrolny na wpływ filtra `isHuman`.

## UWAGI-DLA-ORKIESTRATORA

- Zapis slotu zawiera dziennik TYLKO gracza (`gra/src/main.ts:39799`). Po wczytaniu historia AI zaczyna od zera. Czy to zamierzone (rozmiar zapisu), NIE SPRAWDZONO: nie weryfikowano testów ledger-after-load.
- Dispatch `00-dispatch.md` nie istnieje w `origin/main` (jest tylko w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`); użyto treści DODATKÓW 1–4 z tej gałęzi.
- Commit 9ae009803 ma w opisie nieprawdziwe zdanie o evidence seed 777. Nie przepisywano historii; korekta jest w tym pliku.

DEPLOY/PUSH: NIE WYKONANO
