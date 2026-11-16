# R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora, runda 1)

STATUS: PASS-WITH-NOTES (wszystkie 3 zarzuty rozpatrzone: 1 przyjęty, 1 przyjęty z korektą wniosku, 1 odrzucony jako faktycznie błędny; kodu gry nie zmieniano, pomiarów nie powtarzano)
DOMAIN: GAME (pomiar; bez zmian kodu gry)
TEMAT: R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1
GOAL: rozpatrzyć każdy zarzut Evaluatora (`dyspozycje/.../Evaluator` dopisany w tym wątku, PASS-WITH-NOTES, report_sha dc822234b464d3aeff608e43c9371e788ea777ff) przez PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód), na bazie kandydata 1d62a5c6b80506b82b0060cd106c31ec957a4ed6.
ZMIANY-COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1/30-obrona-claude.md`). Brak zmian w `gra/`, `battleScene.ts`, `WERSJE.md`, manifeście, `gra/data`. Kandydat 1d62a5c6 (`10-operator-claude.md`, `evidence/*`, +2 linie w `gra/tools/live-verify-battle-after-full-move-live.cjs`) pozostaje bez zmian.
TESTY: w obronie NIE uruchamiano ponownie przebiegów live ani bramek; wszystkie dowody poniżej to odczyty istniejących plików z kandydata 1d62a5c6 (`git show`/`grep`/`cat` na nich). Wyniki bramek z 10-operator-claude.md NIE są tu potwierdzane ponownie (NIE_ZMIERZONO w tej rundzie).
BLOKADY: brak.
RUNDY: 1/5 (Obrona, Haiku 5.5).
NASTĘPNY KROK: Final Control (Sonnet) — oceń wniosek bez rozstrzygania progu A1 (decyzja progu należy do właściciela przez ABC) oraz to, czy przyjęte korekty wniosków (zarzuty 1 i 2) są wystarczające do PASS-WITH-NOTES.
DEPLOY/PUSH: NIE WYKONANO

---

## Zarzut 1 — rozrzut identyczny dla wszystkich ziaren w składzie (efektywnie 3 próbki, nie 24)

**PRZYJMUJĘ.**

Dowód: `evidence/n2-spread-stats.txt` (25 linii). Dla każdego składu wszystkie 8 ziaren (11–18) ma identyczne `spread min/avg/max`: M1 = 0/0.75/2, M2 = 0/0.50/1, M3 = 0/1.50/3. Histogram `{"0":0,"1":8,"2":8,"3+":8}` jest więc zbudowany z trzech różnych wartości powtórzonych po 8 razy, a nie z 24 niezależnych bitew. Zarzut Evaluatora jest zgodny z danymi.

Korekta wniosku: rozrzut przed zderzeniem w tym pomiarze jest efektywnie jedną obserwacją na skład (zderzenie zawsze w rundzie 2, rozrzut nie zależy od ziarna). Wiersze ziaren różnią się wynikiem bitwy (zwycięzca, liczba rund), ale nie rozrzutem frontu. Histogram 0/1/2/3+ nie powinien być czytany jako rozkład statystyczny; to opis trzech składów.

Odpowiedź na pytanie Operatora z 10-operator-claude.md ("czy seed w ogóle wpływa na rozstawienie") pozostaje NIE_ZMIERZONO. Dane mówią jedynie, że przy tym składzie rozrzut jest niezależny od ziarna.

## Zarzut 2 — hipoteza „więcej konnicy" jest sprzeczna z danymi obrońcy M3

**PRZYJMUJĘ (z korektą wniosku, nie z pełnym odrzuceniem hipotezy).**

Sprawdzone w kodzie narzędzia (`gra/tools/live-verify-battle-after-full-move-live.cjs`, linie 37–40):
- M1: atak `Wojownik:10,Lucznik:6,Konnica:4`, obrona `Wojownik:10,Lucznik:6,Konnica:4`. Rozrzut obrony def1 = 1.
- M3: atak `Wojownik:6,Lucznik:8,Konnica:6`, obrona `Wojownik:12,Lucznik:4,Konnica:4`. Rozrzut def1 = 3.

Obrońca M3 ma tyle samo konnicy co obrońca M1 (4), więc sama liczba konnicy po stronie obrony nie tłumaczy różnicy rozrzutu. Hipoteza z 10-operator-claude.md ("6 vs 4") dotyczy wyłącznie strony atakującej i była w raporcie sformułowana za szeroko. Operator nie zmierzył przyczyny rozrzutu po stronie obrony. Zarzut Evaluatora jest zasadny.

Korekta: w raporcie Operatora (10-operator-claude.md, sekcja „Diagnoza M3") hipoteza obowiązuje tylko dla ataku i jest oznaczona jako NIE_ZMIERZONO. Nazwa robocza kandydata `R-WEB-BATTLE-MOUNTED-FRONT-SPREAD-Q1` sugeruje przyczynę, której nie potwierdzono. Proponuję, by Final Control albo orkiestrator użył nazwy neutralnej, np. `R-WEB-BATTLE-FRONT-SPREAD-ASYM-Q1`, do czasu pomiaru przyczyny. Sam plik 10-operator-claude.md nie jest zmieniany w tej obronie (zgodnie z zasadą, że Obrona odpowiada w osobnym pliku).

Dowód dla obrony po stronie obrońcy (obserwacja z `evidence/m3-s11-first-snapshots.txt`, zgodnie z tym, co Operator już opisał): rozrzut def1 = 3 występuje przy tej samej liczbie konnicy, co M1 (def1 = 1). Różnica tkwi zatem w składzie całego frontu (słabsza piechota atakującego, 6 konnic atakującego, inna proporcja piechoty obrońcy 12 vs 10), a nie w samym fakcie 4 konnic obrońcy. Ten wniosek jest jedynie przeglądem danych; przyczyny nie zmierzono.

## Zarzut 3 — oryginalny `00-dispatch.md` nie istnieje w origin/main

**ODRZUCAM w części dotyczącej braku pliku w repo; PRZYJMUJĘ tylko w części dotyczącej źródła kryteriów.**

Dowód odrzucenia:
- `git ls-tree -r --name-only origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 -- dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1` oraz to samo dla 1d62a5c6 zwraca `00-dispatch.md` i `00-dispatch-DODATEK-claude.md`. Plik istnieje, ale na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie w `origin/main`. Operator sprawdził tylko `origin/main`, stąd błędny komunikat „does not exist" w ogólnym sensie.
- Kryteria: linia `GOAL:` i `KRYTERIA:` w `00-dispatch.md` z gałęzi roboczej są zgodne z treścią DODATKU (ten sam cel ≥ 8 ziaren, ≥ 3 składy mieszane, progi rozrzut ≤ 2 / ciosy ≤ 1 / niewykorzystany ruch ≤ 10%, tabela + histogram, zasada ZMIERZONO/NIE ZMIERZONO). Zatem kryteria nie pochodzą wyłącznie z DODATKU.

Część przyjęta: 10-operator-claude.md (sekcja „BLOKADY" i „Dispatch oryginalny") nie wskazuje, że plik znajduje się na gałęzi roboczej. Ta korekta jest wyłącznie informacyjna i nie zmienia wyniku pomiaru.

Wniosek Evaluatora o decyzji progu A1 dla składów asymetrycznych jest zgodny z tym, co Operator już zapisał (pytanie ABC do właściciela). Obrona się z tym zgadza, bez zmiany kwalifikacji: wynik A1 w M3 jest czerwony, M1 i M2 mieszczą się w progu (2 i 1).

---

## Podsumowanie dla Final Control

| # | zarzut | rozstrzygnięcie | dowód |
|---|---|---|---|
| 1 | 3 próbki zamiast 24 | PRZYJĘTY (korekta interpretacji histogramu) | `evidence/n2-spread-stats.txt`, 8 identycznych linii na skład |
| 2 | hipoteza konnicy sprzeczna z def1 M3 | PRZYJĘTY (hipoteza zawężona do ataku; przyczyna NIE ZMIERZONO; sugerowana neutralna nazwa kandydata) | `narzedzie` l. 37–40; M1 def Konnica:4 = M3 def Konnica:4, def1 1 vs 3 |
| 3 | brak `00-dispatch.md` w origin/main | ODRZUCONY w treści (plik istnieje na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` i w 1d62a5c6); przyjęty tylko jako uwaga o źródle | `git ls-tree` na obu commitach; GOAL/KRYTERIA zgodne |

Nie zmierzono w tej obronie: ponownego przebiegu live, ponownych bramek, odtworzenia seedów poza s11, odwrotu armii po bitwie, przyczyny rozrzutu w M3 po stronie obrony.

## UWAGI-DLA-ORKIESTRATORA

- Nazwa kandydata `R-WEB-BATTLE-MOUNTED-FRONT-SPREAD-Q1` (z 10-operator-claude.md) zawiera nieudowodnioną przyczynę. Przy zakładaniu tematu R-WEB-* użyj nazwy neutralnej.
- Domyślna ścieżka wyjścia narzędzia wskazuje stary run `R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1/evidence` (uwaga Operatora z 10-operator-claude.md, nadal aktualna).
- Decyzja progu A1 dla składów asymetrycznych: pytanie ABC do właściciela (nie rozstrzygam).
