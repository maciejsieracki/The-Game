STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-IMPROVEMENT-MASS-ON-DISCOVERY-Q1
GOAL: (1) zmierzyć, ile tur mija od odkrycia technologii do pierwszego i pełnego ulepszenia (farma, trzoda, irygacja); (2) poprawić autoulepszanie, jeśli nie rusza masowo w turze odkrycia w granicach puli i kosztów; (3) przeformułować test autoimprove-pasture-irrigation-q2 (e) od tury odkrycia.
ZMIANY/COMMIT: baza 7148b2f4e1b6b927ce572593e7379c641cc1bfe9. Zmienione: gra/tools/autoimprove-pasture-irrigation-q2-bisect.cjs (DISC_PAST/DISC_IRR, metryki od odkrycia), gra/tools/autoimprove-pasture-irrigation-q2-test.cjs (scenariusz a/b/c z ziaren 1–4; sekcja (e) od odkrycia D=10), dyspozycje/analizy/ULEPSZENIA-MASOWO-PO-ODKRYCIU-2026-11-26.md, ten raport. Kod gry (gra/src) i dane (gra/data, w tym improvement-cost-params.json i terrain-improvements.ts) NIEZMIENIONE. Brak poprawki pickera: diagnoza nie wykazała błędu kolejności ani limitu niezgodnego z regułami.
TESTY:
- tsc --noEmit (gra/): EXIT 0, 0 linii wyjścia.
- autoimprove-pasture-irrigation-q2-test: 15 OK / 0 FAIL (po zmianie).
- Mutacja czerwona (E3 → [] w kopii gra/src): 12 OK / 3 FAIL.
- Pomiar 14 ziaren, odkrycie w turze 1: trzoda 2 (po odkryciu 1 tura); irygacja mediana 9 tur po odkryciu (zakres 2–39, brak w 1 ziarnie do t44).
- Pomiar 14 ziaren, odkrycie w turze 10: trzoda 0–3 tury po odkryciu (mediana 0); irygacja w 44 turach: 1 ziarno (32 tury po odkryciu), 13 brak; 0 naruszeń kolejności; 0 głodzenia.
- Pomiar 14 ziaren, odkrycie w turze 20: trzoda 0–8 tur po odkryciu; irygacja brak we wszystkich (24 tury po odkryciu); 0 naruszeń; 0 głodzenia.
- Dłuższy bieg 90 tur, odkrycie w turze 10, ziarna 1–4: irygacja 36–46 tur po odkryciu.
- Eksperyment kontrolny: limit 100% zamiast 33% — irygacja w turze 2 (ziarna 1, 3, 8). Potwierdza, że wąskim gardłem jest limit puli gracza, a nie koszt i nie kolejność.
- Bramki nieuruchomione lub nieudane poza zakresem zmiany: autoimprove-stages-q1-test — 217 OK, 3 FAIL, przerwany limitem czasu (plik nie zależy od zmienionych plików; nie sprawdzano na bazie). autoimprove-irrigation-after-farms-test — limit czasu, wynik NIE ZMIERZONO. autoimprove-river-forest-clear-no-citizen-q1-test — wymaga ROBOCZA_HTML (live), NIE URUCHOMIONO. Pozostałe bramki (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0): NIE URUCHOMIONO w tej rundzie.
BLOKADY: Decyzja właściciela o kolejności E3→E4 (trzoda przed irygacją) i/lub limicie 33% (decyzja #24). Bez niej poprawka po stronie kodu nie jest zasadna.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator zadaje pytanie ABC (poniżej). Po odpowiedzi: wariant A — brak zmian w grze, zamknąć temat; wariant B — osobny temat implementacji (pickAutoImprovementsStaged, warunek earlierStageIsPending dla E3→E4) z przepisaniem niezmiennika kolejności w teście (e).

DECISION_REQUIRED (jedno zdanie na wariant, bez rozwiązania w kodzie):
- A: zostawić kolejność — irygacja po odkryciu czeka, aż cała trzoda na farmach będzie gotowa (zmierzone 36–46 tur przy limicie 33% puli).
- B: pozwolić irygacji startować w turze odkrycia równolegle z trzodą (ta sama pula) — zmienia zasadę kolejności etapów E3→E4 i niezmiennik w teście (e).

Propozycja progu dla testu (e) na irygację: NIE podajemy liczby. Przy wariancie A test sprawdza tylko trzodę (≤3 tury) i brak głodzenia; irygacja jest logowana bez progu.

DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (1) Harness bisect używa założenia +120 Pracy na turę (NIE ZMIERZONO w grze). (2) Irygacja w tech-mapie to „Gospodarka wodna” (TECH_CANONICAL), nie „Irygacja” — filtr technologii w harnessie zrobiony na kanonicznej nazwie. (3) Test (b) na ziarnie 1 nie ma pola poza rzeką z farmą; wybrane ziarno 3 ma jedno takie pole — asercja spełniona na minimalnym scenariuszu.
