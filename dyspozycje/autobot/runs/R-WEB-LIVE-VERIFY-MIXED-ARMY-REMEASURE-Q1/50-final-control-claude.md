# R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1 — raport Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiar; kod gry bez zmian)
TEMAT: R-WEB-LIVE-VERIFY-MIXED-ARMY-REMEASURE-Q1
GOAL: ponowny pomiar na zywo mieszanej armii po FALACH 750-758 (>= 8 nowych ziaren, >= 3 sklady, tabela, histogram, kandydat R-WEB-* gdy prog czerwienieje, bez naprawy).

## Kandydat i baza

- Kandydat: 0b4874e199843903cf8ca210e25842f1305fdfc8 (potomek bazy cb29ce7af57fbeb667b144ff7bbf4f3c1ccae2a7: `git merge-base --is-ancestor` = tak).
- Diff vs baza (git diff --stat): 6 plikow, +452 linii: raporty 10/30, 3 pliki evidence/, oraz `gra/tools/live-verify-battle-after-full-move-live.cjs` (+2 linie: sklad M3). Zero zmian w gra/src, gra/data, battleScene.ts. Zgodne z allowlista (dopuszczona drobna poprawka narzedzia z uzasadnieniem).

## Zarzuty

1. Rozrzut identyczny dla ziaren w skladzie (3 niezalezne obserwacje, nie 24): ODDAL (nieblokujace; wniosek o histogramie: czytac jako 3 sklady x 8 ziaren; n2-spread-stats.txt potwierdza identyczne linie per sklad).
2. Hipoteza "wiecej konnicy" niezgodna z danymi obrony M3: ODDAL (nieblokujace; przyczyna NIE ZMIERZONO; nazwa kandydata ma byc neutralna: R-WEB-BATTLE-FRONT-SPREAD-ASYM-Q1).
3. Brak 00-dispatch.md w origin/main, M3 jedynym czerwonym: DO DECYZJI CZLOWIEKA (prog A1 <= 2 nie jest uniwersalny dla skladow asymetrycznych; M1=2 i M2=1 mieszcza sie w progu, wiec FALA 750 nie jest wykazana jako regresja). Nie jest to NAPRAW w tym temacie, bo dispatch zakazuje naprawy.

Zero NAPRAW => brak podstaw do FAIL.

## TESTY (surowe wyjscie, wlasne, na 0b4874e19)

- `npx tsc --noEmit` (gra/, po `npm ci`): exit 0.
- logic-test: `LOGIC OK (213/213)`, exit 0.
- tech-tree-test: `20 pass, 0 fail`.
- research-test: `ALL GREEN`.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- combat-test: `All sanity checks passed.`
- Bramki referencyjne nie czerwienieja, wiec porownanie baza-vs-kandydat nie bylo potrzebne (diff nie dotyka kodu gry).
- Przebiegi live: NIE powtarzano w FC (Chromium); dowod = evidence/live-n2-n3.jsonl (80 wierszy) i n2-spread-stats.txt, spojne z tabela Operatora (M1 max 2, M2 max 1, M3 max 3 na 8/8 ziaren; ciosy max 1; niewykorzystany ruch max 2,9%; N3 bez naruszen).

## Wynik pomiaru (dla orkiestratora)

- M1 i M2: progi OK (rozrzut <= 2). M3 (asymetryczny, dodany przez Operatora): A1 rozrzut 3 > 2 na 8/8 ziaren. Histogram maks. rozrzutu na bitwe: 0:0, 1:8, 2:8, 3+:8 (3 sklady, nie 24 niezalezne).
- Kandydat (do decyzji; NIE naprawiany): R-WEB-BATTLE-FRONT-SPREAD-ASYM-Q1, repro: part n2, auto, seed 11, atk `Wojownik:6,Lucznik:8,Konnica:6` vs def `Wojownik:12,Lucznik:4,Konnica:4`; dowod evidence/m3-s11-first-snapshots.txt.

## BLOKADY

Brak.

## RUNDY

FC po rundzie 1/5 (Operator, Obrona), Final Control = Sonnet 5.5.

## UWAGI-DLA-ORKIESTRATORA

- ABC do wlasciciela: czy prog A1 (rozrzut <= 2) ma obowiazywac sklady asymetryczne z duza iloscia konnicy, czy zmieniac zachowanie konnicy (decyzja produktowa).
- Narzedzie domyslnie pisze do starego katalogu runu (uzyc --out); zmienic domyslna sciezke przy okazji.
- Integracja: kandydat zawiera tylko dokumentacje/evidence i +2 linie narzedzia; nie wymaga deployu gry.

## NASTEPNY KROK

Integracja orkiestratora (merge 0b4874e19 + ten raport), rejestr, pytanie ABC o prog A1/M3.

DEPLOY/PUSH: NIE WYKONANO
