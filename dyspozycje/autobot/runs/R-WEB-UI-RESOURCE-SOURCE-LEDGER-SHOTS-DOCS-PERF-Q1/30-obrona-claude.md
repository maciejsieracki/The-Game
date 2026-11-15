# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — obrona Operatora, runda 3 (odpowiedź na zarzuty Evaluatora r3, fbb96099b)

STATUS: BLOCK (częściowy: zarzuty 2 i 3 PRZYJĘTE i wykonane; zarzut 1 PRZYJĘTY, pomiar 5 par sekwencyjnych W TOKU — nieukończony w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: obrona zarzutów 1–3 Evaluatora r3 (wydajność ON/OFF, wniosek o przyczynie t57, dowód OFF i duplikat evidence).
BAZA: kandydat 7fab781a1 (ta sama baza co Evaluator r3). Zmiany tej rundy: patrz ZMIANY/COMMIT.
ZMIANY/COMMIT: (1) `gra/tools/endturn-gate-diag-measure.cjs` — nowa flaga `--ledger-off` (wariant OFF jako osobny, sekwencyjny przebieg); (2) `evidence/perf-toggle/cmp.py` — usunięta zakodowana ścieżka do scratchpada, porównanie z jawnych argumentów; (3) `evidence/endturn-gate-diag/nofix-on-seed4242.jsonl` — USUNIĘTY (bajt w bajt = `def-on-seed4242.jsonl`); (4) `evidence/perf-seq/driver.sh` + `driver-START.log` — skrypt 5 par sekwencyjnych; (5) ten raport. Kod gry (`gra/src`) NIETKNIĘTY.
DEPLOY/PUSH: NIE WYKONANO

## Środowisko

- `npm ci` w worktree (gra/), kopia gry do pomiaru poza repo (`scratchpad/kopia`, `--prepare` z `ai-city-live-measure`), build vite poza repo (30 s, `scratchpad/dist`). Dysk po buildzie: 7,8 GB wolne.
- Maszyna: 4 rdzenie, load współdzielony z innymi sesjami (nie kontrolowany przez tę rundę).

## Zarzut 1 — brak 5 sekwencyjnych par ON/OFF (mediana) — PRZYJĘTY, POMIAR W TOKU

Przyznaję: r2 `evidence/perf100/` (5 par ON/OFF) to przebiegi RÓWNOLEGŁE (oba start 10:01:53/10:01:45 z tej samej maszyny) — nie spełniają DODATKU 3 pkt 3. Dlatego nie zaliczam ich jako dowodu sekwencyjnego.

Poprawka (dowód = surowe pliki, nie wnioski):
- Dodano `--ledger-off` do `endturn-gate-diag-measure.cjs`: `setRecording(false)` od tury 1 w OSOBNYM przebiegu (osobne przeładowanie strony). Wariant ON = identyczne wywołanie bez flagi. Jedyna różnica między przebiegami to flaga; zdarzenie `ledger-mode` zapisuje wariant. To rozwiązuje zarzut 3 (OFF odtwarzalny).
- Uruchomiono `evidence/perf-seq/driver.sh`: 10 przebiegów SEKWENCYJNIE (jeden naraz), seed 4242, 100 tur, `--gate-fix taxsplit`, pary ON,OFF / OFF,ON naprzemiennie (kolejność znosi dryf). Start: `driver-START.log` (on-1 13:29:01). Wyniki: `scratchpad/perf-seq/{on,off}-k/seed4242.jsonl`, kopiowane do `evidence/perf-seq/` po zakończeniu.
- STATUS na moment tego raportu: pierwszy przebieg (on-1) w toku; reszta w kolejce. Szacowany czas całości ≈2 h (100 tur ≈ 10–13 min na przebieg + ładowanie). NIE_ZMIERZONO: mediana z 5 par sekwencyjnych — w tej rundzie NIEUKOŃCZONE. Nie podaję żadnej liczby jako wyniku sekwencyjnego.

Wniosek o wydajności pozostaje ograniczony do danych przeliczonych z plików (patrz niżej) i nie jest potwierdzony sekwencyjnie.

## Zarzut 2 — wniosek o przyczynie t57 wykracza poza dowody — PRZYJĘTY (korekta wniosku)

Zgadzam się z Evaluatorem. Dowody: `def-on-seed4242.jsonl` — `noadvance` wyłącznie w t1 (7×, prognoza −2, `blokada:true`, `timeout:false`); fix-on/fix-off — 99 tur, t57 = 11 006 ms (ON) / 17 050 ms (OFF), brak timeoutu. Timeout z r3 w turze 57 NIE został odtworzony w żadnej konfiguracji.

Korekta (zastępuje wniosek z r3 `10-operator-claude.md` i `30-obrona-claude.md` r2 w tej części):
- **Potwierdzone:** bramka „Zakończ turę” (NNS) blokuje turę 1 przy domyślnym podziale podatków 30/60/10 (seed 4242: prognoza skarbca −2; seed 777: −3). To dług harnessu, nie księgi (ON i OFF identyczne w t1).
- **NIE potwierdzone:** przyczyna timeoutu w turze 57. Oryginalna konfiguracja tego przebiegu jest nieznana. NIE wnioskuję „nie księga”. Wniosek o księdze w t57 jest NIEROZSTRZYGNIĘTY.
- **Hipoteza bez dowodu (usunięta z wniosków):** „wyścig endTurnInProgress”. Nie ma w surowych danych zdarzenia, które by ją potwierdzało; traktuję ją wyłącznie jako hipotezę do sprawdzenia przy harnessie #417.
- Rekomendacja dla #415/#417 bez zmian: nie odblokowywać na podstawie „braku odtworzenia”.

## Zarzut 3 — dowód OFF niereprodukowalny, duplikat, zakodowana ścieżka — PRZYJĘTY (naprawiony)

- Dowód OFF: wcześniejsze `fix-off-seed4242.jsonl` powstały bez flagi wyłączającej księgę (narzędzie r3 miało tylko `--toggle-recording`). Ich metoda NIE jest odtwarzalna z repo i oznaczam je jako takie. Nowa metoda OFF: `--ledger-off` (zob. zarzut 1).
- Duplikat: `cmp def-on-seed4242.jsonl nofix-on-seed4242.jsonl` → IDENTICAL (19 836 B). Usunięto `nofix-on-seed4242.jsonl` (`git rm`); zostaje `def-on-seed4242.jsonl`.
- `cmp.py`: usunięto zakodowaną ścieżkę do scratchpada; skrypt przyjmuje dwa pliki jako argumenty. Uruchomienie z repo:
  `python3 -I dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1/evidence/perf-toggle/cmp.py <ON.jsonl> <OFF.jsonl>`
  Wynik na `evidence/endturn-gate-diag/fix-on-seed4242.jsonl` / `fix-off-seed4242.jsonl` (surowe dane r3, przeliczone z repo): `99 mean on 10611 off 10478, median on 9882 off 9565, pct mean 1.28, pct median 3.31` (zgodne z raportem Evaluatora). Ten przebieg był parą RÓWNOLEGŁĄ — nie jest dowodem sekwencyjnym.

## Pozostałe pomiary (przeliczone z surowych plików, nie zmienione w tej rundzie)

- ABBA w jednej sesji (`--toggle-recording`, seed 4242: ON 29 tur / mediana 3538 ms, OFF 30 / 3483,5 ms, +1,56%; seed 777: +1,97%). Dowód wtórny, nie sekwencyjny.
- Mikropomiar `resource-ledger-perf-micro.cjs` (Evaluator odtworzył: 12/25/50 miast +0,307/+0,085/+0,610 ms; `ownerResourceStockAll` 0,004–0,011 ms). Mierzy tylko ścieżkę księgi, nie cały zapis w turze.

## Bramki (ta runda, worktree na 7fab781a1 + zmiany tej rundy)

- `npm ci` w gra/: `added 71 packages`.
- Pełna lista bramek i tsc: NIE_ZMIERZONO w tej rundzie (zmiany dotyczą tylko `gra/tools/endturn-gate-diag-measure.cjs`, nie `gra/src`; kod gry bez zmian; bramki powtórzył Evaluator r3 na tym samym kodzie: tsc rc=0, 213/213, 20/0, 33/33, 21/21, 6/0, 1030/0, 18/0, 13/0, 6/0).
- `git diff --check`: do wykonania przed commitem (patrz niżej).

## Blokady

- Zarzut 1: 5 par sekwencyjnych nieukończonych (≈2 h przebiegów; w toku).
- Mediana wydajności bez sekwencyjnego dowodu — nie może być zamknięta w tej rundzie.

## Uwagi dla orkiestratora

- Integracja (z Evaluatora): kandydat nie jest potomkiem main; konflikt tylko `gra/src/data/wikiBundle.json` (regeneracja, nie ręczne scalanie).
- Wynik sekwencyjnych par będzie w `evidence/perf-seq/` po zakończeniu; do tego czasu raport jest częściowy (BLOCK).
- Driver działa w tle w scratchpadzie; jego zakończenie sygnalizuje wpis `ALLDONE` w `evidence/perf-seq/driver.sh` (skrypt); log startu w scratchpadzie lub w `scratchpad/perf-seq/driver.log`.

## RUNDY

3/5 (ten sam ID; obrona r3). Ostatni werdykt Evaluatora r3: PASS-WITH-NOTES (fbb96099b).

## NASTĘPNY KROK

Dokończyć 10 przebiegów sekwencyjnych (`driver.sh`), skopiować `on-k/off-k` do `evidence/perf-seq/`, policzyć medianę 5 par (przez `cmp.py` per para), dopisać wynik do tego raportu. Następnie Evaluator.

SHA końcowy: patrz pole `sha` w wyniku.
DEPLOY/PUSH: NIE WYKONANO
