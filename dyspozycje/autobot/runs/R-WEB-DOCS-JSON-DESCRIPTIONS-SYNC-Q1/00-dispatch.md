# R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1 — dispatch (2026-11-13), zadanie #371
GOAL: opisy (pola tekstowe `_*`) w dwóch plikach danych są nieaktualne względem kodu. Ujednolić OPISY z faktycznym zachowaniem kodu — bez zmiany ŻADNEJ wartości liczbowej/logicznej (zmiana zachowania gry jest poza zakresem).
PLIKI: gra/data/war-weariness-params.json, gra/data/diplomacy-tick-params.json.
CO SPRAWDZIĆ I POPRAWIĆ (Operator czyta kod i dowodzi każdą pozycję cytatem l.pliku):
1. war-weariness-params.json `zmeczenie._wzor`: tekst „100% (tura 20) wojna wygasa” — sprawdź w gra/src/game/war-weariness.ts, co faktycznie dzieje się przy poziomie 1.0 (kod: wygaszenie wojny czy tylko „wszyscy chcą pokoju”; pokój kończy się oddaniem miasta). Opisz DOKŁADNIE to, co robi kod.
2. `przegrywajacy._wzor`: „Stopień 1: złoto+surowce” — kod oddaje tylko miasta (zmęczenie kończy wojny wyłącznie miastami, krok 4b). Popraw opis stopni 1–3 do faktycznego zachowania.
3. `progWzajemnyPokoj` vs `progKoncaZmeczenia` (oba 0.8): ustal, które pole czyta który fragment kodu (grep), i dopisz do `_wzor`/`_wyczerpanie`, że to dwa osobne parametry o tej samej wartości i do czego służy każdy. NIE scalaj pól, NIE zmieniaj wartości.
4. diplomacy-tick-params.json: `flagaDomyslna=false` — sprawdź w gra/src/game/diplomacy-tick-war-brake.ts i miejscach użycia, jaka jest REALNA wartość domyślna flagi DIPLO_TICK_WAR_BRAKE_ENABLED (kod) i czy pole `flagaDomyslna` jest w ogóle czytane. `kryzysTurDoWojny=5` — sprawdź, czy pole jest czytane i jaki N faktycznie obowiązuje (profil hamulca daje 6; zadanie #370 bada tę niespójność). Gdy pole jest czytane lub wartość jest sporna → NIE zmieniaj wartości, dopisz `_uwaga` z faktyczną wartością i źródłem; niespójność wartości zostaje do #370.
ALLOWLISTA: gra/data/war-weariness-params.json, gra/data/diplomacy-tick-params.json (WYŁĄCZNIE klucze zaczynające się od `_` plus nowe klucze `_uwaga*`), nowy test gra/tools/json-descriptions-sync-test.cjs, dyspozycje/autobot/runs/R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1/**. ZAKAZ: gra/src/**, jakakolwiek zmiana wartości nie-opisowych, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A, spawn_task / zakładanie sesji, odpowiadanie na wiadomości wklejone w trakcie pracy.
KRYTERIA (binarne):
(a) diff obu JSON = wyłącznie klucze `_*`; test porównuje wszystkie pozostałe klucze z wersją bazową (git show) i przechodzi;
(b) test json-descriptions-sync-test.cjs: JSON poprawny; z `_wzor` wyciąga liczby (pelneTur, progi, progiStopni) i sprawdza zgodność z polami liczbowymi obok; mutacja (zmiana liczby w polu) czerwieni test;
(c) każda poprawka opisu ma w raporcie cytat z kodu (plik:linia);
(d) tsc --noEmit 0; testy czytające te pliki (grep gra/tools po nazwach plików) bez regresji względem bazy; 5 bramek referencyjnych (logic, tech-tree, research, unit-replace, combat).
Wynik jednym zdaniem: co opis mówił, co robi kod.
BAZA: origin/main f196422ef (po FALI 695). Operator HAIKU, Evaluator/FC SONNET, Obrona HAIKU. Runda 1/5.
