STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/weryfikacja)
TEMAT: R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (tag AIREBELVER)
GOAL: domknąć pozycje NIE ZMIERZONO z FAL 928 (rebelia miast AI, ochrona ostatniego miasta) i 929 (wpis „rebelia” w „Wydarzeniach na świecie”) na maksymalnych ustawieniach. Wynik: pozycja 5 zmierzona (60 tur, seed 4242 i 7); pozycje 1–4 NIE ZMIERZONO z powodami w dokumencie analizy.

ZMIANY/COMMIT: tylko pomiary i dokumentacja, zero zmian gra/src i gra/data.
- dyspozycje/analizy/AI-REBELIA-WERYFIKACJA-2026-11-27.md (tabela pozycja | wynik | NIE ZMIERZONO+powód)
- dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/10-operator-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/ (surowe JSONL i logi biegów, pliki *.txt)
Baza: 99375f77e (origin/main). SHA commita: patrz pole sha w odpowiedzi (commit po zapisie raportu).

TESTY (surowe wyniki, ten sam worktree, baza 99375f77e):
- tsc --noEmit: exit 0
- ai-city-rebellion-gate-test.cjs: WYNIK PASS=37 FAIL=0
- ai-city-rebellion-news-test.cjs: WYNIK PASS 24/0
- ai-test.cjs: ai-test: 297 passed, 0 failed
- logic-test.cjs: LOGIC OK (213/213).
- Bieg żywy: vite build poza repo (node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/rebel/dist); runner tools/ai-cult-rel-measure-run.cjs --pace wysoki --city-state 1 --kr trudny --difficulty trudny --turns 60, seed 4242 i 7. Chromium: pierwszy start zatrzymany na t20 (wznowienie z SIGSEGV/openGame), wznowienie do t60 przeszło za 2. podejściem (seed 4242); seed 7 przeszedł za 1. podejściem.
- Surowe liczby t60: s4242 bunt 7 miast, AI 149 miast, AI z 0 miast 0; s7 bunt 13 miast, AI 142 miast, AI z 0 miast 0 (szczegóły w dokumencie analizy).

BLOKADY:
1. Pozycja 1 (scenariusz wymuszony: AI z 1 miastem w buncie skrajnym) — brak haka w civTest; DECISION_REQUIRED: czy dodać hak testowy „wymuś bunt miasta AI” (zmiana gra/src, poza zakresem tej rundy). Bez niego wynik: NIE ZMIERZONO.
2. Pozycja 2 (stolica AI w buncie) — runner nie eksportuje stanu stolicy/Mennicy; NIE ZMIERZONO (wymaga haka, jw.).
3. Pozycja 3 (round-trip zapisu z listą Wydarzeń) — runner nie porównuje listy wydarzeń przed/po wczytaniu; NIE ZMIERZONO.
4. Pozycja 4 (zrzut okna dyplomacji) — NIE ZMIERZONO w tej rundzie (nie uruchomiono renderu z gra/tools/_live-ready.cjs).
5. Liczba wpisów „rebelia” na liście i widoczne graczowi cywilizacje — NIE ZMIERZONO (nie eksportowane przez runner).
6. (usunięte: logic-test 213 zmierzony, 213/213)

RUNDY: 1/5 (wynik: pozycja 5 zmierzona, pozostałe z blokadami powyżej).

UWAGI-DLA-ORKIESTRATORA:
- W dyspozycji i w dokumencie AI-REBELIA-WDROZENIE-2026-11-27 (main 44649038c) przy bazie 99375f77e: runner ma 7 buntów w s4242 i 13 w s7 w t60; wynik zgodny z dokumentem w granicach szumu między przebiegami (jeden przebieg na ziarno).
- Pole `lacznaZero` w cityState to liczba miast z łaską 0, a nie licznik cywilizacji bez miast — nie należy go czytać jako dowodu ochrony ostatniego miasta.
- Dispatch wskazuje runs/.../dane/*.txt, ale pliki tej rundy są kopiami JSONL/logów; brak osobnego pliku .log.
- Nie tworzono żadnego nowego spawn_task/create_session/create_trigger/send_later; nie używano run_in_background.
- Zainstalowano gra/node_modules (npm ci) — katalog ignorowany przez git; do usunięcia przed sprzątaniem worktree.

NASTĘPNY KROK: orkiestrator decyduje o haku wymuszającym bunt AI (pozycja 1–2) — DECISION_REQUIRED; po jego ewentualnym wdrożeniu powtórzyć pozycje 1–4.
DEPLOY/PUSH: NIE WYKONANO
