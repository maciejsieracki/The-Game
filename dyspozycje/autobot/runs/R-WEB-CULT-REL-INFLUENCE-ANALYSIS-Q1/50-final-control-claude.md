STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza, zero zmian gra/**)
TEMAT: R-WEB-CULT-REL-INFLUENCE-ANALYSIS-Q1 (CULTRELANALYSIS #172)
GOAL: niezalezny werdykt dla kandydata 85b3466b5728f24489b0292dd7427f4b1672f29a (baza 8c45256803986c78572861ffc1319f21fed56d8e).
ZMIANY/COMMIT: kandydat 85b3466b5 jest potomkiem bazy 8c4525680 (merge-base --is-ancestor: tak). git diff --name-only baza..kandydat = 4 pliki, wszystkie w allowliscie: dyspozycje/analizy/KULTURA-RELIGIA-WPLYW-2026-11-26.md, dyspozycje/analizy/model-kultura-religia-entry.ts, runs/.../10-operator-claude.md, runs/.../30-obrona-claude.md (400 wstawien, 0 usuniec). Zero zmian gra/**, WERSJE.md, manifest.
TESTY: wlasna weryfikacja: npx esbuild@0.24.0 bundle wejscia -> EXIT 0; node model -> EXIT 0, 852 linii wyjscia. Liczby z dokumentu odtworzone z surowego wyjscia: mały normal epoka 1 d: 0 jedn. Por 0 (bunt skrajny, tura buntu 5), 1 jedn. 22,3, 2 jedn. 44,7 (min 2 / 1); a: min 1; Garnizon(bud.) d: 1/0; duzy bez obciecia d: >6/4 (z Garnizonem >6/2); dolny prog -50: 3/2; -100: 4/3 (z Garnizonem 3/2); epoka 3 -100: >6/>6, z Garnizonem 5/4; A2 (Prawo 100%): a 71,5, b/c/d 50. Wszystko zgodne z dokumentem. Bramki kodu (tsc, 5 referencyjnych): NIE URUCHOMIONO, bo zero zmian gra/** (diff wylacznie dokumentacja i skrypt analizy poza gra/).
OCENA ZARZUTOW (1-9) wzgledem kandydata:
1 ODDAL/zalatane: model to teraz bundle esbuild wolajacy funkcje silnika; etykiety SILNIK vs NIE ZMIERZONO uczciwe.
2 zalatane: bundle liczy wszystkie poziomy i garnizon 0-6; tabele odtwarzalne komenda z dokumentu §2.
3 zalatane: 16/23/33 jawnie stale, nie mnoznik.
4 zalatane opisowo: obciecie dotyczy sumy netto; konsumenci szPct oznaczeni NIE PRZEANALIZOWANE. Uwaga, nie blokada (analiza, nie implementacja).
5 zalatane: tura buntu i min. do wyjscia z buntu skrajnego sa w tabeli; skutek buntu po grace jawnie NIE ZMIERZONO.
6 czesciowo: mechanizm religii opisany; start udzialu kultury i tempo konwersji NIE ZMIERZONO (jawnie). Luka zadeklarowana, nie ukryta.
7 zalatane: Swiatynia epoka 2, rozbieznosc komentarza +3 vs baza 2 zapisana.
8 zalatane: easy/hard w tabelach; neutralny d = 2 jedn. (44,7).
9 zalatane: streszczenie przepisane na wartosci silnika; ryzyka AI jawnie NIE ZMIERZONO.
Zadne zarzuty nie wymagaja NAPRAW (FAIL).
BLOKADY: brak. Zadeklarowane luki (NIE ZMIERZONO): start udzialu kultury po podboju, tempo konwersji, skutek buntu po grace, konsumenci szPct przy dolnym progu, drugi system progow order.ts, Amfiteatr/Teatr, AI i balans wojen.
UWAGI-DLA-ORKIESTRATORA: (1) dokument NIE spelnia celu "4 jednostki dla d" samym x; wymaga dolnego progu Szczescia (-100% daje 4/3 w epoce 1, ale >6 w epoce 3 bez budynkow) - to decyzja gameplayowa do ABC przez turniej C-018, w jezyku skutkow dla gracza. (2) Przed wdrozeniem poziomu "duzy" zmierzyc konsumentow szPct i zachowanie AI. (3) Bundle wymaga npx z rejestru npm (esbuild@0.24.0); modelu nie ma w repo jako samodzielnego artefaktu wynikowego (model-out.txt tylko w scratchpadzie).
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (dokumentacja), potem ABC wariantu i CULTRELSETTING (#173).
DEPLOY/PUSH: NIE WYKONANO
