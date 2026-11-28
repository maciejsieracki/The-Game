STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDGATE-RATION-LEVER-Q1
GOAL: Ustalić, czy komunikat bramki „Zakończ turę” obiecuje obniżkę racji żywności, której gracz nie może wykonać (suwak zablokowany na 0), i naprawić minimalnie, jeśli tak.
ZMIANY/COMMIT: gra/src/main.ts (jedna linia: baza pomiaru dźwigni racji = prognoza PO reakcji automatu, l.24071); gra/tools/endgate-lever-baseline-test.cjs (nowy); dyspozycje/analizy/BRAMKA-ZYWNOSCI-DZWIGNIA-RACJI-2026-11-28.md (nowy). Commit: patrz sekcja DEPLOY/PUSH i SHA w odpowiedzi.
TESTY: tsc exit 0; logic 213/213; ai-test 297/0; early-grace-15-test 33/0; no-negative-stocks-end-turn-gate-levers 34/0; c2 44/0; ai 8/0; ai-from-turn1 27/0; ai-t2 11/0; projection 49/0; no-negative-stocks-test 25/0; end-turn-gate-projection-only 49/0; no-negative-stocks-endturn 18/1 (porażka (f) PRE-EXISTING w bazie c834d3eb8, nie z tej zmiany); tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat OK; endgate-lever-baseline (nowy) 5/0, mutacja 2/5 (czerwona), po przywróceniu 5/5. NIE WYKONANO: no-negative-stocks-ai-t2-behavior i c3-turn (wymagają bundla --dist, build wykluczony).
BLOKADY: NIE ZMIERZONO na żywo (tura 16, ziarno 11, maksimum) — wynik TAK opiera się na kodzie, teście wiązania i danych z OKNO-LASKI-15-TUR-SKUTKI-2026-11-27 (r3), nie na nowym biegu. Pre-existing czerwony test no-negative-stocks-endturn (f).
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator: Evaluator i Final Control. Zalecany bieg na żywo (grace15fx-active3-live, t16, ziarno 11, maksimum) po FC, aby potwierdzić zniknięcie „obniżki racji” z komunikatu i wartość prognozy Spichlerza. Osobno: AI (l.7959) używa tej samej logiki bazy — NIE SPRAWDZONO.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Mechanizm: dźwignia racji (`_nnsRacjeZysk`) mierzona była od prognozy PRZED reakcją automatu, a automat (`_nnsAutoSpichlerzDelta`, clamp racji do limitu Spichlerza) już zawierał ten sam zysk. Zysk liczył się dwa razy, a suwak (min = max = 0) nie mógł go wykonać.
- Wyjaśnienie dowodowe: w danych r3 po otwarciu panelu racje 1,5 → 0 i Spichlerz −30 → −18 (zmiana +12 = wartość dźwigni).
- Pre-existing red: no-negative-stocks-endturn-test (f) `canPlayerInitiateEndTurn` — osobny temat do przydzielenia.
- Nie ruszano: balansu, reguł utrzymania, pytania Q42, gra/data, WERSJE.md.
