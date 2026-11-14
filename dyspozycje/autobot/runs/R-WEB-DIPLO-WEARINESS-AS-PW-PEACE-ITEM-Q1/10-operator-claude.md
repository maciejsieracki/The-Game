# R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1
GOAL: zmęczenie wojną jako pozycja PW po stronie niebędącej proponującym (krzywa kwadratowa, Z = round(C × x²)); usunięty ukryty rabat 60%; bezwarunkowy pokój wynika z tabeli (R = 0 przy x = 1).
BAZA: 656a0f0d21fa0f7e37cd3b4866f32b1614b6301b (origin/main), detached.

## ZMIANY-COMMIT

Kod i testy (allowlista):
- `gra/src/game/war-weariness.ts`: nowa czysta funkcja `wearinessPeaceItemPw(C, L)`; usunięta `wearinessPeacePriceFactor` i pole typu `czlowiek.rabatCenyPokojuMax`.
- `gra/data/war-weariness-params.json`: usunięte `rabatCenyPokojuMax`; dodany `_pozycjaPW` (opis, nie próg).
- `gra/src/game/diplomacy-proposals.ts`: gałąź R5 (gracz → AI) liczy `Z = wearinessPeaceItemPw(C, L)` i wymagane `R = C − Z`; pole wyniku `wearinessPw`. Bramka „silna AI" nadal wymaga miasta o wartości PEŁNEJ ceny C (patrz DECYZJA-WYMAGANA, pkt 2).
- `gra/src/ui/diplomacyAcceptanceBalance.ts` + `gra/src/ui/diplomacyAudience.ts`: typ `responderPreview.wearinessPw`; wiersz „Zmęczenie wojną +N PW" w kolumnie „Oni oddają" (tylko dla Z > 0).
- `gra/src/main.ts` (minimalne wpięcie, uzasadnienie: `previewNegotiationEntry` jest jedynym mostem z evaluateProposal do panelu): przekazanie `wearinessPw` w responderPreview.
- `gra/src/data/wikiBundle.json`: regeneracja `gra/tools/bundle-wiki-for-game.cjs` (2 linie diff).
- `docs/encyklopedia/pojecia/zmeczenie-wojna.md`: hasło opisuje model PW zamiast rabatu.
- `gra/tools/ai-war-weariness-peace-test.cjs`: sekcja 4j przepisana na model PW (101 PASS).
- `gra/tools/diplo-weariness-as-pw-peace-item-test.cjs` (NOWY): tabela (a), spójność tabela↔AI (b), R=0 przy L≥0,8 (c), brak rabatu (d), wiązanie w kodzie (e). 76 PASS.

Commit: patrz sekcja DEPLOY-PUSH (SHA podany w raporcie orkiestratora po commicie).

## TESTY

Bramki i testy (liczby z surowego wyjścia tej rundy):
- `tsc --noEmit` (gra/): exit 0 (po każdej edycji; finalnie exit 0).
- `git diff --check`: czysto.
- `diplo-weariness-as-pw-peace-item-test.cjs`: PASS=76 FAIL=0 (NOWY).
- `ai-war-weariness-peace-test.cjs`: PASS=101 FAIL=0.
- `diplo-weariness-city-only-test`: PASS=30 FAIL=0.
- `diplo-weariness-unconditional-end-test`: PASS=22 FAIL=0.
- `diplo-weariness-20-turns-test`: PASS=30 FAIL=0.
- `diplo-weariness-display-test`: ALL PASSED.
- `diplo-peace-weaker-seeks-city-only-test`: 35 pass / 0 fail.
- `diplo-war-peace-gate-test`: 24 pass / 0 fail.
- `diplomacy-proposal-test`: 200/200 PASS.
- `diplo-peace-balance-accept-test`: 32 pass / 0 fail (w tym C1, C2 bez zmian).
- `diplo-war-peace-sim-test`: 25 pass / 0 fail (S3b, S3c zielone dzięki zachowaniu bramki siły na pełnej cenie C).
- `diplo-war-peace-d7-test`: 8 pass / 0 fail.
- `diplo-war-peace-main-guard-test`: 35 pass / 0 fail.
- `ai-war-nearest-city-peace-2t-test`: PASS.
- `diplo-tick-war-brake-unit-test`: 69 pass / 0 fail.
- `diplo-war-peace-profile-unit-test`: 198 pass / 0 fail.
- `diplomacy-ai-balance-test`: 36/36 PASS.
- `diplomacy-ai-offer-balance-test`: 29 passed, 0 failed.
- `diplo-peace-stance-wiring-test`: 10 pass / 0 fail.
- `peace-gate-military-strength-test`: 14 PASS / 0 FAIL.
- Czerwone-na-bazie: NIE ZBADANO osobno (nie uruchamiano testów poza powyższą listą; brak porównania z bazą 656a0f0d2).

