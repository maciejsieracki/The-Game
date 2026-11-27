# R-WEB-EARLY-DEFEAT-CAUSE-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian logiki gry, progów i danych)
TEMAT: R-WEB-EARLY-DEFEAT-CAUSE-Q1 (tag DEFEAT)
GOAL: odpowiedzieć na 6 zarzutów Evaluatora (kandydat 021bfef1e, raport 11fb1aab6) i poprawić pomiar tam, gdzie zarzut był trafny.
ZMIANY-COMMIT: patrz pole `sha` w wyniku. Pliki:
- `gra/tools/defeat-cause-live.cjs` — poziom barbarzyńców `DEFEAT_BARB_LEVEL`, domyślnie `trudny` (maksimum; wcześniej `normalny`).
- `dyspozycje/analizy/PRZEGRANA-GRACZA-PRZYCZYNA-2026-11-27.md` — przepisane liczby z pomiarem na maksimum, przeniesione stare liczby jako historia, poprawione nagłówki i wnioski.
- `dyspozycje/autobot/runs/R-WEB-EARLY-DEFEAT-CAUSE-Q1/dane-podsumowanie-r2.jsonl` — jeden wiersz na przebieg (77 przebiegów, wynik każdego przebiegu, tura utraty, właściciel, flaga podsumowania bitwy, jednostki obce i własne przy mieście).
- `dyspozycje/autobot/runs/R-WEB-EARLY-DEFEAT-CAUSE-Q1/30-obrona-claude.md` — ten raport.
- Bez zmian: `gra/src/main.ts` (hak `cityThreatProbe` z r1 zostaje, tylko odczyt), `gra/tools/endstall-*`, `gra/tools/vlive3-*`.

## Odpowiedzi na zarzuty

1. **Barbarzyńcy na Normalny, a maksimum to Trudny — PRZYJMUJĘ.** Runner ustawiał `barbariansLevel: 'normalny'`. Typ `BarbariansLevel` to latwy | normalny | trudny | brak; `brak` oznacza wyłączonych, więc maksimum to `trudny`. Zmieniono domyślną wartość na `trudny` i przemierzono wszystkie warianty. Wynik maksimum: 34/37 utrat (92%) zamiast 13/42 (31%). Dowód: `dane-podsumowanie-r2.jsonl`, wiersze `"variant":"max"`.

2. **Paradoks 6/10 vs 13/42 i nagłówek tabeli — PRZYJMUJĘ.** Dodano test Fishera. Wariant dolny (b) względem maksimum: p = 0,54, nieistotne. Nagłówek zmieniono na „Razem przegranych / przebiegów”. Przy nowych danych (20/20 vs 34/37) paradoks już nie występuje, ale wniosek „brak różnicy” zapisano jawnie.

3. **Rozbieżność 31% vs ENDSTALL 62% — PRZYJMUJĘ jako nierozstrzygniętą, z korektą.** Usunięto z DECISION_REQUIRED liczbę 31%. Dodano jawne stwierdzenie, że ENDSTALL także używał barbarzyńców Normalny, więc poziom barbarzyńców tej różnicy nie tłumaczy. Przyczyna NIE ZMIERZONO. Nowe maksimum (92%) jest zgodne z tendencją ENDSTALL, ale nie jest przez nią wyjaśnione.

4. **Klony barbarzyńców zamiast jednostek gracza — PRZYJMUJĘ.** Dodano w analizie i w DECISION_REQUIRED zastrzeżenie: klony wojownika barbarzyńców, nie budowa gracza. Koszt i czas budowy przy Wysoki x4 pozostają NIE ZMIERZONO. Wynik „0% z dwiema jednostkami” był wynikiem barbarzyńców Normalny i jest odrzucony; przy maksimum wynosi 65% (13/20, p = 0,024 względem maksimum).

5. **Surowe dane poza repo — PRZYJMUJĘ.** Dodano `dane-podsumowanie-r2.jsonl` w katalogu runu (dozwolone przez allowlistę `runs/**`). Pliki `*.txt` nie są commitowane (zakaz w dispatchu). Dane z rundy 1 (normalny) nie są w repo i są oznaczone jako nieweryfikowalne bez ponownego biegu.

6. **„Była bitwa” oparte na summaryOpen — PRZYJMUJĘ.** Flaga `summaryOpen` jest prawdziwa w 34/34 utratach. Nie rozróżnia bitwy od zajęcia bez walki (`captureCityWithoutBattle`), a siły i straty nie są mierzone. Dopisano to w analizie w sekcji „Ograniczenia” i nie formułuję już „była bitwa” jako ustalonego faktu.

## Pomiar (ta runda)

Wszystkie biegi w Chromium headless, sekwencyjnie, bundle esbuild poza repo, 20 tur każdy, gracz bierny (poza wariantem garrison).

| Wariant | Seed | Przebiegi | Utraty |
|---|---|---|---|
| max (Trudny barb.) | 4242 | 19 (w tym r1) | 17 |
| max (Trudny barb.) | 7 | 18 | 17 |
| low (Trudny barb., dolne dyplomacja/koszty/kultura) | 4242 | 10 | 10 |
| low | 7 | 10 | 10 |
| garrison (Trudny barb. + 2 klony) | 4242 | 10 | 7 |
| garrison | 7 | 10 | 6 |

Razem: max 34/37 (92%); low 20/20 (100%); garrison 13/20 (65%). Fisher względem maksimum: low p = 0,54; garrison p = 0,024.

Round-trip po przegranej sprawdzono na jednym przebiegu (`r1-s4242`): zapis `saved: true` po zamknięciu bitwy, po wczytaniu miasto barbarzyńców, jeden koniec tury przywraca przegraną. Werdykt: artefakt harnessu (bez zmian wobec r1). NIE ZMIERZONO na pozostałych 36 przebiegach.

## Bramki

Nie uruchamiano bramek `tsc`/`logic`/`ai-test`: w tej rundzie nie zmieniono `gra/src/main.ts` ani żadnego pliku `gra/src` czy `gra/data`. Sprawdzono składnię runnera: `node --check gra/tools/defeat-cause-live.cjs` = OK.

## Środowisko

Worktree nie miał `gra/node_modules`. Dowiązano symbolicznie `gra/node_modules` z istniejącego worktree `wf_de86d20f-bf8-2` (tylko do odczytu, w `.gitignore`). Dowiązanie zostanie usunięte po commicie.

BLOKADY: brak. Liczby w tym raporcie pochodzą z surowego wyjścia (`summary-all.jsonl` wygenerowany skryptem `sum.cjs` z logów `DEFEAT-CAUSE`).
RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL r1; zarzuty 1–6 ustosunkowane powyżej)
NASTĘPNY KROK: Evaluator r2 na commicie obrony; orkiestrator decyduje o pytaniu balansowym (DECISION_REQUIRED w analizie).
UWAGI-DLA-ORKIESTRATORA:
- Liczba 31% z rundy 1 jest nieaktualna i nie powinna trafić do pytania do właściciela. Aktualna: 92% (maksimum) i 65% (klony barbarzyńców).
- Różnica ENDSTALL (62%) vs runda 1 (29–31%) przy tym samym seedzie nadal NIE ZMIERZONO.
- Budowa jednostek przez gracza przy Wysoki x4 nie była mierzona (brak haka budowy w runnerze). To luka do ewentualnego tematu, nie do tej rundy.
- Ekran porażki po wczytaniu (`gameOver` wraca dopiero w końcu tury) to pytanie o zachowanie, nie błąd.
DEPLOY/PUSH: NIE WYKONANO
