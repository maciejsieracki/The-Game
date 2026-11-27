STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1 (GRACE15FX), Final Control, runda 2/5
GOAL: zmierzyc na maksimum skutki okna lask 15 tur (FALA 935): AI t30/t60 (2 ziarna), przezycie aktywnego gracza t1-30 (min. 2 ziarna, z bramka skarbca), rozbieznosci tekstow; zero zmian gra/src.

ZMIANY/COMMIT: kandydat 521331762dd345ee1b54de8b2a55aaf3efa46148; baza fc7d74290e5fe7b8871a3585126c9da8b8a701e1 jest przodkiem (git merge-base --is-ancestor = OK). git diff --stat: 32 plikow, +2178, wylacznie allowlista (gra/tools/grace15fx-*.cjs, dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md, runs/R-WEB-GRACE15-EFFECTS-Q1/**). gra/src i gra/data: diff pusty. Brak naruszen allowlisty.

TESTY (wlasne, na detached 521331762, po npm ci --ignore-scripts):
- npx tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- ai-test: 297 passed, 0 failed
- early-grace-15-test: 33 passed, 0 failed
(Bramki zielone; kod gry bez zmian, wiec wynik oczekiwany.)

OCENA ZARZUTOW (bez etykiet rol):
1. Brak tabeli aktywnego gracza t1-30: NAPRAW. Kryterium binarne dispatchu ("tabela aktywnego gracza t1-30, min. 2 ziarna, z bramka skarbca") wprost niespelnione. Obrona sama to przyznaje: pomiar tylko t1-16, bieg staje na bramce tury w t16 (zywnosc/Spichlerz, nie skarbiec), na 4242 brak Drewna. Tego nie da sie oddac jako uwaga, bo to rdzen pkt 2 dispatchu. Nowe narzedzie klika tylko zakup i suwak, nie klika racji zywnosci ani rozwiazania jednostki, ktore komunikat bramki wskazuje jako dzwignie.
2. Bankructwo i "przezycie 26-32 tur": zarzut zasadny, obrona poprawila dokument (§2.1: przyczyna utraty miasta NIE ROZSTRZYGNIETA, przezycie = artefakt dosypek). Sprawdzono doc: linie 99-100 spojne z danymi. ODDAL (uwaga, naprawione).
3. Druga dosypka t33: zasadny, poprawione (§0/§2.1: 2 dosypki w s4242, 3 w s7, kazda +200 zlota i +200 zywnosci). ODDAL (naprawione).
4. Barbarzyncy po t16 / pierwszy atak: NIE ZMIERZONO (brak logu zdarzen w harnessie, foreignNear=0 tylko t1-16). Uczciwie oznaczone. ODDAL jako uwaga; wchodzi do tematu nastepnej rundy razem z pkt 1.
5. Readback poziomu barbarzyncow: NIE ZWERYFIKOWANO; wymaga hooka tylko-odczyt w gra/src, poza zakresem. Uczciwie oznaczone. ODDAL.
6. n=2 i trzy reguly naraz: zastrzezenie dopisane (§1 pkt 1, §4). ODDAL.
7. Teksty: wiki przejrzane, tooltipy utrzymania NIE PRZEGLADNIETO. Dispatch pkt 3 wymaga rowniez tooltipow i komunikatu bramki; czesciowo. ODDAL jako uwaga, ale pelnosc listy rozbieznosci nie jest domknieta.

WERDYKT: FAIL. Powod: jedno kryterium binarne (tabela aktywnego gracza t1-30, min. 2 ziarna, z bramka) niespelnione; to zarzut 1 = NAPRAW. Reszta pracy (pomiar AI, dokument, poprawki zarzutow 2-3, zastrzezenia) jest rzetelna i uczciwie oznaczona; wartosc do zachowania.

BLOKADY:
- Tabela aktywnego gracza t17-30 NIE ZMIERZONO; wymaga w harnessie klikow: obnizka racji zywnosci i/lub rozwiazanie jednostki w panelu miasta w turze blokady (UI, bez hakow stanu), maksimum, 2 ziarna z Drewnem (4242 nie ma Drewna w t1-16 - dobrac inne ziarno, np. 7 i drugie z Drewnem).
- Przyczyna utraty miasta pasywnego gracza (t42/t48) nierozstrzygnieta; log zdarzen barbarzyncow brak.
- Poziom barbarzyncow bez readbacku.

RUNDY: 2/5 (runda 1 Operator, runda 2 obrona + ten FC). Nastepna: runda 3 do TEGO SAMEGO ID.

NASTEPNY KROK: Operator runda 3 (to samo ID, baza 521331762): dopisac do grace15fx-active-live.cjs klik racji zywnosci i rozwiazania jednostki, zmierzyc t1-30 na >=2 ziarnach z Drewnem na maksimum, tabela tura x (Skarb, prognoza, blokada, atak barbarzyncow); opcjonalnie przejrzec tooltipy utrzymania. Potem Evaluator, FC.

UWAGI-DLA-ORKIESTRATORA:
- Dane obrony wskazuja, ze pierwsza blokada aktywnego gracza w t16 jest zywnosciowa, nie skarbcowa (komunikat gry); zalozenie "bramka skarbca" z opisu tematu GRACE15FX jest nieadekwatne; dokument §3 pkt 8 to odnotowuje. Pytanie ABC o to, co dalej po t16 powstanie dopiero z kompletnych danych.
- Poziom barbarzyncow: readback wymagalby hooka tylko-odczyt w gra/src (decyzja orkiestratora, osobny temat).

DEPLOY/PUSH: NIE WYKONANO
