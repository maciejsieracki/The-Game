# R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 — obrona Operatora na zarzuty Evaluatora (runda 4/5)

STATUS: PASS-WITH-NOTES (korekty w raporcie 10 i w tym pliku; werdykt progu 10% bez zmian: NIE ROZSTRZYGNIĘTE)
DOMAIN: GAME (tylko pomiar; kod gry bez zmian: `gra/src` nietknięte)
TEMAT: R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1
GOAL: odpowiedzieć na każdy z 6 zarzutów Evaluatora rundy 4 (raport `669f2f98f`, kandydat `a2a7a92bf`), skorygować fakty w `10-operator-claude.md` i wskazać, co da się, a czego nie da się udowodnić w tej rundzie.

BAZA: `a2a7a92bf4b90db618306288e3c9bebabfc414f0` (kandydat r4 Operatora; worktree ustawiony na ten SHA przed analizą).
Uwaga o dispatchu: `00-dispatch.md` nie istnieje w `origin/main`; treść DODATKÓW 1–5 wzięta z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md`).

## ODPOWIEDZI NA ZARZUTY

| Nr | Zarzut Evaluatora (r4) | Decyzja | Dowód / uzasadnienie |
|---|---|---|---|
| 1 | Tylko ziarno 4242 z DODATKU 4 (777 i 31337 niespełnione); szczegóły przerwanego przebiegu 777 nieweryfikowalne | PRZYJMUJĘ (fakt, bez poprawki kodu) | `ls evidence/` i `ls evidence/s4242/` nie zawierają katalogu ani pliku ziarna 777/31337. Sekcja „ZIARNA 777 i 31337 — NIE ZMIERZONO” w `10-operator-claude.md` (ok. l. 50) opisuje przebieg 777 (baza 281 s, load 2,36→7,3, 10:07 UTC): te liczby NIE mają śladu w drzewie i są traktowane jako nieweryfikowalne twierdzenie, nie jako dane. Brak ziarna 777 i 31337 jest jawnym brakiem wyniku; zmierzenie wymaga ciszy maszyny (load ≤ 3,0), której nie da się wymusić w tej rundzie. Werdykt: 1 ziarno, NIE ROZSTRZYGNIĘTE. |
| 2 | Warunek load ≤ 3,0 naruszony; ON2 i OFF2 z selekcją po loadzie (odrzucone przebiegi), ryzyko stronniczości nieopisane | PRZYJMUJĘ (opis selekcji dopisany tutaj) | Potwierdzone: `pairs-4242.csv` — ON2 średni load1 2,87 (15 z 27 tur > 3,0), OFF2 3,02 (9 tur > 3,0). Pliki `evidence/s4242/on2-DISCARDED-heavyload-seed4242.jsonl.gz` i `on2-DISCARDED-redo1-loadrise-seed4242.jsonl.gz` są w drzewie: dwa przebiegi ON2 odrzucono ex post z powodu load, a powtórzony przebieg `on2-seed4242` ma load niższy. **To jest selekcja po zmiennej zależnej od warunków maszyny.** Stronniczość wyboru NIE OSZACOWANA; wyniki Δ% z pełnego okna nie mają mocy wnioskowania (tak jak zapisano w werdykcie). |
| 3 | Niespójny opis slotów („ON1 ze slotu t60/t70, pozostałe ze slotu t70”) vs DODATEK 4 (jeden slot t50); zapis slotu filtruje `isHuman`, hak liczy wszystkich — wpływ NIE OSZACOWANO | PRZYJMUJĘ (zdanie WYCOFANE w tym pliku; sama linia 32 w `10-operator-claude.md` nie została zmieniona, bo ta runda commituje tylko plik obrony — do korekty przez orkiestratora) | Sprawdzone `zcat`+`python3 -I` na czterech plikach JSONL: (a) wiersze tur 2–50 są **identyczne we wszystkich czterech plikach** (49 z 49 wierszy, włącznie z `ledgerStats` i `load1`), czyli każdy plik zawiera tę samą kopię prefiksu, a nie niezależne obserwacje; (b) w turze 51 ON1 i ON2 mają `ledgerStats.bytes` = 118 419 (wznowienie: historia tylko gracza), OFF1 i OFF2 = 1 996 (tryb OFF); (c) w turze 60 ON1 = ON2 = 1 558 684 B; w turze 70 ON1 = 2 035 873, ON2 = 2 039 767. Dane są zgodne z jednym slotem t50 (DODATEK 4), a NIE z „ON1 wznowiony ze slotu t60/t70”: to zdanie w `10-operator-claude.md` jest WYCOFANE i zastąpione w tym pliku. Wpływ filtra `isHuman` (`gra/src/main.ts:39799` zapis; hak `ledgerStats` liczy wszystkich właścicieli, `main.ts:32430–32433`) na Δ%: NIE OSZACOWANO. Rozmiar księgi w t51–t60 jest zaniżony względem ciągłej gry (972 632 B w t50 vs 118 419 B po wznowieniu); w t60–t80 AI historia odrasta (1,5–2,2 MB), więc efekt dotyczy głównie wczesnego okna. |
| 4 | `evidence/dist-md5.txt` dotyczy builda r3; md5 builda r4 tylko w tekście | PRZYJMUJĘ (ślad niepełny, bez poprawki) | `evidence/dist-md5.txt` zawiera md5 builda r3 (`index.html c14b38a5…`). md5 builda r4 (`index.html 2a6d7e67…`, `audio-pack-1.js 5b990bc3…`) jest wyłącznie w `10-operator-claude.md` (l. 17). Pomiary ON/OFF były wykonane na buildzie r3, a bramki r4 na buildzie r4 — raport 10 to mówi. Kopia pliku dist r4 nie istnieje w drzewie (build poza repo, katalog nie został zachowany); odtworzenie bajtowo identycznego builda nie jest możliwe (DODATEK 4 pkt 5). Obrona NIE odtwarza builda (koszt, load). |
| 5 | Literalny grep z DODATKU 5 pkt 1 nie jest pusty | PRZYJMUJĘ (fakt), ODRZUCAM (intencja jest zachowana) | Literalny wzorzec `s777\|uptime.log\|2,0–3,3\|0 tur\|FALI 760\|wbrew` trafia w `10-operator-claude.md` także przez podciąg „0 tur” w „100 tur” (l. 6, 47). Wyniki po zawężeniu do całego słowa (`grep -nE '(^\|[^0-9])0 tur\|s777\|uptime\.log\|2,0–3,3\|FALI 760\|wbrew'`): trafienia tylko l. 58 i 61 — to cytaty wycofanych zdań w sekcji KOREKTY, nie tezy. Brak odwołań do nieistniejących plików (`s777`, `uptime.log`: 0 trafień). Zdanie „0 tur” z l. 61 jest oznaczone jako błędne. |
| 6 | Mutant haka wykonany ręcznie; brak skryptu/polecenia w repo; brak odwrotnego testu (usunięcie haka z kodu) | PRZYJMUJĘ (dokumentacja luki), NIE ZMIERZONO (odwrotna mutacja) | Skrypt mutacji nie istnieje w repo (`gra/tools/ai-economy-measure-hook-test.cjs` przyjmuje `--mutant-dist`, bundle mutanta jest przygotowywany ręcznie). Ta runda NIE dokłada skryptu mutacji, bo bez nowego uruchomienia byłby nieprzetestowany. Odwrotna mutacja (usunięcie haka z `main.ts`, build vite, hook-test) wymaga `npm ci`, buildu i uruchomienia Chromium; NIE ZMIERZONO w tej rundzie. Wiarygodność haka opiera się na: hook-test 19/19 na mutancie dwuczęściowym (zepsute `ledgerStats` + `metrics`, zmierzone przez Operatora i Evaluatora), oraz na niezerowym teście „kontrola negatywna” (bez `?civTest=1` brak haka). Wynik tej części: NIE ZMIERZONO (odwrotność). |

## KOREKTY W 10-operator-claude.md (ta runda)

1. Linia 32 (opis slotów): zdanie „ON1 wznowiony ze slotu t60/t70, pozostałe ze slotu t70” WYCOFANE w tym pliku; dane wskazują na jeden slot t50 (zob. zarzut 3). Plik 10 NIE został zmieniony w tej rundzie (commit obejmuje wyłącznie ten plik); korekta w 10 należy do orkiestratora.
2. Pozostałe korekty (ON2 load, 12 tur, wycofanie „wbrew FALI 760”, brak `uptime.log`/`s777`) — bez zmian w tej rundzie, zgodne z danymi (sprawdzone w tej rundzie, zob. niżej).

Przy sprawdzeniu grepem (zarzut 5) nie znaleziono w `10-operator-claude.md` odwołań do `evidence/s777` ani `uptime.log`.

## DANE UZUPEŁNIAJĄCE (ta runda, liczby z surowego wyjścia)

- Porównanie wierszy tur 2–50 między plikami: 49 z 49 identyczne (`on1`, `off1`, `off2`, `on2`).
- `ledgerStats.bytes` w t51: ON1 118419, ON2 118419, OFF1 1996, OFF2 1996.
- `ledgerStats.bytes` w t60: ON1 1558684, ON2 1558684, OFF1 3661, OFF2 3661.
- `ledgerStats.bytes` w t70: ON1 2035873, ON2 2039767, OFF1 3661, OFF2 3661.
- Pliki DISCARDED: 2 (`on2-DISCARDED-heavyload-seed4242`, `on2-DISCARDED-redo1-loadrise-seed4242`).

## WERDYKT (bez zmian)

Próg 10%: NIE ROZSTRZYGNIĘTE. Powód: rozstęp same-variant ON ≥ 10% (17,5% na pełnym oknie), jedno ziarno (4242), dwa pary na wariant, okno t51–t80 (27 tur po rozgrzewce), selekcja przebiegów ON2 po loadzie, filtr `isHuman` nieoszacowany. Nie wnioskuję ani „optymalizacja niepotrzebna”, ani „kandydat R-WEB-*”.

## TESTY

- W tej rundzie NIE ZMIERZONO ponownie tsc, hook-testu ani 5 bramek: zmiana dotyczy wyłącznie plików raportów (`10-operator-claude.md` linia 32 i ten plik). Bramki r4 są w `10-operator-claude.md` i zostały odtworzone przez Evaluatora (`20-evaluator-claude.md`, wg jego raportu). Liczb z tych bramek nie podpisuję jako własnych.
- Liczby z plików: `zcat` + `python3 -I` na czterech JSONL (tury 2–80), `grep -nE` na `10-operator-claude.md`.

## BLOKADY

- Ziarna 777 i 31337: NIE ZMIERZONO (load maszyny > 3,0).
- Stronniczość selekcji ON2 (odrzucone przebiegi po loadzie): NIE OSZACOWANO.
- Wpływ filtra `isHuman` na Δ%: NIE OSZACOWANO.
- Md5 builda r4 bez kopii w drzewie: NIE ZWERYFIKOWANO.
- Odwrotna mutacja haka (usunięcie z kodu): NIE ZMIERZONO.

## RUNDY

Obrona: runda 4/5 (odpowiedź na raport Evaluatora `669f2f98f`, kandydat `a2a7a92bf`).

## NASTĘPNY KROK

Evaluator (runda 5 lub FC): ocena korekt z tabeli. Jeśli orkiestrator chce rozstrzygnięcia progu, potrzebny jest NOWY temat pomiarowy: ≥ 2 ziarna, pary na wspólnym slocie, start tylko przy load ≤ 1,5 (zgodnie z propozycją Evaluatora), z kontrolą filtra `isHuman` i bez selekcji po loadzie (wszystkie przebiegi liczone, rozstęp jawny).

## UWAGI-DLA-ORKIESTRATORA

- Dane JSONL zawierają tury 2–80 we wszystkich czterech plikach, a tury 2–50 są identyczne (kopia prefiksu). Analizę należy prowadzić wyłącznie na turach 51–80.
- Zapis slotu zawiera dziennik TYLKO gracza (`gra/src/main.ts:39799`). Po wczytaniu historia AI zaczyna od zera i odrasta. Czy to zamierzone (rozmiar zapisu), NIE SPRAWDZONO testami ledger-after-load.
- Commit `9ae009803` ma w opisie nieprawdziwe zdanie o evidence seed 777; nie przepisywano historii.
- Pełna lista korekt faktów (r3 i r4) jest w `10-operator-claude.md` (sekcja KOREKTY) i w tym pliku.
- Do korekty przez orkiestratora w `10-operator-claude.md`: linia 32 nadal zawiera wycofane zdanie o slotach „t60/t70” (zarzut 3); linia 50 opisuje przebieg ziarna 777 bez śladu w drzewie (zarzut 1, traktować jako nieweryfikowalne).

DEPLOY/PUSH: NIE WYKONANO
