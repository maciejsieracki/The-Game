STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1
GOAL: bramka „Zakończ turę” liczy WYŁĄCZNIE prognozę po turze (po reakcji automatu żywności), od tury 1; brak ręcznej dźwigni = brak blokady; propozycja podatku krokami 10%; stabilny kształt wyniku dla UI.
RUNDY: 3/5 (Operator, SONNET wg DODATKU 6)
DEPLOY/PUSH: NIE WYKONANO

## BAZA (WAŻNE dla integracji)
Harness kazał startować od 0f6c27dac, ale to jest raport FC na rodzicu 4867cd20f — NIE zawiera kodu r2. Kod r2 jest w e7331c4de (refs/heads/wf-gate-r2). Zrobiono: merge origin/main (5304bbab8, FALA 717) -> merge e7331c4de (konflikt wikiBundle.json rozwiązany: ours + regeneracja `gra/tools/bundle-wiki-for-game.cjs`). Czubek pracy = commit z kodem (patrz ZMIANY/COMMIT). Przodkowie sprawdzone: e7331c4de i origin/main są przodkami czubka.

## ZMIANY/COMMIT
Commity (kod + testy + dokumentacja, wszystko w allowliście; zero `git add -A`):
- merge origin/main 847570ab9 + merge e7331c4de 0f8766e76
- ea3d99343 — kod bramki, hooki pomiarowe, testy, nowy test żywej gry
- b7ed918ea — spichlerz.md + wikiBundle, testy wiring/kształtu, live-verify v2/v4
- (ten raport + artefakty r3/ — osobny commit, czubek)

Pliki: gra/src/game/no-negative-stocks.ts, gra/src/main.ts (tylko ścieżka bramki gracza + hooki `?civTest=1`), gra/tools/end-turn-gate-live-test.cjs (NOWY), gra/tools/end-turn-gate-projection-only-test.cjs, gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs, gra/tools/no-negative-stocks-endturn-test.cjs, gra/tools/live-verify-wave-689-697-a-gate-v2.cjs, ...-v4.cjs, docs/encyklopedia/pojecia/spichlerz.md, gra/src/data/wikiBundle.json (regenerowany).
NIE ruszono: równoważenie AI (`NNS_AI_BALANCE_TURN_MIN = 1`, sprawdzone i bez zmian), ai-params.json, dźwignia kolejki, WERSJE.md, gra-robocza/, rust-port/.

## PUNKTY A–F (DODATEK 6) — ZMIERZONE
A. ZMIERZONO w żywej grze (Chromium 1280x800, build `vite --outDir` poza repo, `?civTest=1`, seed 11, mapa Mały). Narzędzie: `gra/tools/end-turn-gate-live-test.cjs`. Wyniki: `runs/.../r3/result-new-seed11.json`, `result-base-seed11.json`.
 - BAZA (origin/main + te same hooki): 3/9 PASS. Czerwone: b@t1 (prognoza −6, canEnd=true, tury 1–10 wolne), b@t12 (Skarbiec −4, prognoza −3 -> canEnd=true przez dawny `wyjatekStarego`, brak tooltipu), c, d (brak projekcji automatu), d2 (Spichlerz −1, prognoza −0,5, dźwignia racji 7,5 -> canEnd=true).
 - NOWE: 9/9 PASS: a@t1/a@t12 (Skarbiec −4, prognoza 0/+2 -> canEnd=true, przycisk aktywny); b@t1/b@t12 (prognoza −6/−3 -> canEnd=false, tooltip „Nie można zakończyć tury. Skarbiec (złoto): po zakończeniu tury zabraknie 6. Pomogą: … Podnieś podatek o 60 pkt % …”, klik NIE kończy tury); c@t1/c@t12 (zastosowanie propozycji 60/30 pkt % -> blokada znika BEZ końca tury, po endTurn realny Skarbiec 0 = prognoza 0); d@t2 (ration 6, Auto-Żywienie włączone, Spichlerz −0,25, bazowa prognoza −4,25, automat +4,5 -> canEnd=true; po endTurn realny Spichlerz +0,25 = prognoza 0,5−0,25); d2 (Auto wyłączone, Spichlerz −1, prognoza −0,5, dźwignia racji -> blokada z tooltipem); e@t4 (brak jednostek, podatek max, racje 0, Auto wył., Skarbiec −100, Spichlerz −100 -> canEnd=true, tura kończy się; po turze Skarbiec −92, Spichlerz 0 — raportowane jak dotąd).
 - Wyjaśnienie paska ze zrzutu właściciela: pierwsza liczba pod nazwą zasobu = obecny stan (czerwona gdy <0); dwie liczby pod spodem = „+brutto / netto” na turę. Na zrzucie Spichlerza „0 / −4” = netto −4 na turę (HIPOTEZA, nie pomiar na zapisie właściciela: baza nie liczyła automatu żywności, więc ujemna prognoza Spichlerza mogła blokować turę mimo dodatniego Skarbca po turze; Skarbiec −4 przy „+19/+15” sam z siebie nie blokuje, bo prognoza = +11 ≥ 0). ZMIERZONO na nowym buildzie (tura 1, domyślne podziały 30/60/10): Skarbiec 0, netto −2; Spichlerz netto −4, automat +4,5 -> prognoza +0,5. NIE ZMIERZONO: dokładnego stanu zapisu właściciela (brak zapisu) — odtworzono mechanizm, nie jego zapis.
 - Zrzuty: r3/shots-new-a-…-t1.png (Skarbiec −4, +8/+4, „ZAKOŃCZ TURĘ” aktywny), r3/shots-new-b-…-t1.png (przycisk zablokowany/wygaszony), r3/shots-new-d-…-t2.png, r3/shots-new-e-…-t4.png, r3/shots-base-a/b-….png (baza).
 - Mutacja żywa: build z wyłączoną projekcją automatu (`if (false && …)`) -> 6/9 PASS (a@t1, c@t1, d czerwone) — `r3/result-mut-no-auto-seed11.json`. Kod przywrócony (diff czysty).
