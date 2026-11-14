# R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1 — Final Control (Sonnet)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-A2-TRADE-DIALOG-DOM-Q1
GOAL: pomiar na żywej grze (Chromium, ?civTest=1, bundle vite poza repo) okna „Umowa wymiany surowców”: węzły DOM przeżywają dodanie pozycji po obu stronach, obie strony wypełnialne przed jednym „Zaproponuj”, neutralna podpowiedź przy pustej stronie, zrzuty obejrzane.
ZMIANY/COMMIT: kandydat 2bf0daf0ef9acaafe23bc2a2a1fd181d12333328 (potomek ddc0d8dda: potwierdzone `git merge-base --is-ancestor`). Diff vs baza: wyłącznie gra/tools/live-verify-wave-689-697-a2-trade.cjs oraz runs/<ID>/** (raporty, JSON, zrzuty). Zero zmian w gra/src, gra/data, WERSJE.md, gra-robocza/, rust-port/. Allowlista zachowana.

TESTY (własne, surowe wyjście):
- `git diff --check ddc0d8dda..2bf0daf0e`: czysty.
- `npx tsc --noEmit` (gra/): exit 0.
- `vite build --outDir /tmp/fc-trade-dist` (poza repo): built in 18.05s.
- Runner live na świeżym buildzie: `RESULT checks=11 FAIL=0 pageErrors=0` (P1, P2a, P2a-rows, P4, P2b, P2b-rows, P3a, P3b, P3c, P4-give-empty, P5 — wszystkie OK).
- `node tools/trade-dialog-no-rerender-test.cjs`: 19/19 PASS.
- Zacommitowane JSON: pre = 11 checks / 0 FAIL / 0 pageErrors; mut (kopia z cofniętą poprawką) = 11 checks / FAIL tylko P2a i P2b / 0 pageErrors. Dowód mutacyjny rozróżnia wersję poprawną od cofniętej. Mutanta nie odtwarzałem samodzielnie (opieram się na zacommitowanym JSON i raporcie Obrony).
- Zrzut 04 obejrzany samodzielnie: audiencja, „My oferujemy: 20 Drewno”, „Oni oferują: 20 Glina” (różne surowce, więc P3c realnie rozróżnia strony); „Przyjmij” wyłączony z powodu nieuczciwej oferty, zgodnie z notą Operatora.
- Bramki referencyjne baza vs kandydat: kandydat nie zmienia gra/src ani gra/data, więc wyniki bramek gry są identyczne z bazą z konstrukcji; osobno ich nie uruchamiałem (NIE_ZMIERZONO; diff dotyczy wyłącznie narzędzia i artefaktów).

## Werdykt per zarzut
1. P3c słaby dowód (to samo Drewno po obu stronach) — ODDAL: Obrona zmieniła na różne surowce (Drewno/Glina), potwierdzone w zrzucie 04 i w moim przebiegu.
2. P4 tylko jedna strona, brak mutacji P3/P4 — ODDAL: dodany P4-give-empty (PASS u mnie). Mutacja P3/P4 poza zakresem (dispatch: mutacja „jeśli możliwa”; poprawka FALI 692 dotyczy węzłów, czyli P2).
3. P5 na sztywno, ścieżki bezwzględne w JSON — ODDAL: P5 sprawdza istnienie i rozmiar plików (bytes w JSON); grep po JSON: 0 trafień ścieżek bezwzględnych/wf_/scratchpad.
4. Brak migotania tylko jako identyczność węzłów — ODDAL: dispatch definiuje to kryterium jako identyczność węzła `===`; wizualna analiza klatek pozostaje NIE_ZMIERZONO (jawnie zgłoszone).
5. Brak 00-dispatch.md na origin/main, baza 75e238e52 vs ddc0d8dda — ODDAL: kwestia procesowa orkiestratora, nie kodu (zob. UWAGI).
6. Martwy itemsStr / submitDisabledWhenOnlyGive=false — ODDAL: itemsStr usunięty przez Obronę; aktywny przycisk przy jednej stronie to zamierzony dar jednostronny.
Brak NAPRAW, więc brak FAIL.

BLOKADY: brak.
RUNDY: FC r1 (w historii: Operator r1, Obrona r2); 1/5.
NASTĘPNY KROK: integracja orkiestratora (integration_sha = 2bf0daf0ef9acaafe23bc2a2a1fd181d12333328, ewentualnie wraz z tym raportem); tylko narzędzie i dowody, bez zmian w grze, więc bez deployu gry.

## UWAGI-DLA-ORKIESTRATORA
- Dopisać 00-dispatch.md tematu do main (obecnie tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0).
- Obserwacja Operatora: oferta „20 Drewno za 20 Glina” jest wysyłana mimo ostrzeżenia o nieuczciwej ofercie (Przyjmij wyłączony); decyzja produktowa właściciela, poza tym tematem.
- Wizualne „brak migotania” (analiza klatek) pozostaje NIE_ZMIERZONO.

DEPLOY/PUSH: NIE WYKONANO
