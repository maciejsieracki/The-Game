# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — Operator (runda 2/5, HAIKU 5.5)

STATUS: PASS-WITH-NOTES (etap 1 zrobiony; etapy 2–4 w toku — patrz sekcja "Etapy", wpis końcowy niżej)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: (1) zrzuty Chromium „Skąd zapasy” (sól, ceramika, 1280/1920 px); (2) dokumentacja + wikiBundle (zrobione w r1/r2 obrony); (3) pomiar wydajności 100 tur, mediana z ≥5; (4) diagnoza endTurn timeout przy turze 57; (5) stan `<details open>`.

## Baza

- Dispatch wskazywał kandydat `fc4e8dcb5` (commit dispatchu). NIE jest to baza kodu: fc4e8dcb5 nie zawiera origin/main (807ecebdd) ani de12837ba; diff względem origin/main to ok. 610 plików i 227 938 usunięć. Wybrano bazę wg DODATKU 2 (orkiestrator): **de12837ba** (= origin/main + commity r1/r2 dokumentacji). Pracę wykonano w worktree `wf_f1258023-142-1` na detached HEAD de12837ba.
- `npm ci` w `gra/` (71 pakietów, rc=0).

## Etap 1 — GOAL 4: diagnoza endTurn timeout (tura 57)

### Harness i zmiany pomiarowe (tylko w kopiach poza repo)

- Kopie `gra-on` (ledger ON, kod de12837ba) i `gra-off` (w `gra/src/game/turn-economy.ts:2871` `ledgerEnabled = false && ...` — wyłączenie księgi w kopii pomiarowej; repo nietknięte).
- Bundle vite: `dist-on` (rc=0, 27,6 s) i `dist-off` (rc=0, 20,7 s).
- Narzędzie: `gra/tools/longrun-100-turns-leak-q1-measure.cjs` (`--prepare` + `--run`, seed 4242, typ kontynenty, Standardowy).
- Dwie zmiany w kopii `measure-patched.cjs` (kopia narzędzia, nie repo):
  1. Po `world-ready` ustawiony podatek `window.__nnsMeasureDebug.setTaxSplit(60, 30, 10)`. Powód: bez tego bramka „Zakończ turę” (FALA 697/724, `no-negative-stocks.ts`) blokuje turę 1 komunikatem „Nie można zakończyć tury. Skarbiec (złoto): po zakończeniu tury zabraknie 2” — zaobserwowane w zrzucie DOM (`stuck-dump`, tura 1, 2 próby) w ON. To jest zachowanie gry, nie księgi; harness z r3 nie miał tej bramki.
  2. Zrzut widocznych elementów przy zatkanej turze (`stuck-dump`) — diagnostyka.
- Oba przebiegi uruchomione **równolegle** (2 Chromium na 4 rdzeniach). To dotyczy diagnozy (zawieszenia), NIE pomiaru czasu (etap 2 osobno, sekwencyjnie).

### Wynik

| Wersja | Tur zapisanych | Zawieszenia endTurn (ms=-1 lub „tura nie przechodzi”) | Max ms / tura | Błędy strony (`pageerror`) |
|---|---|---|---|---|
| ON (księga, de12837ba) | 100 (99 linii + start) | **0** | 21 069 ms / tura 80 | 0 |
| OFF (księga wyłączona w kopii) | 100 (99 linii + start) | **0** | 18 069 ms / tura 96 | 0 |

- Dowody surowe: `runs/<ID>/evidence/endturn100/seed4242-ON.jsonl`, `seed4242-OFF.jsonl` (zdarzenia `done`, brak `error`, brak `stuck-dump` po odblokowaniu tury 1).
- Tura 57 w obu wersjach: ON 8 398 ms, OFF 9 271 ms (liczba jednostek 290 i miast 81 w obu — przebiegi są deterministyczne i identyczne co do stanu świata).

### Wniosek (etap 1)

- **Timeout przy turze 57 NIE został odtworzony** — ani z księgą, ani bez niej, na bazie de12837ba, w 100 turach, seed 4242, z tą samą konfiguracją harnessu (plus preset podatku). Nie ma więc podstaw, by przypisać go księdze.
- Nie da się rozstrzygnąć, czy to harness, czy warunki r3: konfiguracja przebiegu r3 (seed, typ, podatek, równoległość, baza) nie jest w raporcie r3 zapisana. Zgłaszam jako dług do ustalenia: „endTurn timeout t57 — nieodtwarzalny przy de12837ba; konfiguracja źródłowa nieznana”.
- Zalecenie dla orkiestratora: temat #415 (AI-UPKEEP-Q2) i #417 blokowane diagnozą mogą ruszyć — bramka endTurn zachowuje się poprawnie; blokadą harnessu jest bramka podatku w turze 1 (do zgłoszenia jako osobny dług harnessu, nie naprawiany tutaj).