B. ZMIERZONO. Tabela zgodności prognozy bramki z realnym `endTurn`: `r3/table-new.json` (3 ziarna 11/22/33 × tury 1–15, 45 wierszy) — 0 rozbieżności (|różnica| = 0) dla Skarbca i Spichlerza; oraz tryb stresowy `r3/table-new-stress.json` (rotacja podatków 30/60/10..90/0/10, racji 6/4/2, Auto-Żywienie wł./wył., dokładanie 2 jednostek co 4. turę; 3 ziarna × 15 tur): 45 wierszy porównanych, 33 zdarzeń blokady bramki, 0 rozbieżności (max |różnica| Skarbiec 0, Spichlerz 0). Komenda: `node tools/end-turn-gate-live-test.cjs --dist <d> --out <o> --table 1 [--stress 1] --seeds 11,22,33 --turns 15`.
 - Wykryte i NAPRAWIONE defekty projekcji (blokada kłamała): (1) błędna delta automatu w `nnsGateForPlayer` (`spLive + delta` zamiast `live.spichlerzPo + delta`) — przesuwała prognozę Spichlerza o bazową zmianę netto; (2) projekcja pomijała `autoRaiseRationsForGrowth` i clamp Q3 (pierwsze ujawnienie: seed 22, t1, prognoza 2, realnie 0,5; różnica −1,5 — po naprawie 0); (3) projekcja automatu liczona tylko gdy prognoza <0 — teraz zawsze.
 - Koszt: +8,6 ms na odświeżenie ekonomii (32,5 -> 41,1 ms przy prognozie ≥0; 32,8 -> 35,9 ms przy <0; 20 odświeżeń w Chromium headless; odświeżenie jest dirty-gated, nie na klatkę).
