# R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: BLOCK (częściowo: logika, testy jednostkowe i mutacje nowego kodu; pomiary w żywej grze NIE ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: blokada „Zakończ turę” liczy prognozę PO turze i PO reakcji automatu, od tury 1; brak dźwigni = brak blokady; propozycja podatku krokami; stabilny kształt wyniku dla UI.
BAZA: d71eda0e703f582ca6f696c658b3db4a91996c76 (kandydat rundy 2; zawiera merge origin/main 4867cd20f). Gałąź lokalna `wf-gate-r2`, worktree wf_7dcbad28-f80-3. Commit obrony: SHA w polu `sha` wyniku.
ZMIANY-COMMIT (allowlista, 3 pliki; `git diff --check` czysty):
  - gra/src/game/no-negative-stocks.ts: pole `niewystarczajace` w NnsGateResult; nowe pole wejściowe `NnsEndTurnLevers.prognozaPoPodatku` (prognoza skarbca po turze przy +p pkt, już po automacie); `decideEndTurnGate` używa `propozycjaPodatkuKrokami` gdy callback podany (fallback: estymacja liniowa z szacunek 'liniowy').
  - gra/src/main.ts: wyłącznie literał zwracany przez `nnsGateForPlayer` przy braku prognozy (dopisane `niewystarczajace: false`, wymagane przez typ). Ścieżka wyboru/wysyłania ofert AI nietknięta.
  - gra/tools/end-turn-gate-projection-only-test.cjs: +9 asercji (blok „r2”) — krokowa propozycja, najmniejszy krok, prognoza po zastosowaniu ≥ 0, maksimum nie wystarcza → propozycja null + flaga, częściowa dźwignia → brak blokady + flaga, brak dźwigni → flaga false, fallback liniowy.
  - Brak zmian: dochody/koszty, równoważenie AI, ai-params.json, dźwignia kolejki, mechanika automatu, wikiBundle (nie dotykane w tej rundzie), WERSJE.md.

KSZTAŁT WYNIKU DLA UI (R-WEB-UI-END-TURN-BLOCK-EVENT-Q1, zarzut 8):
  NnsGateResult = { blokada: boolean; komunikat: string; dzwignie: {id, stock, zysk, opis}[]; zasob: 'skarbiec'|'spichlerz'|null; prognoza: number|null (po automacie); propozycjaPodatku: {punktyProcentowe, szacunek: 'krokowy'|'liniowy', maksPunktow}|null; automatPoprawil: boolean; niewystarczajace: boolean }.
  Znaczenie `niewystarczajace`: true = prognoza < 0 i (a) dźwignie gracza nie pokrywają braku (bramka NIE blokuje, bo brak softlocku), albo (b) blokada, ale nawet maksymalny podatek nie daje zera skarbca (propozycja null, blokada zostaje).

TESTY (surowe wyjścia, node, gra/):
  - `node tools/end-turn-gate-projection-only-test.cjs` → `41 passed, 0 failed` (przed rundą: 32/0; +9 nowych).
  - `npx tsc --noEmit` → rc=0 (po `npm ci --ignore-scripts` w worktree; bez tego tsc/esbuild nie startują).
  - Pozostałe NNS (surowo): no-negative-stocks-ai-from-turn1-test 27/0; -ai-t2-test 11/0; -ai-test 8/0; -c2-test 44/0; -end-turn-gate-levers-test 34/0; -endturn-test 19/0; -projection-test 49/0; -test 25/0. Wszystkie rc=0.
  - Nie uruchamiane w tej rundzie: 5 bramek referencyjnych spoza NNS (logic, tech-tree, research, unit-replace, combat) — NIE ZMIERZONO.
  - MUTACJE (dowód czerwieni nowego kodu, po przywróceniu pliku: 41/0):
    M-A: `if (false && extra.prognozaPoPodatku && …)` → 38 passed, 3 FAIL (krokowy szacunek, krok 10, po zastosowaniu ≥0).
    M-B: `niewystarczajace = propozycjaPodatku === null;` → `false` → 40 passed, 1 FAIL (maksimum nie wystarcza).
  - Czerwień na bazie d71eda0e7 nowych asercji: NIE ZMIERZONO w tej rundzie (baza ma już stary kod; r1 raportował 32/0 na swojej bazie).

