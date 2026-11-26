STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-DIAG-Q1
GOAL: ustalić LICZBAMI, dlaczego AI na „Kultura i religia: trudny” (poziom maksymalny) ma ok. 30% mniej jednostek i dużo pustych miast względem trybu zgodności. Tylko pomiar i diagnoza, zero zmian reguł i balansu.
ZMIANY/COMMIT: BAZA origin/main 5748b924f (FALA 926); `git merge-base --is-ancestor 5748b924f HEAD` = tak. Allowlista: gra/src/main.ts (hak `__aiEconomyMeasure.cityStateTurn`, tylko odczyt, wewnątrz bloku ?civTest=1), gra/tools/ai-cult-rel-measure-run.cjs (flaga --city-state 1), dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md, ten raport. Poprawka AI: brak (przyczyna to wartości balansu, nie błąd AI). SHA: patrz pole sha w odpowiedzi (commit).
TESTY:
- Pomiar: 4 biegi x 60 tur, headless Chromium, żywy bundle vite (poza repo): trudny s4242, trudny s7, zgodnosc s4242, zgodnosc s7. Oba warianty z difficulty=trudny; różni się tylko „Kultura i religia”.
- Poziom maksymalny = „Trudny” (difficulty i kulturaReligiaLevel = trudny); odniesienie = zgodnosc.
- Tura 60, AI: jednostki 187 vs 273 (s4242, −31%), 205 vs 337 (s7, −39%); miasta 159 vs 190 i 165 vs 194; puste miasta 50/159 vs 56/190 i 57/165 vs 38/194.
- Nowe jednostki (t2–60): 220 vs 335 (−34%) i 248 vs 345 (−28%). Głód/deficyt 0 we wszystkich biegach; rebelia 0 (0 miast rebeliantów).
- Porządek śr. t10: 19,5 vs 51,5 (s4242), 21,6 vs 51,2 (s7); w t60 miast poniżej progu bunt skrajny (14%): 63/159 i 81/165 vs 7/190 i 0/194.
- Bramki (surowe wyjścia): tsc --noEmit exit 0; logic-test LOGIC OK 213/213; tech-tree-test 20 pass 0 fail; research-test PASSED 33 / FAILED 0; combat-test 6/6; ai-test 297 passed 0 failed; ai-city-order-need-wiring-test 231 passed 0 failed; ai-unit-replace-same-rules-test 45 passed 0 failed.
BLOKADY: brak blokad technicznych. Pomiar nie objął: podziału −30% na mechanizmy (brak wariantu bez kary Porządku), przyczyny braku rebelii przy 40–49% miast w strefie buntu skrajnego, utraconych miast AI wg przyczyny, rozdziału zakupu i produkcji jednostek, innych ziaren i poziomów kultury.
RUNDY: 1/5
NASTĘPNY KROK: decyzja właściciela (DECISION_REQUIRED, jedno zdanie skutku per wariant w dokumencie analizy, sekcja „Decyzja wymagana”): A = zostawić „Kultura i religia: trudny” (AI ma 30–40% mniej jednostek i połowę miast w buncie skrajnym); B = zmienić wartości parametrów kultury/Porządku dla „trudny” (osobny pomiar, dotyka wszystkich trudności). Równolegle: osobny temat na wariant z wyłączoną karą Porządku (potwierdzenie hipotezy) i na pytanie, dlaczego przy strefie buntu skrajnego nie ma żadnej rebelii (grace / ochrona garnizonem FALI 926).
UWAGI-DLA-ORKIESTRATORA:
- Znalezisko do osobnej oceny: 40–49% miast AI w strefie PorPct < 14% w t60 (trudny), a przez cały bieg 0 rebelii i 0 miast rebeliantów. Zgodnie z parametrami grace (hard = 2 tury) rebelia powinna się pojawiać. To może być zamierzona ochrona garnizonem (FALA 926) albo luka — nierozstrzygnięte, NIE ZMIERZONO.
- Hak cityStateTurn jest trwały w main.ts (tylko ?civTest=1, bez wpływu na grę); runner ma flagę --city-state 1 (domyślnie wyłączona).
- Dane surowe (poza repo): /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aicult/ (trudny-4242, trudny-7, zgod-4242, zgod-7, analyze.py).
- Dyscyplina procesu: nie użyto spawn_task, create_session, create_trigger, send_later, run_in_background (bieg 4 został automatycznie przeniesiony do tła przez narzędzie po przekroczeniu domyślnego limitu 120 s; wynik odczytany z pliku wyjściowego po zakończeniu, bez drugiej kopii). Zero zmian w gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.
DEPLOY/PUSH: NIE WYKONANO