C. ZMIERZONO/WPIĘTO. `prognozaPoPodatku` + `propozycjaPodatkuKrokami` są teraz używane na ścieżce gry: `main.ts` buduje `_nnsTaxStepDeltas` (kroki +10 pkt % kosztem Nauki, ta sama `previewCityEconomy` co prognoza; stop na pierwszym kroku dającym prognozę ≥0) i `nnsGateForPlayer` przekazuje `prognozaPoPodatku`. Test na poziomie main.ts: strukturalny (11a) + żywy (b/c: propozycja 60 pkt % w t1 i 30 pkt % w t12 -> po zastosowaniu realny Skarbiec ≥0 i równy prognozie). Mutacja M6 (usunięte wpięcie) -> czerwone.
D. ZMIERZONO. Projekcja automatu odtwarza pełną ścieżkę ticku: `autoBalanceRationsToSolvency` (onlyAutoManaged) + `autoRaiseRationsForGrowth` (gracz, requireProductionSurplus) + `recomputeCityFoodBalancesInEcon`/`refreshEconomyFoodTotals` + clamp Q3 `maxSafePoziomRacjiForCity` dla WSZYSTKICH miast gracza (także z Auto wył.), a w `finally` przywraca `poziomRacji`/`procentRozwoj`. Test braku efektów ubocznych: strukturalny (11d) + zgodność w tabeli stresowej (stan miast po wielu odświeżeniach nie dryfuje: realne tury zgadzają się z prognozą co do 0). Hook `gateStateFingerprint` (stan przed/po) dostępny; osobnej asercji „odcisk przed == po wywołaniu gateInfo” NIE dodano do testu (NIE ZMIERZONO wprost; pośrednio pokryte tabelą).
E. ZMIERZONO. `gra/tools/end-turn-gate-live-test.cjs` istnieje, czerwony na bazie (3/9), zielony na nowym (9/9), czerwony na mutancie bez automatu (6/9). Surowe hooki stanu: setPlayerTreasury/setPlayerGranary/setTaxSplit/setAutoWyz/setRationAll (NIE używa `grantPlayerGold`).
F. ZAKTUALIZOWANO, NIE URUCHOMIONO. live-verify-wave-689-697-a-gate-v2.cjs (komentarz + log `turnN_expectBlocked`: od tury 1 przy prognozie <0 canEnd=false) i ...-v4.cjs (`CHECK10`: `turnN_gateBlocksFromTurn1`, zwolnienie jednostek testowych dźwignią przed endTurn). Oba używają dosypek/jednostek i są długie — NIE URUCHOMIONO w tej rundzie (składnia `node --check` OK).

## PUNKTY 1–8 (DODATEK 5)
1 ZMIERZONO (a–e, zrzuty) — patrz A. 2 ZMIERZONO — patrz B. 3 ZMIERZONO — kroki 10% z tej samej projekcji, `niewystarczajace` gdy maksimum nie wystarcza (test czysty: „maksymalny podatek nie wystarcza -> propozycja null + flaga”). 4 ZMIERZONO — patrz D (clamp Q3 w projekcji). 5 ZMIERZONO — E. 6 ZROBIONE: spichlerz.md (reguła bramki: prognoza po turze, automat tylko żywność, propozycja podatku, AI od tury 1, brak odwołań do „tury 11”) + wikiBundle zregenerowany narzędziem; grep „1–10 / wolne od blokady” w docs/encyklopedia i docs/poradnik: jedyne trafienie to nowy akapit „brak wyjątku tur 1–10”. 7 ZMIERZONE: `NNS_AI_BALANCE_TURN_MIN = 1` na origin/main i w moim czubku, nie zmieniano; testy AI (ai-from-turn1 27/0, ai-t2 11/0, ai 8/0, c2 44/0) zielone, nietknięte. 8 ZROBIONE — kształt poniżej.

## STABILNE API DLA R-WEB-UI-END-TURN-BLOCK-EVENT-Q1
`nnsGateForPlayer(): NnsGateResult` (main.ts) = `decideEndTurnGate(...)` (no-negative-stocks.ts). Pola (dokładnie 8, test (12a) pilnuje):
- `blokada: boolean`
- `komunikat: string` — „Nie można zakończyć tury. <Zasób>: po zakończeniu tury zabraknie N. Pomogą: <dźwignie>. [Podnieś podatek o X pkt % …]”
- `dzwignie: { id, stock, zysk, opis }[]`
- `zasob: 'skarbiec' | 'spichlerz' | null` (pierwszy zasób na minusie, który ma dźwignię)
- `prognoza: number | null` (stan po turze PO reakcji automatu)
- `propozycjaPodatku: { punktyProcentowe, szacunek: 'krokowy'|'liniowy', maksPunktow } | null` (najmniejszy krok 10 pkt %, dający skarbiec ≥0)
- `automatPoprawil: boolean`
- `niewystarczajace: boolean` (dźwignie istnieją, ale razem/maks. podatek nie pokrywają braku)
Hook testowy (tylko `?civTest=1`): `__nnsMeasureDebug.gateInfo()` zwraca te dane + prognozę/saldo/kroki podatku.

