# R-WEB-EARLY-DEFEAT-CAUSE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian logiki gry, progów i danych)
TEMAT: R-WEB-EARLY-DEFEAT-CAUSE-Q1 (tag DEFEAT)
GOAL: ustalić, kto i jak zdobywa jedyne miasto gracza przy maksimum (seed 4242 i 7), porównać ustawienia (dolny poziom, dwie jednostki obronne), rozstrzygnąć round-trip po przegranej, poprawić klasyfikację gameOver w runnerach.
ZMIANY-COMMIT: patrz czubek brancha (SHA w polu `sha` raportu). Pliki:
- `gra/src/main.ts` — jeden read-only hak `__defeatTestDebug.cityThreatProbe` (odczyt miast i jednostek, bez mutacji; +hook 10 linii) i tylko odczyt w tej sondzie.
- `gra/tools/defeat-cause-live.cjs` — nowy runner (warianty max / low / garrison, round-trip po przegranej).
- `gra/tools/endstall-fortring-live.cjs`, `gra/tools/vlive3-fortring-live.cjs` — klasyfikacja `gameOver` jako wynik „przegrana” zamiast `cannot-end` (pkt 4).
- `dyspozycje/analizy/PRZEGRANA-GRACZA-PRZYCZYNA-2026-11-27.md` — analiza z tabelami.
- `dyspozycje/autobot/runs/R-WEB-EARLY-DEFEAT-CAUSE-Q1/10-operator-claude.md` — ten raport.
TESTY:
- Pomiar na żywo (Chromium headless, bundle esbuild poza repo, sekwencyjnie): maksimum 42 przebiegi (seed 4242: 31, seed 7: 11) → 13 przegranych (9/31 i 4/11); dolny poziom 10 przebiegów (4242: 5, seed 7: 5) → 6 przegranych (2/5 i 4/5); maksimum + 2 jednostki obronne 10 przebiegów (5+5) → 0 przegranych, 20 tur ukończone we wszystkich.
- Przyczyna (13/13 przegranych): zdobywca = barbarzyńcy (owner -1); siły = 1–2 „Wojownik szekelesz” w odległości 1–2 heksów w turze poprzedzającej; garnizon gracza = startowy Zwiadowca poza garnizonem; w turze przegranej otwarte podsumowanie bitwy; zero zdobyć przez AI.
- Round-trip (2 przegrane, tury 9 i 10): zapis blokowany przy otwartym podsumowaniu bitwy (`isSaveBlockedByBattle`); po zamknięciu bitwy zapis i odczyt działają; po jednym końcu tury przegrana wraca (gameOver=true, owner -1). Werdykt: artefakt harnessu (snapshot pomija barbarzyńców; `miasta=` to `cities.length`).
- Bramki (po zmianie main.ts): `npx tsc --noEmit` rc=0; `logic-test` LOGIC OK (213/213); `tech-tree-test` 20 pass / 0 fail; `research-test` ALL GREEN; `unit-replace-test` 21/21; `combat-test` All sanity checks passed; `ai-test` 297 passed / 0 failed; `ai-city-rebellion-gate-test` PASS=37 FAIL=0; `ai-city-rebellion-news-test` PASS 24/0.
- NIE ZMIERZONO: wariant (c) z realnie budowaną przez gracza jednostką (hak klonuje istniejący szablon wojskowy świata, więc użyto klonów wojownika barbarzyńców); przyczyna różnicy 15/24 (ENDSTALL) vs 13/42 (ta runda); siły i straty w logu bitwy (log zawiera tylko flagę podsumowania); formalny stan wojny (nie dotyczy zdobywcy barbarzyńskiego).
BLOKADY: brak. Uwaga: pliki `*.txt` z surowymi logami nie są w repo (poza `scratchpad/defeat/`).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o pytaniu balansowym (sekcja DECYZJA poniżej); ewentualny temat naprawczy runnera ENDSTALL (już wykonane w tej rundzie) i ocena „gameOver po wczytaniu” jako zachowania.
DEPLOY/PUSH: NIE WYKONANO

## DECYZJA (jednozdaniowa, dla orkiestratora)

DECISION_REQUIRED: Przy maksymalnym ustawieniu, gdy gracz nie buduje obrony, jedyne miasto ginie w ok. 31% przebiegów (tury 8–16) w ataku barbarzyńców, a z dwiema jednostkami wojskowymi na mieście w 0% — (A) zostawić obecny balans, (B) zwiększyć obronę startową gracza (mniej przegranych we wszystkich ustawieniach), (C) zmienić zachowanie barbarzyńców w pobliżu miasta w pierwszych turach (mniej przegranych bez zmiany obrony gracza); decyzja należy do właściciela.

## UWAGI-DLA-ORKIESTRATORA

- Pole `gameOver` nie jest zapisywane w zapisie gry: po wczytaniu przegranej stan pokazuje `gameOver=false` do końca tury, a przegrana wraca wtórnie w tym końcu tury. Czy ekran porażki powinien wracać od razu, to pytanie o zachowanie (nie zgłoszono jako błąd).
- Zapis po przegranej, gdy otwarte jest podsumowanie bitwy, jest odrzucany przez `isSaveBlockedByBattle` (zamierzona bramka). Runner musi zamknąć bitwę przed round-trip.
- Różnica w odsetku przegranych względem ENDSTALL (62% vs 31%) nie została wyjaśniona; warto ją rozważyć przy kolejnym pomiarze balansu.
- Zakaz nowych sesji zachowany (brak spawn_task/create_session/create_trigger/send_later). Brak `run_in_background` w poleceniach tej rundy (jedno automatyczne przeniesienie pętli do tła zostało zakończone przed startem następnej serii).