PUNKTY DODATKU 5 (ZMIERZONO / NIE ZMIERZONO):
  0. merge origin/main: ZMIERZONO — kandydat d71eda0e7 już zawiera merge 4867cd20f (9da316001); tsc 0 po merge. wikiBundle nie regenerowany w tej rundzie (brak zmian tekstów Civpedii).
  1. Chromium (a–e), zrzuty shots-*.png: NIE ZMIERZONO. Przeglądarka jest (/usr/bin/chromium), ale build vite poza repo i hooki __civTest nie zostały uruchomione. Brak PNG w runs/.
  2. Tabela projekcja vs realny endTurn (≥3 ziarna × T1–15): NIE ZMIERZONO. Brak tabeli różnic.
  3. Podpięcie propozycjaPodatkuKrokami: CZĘŚCIOWO. Funkcja podpięta w `decideEndTurnGate` przez callback `prognozaPoPodatku`, przetestowana (5 asercji + mutacja M-A czerwona). NIE podpięte w `nnsGateForPlayer` (main.ts): wiring callbacku wymaga osobnej projekcji po każdym kroku podatku (poza zakresem tej rundy). Bramka gry nadal używa estymacji liniowej `_nnsPodatekZysk`. OTWARTE.
  4. Projekcja automatu z clampem Q3 (maxSafe) i brak efektów ubocznych: NIE ZMIERZONO / NIE WYKONANO w tej rundzie (kod main.ts ~22901–22975 nieruszany).
  5. gra/tools/end-turn-gate-live-test.cjs: NIE WYKONANO (wymaga Chromium; plik nie powstał).
  6. Stare live-verify (v2 l.7/93–94, v4, wave-703-710): NIE WYKONANO — wymagają Chromium do uruchomienia; nie zaktualizowano. Dług otwarty.
  7. Semantyka „brak dźwigni”: ODRZUCAM zmianę blokady przy częściowej dźwigni (uzasadnienie: dispatch Dodatek 2 wymaga „brak dźwigni = brak blokady” i „no softlock”; blokada, której gracz nie może usunąć przez żadną dostępną dźwignię, jest martwym punktem). PRZYJMUJĘ dowód: dodano flagę `niewystarczajace` i asercję g3 (dźwignia +10 przy braku −50 → blokada=false, niewystarczajace=true). ZAŁOŻENIE do decyzji FC/właściciela.
  8. Kontrakt API dla UI: PRZYJMUJĘ — pole `niewystarczajace` dodane; kształt opisany wyżej.
  9. Status r1 BLOCK i mutacje: wyjaśnienie — mutacje M-A/M-B wykonane dla nowego kodu w tej rundzie (wyżej). Zmiany r1 w test ai-from-turn1 (3 asercje gracza) NIE są cofane w r2; zostały jako rozstrzygnięcie sprzeczności dispatchu (gracz od tury 1 vs „NIE ruszaj”). ZAŁOŻENIE, do decyzji FC.
  10. Martwe pola `wyjatekTur`/`wyjatekStarego`: ODRZUCAM usunięcie — trzy pliki testowe (no-negative-stocks-test.cjs l.49/78/106, no-negative-stocks-ai-from-turn1-test.cjs l.108, end-turn-gate-projection-only-test.cjs l.109) asertują na nich wartość false; usunięcie wymagałoby zmiany testów poza tym, co r2 zamyka. Nieużywany eksport `NNS_WOLNE_TURY` zostaje (stała wsteczna). Pliki dokumentacji orkiestratora poza allowlistą dziedziczone z gałęzi — nie dotykane przeze mnie w r2.

ZAŁOŻENIA:
  - Brak dźwigni / częściowa dźwignia = brak blokady (reguła dispatchu), z flagą `niewystarczajace` dla UI.
  - Propozycja podatku krokowa (10 pkt) działa na callbacku dostarczanym przez wołającego; bez callbacku — estymacja liniowa (szacunek 'liniowy').
  - NNS_AI_BALANCE_TURN_MIN = 1 (zostawione, zgodnie z dispatchem).

BLOKADY (dla orkiestratora; temat NIE może dostać READY_FOR_DEPLOY):
  (a) brak pomiaru w Chromium (punkty 1, 5, 6) i zrzutów a–e;
  (b) brak wiringu callbacku `prognozaPoPodatku` w main.ts (punkt 3);
  (c) brak tabeli projekcja vs realność (punkt 2) — jeśli |różnica| > 0, projekcja wymaga naprawy (punkt 4 też);
  (d) brak testu behawioralnego na ścieżce main.ts (dispatch test 5).

RUNDY: 2/5 (ta runda). Poprzednia: FC FAIL (664361a77).
NASTĘPNY KROK: podpiąć `prognozaPoPodatku` w `nnsGateForPlayer` (projekcja na kroku podatku +10/+20…), zmierzyć a–e i tabelę T1–15 w Chromium (build poza repo), uzupełnić live-verify v2/v4, dopisać mutację projekcji.
UWAGI-DLA-ORKIESTRATORA: (1) worktree ma gra/node_modules (npm ci --ignore-scripts) — do usunięcia przy sprzątaniu; (2) gałąź `wf-gate-r2` lokalna, nie wypchnięta; (3) zapis tego pliku i commit wykonane przez Operatora; integracja i push NIE wykonane.
DEPLOY/PUSH: NIE WYKONANO
