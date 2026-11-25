# R-WEB-TEST-DEBT-Q14-D2 — raport Operatora (runda 3/5, zakres z DODATKU r3)

STATUS: FAIL
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D2 (kat. D, 2. połowa, 20 testów)
GOAL: zamknąć zakres rundy 3: war-allin-capital (STARY-PIN + mutacja), zelazo-gate (fixture + mutacja), rydwan i H2e nietknięte, solo-wyjście 20 testów, bramki zielone.
BAZA: 1e912a0d27a90d957e6cb295b7e9d835cabe427f (origin/main lineage; zawiera feff53ab6 z obrony r3). Zero zmian w gra/src i gra/data.
SHA (czubek pracy): ostatni commit raportu tej rundy (patrz pole sha w odpowiedzi); commity kodu: b7dc56f57 (war-allin), ac5217ff6 (zelazo).

ZMIANY/COMMIT:
- b7dc56f57 — gra/tools/war-allin-capital-test.cjs: REF_OFF.aiVsAi `20a5bc2c7abcba1b` -> `d28c8b7ffce7a3ec`, REF_OFF.noLandPath `3484217518ceb4ba` -> `e565af36b3773765`, komentarz R-WEB-TEST-DEBT-Q14 z powołaniem na f038fbd2c. aiVsPlayer i barbarians bez zmian. Asercje nie osłabione.
- ac5217ff6 — gra/tools/zelazo-gate-test.cjs: fixture `Legionista` -> `Hastati` (realna jednostka Żelazo z units.json, koszt 25). Asercje bez zmian.
- Allowlista zachowana. Nic poza gra/tools/*-test.cjs i tym raportem nie zmienione. Raport zacommitowany przez `git add` ścieżki raportu.

## Weryfikacja war-allin-capital (DODATEK r3 pkt 1)
- Pin: oba skróty z DODATKU zgadzają się z bieżącym kodem: `[INFO] aiVsAi ... OFF=d28c8b7ffce7a3ec`, `[INFO] noLandPath ... OFF=e565af36b3773765` (surowe, sekcja 6).
- Sekcja 6 NIE jest SKIP: baza z git archive fcd86933 załadowana (`6a` przeszło, `6b0` przeszło).
- Solo po pinie: `98 passed, 0 failed`, exit 0.
- **Mutacja NIE osiągnięta (kryterium niespełnione):** próbowałem 4 mutacji w gra/src/game/ai.ts (kopia `ai.ts.orig` przywrócona i sprawdzona cmp po każdej):
  1. odwrócenie bramki `aiCanEngageOwner` w `appendAiGeneralCampaignOrders` -> `if (false)`: `98 passed, 0 failed`.
  2. helper `aiCanEngageOwner` -> zawsze `true` (harness przekazuje `canEngageOwner: atWar`): `98 passed, 0 failed`.
  3. cofnięcie hunku f038fbd2c w `forcedWarAttack` (usunięty `&& aiCanEngageOwner(...)`): `98 passed, 0 failed`.
  4. `forcedWarAttack = false && ...`: `98 passed, 0 failed`.
  Wniosek: te linie AI nie wpływają na 4 hashe sekcji 6 w scenariuszach harnessu; test nie jest czuły na tę decyzję AI. Nie udało się więc pokazać czerwieni mutacją.
- **Atrybucja do f038fbd2c NIE potwierdzona przeze mnie:** próba odtworzenia pre-f038 `gra/src/game/ai.ts` (`f038fbd2c^`) nie kompiluje się na bieżącym drzewie (esbuild: brak eksportu `offerMultiplier` z war-weariness.ts), więc bisekt reverse-patch nie jest wykonalny bez większej pracy. Pin oparty na bisekcie FC r2 (wskazanym przez orkiestratora); nie zweryfikowałem go samodzielnie.

## Weryfikacja zelazo-gate (DODATEK r3 pkt 2)
- Przyczyna Legionisty: `git log -S 'Legionista' -- gra/data/units.json` nie zwraca żadnego commita (jednostka nigdy nie była w units.json; wpisy `Legionista` istnieją tylko w civs.json jako „Legion (Legionista)” i w fixture testu). Odnalezione w units.json: `Hastati` (Epoka Żelazo, Surowiec „Żelazo”, koszt 25, Wręcz).
- Zamiana: `Legionista` -> `Hastati`, koszt fixture 15 -> 25 (zgodnie z units.json). Surowiec fixture pozostał `zelazo` (ta sama reprezentacja wewnętrzna co wcześniej) — moc dowodowa asercji bramki kopalnia+odlewnia bez zmian.
- Solo: `[zelazo-gate-test] WSZYSTKIE TESTY ZIELONE (24/24)`, exit 0.
- Mutacja (wykonana): `gra/src/game/zelazo-access.ts` kopia do `.orig`, `return hasStock && cityHasOdlewniaZelaza(builtIds);` -> `return hasStock || true;` (bramka Odlewni zdjęta). Wynik: `[FAIL] zelazo w magazynie, brak Odlewni -> false`, `[FAIL] Odlewnia=true, brak zelaza w magazynie -> false`, `[FAIL] brak stocku -> false (fail-closed)`, `NIEUDANE: 3/24`, exit 1. Plik przywrócony z kopii (cmp OK).

## Tabela: 20 testów kat. D, połowa 2 (solo, sekwencyjnie, surowe wyjście na kandydacie b7dc56f57+ac5217ff6)

| # | test | wynik solo (exit / ostatnia linia) | status |
|---|---|---|---|
| 1 | drewno-gate-test | 0 / `WSZYSTKIE TESTY ZIELONE (20/20)` | zielony |
| 2 | dyplo-karta-duplikat-komunikat-test | 0 / `15 passed, 0 failed` | zielony |
| 3 | dyplo-pakt-ekspansja-granica-test | 0 / `26/26 passed` | zielony |
| 4 | egypt-movement-precedence-test | 0 / `24 passed, 0 failed` | zielony |
| 5 | eliminacja-lup-kwoty-test | 0 / `38 passed, 0 failed` | zielony |
| 6 | elimination-spectacle-test | 0 / `84 PASS, 0 FAIL` | zielony |
| 7 | endturn-battle-deadlock-exec-test | 0 / `49 pass, 0 fail` | zielony |
| 8 | fair-play-tier-grid-test | 0 / `12 pass, 0 fail` | zielony |
| 9 | fortify-pole-test | 0 / `41 pass, 0 fail` | zielony |
| 10 | epoka-merge-recruit-test | 0 / `WSZYSTKIE TESTY ZIELONE (16/16)` | zielony |
| 11 | idb-b1b2b3-test | 0 / `20 pass, 0 fail` | zielony |
| 12 | manual-rebalance-owner-era-test | 0 / `pass=6 fail=0` | zielony (r3 obrona) |
| 13 | perf-endturn-ai-phase-equiv-test | 0 / `OK 1 testow` | zielony |
| 14 | r-bitwa-kolory-gracz-przeciwnik-q1-test | 0 / `PASS (28 checks)` | zielony |
| 15 | rydwan-bierny-atak-test | 1 / `4 passed, 2 failed` (`[FAIL] wróg poza zasięgiem nie wymusza ofensywnego zbliżenia`) | czerwony — DECYZJA WŁAŚCICIELA, nietknięty |
| 16 | stone-research-costs-test | 0 / `48 pass, 0 fail` | zielony |
| 17 | surrender-rekrutacja-build-gate-test | 0 / `11 passed, 0 failed` | zielony |
| 18 | trade-routes-income-test | 1 / `133 passed, 1 failed` (`H2e: one capital Mint raises tax cash in another city`) | czerwony — kandydat BŁĄD-GRY, nietknięty (decyzja właściciela) |
| 19 | war-allin-capital-test | 0 / `98 passed, 0 failed` | zielony (pin; mutacja NIE osiągnięta — patrz wyżej) |
| 20 | zelazo-gate-test | 0 / `WSZYSTKIE TESTY ZIELONE (24/24)` | zielony (fixture; mutacja 3/24) |

Podsumowanie: 18 zielonych solo, 2 czerwone celowo (rydwan-bierny-atak, trade-routes-income H2e) zgodnie z DODATKIEM r3 pkt 3.

## Bramki (surowe wyjście, na czubku pracy; node_modules w gra/ zainstalowane przez `npm ci`, usunięte po bramkach)
- tsc --noEmit: exit 0
- logic-test: exit 0, `LOGIC OK (213/213)`
- tech-tree-test: exit 0, `tech-tree-test: 20 pass, 0 fail`
- research-test: exit 0, `ALL GREEN`
- unit-replace-test: exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`
- combat-test: exit 0, `All sanity checks passed.`
- ai-test: exit 0, `ai-test: 297 passed, 0 failed`
- era-war-pairing-alliance-test: exit 0, `19 pass, 0 fail`
- ai-ai-alliance-surcharge-test: exit 0, `RESULT: ALL GREEN (live + mutants detected)`

## BLOKADY
- Techniczna: brak.
- Procesowa: (a) mutacja war-allin-capital NIE dała czerwieni w 4 wariantach (test nieczuły na te decyzje AI w harnessie); kryterium „Mutacja -> test czerwony” niespełnione; (b) atrybucja pinu do f038fbd2c nie zweryfikowana samodzielnie (pre-f038 ai.ts nie kompiluje się na bieżącym drzewie).

## UWAGI-DLA-ORKIESTRATORA
- Kandydat BŁĄD-GRY (bez zmian, do decyzji właściciela, nie R-WEB-* jeszcze): trade-routes-income H2e — cytat obowiązującej reguły: docs/PORADNIK-GRACZA/08-ekonomia-imperium.md §49.3b l.71 („dla **całej** cywilizacji”). Wymaga potwierdzenia przez właściciela, że przewodnik obowiązuje.
- Decyzja właściciela (nie BŁĄD-GRY bez reguły): rydwan-bierny-atak — asercje C/D sprzeczne z commitem 64d5ac663 („aktywnie zbliża się do najbliższej wrogiej jednostki w zasięgu ruchu”). Propozycja pytania ABC: zachować kod (aktywne zbliżenie) i przepisać asercje.
- Do rozważenia przez orkiestratora: test war-allin-capital sekcja 6b/7/8 jest nieczuła na mutacje w gałęzi forcedWar/general campaign (pozostaje pytanie, czy są inne decyzje AI pokryte harnessem). Osobny temat R-WEB-* na wzmocnienie mutacyjne, jeśli właściciel chce.
- Bisekt war-allin z FC r2 do weryfikacji w osobnym temacie (wymaga naprawy harnessu dla starszych drzew).
- Operator nie integrował, nie deployował, nie pushował. Nie tworzono sesji/zadań/harmonogramów. Brak run_in_background.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator i Final Control na SHA czubka (b7dc56f57, ac5217ff6, plus commit raportu). Decyzje ABC: rydwan (DECYZJA WŁAŚCICIELA), H2e (potwierdzenie przewodnika §49.3b). Orkiestrator decyduje, czy zaakceptować mutację war-allin jako NIE-ZMIERZONO z notą, czy zlecić r4 (tylko mutacja war-allin).
DEPLOY/PUSH: NIE WYKONANO
