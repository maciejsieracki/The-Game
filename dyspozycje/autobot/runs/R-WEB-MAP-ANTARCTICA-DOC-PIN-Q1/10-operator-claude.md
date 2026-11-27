# R-WEB-MAP-ANTARCTICA-DOC-PIN-Q1 (ANTARDOC) — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-MAP-ANTARCTICA-DOC-PIN-Q1 (ANTARDOC, #145)
GOAL: zapisać decyzję właściciela 5B (ECHO 2026-11-26, R-WEB-MAP-EARTH-ANTARCTICA-Q1): Antarktyda usunięta z mapy Ziemi; poprawić `docs/decyzje/A-MAP-ZIEMIA-1.md` i stary pin w `gra/tools/earth-template-test.cjs` bez osłabiania asercji.
BAZA: origin/main 6319eaf66 (`git merge-base --is-ancestor 6319eaf66 HEAD` — zob. sekcję ZMIANY/COMMIT).

## ZMIANY/COMMIT
- `gra/tools/earth-template-test.cjs`:
  - stara asercja `Antarktyda w szablonie nad buforem południowym (land > 0)` ZAMIENIONA na przeciwną: `brak lądu Antarktydy w środkowym paśmie r=85 (35–65% szerokości)` = 0 (zachowany dowód POLARZERO);
  - nowe asercje: pas polarny południowy = 3 rzędy nad buforem + bufor (r=85..117 na mapie standardowej), pełna szerokość: 0 lądu w szablonie dla Standard, Duży (240×168) i Ogromny (336×238) oraz 0 heksów lądu terenem na wygenerowanych mapach Standard i Duży;
  - eksport `ROZMIAR_DIMS` dodany do wejścia bundla (tylko test, bez zmian w `gra/src`).
- `docs/decyzje/A-MAP-ZIEMIA-1.md`: Antarktyda ZOSTAJE → USUNIĘTA (decyzja 5B, odnośnik do ECHO 5B na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, bo w main rejestru 5B jeszcze nie ma); opis residualnego lądu.
- `dyspozycje/autobot/runs/R-WEB-MAP-ANTARCTICA-DOC-PIN-Q1/10-operator-claude.md` (ten raport).
- Zero zmian w `gra/src`, `gra/data`, rejestrze, WERSJE.md.

## TESTY
- Baseline przed zmianą (origin/main 6319eaf66): `earth-template-test: 9 pass, 1 fail` (FAIL: Antarktyda r=85 found 0) — odtworzone.
- Po zmianie: `earth-template-test: 10 pass, 5 fail`. Zielone: 10 asercji (w tym odwrócona asercja środkowego pasma r=85: found 0). Czerwone (5) — wszystkie dotyczą jednego zjawiska, patrz BLOKADY:
  - `ziemia standard: 0 lądu w pasie polarnym południowym (r=85..117, found 6)`;
  - `ziemia standard: 0 heksów lądu (terenem) w pasie polarnym południowym (found 6)`;
  - `ziemia duzy (240×168): 0 lądu w szablonie ... (found 5)`;
  - `ziemia ogromny (336×238): 0 lądu w szablonie ... (found 7)`;
  - `ziemia duzy: 0 heksów lądu (terenem) ... (found 5)`.
- Lokalizacja residualnego lądu (sonda, tylko odczyt maski): wszystkie trafienia leżą w NAJWYŻSZYM rzędzie pasa (standard r=85: q=46–49 i 152–153; Duży r=133: q=66–70; Ogromny r=203: q=92–98), czyli w rzędzie tuż nad buforem południowym, a nie w środku pasa.
- Mutacja (tymczasowa kopia testu, przywrócenie lądu na r=85, q=środek): odwrócona asercja środkowego pasma → `found 1` (CZERWONA), pozostałe asercje pasa też czerwone; 8 pass / 7 fail. Mutacja wykryta.
- Bramki ogólne (tsc 0, logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0): NIE URUCHOMIONO — poza zakresem tej zmiany (zmiana dotyczy wyłącznie testu i dokumentu, nie kodu gry); nie przeprowadzono, NIE_ZMIERZONO.
- Pomiar na poziomie maksymalnym: szablon Ogromny sprawdzony na poziomie szablonu maski (bez generowania mapy — pełne generowanie Ogromnego zajęłoby zbyt długo dla bramki); mapa terenowa Ogromny NIE_ZMIERZONO.
- Czas testu z generacją map: ok. 350 s (standard + duży + kontynenty).

## BLOKADY
1. **Residualny ląd w pasie polarnym południowym (DECISION_REQUIRED).** Decyzja 5B mówi: pas polarny południowy bez lądu. Maska/generator w `gra/src/map/earth-land-mask.ts` (dane maski `earth-land-mask.generated`) nadal daje 5–7 heksów lądu w najwyższym rzędzie pasa, a na wygenerowanej mapie Duży 5 heksów terenu. POLARZERO (r=85) mierzył tylko środkowe pasmo 35–65%, stąd „r=85 bez lądu” jest prawdziwe tylko częściowo. Naprawa wymaga zmiany `gra/src` lub danych maski — poza allowlistą tematu, więc Operator jej nie wykonał.
   - Wariant A (rekomendowany przez Operatora, niezbadane kosztowo): przyciąć maskę/generator tak, by pas polarny południowy był pusty na pełnej szerokości → test zielony po zmianie src (osobny temat, zmiana w grze: kilka heksów mniej na biegunie).
   - Wariant B: uznać residualny ląd za zamierzony (wtedy wpisać w decyzji 5B, że pas to tylko środkowe pasmo, i zwęzić asercję do 35–65%) — wymaga decyzji właściciela, bo zmienia definicję „pasa”.
2. Dokument A-MAP-ZIEMIA-1 odwołuje się do ECHO 5B, który jest na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie w main (rejestr w main nie zawiera „5B”). Orkiestrator powinien zintegrować rejestr razem z tym tematem.

## RUNDY
1/5. Ostatni werdykt: DECISION_REQUIRED (residualny ląd w pasie — generator/maska). Decyzja wymagana: wariant A lub B z BLOKADY 1.

## UWAGI-DLA-ORKIESTRATORA
- Nie uruchamiałem żadnego tworzenia sesji/zadań; `npm ci --ignore-scripts` wykonano tylko w `gra/` tego worktree (do uruchomienia testu, usuwane po pracy).
- Test `earth-template-test` jest po zmianie czerwony w 5 asercjach — zgodnie z zakazem osłabiania asercji nie zawężałem pasa do środkowego pasma. Jeśli właściciel wybierze wariant B, zawężenie wykonać jako osobną zmianę z decyzją w rejestrze.
- Mapa Ogromny: pełne wygenerowanie nie wykonane (czas), tylko szablon maski.

NASTĘPNY KROK: decyzja właściciela A/B (pytanie ABC wg zasad: wpływ na wygląd bieguna i zakres mapy), potem osobny temat na src.
DEPLOY/PUSH: NIE WYKONANO
