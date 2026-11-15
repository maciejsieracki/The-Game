# R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora r2 z fa48b8dde)

STATUS: BLOCK (techniczny/wartościowy: scenariusz „20 obywateli” ujawnił defekt wyceny na kandydacie; NIE naprawiony w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-OFFER-NEED-FROM-PLAYER-SURPLUS-Q1
GOAL: ilość odbioru AI od gracza wynika z nadwyżki gracza, nie ze sztywnego kroku 10; uczciwość wyceny, cooldown 15 i limit 1 oferty bez zmian.
BAZA: kandydat d57a3e0f4 (gałąź r2-work w worktree). Zmiany tej rundy: `gra/src/main.ts` (+7 linii: hook testowy `setCityPopulation`, tylko test) i `gra/tools/ai-trade-wiring-e2e-live-test.cjs` (opcja `AITW_POP`, asercja dolnej granicy, realna wycena przez `diagPayload`). `gra/src/game/ai-trade-proposal.ts` bez zmian względem d57a3e0f4.
ZMIANY-COMMIT: patrz pole `sha` w StructuredOutput (commit obejmuje wyłącznie te pliki, raport i dowody w runs/<ID>/evidence/).

## Odpowiedzi na zarzuty Evaluatora

1. **Brak pomiaru „jedno miasto, 20 obywateli” ze zrzutem — PRZYJMUJĘ, ZMIERZONO (wynik: defekt).**
   - Dodano hook `setCityPopulation` i opcję `AITW_POP=20` (ustawia 20 obywateli w pierwszym mieście gracza i AI).
   - Baza (logika `e956b5015` w `ai-trade-proposal.ts`, reszta jak kandydat) vs kandydat, ten sam scenariusz, Chromium headless, zrzut okna „Audiencja dyplomatyczna” (`evidence/r3-pop20-*-okno-oferty.png`):
     - baza: probe `cegla 40 -> zelazo 10`, oferta na stole `cegla 40 / zelazo 10`, `probeMs` 505, tura 1 = 5480 ms; realna wycena oferty PRZEPUSZCZONA (`fairBlock` null, `accepted` true).
     - kandydat: probe `cegla 200 -> zelazo 50` (`probeMs` 425, tura 1 = 4612 ms), ALE na stole na końcu tury AI jest oferta `cegla 70 / drewno 350` (inna para niż selekcja), a `diagPayload` na tej ofercie: `givePn 350`, `receivePn 7000`, `fairBlock` = „Oferta nieuczciwa dla partnera … wymagane ≥ 7000 PW”, `accepted false`.
     - Okno w UI pokazuje to samo (zrzut): „Bilans 0 — symetryczna wymiana”, „Możesz przyjąć”, czyli podgląd gracza liczy 350 PW = 350 PW, a realna ewaluacja (`evaluateProposal` / `handelFairnessGate` z opcjami wyceny) daje 7000 PW po stronie drewna. Rozjazd wyceny drewna między podglądem a bramką AI.
     - Wniosek: kandydat z nieograniczoną ilością odbioru prowadzi (w scenariuszu 20 obywateli) do pary, której bramka uczciwości odrzuca. To jest defekt tematu, nie tylko harnessu. Przyczyna (dlaczego endTurn wybiera parę `drewno` zamiast `zelazo` mimo tego samego `pickAiPlayerCyclicBarter`, i dlaczego bramka wejścia na stół `handelFairnessGate` + `exactPreview` przepuściły pozycję) NIE ZBADANA do końca w tej rundzie — NIE ZMIERZONO.
   - Zrzuty: `evidence/r3-pop20-kandydat-okno-oferty.png` (defekt), `evidence/r3-pop20-baza-okno-oferty.png` (baza, oferta cegla 40 / zelazo 10).
   - Dowody JSON: `evidence/r3-pop20-*-e2e.json`.

2. **Test behawioralny na atrapach — PRZYJMUJĘ część, DOPISANO realną wycenę w żywej grze.**
   - Test jednostkowy `ai-trade-need-from-surplus-test.cjs` pozostaje (8/0) i nadal używa atrap (zgodnie z jego nagłówkiem); NIE zmieniano go.
   - Dodano w `ai-trade-wiring-e2e-live-test.cjs` dwie asercje na REALNEJ wycenie/selekcji w żywej grze:
     - dolna granica: `probe.receiveQty > 10` i `offRecv > 10` (nadwyżka gracza 400 daje odbiór 50; przy przywróceniu sufitu `needMax` daje 10);
     - realna wycena zaproponowanej pary przez `diagPayload` (`resolveProposalPn`, `handelFairnessGate`, `evaluateProposal`): `fairBlock === null`, `givePn <= receivePn`, `accepted === true`.
   - Mutacja (przywrócenie sufitu = baza `ai-trade-proposal.ts`, żywa gra, POP=20): asercja „nadwyzka gracza: AI prosi o ilosc > krok” daje FAIL (`probeRecv 10, offRecv 10`) — czerwone. ZMIERZONO.
   - Wynik kandydata przy domyślnym scenariuszu (POP=0, bez mutacji): `ai-trade-wiring-e2e-live-test: 46 pass, 0 fail` (44 dotychczasowe + 2 nowe). ZMIERZONO, `evidence/r3-pop0-kandydat-e2e.json`.
   - Asercje realnej wyceny NIE przechodzą w scenariuszu POP=20 na kandydacie (patrz pkt 1) — to jest właśnie wykryty defekt.

3. **Koszt pętli bez sufitu — PRZYJMUJĘ jako pomiar częściowy, ZMIERZONO w żywej grze (jedna tura, jedno miasto).**
   - `probeBarter` (pełna pętla giveQty x receiveQty, realna wycena): kandydat POP=0 296 ms; kandydat POP=20 425 ms; baza POP=20 505 ms (z sufitem, mniejsza pętla). Czas tury 1 (endTurn AI): kandydat POP=20 4612 ms, baza POP=20 5480 ms; kandydat POP=0 3350 ms.
   - Nie zmierzono scenariuszy 20000/5000/100000 w grze (NIE ZMIERZONO — brak narzędzia do ustawiania tak dużych zapasów poza setStock, a pętla i tak nie wykonuje się wielokrotnie przy pierwszym trafieniu). Nie dodano limitu pętli (zgodnie z zakazem nowych progów liczbowych bez decyzji właściciela).
   - Kandydat nie jest wolniejszy od bazy w tym scenariuszu; to jednak JEDEN scenariusz i jedna tura — wniosek ograniczony.

4. **Uwaga Evaluatora (balans: AI może poprosić o całą nadwyżkę) — ODRZUCAM jako defekt kodu, zostawiam jako decyzję** (bez zmian od r1; patrz zarzut 5 r1 w poprzedniej obronie). Dodatkowo: pkt 1 powyżej pokazuje, że nieograniczony odbiór w praktyce prowadzi do pary z niespójną wyceną — to jest argument za tym, by decyzja o limicie (warianty A/B/C z dodatku) zapadła PRZED PASS.

5. **Pkt 1 dodatku (regresja wiring-e2e-live) — zamknięty na POP=0 (46/0).** Bez zmian.

## TESTY (surowe, uruchomione w tej rundzie na d57a3e0f4 + zmiany pkt 1–2)
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/ai-trade-need-from-surplus-test.cjs`: `8 passed, 0 failed`.
- `ai-trade-wiring-e2e-live-test` POP=0 (kandydat): `46 pass, 0 fail`, exit 0.
- `ai-trade-wiring-e2e-live-test` POP=20 (kandydat): `39 pass, 7 fail` (defekt pkt 1; FAIL: payload, oferta na stole, realna wycena, A1 równość, umowa, dwa ticki dostaw).
- `ai-trade-wiring-e2e-live-test` POP=20 (baza, mutacja cap): `43 pass, 3 fail` (FAIL: nadwyżka gracza = 10; dwa ticki dostaw — scenariusz POP=20 psuje kontrolę dostaw także na bazie, to NIE jest regresja tematu, ale oznacza, że POP=20 nie daje czystego PASS nawet na bazie).
- 5 bramek referencyjnych i unit-power: NIE URUCHAMIANO ponownie w tej rundzie (zielone w r1/d57a3e0f4 wg fa48b8dde; kod gry poza hookiem testowym się nie zmienił) — NIE ZMIERZONO w tej rundzie.
- `ai-trade-oneshot-overpay-limit-test`: znany dług #379 (czerwony na bazie, nie ruszany).
- `git diff --check`: czysty.
- Pomiar częstości ofert (kryterium a, 3×150×3): NIE ZMIERZONO w tej rundzie (poza zakresem; harness wieloturowy osobny dług).

## BLOKADY
- Defekt wyceny na kandydacie w scenariuszu 20 obywateli (pkt 1): oferta AI `cegla 70 / drewno 350` przechodzi do stołu i UI, a realna wycena odrzuca ją (7000 PW po stronie drewna vs 350 PW podgląd). Wymaga osobnej rundy diagnozy: porównać opcje `pnCyclicOpts` (enqueue, main.ts ok. 20977–21000) z opcjami `diagPayload`/`previewIncomingPlayerAccept`, i ustalić, czemu endTurn składa inną parę niż `probeBarter`.
- Decyzja właściciela o limicie odbioru (warianty A/B/C) nadal otwarta.

## RUNDY
Obrona: runda 2 (odpowiedź na zarzuty Evaluatora r2). Operator: runda 3 wymagana (nie przekroczono limitu 5).

## NASTĘPNY KROK
1. Orkiestrator: nowa runda Operatora (ID bez zmiany) z zadaniem: zlokalizować przyczynę rozjazdu pary (drewno vs zelazo) i wyceny drewna (podgląd 350 vs bramka 7000) w scenariuszu POP=20; naprawić tak, by `AITW_POP=20` dał PASS na kandydacie (bez zmiany uczciwości wyceny — poprawka ma dotyczyć spójności wyboru pary/payloadu, nie progów).
2. Evaluator r3 na tym samym ID po tej rundzie.
3. Decyzja właściciela: limit odbioru (A bez limitu / B ≤3× potrzeba AI / C powrót do sufitu) — przed READY_FOR_DEPLOY.

## UWAGI-DLA-ORKIESTRATORA
- Harness `measure-ai-trade-offer-frequency*.cjs` nie ruszany (osobny dług, zgodnie z dispatchem).
- Zrzuty poza repo: `/tmp/claude-0/r2/` (bundle, logi); w repo tylko `evidence/` tego runu.
- Worktree używa symlinka `gra/node_modules` do `wf_452c29a1-423-1/gra/node_modules` (tylko odczyt; nie commitowany).

DEPLOY/PUSH: NIE WYKONANO
