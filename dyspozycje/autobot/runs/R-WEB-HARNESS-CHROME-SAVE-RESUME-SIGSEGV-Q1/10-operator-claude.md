STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy live, harness)
TEMAT: R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1
GOAL: Odtworzyć padnięcie Chromium przy wznowieniu ze slotu, zmierzyć krok, zdiagnozować przyczynę z dowodem, naprawić harness tak, by wznowienie działało, i porównać bieg w dwóch odcinkach z ciągłym.

ZMIANY/COMMIT:
- Baza: origin/main 79bdf0dfda5eec4f1d4e16370239cbe09c5a210a (detached).
- gra/tools/diplomacy-harder-measure-run.cjs: nowa funkcja openGameRetry (ponawia start ze slotu max 3 razy, tylko przy wznowieniu i tylko przy padnięciu „has been closed”/„crash”, przed pierwszą turą). Zmiana wejścia `ctx` na `let ctx = null` + `if (ctx) await ctx.close()`.
- dyspozycje/analizy/HARNESS-CHROME-WZNOWIENIE-2026-11-25.md: analiza, tabela prób, hipotezy, porównanie odcinkowe vs ciągłe.
- SHA commita: patrz pole sha w wyniku StructuredOutput (commit tej rundy).
- Brak zmian w gra/src, gra/data, gra-robocza/, gra-kanon/, WERSJE.md, rust-port/.

TESTY:
- Bundle: vite build poza repo (--outDir w scratchpad), exit 0, 32 s.
- Próby wznowienia (slot dipl-measure-seed4242-harder0, seed 4242, every 1):
  - przed poprawką: 4 z 5 prób padło (SIGSEGV, przed turą 3/5), 1 OK;
  - po poprawce: 3 z 3 prób OK za pierwszym razem (tury 6, 8, 10, exit 0).
- Równoważność: ciągły bieg tury 2–6 vs odcinki 1→2, 2→4, 4→6: wiersze jsonl identyczne (pole sec pominięte), sha256 05b993d3c88c1c64 w obu.
- tsc --noEmit: exit 0.
- logic-test.cjs: 213 PASS, 0 FAIL.
- ai-test.cjs: 297 passed, 0 failed.
- diplomacy-measure-resume-test.cjs (pin): 8 zielonych, 0 czerwonych. C1–C4 NIE ZMIERZONO (brak --a/--b i --run 1).
- Surowe wyniki w scratchpad (logi seg*.log, logic.log, aitest.log, pin.log).

BLOKADY:
- Przyczyna padnięcia NIE ZMIERZONA: crash w procesie Chromium (SIGSEGV, bez symboli), w openGame przed pierwszą turą. Nie odtworzono w izolacji (loadSlot w osobnym skrypcie OK, bezczynność menu 150 s OK, IndexedDB 260 KB przez restart OK). Odrzucone: OOM kontenera (MemAvailable 13,6–15,1 GB), /dev/shm, sam GPU, limit sterty V8, błąd generyczny IDB.
- Brak dmesg i symboli Chromium: nie sprawdzono.
- Ścieżka retry nie została wywołana na żywo (pierwsza próba zawsze wystarczyła w 3 ostatnich wznowieniach); jej działanie wnioskowane z kodu.
- Próbka 3 prób po poprawce jest mała; poprawa może być przypadkowa, bo poprawka nie zmienia kroku przed pierwszą próbą.
- Równoważność potwierdzona do tury 6; tury 7–10 nie porównywano z ciągłym biegiem.
- Kryterium „3 kolejne próby bez padnięcia” spełnione dla kodu z retry; kryterium „bieg w dwóch odcinkach = ciągły” spełnione do tury 6.

RUNDY: 1/5

NASTĘPNY KROK: Orkiestrator: Final Control z pytaniem, czy przyjąć łagodzenie (retry) jako wystarczające dla pomiarów #72/#96, oraz zgłoszenie do właściciela (NIE ZMIERZONO mechanizm, możliwy problem środowiska Chromium 153 w kontenerze). Opcjonalnie: ciągły bieg do tury 10 dla pełnego porównania.

UWAGI-DLA-ORKIESTRATORA:
- Stała pozycja z listy zadań: #90 (Harness: crash Chromium) może zostać zamknięta po FC, jeśli przyjęte jest łagodzenie; #72 i #96 wymagają wznowienia — zalecane uruchamianie z nowym runnerem.
- Przy kolejnym wznowieniu pamiętać o limicie Bash (590 s): jeden odcinek 2 tur z wznowieniem trwa ok. 4 min.
- Pozostałe tematy nie były ruszane.

DEPLOY/PUSH: NIE WYKONANO
