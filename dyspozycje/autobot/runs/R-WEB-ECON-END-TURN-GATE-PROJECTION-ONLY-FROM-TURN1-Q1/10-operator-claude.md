STATUS: BLOCK (częściowo: kod i testy jednostkowe; pomiary w żywej grze NIE WYKONANE)
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: bramka „Zakończ turę” liczy wyłącznie prognozę po turze, od tury 1; Spichlerz z automatem przed bramką; propozycja podatku do zera; brak martwego punktu.
ZMIANY-COMMIT: gałąź `gate-proj-r2-operator-wip` (worktree wf_7dcbad28-f80-1). Baza: 68f9f336b (runda 2 poprzedniej próby) + merge origin/main 4867cd20f (commit 9da316001). Commit raportu i zmian: czubek gałęzi (SHA w polu sha wyniku).
  - gra/src/game/no-negative-stocks.ts: rozwiązany konflikt nagłówka (komentarz o AI od tury 1: NNS_AI_BALANCE_TURN_MIN = 1); nowa czysta funkcja propozycjaPodatkuKrokami (wyszukiwanie po krokach 10 pkt %, zwraca null gdy nawet maksimum nie wystarcza); typ szacunek 'liniowy' | 'krokowy'.
  - gra/tools/end-turn-gate-projection-only-test.cjs: 5 nowych asercji dla propozycjaPodatkuKrokami (prognoza po zastosowaniu >= 0; brak -> null; ograniczenie do maksimum).
  - gra/tools/no-negative-stocks-ai-from-turn1-test.cjs: 3 asercje gracza (tury 1, 5, 10) zmienione z „wyjątek zostaje” na „blokada od tury 1” (stare asercje sprzeczne z decyzją właściciela). Część AI nietknięta.
  - gra/src/data/wikiBundle.json: regenerowany narzędziem gra/tools/bundle-wiki-for-game.cjs (22 rozdz., 182 hasła).
TESTY (surowe wyjścia, node):
  - tsc --noEmit (gra/): rc=0
  - end-turn-gate-projection-only-test: 32 passed, 0 failed
  - no-negative-stocks-ai-from-turn1-test: 27 passed, 0 failed (wcześniej 24/3 — 3 stare asercje gracza)
  - no-negative-stocks-test: 25/0; -projection-test: 49/0; -endturn-test: 19/0; -end-turn-gate-levers-test: 34/0; -c2-test: 44/0; -ai-t2-test: 11/0; -ai-test: 8/0
  - no-negative-stocks-c3-turn-test: rc=1 „wymagane: --dist <bundle>” (narzędzie wymaga argumentu, nie błąd kodu); no-negative-stocks-ai-t2-behavior-test: rc=2 to samo.
  - Mutacje i dowód czerwony na bazie: NIE WYKONANO w tej rundzie.
PUNKTY DISPATCHA DODATKU 5 (ZMIERZONO / NIE ZMIERZONO):
  1. Zrzuty Chromium (a–e) — NIE ZMIERZONO. Brak builda (vite poza repo) i brak uruchomienia przeglądarki w tej rundzie; brak PNG w runs/.
  2. Pomiar zgodności projekcji z realnym endTurn (>=3 ziarna x T1–15) — NIE ZMIERZONO. Brak tabeli różnic.
  3. Wyszukiwanie po krokach zamiast propozycjaPodatkuDoZera — CZĘŚCIOWO: dodano funkcję propozycjaPodatkuKrokami z testem czystym, ALE NIE PODPIĘTO jej do main.ts (decideEndTurnGate nadal używa estymacji liniowej propozycjaPodatkuDoZera). Test „po zastosowaniu prognoza >= 0” dotyczy funkcji czystej, nie ścieżki gry.
  4. Pełna ścieżka autoBalanceRationsToSolvency z clampem maxSafe i brak efektów ubocznych w projekcji — NIE ZMIERZONO (nie zweryfikowano w tej rundzie).
  5. Testy z main.ts/Chromium (end-turn-gate-live-test.cjs) — NIE WYKONANO (plik nie powstał).
  6. Dokumentacja: spichlerz.md zawiera już „Od tury 1” i brak wyjątku 1–10 (sprawdzone grep). Stary skrypt live-verify-wave-689-697-a-gate-v2.cjs (asercja „tury 1–10 nie mogą blokować”, linia ~93) NIE zaktualizowany — wymaga Chromium; dług. live-verify-wave-689-697-a-gate-v4.cjs i live-verify-wave-703-710-Q1.cjs: NIE ZBADANE szczegółowo.
  7. NNS_AI_BALANCE_TURN_MIN = 1 w origin/main — ZMIERZONO w kodzie (no-negative-stocks.ts, linia ~349); nie zmieniano.
  8. Stabilna struktura dla R-WEB-UI-END-TURN-BLOCK-EVENT-Q1: istnieje wynik decideEndTurnGate (powód, zasób, prognoza, dźwignie, propozycja podatku) oraz komunikat „Nie można zakończyć tury. …” (komunikatBramki). Jednej jawnej struktury dla UI jeszcze nie ma — do zrobienia.
ZAŁOŻENIA: konflikt nagłówka rozstrzygnięto na wersję „od tury 1”; komentarz o AI zaktualizowano do NNS_AI_BALANCE_TURN_MIN = 1.
BLOKADY: (a) brak Chromium/buildu w tej rundzie; (b) propozycjaPodatkuKrokami nie podpięta do gry; (c) brak pomiaru projekcja vs realność; (d) brak mutacji. Bez (a)–(d) temat NIE może dostać READY.
RUNDY: 2/5 (ta runda). Poprzednia runda 1: FC FAIL (664361a77) wg dispatcha.
NASTĘPNY KROK: podpiąć propozycjaPodatkuKrokami w gra/src/main.ts (ścieżka bramki gracza), wykonać pomiary a–e w Chromium i tabelę projekcja-vs-realność (>=3 ziarna, T1–15), zrobić mutacje, zaktualizować live-verify-wave-689-697-a-gate-v2.cjs.
UWAGI-DLA-ORKIESTRATORA: (1) Worktree ma zainstalowane gra/node_modules (npm ci --ignore-scripts) — do usunięcia przy sprzątaniu. (2) Gałąź lokalna `gate-proj-r2-operator-wip` nie została wypchnięta (orkiestrator decyduje). (3) Dispatch zawiera sprzeczność: „test AI-from-turn1 NIE ruszaj” vs „zaktualizuj testy zakładające wyjątek 1–10 dla gracza” — zmieniono tylko asercje gracza.
DEPLOY/PUSH: NIE WYKONANO
