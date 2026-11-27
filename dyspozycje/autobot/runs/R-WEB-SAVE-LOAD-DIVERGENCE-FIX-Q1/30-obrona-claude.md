# R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX) — obrona Operatora, runda 2/5

STATUS: BLOCK
DOMAIN: GAME (integralność zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1
GOAL: znaleźć przyczynę rozbieżności po wczytaniu zapisu (B != A) i naprawić tak, by B == A przez 6 tur po wczytaniu.
BAZA: kandydat 322d78cca (raport r1 BLOCK), baza kodu 9d6750a73 (origin/main). Worktree detached.
ZMIANY-COMMIT: tylko ten raport. Brak poprawki kodu gry: eksperyment z hakiem harnessu (odtworzenie hexów z mapSnapshot) NIE zmienił wyniku i został wycofany (`git checkout -- gra/src/main.ts`, drzewo czyste).

## Odpowiedź na zarzuty Evaluatora

1. **PRZYJMUJĘ.** Kandydat 322d78cca nie zawiera poprawki kodu. Raport r1 był BLOCK, nie PASS. W tej rundzie nie wprowadzono poprawki, której skutek byłby potwierdzony (patrz pkt 2). Zarzut pozostaje otwarty.

2. **PRZYJMUJĘ (brak potwierdzonej diagnozy).** Hipoteza „mapa hexów nie wraca przy wczytaniu" została sprawdzona eksperymentem i jest **odrzucona jako jedyna przyczyna** (dane poniżej). Przyczyna nadal nieznana.

3. **PRZYJMUJĘ.** Nie napisano testu `save-load-continuity-*.cjs`, testu zgodności wstecznej ani mutacji czerwonej. Brak poprawki nie daje podstaw do ich pisania. Uruchomienie istniejących testów zapisu nie było wykonane.

4. **PRZYJMUJĘ.** Dokument `dyspozycje/analizy/ZAPIS-WCZYTANIE-ROZBIEZNOSC-NAPRAWA-2026-11-27.md` nie powstał. Ta runda nie ma dowodu przyczyny, więc nie ma czego opisać jako naprawy.

5. **PRZYJMUJĘ.** Bramki z dispatchu (logic 213, ai-test 297/0, wiring 267/0 itd.) nie były uruchamiane. Uzasadnienie „brak poprawki" nie zwalnia z bramek, jeśli zmiana powstanie. Dla tego commitu (tylko raport) bramki nie dotyczą. NIE ZMIERZONO.

6. **PRZYJMUJĘ (weryfikacja kodem, bez pomiaru).** Rozróżnienie artefaktu harnessu od błędu gry jest istotne. Ustalenia z odczytu kodu:
   - `__detHarness.restoreJson` (main.ts ok. 33723) woła `restoreGameFromSave` bez `mapSnapshot` i bez `regenerateWorldForLoad`. To ścieżka niezgodna z produktem. W sesji B mapa pochodzi z seeda, nie z zapisu. Jest to artefakt harnessu.
   - Realna ścieżka „Wczytaj" w świeżej sesji (`loadNeedsMapRebuild` = true, main.ts ok. 10580) buduje mapę z `mapSnapshot` przez `loadMapForSave` (`regenerateWorldForLoad`, ok. 50910). Ta ścieżka jest poprawna co do hexów.
   - Wczytanie z pauzy w tej samej grze (ten sam seed i ustawienia) zwraca `loadNeedsMapRebuild` = false. Mapa w pamięci nie jest odbudowywana z zapisu, więc zmiany hexów wykonane po punkcie zapisu zostają. **To możliwy realny błąd gry, niezależny od harnessu, NIE ZMIERZONO** (wymaga osobnego testu: zapis w t3, gra do t6, wczytanie z pauzy, porównanie hexów z zapisem).

## Pomiar (runda 2)

Konfiguracja: cfg **max** (maksimum nowej gry, zgodnie z regułą testowania), seed 4242, zapis po t3, K=6, `savedigest-run.cjs` z `dist` zbudowanym `vite build` poza repo (`--outDir` w scratchpad, katalog usunięty po pomiarze). Wyniki z surowego JSON (`fnvNoPP`, `lenNoPP`, `nUnits`):

| tura | A (ciągły) | B (wczytany) | wynik |
|---|---|---|---|
| t4 | 837e7646 / 41902 / 49 | f0081d9c / 44632 / 49 | DIFF |
| t5 | 74adf62d / 43712 / 60 | 6e32b32b / 46442 / 60 | DIFF |
| t6 | cf8b3576 / 45085 / 65 | 6afdd58c / 47815 / 65 | DIFF |
| t7 | 6de50477 / 47011 / 74 | 2887d51b / 49741 / 74 | DIFF |
| t8 | d91316ae / 47137 / 74 | a182d97e / 49867 / 74 | DIFF |
| t9 | a1014ff3 / 51090 / 91 | 222259c1 / 53820 / 91 | DIFF |

Obserwacje:
- Liczność jednostek jest zgodna do t9 (49, 60, 65, 74, 74, 91). Rozbieżność jest w wartościach, nie w zbiorze obiektów.
- Przyrost długości w turze jest identyczny: A t3→t4 = 1834, B t3→t4 = 1834. Stała różnica długości 2730 znaków występuje już po wczytaniu (t3 restore: 42798 vs snap 40068) i jest reprezentacją (pola domyślne miast), zgodnie z pkt 1 raportu r1. Różnica wartości zaczyna się w t4.

## Eksperyment: odtworzenie hexów z mapSnapshot w harnessie

Hipoteza: po `restoreJson` mapa hexów (nakladka/ulepszenia) jest z seeda, a nie z zapisu, więc wartości pracy i pieniądza stolic AI się rozjeżdżają.

Zmiana tymczasowa (wycofana): w `__detHarness.restoreJson` przed `restoreGameFromSave` podstawiono `map.hexes = buildGameMapFromSnapshot(o.mapSnapshot).hexes` (gdy `isValidMapSnapshot`).

Wynik: po zmianie B nadal rozbieżne od t4 (tabela wyżej: t4 B f0081d9c vs A 837e7646). Dla porównania przed zmianą (r1): t4 B 5d8f4489. Zmiana przesunęła wartość, ale nie zlikwidowała rozbieżności. **Hipoteza „tylko hexy" jest odrzucona jako wyjaśnienie wystarczające.** Zastrzeżenie: nie zmierzono, czy podstawienie `map.hexes` dotarło do wszystkich odczytów (okolica/cache mogą trzymać starą referencję). To nie zmienia wniosku o braku zgodności.

## Wskazówki dla następnej rundy (nie wykonane)

- Różnica wartości, nie długości: porównać zrzuty `full()` już zapisane w `scratchpad` (`runA.json.cont4.full` vs `runB.json.resumed4.full`) po odfiltrowaniu pól domyślnych (`savedigest-diff.cjs`). Oczekiwane: pula i pieniądz w stolicach AI (wg r1), nie jednostki.
- Sprawdzić stan poza zapisem, zwłaszcza mapy per właściciel i cache liczone historycznie (`aiSkarbiecByOwner`, `aiPracaPoolByOwner`, `aiNaukaPoolByOwner`, `aiBadanaByOwner`, `ownerDefaultPodzialPracy`, `citizenUpkeepByOwner`, `empireFoodStates`, `goldDeficitStates`, `territoryHexCountMemo`, `aiDiploRatesCache`, `aiDiploTyAll`, `lastCityKulturaTick`, `aiWonderPracaTickByCity`). Każda z nich jest w zakresie main.ts i może być wpisana bez serializacji. Bisekcja: zrzut tych map w A (t3) i B (po restore), porównanie.
- Osobny test dla punktu 6 (pauza, ta sama gra): czy hexy wracają do stanu zapisu.

## Testy

NIE ZMIERZONO w tej rundzie poza pomiarem live opisanym wyżej. Bramki z dispatchu nie były uruchamiane (brak poprawki kodu). `tsc` nie uruchamiano w tej rundzie.

## Uwagi dla orkiestratora

- Limit: 2/5 rund wykorzystane przez tę obronę (runda r1 BLOCK, r2 BLOCK). Kolejny krok wymaga bisekcji stanu poza zapisem; nie jest to temat jednego dispatcha dla Haiku bez dodatkowego hooka read-only.
- Ustalenie z pkt 6 (pauza, ta sama gra, mapa nie odbudowywana) to kandydat na osobny temat BŁĄD-GRY, do potwierdzenia testem.
- Dysk: po pomiarze usunięto katalog `dist` z scratchpad. `gra/node_modules` podlinkowano z sąsiedniego worktree (dowiązanie ignorowane przez git).

RUNDY: 2/5 (ostatni werdykt: Evaluator FAIL, obrona BLOCK; decyzja wymagana: NIE)
NASTĘPNY KROK: runda 3 — bisekcja stanu poza zapisem (zrzut map per właściciel A t3 vs B po restore) na podstawie wskazówek wyżej.
DEPLOY/PUSH: NIE WYKONANO
