STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza + pomiar; zero zmian logiki gry)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: obrona r5 wobec zarzutów 1–4 Evaluatora r4 (kandydat 070023c26); poprawki wyłącznie w dokumencie dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md.
ZMIANY-COMMIT: dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md (sekcje 1.1, 1.3, 1.4 pkt 3, 1.5, 1.6, P3-B, sprostowania, 6b „Bieg”, ograniczenie 7); dyspozycje/autobot/runs/R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1/30-obrona-claude.md. SHA: czubek brancha obrony (podany w polu sha).
TESTY: `git diff --check` OK. Dane wyników (CSV, summary, kontrolne) NIE ruszane. Bramki gry NIE uruchamiane: zmiana tylko dokumentu i raportu, bez gra/src i gra/tools.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Nagłówek 1.5 zmieniony na „Dlaczego forty/posterunki dają mało terenu (hipotezy z kodu, przed pomiarem)”. Tezę „AI rzadko stawia forty” oznaczono jako obaloną przez 6b (13/13 AI z fortem lub posterunkiem). Cztery ograniczenia z kodu opisane jako hipotezy bez zmierzonego wpływu.
2. PRZYJMUJĘ i UZUPEŁNIAM Z KODU. Utrzymanie fortu/posterunku ZWERYFIKOWANO: płacą Pracę (`terrain-improvements.ts:608–610`, `fort` i `posterunek` w `IMPROVEMENT_KEYS` l. 92, `turn-economy.ts:991`). Kwota z kodu: baza 1 Praca/turę (`econ-params.json` l. 299–303; `turn-economy.ts:977–982`) × mnożnik epoki 1/2/4 (`terrain-improvements.ts:128–134`) → fort (epoka 3) 4 Praca/turę, posterunek (epoka 2) 2 Praca/turę. Oznaczono jako wynik z kodu, nie z gry.
   UWAGA (sprzeczność, NIE rozstrzygana, poza zakresem tej analizy): opis `ulepszenie_surowcowe_upkeep_praca` w `econ-params.json` mówi, że fort, posterunek, droga i ulepszenia żywnościowe są ZWOLNIONE; kod ich nie wyłącza (filtr `typ !== 'wycinka'`, `terrain-improvements.ts:608–610`). Wymaga decyzji orkiestratora/właściciela, która wersja jest intencją. Logiki nie zmieniano.
3. PRZYJMUJĘ, uzupełniono inwentarz (bez pełnego UI): gracz — `improvement-build.ts:1174–1200` (posterunek: własne terytorium + granica; fort: poza terytorium cudzego miasta z własną jednostką), `main.ts:17689–17715`, automat gracza `main.ts:44769`. Administrator miasta (`city-administrator.ts`): ZBADANO, 0 trafień fort/posterunek. AI — pełne przeszukanie `buildImprovement` w `gra/src`: `ai.ts:3206`, `ai.ts:3223`, picker przez `ai.ts:3046/3054`, `decideDefensiveCopyTurn` `ai.ts:5691`. Układ menu UI NIE ZWERYFIKOWANO wizualnie (wymaga przeglądarki; poza tą rundą).
4. PRZYJMUJĘ. Sekcja 6b: `aiOffersRejected`=7 i `aiOffersRejectAttempts`=7 w obu ziarnach; `forcedPeaceAccepted` = 4 (4242) i 1 (7), wg `seed4242.summary.json` i `seed7.summary.json`. Dodano ograniczenie 7: wymuszone pokoje mogą zmieniać granice; wpływu NIE ZMIERZONO.
BLOKADY: brak technicznych. Rozstrzygnięcie sprzeczności z econ-params (zarzut 2) wymaga decyzji właściciela.
RUNDY: 5 (obrona zarzutów Evaluatora r4; bez nowej rundy pomiaru; ostateczny limit wg orkiestratora).
NASTĘPNY KROK: Final Control r5 (weryfikacja poprawek w dokumencie i punktów z kodu).
UWAGI-DLA-ORKIESTRATORA: (a) sprzeczność econ-params vs kod dla upkeepu fortu/posterunku/drogi/żywności (zarzut 2) — poza zakresem tego tematu, zgłoszone do decyzji; nie zakładam, która wersja jest właściwa. (b) Zakres „pozostałe ścieżki AI” przeszukano grepem po `gra/src`, nie analizą dynamiczną.
DEPLOY/PUSH: NIE WYKONANO