Kryteria dispatchu:
- (a) tabela C=500, tury 10..16 → Z = 0/14/56/125/222/347/500: ZMIERZONO (test, PASS).
- (b) spójność tabela↔decyzja AI dla tur 10..20 i mnożników 0,7/1,0/1,5: ZMIERZONO (test, PASS). Zakres: sprawdzona jest bezwarunkowa gałąź AI (`wearinessUnconditionalEndDue` ⇔ R = 0). Gałęzie AI „oddaj miasto" nie były objęte tą zgodnością.
- (c) L ≥ 0,8 → Z = C, R = 0, bezwarunkowo: ZMIERZONO (test, PASS).
- (d) brak rabatu 60% (grep): ZMIERZONO (funkcja i klucz JSON nieobecne; test PASS).
- (e) Chromium, zrzut stołu „Zmęczenie wojną +N PW" w dwóch momentach wojny: NIE ZMIERZONO. Nie uruchomiono przeglądarki ani build poza repo. Wiersz UI jest wpięty i kompiluje się (tsc 0), ale nie widziano go na ekranie.
- (f) tsc 0: ZMIERZONO. 5 bramek referencyjnych: NIE ZMIERZONO osobno (wymagają pełnego zestawu poza tym raportem). Testy diplomacy-*/war-weariness-* wymienione wyżej.

## BLOKADY

- (e) Zrzut Chromium: NIE ZMIERZONO (patrz wyżej).
- Pozycja Z jest w tabeli tylko dla przypadku gracz → AI (R5). Dla oferty AI → gracz (bezwarunkowy pokój od AI) brak wiersza Z: taka oferta ma wymaganą cenę 0, więc bilans = 0 bez pozycji. Dispatch chce Z w kolumnie gracza także dla tego kierunku; nie wdrożono (poza zakresem R5, do decyzji).
- `wearinessPw` nie przechodzi przez `balancePanelDataFromRows`, gdy wiersz jest zablokowany (`canAccept` false przy `responderPreview` z blockReason). Wiersz Z zniknie wtedy z panelu, a bilans nadal liczy R.
- Dług Rust: REPIN po wdrożeniu (rabat 60% i nowa bramka pokoju) — zapisać w rejestrze.

## DECYZJA-WYMAGANA (dla orkiestratora / właściciela)

1. Krzywa: wdrożona kwadratowa zgodnie z ABC 2026-11-14. Liniowa = jedna linia w `wearinessPeaceItemPw`.
2. Bramka „silna AI" (R5 `stronger`): dispatch każe liczyć miasto względem R (R = C − Z). To by znosiło regułę „silna AI odrzuca bez miasta bez limitu czasu" (R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1), a testy S3b/S3c i C1/C2 by padły: przy L = min(1, tury/20) od 20. tury Z = C, więc R = 0. Wdrożono wersję ZACHOWUJĄCĄ regułę silnej AI (miasto ≥ pełna cena C). Właściciel musi zdecydować: (A) zachować regułę siły (ta wersja), (B) przyjąć R i zaktualizować S3b/S3c. Przy B silna AI po ok. 20 turach przyjmuje pokój bez miasta.
3. Skutek poza bramką siły: od ok. 16–20 tury wojny pokój od gracza (słabsza AI) kosztuje 0 PW, poprzednio 40% ceny. Zgodne z algorytmem dispatchu (R = 0 ⇒ bez dopłaty), ale to duża zmiana balansu do potwierdzenia.
4. Punkt B (zmęczenie AI przy ofercie gracza): wdrożono jako pozycję w bilansie strony AI. Założenie robocze z proposal — do potwierdzenia.

## NASTĘPNY KROK

Orkiestrator: (1) potwierdzić DECYZJA-WYMAGANA pkt 2–3; (2) Evaluator + Final Control (Sonnet) — obejrzeć wiersz w grze (bramka e) przed READY_FOR_DEPLOY; (3) zapisać REPIN Rust (rabat usunięty) w rejestrze.

## UWAGI-DLA-ORKIESTRATORA

- Konflikt z regułą miasta (dispatch: „R5 stronger wymaga miasta ≥ ceny"): rozstrzygnięto zachowaniem reguły siły (DECYZJA-WYMAGANA pkt 2), a nie zmianą miasta jako słodzika. Złoto i surowce nadal odrzucane.
- `node_modules` zainstalowane w worktree (`npm ci` w gra/, 71 pakietów); nieśledzone przez git.
- Pierwsza próba testu bramkowego w gra/tools zakończyła się błędem wywołania (nie testu); test uruchomiono ponownie w osobnym kroku.
- Zmiany poza zakresem: nic. Nie wykonano pushu ani deployu.

RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
