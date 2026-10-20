STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-1-FILE-CATALOG-Q1
GOAL: Obrona Operatora wobec zarzutów Evaluatora z 01-operator.md (runda 1/5): poprawki w allowliście, bez zmian w gra/**.
ZMIANY/COMMIT: dyspozycje/rust-port/p1/P1-1-FILE-CATALOG.md (zmiana niezacommitowana; plik JEST już śledzony w HEAD od f4aff7b1, w 01-operator.md błędnie napisano "untracked"). Brak zmian w gra/**. Brak commita.

ZARZUTY:
1. (PNG w sumie linii) PRZYJMUJE. Dopisano w sekcji "Metoda i zastrzeżenia": PNG są binarne, liczba newline nie ma znaczenia tekstowego; suma ui bez PNG = 73963 - (7342 + 7733) = 58888.
2. (SVG z 0 liniami) PRZYJMUJE. Dopisano: na pinie 292 z 307 SVG ma 0 znaków newline; rozmiar miarodajny w bajtach: wszystkie SVG = 108231 B, 292 pliki bez newline = 102723 B.
3. (fallback "eksporty:" z obciętą listą) PRZYJMUJE w całości, z jedną korektą faktu. Osiem wierszy z opisem "eksporty: ..." zastąpiono jednozdaniowym opisem opartym o nagłówek komentarza pliku na pinie (building-stock-cost, combat, forced-war-bronze/iron/stone/waves, side-panel-event-priority, armyStackPrompt). Korekta: siege.ts NIE ma wiersza fallback (ma opis z nagłówka); Evaluator wymienił go omyłkowo. Kryterium dispatchu brzmi "na podstawie nazwy/importów/eksportów", więc sama lista eksportów nie łamała specyfikacji; zmiana jest jakościowa. Opisy nadal wymagają weryfikacji w P1.13/P1.14.

KONTROLA POMIARÓW (odkryte podczas obrony):
- Liczby katalogu są zweryfikowane na blobach `git show edb8fb56:<ścieżka>` (game 183/70637, ui 438/117 ts/73963, map 25/23682, units 2/1226, battle 15/26867, render 88/59319; razem 751 plików, 429 ts, 255694 linii). Zgodne.
- Checkout roboczy (branch claude/sprawdzenie-funkcjonalnosci-ek4ra0, HEAD f4aff7b1) różni się od pinu edb8fb56 w 138 plikach gra/ (git diff --stat edb8fb56 HEAD -- gra). Liczenie przez `find` na checkoucie roboczym daje inne liczby (np. game 179 plików / 68319 linii). Dopisano ostrzeżenie w katalogu.
- Nie znaleziono liczb niezgodnych z pinem w samej tabeli.

TESTY:
- Pomiary pinu: `git show edb8fb56:<ścieżka> | wc -l` i `git cat-file -s` dla PNG i SVG; wynik jak wyżej.
- Sprawdzenie: w pliku 0 wierszy `| ts | eksporty:`; 0 końcowych spacji (grep -cE ' +$' = 0).
- `git diff --no-index --check /dev/null <plik>` nie nadaje się jako bramka (zwraca 1 dla każdego nowego pliku); zastąpiono grepem na spacje końcowe.
- gra/**: nietknięte; brak npm/git add -A.

BLOKADY: brak.
RUNDY: 1/5 (obrona w tej samej rundzie, zgodnie z procedurą).
NASTĘPNY KROK: Evaluator weryfikuje poprawki komendami z sekcji "Metoda" (git show edb8fb56), następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
