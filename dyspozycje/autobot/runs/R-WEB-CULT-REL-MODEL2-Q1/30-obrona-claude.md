STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza, bez zmian w gra/)
TEMAT: R-WEB-CULT-REL-MODEL2-Q1
GOAL: Obrona modelu kultury i religii (Szczęście + Prawo, łatwy +10/−10, normalny +5/−15, trudny 0/−20, skala epok ×1 / ×1,6 / ×2,3) wobec zarzutów Evaluatora; poprawki dokumentu i modelu; zero zmian w gra/src, gra/data, gra/tools.
ZMIANY/COMMIT: baza 3e7bbbabc (detach). Pliki: dyspozycje/analizy/KULTURA-RELIGIA-MODEL2-2026-11-26.md, dyspozycje/analizy/model-kultura-religia-model2-entry.ts, dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/10-wyniki-silnika.md (odświeżony zrzut), dyspozycje/autobot/runs/R-WEB-CULT-REL-MODEL2-Q1/30-obrona-claude.md. SHA: patrz pole sha w StructuredOutput (commit po zapisie raportu).
TESTY (surowe wyjście, uruchomione w tej rundzie):
- esbuild@0.24.0 bundle modelu: EXIT 0.
- node model: EXIT 0, 585 linii wyniku (sekcje 0–11).
- Zarzut 1: sekcja 4 modelu, hard|2|1|0 = Porządek 12,9; hard|2|2|0 = 9,0; hard|3|1|0 = 9,2; hard|3|2|0 = 6,4 (wcześniej w dokumencie „9–13”, teraz poprawione na 6,4–12,9).
- Zarzut 2: sekcja 2 (dziś / propozycja): normal|2|Garn b 1/0 → 2/0, c 1/0 → 2/0; normal|3|bez b 3/2 → 4/3; normal|2|bez b 3/1 → 3/2; normal|1|bez b 2/1 → 2/2; normal|1|Garn b 1/0 → 1/0 (bez zmian). Potwierdzone i opisane w dokumencie §3.
- Zarzut 3: sekcja 9 (m1 = trudny D −12, G 0; pop 5, epoka 1): a 2/1 bez zmian; b bez 4/3 → 3/2; c bez 4/3 → 3/2; d bez brak/4 → 4/3; d Garn 3/2 → 2/1; b/c Garn 2/1 → 1/0. Potwierdzone (wcześniej podany był tylko skutek dla d).
- Zarzut 4: kod gra/src/game/society-breakdown.ts: porPctBand (≥90 lad, ≥70 spokoj, ≥50 napiecie, ≥30 niepokoj, ≥crit bunt); orderEffectsFromPorPct: niepokoj = pełne efekty Niepokoju (unrest); napiecie = tylko productionMult 0,95; spokoj = brak kar. Zarzut częściowo trafny: kara nie znika od 50, lecz zostaje tylko −5% produkcji; pełna kara do 49, zero od 70. Dopisano ostrzeżenie w dokumencie. Progów 50 i 70 w liczbach NIE POLICZONO.
- Zarzut 5: gra/data/buildings.json Świątynia: epokaWejscia 2, wymagania „Wybudowane Kamienne kręgi w tym mieście”, zadowolenie baza 2, przyrost +1, maksPoziom 2. grep „religia_swiatynia_zadowolenie” w gra/src: 0 trafień (parametr nieczytany; wartości 2/1/0 nie wchodzą do gry). Model stały 2 jest więc zgodny z silnikiem, a nie z tym parametrem. Dopisano sekcję 10 modelu: Świątynia bez Garnizonu (np. hard epoka 2, scen. a: 4/2; scen. b/c/d: brak/4, brak/4, brak/brak; normal epoka 2 d: 5/4).
- Zarzut 6: opcja postCapture w modelu była nieużywana. Dodano sekcję 11: hard, epoka 1, pop 5, bez garnizonu, scen. a i d: Porządek przy 5 turach Prawa 100% = 55%, potem 0%; rebelia w turze 9 (bez postCapture: tura 4). Odbicie po buncie (10 tur, post-capture-law.ts) nie modelowane.
- Bramka bezpieczeństwa: w worktree zero zmian w gra/ (git diff --stat: 3 pliki w dyspozycje/).
BLOKADY: brak. Nie zmierzono w grze (runtime, AI): NIE ZMIERZONO. Progi 50/70 Porządku, poziom 2 Świątyni, odbicie po buncie, Pałac/stolica poza modelem — NIE POLICZONO.
RUNDY: 1/5 (obrona).
ODPOWIEDZI NA ZARZUTY:
1. PRZYJĘTE — poprawiono zakres 6,4–12,9 (dokument §5).
2. PRZYJĘTE — wniosek §3 przepisany; b i c na normalnym rosną o 1 jednostkę (epoka 2–3 bez budynków, epoka 2–3 z Garnizonem), łatwy b/c bez zmian.
3. PRZYJĘTE — dopisana mutacja m1 (D −12) dla wszystkich scenariuszy (§4, §8 pyt. 3, sekcja 9 modelu).
4. PRZYJĘTE z korektą — pasmo 30–49 ma pełne efekty Niepokoju; 50–69 tylko −5% produkcji; od 70 brak kar (§1 uwaga). Liczb progów 50/70 nie policzono.
5. CZĘŚCIOWO ODRZUCONE Z DOWODEM — wartość Świątyni 2 (poziom 1) jest zgodna z buildings.json; parametr religia_swiatynia_zadowolenie nie jest czytany przez gra/src (0 trafień). PRZYJĘTE: brak poziomu 2 (+1) i brak Świątyni bez Garnizonu w tabelach — dopisano opis luki (§ „Pokrycie budynków”) i sekcję 10 modelu. Epoka 1: Świątynia niedostępna (epokaWejscia 2), więc brak kolumny dla epoki 1 jest poprawny.
6. PRZYJĘTE — opcja postCapture użyta (sekcja 11); wynik: rebelia w turze 9 zamiast 4 (hard, bez garnizonu).
NASTĘPNY KROK: Final Control (Sonnet) wg dispatchu; decyzje do właściciela (DECISION_REQUIRED) bez zmian: §8 pyt. 1–5 (obcięcie Szczęścia od 0%, trudny bunt własnych miast przy G=0, D −20 vs 4 do neutralnego, łatwy G, skala epok na trudnym).
ROZPISKA DLA WŁAŚCICIELA (do potwierdzenia, zgodna z korektą 2026-11-26): kultura i religia działają na Szczęście i Prawo; łatwy: dla każdej linii −10 (obce miasto) do +10 (własne miasto); normalny: −15 do +5; trudny: −20 do 0; każda z dwóch linii osobno; mnożnik epok ×1 / ×1,6 / ×2,3; minusy bez zmian względem propozycji. Pełna tabela: dyspozycje/analizy/KULTURA-RELIGIA-MODEL2-2026-11-26.md §1.
UWAGI-DLA-ORKIESTRATORA: (a) interpretacja z dispatchu „+40 na łatwym” jest już nieaktualna (dokument §1 to wyjaśnia); (b) parametr religia_swiatynia_zadowolenie w gra/data/society-params.json jest martwy w gra/src — do decyzji, czy usunąć lub podpiąć (zmiana poza tym tematem); (c) odbicie po buncie (10 tur) nie jest modelowane.
DEPLOY/PUSH: NIE WYKONANO