## SEMANTYKA (zmiana względem r2 — wg DODATKU 6)
Blokada gdy prognoza po turze <0 ORAZ dla przynajmniej jednego zasobu na minusie istnieje realna niewykorzystana dźwignia (zysk >0: podatek, racja, rozwiązanie jednostek) — nawet gdy jej pełne użycie nie pokrywa braku (wtedy `niewystarczajace=true`). Brak jakiejkolwiek dźwigni = brak blokady (e@t4). Brak softlocku: użyta dźwignia ma zysk 0, więc po jej wyczerpaniu blokada znika. Zrewidowano 5 asercji starych testów zakładających „częściowa dźwignia -> brak blokady”:
- no-negative-stocks-end-turn-gate-levers-test.cjs: (b), (g) „sam podatek 12<20”, (h) „skarbiec pokryty, spichlerz bez dźwigni”, (h) „spichlerz 6<8” (+nowa asercja „brak jakiejkolwiek dźwigni -> brak blokady”)
- no-negative-stocks-endturn-test.cjs: (c) „zysk dźwigni < brak”, (c-spich)
- end-turn-gate-projection-only-test.cjs: r2 „dźwignia częściowa” (+ regex 10c po poprawce delty automatu; +bloki (11) wiring, (12) kształt wyniku)
Testy AI (ai-from-turn1, ai-t2) NIE ruszane. Stare asercje r2 o 3 asercjach gracza w ai-from-turn1: bez zmian względem r2.

## TESTY (surowe wyniki)
- `npx tsc --noEmit`: 0 błędów
- end-turn-gate-projection-only-test: 49 passed, 0 failed; no-negative-stocks-{ai-from-turn1 27/0, ai-t2 11/0, ai 8/0, c2 44/0, end-turn-gate-levers 34/0, endturn 19/0, projection 49/0, test 25/0}
- 5+ bramek referencyjnych: logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0; default-tax-split-test 28/0
- Mutacje testu czystego (end-turn-gate-projection-only-test): M1c (wyjątek tur 1–10 przywrócony) 42/7 FAIL; M2 (brak uwzględnienia automatu) 46/3; M3 (stara semantyka pokrycia) 48/1; M4 (propozycja krokami zawsze null) 40/9; M5 (stary błąd delty) 48/1; M6 (brak wpięcia prognozaPoPodatku) 48/1; M7 (brak clampa Q3) 48/1 — wszystkie czerwone. Wszystkie mutacje cofnięte (git diff czysty).
- Żywa gra: patrz A/B.
- NIE URUCHOMIONO do końca: no-negative-stocks-ai-t2-behavior-test.cjs (przekroczył timeout 250 s), c3-turn-test, live-verify v2/v4, map-gen-regression, mgla/inne wiersze bramek spoza listy. `git diff --check`: NIE URUCHOMIONO jawnie przed commitem raportu (patrz niżej).

## BLOKADY
Brak blokad technicznych. Uwaga: /tmp/gp3 (moje dist) zniknęło w trakcie pracy (sprzątanie zewnętrzne) — przebudowano w scratchpadzie; wyniki końcowe pochodzą z buildu bieżącego czubka.

## UWAGI-DLA-ORKIESTRATORA
1. Baza harnessu (0f6c27dac) pomijała kod r2 — integruj czubek tego commita (zawiera merge e7331c4de + origin/main 5304bbab8); sprawdź `git merge-base --is-ancestor`.
2. Zmiana semantyki „częściowa dźwignia -> blokada” jest wprost z DODATKU 6; ryzyko UX: gracz z jednostkami i Skarbcem na minusie, którego podatek nie wystarcza, jest blokowany aż rozwiąże jednostki (tooltip podaje to wprost i flagę `niewystarczajace`). Jeśli to nie to, czego chce właściciel — decyzja ABC (jedna linia w `decideEndTurnGate`: `brakujeZDzwignia`).
3. Dług Rust: REPIN bramki (prognoza po turze od tury 1, projekcja automatu raise + clamp Q3, propozycja podatku, semantyka dźwigni).
4. `automatPoprawil` = true także gdy automat tylko podnosi/obniża prognozę Spichlerza (nie dotyczy Skarbca) — zachowane z r2, dla UI „blokada pieniężna” należy czytać `zasob`.
5. Sprzątanie: `gra/node_modules` w worktree do usunięcia; scratchpad gp3 (dist-new/base/mut) do usunięcia; refs: zachowaj `refs/keep/GATE-PROJ-r3` na czubku przed sprzątaniem worktree.
